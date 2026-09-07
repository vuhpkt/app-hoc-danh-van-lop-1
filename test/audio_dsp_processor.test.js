import test from 'node:test';
import assert from 'node:assert/strict';
import { audioDspProcessor } from '../src/core/audio/AudioDspProcessor.ts';

test('AudioDspProcessor - Speech Boundaries and Silence Trimming', async (t) => {
  const SAMPLE_RATE = 24000;

  await t.test('1. Trims leading silence (>200ms) with 10ms safe pre-roll', () => {
    const totalSamples = SAMPLE_RATE * 1; // 1 second
    const samples = new Float32Array(totalSamples);

    // 250ms silence (6000 samples)
    const silenceLength = Math.round(SAMPLE_RATE * 0.25);
    // Speech burst at 250ms with amplitude 0.4
    for (let i = silenceLength; i < silenceLength + 2000; i++) {
      samples[i] = 0.4 * Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE);
    }

    const { startIdx, endIdx } = audioDspProcessor.detectSpeechBoundaries(samples, SAMPLE_RATE);

    // Speech begins around 6000. With 10ms pre-roll (240 samples), startIdx should be ~5760
    assert.ok(startIdx > 5000 && startIdx < 6050, `startIdx should be around 5760, got ${startIdx}`);
    assert.ok(endIdx > silenceLength + 2000, `endIdx should be after speech burst, got ${endIdx}`);
  });

  await t.test('2. Trims trailing silence with 50ms natural decay tail', () => {
    const totalSamples = SAMPLE_RATE * 1;
    const samples = new Float32Array(totalSamples);

    // Speech from 0ms to 400ms (9600 samples)
    const speechEnd = Math.round(SAMPLE_RATE * 0.40);
    for (let i = 0; i < speechEnd; i++) {
      samples[i] = 0.5 * Math.cos((2 * Math.PI * 220 * i) / SAMPLE_RATE);
    }
    // Trailing silence after 400ms

    const { startIdx, endIdx } = audioDspProcessor.detectSpeechBoundaries(samples, SAMPLE_RATE);

    assert.equal(startIdx, 0, 'Speech starts at 0, startIdx must be 0');
    // 50ms reverb tail is 1200 samples
    const expectedTailEnd = speechEnd + Math.round(SAMPLE_RATE * 0.05);
    assert.ok(
      Math.abs(endIdx - expectedTailEnd) < 50,
      `endIdx should include 50ms tail (~${expectedTailEnd}), got ${endIdx}`
    );
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
