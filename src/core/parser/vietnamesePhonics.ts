/**
 * Module Bóc tách Ngữ âm Tiếng Việt (Vietnamese Phonics Parser)
 * Chuẩn phương pháp SGK Kết nối tri thức với cuộc sống - Lớp 1
 */

import type { PhonicsBreakdown, ToneType, Token } from '../../types/index.ts';
import { TONES } from './vietnameseRules.ts';

// Bảng ánh xạ nguyên âm có dấu về nguyên âm gốc + loại thanh điệu
const VOWEL_TONE_MAP: Record<string, { base: string; tone: ToneType }> = {
  // a
  'a': { base: 'a', tone: 'ngang' },
  'à': { base: 'a', tone: 'huyen' },
  'á': { base: 'a', tone: 'sac' },
  'ả': { base: 'a', tone: 'hoi' },
  'ã': { base: 'a', tone: 'nga' },
  'ạ': { base: 'a', tone: 'nang' },
  // ă
  'ă': { base: 'ă', tone: 'ngang' },
  'ằ': { base: 'ă', tone: 'huyen' },
  'ắ': { base: 'ă', tone: 'sac' },
  'ẳ': { base: 'ă', tone: 'hoi' },
  'ẵ': { base: 'ă', tone: 'nga' },
  'ặ': { base: 'ă', tone: 'nang' },
  // â
  'â': { base: 'â', tone: 'ngang' },
  'ầ': { base: 'â', tone: 'huyen' },
  'ấ': { base: 'â', tone: 'sac' },
  'ẩ': { base: 'â', tone: 'hoi' },
  'ẫ': { base: 'â', tone: 'nga' },
  'ậ': { base: 'â', tone: 'nang' },
  // e
  'e': { base: 'e', tone: 'ngang' },
  'è': { base: 'e', tone: 'huyen' },
  'é': { base: 'e', tone: 'sac' },
  'ẻ': { base: 'e', tone: 'hoi' },
  'ẽ': { base: 'e', tone: 'nga' },
  'ẹ': { base: 'e', tone: 'nang' },
  // ê
  'ê': { base: 'ê', tone: 'ngang' },
  'ề': { base: 'ê', tone: 'huyen' },
  'ế': { base: 'ê', tone: 'sac' },
  'ể': { base: 'ê', tone: 'hoi' },
  'ễ': { base: 'ê', tone: 'nga' },
  'ệ': { base: 'ê', tone: 'nang' },
  // i
  'i': { base: 'i', tone: 'ngang' },
  'ì': { base: 'i', tone: 'huyen' },
  'í': { base: 'i', tone: 'sac' },
  'ỉ': { base: 'i', tone: 'hoi' },
  'ĩ': { base: 'i', tone: 'nga' },
  'ị': { base: 'i', tone: 'nang' },
  // o
  'o': { base: 'o', tone: 'ngang' },
  'ò': { base: 'o', tone: 'huyen' },
  'ó': { base: 'o', tone: 'sac' },
  'ỏ': { base: 'o', tone: 'hoi' },
  'õ': { base: 'o', tone: 'nga' },
  'ọ': { base: 'o', tone: 'nang' },
  // ô
  'ô': { base: 'ô', tone: 'ngang' },
  'ồ': { base: 'ô', tone: 'huyen' },
  'ố': { base: 'ô', tone: 'sac' },
  'ổ': { base: 'ô', tone: 'hoi' },
  'ỗ': { base: 'ô', tone: 'nga' },
  'ộ': { base: 'ô', tone: 'nang' },
  // ơ
  'ơ': { base: 'ơ', tone: 'ngang' },
  'ờ': { base: 'ơ', tone: 'huyen' },
  'ớ': { base: 'ơ', tone: 'sac' },
  'ở': { base: 'ơ', tone: 'hoi' },
  'ỡ': { base: 'ơ', tone: 'nga' },
  'ợ': { base: 'ơ', tone: 'nang' },
  // u
  'u': { base: 'u', tone: 'ngang' },
  'ù': { base: 'u', tone: 'huyen' },
  'ú': { base: 'u', tone: 'sac' },
  'ủ': { base: 'u', tone: 'hoi' },
  'ũ': { base: 'u', tone: 'nga' },
  'ụ': { base: 'u', tone: 'nang' },
  // ư
  'ư': { base: 'ư', tone: 'ngang' },
  'ừ': { base: 'ư', tone: 'huyen' },
  'ứ': { base: 'ư', tone: 'sac' },
  'ử': { base: 'ư', tone: 'hoi' },
  'ữ': { base: 'ư', tone: 'nga' },
  'ự': { base: 'ư', tone: 'nang' },
  // y
  'y': { base: 'y', tone: 'ngang' },
  'ỳ': { base: 'y', tone: 'huyen' },
  'ý': { base: 'y', tone: 'sac' },
  'ỷ': { base: 'y', tone: 'hoi' },
  'ỹ': { base: 'y', tone: 'nga' },
  'ỵ': { base: 'y', tone: 'nang' },
};

