/**
 * src/core/audio/AudioCacheService.ts
 * 
 * Quản lý kho lưu trữ âm thanh ngoại tuyến (Offline Storage) sử dụng IndexedDB
 * Giúp lưu trữ vĩnh viễn mọi từ vựng mới do phụ huynh nạp qua OCR/Dán bài.
 * Hỗ trợ tự động fallback in-memory Map trong môi trường test/Node.js.
 */

import type { IAudioStorage } from '../../types/index.ts';

const DB_NAME = 'VietnamesePhonicsAudioCache';
const DB_VERSION = 1;
const STORE_NAME = 'audio_clips';

export interface CachedAudioRecord {
  wordKey: string;      // Từ chuẩn hóa (ví dụ: "chú", "cánh_đồng")
  audioData: ArrayBuffer;
  mimeType: string;
  createdAt: number;
}

export class AudioCacheService implements IAudioStorage {
  private static instance: AudioCacheService;
  private db: IDBDatabase | null = null;
  private memoryFallback: Map<string, CachedAudioRecord> = new Map();
  private isIndexedDBAvailable: boolean;

  private constructor() {
    this.isIndexedDBAvailable = typeof indexedDB !== 'undefined';
  }

  public static getInstance(): AudioCacheService {
    if (!AudioCacheService.instance) {
      AudioCacheService.instance = new AudioCacheService();
    }
    return AudioCacheService.instance;
  }

  private static readonly CACHE_PREFIX = 'v_synced_v4_';

  private normalizeKey(word: string): string {
    const clean = word.toLowerCase().replace(/[,.!?:;]/g, '').trim();
    return `${AudioCacheService.CACHE_PREFIX}${clean}`;
  }

  /**
   * Khởi tạo kết nối IndexedDB
   */
  public async init(): Promise<void> {
    if (!this.isIndexedDBAvailable) return;
    if (this.db) return;

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'wordKey' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.warn('Không thể mở IndexedDB, chuyển sang in-memory cache:', event);
        this.isIndexedDBAvailable = false;
        resolve();
      };
    });
  }

  /**
   * Kiểm tra xem một từ đã có trong kho ngoại tuyến chưa
   */
  public async hasClip(word: string): Promise<boolean> {
    const key = this.normalizeKey(word);
    if (!key) return false;

    if (!this.isIndexedDBAvailable) {
      return this.memoryFallback.has(key);
    }

    await this.init();
    if (!this.db) return this.memoryFallback.has(key);

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      } catch {
        resolve(this.memoryFallback.has(key));
      }
    });
  }

  /**
   * Lấy dữ liệu ArrayBuffer của âm thanh từ bộ nhớ ngoại tuyến
   */
  public async getClip(word: string): Promise<ArrayBuffer | null> {
    const key = this.normalizeKey(word);
    if (!key) return null;

    if (!this.isIndexedDBAvailable) {
      return this.memoryFallback.get(key)?.audioData || null;
    }

    await this.init();
    if (!this.db) return this.memoryFallback.get(key)?.audioData || null;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          const record = req.result as CachedAudioRecord | undefined;
          resolve(record ? record.audioData : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(this.memoryFallback.get(key)?.audioData || null);
      }
    });
  }

  /**
   * Lưu một file âm thanh của từ vào IndexedDB vĩnh viễn
   */
  public async saveClip(word: string, audioData: ArrayBuffer, mimeType = 'audio/mpeg'): Promise<void> {
    const key = this.normalizeKey(word);
    if (!key) return;

    const record: CachedAudioRecord = {
      wordKey: key,
      audioData,
      mimeType,
      createdAt: Date.now(),
    };

    if (!this.isIndexedDBAvailable) {
      this.memoryFallback.set(key, record);
      return;
    }

    await this.init();
    if (!this.db) {
      this.memoryFallback.set(key, record);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        this.memoryFallback.set(key, record);
        resolve();
      }
    });
  }

  /**
   * Lấy danh sách tất cả các từ đã được lưu trong cache ngoại tuyến
   */
  public async getAllCachedWords(): Promise<string[]> {
    const stripPrefix = (k: string) => {
      if (k.startsWith(AudioCacheService.CACHE_PREFIX)) {
        return k.slice(AudioCacheService.CACHE_PREFIX.length);
      }
      if (k.startsWith('v_synced_')) {
        return k.slice('v_synced_'.length);
      }
      if (k.startsWith('v08_')) {
        return k.slice(4);
      }
      return k;
    };

    if (!this.isIndexedDBAvailable) {
      return Array.from(this.memoryFallback.keys()).map(stripPrefix);
    }

    await this.init();
    if (!this.db) return Array.from(this.memoryFallback.keys()).map(stripPrefix);

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();

        req.onsuccess = () => {
          const keys = ((req.result as string[]) || []).map(stripPrefix);
          resolve(keys);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve(Array.from(this.memoryFallback.keys()).map(stripPrefix));
      }
    });
  }

  /**
   * Xóa một clip khỏi cache
   */
  public async deleteClip(word: string): Promise<void> {
    const key = this.normalizeKey(word);
    this.memoryFallback.delete(key);
    if (!this.isIndexedDBAvailable || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Lấy danh sách tất cả các key (IAudioStorage contract)
   */
  public async getAllKeys(): Promise<string[]> {
    return this.getAllCachedWords();
  }

  /**
   * Xóa toàn bộ kho âm thanh ngoại tuyến (khi người dùng muốn giải phóng bộ nhớ)
   */
  public async clear(): Promise<void> {
    this.memoryFallback.clear();
    if (!this.isIndexedDBAvailable || !this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch {
        resolve();
      }
    });
  }
}

export const audioCacheService = AudioCacheService.getInstance();
