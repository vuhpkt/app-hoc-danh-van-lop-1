import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const uyuMp3Path = path.join(rootDir, 'raw-audio', 'van__uyu.mp3');
const tempWavPath = path.join(__dirname, 'temp_verify_uyu.wav');

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
  return { sampleCount, samples, duration: sampleCount / 24000 };
}

test('Acoustic Slicing for van__uyu.mp3', async (t) => {
  await t.test('1. File van__uyu.mp3 must exist and have valid size', () => {
    assert.ok(fs.existsSync(uyuMp3Path), `File van__uyu.mp3 does not exist at: ${uyuMp3Path}`);
    const stats = fs.statSync(uyuMp3Path);
    assert.ok(stats.size > 1500, `File van__uyu.mp3 is too small: ${stats.size} bytes`);
  });

  await t.test('2. Decoded PCM must satisfy speech acoustics & zero-crossing constraints', () => {
    // Decode MP3 to 24kHz mono PCM WAV
    execSync(`"${ffmpegPath}" -y -i "${uyuMp3Path}" -ar 24000 -ac 1 -c:a pcm_s16le "${tempWavPath}"`, { stdio: 'pipe' });
    const buf = fs.readFileSync(tempWavPath);
    const { sampleCount, samples, duration } = extractPcmFromWav(buf);

    assert.ok(sampleCount > 0, 'WAV has no samples');

    // Expected duration of triphthong 'uyu' is between 0.20s and 0.55s
    assert.ok(duration >= 0.20 && duration <= 0.55, `Duration ${duration.toFixed(3)}s is outside expected [0.20s, 0.55s]`);

    let maxAmp = 0;
    for (let i = 0; i < sampleCount; i++) {
      if (Math.abs(samples[i]) > maxAmp) {
        maxAmp = Math.abs(samples[i]);
      }
    }

    // Must have good sound volume
    assert.ok(maxAmp >= 0.20, `Peak amplitude ${maxAmp.toFixed(3)} is too low`);
    assert.ok(maxAmp <= 1.0, `Peak amplitude ${maxAmp.toFixed(3)} has clipping`);

    // First 32 samples and last 32 samples must be virtually zero (silence padding, < -60dB noise floor)
    for (let i = 0; i < 32; i++) {
      assert.ok(Math.abs(samples[i]) < 0.001, `Sample at head ${i} is not quiet: ${samples[i]}`);
      assert.ok(Math.abs(samples[sampleCount - 1 - i]) < 0.001, `Sample at tail ${i} is not quiet: ${samples[sampleCount - 1 - i]}`);
    }

    // Zero Crossing Rate (ZCR) in the first 80ms of audio:
    // Consonant 'kh' (fricative) has high ZCR (> 0.35).
    // Pure vowel 'uyu' has low ZCR (< 0.15) because it is voiced harmonic sound.
    const checkSamples = Math.min(Math.floor(24000 * 0.08), sampleCount - 1);
    let zeroCrossings = 0;
    for (let i = 32; i < checkSamples; i++) {
      if ((samples[i] >= 0 && samples[i + 1] < 0) || (samples[i] < 0 && samples[i + 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / (checkSamples - 32);
    assert.ok(zcr < 0.18, `ZCR in first 80ms is too high (${zcr.toFixed(3)} >= 0.18). Fricative consonant 'kh' was not properly trimmed!`);

    // Clean up temp wav
    if (fs.existsSync(tempWavPath)) {
      fs.unlinkSync(tempWavPath);
    }
  });

  await t.test('3. SpriteManager mapping verification for uyu', () => {
    const spriteManagerPath = path.join(rootDir, 'src', 'core', 'audio', 'SpriteManager.ts');
    const content = fs.readFileSync(spriteManagerPath, 'utf-8');
    assert.ok(content.includes("'uyu': 'van__uyu'"), "SpriteManager.ts must map 'uyu' to 'van__uyu'");
  });
});