// Danh sách âm đầu sắp xếp theo độ dài giảm dần để match greedy
const INITIAL_CONSONANTS_ORDERED = [
  'ngh',
  'ch', 'gh', 'gi', 'kh', 'ng', 'nh', 'ph', 'qu', 'th', 'tr',
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x'
];

// Tập các nguyên âm tiếng Việt (ở dạng không dấu thanh)
const BASE_VOWELS = new Set(['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y']);

// Bảng tra cứu từ đặc biệt / bất quy tắc (Lookup Table)
export const LOOKUP_SPECIAL_WORDS: Record<string, Partial<PhonicsBreakdown>> = {
  'quốc': {
    initialConsonant: 'qu',
    rime: 'ốc',
    tone: 'sac',
    toneName: 'sắc',
    baseWord: 'quốc',
    spellingFormula: ['qu', 'ốc', 'quốc'],
    spellingFormulaText: 'qu - ốc - quốc',
  },
  'gì': {
    initialConsonant: 'gi',
    rime: 'i',
    tone: 'huyen',
    toneName: 'huyền',
    baseWord: 'gi',
    spellingFormula: ['gi', 'i', 'gi', 'huyền', 'gì'],
    spellingFormulaText: 'gi - i - gi - huyền - gì',
  },
  'giếng': {
    initialConsonant: 'gi',
    rime: 'iêng',
    tone: 'sac',
    toneName: 'sắc',
    baseWord: 'giêng',
    spellingFormula: ['gi', 'iêng', 'giêng', 'sắc', 'giếng'],
    spellingFormulaText: 'gi - iêng - giêng - sắc - giếng',
  },
  'yêu': {
    initialConsonant: '',
    rime: 'yêu',
    tone: 'ngang',
    toneName: 'không dấu (ngang)',
    baseWord: 'yêu',
    spellingFormula: ['yêu'],
    spellingFormulaText: 'yêu (đọc trơn)',
  },
  'ươu': {
    initialConsonant: '',
    rime: 'ươu',
    tone: 'ngang',
    toneName: 'không dấu (ngang)',
    baseWord: 'ươu',
    spellingFormula: ['ươu'],
    spellingFormulaText: 'ươu (đọc trơn)',
  },
};

/**
 * 1. Bóc tách dấu thanh và đưa về chuỗi chữ cái không dấu thanh (giữ nguyên mũ/móc: ă, â, ê, ô, ơ, ư)
 */
export function extractTone(word: string): { unaccentedWord: string; tone: ToneType; toneName: string } {
  const normalized = word.normalize('NFC').toLowerCase();
  let extractedTone: ToneType = 'ngang';
  let unaccentedChars: string[] = [];

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const mapping = VOWEL_TONE_MAP[char];

    if (mapping) {
      unaccentedChars.push(mapping.base);
      if (mapping.tone !== 'ngang') {
        extractedTone = mapping.tone;
      }
    } else {
      unaccentedChars.push(char);
    }
  }

  const unaccentedWord = unaccentedChars.join('');
  const toneInfo = TONES[extractedTone] || TONES.ngang;

  return {
    unaccentedWord,
    tone: extractedTone,
    toneName: toneInfo.name,
  };
}

