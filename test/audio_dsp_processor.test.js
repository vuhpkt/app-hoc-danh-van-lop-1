import test from 'node:test';
import assert from 'node:assert/strict';
import { audioDspProcessor } from '../src/core/audio/AudioDspProcessor.ts';

test('AudioDspProcessor - Speech Boundaries and Silence Trimming', async (t) => {
  const SAMPLE_RATE = 24000;

  await t.test('1. Trims leading silence (>200ms) with 25ms safe pre-roll', () => {
    const totalSamples = SAMPLE_RATE * 1; // 1 second
    const samples = new Float32Array(totalSamples);

    // 250ms silence (6000 samples)
    const silenceLength = Math.round(SAMPLE_RATE * 0.25);
    // Speech burst at 250ms with amplitude 0.4
    for (let i = silenceLength; i < silenceLength + 2000; i++) {
      samples[i] = 0.4 * Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE);
    }

    const { startIdx, endIdx } = audioDspProcessor.detectSpeechBoundaries(samples, SAMPLE_RATE);

    // Speech begins around 6000. With 25ms pre-roll (600 samples), startIdx should be ~5400
    assert.ok(startIdx > 5200 && startIdx < 5600, `startIdx should be around 5400, got ${startIdx}`);
    assert.ok(endIdx > silenceLength + 2000, `endIdx should be after speech burst, got ${endIdx}`);
  });

  await t.test('2. Trims trailing silence with 80ms natural decay tail', () => {
    const totalSamples = SAMPLE_RATE * 1;
    const samples = new Float32Array(totalSamples);

    // Speech from 0ms to 400ms (9600 samples)
    const speechEnd = Math.round(SAMPLE_RATE * 0.40);
    for (let i = 0; i < speechEnd; i++) {
      samples[i] = 0.5 * Math.cos((2 * Math.PI * 220 * i) / SAMPLE_RATE);
    }
    // Trailing silence after 400ms

    const { startIdx, endIdx } = audioDspProcessor.detectSpeechBoundaries(samples, SAMPLE_RATE);

    // 80ms reverb tail is 1920 samples (dung sai trong phạm vi 1 cửa sổ 5ms ~ 120 samples)
    const expectedTailEnd = speechEnd + Math.round(SAMPLE_RATE * 0.08);
    assert.ok(
      Math.abs(endIdx - expectedTailEnd) < 150,
      `endIdx should include 80ms tail (~${expectedTailEnd}), got ${endIdx}`
    );
  });

  await t.test('3. Immunity to MP3 decoder header click pop at samples 0..15', () => {
    const totalSamples = SAMPLE_RATE * 1;
    const samples = new Float32Array(totalSamples);

    // Initial click pop artifact at sample 0..15 (amplitude 0.85)
    for (let i = 0; i < 16; i++) {
      samples[i] = 0.85;
    }

    // Followed by 200ms of pure silence (sample 16 to 4800)

    // True voice starts at 200ms (sample 4800)
    for (let i = 4800; i < 4800 + 4000; i++) {
      samples[i] = 0.5 * Math.sin((2 * Math.PI * 300 * i) / SAMPLE_RATE);
    }

    const { startIdx, endIdx } = audioDspProcessor.detectSpeechBoundaries(samples, SAMPLE_RATE);

    // Must NOT trigger at sample 0! Must trigger around 4800 - preRoll (4800 - 288 = ~4512)
    assert.ok(startIdx > 4000 && startIdx < 4850, `startIdx must ignore initial pop and be ~4500, got ${startIdx}`);
    assert.ok(endIdx > 8800, `endIdx must be after voice`);
  });
});

