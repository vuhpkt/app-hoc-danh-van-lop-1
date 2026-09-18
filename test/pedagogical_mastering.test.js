import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { audioDspProcessor } from '../src/core/audio/AudioDspProcessor.ts';
import { SpriteManager } from '../src/core/audio/SpriteManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const SAMPLE_RATE = 24000;

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
  return { sampleCount, samples, duration: sampleCount / SAMPLE_RATE };
}

function measureClipAcoustics(mp3Path, tempWavPath) {
  execSync(`"${ffmpegPath}" -y -i "${mp3Path}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempWavPath}"`, { stdio: 'pipe' });
  const buf = fs.readFileSync(tempWavPath);
  try { fs.unlinkSync(tempWavPath); } catch {}
  const { samples, sampleCount } = extractPcmFromWav(buf);

  // Xóa cứng 64 mẫu đầu MP3 click pop
  for (let s = 0; s < Math.min(64, sampleCount); s++) samples[s] = 0.0;

  // Đo thời lượng nói thực tế (ngưỡng 0.008 ~ -42dB)
  let s0 = 0;
  for (let s = 64; s < sampleCount; s++) {
    if (Math.abs(samples[s]) >= 0.008) {
      s0 = s;
      break;
    }
  }
  let s1 = sampleCount - 1;
  for (let s = sampleCount - 1; s >= 64; s--) {
    if (Math.abs(samples[s]) >= 0.008) {
      s1 = s;
      break;
    }
  }

  let peak = 0.0;
  for (let s = 64; s < sampleCount; s++) {
    const v = Math.abs(samples[s]);
    if (v > peak) peak = v;
  }

  const activeDurMs = Math.max(0, ((s1 - s0) / SAMPLE_RATE) * 1000);
  return { activeDurMs, peak, sampleCount, totalDurSec: sampleCount / SAMPLE_RATE };
}

test('Pedagogical Audio Mastering - Sensitive Words Duration & Peak Standard', async (t) => {
  const tempWav = path.join(__dirname, 'temp_pedagogy_check.wav');

  // Danh mục từ nhạy cảm theo tiêu chuẩn sư phạm Lớp 1 (R1 & R3)
  const SENSITIVE_WORDS = [
    // Nhóm vần mở / vang: yêu cầu thời lượng >= 300ms, dải vàng 300ms - 340ms
    { file: 'tu__vui.mp3', label: 'vui', type: 'open', minDur: 300 },
    { file: 'tu__em.mp3', label: 'em', type: 'open', minDur: 300 },
    { file: 'tu__lo.mp3', label: 'lo', type: 'open', minDur: 300 },
    { file: 'tu__cay.mp3', label: 'cây', type: 'open', minDur: 300 },
    { file: 'tu__chim.mp3', label: 'chim', type: 'open', minDur: 300 },
    { file: 'tu__chi_hoi.mp3', label: 'chỉ', type: 'open', minDur: 300 },

    // Nhóm vần khép tắc (p, t, c, ch): yêu cầu thời lượng >= 220ms, dải vàng 220ms - 250ms
    { file: 'tu__hoc.mp3', label: 'học', type: 'stop', minDur: 220 },
    { file: 'tu__vit.mp3', label: 'vịt', type: 'stop', minDur: 220 },
    { file: 'tu__gap_nang.mp3', label: 'gập', type: 'stop', minDur: 220 },
    { file: 'van__ich.mp3', label: 'ích', type: 'stop', minDur: 220 },
  ];

  for (const item of SENSITIVE_WORDS) {
    await t.test(`Từ "${item.label}" (${item.file}) đạt chuẩn sư phạm (${item.type === 'open' ? '≥ 300ms' : '≥ 220ms'}, Peak 0.84 - 0.88)`, () => {
      const filePath = path.join(rootDir, 'raw-audio', item.file);
      assert.ok(fs.existsSync(filePath), `Tệp ${item.file} phải tồn tại`);

      const { activeDurMs, peak } = measureClipAcoustics(filePath, tempWav);

      // 1. Kiểm tra thời lượng phát âm thực tế
      assert.ok(
        activeDurMs >= item.minDur,
        `Thời lượng từ "${item.label}" (${activeDurMs.toFixed(1)}ms) phải >= ${item.minDur}ms cho nhóm ${item.type}`
      );

      // 2. Kiểm tra biên độ đỉnh trong dải vàng 0.84 - 0.88 (-1.2dBFS đến -1.5dBFS)
      assert.ok(
        peak >= 0.84 && peak <= 0.88,
        `Biên độ đỉnh từ "${item.label}" (${peak.toFixed(4)}) phải nằm trong [0.84, 0.88]`
      );
    });
  }
});