/**
 * 2. Phân tách Âm đầu và Vần từ chuỗi tiếng đã loại bỏ dấu thanh
 */
export function extractInitialAndRime(unaccentedWord: string): { initialConsonant: string; rime: string; baseWord: string } {
  const word = unaccentedWord.trim().toLowerCase();

  if (!word) {
    return { initialConsonant: '', rime: '', baseWord: '' };
  }

  // --- TRƯỜNG HỢP ĐẶC BIỆT 1: ÂM ĐẦU 'qu' ---
  if (word.startsWith('qu')) {
    // Nếu từ chỉ có 'qu'
    if (word.length <= 2) {
      return { initialConsonant: 'qu', rime: '', baseWord: 'qu' };
    }

    const restAfterQu = word.slice(2);
    // Vần sau 'qu' (ví dụ: quang -> qu + ang; quê -> qu + ê; quy -> qu + y; quốc/quôc -> qu + ôc)
    return {
      initialConsonant: 'qu',
      rime: restAfterQu,
      baseWord: 'qu' + restAfterQu,
    };
  }

  // --- TRƯỜNG HỢP ĐẶC BIỆT 2: ÂM ĐẦU 'gi' ---
  if (word.startsWith('gi')) {
    // Nếu từ chỉ có 'gi' (ví dụ: gì -> unaccented 'gi')
    if (word.length === 2) {
      return { initialConsonant: 'gi', rime: 'i', baseWord: 'gi' };
    }

    const char3 = word.charAt(2);
    // Nếu ký tự thứ 3 là nguyên âm (ví dụ: gió -> char3 = 'o'; giặt/giăt -> char3 = 'ă'; giày/giay -> char3 = 'a'; giữa/giưa -> char3 = 'ư')
    if (BASE_VOWELS.has(char3)) {
      const rimePart = word.slice(2);
      return {
        initialConsonant: 'gi',
        rime: rimePart,
        baseWord: 'gi' + rimePart,
      };
    }

    // Nếu ký tự thứ 3 là phụ âm (ví dụ: gìn/gin -> char3 = 'n'; giết/giet -> char3 = 'e' nhưng 'iê' là nguyên âm đôi)
    // Trong trường hợp này 'i' vừa là âm của 'gi' vừa đóng vai trò nguyên âm của vần ('in', 'it'...)
    const rimePartWithI = word.slice(1); // 'in', 'it'...
    return {
      initialConsonant: 'gi',
      rime: rimePartWithI,
      baseWord: 'g' + rimePartWithI, // gin, git
    };
  }

  // --- TRƯỜNG HỢP CHUNG: Quét danh sách âm đầu chuẩn ---
  for (const consonant of INITIAL_CONSONANTS_ORDERED) {
    if (word.startsWith(consonant)) {
      const rest = word.slice(consonant.length);

      // Đảm bảo phần còn lại bắt đầu bằng nguyên âm hoặc rỗng (tránh match nhầm phụ âm đơn khi là phụ âm đôi)
      if (rest.length === 0 || BASE_VOWELS.has(rest.charAt(0)) || (rest.startsWith('w') || rest.startsWith('y'))) {
        return {
          initialConsonant: consonant,
          rime: rest,
          baseWord: consonant + rest,
        };
      }
    }
  }

  // --- TRƯỜNG HỢP KHÔNG CÓ ÂM ĐẦU (Khuyết âm đầu) ---
  // Ví dụ: uống -> uông, ăn -> ăn, áo -> ao, yêu -> yêu
  return {
    initialConsonant: '',
    rime: word,
    baseWord: word,
  };
}

/**
 * Tập các phụ âm cuối tắc
 */
export const STOP_CONSONANTS = new Set(['p', 't', 'c', 'ch']);

/**
 * Kiểm tra xem vần có phải là vần khép tắc (kết thúc bằng p, t, c, ch) hay không
 */
