/**
 * scripts/slice-rare-rimes.js
 * 
 * Bóc tách âm vị tự nhiên (Acoustic Trimming) cho các âm/vần khó:
 * - Trích xuất vần "uyu" từ tiếng thanh ngang "khuyu" (raw-audio/tu__khuyu_ngang.mp3)
 * - Loại bỏ phụ âm xát "kh" (~180ms đầu) và khoảng lặng thừa đuôi
 * - Áp dụng Hann Windowing 12ms & Hard Zero 64 samples
 * - Xuất file raw-audio/van__uyu.mp3 chuẩn 100% giọng HoaiMy
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const RAW_DIR = path.join(rootDir, 'raw-audio');
const SAMPLE_RATE = 24000;

function createWavHeader(dataLength) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

export function sliceUyuRime() {
  const sourceMp3 = path.join(RAW_DIR, 'tu__khuyu_ngang.mp3');
  const targetMp3 = path.join(RAW_DIR, 'van__uyu.mp3');
  const tempWav = path.join(__dirname, 'temp_khuyu_input.wav');
  const tempSlicedWav = path.join(__dirname, 'temp_uyu_sliced.wav');

  if (!fs.existsSync(sourceMp3)) {
    throw new Error(`Source audio file not found: ${sourceMp3}`);
  }

  console.log('='.repeat(70));
  console.log('✂️  ACOUSTIC SLICER: Trích xuất vần "uyu" từ tiếng "khuyu"');
  console.log(`📂 Nguồn: ${sourceMp3}`);
  console.log(`🎯 Đích:  ${targetMp3}`);
  console.log('='.repeat(70));

  // 1. Chuyển đổi file nguồn MP3 sang PCM 16-bit 24000Hz Mono
  execSync(`"${ffmpegPath}" -y -i "${sourceMp3}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempWav}"`, { stdio: 'pipe' });

  const buf = fs.readFileSync(tempWav);
  const totalSamples = (buf.length - 44) / 2;
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    samples[i] = buf.readInt16LE(44 + i * 2) / 32768.0;
  }

  // 2. Tìm điểm bắt đầu rung thanh của nguyên âm u (Voicing Onset)
  // Bỏ qua các click đầu (nếu có trong 50ms đầu) và quét tìm vùng có năng lượng cao + ZCR thấp
  const frameSize = Math.floor(SAMPLE_RATE * 0.010); // 10ms frame = 240 samples
  let onsetSample = -1;

  // Bắt đầu quét từ 100ms (sau phụ âm đầu hoặc click)
  const minScanIndex = Math.floor(SAMPLE_RATE * 0.100);
  const maxScanIndex = Math.floor(SAMPLE_RATE * 0.350);

  for (let i = minScanIndex; i < maxScanIndex; i += frameSize) {
    let sumSq = 0;
    let zc = 0;
    for (let j = 0; j < frameSize && (i + j) < totalSamples; j++) {
      const s = samples[i + j];
      sumSq += s * s;
      if (j > 0) {
        const prev = samples[i + j - 1];
        if ((prev >= 0 && s < 0) || (prev < 0 && s >= 0)) zc++;
      }
    }
    const rms = Math.sqrt(sumSq / frameSize);
    const zcr = zc / (frameSize - 1);

    // Vùng nguyên âm uyu có RMS mạnh (> 0.08) và ZCR rất thấp (< 0.10)
    if (rms > 0.08 && zcr < 0.10) {
      onsetSample = i;
      break;
    }
  }

  if (onsetSample === -1) {
    console.warn('⚠️ Không tìm thấy Voicing Onset tự động, sử dụng mốc mặc định 185ms');
    onsetSample = Math.floor(SAMPLE_RATE * 0.185);
  } else {
    // Lùi lại ~15ms để lấy trọn vẹn điểm bắt đầu nở âm thanh
    onsetSample = Math.max(0, onsetSample - Math.floor(SAMPLE_RATE * 0.015));
  }

  // Tìm điểm zero-crossing gần nhất ngay trước onsetSample
  while (onsetSample > 0 && Math.abs(samples[onsetSample]) > 0.005) {
    onsetSample--;
  }

  // 3. Tìm điểm kết thúc ngân tự nhiên (Natural Decay Offset)
  let offsetSample = totalSamples - 1;
  for (let i = totalSamples - 1; i >= onsetSample; i--) {
    if (Math.abs(samples[i]) > 0.003) { // ngưỡng -50dB
      // Thêm 35ms reverb decay đuôi
      offsetSample = Math.min(totalSamples - 1, i + Math.floor(SAMPLE_RATE * 0.035));
      break;
    }
  }

  // Tìm điểm zero-crossing gần nhất quanh offsetSample
  while (offsetSample < totalSamples - 1 && Math.abs(samples[offsetSample]) > 0.005) {
    offsetSample++;
  }

  const slicedLength = offsetSample - onsetSample;
  console.log(`📍 Voicing Onset (bắt đầu uyu): ${(onsetSample / SAMPLE_RATE).toFixed(3)}s (sample ${onsetSample})`);
  console.log(`📍 Natural Decay (kết thúc):   ${(offsetSample / SAMPLE_RATE).toFixed(3)}s (sample ${offsetSample})`);
  console.log(`⏱️  Thời lượng vần "uyu":       ${(slicedLength / SAMPLE_RATE).toFixed(3)}s (${slicedLength} samples)`);

  // 4. Tạo mảng mẫu đã cắt và áp dụng Hann Windowing 12ms + Hard zero 32 mẫu
  const slicedSamples = new Float32Array(slicedLength);
  for (let i = 0; i < slicedLength; i++) {
    slicedSamples[i] = samples[onsetSample + i];
  }

  // Hann Windowing 12ms ở 2 đầu
  const fadeSamples = Math.min(Math.floor(SAMPLE_RATE * 0.012), Math.floor(slicedLength / 3));
  for (let i = 0; i < fadeSamples; i++) {
    const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
    slicedSamples[i] *= factor;
    slicedSamples[slicedLength - 1 - i] *= factor;
  }

  // Hard Zero 32 mẫu đầu và cuối
  const HARD_ZERO = 32;
  for (let i = 0; i < HARD_ZERO; i++) {
    slicedSamples[i] = 0.0;
    slicedSamples[slicedLength - 1 - i] = 0.0;
  }

  // 5. Ghi ra WAV tạm thời
  const pcmBytes = slicedLength * 2;
  const wavHeader = createWavHeader(pcmBytes);
  const pcmBuffer = Buffer.alloc(pcmBytes);
  for (let i = 0; i < slicedLength; i++) {
    const s = Math.max(-1, Math.min(1, slicedSamples[i]));
    const int16 = s < 0 ? s * 32768 : s * 32767;
    pcmBuffer.writeInt16LE(Math.round(int16), i * 2);
  }

  fs.writeFileSync(tempSlicedWav, Buffer.concat([wavHeader, pcmBuffer]));

  // 6. Chuyển đổi WAV sang MP3 chất lượng cao
  execSync(`"${ffmpegPath}" -y -i "${tempSlicedWav}" -ar ${SAMPLE_RATE} -ac 1 -b:a 48k "${targetMp3}"`, { stdio: 'pipe' });

  // 7. Dọn dẹp file tạm
  if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
  if (fs.existsSync(tempSlicedWav)) fs.unlinkSync(tempSlicedWav);

  const finalStats = fs.statSync(targetMp3);
  console.log(`✅ Xuất thành công file "${path.basename(targetMp3)}" (${finalStats.size} bytes)!`);
  console.log('='.repeat(70));

  return targetMp3;
}

// Chạy trực tiếp nếu gọi từ CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    sliceUyuRime();
  } catch (err) {
    console.error('❌ Lỗi trích xuất:', err);
    process.exit(1);
  }
}
