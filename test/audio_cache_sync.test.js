import test from 'node:test';
import assert from 'node:assert/strict';
import { LessonAudioSyncer } from '../src/core/audio/LessonAudioSyncer.ts';
import { audioCacheService } from '../src/core/audio/AudioCacheService.ts';
import { spriteManager } from '../src/core/audio/SpriteManager.ts';

test('LessonAudioSyncer - Word Extraction and Normalization', async (t) => {
  await t.test('1. Extracts unique clean words from complex text', () => {
    const text = 'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ!';
    const words = LessonAudioSyncer.extractUniqueWords(text);

    // Kiểm tra không còn dấu câu
    assert.ok(words.includes('trường'));
    assert.ok(words.includes('học'));
    assert.ok(words.includes('của'));
    assert.ok(words.includes('khang'));
    assert.ok(words.includes('trang'));
    assert.ok(words.includes('tiếng'));
    assert.ok(words.includes('vẻ'));

    // Kiểm tra không bị trùng từ "học"
    const hocCount = words.filter((w) => w === 'học').length;
    assert.equal(hocCount, 1, 'Từ "học" chỉ xuất hiện 1 lần trong danh sách unique');
  });
});

test('AudioCacheService - In-Memory and Offline Storage', async (t) => {
  await t.test('1. Save and retrieve audio clip from cache', async () => {
    await audioCacheService.clear();

    const mockWord = 'bình_minh';
    const mockData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;

    // Ban đầu chưa có
    assert.equal(await audioCacheService.hasClip(mockWord), false);
    assert.equal(await audioCacheService.getClip(mockWord), null);

    // Lưu vào cache
    await audioCacheService.saveClip(mockWord, mockData);

    // Sau khi lưu phải có
    assert.equal(await audioCacheService.hasClip(mockWord), true);
    const retrieved = await audioCacheService.getClip(mockWord);
    assert.ok(retrieved, 'Retrieved buffer must not be null');
    assert.equal(retrieved.byteLength, mockData.byteLength);

    // Kiểm tra danh sách cached words
    const allWords = await audioCacheService.getAllCachedWords();
    assert.ok(allWords.includes(mockWord));
  });
});

test('LessonAudioSyncer - Availability Checking (Sprite + Cache)', async (t) => {
  await t.test('1. Checks available words from Sprite Master', async () => {
    // Các từ đã có trong Sprite Master mới (279 clips)
    assert.equal(await LessonAudioSyncer.isWordAvailable('trường'), true);
    assert.equal(await LessonAudioSyncer.isWordAvailable('của'), true);
    assert.equal(await LessonAudioSyncer.isWordAvailable('khang'), true);
    assert.equal(await LessonAudioSyncer.isWordAvailable('trang'), true);
    assert.equal(await LessonAudioSyncer.isWordAvailable('chim'), true);
  });

  await t.test('2. Checks words not in sprite, but available once cached', async () => {
    const unknownWord = 'phi_thuyền_vũ_trụ';
    assert.equal(await LessonAudioSyncer.isWordAvailable(unknownWord), false);

    // Giả lập sau khi phụ huynh nạp bài, Zalo AI tải về và lưu vào cache
    const mockData = new Uint8Array([9, 9, 9]).buffer;
    await audioCacheService.saveClip(unknownWord, mockData);

    // Bây giờ kiểm tra lại phải trả về true!
    assert.equal(await LessonAudioSyncer.isWordAvailable(unknownWord), true);
  });
});
