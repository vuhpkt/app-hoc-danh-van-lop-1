import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALPHABET_LETTERS,
  COMPOUND_CONSONANTS,
  RIME_CATEGORIES,
  blendSoundWithPhonics
} from '../src/core/data/vietnameseAlphabet.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const mapPath = path.join(rootDir, 'public', 'audio', 'audio-map.json');

test('Vietnamese Alphabet & Phonics Lab Data Integrity (TDD)', async (t) => {
  const audioMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

  await t.test('1. ALPHABET_LETTERS chứa đúng 29 chữ cái tiếng Việt chuẩn', () => {
    assert.equal(ALPHABET_LETTERS.length, 29, `Phải có đúng 29 chữ cái, thực tế có ${ALPHABET_LETTERS.length}`);
    
    // 29 chữ cái tiếng Việt chuẩn
    const expectedLetters = [
      'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g',
      'h', 'i', 'k', 'l', 'm', 'n', 'o', 'ô', 'ơ', 'p',
      'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y'
    ];
    for (const exp of expectedLetters) {
      assert.ok(
        ALPHABET_LETTERS.some(l => l.letter === exp),
        `Bảng chữ cái phải chứa chữ "${exp}"`
      );
    }
  });

  await t.test('2. 100% 29 chữ cái đều có spriteKey hợp lệ và phát âm theo Âm', () => {
    for (const letter of ALPHABET_LETTERS) {
      assert.ok(letter.uppercase, `Chữ cái ${letter.uppercase} phải có uppercase`);
      assert.ok(letter.lowercase, `Chữ cái ${letter.uppercase} phải có lowercase`);
      assert.ok(letter.soundLabel, `Chữ cái ${letter.uppercase} phải có soundLabel`);
      assert.ok(letter.spriteKey, `Chữ cái ${letter.uppercase} phải có spriteKey`);

      // Kiểm tra spriteKey tồn tại trong audio-map.json
      const seg = audioMap[letter.spriteKey];
      assert.ok(seg, `Sprite key ${letter.spriteKey} của chữ ${letter.uppercase} phải tồn tại trong audio-map.json`);
      assert.ok(seg.duration >= 0.25, `Sprite key ${letter.spriteKey} phải có duration >= 0.25s (thực tế: ${seg.duration}s)`);

      // Quy chuẩn phát âm theo Âm:
      if (letter.type === 'consonant') {
        assert.ok(letter.spriteKey.startsWith('am_dau__'), `Phụ âm ${letter.uppercase} phải trỏ vào am_dau__* để phát âm bờ, cờ, dờ... (thực tế: ${letter.spriteKey})`);
        assert.ok(letter.soundLabel.endsWith('ờ') || letter.soundLabel === 'quờ' || letter.soundLabel === 'ca', `Nhãn âm của phụ âm ${letter.uppercase} phải là âm ("bờ", "cờ"...) hoặc tên chữ "ca", thực tế: ${letter.soundLabel}`);
      } else {
        assert.ok(letter.spriteKey.startsWith('van__'), `Nguyên âm ${letter.uppercase} phải trỏ vào van__* (thực tế: ${letter.spriteKey})`);
      }
    }
  });

  await t.test('3. COMPOUND_CONSONANTS chứa đúng 11 phụ âm ghép chuẩn SGK kèm âm học chuẩn', () => {
    assert.equal(COMPOUND_CONSONANTS.length, 11, `Phải có đúng 11 phụ âm ghép, thực tế có ${COMPOUND_CONSONANTS.length}`);
    const expectedCompounds = ['ch', 'gh', 'gi', 'kh', 'nh', 'ng', 'ngh', 'ph', 'qu', 'th', 'tr'];
    
    for (const comp of COMPOUND_CONSONANTS) {
      assert.ok(expectedCompounds.includes(comp.consonant), `Phụ âm ghép ${comp.consonant} không nằm trong danh sách SGK chuẩn`);
      assert.ok(comp.soundLabel, `Phụ âm ghép ${comp.consonant} phải có soundLabel`);
      assert.ok(comp.spriteKey, `Phụ âm ghép ${comp.consonant} phải có spriteKey`);
      assert.ok(comp.spriteKey.startsWith('am_dau__'), `Phụ âm ghép ${comp.consonant} phải dùng am_dau__*`);
      
      const seg = audioMap[comp.spriteKey];
      assert.ok(seg, `Sprite key ${comp.spriteKey} của phụ âm ghép ${comp.consonant} phải tồn tại trong audio-map.json`);
      assert.ok(seg.duration >= 0.25, `Sprite key ${comp.spriteKey} phải có duration >= 0.25s (thực tế: ${seg.duration}s)`);
    }

    // Kiểm tra đặc biệt: "gh" và "g" cùng phát âm là "gờ", "ngh" và "ng" cùng phát âm là "ngờ"
    const ghComp = COMPOUND_CONSONANTS.find(c => c.consonant === 'gh');
    assert.ok(ghComp, 'Phải có âm ghép "gh"');
    assert.equal(ghComp.soundLabel, 'gờ', 'Âm ghép "gh" phải phát âm là "gờ"');

    const nghComp = COMPOUND_CONSONANTS.find(c => c.consonant === 'ngh');
    assert.ok(nghComp, 'Phải có âm ghép "ngh"');
    assert.equal(nghComp.soundLabel, 'ngờ', 'Âm ghép "ngh" phải phát âm là "ngờ"');
  });

  await t.test('4. RIME_CATEGORIES chia theo 4 họ vần và 100% vần trỏ vào audio-map.json', () => {
    assert.equal(RIME_CATEGORIES.length, 4, `Phải có đúng 4 nhóm vần, thực tế: ${RIME_CATEGORIES.length}`);
    
    let totalRimes = 0;
    for (const group of RIME_CATEGORIES) {
      assert.ok(group.id, 'Nhóm vần phải có id');
      assert.ok(group.name, 'Nhóm vần phải có name');
      assert.ok(Array.isArray(group.rimes), `Nhóm vần ${group.name} phải chứa mảng rimes`);
      assert.ok(group.rimes.length > 0, `Nhóm vần ${group.name} không được rỗng`);

      for (const rimeItem of group.rimes) {
        totalRimes++;
        assert.ok(rimeItem.rime, 'Mục vần phải có rime');
        assert.ok(rimeItem.spriteKey, `Vần ${rimeItem.rime} phải có spriteKey`);
        assert.ok(audioMap[rimeItem.spriteKey], `Sprite key ${rimeItem.spriteKey} của vần ${rimeItem.rime} phải tồn tại trong audio-map.json`);

        // Kiểm tra công thức đánh vần bóc tách (spellingSteps)
        assert.ok(Array.isArray(rimeItem.spellingSteps), `Vần ${rimeItem.rime} phải có spellingSteps dạng mảng`);
        assert.ok(rimeItem.spellingSteps.length >= 1, `Vần ${rimeItem.rime} spellingSteps phải có ít nhất 1 bước`);
        
        for (const stepKey of rimeItem.spellingSteps) {
          assert.ok(audioMap[stepKey], `Bước ghép ${stepKey} trong công thức của vần ${rimeItem.rime} phải tồn tại trong audio-map.json`);
        }
      }
    }
    assert.ok(totalRimes >= 100, `Tổng số vần hỗ trợ phải >= 100 vần (thực tế: ${totalRimes})`);
  });

  await t.test('5. Khay Ghép Vần (Sound Blending): blendSoundWithPhonics tạo chuỗi âm thanh chính xác', () => {
    // Thử ghép "b" + "an" -> "ban"
    const blend1 = blendSoundWithPhonics('b', 'an');
    assert.ok(blend1, 'Phải tạo được kết quả ghép vần');
    assert.equal(blend1.blendedWord, 'ban');
    assert.deepEqual(blend1.audioSteps, ['am_dau__b', 'van__an', 'tu__ban_ngang']);
    assert.ok(audioMap[blend1.blendedWordKey], `Sprite key ${blend1.blendedWordKey} của từ ghép phải tồn tại trong audio-map.json`);

    // Thử ghép "c" + "a" -> "ca"
    const blend2 = blendSoundWithPhonics('c', 'a');
    assert.equal(blend2.blendedWord, 'ca');
    assert.deepEqual(blend2.audioSteps, ['am_dau__c', 'van__a', 'tu__ca']);

    // Thử ghép trường hợp từ chưa có sẵn trong master sprite (vẫn có đủ 3 bước để phát âm tiếng ghép)
    const blendUnknown = blendSoundWithPhonics('c', 'ang');
    assert.equal(blendUnknown.blendedWord, 'cang');
    assert.deepEqual(blendUnknown.audioSteps, ['am_dau__c', 'van__ang', 'cang']);
  });

  await t.test('6. Kiểm tra các bộ ghép âm mẫu (Presets) giải quyết 100% audio hợp lệ', () => {
    const samples = [
      { c: 'b', r: 'an' },
      { c: 'c', r: 'a' },
      { c: 'v', r: 'ui' },
      { c: 'm', r: 'e' },
      { c: 'ch', r: 'im' },
      { c: 'tr', r: 'ang' },
      { c: 'kh', r: 'ang' },
      { c: 'l', r: 'o' }
    ];

    for (const sample of samples) {
      const res = blendSoundWithPhonics(sample.c, sample.r);
      assert.ok(res.blendedWord, `Phải tạo được từ ghép cho ${sample.c} + ${sample.r}`);
      for (const step of res.audioSteps) {
        assert.ok(audioMap[step], `Step "${step}" trong mẫu ${sample.c}+${sample.r} phải tồn tại trong audio-map.json`);
      }
    }
  });

  await t.test('7. Tính độc lập giữa 17 phụ âm đơn và 11 phụ âm ghép', () => {
    const singleSet = new Set(ALPHABET_LETTERS.filter(l => l.type === 'consonant').map(l => l.letter));
    assert.equal(singleSet.size, 17, 'Phải có đúng 17 phụ âm đơn duy nhất');

    for (const comp of COMPOUND_CONSONANTS) {
      assert.ok(comp.consonant.length >= 2, `Phụ âm ghép ${comp.consonant} phải có độ dài >= 2`);
      assert.ok(!singleSet.has(comp.consonant), `Phụ âm ghép ${comp.consonant} không được trùng với phụ âm đơn`);
    }
  });

  await t.test('8. UI Contract: Không hiển thị badge "Nguyên âm/Phụ âm" và không có phiên âm gạch chéo /{soundLabel}/', () => {
    const letterCardCode = fs.readFileSync(path.join(rootDir, 'src', 'components', 'alphabet', 'LetterCard.tsx'), 'utf-8');
    assert.ok(!letterCardCode.includes("'Nguyên âm'"), 'LetterCard không được chứa chữ Nguyên âm');
    assert.ok(!letterCardCode.includes("'Phụ âm'"), 'LetterCard không được chứa chữ Phụ âm');
    assert.ok(!letterCardCode.includes('/{letter.soundLabel}/'), 'LetterCard không được chứa phiên âm gạch chéo /{letter.soundLabel}/');

    const pageCode = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'AlphabetLearningPage.tsx'), 'utf-8');
    assert.ok(!pageCode.includes("'vowel'"), 'AlphabetLearningPage không được chứa filter vowel');
    assert.ok(!pageCode.includes("'consonant'"), 'AlphabetLearningPage không được chứa filter consonant');
    assert.ok(!pageCode.includes('/{comp.soundLabel}/'), 'AlphabetLearningPage không được chứa phiên âm /{comp.soundLabel}/');
  });

  await t.test('9. Chữ "k" phát âm chuẩn "ca" (tên chữ cái ca), không đọc là "câu" hay "cờ"', () => {
    const kLetter = ALPHABET_LETTERS.find(l => l.letter === 'k');
    assert.ok(kLetter, 'Phải có chữ "k" trong ALPHABET_LETTERS');
    assert.equal(kLetter.soundLabel, 'ca', 'Chữ "k" phải có soundLabel là "ca"');
    
    const kSeg = audioMap[kLetter.spriteKey];
    assert.ok(kSeg, 'Sprite key của "k" phải tồn tại trong audio-map');
    assert.ok(kSeg.duration >= 0.25, `Thời lượng của âm "k" (${kSeg.duration}s) phải >= 0.25s`);

    const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'raw-audio', 'manifest.json'), 'utf-8'));
    const kManifest = manifest.find(m => m.key === 'am_dau__k');
    assert.ok(kManifest, 'am_dau__k phải có trong manifest.json');
    assert.equal(kManifest.text, 'ca', 'am_dau__k text trong manifest phải là "ca"');
  });

  await t.test('10. Nguyên âm "o" và "ô" phải hoàn toàn phân biệt, không bị trùng lặp âm thanh', () => {
    const oLetter = ALPHABET_LETTERS.find(l => l.letter === 'o');
    const oHatLetter = ALPHABET_LETTERS.find(l => l.letter === 'ô');
    assert.ok(oLetter && oHatLetter, 'Phải có cả chữ "o" và "ô"');

    const oSeg = audioMap[oLetter.spriteKey];
    const oHatSeg = audioMap[oHatLetter.spriteKey];
    assert.ok(oSeg && oHatSeg, 'Cả "o" và "ô" đều phải có toạ độ trong audio-map');

    // Kiểm tra hai tệp âm thanh trong raw-audio phải khác nhau về kích thước và nội dung
    const oFile = path.join(rootDir, 'raw-audio', 'van__o.mp3');
    const oHatFile = path.join(rootDir, 'raw-audio', 'van__o_hat.mp3');
    assert.ok(fs.existsSync(oFile), 'van__o.mp3 phải tồn tại');
    assert.ok(fs.existsSync(oHatFile), 'van__o_hat.mp3 phải tồn tại');

    const oBuf = fs.readFileSync(oFile);
    const oHatBuf = fs.readFileSync(oHatFile);
    assert.notEqual(oBuf.length, oHatBuf.length, 'Kích thước tệp âm thanh "o" và "ô" phải khác biệt');
  });

  await t.test('11. blendSoundWithPhonics phải luôn có đủ 3 bước âm thanh [âm đầu, vần, tiếng ghép]', () => {
    const blendBa = blendSoundWithPhonics('b', 'a');
    assert.equal(blendBa.blendedWord, 'ba');
    assert.equal(blendBa.audioSteps.length, 3, 'Phải có đủ 3 bước: âm đầu, vần, và tiếng ghép');
    assert.deepEqual(blendBa.audioSteps, ['am_dau__b', 'van__a', 'ba']);

    const blendCa = blendSoundWithPhonics('c', 'a');
    assert.equal(blendCa.blendedWord, 'ca');
    assert.equal(blendCa.audioSteps.length, 3);
    assert.deepEqual(blendCa.audioSteps, ['am_dau__c', 'van__a', 'tu__ca']);
  });
});


