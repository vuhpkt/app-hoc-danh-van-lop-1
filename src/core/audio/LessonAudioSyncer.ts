/**
 * src/core/audio/LessonAudioSyncer.ts
 * 
 * Bộ đồng bộ và nạp âm thanh thông minh cho bài tập đọc mới của phụ huynh
 * Tự động phân tích các từ trong bài đọc, phát hiện từ còn thiếu,
 * và tự động tải từ Zalo AI TTS về lưu vĩnh viễn vào IndexedDB.
 */

import { spriteManager } from './SpriteManager.ts';
import { audioCacheService } from './AudioCacheService.ts';
import { zaloTtsClient } from './ZaloTtsClient.ts';

export interface SyncProgressInfo {
  total: number;
  current: number;
  percent: number;
  word: string;
  status: 'checking' | 'downloading' | 'cached' | 'failed';
}

export interface SyncResult {
  totalUniqueWords: number;
  alreadyAvailable: number;
  newlyDownloaded: number;
  failedWords: string[];
}

export class LessonAudioSyncer {
  /**
   * Tách bài đọc thành danh sách các từ vựng độc nhất (không trùng lặp, không dấu câu)
   */
  public static extractUniqueWords(text: string): string[] {
    const rawTokens = text.split(/[\s,.;:!?"'()\-—\n\r]+/);
    const set = new Set<string>();

    for (const t of rawTokens) {
      const clean = t.toLowerCase().trim();
      if (clean && clean.length > 0 && isNaN(Number(clean))) {
        set.add(clean);
      }
    }

    return Array.from(set);
  }

  /**
   * Kiểm tra xem một từ đã có âm thanh chưa (trong Sprite Master hoặc IndexedDB)
   */
  public static async isWordAvailable(word: string): Promise<boolean> {
    const clean = word.toLowerCase().trim();

    // 1. Kiểm tra trong Audio Sprite Master
    if (spriteManager.resolveSpriteKey(clean)) {
      return true;
    }

    // 2. Kiểm tra trong IndexedDB Cache
    return await audioCacheService.hasClip(clean);
  }

  /**
   * Đồng bộ toàn bộ âm thanh của bài đọc:
   * Quét các từ còn thiếu và tự động tải về lưu vào IndexedDB
   */
  public static async syncLesson(
    text: string,
    onProgress?: (info: SyncProgressInfo) => void
  ): Promise<SyncResult> {
    const uniqueWords = this.extractUniqueWords(text);
    const total = uniqueWords.length;

    if (total === 0) {
      return { totalUniqueWords: 0, alreadyAvailable: 0, newlyDownloaded: 0, failedWords: [] };
    }

    const missingWords: string[] = [];
    let alreadyAvailable = 0;

    // Bước 1: Quét các từ chưa có âm thanh
    for (let i = 0; i < uniqueWords.length; i++) {
      const word = uniqueWords[i];
      onProgress?.({
        total,
        current: i + 1,
        percent: Math.round(((i + 1) / total) * 30), // 0 - 30%
        word,
        status: 'checking',
      });

      const has = await this.isWordAvailable(word);
      if (has) {
        alreadyAvailable++;
      } else {
        missingWords.push(word);
      }
    }

    // Bước 2: Tải các từ còn thiếu từ Zalo AI
    const failedWords: string[] = [];
    let newlyDownloaded = 0;

    for (let j = 0; j < missingWords.length; j++) {
      const word = missingWords[j];
      const progressPercent = 30 + Math.round(((j + 1) / missingWords.length) * 70); // 30 - 100%

      onProgress?.({
        total: missingWords.length,
        current: j + 1,
        percent: progressPercent,
        word,
        status: 'downloading',
      });

      try {
        const audioBuffer = await zaloTtsClient.fetchAudioBuffer(word);
        await audioCacheService.saveClip(word, audioBuffer);
        newlyDownloaded++;

        // Delay nhẹ 200ms giữa các request để đảm bảo an toàn quota
        if (j < missingWords.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (err) {
        console.warn(`Lỗi khi tải âm thanh cho từ "${word}":`, err);
        failedWords.push(word);
      }
    }

    return {
      totalUniqueWords: total,
      alreadyAvailable,
      newlyDownloaded,
      failedWords,
    };
  }
}
