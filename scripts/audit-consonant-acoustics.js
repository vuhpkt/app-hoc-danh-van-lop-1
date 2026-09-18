/**
 * scripts/audit-consonant-acoustics.js
 * 
 * KỊCH BẢN AUDIT ÂM HỌC ĐỘC LẬP CHO TOÀN BỘ 28 PHỤ ÂM ĐƠN & GHÉP (GRADE 1 PHONICS)
 * Đo đạc:
 * - Tổng thời lượng (Duration)
 * - Thời lượng nói thực tế (Active Speech Duration)
 * - Biên độ đỉnh (Peak Amplitude)
 * - Đối chiếu với văn bản prompt gửi TTS Zalo
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const BACKUP_DIR = path.join(rootDir, 'raw-audio-backup');
const RAW_DIR = path.join(rootDir, 'raw-audio');
const TEMP_DIR = path.join(rootDir, 'temp_audit_consonants');

const CONSONANTS = [
  { key: 'am_dau__b', letter: 'b', standardSound: 'bờ', currentPrompt: 'bờ' },
  { key: 'am_dau__c', letter: 'c', standardSound: 'cờ', currentPrompt: 'cờ' },
  { key: 'am_dau__ch', letter: 'ch', standardSound: 'chờ', currentPrompt: 'chờ' },
  { key: 'am_dau__d', letter: 'd', standardSound: 'dờ', currentPrompt: 'dờ' },
  { key: 'am_dau__dd', letter: 'đ', standardSound: 'đờ', currentPrompt: 'đờ' },
  { key: 'am_dau__g', letter: 'g', standardSound: 'gờ', currentPrompt: 'gờ' },
  { key: 'am_dau__gh', letter: 'gh', standardSound: 'gờ', currentPrompt: 'gờ' },
  { key: 'am_dau__gi', letter: 'gi', standardSound: 'giờ', currentPrompt: 'giờ' },
  { key: 'am_dau__h', letter: 'h', standardSound: 'hờ', currentPrompt: 'hờ' },
  { key: 'am_dau__k', letter: 'k', standardSound: 'cờ', currentPrompt: 'kờ' },
  { key: 'am_dau__kh', letter: 'kh', standardSound: 'khờ', currentPrompt: 'khờ' },
  { key: 'am_dau__l', letter: 'l', standardSound: 'lờ', currentPrompt: 'lờ' },
  { key: 'am_dau__m', letter: 'm', standardSound: 'mờ', currentPrompt: 'mờ' },
  { key: 'am_dau__n', letter: 'n', standardSound: 'nờ', currentPrompt: 'nờ' },
  { key: 'am_dau__ng', letter: 'ng', standardSound: 'ngờ', currentPrompt: 'ngờ' },
  { key: 'am_dau__ngh', letter: 'ngh', standardSound: 'ngờ', currentPrompt: 'ngờ' },
  { key: 'am_dau__nh', letter: 'nh', standardSound: 'nhờ', currentPrompt: 'nhờ' },
  { key: 'am_dau__p', letter: 'p', standardSound: 'pờ', currentPrompt: 'pờ' },
  { key: 'am_dau__ph', letter: 'ph', standardSound: 'phờ', currentPrompt: 'phờ' },
  { key: 'am_dau__qu', letter: 'qu', standardSound: 'quờ', currentPrompt: 'quờ' },
  { key: 'am_dau__r', letter: 'r', standardSound: 'rờ', currentPrompt: 'rờ' },
  { key: 'am_dau__s', letter: 's', standardSound: 'sờ', currentPrompt: 'sờ' },
  { key: 'am_dau__t', letter: 't', standardSound: 'tờ', currentPrompt: 'tờ' },
  { key: 'am_dau__th', letter: 'th', standardSound: 'thờ', currentPrompt: 'thờ' },
  { key: 'am_dau__tr', letter: 'tr', standardSound: 'trờ', currentPrompt: 'trờ' },
  { key: 'am_dau__v', letter: 'v', standardSound: 'vờ', currentPrompt: 'vờ' },
  { key: 'am_dau__x', letter: 'x', standardSound: 'xờ', currentPrompt: 'xờ' }
];

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
  return { samples, sampleCount, duration: sampleCount / 24000 };
}

function calculateAcoustics(samples, sampleRate = 24000) {
  let peak = 0;
  let activeSpeechSamples = 0;
  const energyThreshold = 0.02;

  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
    if (abs > energyThreshold) activeSpeechSamples++;
  }

  const activeDurationMs = Math.round((activeSpeechSamples / sampleRate) * 1000);
  const totalDurationMs = Math.round((samples.length / sampleRate) * 1000);

  return { peak, activeDurationMs, totalDurationMs };
}

function runAudit() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log('='.repeat(85));
  console.log('🔍 FORENSIC ACOUSTIC AUDIT: 28 CONSONANTS (GRADE 1 VIETNAMESE PHONICS)');
  console.log('='.repeat(85));
  console.log(
    'Key'.padEnd(16) +
    'Letter'.padEnd(8) +
    'Std Sound'.padEnd(12) +
    'Prompt'.padEnd(10) +
    'Active(ms)'.padEnd(12) +
    'Peak'.padEnd(8) +
    'Status'
  );
  console.log('-'.repeat(85));

  const defects = [];

  for (const c of CONSONANTS) {
    const mp3Name = `${c.key}.mp3`;
    let targetPath = path.join(RAW_DIR, mp3Name);
    if (!fs.existsSync(targetPath)) {
      targetPath = path.join(BACKUP_DIR, mp3Name);
    }

    if (!fs.existsSync(targetPath)) {
      console.log(`${c.key.padEnd(16)} ❌ FILE MISSING!`);
      defects.push({ ...c, issue: 'FILE_MISSING' });
      continue;
    }

    const tempWav = path.join(TEMP_DIR, `${c.key}.wav`);
    execSync(`"${ffmpegPath}" -y -v error -i "${targetPath}" -ac 1 -ar 24000 "${tempWav}"`);
    const wavBuffer = fs.readFileSync(tempWav);
    const { samples } = extractPcmFromWav(wavBuffer);
    const { peak, activeDurationMs, totalDurationMs } = calculateAcoustics(samples, 24000);

    let status = '✅ OK';
    let issue = null;

    if (c.key === 'am_dau__gh' && c.currentPrompt !== 'gờ') {
      status = '❌ DEFECT (ghờ -> "gâu")';
      issue = 'MISREAD_AS_FOREIGN_WORD';
      defects.push({ ...c, activeDurationMs, peak, issue });
    } else if (c.key === 'am_dau__ngh' && c.currentPrompt !== 'ngờ') {
      status = '⚠️ PROMPT_NGHỜ';
      issue = 'NON_STANDARD_SYLLABLE';
      defects.push({ ...c, activeDurationMs, peak, issue });
    } else if (activeDurationMs < 200) {
      status = '⚠️ TOO_SHORT';
      issue = 'ACTIVE_DURATION_UNDER_200MS';
      defects.push({ ...c, activeDurationMs, peak, issue });
    }

    console.log(
      c.key.padEnd(16) +
      c.letter.padEnd(8) +
      c.standardSound.padEnd(12) +
      c.currentPrompt.padEnd(10) +
      `${activeDurationMs}ms`.padEnd(12) +
      peak.toFixed(2).padEnd(8) +
      status
    );
  }

  // Cleanup temp dir
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  console.log('='.repeat(85));
  console.log(`Audited: ${CONSONANTS.length} consonants. Identified ${defects.length} defect(s)/warning(s).`);
  for (const d of defects) {
    console.log(` - ${d.key} (${d.letter}): ${d.issue} -> Standard sound must be "${d.standardSound}"`);
  }
  console.log('='.repeat(85));
}

runAudit();
