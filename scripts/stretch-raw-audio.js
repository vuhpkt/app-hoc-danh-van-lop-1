/**
 * scripts/stretch-raw-audio.js
 * 
 * Script stretch duration and normalize volume for rushed words in raw-audio/
 * Based on technical root-cause specification:
 * - tu__em.mp3 & van__em.mp3: atempo=0.65,volume=1.8
 * - tu__lo.mp3: atempo=0.72,volume=1.05
 * - tu__ve.mp3, tu__ve_huyen.mp3, tu__ve_hoi.mp3, tu__co.mp3: atempo=0.75,volume=1.3
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const rawAudioDir = path.join(rootDir, 'raw-audio');
const backupDir = path.join(rootDir, 'raw-audio-backup');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const ITEMS_TO_STRETCH = [
  { file: 'tu__em.mp3', filter: 'atempo=0.65,volume=1.8', desc: 'Stretch "em" to ~310ms active speech, boost peak to ~0.86' },
  { file: 'van__em.mp3', filter: 'atempo=0.65,volume=1.8', desc: 'Stretch rime "em" to ~310ms active speech, boost peak to ~0.86' },
  { file: 'tu__lo.mp3', filter: 'atempo=0.72,volume=1.05', desc: 'Stretch "lo" to ~320ms active speech, peak to ~0.87' },
  { file: 'tu__ve.mp3', filter: 'atempo=0.75,volume=1.3', desc: 'Stretch "ve" (< 230ms) with atempo=0.75,volume=1.3' },
  { file: 'tu__ve_huyen.mp3', filter: 'atempo=0.75,volume=1.3', desc: 'Stretch "vè" (< 230ms) with atempo=0.75,volume=1.3' },
  { file: 'tu__ve_hoi.mp3', filter: 'atempo=0.75,volume=1.3', desc: 'Stretch "vẻ" (< 230ms) with atempo=0.75,volume=1.3' },
  { file: 'tu__co.mp3', filter: 'atempo=0.75,volume=1.3', desc: 'Stretch "cô" (< 230ms) with atempo=0.75,volume=1.3' },
];

console.log('='.repeat(75));
console.log('🎵 BỘ ĐIỀU CHỈNH ÂM HỌC VÀ CO GIÃN THỜI LƯỢNG RAW AUDIO');
console.log('='.repeat(75));

for (const item of ITEMS_TO_STRETCH) {
  const filePath = path.join(rawAudioDir, item.file);
  const backupPath = path.join(backupDir, item.file);
  const tempOut = path.join(rawAudioDir, `_temp_${item.file}`);

  if (!fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    console.warn(`⚠️ Không tìm thấy file: ${item.file}`);
    continue;
  }

  // Backup original if not already backed up
  if (!fs.existsSync(backupPath) && fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`  💾 Đã sao lưu bản gốc vào raw-audio-backup/${item.file}`);
  }

  const sourceInput = fs.existsSync(backupPath) ? backupPath : filePath;

  console.log(`  Processing ${item.file}: ${item.desc}`);
  const cmd = `"${ffmpegPath}" -y -i "${sourceInput}" -filter:a "${item.filter}" -ar 16000 -c:a libmp3lame -b:a 160k "${tempOut}"`;
  execSync(cmd, { stdio: 'pipe' });

  // Replace original file
  fs.copyFileSync(tempOut, filePath);
  fs.unlinkSync(tempOut);
  console.log(`  ✅ Hoàn tất điều chỉnh: ${item.file}`);
}

console.log('='.repeat(75));
console.log('🎉 Đã điều chỉnh thành công tất cả các file âm thanh chỉ định!');
console.log('='.repeat(75));
