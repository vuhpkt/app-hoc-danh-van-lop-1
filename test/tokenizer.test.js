import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeVietnameseText } from '../src/core/parser/vietnamesePhonics.ts';

test('Tokenizer - Vietnamese Multiline and Punctuation Processing', async (t) => {
  await t.test('1. Separates punctuation from words without altering phonics', () => {
    const text = 'Bé tập đọc, bé rất ngoan!';
    const tokens = tokenizeVietnameseText(text);

    // Lọc ra các từ phát âm
    const syllables = tokens.filter((t) => t.type === 'syllable');
    const puncts = tokens.filter((t) => t.type === 'punctuation');

    assert.deepEqual(
      syllables.map((s) => s.text),
      ['Bé', 'tập', 'đọc', 'bé', 'rất', 'ngoan']
    );

    // Từ 'đọc' không được dính dấu phẩy
    const docToken = syllables.find((s) => s.text === 'đọc');
    assert.ok(docToken, 'Word "đọc" must exist');
    assert.equal(docToken.phonics?.clean, 'đọc');
    assert.equal(docToken.phonics?.tone, 'nang');

    // Dấu phẩy và chấm than phải là token punctuation
    assert.ok(puncts.some((p) => p.text === ','));
    assert.ok(puncts.some((p) => p.text === '!'));
  });

  await t.test('2. Preserves newline tokens (\\n) for poems and paragraphs', () => {
    const poem = 'Ve vẻ vè ve\nCái vè chim chích.\nBắt sâu đầu cành\nGiúp ích cho cây.';
    const tokens = tokenizeVietnameseText(poem);

    const newlines = tokens.filter((t) => t.type === 'newline');
    assert.equal(newlines.length, 3, 'Must have exactly 3 newline tokens for 4 lines of poem');

    // Dòng 1: Ve vẻ vè ve
    const firstNewlineIdx = tokens.findIndex((t) => t.type === 'newline');
    const line1Tokens = tokens.slice(0, firstNewlineIdx).filter((t) => t.type === 'syllable');
    assert.deepEqual(
      line1Tokens.map((t) => t.text),
      ['Ve', 'vẻ', 'vè', 've']
    );

    // Dòng 2: 'Cái vè chim chích.' có dấu chấm tách riêng
    const line2Words = tokens
      .filter((t) => t.type === 'syllable')
      .slice(4, 8)
      .map((t) => t.text);
    assert.deepEqual(line2Words, ['Cái', 'vè', 'chim', 'chích']);
  });

  await t.test('3. Handles mixed whitespace, trailing spaces and empty lines cleanly', () => {
    const dirtyText = '  Em yêu   trường em! \n\n  Có hàng cây xanh.  ';
    const tokens = tokenizeVietnameseText(dirtyText);

    const words = tokens.filter((t) => t.type === 'syllable').map((t) => t.text);
    assert.deepEqual(words, ['Em', 'yêu', 'trường', 'em', 'Có', 'hàng', 'cây', 'xanh']);

    // Không sinh ra token syllable rỗng
    for (const token of tokens) {
      if (token.type === 'syllable') {
        assert.ok(token.text.trim().length > 0, 'Syllable text must not be empty');
        assert.ok(token.phonics, 'Every syllable must have phonics breakdown');
      }
    }
  });
});
