import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('Audio Dataset Coverage & Integrity', async (t) => {
  const spriteFilePath = path.join(rootDir, 'src', 'core', 'audio', 'SpriteManager.ts');
  const zaloScriptPath = path.join(rootDir, 'scripts', 'generate-zalo-tts.js');

  const spriteContent = fs.readFileSync(spriteFilePath, 'utf-8');
  const zaloContent = fs.readFileSync(zaloScriptPath, 'utf-8');

  // Lấy danh sách các target sprite keys từ SpriteManager.ts
  const spriteKeyMatches = [...spriteContent.matchAll(/:\s*'([a-z0-9_]+)'/g)].map(m => m[1]);
  const targetSpriteKeys = Array.from(
    new Set(spriteKeyMatches.filter(k => 
      k.startsWith('am_dau__') || k.startsWith('van__') || k.startsWith('thanh__') || k.startsWith('tu__')
    ))
  );

  // Lấy danh sách các keys được định nghĩa trong generate-zalo-tts.js
  const zaloKeyMatches = [...zaloContent.matchAll(/key:\s*'([a-z0-9_]+)'/g)].map(m => m[1]);

  await t.test('generate-zalo-tts.js phải chứa đủ 280 mục âm thanh chuẩn', () => {
    assert.equal(
      zaloKeyMatches.length,
      280,
      `Kỳ vọng có đúng 280 keys trong generate-zalo-tts.js, nhưng hiện tại có ${zaloKeyMatches.length}`
    );
  });

  await t.test('Không được có key bị trùng lặp trong AUDIO_DATASET của generate-zalo-tts.js', () => {
    const keySet = new Set();
    const duplicates = [];
    for (const k of zaloKeyMatches) {
      if (keySet.has(k)) duplicates.push(k);
      keySet.add(k);
    }
    assert.deepEqual(duplicates, [], `Phát hiện keys bị trùng: ${duplicates.join(', ')}`);
  });

  await t.test('Toàn bộ target keys trong SpriteManager.ts (bao gồm tu__hoi) phải có trong generate-zalo-tts.js', () => {
    const missingKeys = targetSpriteKeys.filter(k => !zaloKeyMatches.includes(k));
    assert.deepEqual(
      missingKeys,
      [],
      `Các keys có trong SpriteManager nhưng thiếu trong generate-zalo-tts.js: ${missingKeys.join(', ')}`
    );
  });

  await t.test('Từ vựng "cây" (tu__cay) và "hỏi" (tu__hoi) phải được định nghĩa chuẩn xác', () => {
    assert.ok(zaloContent.includes("key: 'tu__cay'"), "Phải có key 'tu__cay'");
    assert.ok(zaloContent.includes("key: 'tu__hoi'"), "Phải có key 'tu__hoi'");
  });
});
