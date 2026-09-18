import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';
import { parseVietnamesePhonics } from '../src/core/parser/vietnamesePhonics.ts';
import { SpriteManager } from '../src/core/audio/SpriteManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

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
  return { sampleCount, samples, duration: sampleCount / 24000 };
}

test('Phonics Parser - Checked Syllables (p, t, c, ch) & Pedagogical Rules', async (t) => {
  await t.test('1. Checked syllables with THANH NẶNG must decompose 5 steps with unaccented rime and base word', () => {
    // giặt -> gi - ăt - giăt - nặng - giặt
    const giat = parseVietnamesePhonics('giặt');
    assert.deepEqual(giat.spellingFormula, ['gi', 'ăt', 'giăt', 'nặng', 'giặt']);
    assert.equal(giat.spellingFormulaText, 'gi - ăt - giăt - nặng - giặt');

    // học -> h - oc - hoc - nặng - học
    const hoc = parseVietnamesePhonics('học');
    assert.deepEqual(hoc.spellingFormula, ['h', 'oc', 'hoc', 'nặng', 'học']);

    // vịt -> v - it - vit - nặng - vịt
    const vit = parseVietnamesePhonics('vịt');
    assert.deepEqual(vit.spellingFormula, ['v', 'it', 'vit', 'nặng', 'vịt']);

    // mặt -> m - ăt - măt - nặng - mặt
    const mat = parseVietnamesePhonics('mặt');
    assert.deepEqual(mat.spellingFormula, ['m', 'ăt', 'măt', 'nặng', 'mặt']);

    // quạt -> qu - at - quat - nặng - quạt
    const quat = parseVietnamesePhonics('quạt');
    assert.deepEqual(quat.spellingFormula, ['qu', 'at', 'quat', 'nặng', 'quạt']);

    // chuột -> ch - uôt - chuôt - nặng - chuột
    const chuot = parseVietnamesePhonics('chuột');
    assert.deepEqual(chuot.spellingFormula, ['ch', 'uôt', 'chuôt', 'nặng', 'chuột']);
  });

  await t.test('2. Checked syllables with THANH SẮC must decompose 5 steps with unaccented rime and base word', () => {
    // bắt -> b - ăt - băt - sắc - bắt
    const bat = parseVietnamesePhonics('bắt');
    assert.deepEqual(bat.spellingFormula, ['b', 'ăt', 'băt', 'sắc', 'bắt']);
    assert.equal(bat.spellingFormulaText, 'b - ăt - băt - sắc - bắt');

    // hát -> h - at - hat - sắc - hát
    const hat = parseVietnamesePhonics('hát');
    assert.deepEqual(hat.spellingFormula, ['h', 'at', 'hat', 'sắc', 'hát']);

    // sách -> s - ach - sach - sắc - sách
    const sach = parseVietnamesePhonics('sách');
    assert.deepEqual(sach.spellingFormula, ['s', 'ach', 'sach', 'sắc', 'sách']);

    // chích -> ch - ich - chich - sắc - chích
    const chich = parseVietnamesePhonics('chích');
    assert.deepEqual(chich.spellingFormula, ['ch', 'ich', 'chich', 'sắc', 'chích']);

    // quốc -> qu - ôc - quôc - sắc - quốc
    const quoc = parseVietnamesePhonics('quốc');
    assert.deepEqual(quoc.spellingFormula, ['qu', 'ôc', 'quôc', 'sắc', 'quốc']);
  });

  await t.test('3. Checked syllables without initial consonant with tone marks', () => {
    // ít (sắc) -> it - sắc - ít
    const it = parseVietnamesePhonics('ít');
    assert.deepEqual(it.spellingFormula, ['it', 'sắc', 'ít']);

    // ịt (nặng) -> it - nặng - ịt
    const itNang = parseVietnamesePhonics('ịt');
    assert.deepEqual(itNang.spellingFormula, ['it', 'nặng', 'ịt']);

    // áp (sắc) -> ap - sắc - áp
    const ap = parseVietnamesePhonics('áp');
    assert.deepEqual(ap.spellingFormula, ['ap', 'sắc', 'áp']);

    // ạc (nặng) -> ac - nặng - ạc
    const acNang = parseVietnamesePhonics('ạc');
    assert.deepEqual(acNang.spellingFormula, ['ac', 'nặng', 'ạc']);
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

test('Dataset Audit - Zero Garbage Words in Manifest & Audio Catalog', async (t) => {
  await t.test('1. Manifest must NOT contain non-words or unaccented checked syllables', () => {
    const manifestPath = path.join(rootDir, 'raw-audio', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check for garbage keys
    const giatNgang = manifest.find((item) => item.key === 'tu__giat_ngang');
    assert.equal(giatNgang, undefined, 'tu__giat_ngang (giăt) must be completely removed');

    // Forbidden unaccented checked rimes (non-words without tone marks)
    const FORBIDDEN_NON_WORDS = new Set(['giăt', 'ăt', 'ăc', 'âc', 'ăp', 'âp', 'oăt', 'oăc']);

    for (const item of manifest) {
      assert.ok(
        !FORBIDDEN_NON_WORDS.has(item.text),
        `Found forbidden non-word in manifest: key="${item.key}", text="${item.text}"`
      );
    }
  });

  await t.test('2. All checked rimes in manifest must carry acute (sắc) mark for proper TTS', () => {
    const manifestPath = path.join(rootDir, 'raw-audio', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const manifestMap = new Map(manifest.map((item) => [item.key, item.text]));

    assert.equal(manifestMap.get('van__a_breve_t'), 'ắt', 'van__a_breve_t must be ắt');
    assert.equal(manifestMap.get('van__a_hat_t'), 'ất', 'van__a_hat_t must be ất');
    assert.equal(manifestMap.get('van__a_breve_c'), 'ắc', 'van__a_breve_c must be ắc');
    assert.equal(manifestMap.get('van__a_hat_c'), 'ấc', 'van__a_hat_c must be ấc');
    assert.equal(manifestMap.get('van__a_breve_p'), 'ắp', 'van__a_breve_p must be ắp');
    assert.equal(manifestMap.get('van__a_hat_p'), 'ấp', 'van__a_hat_p must be ấp');
    assert.equal(manifestMap.get('van__oat_breve'), 'oắt', 'van__oat_breve must be oắt');
    assert.equal(manifestMap.get('van__oac_breve'), 'oắc', 'van__oac_breve must be oắc');
    assert.equal(manifestMap.get('tu__giat_sac'), 'giắt', 'tu__giat_sac must be giắt');
  });
});

test('Sprite Mapping & Audio Map Resolution - 100% Coverage for Grade 1 Core Words', async (t) => {
  const audioMapPath = path.join(rootDir, 'public', 'audio', 'audio-map.json');
  assert.ok(fs.existsSync(audioMapPath), 'public/audio/audio-map.json must exist');
  const audioMap = JSON.parse(fs.readFileSync(audioMapPath, 'utf-8'));
  const sm = SpriteManager.getInstance();

  const TEST_WORDS = [
    'giặt', 'học', 'vịt', 'mặt', 'quạt', 'chuột',
    'bắt', 'hát', 'sách', 'chích', 'quốc',
    'trường', 'chim', 'hoa', 'mẹ', 'bé', 'bạn',
    'khuỷu', 'ít', 'ịt', 'áp', 'ạc',
  ];

  await t.test('1. Every step in spelling formula of all test words resolves to an audio-map segment', () => {
    for (const word of TEST_WORDS) {
      const breakdown = parseVietnamesePhonics(word);
      for (const step of breakdown.spellingFormula) {
        const spriteKey = sm.resolveSpriteKey(step);
        assert.ok(spriteKey, `Could not resolve sprite key for step "${step}" in word "${word}"`);
        const segment = audioMap[spriteKey];
        assert.ok(segment, `Sprite key "${spriteKey}" (step "${step}") not found in audio-map.json`);
        assert.ok(segment.duration > 0.1, `Segment duration for "${spriteKey}" is too short: ${segment.duration}s`);
      }
    }
  });

  await t.test('2. 100% of words in all 4 Grade 1 sample poems resolve in audio-map for Fluent Karaoke', () => {
    assert.equal(sm.resolveSpriteKey('em'), 'tu__em', "Từ 'em' trong bài đọc phải ánh xạ đến 'tu__em'");
    assert.equal(sm.resolveSpriteKey('lo'), 'tu__lo', "Từ 'lo' trong bài đọc phải ánh xạ đến 'tu__lo'");

    const SAMPLE_POEMS_TEXTS = [
      'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ.',
      'Ve vẻ vè ve. Cái vè chim chích. Bắt sâu đầu cành. Giúp ích cho cây.',
      'Bé ngoan bé học chăm chỉ. Cô giáo khen bé hoa điểm mười.',
      'Bé giặt khăn sạch. Chú vịt bơi nhanh. Bé gập khuỷu tay. Bắt con cá nhỏ.',
    ];

    for (const poem of SAMPLE_POEMS_TEXTS) {
      const words = poem.split(/\s+/).map((w) => w.replace(/[,.!?:;]/g, '').trim()).filter(Boolean);
      for (const word of words) {
        const spriteKey = sm.resolveSpriteKey(word);
        assert.ok(spriteKey, `Could not resolve sprite key for poem word: "${word}"`);
        const segment = audioMap[spriteKey];
        assert.ok(segment, `Poem word "${word}" (key: "${spriteKey}") not found in audio-map.json`);
      }
    }
  });
});

test('Acoustic Quality Verification for Master Audio Clips', async (t) => {
  const tempWav = path.join(__dirname, 'temp_verify_pedagogy.wav');

  const CLIPS_TO_VERIFY = [
    { filename: 'van__a_breve_t.mp3', label: 'ắt' },
    { filename: 'tu__giat_sac.mp3', label: 'giắt' },
    { filename: 'tu__giat.mp3', label: 'giặt' },
    { filename: 'tu__em.mp3', label: 'em' },
    { filename: 'tu__lo.mp3', label: 'lo' },
  ];

  for (const { filename, label } of CLIPS_TO_VERIFY) {
    await t.test(`Acoustic verify for ${filename} ("${label}")`, () => {
      const filePath = path.join(rootDir, 'raw-audio', filename);
      assert.ok(fs.existsSync(filePath), `File ${filename} must exist`);

      execSync(`"${ffmpegPath}" -y -i "${filePath}" -ar 24000 -ac 1 -c:a pcm_s16le "${tempWav}"`, { stdio: 'pipe' });
      const buf = fs.readFileSync(tempWav);
      const { sampleCount, samples, duration } = extractPcmFromWav(buf);

      assert.ok(sampleCount > 0, 'WAV has no samples');
      assert.ok(duration >= 0.30 && duration <= 1.50, `Duration ${duration.toFixed(3)}s out of bounds`);

      let maxAmp = 0;
      for (let i = 0; i < sampleCount; i++) {
        const amp = Math.abs(samples[i]);
        if (amp > maxAmp) maxAmp = amp;
      }

      assert.ok(maxAmp >= 0.20, `Peak amplitude ${maxAmp.toFixed(3)} is too low`);
      assert.ok(maxAmp <= 1.0, `Peak amplitude ${maxAmp.toFixed(3)} has clipping`);
    });
  }

  if (fs.existsSync(tempWav)) {
    fs.unlinkSync(tempWav);
  }
});
