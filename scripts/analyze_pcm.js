import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wavFile = path.join(__dirname, 'raw_van__uong_horn.wav');

const buffer = fs.readFileSync(wavFile);
// Skip 44 bytes header
const sampleCount = (buffer.length - 44) / 2;
const samples = new Float32Array(sampleCount);

let maxAmp = 0;
for (let i = 0; i < sampleCount; i++) {
  const int16 = buffer.readInt16LE(44 + i * 2);
  samples[i] = int16 / 32768.0;
  if (Math.abs(samples[i]) > maxAmp) {
    maxAmp = Math.abs(samples[i]);
  }
}

console.log('Total samples:', sampleCount, `(${sampleCount / 24000}s), Max Amp:`, maxAmp);

// Find first sample where amplitude > 0.02 (approx -34dB)
// and last sample where amplitude > 0.005 (approx -46dB)
let firstActive = -1;
let lastActive = -1;

for (let i = 0; i < sampleCount; i++) {
  if (Math.abs(samples[i]) > 0.02 && firstActive === -1) {
    firstActive = i;
  }
  if (Math.abs(samples[i]) > 0.005) {
    lastActive = i;
  }
}

console.log('Speech starts at sample:', firstActive, `(${(firstActive / 24000).toFixed(3)}s)`);
console.log('Speech ends at sample:  ', lastActive, `(${(lastActive / 24000).toFixed(3)}s)`);
console.log('Natural Speech duration:', ((lastActive - firstActive) / 24000).toFixed(3), 's');
