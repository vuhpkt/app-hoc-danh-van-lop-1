import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('Master Audio Sprite Integrity & Acoustic Quality', async (t) => {
  const publicAudioDir = path.join(rootDir, 'public', 'audio');
  const mp3Path = path.join(publicAudioDir, 'sprite-main.mp3');
  const webmPath = path.join(publicAudioDir, 'sprite-main.webm');
  const mapPath = path.join(publicAudioDir, 'audio-map.json');

  await t.test('Các file Master Audio Sprite phải tồn tại với kích thước hợp lệ', () => {
    assert.ok(fs.existsSync(mp3Path), 'Phải có file public/audio/sprite-main.mp3');
    const mp3Stats = fs.statSync(mp3Path);
    assert.ok(mp3Stats.size > 500000, `Kích thước MP3 phải > 500KB (thực tế: ${mp3Stats.size} bytes)`);

    assert.ok(fs.existsSync(webmPath), 'Phải có file public/audio/sprite-main.webm');
    const webmStats = fs.statSync(webmPath);
    assert.ok(webmStats.size > 300000, `Kích thước WebM phải > 300KB (thực tế: ${webmStats.size} bytes)`);

    assert.ok(fs.existsSync(mapPath), 'Phải có file public/audio/audio-map.json');
  });

  const audioMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  const entries = Object.entries(audioMap);

  await t.test('audio-map.json phải có đúng 282 mục âm thanh chuẩn', () => {
    assert.equal(entries.length, 282, `Kỳ vọng 282 mục, thực tế có ${entries.length}`);
  });

  await t.test('Mọi mục trong audio-map.json phải có toạ độ thời gian chuẩn xác, start < end', () => {
    for (const [key, seg] of entries) {
      assert.ok(typeof seg.start === 'number', `Key ${key} phải có start dạng số`);
      assert.ok(typeof seg.end === 'number', `Key ${key} phải có end dạng số`);
      assert.ok(typeof seg.duration === 'number', `Key ${key} phải có duration dạng số`);
      assert.ok(seg.start >= 0, `Key ${key} start phải >= 0`);
      assert.ok(seg.end > seg.start, `Key ${key} end (${seg.end}) phải lớn hơn start (${seg.start})`);
      assert.ok(seg.duration > 0.1, `Key ${key} duration (${seg.duration}s) phải > 0.1s`);
      assert.ok(seg.duration < 2.0, `Key ${key} duration (${seg.duration}s) phải < 2.0s`);
      
      const diff = Math.abs((seg.end - seg.start) - seg.duration);
      assert.ok(diff < 0.005, `Key ${key} sai lệch duration (${diff}) phải < 0.005s`);
    }
  });

  await t.test('Các từ vựng nhạy cảm phải đồng bộ chuẩn xác và tức thì', () => {
    const cay = audioMap['tu__cay'];
    assert.ok(cay, "Phải có toạ độ cho 'tu__cay'");
    assert.ok(cay.duration >= 0.3 && cay.duration <= 0.55, `Từ 'cây' phải tự nhiên 0.3s-0.55s (thực tế: ${cay.duration}s)`);

    const em = audioMap['van__em'];
    assert.ok(em, "Phải có toạ độ cho 'van__em'");
    assert.ok(em.duration >= 0.35 && em.duration <= 0.60, `Vần 'em' phải tự nhiên có đệm đầu và đuôi ngân 0.35s-0.60s (thực tế: ${em.duration}s)`);

    const tuEm = audioMap['tu__em'];
    assert.ok(tuEm, "Phải có toạ độ cho 'tu__em'");
    assert.ok(tuEm.duration >= 0.35 && tuEm.duration <= 0.60, `Từ 'em' phải tự nhiên có đệm đầu và đuôi ngân 0.35s-0.60s (thực tế: ${tuEm.duration}s)`);

    const tuLo = audioMap['tu__lo'];
    assert.ok(tuLo, "Phải có toạ độ cho 'tu__lo'");
    assert.ok(tuLo.duration >= 0.35 && tuLo.duration <= 0.60, `Từ 'lo' phải tự nhiên có đệm đầu và đuôi ngân 0.35s-0.60s (thực tế: ${tuLo.duration}s)`);

    const hoi = audioMap['tu__hoi'];
    assert.ok(hoi, "Phải có toạ độ cho 'tu__hoi'");
    assert.ok(hoi.duration >= 0.35 && hoi.duration <= 0.60, `Từ 'hỏi' phải tự nhiên 0.35s-0.60s (thực tế: ${hoi.duration}s)`);

    const truong = audioMap['tu__truong'];
    assert.ok(truong, "Phải có toạ độ cho 'tu__truong'");
    assert.ok(truong.duration >= 0.45 && truong.duration <= 0.75, `Từ 'trường' phải chuẩn (thực tế: ${truong.duration}s)`);

    const canhHuyen = audioMap['tu__canh_huyen'];
    assert.ok(canhHuyen, "Phải có toạ độ cho 'tu__canh_huyen'");
    assert.ok(canhHuyen.duration >= 0.35 && canhHuyen.duration <= 0.60, `Từ 'cành' phải chuẩn (thực tế: ${canhHuyen.duration}s)`);

    const tuVe = audioMap['tu__ve'];
    assert.ok(tuVe, "Phải có toạ độ cho 'tu__ve'");
    assert.ok(tuVe.duration >= 0.35 && tuVe.duration <= 0.60, `Từ 've' phải chuẩn sau khi co giãn (thực tế: ${tuVe.duration}s)`);

    const tuVeHuyen = audioMap['tu__ve_huyen'];
    assert.ok(tuVeHuyen, "Phải có toạ độ cho 'tu__ve_huyen'");
    assert.ok(tuVeHuyen.duration >= 0.35 && tuVeHuyen.duration <= 0.60, `Từ 'vè' phải chuẩn sau khi co giãn (thực tế: ${tuVeHuyen.duration}s)`);

    const tuVeHoi = audioMap['tu__ve_hoi'];
    assert.ok(tuVeHoi, "Phải có toạ độ cho 'tu__ve_hoi'");
    assert.ok(tuVeHoi.duration >= 0.35 && tuVeHoi.duration <= 0.60, `Từ 'vẻ' phải chuẩn sau khi co giãn (thực tế: ${tuVeHoi.duration}s)`);

    const tuCo = audioMap['tu__co'];
    assert.ok(tuCo, "Phải có toạ độ cho 'tu__co'");
    assert.ok(tuCo.duration >= 0.35 && tuCo.duration <= 0.60, `Từ 'cô' phải chuẩn sau khi co giãn (thực tế: ${tuCo.duration}s)`);
  });

  await t.test('Toàn bộ 4 bài đọc SGK 1 phải có âm thanh sẵn sàng trong Master Sprite', () => {
    const grade1Text = [
      'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ.',
      'Ve vẻ vè ve Cái vè chim chích Bắt sâu đầu cành Giúp ích cho cây.',
      'Bé ngoan bé học chăm chỉ. Cô giáo khen bé hoa điểm mười.',
      'Bé giặt khăn sạch Chú vịt bơi nhanh Bé gập khuỷu tay Bắt con cá nhỏ.'
    ].join(' ').toLowerCase();

    const words = Array.from(new Set(grade1Text.replace(/[\.,\n]/g, ' ').split(/\s+/).filter(Boolean)));
    
    // Đọc TOKEN_TO_SPRITE_KEY_MAP
    const spriteFile = fs.readFileSync(path.join(rootDir, 'src', 'core', 'audio', 'SpriteManager.ts'), 'utf-8');

    for (const w of words) {
      // Tìm key ánh xạ trong SpriteManager
      const regex = new RegExp(`['"]${w}['"]\\s*:\\s*['"]([^'"]+)['"]`);
      const match = spriteFile.match(regex);
      assert.ok(match, `Từ "${w}" trong bài đọc phải có trong TOKEN_TO_SPRITE_KEY_MAP`);
      
      const targetKey = match[1];
      assert.ok(audioMap[targetKey], `Từ "${w}" (key: ${targetKey}) phải có toạ độ trong audio-map.json`);
    }
  });

  await t.test('SPRITE_VERSION và ánh xạ từ vựng "em", "lo" chuẩn Lesson 1', () => {
    const spriteFile = fs.readFileSync(path.join(rootDir, 'src', 'core', 'audio', 'SpriteManager.ts'), 'utf-8');
    assert.ok(spriteFile.includes("SPRITE_VERSION = 'v4.7.0'"), "SPRITE_VERSION phải được cập nhật lên 'v4.7.0'");

    const emMatch = spriteFile.match(/'em'\s*:\s*'([^']+)'/);
    assert.ok(emMatch, "Phải có mapping cho 'em'");
    assert.equal(emMatch[1], 'tu__em', "Từ 'em' phải ánh xạ tới 'tu__em'");

    const loMatch = spriteFile.match(/'lo'\s*:\s*'([^']+)'/);
    assert.ok(loMatch, "Phải có mapping cho 'lo'");
    assert.equal(loMatch[1], 'tu__lo', "Từ 'lo' phải ánh xạ tới 'tu__lo'");
  });
});

