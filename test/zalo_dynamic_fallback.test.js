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
  assert.equal(zaloTtsClient.getSpeed(), '0.8', 'Zalo AI TTS default speed must be set to 0.8 for Grade 1 kids');
  assert.equal(typeof zaloTtsClient.fetchAudioBuffer, 'function');
});
