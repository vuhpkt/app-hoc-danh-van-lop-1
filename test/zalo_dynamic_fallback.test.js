import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zaloTtsClient } from '../src/core/audio/ZaloTtsClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('Zero Web Speech API Policy - SpriteManager must NOT use Web Speech API', () => {
  const spriteManagerFile = path.join(rootDir, 'src', 'core', 'audio', 'SpriteManager.ts');
  const content = fs.readFileSync(spriteManagerFile, 'utf-8');

  // Khẳng định 100% không còn bất kỳ dấu vết nào của speechSynthesis hoặc SpeechSynthesisUtterance
  assert.equal(
    content.includes('speechSynthesis'),
    false,
    'SpriteManager must NOT reference window.speechSynthesis (robot voice prohibited)'
  );
  assert.equal(
    content.includes('SpeechSynthesisUtterance'),
    false,
    'SpriteManager must NOT reference SpeechSynthesisUtterance'
  );

  // Phải import và sử dụng zaloTtsClient
  assert.ok(
    content.includes('zaloTtsClient'),
    'SpriteManager must import and use zaloTtsClient for missing words'
  );
});

test('ZaloTtsClient - Config and Dynamic Fallback Readiness', () => {
  assert.ok(zaloTtsClient, 'zaloTtsClient must be defined');
  const apiKey = zaloTtsClient.getApiKey();
  assert.ok(apiKey && apiKey.length > 10, 'Zalo AI API key must be configured and valid');
  assert.equal(zaloTtsClient.getSpeed(), '0.8', 'Zalo AI TTS default speed must be set to 0.8 (matching master sprite)');
  assert.equal(typeof zaloTtsClient.fetchAudioBuffer, 'function');

  // Test chuẩn hóa tốc độ 1 chữ số thập phân
  zaloTtsClient.setSpeed('0.75');
  assert.equal(zaloTtsClient.getSpeed(), '0.8', 'setSpeed must normalize 0.75 to 0.8');
  zaloTtsClient.setSpeed('0.8');
});

import { parseVietnamesePhonics } from '../src/core/parser/vietnamesePhonics.ts';

test('Phonics & Dynamic Audio Pipeline for Grade 1 Word "mèo"', async () => {
  const breakdown = parseVietnamesePhonics('mèo');
  assert.equal(breakdown.raw, 'mèo');
  assert.equal(breakdown.initialConsonant, 'm');
  assert.equal(breakdown.rime, 'eo');
  assert.equal(breakdown.tone, 'huyen');
  assert.deepEqual(breakdown.spellingFormula, ['m', 'eo', 'meo', 'huyền', 'mèo']);

  // Kiểm tra cả từ chính 'mèo' và tiếng đệm 'meo' đều tải thành công từ Zalo TTS
  try {
    const meoBuffer = await zaloTtsClient.fetchAudioBuffer('meo');
    assert.ok(meoBuffer && meoBuffer.byteLength > 1000, 'Audio buffer for "meo" must be valid');
    const meoWordBuffer = await zaloTtsClient.fetchAudioBuffer('mèo');
    assert.ok(meoWordBuffer && meoWordBuffer.byteLength > 1000, 'Audio buffer for "mèo" must be valid');
  } catch (err) {
    if (err.message?.includes('fetch failed') || err.message?.includes('ENOTFOUND')) {
      console.warn('Network offline during live Zalo TTS test, skipped live assertion');
    } else {
      throw err;
    }
  }
});
