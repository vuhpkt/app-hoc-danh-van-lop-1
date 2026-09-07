import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVietnamesePhonics } from '../src/core/parser/vietnamesePhonics.ts';

test('Phonics Parser - Checked Syllables (p, t, c, ch) & Pedagogical Rules', async (t) => {
  await t.test('1. Checked syllables with THANH NẶNG must use sắc rime and sắc intermediate syllable', () => {
    // giặt -> gi - ắt - giắt - nặng - giặt
    const giat = parseVietnamesePhonics('giặt');
    assert.deepEqual(giat.spellingFormula, ['gi', 'ắt', 'giắt', 'nặng', 'giặt']);
    assert.equal(giat.spellingFormulaText, 'gi - ắt - giắt - nặng - giặt');

    // học -> h - óc - hóc - nặng - học
    const hoc = parseVietnamesePhonics('học');
    assert.deepEqual(hoc.spellingFormula, ['h', 'óc', 'hóc', 'nặng', 'học']);

    // vịt -> v - ít - vít - nặng - vịt
    const vit = parseVietnamesePhonics('vịt');
    assert.deepEqual(vit.spellingFormula, ['v', 'ít', 'vít', 'nặng', 'vịt']);

    // mặt -> m - ắt - mắt - nặng - mặt
    const mat = parseVietnamesePhonics('mặt');
    assert.deepEqual(mat.spellingFormula, ['m', 'ắt', 'mắt', 'nặng', 'mặt']);

    // quạt -> qu - át - quát - nặng - quạt
    const quat = parseVietnamesePhonics('quạt');
    assert.deepEqual(quat.spellingFormula, ['qu', 'át', 'quát', 'nặng', 'quạt']);

    // chuột -> ch - uốt - chuốt - nặng - chuột
    const chuot = parseVietnamesePhonics('chuột');
    assert.deepEqual(chuot.spellingFormula, ['ch', 'uốt', 'chuốt', 'nặng', 'chuột']);
  });

  await t.test('2. Checked syllables with THANH SẮC must have 3-step formula without duplicate sắc', () => {
    // bắt -> b - ắt - bắt
    const bat = parseVietnamesePhonics('bắt');
    assert.deepEqual(bat.spellingFormula, ['b', 'ắt', 'bắt']);
    assert.equal(bat.spellingFormulaText, 'b - ắt - bắt');

    // hát -> h - át - hát
    const hat = parseVietnamesePhonics('hát');
    assert.deepEqual(hat.spellingFormula, ['h', 'át', 'hát']);

    // sách -> s - ách - sách
    const sach = parseVietnamesePhonics('sách');
    assert.deepEqual(sach.spellingFormula, ['s', 'ách', 'sách']);

    // chích -> ch - ích - chích
    const chich = parseVietnamesePhonics('chích');
    assert.deepEqual(chich.spellingFormula, ['ch', 'ích', 'chích']);

    // quốc -> qu - ốc - quốc
    const quoc = parseVietnamesePhonics('quốc');
    assert.deepEqual(quoc.spellingFormula, ['qu', 'ốc', 'quốc']);
  });

  await t.test('3. Checked syllables without initial consonant', () => {
    // ít (sắc) -> đọc trơn
    const it = parseVietnamesePhonics('ít');
    assert.deepEqual(it.spellingFormula, ['ít']);

    // ịt (nặng) -> ít - nặng - ịt
    const itNang = parseVietnamesePhonics('ịt');
    assert.deepEqual(itNang.spellingFormula, ['ít', 'nặng', 'ịt']);

    // áp (sắc) -> đọc trơn
    const ap = parseVietnamesePhonics('áp');
    assert.deepEqual(ap.spellingFormula, ['áp']);

    // ạc (nặng) -> ác - nặng - ạc
    const acNang = parseVietnamesePhonics('ạc');
    assert.deepEqual(acNang.spellingFormula, ['ác', 'nặng', 'ạc']);
  });

  await t.test('4. Open and nasal syllables must follow standard rules', () => {
    // trường -> tr - ương - trương - huyền - trường
    const truong = parseVietnamesePhonics('trường');
    assert.deepEqual(truong.spellingFormula, ['tr', 'ương', 'trương', 'huyền', 'trường']);

    // chim -> ch - im - chim
    const chim = parseVietnamesePhonics('chim');
    assert.deepEqual(chim.spellingFormula, ['ch', 'im', 'chim']);

    // khuỷu -> kh - uyu - khuyu - hỏi - khuỷu
    const khuyu = parseVietnamesePhonics('khuỷu');
    assert.deepEqual(khuyu.spellingFormula, ['kh', 'uyu', 'khuyu', 'hỏi', 'khuỷu']);
  });
});
