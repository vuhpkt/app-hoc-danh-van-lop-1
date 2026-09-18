/**
 * Định nghĩa Type cho hệ thống Ngữ âm & Đánh vần Tiếng Việt Lớp 1 (SGK Kết nối tri thức)
 */

export type ToneType = 'ngang' | 'huyen' | 'sac' | 'hoi' | 'nga' | 'nang';

export interface ToneInfo {
  type: ToneType;
  name: string;        // "ngang", "huyền", "sắc", "hỏi", "ngã", "nặng"
  symbol: string;      // "", "`", "´", "?", "~", "."
  description: string;
}

export interface PhonicsBreakdown {
  raw: string;                 // Từ nguyên bản có dấu (vd: "toán", "bà", "Trường")
  clean: string;               // Từ đã loại bỏ dấu câu/viết hoa (vd: "toán", "bà", "trường")
  initialConsonant: string;    // Âm đầu (vd: "t", "b", "tr", "qu", "gi", "" nếu khuyết)
  rime: string;                // Vần nguyên vẹn (vd: "oan", "a", "ương", "uông")
  tone: ToneType;              // Loại dấu thanh (vd: "sac", "huyen", "ngang")
  toneName: string;            // Tên tiếng Việt của dấu (vd: "sắc", "huyền", "không dấu (ngang)")
  baseWord: string;            // Tiếng thanh ngang tương ứng (vd: "toan", "ba", "trương")
  spellingFormula: string[];   // Các bước phát âm: ["tr", "ương", "trương", "huyền", "trường"]
  spellingFormulaText: string; // Chuỗi hiển thị: "tr - ương - trương - huyền - trường"
  ruleDescription?: string;    // Mô tả giải thích chi tiết quy tắc đánh vần
}

export interface Token {
  id: string;
  text: string;
  type: 'syllable' | 'punctuation' | 'space' | 'newline';
  phonics?: PhonicsBreakdown;
  isActive?: boolean;
}

export interface AudioSpriteInfo {
  id: string;
  label: string;
  start: number;       // Thời điểm bắt đầu (giây)
  duration: number;    // Độ dài (giây)
  category: 'initial' | 'rime' | 'tone' | 'word';
}

export type AudioSpriteMap = Record<string, AudioSpriteInfo>;

export interface KaraokeToken {
  id: string;
  word: string;
  start: number;       // Thời gian bắt đầu (giây)
  end: number;         // Thời gian kết thúc (giây)
  breakdown?: PhonicsBreakdown;
}

export type ReadingMode = 'spelling' | 'fluent' | 'interactive';

export interface OCRResult {
  imageUrl?: string;
  rawText: string;
  confidence?: number;
  lines: string[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  note?: string;
  tokens?: Token[];
  createdAt?: number;
}

export interface OCRProgress {
  status: string;
  progress: number; // 0 đến 1
}

export interface OCRScanResult {
  imageUrl?: string;
  rawText: string;
  sanitizedText: string;
  confidence: number;
  lines: string[];
}

export interface PreprocessOptions {
  contrast?: number;      // e.g. 1.5
  threshold?: number;     // 0 đến 255
  grayscale?: boolean;
  invert?: boolean;
}

export interface KidReaderState {
  isPlaying: boolean;
  activeWordIndex: number;
  activeSubStepLabel?: string;
  selectedToken?: Token | null;
  mode: ReadingMode;
  speed: number;
}

/**
 * Service Layer Contracts (Sẵn sàng mở rộng Backend Server)
 */
export interface IAudioStorage {
  hasClip(key: string): Promise<boolean>;
  getClip(key: string): Promise<ArrayBuffer | null>;
  saveClip(key: string, data: ArrayBuffer, mimeType: string): Promise<void>;
  deleteClip(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export interface ITtsService {
  fetchAudioBuffer(text: string): Promise<ArrayBuffer>;
  getSpeed(): string;
  setSpeed(speed: string): void;
  getApiKey(): string;
  setApiKey(key: string): void;
}


