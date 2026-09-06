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

test('Direct Phoneme Synthesis for van__uyu.mp3 (Zalo AI)', async (t) => {
  await t.test('1. File van__uyu.mp3 must exist and have valid size', () => {
    assert.ok(fs.existsSync(uyuMp3Path), `File van__uyu.mp3 does not exist at: ${uyuMp3Path}`);
    const stats = fs.statSync(uyuMp3Path);
    assert.ok(stats.size > 2000, `File van__uyu.mp3 is too small: ${stats.size} bytes`);
  });

  await t.test('2. Decoded PCM must satisfy speech acoustics & natural duration', () => {
    // Decode MP3 to 24kHz mono PCM WAV
    execSync(`"${ffmpegPath}" -y -i "${uyuMp3Path}" -ar 24000 -ac 1 -c:a pcm_s16le "${tempWavPath}"`, { stdio: 'pipe' });
    const buf = fs.readFileSync(tempWavPath);
    const { sampleCount, samples, duration } = extractPcmFromWav(buf);

    assert.ok(sampleCount > 0, 'WAV has no samples');

    // Expected duration of directly synthesized rime 'uyu' is between 0.30s and 1.20s
    assert.ok(duration >= 0.30 && duration <= 1.20, `Duration ${duration.toFixed(3)}s is outside expected [0.30s, 1.20s]`);

    let maxAmp = 0;
    for (let i = 0; i < sampleCount; i++) {
      if (Math.abs(samples[i]) > maxAmp) {
        maxAmp = Math.abs(samples[i]);
      }
    }

    // Must have good sound volume
    assert.ok(maxAmp >= 0.20, `Peak amplitude ${maxAmp.toFixed(3)} is too low`);
    assert.ok(maxAmp <= 1.0, `Peak amplitude ${maxAmp.toFixed(3)} has clipping`);

    // Clean up temp wav
    if (fs.existsSync(tempWavPath)) {
      fs.unlinkSync(tempWavPath);
    }
  });

  await t.test('3. SpriteManager mapping & audio-map.json verification for uyu', () => {
    const audioMapPath = path.join(rootDir, 'public', 'audio', 'audio-map.json');
    const audioMap = JSON.parse(fs.readFileSync(audioMapPath, 'utf-8'));
    assert.ok(audioMap['van__uyu'], 'audio-map.json must contain van__uyu entry');
    assert.ok(audioMap['van__uyu'].duration > 0.3, 'van__uyu duration must be > 0.3s');

    const spriteManagerPath = path.join(rootDir, 'src', 'core', 'audio', 'SpriteManager.ts');
    const content = fs.readFileSync(spriteManagerPath, 'utf-8');
    assert.ok(content.includes("'uyu': 'van__uyu'"), "SpriteManager.ts must map 'uyu' to 'van__uyu'");
  });
});
