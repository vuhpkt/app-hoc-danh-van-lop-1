import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseVietnamesePhonics } from '../src/core/parser/vietnamesePhonics.ts';

describe('Phonics 5-Step Formula Verification (SGK Kết Nối Tri Thức)', () => {
  it('1. Từ "lớp" phải phân rã chuẩn 5 bước: l - ơp - lơp - sắc - lớp', () => {
    const result = parseVietnamesePhonics('lớp');
    assert.deepEqual(result.spellingFormula, ['l', 'ơp', 'lơp', 'sắc', 'lớp']);
    assert.equal(result.spellingFormulaText, 'l - ơp - lơp - sắc - lớp');
  });

  it('2. Âm tiết khép tắc (p, t, c, ch) mang thanh SẮC phải phân rã 5 bước với vần không dấu và tiếng thanh ngang', () => {
    const bat = parseVietnamesePhonics('bắt');
    assert.deepEqual(bat.spellingFormula, ['b', 'ăt', 'băt', 'sắc', 'bắt']);
    assert.equal(bat.spellingFormulaText, 'b - ăt - băt - sắc - bắt');

    const hat = parseVietnamesePhonics('hát');
    assert.deepEqual(hat.spellingFormula, ['h', 'at', 'hat', 'sắc', 'hát']);
    assert.equal(hat.spellingFormulaText, 'h - at - hat - sắc - hát');

    const sach = parseVietnamesePhonics('sách');
    assert.deepEqual(sach.spellingFormula, ['s', 'ach', 'sach', 'sắc', 'sách']);
    assert.equal(sach.spellingFormulaText, 's - ach - sach - sắc - sách');

    const chich = parseVietnamesePhonics('chích');
    assert.deepEqual(chich.spellingFormula, ['ch', 'ich', 'chich', 'sắc', 'chích']);
    assert.equal(chich.spellingFormulaText, 'ch - ich - chich - sắc - chích');
  });

  it('3. Âm tiết khép tắc mang thanh NẶNG phải phân rã 5 bước với vần không dấu và tiếng thanh ngang (không dùng tiếng đệm sắc cũ)', () => {
    const hoc = parseVietnamesePhonics('học');
    assert.deepEqual(hoc.spellingFormula, ['h', 'oc', 'hoc', 'nặng', 'học']);
    assert.equal(hoc.spellingFormulaText, 'h - oc - hoc - nặng - học');

    const giat = parseVietnamesePhonics('giặt');
    assert.deepEqual(giat.spellingFormula, ['gi', 'ăt', 'giăt', 'nặng', 'giặt']);
    assert.equal(giat.spellingFormulaText, 'gi - ăt - giăt - nặng - giặt');

    const vit = parseVietnamesePhonics('vịt');
    assert.deepEqual(vit.spellingFormula, ['v', 'it', 'vit', 'nặng', 'vịt']);
    assert.equal(vit.spellingFormulaText, 'v - it - vit - nặng - vịt');

    const mat = parseVietnamesePhonics('mặt');
    assert.deepEqual(mat.spellingFormula, ['m', 'ăt', 'măt', 'nặng', 'mặt']);
    assert.equal(mat.spellingFormulaText, 'm - ăt - măt - nặng - mặt');
  });

  it('4. Âm tiết khép tắc khuyết âm đầu có thanh điệu', () => {
    const ap = parseVietnamesePhonics('áp');
    assert.deepEqual(ap.spellingFormula, ['ap', 'sắc', 'áp']);
    assert.equal(ap.spellingFormulaText, 'ap - sắc - áp');

    const it = parseVietnamesePhonics('ít');
    assert.deepEqual(it.spellingFormula, ['it', 'sắc', 'ít']);
    assert.equal(it.spellingFormulaText, 'it - sắc - ít');

    const itNang = parseVietnamesePhonics('ịt');
    assert.deepEqual(itNang.spellingFormula, ['it', 'nặng', 'ịt']);
    assert.equal(itNang.spellingFormulaText, 'it - nặng - ịt');

    const acNang = parseVietnamesePhonics('ạc');
    assert.deepEqual(acNang.spellingFormula, ['ac', 'nặng', 'ạc']);
    assert.equal(acNang.spellingFormulaText, 'ac - nặng - ạc');
  });

  it('5. Âm tiết mở và bán âm mang thanh điệu giữ nguyên chuẩn 5 bước', () => {
    const truong = parseVietnamesePhonics('trường');
    assert.deepEqual(truong.spellingFormula, ['tr', 'ương', 'trương', 'huyền', 'trường']);

    const be = parseVietnamesePhonics('bé');
    assert.deepEqual(be.spellingFormula, ['b', 'e', 'be', 'sắc', 'bé']);

    const veHoi = parseVietnamesePhonics('vẻ');
    assert.deepEqual(veHoi.spellingFormula, ['v', 'e', 've', 'hỏi', 'vẻ']);
  });

  it('6. Âm tiết thanh ngang (không dấu)', () => {
    const chim = parseVietnamesePhonics('chim');
    assert.deepEqual(chim.spellingFormula, ['ch', 'im', 'chim']);
    assert.equal(chim.spellingFormulaText, 'ch - im - chim');

    const lo = parseVietnamesePhonics('lo');
    assert.deepEqual(lo.spellingFormula, ['l', 'o', 'lo']);

    const em = parseVietnamesePhonics('em');
    assert.deepEqual(em.spellingFormula, ['em']);
    assert.equal(em.spellingFormulaText, 'em (đọc trơn)');
  });

  it('7. Mọi bước trong công thức của từ "lớp" đều giải mã thành công sprite key hợp lệ trong Master Sprite', async () => {
    const fs = await import('node:fs');
    const { SpriteManager } = await import('../src/core/audio/SpriteManager.ts');
    const sm = SpriteManager.getInstance();
    const audioMap = JSON.parse(fs.readFileSync('public/audio/audio-map.json', 'utf-8'));

    const result = parseVietnamesePhonics('lớp');
    assert.deepEqual(result.spellingFormula, ['l', 'ơp', 'lơp', 'sắc', 'lớp']);

    for (const step of result.spellingFormula) {
      const key = sm.resolveSpriteKey(step);
      assert.ok(key, `Step "${step}" phải giải mã được sprite key`);
      assert.ok(audioMap[key], `Sprite key "${key}" cho step "${step}" phải có toạ độ trong audio-map.json`);
    }
  });

  it('8. Âm tiết bắt đầu bằng "gi" đi với nguyên âm đôi "iê" phân rã đúng vần "iê..." (giết, giếc, giền, giếng)', () => {
    const giet = parseVietnamesePhonics('giết');
    assert.equal(giet.initialConsonant, 'gi');
    assert.equal(giet.rime, 'iêt');
    assert.deepEqual(giet.spellingFormula, ['gi', 'iêt', 'giêt', 'sắc', 'giết']);

    const giec = parseVietnamesePhonics('giếc');
    assert.equal(giec.initialConsonant, 'gi');
    assert.equal(giec.rime, 'iêc');
    assert.deepEqual(giec.spellingFormula, ['gi', 'iêc', 'giêc', 'sắc', 'giếc']);

    const gien = parseVietnamesePhonics('giền');
    assert.equal(gien.initialConsonant, 'gi');
    assert.equal(gien.rime, 'iên');
    assert.deepEqual(gien.spellingFormula, ['gi', 'iên', 'giên', 'huyền', 'giền']);

    const gieng = parseVietnamesePhonics('giếng');
    assert.equal(gieng.initialConsonant, 'gi');
    assert.equal(gieng.rime, 'iêng');
    assert.deepEqual(gieng.spellingFormula, ['gi', 'iêng', 'giêng', 'sắc', 'giếng']);
  });
});