test('AudioDspProcessor - DSP PCM Processing (Windowing, Clamping, Normalization)', async (t) => {
  const SAMPLE_RATE = 24000;

  await t.test('1. Normalizes peak amplitude to ~0.89 (-1dBFS)', () => {
    const samples = new Float32Array(SAMPLE_RATE * 0.5); // 0.5s
    // Faint audio with max amplitude 0.20
    for (let i = 0; i < samples.length; i++) {
      samples[i] = 0.20 * Math.sin((2 * Math.PI * 500 * i) / SAMPLE_RATE);
    }

    const processed = audioDspProcessor.processPcmSamples(samples, SAMPLE_RATE);

    let maxAmp = 0;
    for (let i = 0; i < processed.length; i++) {
      if (Math.abs(processed[i]) > maxAmp) {
        maxAmp = Math.abs(processed[i]);
      }
    }

    // Must be normalized to ~0.89
    assert.ok(
      Math.abs(maxAmp - 0.89) < 0.02,
      `Max amplitude should be normalized to ~0.89, got ${maxAmp.toFixed(3)}`
    );
  });

  await t.test('2. Applies Zero-Crossing hard clamp (64 samples = 0.0) and Hann Windowing', () => {
    const samples = new Float32Array(SAMPLE_RATE * 0.3); // 300ms
    for (let i = 0; i < samples.length; i++) {
      samples[i] = 0.6;
    }

    const processed = audioDspProcessor.processPcmSamples(samples, SAMPLE_RATE);

    // First 64 samples must be strictly 0.0000
    for (let i = 0; i < 64; i++) {
      assert.equal(processed[i], 0.0, `Sample ${i} at start must be 0.0000 for zero-crossing`);
    }

    // Last 64 samples must be strictly 0.0000
    for (let i = processed.length - 64; i < processed.length; i++) {
      assert.equal(processed[i], 0.0, `Sample ${i} at end must be 0.0000 for zero-crossing`);
    }

    // Samples between 64 and fadeSamples should ramp up smoothly
    assert.ok(processed[100] > 0.0, 'Sample 100 should be ramping up');
    assert.ok(processed[150] > processed[100], 'Sample 150 should be higher than sample 100 in Hann window');
  });
});

test('AudioDspProcessor - WAV Header and Binary Serialization', async (t) => {
  const SAMPLE_RATE = 24000;
  const samples = new Float32Array(1000);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = 0.5 * Math.sin(i);
  }

  const wavBuffer = audioDspProcessor.pcmToWavArrayBuffer(samples, SAMPLE_RATE);

  assert.ok(wavBuffer instanceof ArrayBuffer, 'Output must be ArrayBuffer');
  assert.equal(wavBuffer.byteLength, 44 + 1000 * 2, 'WAV size must be 44-byte header + 2000 bytes PCM');

  const view = new DataView(wavBuffer);
  // Read RIFF
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  assert.equal(riff, 'RIFF');

  // Read WAVE
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  assert.equal(wave, 'WAVE');

  // Format code (1 = PCM)
  assert.equal(view.getUint16(20, true), 1, 'Audio format must be 1 (PCM)');
  // Channels (1 = Mono)
  assert.equal(view.getUint16(22, true), 1, 'Channels must be 1 (Mono)');
  // Sample rate (24000)
  assert.equal(view.getUint32(24, true), SAMPLE_RATE, 'Sample rate must be 24000');
  // Bits per sample (16)
  assert.equal(view.getUint16(34, true), 16, 'Bits per sample must be 16');

  // Data chunk
  const dataTag = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
  assert.equal(dataTag, 'data');
  assert.equal(view.getUint32(40, true), 2000, 'Data size must be 2000 bytes');
});

