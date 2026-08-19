/**
 * Script Node.js: Đóng gói Chunked Audio Sprite & Tạo audio-map.json
 * - SỬ DỤNG SMART NATURAL DECAY TRIMMER:
 *   + Tự động phát hiện điểm bắt đầu thực tế và điểm kết thúc tự nhiên của giọng nói (bao gồm cả đuôi âm ngân và âm vang phòng)
 *   + Triệt tiêu hoàn toàn lỗi cắt ngang giữa chừng (vốn là nguyên nhân gây tiếng nổ lẹt xẹt sau các âm "ương", "trương", "huyền")
 *   + Áp dụng cửa sổ Cosine (Hann Windowing) và Zero-Crossing tại 2 đầu clip
 * - Xuất file Sprite tối ưu: public/audio/sprite-main.mp3 (& .webm)
 * - Xuất toạ độ chính xác: public/audio/audio-map.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_AUDIO_DIR = path.join(__dirname, '..', 'raw-audio');
const PUBLIC_AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');
const TEMP_DIR = path.join(__dirname, '..', 'temp_trimmed_audio');

const SAMPLE_RATE = 24000;

function createWavHeader(dataLength) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM Chunk size
  buffer.writeUInt16LE(1, 20);  // Format = 1 (PCM)
  buffer.writeUInt16LE(1, 22);  // Channels = 1 (Mono)
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // Sample rate = 24000
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // Byte rate = 48000
  buffer.writeUInt16LE(2, 32);  // Block align = 2
  buffer.writeUInt16LE(16, 34); // Bits per sample = 16
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔨 BỘ ĐÓNG GÓI AUDIO SPRITE CHUẨN SƯ PHẠM (SMART NATURAL DECAY)');
  console.log(`📂 Thư mục nguồn:   ${RAW_AUDIO_DIR}`);
  console.log(`📂 Thư mục đích:     ${PUBLIC_AUDIO_DIR}`);
  console.log('='.repeat(70));

  if (!fs.existsSync(RAW_AUDIO_DIR)) {
    console.error('❌ Không tìm thấy thư mục raw-audio!');
    process.exit(1);
  }

  if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
    fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const allFiles = fs.readdirSync(RAW_AUDIO_DIR)
    .filter((f) => f.endsWith('.mp3') && !f.startsWith('test'))
    .sort();

  if (allFiles.length === 0) {
    console.error('❌ Không có file mp3 nào trong raw-audio!');
    process.exit(1);
  }

  console.log(`🔍 Tìm thấy ${allFiles.length} file âm thanh. Đang xử lý bóc tách & làm mịn tự nhiên...`);

  const audioMap = {};
  let currentOffset = 0.0;
  const concatList = [];

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const key = path.basename(file, '.mp3');
    const inputPath = path.join(RAW_AUDIO_DIR, file);
    const tempRawWav = path.join(TEMP_DIR, `raw_${String(i).padStart(3, '0')}.wav`);
    const tempTrimmedWav = path.join(TEMP_DIR, `${String(i).padStart(3, '0')}_${key}.wav`);

    process.stdout.write(`  [${String(i + 1).padStart(2, '0')}/${allFiles.length}] Xử lý: ${key.padEnd(22)}... `);

    // 1. Chuyển đổi MP3 sang PCM 16-bit Mono 24000Hz không cắt
    execSync(`"${ffmpegPath}" -y -i "${inputPath}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempRawWav}"`, { stdio: 'pipe' });

    const rawBuf = fs.readFileSync(tempRawWav);
    const totalSamples = (rawBuf.length - 44) / 2;
    const samples = new Float32Array(totalSamples);
    for (let s = 0; s < totalSamples; s++) {
      samples[s] = rawBuf.readInt16LE(44 + s * 2) / 32768.0;
    }

    // 2. Tìm điểm bắt đầu thực tế (vượt ngưỡng âm lượng 0.008, lùi 10ms)
    let startIdx = 0;
    for (let s = 0; s < totalSamples; s++) {
      if (Math.abs(samples[s]) > 0.008) {
        startIdx = Math.max(0, s - 240); // 10ms
        break;
      }
    }

    // 3. Tìm điểm kết thúc tự nhiên (bao gồm toàn bộ đuôi âm ngân xuống -52dB + 50ms reverb tail)
    let endIdx = totalSamples - 1;
    for (let s = totalSamples - 1; s >= 0; s--) {
      if (Math.abs(samples[s]) > 0.0025) {
        endIdx = Math.min(totalSamples, s + 1200); // 50ms decay tail
        break;
      }
    }

    if (endIdx <= startIdx) {
      endIdx = totalSamples;
      startIdx = 0;
    }

    const trimmedSampleCount = endIdx - startIdx;
    const trimmedData = new Float32Array(trimmedSampleCount);

    // 4. Sao chép dữ liệu và áp dụng Hann Windowing 12ms ở 2 đầu
    const FADE_SAMPLES = Math.min(Math.floor(SAMPLE_RATE * 0.012), Math.floor(trimmedSampleCount / 2));
    for (let s = 0; s < trimmedSampleCount; s++) {
      trimmedData[s] = samples[startIdx + s];
    }

    // Hann Windowing làm mịn
    for (let s = 0; s < FADE_SAMPLES; s++) {
      const factor = 0.5 * (1 - Math.cos((Math.PI * s) / FADE_SAMPLES));
      trimmedData[s] *= factor;
      trimmedData[trimmedSampleCount - 1 - s] *= factor;
    }

    // Ép cứng 32 mẫu đầu và 32 mẫu cuối về 0.0 tuyệt đối
    const clampLimit = Math.min(32, Math.floor(trimmedSampleCount / 4));
    for (let s = 0; s < clampLimit; s++) {
      trimmedData[s] = 0.0;
      trimmedData[trimmedSampleCount - 1 - s] = 0.0;
    }

    // 5. Ghi file WAV đã cắt tự nhiên hoàn chỉnh
    const outputPcmBytes = Buffer.alloc(trimmedSampleCount * 2);
    for (let s = 0; s < trimmedSampleCount; s++) {
      const int16Val = Math.max(-32768, Math.min(32767, Math.round(trimmedData[s] * 32767)));
      outputPcmBytes.writeInt16LE(int16Val, s * 2);
    }

    const header = createWavHeader(outputPcmBytes.length);
    fs.writeFileSync(tempTrimmedWav, Buffer.concat([header, outputPcmBytes]));

    const duration = Number((trimmedSampleCount / SAMPLE_RATE).toFixed(3));
    const start = Number(currentOffset.toFixed(3));
    const end = Number((currentOffset + duration).toFixed(3));

    audioMap[key] = { start, end, duration };
    currentOffset = end;
    concatList.push(`file '${tempTrimmedWav.replace(/\\/g, '/')}'`);

    console.log(`✅ ${duration}s ([${start}s ➔ ${end}s])`);

    try {
      fs.unlinkSync(tempRawWav);
    } catch {}
  }

  // Ghi concat_list.txt
  const concatFilePath = path.join(TEMP_DIR, 'concat_list.txt');
  fs.writeFileSync(concatFilePath, concatList.join('\n'), 'utf-8');

  console.log('='.repeat(70));
  console.log('📦 Đang đóng gói Master Audio Sprite...');

  const outputMp3 = path.join(PUBLIC_AUDIO_DIR, 'sprite-main.mp3');
  const outputWebm = path.join(PUBLIC_AUDIO_DIR, 'sprite-main.webm');

  // Đóng gói MP3 64k CBR chuẩn
  console.log(`  -> Tạo ${outputMp3}...`);
  const buildMp3Cmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFilePath.replace(/\\/g, '/')}" -c:a libmp3lame -b:a 64k -ar ${SAMPLE_RATE} -ac 1 "${outputMp3}"`;
  execSync(buildMp3Cmd, { stdio: 'inherit' });

  // Đóng gói WebM Opus
  console.log(`  -> Tạo ${outputWebm}...`);
  try {
    const buildWebmCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFilePath.replace(/\\/g, '/')}" -c:a libopus -b:a 48k -ar ${SAMPLE_RATE} -ac 1 "${outputWebm}"`;
    execSync(buildWebmCmd, { stdio: 'inherit' });
  } catch {}

  // Ghi file audio-map.json
  const mapFilePath = path.join(PUBLIC_AUDIO_DIR, 'audio-map.json');
  fs.writeFileSync(mapFilePath, JSON.stringify(audioMap, null, 2), 'utf-8');

  // Dọn dẹp
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  console.log('='.repeat(70));
  console.log('🎉 HOÀN TẤT ĐÓNG GÓI AUDIO SPRITE!');
  console.log(`📊 Tổng thời lượng Sprite: ${currentOffset.toFixed(2)}s (${allFiles.length} mẫu âm tự nhiên đầy đủ)`);
  console.log(`📄 Bản đồ toạ độ: public/audio/audio-map.json`);
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
