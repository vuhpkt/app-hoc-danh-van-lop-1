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
  type: 'syllable' | 'punctuation' | 'space';
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