test('Pedagogical Audio Mastering - 100% Clips Peak Normalization (0.84 - 0.88)', async (t) => {
  const manifestPath = path.join(rootDir, 'raw-audio', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const tempWav = path.join(__dirname, 'temp_all_peak_check.wav');

  await t.test(`100% mẩu âm (${manifest.length} clips) trong kho đạt chuẩn biên độ đỉnh 0.84 - 0.88 (-1.3dBFS ±0.02)`, () => {
    let outOfBounds = 0;
    const errors = [];

    for (const item of manifest) {
      const filePath = path.join(rootDir, 'raw-audio', item.filename);
      assert.ok(fs.existsSync(filePath), `Tệp ${item.filename} phải tồn tại`);

      execSync(`"${ffmpegPath}" -y -i "${filePath}" -ar ${SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempWav}"`, { stdio: 'pipe' });
      const buf = fs.readFileSync(tempWav);
      const { samples, sampleCount } = extractPcmFromWav(buf);

      let peak = 0.0;
      for (let s = 64; s < sampleCount; s++) {
        const v = Math.abs(samples[s]);
        if (v > peak) peak = v;
      }

      if (peak < 0.84 || peak > 0.88) {
        outOfBounds++;
        errors.push(`${item.key}: peak=${peak.toFixed(4)}`);
      }
    }

    try { fs.unlinkSync(tempWav); } catch {}

    assert.equal(
      outOfBounds,
      0,
      `Có ${outOfBounds} mẩu âm ngoài dải [0.84, 0.88]: ${errors.slice(0, 5).join(', ')}`
    );
  });
});

test('Master Audio Sprite - Integrity & v4.3.0 Upgrade', async (t) => {
  await t.test('Master Sprite files tồn tại và hợp lệ', () => {
    const mp3Path = path.join(rootDir, 'public', 'audio', 'sprite-main.mp3');
    const webmPath = path.join(rootDir, 'public', 'audio', 'sprite-main.webm');
    const mapPath = path.join(rootDir, 'public', 'audio', 'audio-map.json');

    assert.ok(fs.existsSync(mp3Path), 'sprite-main.mp3 phải tồn tại');
    assert.ok(fs.existsSync(webmPath), 'sprite-main.webm phải tồn tại');
    assert.ok(fs.existsSync(mapPath), 'audio-map.json phải tồn tại');

    const mp3Stat = fs.statSync(mp3Path);
    const mapStat = fs.statSync(mapPath);

    assert.ok(mp3Stat.size > 500000, `Kích thước MP3 (${mp3Stat.size} bytes) phải hợp lệ (> 500KB)`);
    assert.ok(mapStat.size > 10000, `Kích thước map (${mapStat.size} bytes) phải hợp lệ (> 10KB)`);

    const audioMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    assert.equal(Object.keys(audioMap).length, 282, 'audio-map.json phải chứa đúng 282 mục chuẩn');
  });

  await t.test('SPRITE_VERSION được nâng cấp lên v4.6.0 trong SpriteManager.ts', () => {
    assert.equal(SpriteManager.SPRITE_VERSION, 'v4.6.0', 'SpriteManager.SPRITE_VERSION phải là v4.6.0');
  });
});

test('In-Browser WSOLA Time-Stretching & Dynamic Mastering (AudioDspProcessor)', async (t) => {
  await t.test('1. wsolaTimeStretch preserves pitch frequency without distortion', () => {
    const sr = 24000;
    const durMs = 200; // 200ms = 4800 mẫu
    const inputLen = Math.round(sr * (durMs / 1000));
    const input = new Float32Array(inputLen);

    // Sóng sin âm gốc 220Hz (quang phổ giọng cô giáo)
    const fundamentalFreq = 220;
    for (let i = 0; i < inputLen; i++) {
      input[i] = 0.5 * Math.sin((2 * Math.PI * fundamentalFreq * i) / sr);
    }

    // Kéo giãn 1.5x (tương đương tốc độ chậm 0.67x)
    const stretchFactor = 1.5;
    const t0 = performance.now();
    const stretched = audioDspProcessor.wsolaTimeStretch(input, sr, stretchFactor);
    const execTime = performance.now() - t0;

    // Kiểm tra độ dài đầu ra
    const expectedLen = Math.round(inputLen * stretchFactor);
    assert.equal(stretched.length, expectedLen, `Độ dài kéo giãn phải đạt đúng ${expectedLen} mẫu`);

    // Kiểm tra thời gian thực thi: yêu cầu < 10ms trên CPU (< 5ms trung bình)
    assert.ok(execTime < 10, `Thời gian chạy WSOLA (${execTime.toFixed(2)}ms) phải < 10ms`);

    // Kiểm tra bảo toàn cao độ: đếm chu kỳ qua zero-crossing rate
    let zcIn = 0;
    for (let i = 1; i < input.length; i++) {
      if ((input[i] >= 0 && input[i - 1] < 0) || (input[i] < 0 && input[i - 1] >= 0)) zcIn++;
    }
    let zcOut = 0;
    for (let i = 1; i < stretched.length; i++) {
      if ((stretched[i] >= 0 && stretched[i - 1] < 0) || (stretched[i] < 0 && stretched[i - 1] >= 0)) zcOut++;
    }

    const freqIn = (zcIn / 2) / (input.length / sr);
    const freqOut = (zcOut / 2) / (stretched.length / sr);

    const pitchDiff = Math.abs(freqIn - freqOut);
    assert.ok(
      pitchDiff < 5.0,
      `Độ lệch tần số pitch (${pitchDiff.toFixed(2)}Hz) phải < 5Hz (Input: ${freqIn.toFixed(1)}Hz, Output: ${freqOut.toFixed(1)}Hz)`
    );
  });

  await t.test('2. processDynamicWord auto-stretches rushed word (< 260ms) to 300ms-320ms and normalizes to 0.89', () => {
    const sr = 24000;
    // Mô phỏng từ mới tải về bị phát âm vội (thời lượng 180ms ~ "em" mộc)
    const totalLen = Math.round(sr * 0.400); // 400ms tổng thể gồm khoảng lặng
    const samples = new Float32Array(totalLen);

    // 50ms khoảng lặng đầu (1200 mẫu)
    const voiceStart = Math.round(sr * 0.050);
    const voiceDur = Math.round(sr * 0.180); // 180ms phát âm thực tế (< 260ms)

    for (let i = 0; i < voiceDur; i++) {
      samples[voiceStart + i] = 0.35 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }

    // Xử lý dynamic word với WSOLA tự động
    const processed = audioDspProcessor.processDynamicWord(samples, sr, {
      enableAutoStretch: true,
      minSpeechDurationSec: 0.260,
      targetSpeechDurationSec: 0.310, // Kéo giãn lên 310ms (dải vàng 300-320ms)
      preRollSec: 0.050,
      reverbTailSec: 0.140,
      targetPeak: 0.89,
    });

    // 1. Kiểm tra biên độ đỉnh đã được chuẩn hóa về ~0.89 (-1dBFS)
    let maxAmp = 0;
    for (let i = 0; i < processed.length; i++) {
      const v = Math.abs(processed[i]);
      if (v > maxAmp) maxAmp = v;
    }
    assert.ok(
      Math.abs(maxAmp - 0.89) < 0.02,
      `Biên độ đỉnh (${maxAmp.toFixed(3)}) phải chuẩn hóa về ~0.89 (-1dBFS)`
    );

    // 2. Kiểm tra zero-crossing clamp ở 2 đầu
    for (let i = 0; i < 32; i++) {
      assert.equal(processed[i], 0.0, `Mẫu đầu ${i} phải được ép cứng về 0`);
      assert.equal(processed[processed.length - 1 - i], 0.0, `Mẫu cuối ${i} phải được ép cứng về 0`);
    }

    // 3. Kiểm tra tổng thời lượng sau khi ghép 50ms pre-roll + ~310ms core + 140ms tail = ~500ms
    const totalDurSec = processed.length / sr;
    assert.ok(
      totalDurSec >= 0.48 && totalDurSec <= 0.53,
      `Tổng thời lượng (${totalDurSec.toFixed(3)}s) phải đạt chuẩn ~500ms (50ms pre-roll + 310ms core + 140ms tail)`
    );
  });

  await t.test('3. Generates valid 16-bit PCM WAV compatible with IndexedDB offline cache', () => {
    const sr = 24000;
    const testSamples = new Float32Array(sr * 0.2);
    for (let i = 0; i < testSamples.length; i++) {
      testSamples[i] = 0.5 * Math.cos((2 * Math.PI * 400 * i) / sr);
    }

    const wavBuffer = audioDspProcessor.pcmToWavArrayBuffer(testSamples, sr);
    assert.ok(wavBuffer instanceof ArrayBuffer, 'Phải là ArrayBuffer');

    const view = new DataView(wavBuffer);
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    assert.equal(riff, 'RIFF');
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    assert.equal(wave, 'WAVE');

    // 16-bit PCM Mono
    assert.equal(view.getUint16(20, true), 1); // PCM
    assert.equal(view.getUint16(22, true), 1); // Mono
    assert.equal(view.getUint32(24, true), sr); // 24000Hz
    assert.equal(view.getUint16(34, true), 16); // 16-bit
  });

  await t.test('4. processDynamicWord with profile "master_sprite_sync" properly boosts quiet clips to 0.89', () => {
    const sr = 24000;
    const totalLen = Math.round(sr * 0.400);
    const samples = new Float32Array(totalLen);
    const voiceStart = Math.round(sr * 0.050);
    const voiceDur = Math.round(sr * 0.180);

    // Mẫu âm rất nhỏ (biên độ đỉnh chỉ 0.20)
    for (let i = 0; i < voiceDur; i++) {
      samples[voiceStart + i] = 0.20 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }

    const processed = audioDspProcessor.processDynamicWord(samples, sr, {
      profile: 'master_sprite_sync',
      enableAutoStretch: true,
      preRollSec: 0.050,
      reverbTailSec: 0.140,
      targetPeak: 0.89,
    });

    let maxAmp = 0;
    for (let i = 0; i < processed.length; i++) {
      const v = Math.abs(processed[i]);
      if (v > maxAmp) maxAmp = v;
    }

    assert.ok(
      Math.abs(maxAmp - 0.89) < 0.02,
      `Biên độ đỉnh (${maxAmp.toFixed(3)}) phải được nâng lên ~0.89 ngay cả khi dùng profile master_sprite_sync`
    );
  });

  await t.test('5. wsolaTimeStretch handles edge cases without throwing (empty, zero/negative, NaN, very short)', () => {
    const sr = 24000;
    // Empty array
    const emptyRes = audioDspProcessor.wsolaTimeStretch(new Float32Array(0), sr, 1.5);
    assert.equal(emptyRes.length, 0, 'Empty array should return empty array');

    // Negative / zero factor
    const normalSamples = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) normalSamples[i] = 0.2 * Math.sin(i);
    const negRes = audioDspProcessor.wsolaTimeStretch(normalSamples, sr, -1.0);
    assert.equal(negRes.length, 0, 'Negative stretch factor should return empty array');
    const zeroRes = audioDspProcessor.wsolaTimeStretch(normalSamples, sr, 0);
    assert.equal(zeroRes.length, 0, 'Zero stretch factor should return empty array');

    // NaN / Infinity factor
    const nanRes = audioDspProcessor.wsolaTimeStretch(normalSamples, sr, NaN);
    assert.equal(nanRes.length, 0, 'NaN stretch factor should return empty array');

    // Very short input (< winSize)
    const shortSamples = new Float32Array(50);
    const shortRes = audioDspProcessor.wsolaTimeStretch(shortSamples, sr, 1.5);
    assert.equal(shortRes.length, 50, 'Very short input should safely return copy of samples');
  });

  await t.test('6. processDynamicWord edge cases (empty, silence, already long word >= 260ms)', () => {
    const sr = 24000;

    // 1. Empty buffer
    const emptyRes = audioDspProcessor.processDynamicWord(new Float32Array(0), sr);
    assert.equal(emptyRes.length, 0, 'Empty input should return empty array');

    // 2. Pure silence (all zeros)
    const silence = new Float32Array(sr * 0.3);
    const silenceRes = audioDspProcessor.processDynamicWord(silence, sr);
    assert.ok(silenceRes.length > 0, 'Silence should return safe array');
    let silenceMax = 0;
    for (let i = 0; i < silenceRes.length; i++) {
      if (Math.abs(silenceRes[i]) > silenceMax) silenceMax = Math.abs(silenceRes[i]);
    }
    assert.equal(silenceMax, 0.0, 'Silence output should remain 0');

    // 3. Word already >= 260ms (400ms duration) -> should NOT stretch core
    const longSamples = new Float32Array(sr * 0.6);
    const longStart = Math.round(sr * 0.05);
    const longDur = Math.round(sr * 0.400); // 400ms speech core
    for (let i = 0; i < longDur; i++) {
      longSamples[longStart + i] = 0.3 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }
    const longRes = audioDspProcessor.processDynamicWord(longSamples, sr, {
      enableAutoStretch: true,
      minSpeechDurationSec: 0.260,
      targetSpeechDurationSec: 0.310,
      preRollSec: 0.050,
      reverbTailSec: 0.140,
    });
    // Total duration should be ~50ms + 400ms + 140ms = ~590ms (~14160 samples)
    const longDurSec = longRes.length / sr;
    assert.ok(
      longDurSec >= 0.57 && longDurSec <= 0.61,
      `Already long word should not be stretched down to 310ms (got ${longDurSec.toFixed(3)}s)`
    );
  });

  await t.test('7. trimAndEnhanceAudioBuffer protects multi-channel buffers without RangeError', () => {
    const sr = 24000;
    const len = Math.round(sr * 0.3);

    // Mock AudioContext and AudioBuffer for Node.js environment
    const ch0 = new Float32Array(len);
    const ch1 = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      ch0[i] = 0.4 * Math.sin((2 * Math.PI * 250 * i) / sr);
      ch1[i] = 0.3 * Math.sin((2 * Math.PI * 250 * i) / sr);
    }

    const mockBuffer = {
      sampleRate: sr,
      numberOfChannels: 2,
      length: len,
      getChannelData: (ch) => (ch === 0 ? ch0 : ch1),
    };

    const mockCtx = {
      createBuffer: (channels, length, sampleRate) => {
        const data = Array.from({ length: channels }, () => new Float32Array(length));
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          getChannelData: (c) => data[c],
        };
      },
    };

    assert.doesNotThrow(() => {
      const result = audioDspProcessor.trimAndEnhanceAudioBuffer(mockBuffer, mockCtx, {
        profile: 'master_sprite_sync',
        enableAutoStretch: true,
      });
      assert.equal(result.numberOfChannels, 2);
      assert.ok(result.length > 0);
    });
  });

  await t.test('8. processPcmSamples properly inherits profile "master_sprite_sync" options', () => {
    const sr = 24000;
    const totalLen = Math.round(sr * 0.400);
    const samples = new Float32Array(totalLen);
    const voiceStart = Math.round(sr * 0.050);
    const voiceDur = Math.round(sr * 0.180); // 180ms (< 260ms)
    for (let i = 0; i < voiceDur; i++) {
      samples[voiceStart + i] = 0.25 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }

    // Chỉ truyền profile: 'master_sprite_sync', không truyền tường minh enableAutoStretch
    const processed = audioDspProcessor.processPcmSamples(samples, sr, {
      profile: 'master_sprite_sync',
    });

    // Phải kích hoạt tự động kéo giãn WSOLA và chuẩn hóa biên độ về 0.89
    let maxAmp = 0;
    for (let i = 0; i < processed.length; i++) {
      const v = Math.abs(processed[i]);
      if (v > maxAmp) maxAmp = v;
    }
    assert.ok(
      Math.abs(maxAmp - 0.89) < 0.02,
      `processPcmSamples phải kế thừa targetPeak 0.89 từ profile master_sprite_sync (got ${maxAmp.toFixed(3)})`
    );

    const totalDurSec = processed.length / sr;
    assert.ok(
      totalDurSec >= 0.48 && totalDurSec <= 0.53,
      `processPcmSamples phải kế thừa enableAutoStretch từ profile master_sprite_sync (got ${totalDurSec.toFixed(3)}s)`
    );
  });

  await t.test('9. trimAndEnhanceAudioBuffer protects empty/0-length buffers without throwing NotSupportedError', () => {
    const sr = 24000;
    const emptyBuffer = {
      sampleRate: sr,
      numberOfChannels: 1,
      length: 0,
      getChannelData: () => new Float32Array(0),
    };

    const mockCtx = {
      createBuffer: (channels, length, sampleRate) => {
        if (length < 1) throw new Error('NotSupportedError: minimum bound 1');
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          getChannelData: () => new Float32Array(length),
        };
      },
    };

    assert.doesNotThrow(() => {
      const result = audioDspProcessor.trimAndEnhanceAudioBuffer(emptyBuffer, mockCtx, {
        profile: 'master_sprite_sync',
        enableAutoStretch: true,
      });
      assert.ok(result);
    });
  });

  await t.test('10. audioBufferToWavArrayBuffer safely handles empty or zero-channel buffers', () => {
    const emptyBuffer = {
      sampleRate: 24000,
      numberOfChannels: 0,
      length: 0,
      getChannelData: () => { throw new Error('IndexSizeError'); },
    };

    assert.doesNotThrow(() => {
      const wav = audioDspProcessor.audioBufferToWavArrayBuffer(emptyBuffer);
      assert.ok(wav instanceof ArrayBuffer);
      assert.equal(wav.byteLength, 44); // Empty WAV header
    });
  });

  await t.test('11. processDynamicWord with zero trailing samples eliminates DC cliff discontinuity', () => {
    const sr = 24000;
    // Âm thanh kết thúc ngay tại mẫu cuối cùng (speechEnd = totalLen - 1)
    const voiceLen = Math.round(sr * 0.200);
    const samples = new Float32Array(voiceLen);
    for (let i = 0; i < voiceLen; i++) {
      samples[i] = 0.5 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }

    const processed = audioDspProcessor.processDynamicWord(samples, sr, {
      profile: 'master_sprite_sync',
      enableAutoStretch: true,
    });

    assert.ok(processed.length > 0);
    // Kiểm tra không có bước nhảy biên độ lớn (discontinuity > 0.35) giữa các mẫu liên tiếp
    let maxStep = 0;
    for (let i = 1; i < processed.length; i++) {
      const step = Math.abs(processed[i] - processed[i - 1]);
      if (step > maxStep) maxStep = step;
    }
    assert.ok(
      maxStep < 0.25,
      `Bước nhảy biên độ tối đa (${maxStep.toFixed(3)}) phải < 0.25 (chống tiếng nổ bậc nhảy tại ranh giới)`
    );
  });

  await t.test('12. wsolaTimeStretch eliminates boundary cliff drops and start impulses across stretch factors', () => {
    const sr = 24000;

    // 1. Kiểm tra với tín hiệu hằng số 1.0: không bị gián đoạn hay rơi rụng ở 2 đầu
    const dcInput = new Float32Array(4800).fill(1.0);
    const dcStretched = audioDspProcessor.wsolaTimeStretch(dcInput, sr, 1.25);
    assert.equal(dcStretched[0], 1.0, 'Mẫu đầu tiên của tín hiệu hằng số phải là 1.0');
    assert.equal(dcStretched[dcStretched.length - 1], 1.0, 'Mẫu cuối cùng của tín hiệu hằng số phải là 1.0');

    // 2. Kiểm tra với sóng sin 220Hz qua nhiều hệ số kéo giãn (1.1, 1.25, 1.5, 1.7)
    const sinInput = new Float32Array(4800);
    for (let i = 0; i < 4800; i++) sinInput[i] = 0.5 * Math.sin((2 * Math.PI * 220 * i) / sr);

    for (const factor of [1.1, 1.25, 1.5, 1.7]) {
      const out = audioDspProcessor.wsolaTimeStretch(sinInput, sr, factor);
      let maxStep = 0;
      for (let i = 1; i < out.length; i++) {
        const step = Math.abs(out[i] - out[i - 1]);
        if (step > maxStep) maxStep = step;
      }
      assert.ok(
        maxStep < 0.05,
        `Hệ số ${factor}: Bước nhảy lớn nhất (${maxStep.toFixed(4)}) phải < 0.05 (không có cliff nổ)`
      );

      // Đảm bảo 3 mẫu cuối cùng không bị rơi rụng đột ngột về 0
      const last3 = out[out.length - 3];
      const last2 = out[out.length - 2];
      const last1 = out[out.length - 1];
      const tailPlummet = Math.abs(last3) > 0.05 && Math.abs(last2) < 1e-4 && Math.abs(last1) === 0;
      assert.ok(!tailPlummet, `Hệ số ${factor}: Đuôi không được bị ngắt cụt đột ngột về 0`);
    }
  });

  await t.test('13. detectActiveSpeechDuration precisely measures voice core inside padded buffers', () => {
    const sr = 24000;
    // Buffer tổng 380ms: 100ms im lặng + 180ms giọng nói + 100ms im lặng
    const totalLen = Math.round(sr * 0.380);
    const samples = new Float32Array(totalLen);
    const voiceStart = Math.round(sr * 0.100);
    const voiceDur = Math.round(sr * 0.180);

    for (let i = 0; i < voiceDur; i++) {
      samples[voiceStart + i] = 0.4 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }

    const durSec = audioDspProcessor.detectActiveSpeechDuration(samples, sr);
    assert.ok(
      Math.abs(durSec - 0.180) < 0.015,
      `Thời lượng phát âm thực tế (${durSec.toFixed(3)}s) phải phát hiện đúng ~0.180s dù tổng buffer là 0.380s`
    );

    // Kiểm tra với im lặng tuyệt đối
    const silenceDur = audioDspProcessor.detectActiveSpeechDuration(new Float32Array(sr * 0.2), sr);
    assert.equal(silenceDur, 0, 'Buffer im lặng phải trả về thời lượng 0s');
  });

  await t.test('14. Legacy cached clip with duration > 260ms but active speech < 260ms is properly stretched', () => {
    const sr = 24000;
    // Mô phỏng clip cũ trong cache: tổng 380ms nhưng active speech chỉ 180ms
    const totalLen = Math.round(sr * 0.380);
    const samples = new Float32Array(totalLen);
    const voiceStart = Math.round(sr * 0.100);
    const voiceDur = Math.round(sr * 0.180);

    for (let i = 0; i < voiceDur; i++) {
      samples[voiceStart + i] = 0.35 * Math.sin((2 * Math.PI * 300 * i) / sr);
    }

    const activeSpeech = audioDspProcessor.detectActiveSpeechDuration(samples, sr);
    assert.ok(activeSpeech < 0.260, 'Active speech phải < 260ms');
    assert.ok(totalLen / sr >= 0.260, 'Tổng buffer phải >= 260ms (bẫy cũ)');

    // Chạy qua trimAndEnhanceAudioBuffer
    const mockBuffer = {
      sampleRate: sr,
      numberOfChannels: 1,
      length: totalLen,
      duration: totalLen / sr,
      getChannelData: () => samples,
    };
    const mockCtx = {
      createBuffer: (channels, length, sampleRate) => {
        const data = new Float32Array(length);
        return {
          numberOfChannels: channels,
          length,
          duration: length / sampleRate,
          sampleRate,
          getChannelData: () => data,
        };
      },
    };

    const enhanced = audioDspProcessor.trimAndEnhanceAudioBuffer(mockBuffer, mockCtx, {
      profile: 'master_sprite_sync',
      enableAutoStretch: true,
      targetSpeechDurationSec: 0.310,
    });

    const enhancedData = enhanced.getChannelData(0);
    const enhancedActiveSpeech = audioDspProcessor.detectActiveSpeechDuration(enhancedData, sr);
    assert.ok(
      enhancedActiveSpeech >= 0.300 && enhancedActiveSpeech <= 0.340,
      `Active speech sau khi nâng cấp (${enhancedActiveSpeech.toFixed(3)}s) phải đạt dải vàng 300ms-340ms`
    );
  });
});
