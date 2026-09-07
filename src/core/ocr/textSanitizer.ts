/**
 * src/core/ocr/textSanitizer.ts
 * 
 * Bộ tiền xử lý và làm sạch văn bản OCR chuyên biệt cho Sách Giáo Khoa Tiếng Việt Lớp 1
 * - Chuẩn hóa bảng mã Unicode tiếng Việt (NFD sang NFC)
 * - Tự động nhận diện và loại bỏ số trang (Trang 45, 45, Page 12) và tiêu đề bài học (BÀI 1:, TIẾNG VIỆT 1)
 * - Làm sạch các ký tự nhiễu quang học (OCR artifacts: |, ~, ^, _, [], {}, *)
 * - Bảo tồn cấu trúc ngắt dòng và khổ thơ cho các bài đồng dao/thơ SGK Lớp 1
 * - Trích xuất danh mục từ vựng độc nhất sẵn sàng cho LessonAudioSyncer
 */

export interface SanitizeOptions {
  stripHeadersAndFooters?: boolean;
  stripOcrArtifacts?: boolean;
  normalizeSpaces?: boolean;
}

export interface SanitizedOcrOutput {
  rawText: string;
  cleanedText: string;
  lines: string[];
  uniqueWords: string[];
}

/**
 * 1. Chuẩn hóa chuỗi ký tự tiếng Việt về dạng Unicode dựng sẵn chuẩn (NFC)
 * Ngăn chặn lỗi không nhận diện được dấu thanh do Tesseract trả về tổ hợp NFD
 */
export function normalizeUnicode(text: string): string {
  if (!text) return '';
  return text.normalize('NFC');
}

/**
 * 2. Loại bỏ số trang và tiêu đề giáo khoa không thuộc nội dung bài đọc
 */
export function removePageNumbersAndHeaders(text: string): string {
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const filteredLines: string[] = [];

  // Các mẫu tiêu đề giáo khoa cần loại bỏ
  const headerPatterns = [
    /^\s*(?:trang|page)\s*\d+[\s.:-]*.*$/i,
    /^\s*bài\s*\d+\s*[:.-]?\s*.*$/i,
    /^\s*tiếng\s+việt\s+\d+.*$/i,
    /^\s*tập\s+(?:một|hai|1|2).*$/i,
    /^\s*phần\s+\d+.*$/i,
    /^\s*\d+[\s.:-]*$/, // Dòng chỉ chứa số trang đơn lẻ (vd: "45", "12.")
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push('');
      continue;
    }

    let isHeader = false;
    for (const pattern of headerPatterns) {
      if (pattern.test(trimmed)) {
        isHeader = true;
        break;
      }
    }

    if (!isHeader) {
      filteredLines.push(line);
    }
  }

  return filteredLines.join('\n');
}

/**
 * 3. Làm sạch các ký tự nhiễu / artifact do OCR quét từ ảnh chụp mép sách
 */
export function cleanOcrArtifacts(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Loại bỏ các ký tự rác OCR phổ biến không có trong tiếng Việt SGK
  cleaned = cleaned.replace(/[|~^_{}[\]\\*#@$%]/g, ' ');

  // Chuẩn hóa khoảng trắng dư thừa
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Chuẩn hóa khoảng trắng trước dấu câu tiếng Việt
  cleaned = cleaned.replace(/\s+([,.:;!?])/g, '$1');

  // Đảm bảo sau dấu câu có khoảng trắng (nếu nối liền với chữ)
  cleaned = cleaned.replace(/([,.:;!?])([A-Za-zÀ-ỹ])/g, '$1 $2');

  return cleaned.trim();
}

/**
 * 4. Bảo tồn cấu trúc dòng thơ / đoạn văn sạch sẽ
 */
export function preservePoemStructure(text: string): string[] {
  if (!text) return [];

  const rawLines = text.split(/\r?\n/);
  const cleanLines: string[] = [];

  for (const raw of rawLines) {
    const trimmed = cleanOcrArtifacts(raw).trim();
    if (trimmed.length > 0) {
      cleanLines.push(trimmed);
    }
  }

  return cleanLines;
}

/**
 * 5. Pipeline hoàn chỉnh: Làm sạch toàn diện văn bản OCR
 */
export function sanitizeOcrText(rawText: string, options: SanitizeOptions = {}): SanitizedOcrOutput {
  const {
    stripHeadersAndFooters = true,
    stripOcrArtifacts = true,
  } = options;

  let processed = normalizeUnicode(rawText);

  if (stripHeadersAndFooters) {
    processed = removePageNumbersAndHeaders(processed);
  }

  if (stripOcrArtifacts) {
    processed = cleanOcrArtifacts(processed);
  }

  const lines = preservePoemStructure(processed);
  const cleanedText = lines.join('\n');

  // Trích xuất từ vựng độc nhất (không trùng lặp, không dấu câu)
  const rawTokens = cleanedText.split(/[\s,.;:!?"'()\-—\n\r]+/);
  const wordSet = new Set<string>();

  for (const token of rawTokens) {
    const cleanWord = token.toLowerCase().trim();
    if (cleanWord && cleanWord.length > 0 && isNaN(Number(cleanWord))) {
      wordSet.add(cleanWord);
    }
  }

  return {
    rawText,
    cleanedText,
    lines,
    uniqueWords: Array.from(wordSet),
  };
}
