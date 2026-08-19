import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawFile = path.join(__dirname, '..', 'raw-audio', 'van__uong_horn.mp3');

console.log('Inspecting raw-audio/van__uong_horn.mp3:');
const cmd1 = `"${ffmpegPath}" -i "${rawFile}"`;
try {
  execSync(cmd1, { stdio: 'pipe' });
} catch (e) {
  console.log(e.stderr.toString());
}
