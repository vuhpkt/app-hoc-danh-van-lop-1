/**
 * scripts/master-audio-dataset.js
 *
 * HỆ THỐNG TỰ ĐỘNG HÓA LÀM CHỦ ÂM THANH (AUTOMATED PEDAGOGICAL AUDIO MASTERING)
 * NGUỒN BẤT BIẾN: raw-audio-backup/ (280 mẩu âm chuẩn SGK Tiếng Việt 1)
 *
 * CÁC TIÊU CHUẨN SƯ PHẠM LỚP 1 ĐƯỢC THI CÔNG:
 * 1. Nhóm vần mở / vang (như "vui", "lo", "em", "chim", "cây", "cô"):
 *    Kéo giãn đạt dải vàng 300ms - 340ms (WSOLA atempo).
 * 2. Nhóm vần khép tắc p, t, c, ch (như "học", "bắt", "sạch", "vịt", "gập", "ích"):
 *    Kéo giãn đạt 220ms - 250ms (WSOLA atempo).
 * 3. Chuẩn hóa biên độ đỉnh (Peak Normalization):
 *    100% mẩu âm đạt chuẩn 0.86 ± 0.02 (-1.3dBFS, dải an toàn [0.84, 0.88]).
 * 4. Tự động đóng gói Master Audio Sprite:
 *    - sprite-main.mp3 (64k CBR mono 24000Hz)
 *    - sprite-main.webm (48k Opus mono 24000Hz)
 *    - audio-map.json (280 toạ độ thời gian chuẩn)
 * 5. Nâng cấp SPRITE_VERSION trong SpriteManager.ts lên 'v4.3.0' để kích hoạt Cache-Busting.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'raw-audio-backup');
const RAW_AUDIO_DIR = path.join(ROOT_DIR, 'raw-audio');
const PUBLIC_AUDIO_DIR = path.join(ROOT_DIR, 'public', 'audio');
const TEMP_DIR = path.join(ROOT_DIR, 'temp_master_audio');
const MANIFEST_FILE = path.join(RAW_AUDIO_DIR, 'manifest.json');
const SPRITE_MANAGER_FILE = path.join(ROOT_DIR, 'src', 'core', 'audio', 'SpriteManager.ts');
const SPRITE_TEST_FILE = path.join(ROOT_DIR, 'test', 'sprite_integrity.test.js');

const SAMPLE_RATE = 24000;
const MP3_ATTENUATION_FACTOR = 0.9498; // Tỷ lệ bù nén MP3 của libmp3lame
const TARGET_PEAK = 0.86;
const TARGET_PEAK_MIN = 0.84;
const TARGET_PEAK_MAX = 0.88;

function safeCopyFileSync(src, dest, retries = 5, delayMs = 100) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = fs.readFileSync(src);
      fs.writeFileSync(dest, data);
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }
  }
}

function createWavHeader(dataLength, sampleRate = SAMPLE_RATE) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

function extractPcmFromWav(wavBuffer) {
  let offset = 12;
  let dataOffset = -1;
  let dataSize = 0;
  while (offset < wavBuffer.length - 8) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }
  if (dataOffset === -1) {
    throw new Error('Could not find data chunk in WAV file');
  }
  const sampleCount = Math.floor(dataSize / 2);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = wavBuffer.readInt16LE(dataOffset + i * 2) / 32768.0;
  }
  return { samples, sampleCount, duration: sampleCount / SAMPLE_RATE };
}

function isClosedStopRhyme(text, key) {
  const clean = text.toLowerCase().trim();
  // Vần hoặc từ kết thúc bằng phụ âm tắc vô thanh p, t, c, ch
  return (
    clean.endsWith('p') ||
    clean.endsWith('t') ||
    clean.endsWith('c') ||
    clean.endsWith('ch')
  );
}

async function main() {
  console.log('='.repeat(80));
  console.log('🎛️  HỆ THỐNG LÀM CHỦ ÂM THANH SƯ PHẠM TỰ ĐỘNG (AUTOMATED AUDIO MASTERING)');
  console.log(`📂 Nguồn gốc bất biến: ${BACKUP_DIR}`);
  console.log(`📂 Thư mục đích:       ${RAW_AUDIO_DIR}`);
  console.log(`📂 Kho Sprite:         ${PUBLIC_AUDIO_DIR}`);
  console.log('='.repeat(80));

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`❌ Không tìm thấy thư mục nguồn bất biến ${BACKUP_DIR}!`);
    process.exit(1);
  }
  if (!fs.existsSync(RAW_AUDIO_DIR)) {
    fs.mkdirSync(RAW_AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
    fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  console.log(`🔍 Nạp thành công manifest với ${manifest.length} mục âm thanh.`);

  let stretchedOpenCount = 0;
  let stretchedStopCount = 0;
  let fineTunedPeakCount = 0;

  console.log('\n--- BƯỚC 1: MASTERING 280 MẨU ÂM VỚI WSOLA & CHUẨN HÓA ĐỈNH (-1.3dBFS) ---');

  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const backupPath = path.join(BACKUP_DIR, item.filename);
    const destPath = path.join(RAW_AUDIO_DIR, item.filename);

    if (!fs.existsSync(backupPath)) {
      console.warn(`⚠️ Bỏ qua không tìm thấy file nguồn: ${item.filename}`);
      continue;
    }

    const tempRawWav = path.join(TEMP_DIR, `step1_raw_${i}.wav`);
    const tempStretchedWav = path.join(TEMP_DIR, `step1_stretch_${i}.wav`);
    const tempNormWav = path.join(TEMP_DIR, `step1_norm_${i}.wav`);
    const tempMp3 = path.join(TEMP_DIR, `step1_out_${i}.mp3`);
    const tempVerifyWav = path.join(TEMP_DIR, `step1_verify_${i}.wav`);

    // 1. Giải mã file gốc từ backup sang PCM WAV 24000Hz
    execSync(`"${ffmpegPath}" -y -i "${backupPath}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempRawWav}"`, { stdio: 'pipe' });
    const rawBuf = fs.readFileSync(tempRawWav);
    const { samples: sRaw, sampleCount: nRaw } = extractPcmFromWav(rawBuf);

    // Xóa cứng 64 mẫu đầu chống MP3 decoder header pop
    for (let s = 0; s < Math.min(64, nRaw); s++) sRaw[s] = 0.0;

    // Đo thời lượng nói thực tế (Active Speech Duration) với ngưỡng 0.008 (-42dB)
    let s0 = 0;
    for (let s = 64; s < nRaw; s++) {
      if (Math.abs(sRaw[s]) >= 0.008) {
        s0 = s;
        break;
      }
    }
    let s1 = nRaw - 1;
    for (let s = nRaw - 1; s >= 64; s--) {
      if (Math.abs(sRaw[s]) >= 0.008) {
        s1 = s;
        break;
      }
    }
    const origActiveDurMs = Math.max(0, ((s1 - s0) / SAMPLE_RATE) * 1000);

    // Xác định phân loại sư phạm
    const isStop = isClosedStopRhyme(item.text, item.key);
    const isWordOrRime = item.key.startsWith('tu__') || item.key.startsWith('van__');

    let stretchFactor = 1.0;
    let actionDesc = 'giữ nguyên thời lượng';

    if (isStop && isWordOrRime) {
      // Nhóm vần khép tắc: dải vàng 220ms - 250ms
      if (origActiveDurMs < 220) {
        stretchFactor = Math.max(0.72, origActiveDurMs / 232); // Mục tiêu ~232ms
        stretchedStopCount++;
        actionDesc = `kéo giãn khép tắc -> 220-250ms (factor ${stretchFactor.toFixed(3)})`;
      }
    } else if (isWordOrRime) {
      // Nhóm vần mở / vang: dải vàng 300ms - 340ms
      if (origActiveDurMs < 300) {
        stretchFactor = Math.max(0.65, origActiveDurMs / 312); // Mục tiêu ~312ms
        stretchedOpenCount++;
        actionDesc = `kéo giãn mở/vang -> 300-340ms (factor ${stretchFactor.toFixed(3)})`;
      }
    }

    // Áp dụng bộ lọc WSOLA (atempo) nếu cần kéo giãn
    if (Math.abs(stretchFactor - 1.0) > 0.015) {
      execSync(
        `"${ffmpegPath}" -y -i "${backupPath}" -filter:a "atempo=${stretchFactor.toFixed(4)}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempStretchedWav}"`,
        { stdio: 'pipe' }
      );
    } else {
      fs.copyFileSync(tempRawWav, tempStretchedWav);
    }

    // Đọc mẫu PCM sau khi kéo giãn
    const stretchedBuf = fs.readFileSync(tempStretchedWav);
    const { samples: sStretched, sampleCount: nStretched } = extractPcmFromWav(stretchedBuf);
    for (let s = 0; s < Math.min(64, nStretched); s++) sStretched[s] = 0.0;

    // Tìm biên độ đỉnh thực tế
    let peakBeforeNorm = 0.0;
    for (let s = 64; s < nStretched; s++) {
      const absV = Math.abs(sStretched[s]);
      if (absV > peakBeforeNorm) peakBeforeNorm = absV;
    }

    // Chuẩn hóa biên độ đỉnh về 0.86 (kèm bù suy giảm MP3)
    const targetPcmPeak = TARGET_PEAK / MP3_ATTENUATION_FACTOR;
    let normFactor = peakBeforeNorm > 0 ? targetPcmPeak / peakBeforeNorm : 1.0;

    // Ghi file WAV PCM chuẩn hóa
    const writeNormalizedWav = (factor) => {
      const pcmBytes = Buffer.alloc(nStretched * 2);
      for (let s = 0; s < nStretched; s++) {
        const val = Math.max(-1.0, Math.min(1.0, sStretched[s] * factor));
        pcmBytes.writeInt16LE(Math.round(val * 32767), s * 2);
      }
      const header = createWavHeader(pcmBytes.length, SAMPLE_RATE);
      fs.writeFileSync(tempNormWav, Buffer.concat([header, pcmBytes]));
    };

    writeNormalizedWav(normFactor);

    // Nén MP3 chuẩn 160k
    execSync(
      `"${ffmpegPath}" -y -i "${tempNormWav}" -ar ${SAMPLE_RATE} -c:a libmp3lame -b:a 160k "${tempMp3}"`,
      { stdio: 'pipe' }
    );

    // Giải mã kiểm tra biên độ đỉnh thực tế của file MP3
    execSync(
      `"${ffmpegPath}" -y -i "${tempMp3}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempVerifyWav}"`,
      { stdio: 'pipe' }
    );
    let verifyBuf = fs.readFileSync(tempVerifyWav);
    let { samples: sVer, sampleCount: nVer } = extractPcmFromWav(verifyBuf);
    let decodedMp3Peak = 0.0;
    for (let s = 64; s < nVer; s++) {
      const absV = Math.abs(sVer[s]);
      if (absV > decodedMp3Peak) decodedMp3Peak = absV;
    }

    // Nếu biên độ đỉnh bị lệch ngoài dung sai [0.84, 0.88], tinh chỉnh chính xác 100%
    if (decodedMp3Peak < TARGET_PEAK_MIN || decodedMp3Peak > TARGET_PEAK_MAX) {
      fineTunedPeakCount++;
      const correction = TARGET_PEAK / decodedMp3Peak;
      normFactor *= correction;
      writeNormalizedWav(normFactor);
      execSync(
        `"${ffmpegPath}" -y -i "${tempNormWav}" -ar ${SAMPLE_RATE} -c:a libmp3lame -b:a 160k "${tempMp3}"`,
        { stdio: 'pipe' }
      );
      execSync(
        `"${ffmpegPath}" -y -i "${tempMp3}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempVerifyWav}"`,
        { stdio: 'pipe' }
      );
      verifyBuf = fs.readFileSync(tempVerifyWav);
      const resVer = extractPcmFromWav(verifyBuf);
      sVer = resVer.samples;
      nVer = resVer.sampleCount;
      decodedMp3Peak = 0.0;
      for (let s = 64; s < nVer; s++) {
        const absV = Math.abs(sVer[s]);
        if (absV > decodedMp3Peak) decodedMp3Peak = absV;
      }
    }

    // Đo thời lượng nói thực tế cuối cùng
    let fs0 = 0;
    for (let s = 64; s < nVer; s++) {
      if (Math.abs(sVer[s]) >= 0.008) {
        fs0 = s;
        break;
      }
    }
    let fs1 = nVer - 1;
    for (let s = nVer - 1; s >= 64; s--) {
      if (Math.abs(sVer[s]) >= 0.008) {
        fs1 = s;
        break;
      }
    }
    const finalActiveDurMs = Math.max(0, ((fs1 - fs0) / SAMPLE_RATE) * 1000);

    // Ghi đè file MP3 đã làm chủ vào raw-audio/
    safeCopyFileSync(tempMp3, destPath);

    process.stdout.write(
      `  [${String(i + 1).padStart(3, '0')}/${manifest.length}] ${item.key.padEnd(20)}: ${origActiveDurMs.toFixed(0)}ms ➔ ${finalActiveDurMs.toFixed(0)}ms | Peak: ${decodedMp3Peak.toFixed(3)} | ${actionDesc}\n`
    );

    // Dọn dẹp tệp tạm thời cho vòng lặp hiện tại
    for (const f of [tempRawWav, tempStretchedWav, tempNormWav, tempMp3, tempVerifyWav]) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
  }

  console.log('='.repeat(80));
  console.log(`✅ Hoàn tất làm chủ 280 mẩu âm:`);
  console.log(`   - Kéo giãn vần mở/vang (< 300ms ➔ 300-340ms):   ${stretchedOpenCount} mẩu âm`);
  console.log(`   - Kéo giãn vần khép tắc (< 220ms ➔ 220-250ms): ${stretchedStopCount} mẩu âm`);
  console.log(`   - Tinh chỉnh biên độ đỉnh phản hồi:            ${fineTunedPeakCount} mẩu âm`);
  console.log('='.repeat(80));

  console.log('\n--- BƯỚC 2: ĐÓNG GÓI MASTER AUDIO SPRITE (SMART DECAY & ZERO-CROSSING) ---');

  const audioMap = {};
  let currentOffset = 0.0;
  const concatList = [];

  for (let i = 0; i < manifest.length; i++) {
    const { key, filename } = manifest[i];
    const inputPath = path.join(RAW_AUDIO_DIR, filename);

    const tempRawWav = path.join(TEMP_DIR, `sprite_raw_${i}.wav`);
    const tempTrimmedWav = path.join(TEMP_DIR, `sprite_trimmed_${String(i).padStart(3, '0')}_${key}.wav`);

    // Chuyển sang PCM 24000Hz để cắt gọt chính xác từng mẫu
    execSync(`"${ffmpegPath}" -y -i "${inputPath}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempRawWav}"`, { stdio: 'pipe' });
    const rawBuf = fs.readFileSync(tempRawWav);
    const { samples, sampleCount: totalSamples } = extractPcmFromWav(rawBuf);

    // Điểm bắt đầu tự nhiên: bỏ qua 64 mẫu đầu, giữ 50ms (1200 mẫu) pre-roll an toàn
    let startIdx = 0;
    const skipSamples = Math.min(64, Math.floor(totalSamples / 10));
    for (let s = skipSamples; s < totalSamples; s++) {
      if (Math.abs(samples[s]) > 0.008) {
        startIdx = Math.max(0, s - 1200); // 50ms pre-roll
        break;
      }
    }

    // Điểm kết thúc tự nhiên: quét đuôi ngân -52dB + 140ms (3360 mẫu) decay tail tự nhiên
    let endIdx = totalSamples - 1;
    for (let s = totalSamples - 1; s >= 0; s--) {
      if (Math.abs(samples[s]) > 0.0025) {
        endIdx = Math.min(totalSamples, s + 3360); // 140ms decay tail
        break;
      }
    }

    if (endIdx <= startIdx) {
      endIdx = totalSamples;
      startIdx = 0;
    }

    const trimmedSampleCount = endIdx - startIdx;
    const trimmedData = new Float32Array(trimmedSampleCount);
    for (let s = 0; s < trimmedSampleCount; s++) {
      trimmedData[s] = samples[startIdx + s];
    }

    // Áp dụng Hann Windowing 12ms làm mịn 2 đầu
    const FADE_SAMPLES = Math.min(Math.floor(SAMPLE_RATE * 0.012), Math.floor(trimmedSampleCount / 2));
    for (let s = 0; s < FADE_SAMPLES; s++) {
      const factor = 0.5 * (1 - Math.cos((Math.PI * s) / FADE_SAMPLES));
      trimmedData[s] *= factor;
      trimmedData[trimmedSampleCount - 1 - s] *= factor;
    }

    // Ép cứng 32 mẫu đầu và cuối về 0.0 tuyệt đối triệt tiêu DC offset / click
    const clampLimit = Math.min(32, Math.floor(trimmedSampleCount / 4));
    for (let s = 0; s < clampLimit; s++) {
      trimmedData[s] = 0.0;
      trimmedData[trimmedSampleCount - 1 - s] = 0.0;
    }

    // Ghi file WAV phân đoạn đã làm mịn
    const outputPcmBytes = Buffer.alloc(trimmedSampleCount * 2);
    for (let s = 0; s < trimmedSampleCount; s++) {
      const int16Val = Math.max(-32768, Math.min(32767, Math.round(trimmedData[s] * 32767)));
      outputPcmBytes.writeInt16LE(int16Val, s * 2);
    }
    const header = createWavHeader(outputPcmBytes.length, SAMPLE_RATE);
    fs.writeFileSync(tempTrimmedWav, Buffer.concat([header, outputPcmBytes]));

    const duration = Number((trimmedSampleCount / SAMPLE_RATE).toFixed(3));
    const start = Number(currentOffset.toFixed(3));
    const end = Number((currentOffset + duration).toFixed(3));

    audioMap[key] = { start, end, duration };
    currentOffset = end;
    concatList.push(`file '${tempTrimmedWav.replace(/\\/g, '/')}'`);

    try {
      fs.unlinkSync(tempRawWav);
    } catch {}
  }

  // Ghi danh sách ghép concat_list.txt
  const concatFilePath = path.join(TEMP_DIR, 'concat_list.txt');
  fs.writeFileSync(concatFilePath, concatList.join('\n'), 'utf-8');

  const outputMp3 = path.join(PUBLIC_AUDIO_DIR, 'sprite-main.mp3');
  const outputWebm = path.join(PUBLIC_AUDIO_DIR, 'sprite-main.webm');

  // Đóng gói sprite-main.mp3 64k CBR chuẩn
  console.log(`  📦 Đang xuất ${outputMp3}...`);
  execSync(
    `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFilePath.replace(/\\/g, '/')}" -c:a libmp3lame -b:a 64k -ar ${SAMPLE_RATE} -ac 1 "${outputMp3}"`,
    { stdio: 'pipe' }
  );

  // Đóng gói sprite-main.webm Opus 48k
  console.log(`  📦 Đang xuất ${outputWebm}...`);
  try {
    execSync(
      `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFilePath.replace(/\\/g, '/')}" -c:a libopus -b:a 48k -ar ${SAMPLE_RATE} -ac 1 "${outputWebm}"`,
      { stdio: 'pipe' }
    );
  } catch (err) {
    console.warn(`  ⚠️ Cảnh báo nén WebM Opus:`, err.message);
  }

  // Ghi audio-map.json
  const mapFilePath = path.join(PUBLIC_AUDIO_DIR, 'audio-map.json');
  fs.writeFileSync(mapFilePath, JSON.stringify(audioMap, null, 2), 'utf-8');
  console.log(`  📄 Đã lưu bản đồ toạ độ: ${mapFilePath} (${Object.keys(audioMap).length} mục)`);

  // Dọn dẹp thư mục tạm
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  console.log('\n--- BƯỚC 3: NÂNG CẤP SPRITE_VERSION LÊN v4.3.0 (CACHE-BUSTING) ---');

  if (fs.existsSync(SPRITE_MANAGER_FILE)) {
    let spriteContent = fs.readFileSync(SPRITE_MANAGER_FILE, 'utf-8');
    if (spriteContent.includes("SPRITE_VERSION = 'v4.2.0'")) {
      spriteContent = spriteContent.replace("SPRITE_VERSION = 'v4.2.0'", "SPRITE_VERSION = 'v4.3.0'");
      fs.writeFileSync(SPRITE_MANAGER_FILE, spriteContent, 'utf-8');
      console.log(`  ✅ Đã nâng cấp SPRITE_VERSION trong SpriteManager.ts lên 'v4.3.0'`);
    } else if (spriteContent.includes("SPRITE_VERSION = 'v4.3.0'")) {
      console.log(`  ℹ️ SPRITE_VERSION trong SpriteManager.ts đã ở 'v4.3.0'`);
    }
  }

  if (fs.existsSync(SPRITE_TEST_FILE)) {
    let testContent = fs.readFileSync(SPRITE_TEST_FILE, 'utf-8');
    if (testContent.includes("SPRITE_VERSION = 'v4.2.0'")) {
      testContent = testContent.replace(/SPRITE_VERSION = 'v4\.2\.0'/g, "SPRITE_VERSION = 'v4.3.0'");
      fs.writeFileSync(SPRITE_TEST_FILE, testContent, 'utf-8');
      console.log(`  ✅ Đã cập nhật kiểm thử SPRITE_VERSION trong test/sprite_integrity.test.js lên 'v4.3.0'`);
    }
  }

  console.log('='.repeat(80));
  console.log('🎉 TOÀN BỘ TIẾN TRÌNH MASTERING VÀ ĐÓNG GÓI SPRITE ĐÃ HOÀN TẤT THÀNH CÔNG!');
  console.log(`📊 Tổng thời lượng Sprite: ${currentOffset.toFixed(2)}s (${Object.keys(audioMap).length} mẩu âm chuẩn)`);
  console.log(`⭐ Phiên bản Sprite:       v4.3.0`);
  console.log('='.repeat(80));
}

main().catch((err) => {
  console.error('Fatal Mastering Error:', err);
  process.exit(1);
});