export function isCheckedRime(rime: string): boolean {
  if (!rime) return false;
  const clean = rime.toLowerCase().trim();
  if (clean.endsWith('ch')) return true;
  const lastChar = clean.slice(-1);
  return lastChar === 'p' || lastChar === 't' || lastChar === 'c';
}

/**
 * Bảng chuyển đổi vần khép tắc không dấu sang dạng có thanh SẮC chuẩn
 */
export const CHECKED_RIME_TO_SAC_MAP: Record<string, string> = {
  // -p
  'ap': 'áp', 'ăp': 'ắp', 'âp': 'ấp', 'ep': 'ép', 'êp': 'ếp',
  'ip': 'íp', 'op': 'óp', 'ôp': 'ốp', 'ơp': 'ớp', 'up': 'úp',
  'ưp': 'úp', 'iep': 'iếp', 'iêp': 'iếp', 'uop': 'uốp', 'uôp': 'uốp',
  'ươp': 'ướp', 'uop_horn': 'ướp',
  // -t
  'at': 'át', 'ăt': 'ắt', 'ât': 'ất', 'et': 'ét', 'êt': 'ết',
  'it': 'ít', 'ot': 'ót', 'ôt': 'ốt', 'ơt': 'ớt', 'ut': 'út',
  'ưt': 'ứt', 'iet': 'iết', 'iêt': 'iết', 'yet': 'yết', 'yêt': 'yết',
  'uot': 'uốt', 'uôt': 'uốt', 'ươt': 'ướt',
  'oat': 'oát', 'oăt': 'oắt', 'uat': 'uất', 'uât': 'uất',
  'uyet': 'uyết', 'uyêt': 'uyết', 'uyt': 'uýt',
  // -c
  'ac': 'ác', 'ăc': 'ắc', 'âc': 'ấc', 'ec': 'éc', 'êc': 'ếc',
  'oc': 'óc', 'ôc': 'ốc', 'uc': 'úc', 'ưc': 'ức',
  'iec': 'iếc', 'iêc': 'iếc', 'uoc': 'uốc', 'uôc': 'uốc', 'ươc': 'ước',
  'oac': 'oác', 'oăc': 'oắc',
  // -ch
  'ach': 'ách', 'êch': 'ếch', 'ich': 'ích', 'oach': 'oách', 'uych': 'uých',
};

/**
 * Lấy dạng thanh sắc của vần khép tắc
 */
export function getCheckedRimeSac(rime: string): string {
  const clean = rime.toLowerCase().trim();
  return CHECKED_RIME_TO_SAC_MAP[clean] || clean;
}

/**
 * Bảng ánh xạ chuyển nguyên âm mang thanh NẶNG sang thanh SẮC
 */
const NANG_TO_SAC_VOWEL_MAP: Record<string, string> = {
  'ạ': 'á', 'ặ': 'ắ', 'ậ': 'ấ',
  'ẹ': 'é', 'ệ': 'ế',
  'ị': 'í',
  'ọ': 'ó', 'ộ': 'ố', 'ợ': 'ớ',
  'ụ': 'ú', 'ự': 'ứ',
};

/**
 * Chuyển một từ/tiếng mang thanh NẶNG sang tiếng đệm mang thanh SẮC tương ứng
 * Ví dụ: giặt -> giắt, học -> hóc, vịt -> vít, mặt -> mắt, quạt -> quát, chuột -> chuốt
 */
export function convertNangToSac(word: string): string {
  let res = '';
  for (const char of word.normalize('NFC')) {
    res += NANG_TO_SAC_VOWEL_MAP[char] || char;
  }
  return res;
}

/**
 * 3. Sinh công thức đánh vần từng bước chuẩn SGK Kết nối tri thức
 */
