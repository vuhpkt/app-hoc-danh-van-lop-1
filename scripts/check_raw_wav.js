import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawDir = path.join(__dirname, '..', 'raw-audio');

function convertRawToWav(file) {
  const input = path.join(rawDir, file);
  const out = path.join(__dirname, 'raw_' + file.replace('.mp3', '.wav'));
  const cmd = `"${ffmpegPath}" -y -i "${input}" -ar 24000 -ac 1 -c:a pcm_s16le "${out}"`;
  execSync(cmd, { stdio: 'pipe' });
  const buf = fs.readFileSync(out);
  const dur = (buf.length - 44) / (24000 * 2);
  console.log(`Raw untrimmed ${file}: ${dur.toFixed(3)}s`);
}

convertRawToWav('van__uong_horn.mp3');
convertRawToWav('tu__truong.mp3');
convertRawToWav('thanh__huyen.mp3');
convertRawToWav('am_dau__tr.mp3');
convertRawToWav('tu__truong_ngang.mp3');
