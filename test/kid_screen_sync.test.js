import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioSpritePlayer } from '../src/core/audio/AudioSpritePlayer.ts';
import { tokenizeVietnameseText } from '../src/core/parser/vietnamesePhonics.ts';

test('Kid Learning Screen & Audio Timing Sync', async (t) => {
  await t.test('1. Inter-word gap calculation respects 0.8x standard and punctuation pauses', () => {
    // Standard speed 0.8x
    const normalGap08 = AudioSpritePlayer.calculateInterWordGap(0.8);
    assert.strictEqual(normalGap08, 310, 'Normal gap at 0.8x speed should be 310ms');

    // Slow speed 0.6x
    const normalGap06 = AudioSpritePlayer.calculateInterWordGap(0.6);
    assert.strictEqual(normalGap06, 460, 'Normal gap at 0.6x speed should be 460ms');

    // Comma pause (+150ms)
    const commaGap = AudioSpritePlayer.calculateInterWordGap(0.8, ',');
    assert.strictEqual(commaGap, 460, 'Comma pause should add 150ms gap (310 + 150 = 460ms)');

    // Period / exclamation / question pause (+320ms)
    const periodGap = AudioSpritePlayer.calculateInterWordGap(0.8, '.');
    assert.strictEqual(periodGap, 630, 'Period pause should add 320ms gap (310 + 320 = 630ms)');

    // Newline pause in poems (+320ms)
    const newlineGap = AudioSpritePlayer.calculateInterWordGap(0.8, '\n');
    assert.strictEqual(newlineGap, 630, 'Newline poem break should add 320ms gap (310 + 320 = 630ms)');
  });

  await t.test('2. Syllable tokens mapping maintains exact index alignment with poem newlines', () => {
    const poem = 'Ve vẻ vè ve\nCái vè chim chích\nBắt sâu đầu cành\nGiúp ích cho cây.';
    const tokens = tokenizeVietnameseText(poem);

    const syllablesOnly = tokens.filter((t) => t.type === 'syllable');
    assert.strictEqual(syllablesOnly.length, 16, 'Poem has 16 syllables');

    // Ensure first syllable of second line has index 4
    assert.strictEqual(syllablesOnly[4].text, 'Cái');

    // Check sentence words packaging preserves punctuation context
    const packagedWords = AudioSpritePlayer.packageTokensForPlayback(tokens);
    assert.strictEqual(packagedWords.length, 16);
    assert.strictEqual(packagedWords[3].text, 've');
    assert.strictEqual(packagedWords[3].punctuationAfter, '\n');
    assert.strictEqual(packagedWords[7].text, 'chích');
    assert.strictEqual(packagedWords[7].punctuationAfter, '\n');
    assert.strictEqual(packagedWords[15].text, 'cây');
    assert.strictEqual(packagedWords[15].punctuationAfter, '.');
  });

  await t.test('3. Grade 1 textbook lessons extraction and sync readiness', () => {
    const lesson1Text = 'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ.';
    const words = AudioSpritePlayer.packageTokensForPlayback(tokenizeVietnameseText(lesson1Text));
    assert.ok(words.length >= 16);
    // Khang trang period after
    const trangWord = words.find((w) => w.text.toLowerCase() === 'trang');
    assert.ok(trangWord, 'trang should exist');
    assert.strictEqual(trangWord.punctuationAfter, '.');
  });
});