export function generateSpellingFormula(
  initialConsonant: string,
  rime: string,
  baseWord: string,
  tone: ToneType,
  toneName: string,
  rawWord: string
): { formula: string[]; formulaText: string; ruleDescription: string } {
  const hasInitial = Boolean(initialConsonant);
  const cleanRaw = rawWord.trim();
  const isChecked = isCheckedRime(rime);

  // =========================================================================
  // NHÓM 1: ÂM TIẾT KHÉP TẮC KẾT THÚC BẰNG P, T, C, CH (Checked Syllables)
  // Chỉ đi với 2 thanh: SẮC hoặc NẶNG
  // =========================================================================
  if (isChecked) {
    const sacRime = getCheckedRimeSac(rime);

    // TH 1.1: Thanh NẶNG (ví dụ: giặt, học, vịt, mặt, quạt, chuột)
    if (tone === 'nang') {
      const intermediateSacWord = convertNangToSac(cleanRaw);
      if (hasInitial) {
        const formula = [initialConsonant, sacRime, intermediateSacWord, 'nặng', cleanRaw];
        const formulaText = `${initialConsonant} - ${sacRime} - ${intermediateSacWord} - nặng - ${cleanRaw}`;
        const ruleDescription = `Âm đầu "${initialConsonant}" ghép với vần "${sacRime}" thành tiếng "${intermediateSacWord}", thêm thanh nặng được từ "${cleanRaw}".`;
        return { formula, formulaText, ruleDescription };
      } else {
        // Khuyết âm đầu mang thanh nặng: ví dụ ạc, ịt, ục
        const formula = [sacRime, 'nặng', cleanRaw];
        const formulaText = `${sacRime} - nặng - ${cleanRaw}`;
        const ruleDescription = `Tiếng khuyết âm đầu, vần "${sacRime}" thêm thanh nặng được từ "${cleanRaw}".`;
        return { formula, formulaText, ruleDescription };
      }
    }

    // TH 1.2: Thanh SẮC (ví dụ: bắt, hát, sách, chích, quốc)
    if (tone === 'sac') {
      if (hasInitial) {
        const formula = [initialConsonant, sacRime, cleanRaw];
        const formulaText = `${initialConsonant} - ${sacRime} - ${cleanRaw}`;
        const ruleDescription = `Âm đầu "${initialConsonant}" ghép với vần "${sacRime}" được từ "${cleanRaw}".`;
        return { formula, formulaText, ruleDescription };
      } else {
        // Khuyết âm đầu mang thanh sắc: ví dụ ít, áp, óc -> Đọc trơn
        const formula = [cleanRaw];
        const formulaText = `${cleanRaw} (đọc trơn)`;
        const ruleDescription = `Tiếng khuyết âm đầu mang thanh sắc, phát âm trơn vần "${cleanRaw}".`;
        return { formula, formulaText, ruleDescription };
      }
    }
  }

  // =========================================================================
  // NHÓM 2: ÂM TIẾT MỞ HOẶC KẾT THÚC BẰNG BÁN ÂM / ÂM MŨI (M, N, NG, NH)
  // Đi với cả 6 thanh: ngang, huyền, sắc, hỏi, ngã, nặng
  // =========================================================================
  const isNgang = tone === 'ngang';

  // TH 2.1: Có âm đầu + Có dấu thanh (huyền, sắc, hỏi, ngã, nặng)
  // Ví dụ "trường": ["tr", "ương", "trương", "huyền", "trường"]
  // "toán": ["t", "oan", "toan", "sắc", "toán"]
  if (hasInitial && !isNgang) {
    const formula = [initialConsonant, rime, baseWord, toneName, cleanRaw];
    const formulaText = `${initialConsonant} - ${rime} - ${baseWord} - ${toneName} - ${cleanRaw}`;
    const ruleDescription = `Âm đầu "${initialConsonant}" ghép với vần "${rime}" thành tiếng "${baseWord}", thêm thanh ${toneName} được từ "${cleanRaw}".`;
    return { formula, formulaText, ruleDescription };
  }

  // TH 2.2: Có âm đầu + Thanh ngang (không dấu)
  // Ví dụ "chim": ["ch", "im", "chim"]
  // "hoa": ["h", "oa", "hoa"]
  if (hasInitial && isNgang) {
    const formula = [initialConsonant, rime, cleanRaw];
    const formulaText = `${initialConsonant} - ${rime} - ${cleanRaw}`;
    const ruleDescription = `Âm đầu "${initialConsonant}" ghép với vần "${rime}" (thanh không) được tiếng "${cleanRaw}".`;
    return { formula, formulaText, ruleDescription };
  }

  // TH 2.3: Không có âm đầu + Có dấu thanh (khác ngang)
  // Ví dụ "uống": ["uông", "sắc", "uống"]
  // "áo": ["ao", "sắc", "áo"]
  if (!hasInitial && !isNgang) {
    const formula = [rime, toneName, cleanRaw];
    const formulaText = `${rime} - ${toneName} - ${cleanRaw}`;
    const ruleDescription = `Tiếng khuyết âm đầu, vần "${rime}" thêm thanh ${toneName} được từ "${cleanRaw}".`;
    return { formula, formulaText, ruleDescription };
  }

  // TH 2.4: Không có âm đầu + Thanh ngang (không dấu)
  // Ví dụ "ăn", "yêu", "ông": Đọc trơn
  const formula = [cleanRaw];
  const formulaText = `${cleanRaw} (đọc trơn)`;
  const ruleDescription = `Tiếng khuyết âm đầu và thanh ngang, phát âm trơn trực tiếp vần "${cleanRaw}".`;
  return { formula, formulaText, ruleDescription };
}

