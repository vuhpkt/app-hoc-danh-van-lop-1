import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUnicode,
  removePageNumbersAndHeaders,
  cleanOcrArtifacts,
  preservePoemStructure,
  sanitizeOcrText,
} from '../src/core/ocr/textSanitizer.ts';

test('TextSanitizer - Unicode Normalization (NFD to NFC)', () => {
  // Test decomposed NFD string vs canonical NFC
  const nfdText = 'Tr\u01B0\u01A1\u0300ng ho\u0323c cu\u0309a em'; // Trường học của em in NFD
  const normalized = normalizeUnicode(nfdText);

  assert.equal(normalized, 'Trường học của em');
  assert.equal(normalized.length, 'Trường học của em'.length);
});

test('TextSanitizer - Page Numbers and Textbook Header/Footer Stripping', () => {
  const inputWithHeaders = `
Trang 45
BÀI 1: TRƯỜNG HỌC CỦA EM
Trường học của em khang trang.
Tiếng chim hót líu lo trên cành cây.
45
  `;

  const cleaned = removePageNumbersAndHeaders(inputWithHeaders);
  assert.ok(!cleaned.includes('Trang 45'), 'Should strip "Trang 45"');
  assert.ok(!cleaned.includes('BÀI 1:'), 'Should strip lesson heading "BÀI 1:"');
  assert.ok(!cleaned.match(/\b45\b/), 'Should strip standalone page number 45');
  assert.ok(cleaned.includes('Trường học của em khang trang.'));
  assert.ok(cleaned.includes('Tiếng chim hót líu lo trên cành cây.'));
});

test('TextSanitizer - OCR Noise and Artifact Cleaning', () => {
  const noisyOcr = `| Bé xem cá ~vàng. | Cá _vàng bơi [trong] bể nước^. {Mẹ} khen *bé* ngoan! #`;
  const cleaned = cleanOcrArtifacts(noisyOcr);

  assert.equal(cleaned, 'Bé xem cá vàng. Cá vàng bơi trong bể nước. Mẹ khen bé ngoan!');
});

test('TextSanitizer - Poem Line Breaks and Stanzas Preservation', () => {
  const poemRaw = `
    Ve vẻ vè ve.   
    
    Cái vè chim chích.   
    Bắt sâu đầu cành.   
    Giúp ích cho cây.   
  `;

  const lines = preservePoemStructure(poemRaw);
  assert.equal(lines.length, 4);
  assert.equal(lines[0], 'Ve vẻ vè ve.');
  assert.equal(lines[1], 'Cái vè chim chích.');
  assert.equal(lines[2], 'Bắt sâu đầu cành.');
  assert.equal(lines[3], 'Giúp ích cho cây.');
});

test('TextSanitizer - Full Pipeline (sanitizeOcrText)', () => {
  const messyScan = `
    TRANG 12 - TIẾNG VIỆT 1
    BÀI 2: VÈ CHIM CHÍCH
    
    | Ve vẻ vè ve. ~
    Cái vè chim chích.
    Bắt sâu đầu cành. _
    Giúp ích cho cây. ^
    
    12
  `;

  const result = sanitizeOcrText(messyScan);

  assert.ok(result.cleanedText.includes('Ve vẻ vè ve.'));
  assert.ok(result.cleanedText.includes('Cái vè chim chích.'));
  assert.ok(!result.cleanedText.includes('TRANG 12'));
  assert.ok(!result.cleanedText.includes('BÀI 2:'));
  assert.ok(!result.cleanedText.includes('|'));
  assert.ok(!result.cleanedText.includes('~'));

  assert.equal(result.lines.length, 4);
  assert.ok(result.uniqueWords.includes('ve'));
  assert.ok(result.uniqueWords.includes('chim'));
  assert.ok(result.uniqueWords.includes('chích'));
  assert.ok(result.uniqueWords.includes('cây'));
});