test('AudioDspProcessor - Pedagogical Parametric EQ and Micro-Ambience', async (t) => {
  const SAMPLE_RATE = 24000;

  await t.test('1. Biquad Peaking EQ boosts 220Hz fundamental warmth (+2.2dB)', () => {
    // Tạo sóng sin 220Hz biên độ 0.3
    const len = SAMPLE_RATE * 0.2; // 200ms
    const raw = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      raw[i] = 0.3 * Math.sin((2 * Math.PI * 220 * i) / SAMPLE_RATE);
    }

    // EQ boost 220Hz (+2.2dB)
    const boosted = audioDspProcessor.applyParametricEq(raw, SAMPLE_RATE, [
      { type: 'peaking', frequency: 220, q: 1.1, gainDb: 2.2 },
    ]);

    // Đo biên độ ổn định (bỏ qua 50ms đầu lúc filter settle)
    let maxRaw = 0;
    let maxBoosted = 0;
    const startCheck = Math.round(SAMPLE_RATE * 0.05);
    for (let i = startCheck; i < len; i++) {
      if (Math.abs(raw[i]) > maxRaw) maxRaw = Math.abs(raw[i]);
      if (Math.abs(boosted[i]) > maxBoosted) maxBoosted = Math.abs(boosted[i]);
    }

    // +2.2dB tương đương tỷ lệ ~1.288x
    const ratio = maxBoosted / maxRaw;
    assert.ok(ratio > 1.20 && ratio < 1.35, `220Hz boost ratio should be ~1.288, got ${ratio.toFixed(3)}`);
  });

  await t.test('2. Biquad Peaking EQ cuts harshness at 3.6kHz (-2.2dB)', () => {
    const len = SAMPLE_RATE * 0.2;
    const raw = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      raw[i] = 0.4 * Math.sin((2 * Math.PI * 3600 * i) / SAMPLE_RATE);
    }

    const cut = audioDspProcessor.applyParametricEq(raw, SAMPLE_RATE, [
      { type: 'peaking', frequency: 3600, q: 1.4, gainDb: -2.2 },
    ]);

    let maxRaw = 0;
    let maxCut = 0;
    const startCheck = Math.round(SAMPLE_RATE * 0.05);
    for (let i = startCheck; i < len; i++) {
      if (Math.abs(raw[i]) > maxRaw) maxRaw = Math.abs(raw[i]);
      if (Math.abs(cut[i]) > maxCut) maxCut = Math.abs(cut[i]);
    }

    // -2.2dB tương đương tỷ lệ ~0.776x
    const ratio = maxCut / maxRaw;
    assert.ok(ratio > 0.70 && ratio < 0.85, `3.6kHz cut ratio should be ~0.776, got ${ratio.toFixed(3)}`);
  });

  await t.test('3. Early Reflection Micro-Ambience adds warmth room presence without distortion', () => {
    // Tín hiệu xung delta ở đầu (nhịp vỗ tay / impulse)
    const len = 2000;
    const impulse = new Float32Array(len);
    impulse[10] = 0.8;

    const ambient = audioDspProcessor.applyEarlyReflections(impulse, SAMPLE_RATE, 0.02, 0.25, 0.35, 0.06);

    // Mẫu ban đầu vẫn còn biên độ chính (94% dry)
    assert.ok(ambient[10] > 0.70, 'Direct sound must be preserved');

    // Sau khoảng trễ 20ms (480 samples ở 24kHz), phải xuất hiện phản xạ buồng âm
    const delaySample = 10 + Math.round(SAMPLE_RATE * 0.02);
    assert.ok(Math.abs(ambient[delaySample]) > 0.01, 'Early reflection must appear after delay');
  });

  await t.test('4. Full DSP Pipeline executes correctly with presets', () => {
    const len = SAMPLE_RATE * 0.4;
    const samples = new Float32Array(len);
    // Tiếng giả lập ở giữa
    for (let i = 1000; i < len - 1000; i++) {
      samples[i] = 0.5 * Math.sin((2 * Math.PI * 300 * i) / SAMPLE_RATE);
    }

    const warmResult = audioDspProcessor.processPcmSamples(samples, SAMPLE_RATE, {
      profile: 'pedagogical_warm',
    });
    const dryResult = audioDspProcessor.processPcmSamples(samples, SAMPLE_RATE, {
      profile: 'pure_dry',
    });

    assert.ok(warmResult.length > 0, 'Warm profile should return processed samples');
    assert.ok(dryResult.length > 0, 'Dry profile should return processed samples');
  });

  await t.test('5. matchMasterSprite mode matches 100% of scripts/build-audio-sprite.js', () => {
    const totalSamples = SAMPLE_RATE * 0.6;
    const samples = new Float32Array(totalSamples);

    // Initial click artifact at sample 0..5 (> 0.008)
    samples[0] = 0.5;
    samples[1] = 0.6;

    // Speech ending at 400ms
    const speechEnd = Math.round(SAMPLE_RATE * 0.40);
    for (let i = 100; i < speechEnd; i++) {
      samples[i] = 0.4 * Math.sin((2 * Math.PI * 300 * i) / SAMPLE_RATE);
    }

    // 1. Kho máy
    let bStart = 0;
    for (let s = 0; s < totalSamples; s++) {
      if (Math.abs(samples[s]) > 0.008) {
        bStart = Math.max(0, s - 240);
        break;
      }
    }
    let bEnd = totalSamples - 1;
    for (let s = totalSamples - 1; s >= 0; s--) {
      if (Math.abs(samples[s]) > 0.0025) {
        bEnd = Math.min(totalSamples, s + 1200);
        break;
      }
    }

    // 2. AudioDspProcessor với matchMasterSprite: true
    const clientBounds = audioDspProcessor.detectSpeechBoundaries(samples, SAMPLE_RATE, {
      matchMasterSprite: true,
      reverbTailSec: 0.050,
      stopThreshold: 0.0025,
      startThreshold: 0.008,
    });

    assert.equal(clientBounds.startIdx, bStart, 'Client startIdx must match master sprite build exactly');
    assert.equal(clientBounds.endIdx, bEnd, 'Client endIdx must match master sprite build exactly');
  });
});