/**
 * HÀM CHÍNH: Phân rã 1 từ tiếng Việt bất kỳ thành các thành phần ngữ âm hoàn chỉnh
 */
export function parseVietnamesePhonics(rawInput: string): PhonicsBreakdown {
  const cleanInput = rawInput.trim().replace(/[.,!?:;""''(){}[\]]/g, '');
  const lowerInput = cleanInput.toLowerCase();

  if (!cleanInput) {
    return {
      raw: rawInput,
      clean: '',
      initialConsonant: '',
      rime: '',
      tone: 'ngang',
      toneName: 'không dấu (ngang)',
      baseWord: '',
      spellingFormula: [''],
      spellingFormulaText: '',
      ruleDescription: 'Vui lòng nhập từ để phân tích.',
    };
  }

  // 1. Kiểm tra bảng tra cứu từ đặc biệt (Lookup Overrides)
  if (LOOKUP_SPECIAL_WORDS[lowerInput]) {
    const special = LOOKUP_SPECIAL_WORDS[lowerInput];
    return {
      raw: cleanInput,
      clean: lowerInput,
      initialConsonant: special.initialConsonant ?? '',
      rime: special.rime ?? '',
      tone: special.tone ?? 'ngang',
      toneName: special.toneName ?? 'không dấu (ngang)',
      baseWord: special.baseWord ?? lowerInput,
      spellingFormula: special.spellingFormula ?? [lowerInput],
      spellingFormulaText: special.spellingFormulaText ?? lowerInput,
      ruleDescription: `Từ đặc biệt/bất quy tắc trong từ điển ngữ âm.`,
    };
  }

  // 2. Tách Dấu thanh
  const { unaccentedWord, tone, toneName } = extractTone(lowerInput);

  // 3. Tách Âm đầu và Vần
  const { initialConsonant, rime, baseWord } = extractInitialAndRime(unaccentedWord);

  let effectiveBaseWord = baseWord;
  if (isCheckedRime(rime) && tone === 'nang') {
    effectiveBaseWord = convertNangToSac(lowerInput);
  }

  // 4. Tạo chuỗi đánh vần
  const { formula, formulaText, ruleDescription } = generateSpellingFormula(
    initialConsonant,
    rime,
    effectiveBaseWord,
    tone,
    toneName,
    lowerInput
  );

  return {
    raw: cleanInput,
    clean: lowerInput,
    initialConsonant,
    rime,
    tone,
    toneName,
    baseWord: effectiveBaseWord,
    spellingFormula: formula,
    spellingFormulaText: formulaText,
    ruleDescription,
  };
}

/**
 * Tách một đoạn văn bản thành danh sách Token phân tích ngữ âm
 */
export function tokenizeVietnameseText(text: string): Token[] {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, idx) => ({
    id: `token-${idx}-${w}`,
    text: w,
    type: 'syllable',
    phonics: parseVietnamesePhonics(w),
  }));
}
