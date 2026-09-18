/**
 * VIETNAMESE ALPHABET & PHONICS LAB DATA
 * Bảng chữ cái 29 chữ, 11 phụ âm ghép và ~143 vần chuẩn Bộ GD&ĐT Lớp 1
 * Tất cả spriteKey liên kết 100% với Master Audio Sprite v4.3.0
 */

export interface LetterItem {
  letter: string;
  uppercase: string;
  lowercase: string;
  type: 'vowel' | 'consonant';
  soundLabel: string;     // Phát âm theo chuẩn Âm sư phạm: "bờ", "cờ", "dờ"...
  spriteKey: string;      // am_dau__* hoặc van__*
  exampleWord?: string;
}

export interface CompoundConsonantItem {
  consonant: string;
  soundLabel: string;     // "chờ", "trờ", "ngờ"...
  spriteKey: string;      // am_dau__*
  exampleWord?: string;
}

export interface RimeItem {
  rime: string;
  spriteKey: string;      // van__*
  spellingFormula: string;// "a - ngờ - ang"
  spellingSteps: string[];// ['van__a', 'am_dau__ng', 'van__ang']
  exampleWord?: string;
}

export interface RimeCategory {
  id: string;
  name: string;
  description: string;
  rimes: RimeItem[];
}

export interface BlendResult {
  consonant: string;
  rime: string;
  blendedWord: string;
  consonantKey: string;
  rimeKey: string;
  blendedWordKey?: string;
  audioSteps: string[];
}

// =========================================================================
// 1. 29 CHỮ CÁI TIẾNG VIỆT (12 NGUYÊN ÂM + 17 PHỤ ÂM ĐƠN)
// Phát âm 100% theo Âm ("bờ", "cờ", "dờ"...)
// =========================================================================
export const ALPHABET_LETTERS: LetterItem[] = [
  { letter: 'a', uppercase: 'A', lowercase: 'a', type: 'vowel', soundLabel: 'a', spriteKey: 'van__a', exampleWord: 'ba' },
  { letter: 'ă', uppercase: 'Ă', lowercase: 'ă', type: 'vowel', soundLabel: 'á', spriteKey: 'van__a_breve', exampleWord: 'bắt' },
  { letter: 'â', uppercase: 'Â', lowercase: 'â', type: 'vowel', soundLabel: 'ớ', spriteKey: 'van__a_hat', exampleWord: 'cây' },
  { letter: 'b', uppercase: 'B', lowercase: 'b', type: 'consonant', soundLabel: 'bờ', spriteKey: 'am_dau__b', exampleWord: 'bé' },
  { letter: 'c', uppercase: 'C', lowercase: 'c', type: 'consonant', soundLabel: 'cờ', spriteKey: 'am_dau__c', exampleWord: 'cá' },
  { letter: 'd', uppercase: 'D', lowercase: 'd', type: 'consonant', soundLabel: 'dờ', spriteKey: 'am_dau__d', exampleWord: 'da' },
  { letter: 'đ', uppercase: 'Đ', lowercase: 'đ', type: 'consonant', soundLabel: 'đờ', spriteKey: 'am_dau__dd', exampleWord: 'điểm' },
  { letter: 'e', uppercase: 'E', lowercase: 'e', type: 'vowel', soundLabel: 'e', spriteKey: 'van__e', exampleWord: 'mẹ' },
  { letter: 'ê', uppercase: 'Ê', lowercase: 'ê', type: 'vowel', soundLabel: 'ê', spriteKey: 'van__e_hat', exampleWord: 'bê' },
  { letter: 'g', uppercase: 'G', lowercase: 'g', type: 'consonant', soundLabel: 'gờ', spriteKey: 'am_dau__g', exampleWord: 'gà' },
  { letter: 'h', uppercase: 'H', lowercase: 'h', type: 'consonant', soundLabel: 'hờ', spriteKey: 'am_dau__h', exampleWord: 'hát' },
  { letter: 'i', uppercase: 'I', lowercase: 'i', type: 'vowel', soundLabel: 'i', spriteKey: 'van__i', exampleWord: 'chim' },
  { letter: 'k', uppercase: 'K', lowercase: 'k', type: 'consonant', soundLabel: 'ca', spriteKey: 'am_dau__k', exampleWord: 'khen' },
  { letter: 'l', uppercase: 'L', lowercase: 'l', type: 'consonant', soundLabel: 'lờ', spriteKey: 'am_dau__l', exampleWord: 'lo' },
  { letter: 'm', uppercase: 'M', lowercase: 'm', type: 'consonant', soundLabel: 'mờ', spriteKey: 'am_dau__m', exampleWord: 'mẹ' },
  { letter: 'n', uppercase: 'N', lowercase: 'n', type: 'consonant', soundLabel: 'nờ', spriteKey: 'am_dau__n', exampleWord: 'nho' },
  { letter: 'o', uppercase: 'O', lowercase: 'o', type: 'vowel', soundLabel: 'o', spriteKey: 'van__o', exampleWord: 'hót' },
  { letter: 'ô', uppercase: 'Ô', lowercase: 'ô', type: 'vowel', soundLabel: 'ô', spriteKey: 'van__o_hat', exampleWord: 'cô' },
  { letter: 'ơ', uppercase: 'Ơ', lowercase: 'ơ', type: 'vowel', soundLabel: 'ơ', spriteKey: 'van__o_horn', exampleWord: 'bơ' },
  { letter: 'p', uppercase: 'P', lowercase: 'p', type: 'consonant', soundLabel: 'pờ', spriteKey: 'am_dau__p', exampleWord: 'pin' },
  { letter: 'q', uppercase: 'Q', lowercase: 'q', type: 'consonant', soundLabel: 'quờ', spriteKey: 'am_dau__qu', exampleWord: 'quạt' },
  { letter: 'r', uppercase: 'R', lowercase: 'r', type: 'consonant', soundLabel: 'rờ', spriteKey: 'am_dau__r', exampleWord: 'rùa' },
  { letter: 's', uppercase: 'S', lowercase: 's', type: 'consonant', soundLabel: 'sờ', spriteKey: 'am_dau__s', exampleWord: 'sách' },
  { letter: 't', uppercase: 'T', lowercase: 't', type: 'consonant', soundLabel: 'tờ', spriteKey: 'am_dau__t', exampleWord: 'tay' },
  { letter: 'u', uppercase: 'U', lowercase: 'u', type: 'vowel', soundLabel: 'u', spriteKey: 'van__u', exampleWord: 'vui' },
  { letter: 'ư', uppercase: 'Ư', lowercase: 'ư', type: 'vowel', soundLabel: 'ư', spriteKey: 'van__u_horn', exampleWord: 'thư' },
  { letter: 'v', uppercase: 'V', lowercase: 'v', type: 'consonant', soundLabel: 'vờ', spriteKey: 'am_dau__v', exampleWord: 'vui' },
  { letter: 'x', uppercase: 'X', lowercase: 'x', type: 'consonant', soundLabel: 'xờ', spriteKey: 'am_dau__x', exampleWord: 'xe' },
  { letter: 'y', uppercase: 'Y', lowercase: 'y', type: 'vowel', soundLabel: 'i', spriteKey: 'van__y', exampleWord: 'y tá' }
];

// =========================================================================
// 2. 11 PHỤ ÂM GHÉP TIẾNG VIỆT CHUẨN SGK
// =========================================================================
export const COMPOUND_CONSONANTS: CompoundConsonantItem[] = [
  { consonant: 'ch', soundLabel: 'chờ', spriteKey: 'am_dau__ch', exampleWord: 'chợ' },
  { consonant: 'gh', soundLabel: 'gờ', spriteKey: 'am_dau__gh', exampleWord: 'ghế' },
  { consonant: 'gi', soundLabel: 'giờ', spriteKey: 'am_dau__gi', exampleWord: 'giỏ' },
  { consonant: 'kh', soundLabel: 'khờ', spriteKey: 'am_dau__kh', exampleWord: 'khang' },
  { consonant: 'nh', soundLabel: 'nhờ', spriteKey: 'am_dau__nh', exampleWord: 'nhanh' },
  { consonant: 'ng', soundLabel: 'ngờ', spriteKey: 'am_dau__ng', exampleWord: 'ngoan' },
  { consonant: 'ngh', soundLabel: 'ngờ', spriteKey: 'am_dau__ngh', exampleWord: 'nghỉ' },
  { consonant: 'ph', soundLabel: 'phờ', spriteKey: 'am_dau__ph', exampleWord: 'phố' },
  { consonant: 'qu', soundLabel: 'quờ', spriteKey: 'am_dau__qu', exampleWord: 'quạt' },
  { consonant: 'th', soundLabel: 'thờ', spriteKey: 'am_dau__th', exampleWord: 'thỏ' },
  { consonant: 'tr', soundLabel: 'trờ', spriteKey: 'am_dau__tr', exampleWord: 'trang' }
];

// =========================================================================
// 3. DANH MỤC VẦN THEO 4 HỌ VẦN CHUẨN SƯ PHẠM
// =========================================================================
export const RIME_CATEGORIES: RimeCategory[] = [
  {
    id: 'open_semivowel',
    name: 'Vần Đơn, Đôi & Bán Âm',
    description: 'Các vần mở kết thúc bằng nguyên âm hoặc bán âm (i, y, o, u)',
    rimes: [
      { rime: 'ia', spriteKey: 'van__ia', spellingFormula: 'i - a - ia', spellingSteps: ['van__i', 'van__a', 'van__ia'] },
      { rime: 'ya', spriteKey: 'van__ya', spellingFormula: 'y - a - ya', spellingSteps: ['van__y', 'van__a', 'van__ya'] },
      { rime: 'ua', spriteKey: 'van__ua', spellingFormula: 'u - a - ua', spellingSteps: ['van__u', 'van__a', 'van__ua'] },
      { rime: 'ưa', spriteKey: 'van__ua_horn', spellingFormula: 'ư - a - ưa', spellingSteps: ['van__u_horn', 'van__a', 'van__ua_horn'] },
      { rime: 'iê', spriteKey: 'van__ie', spellingFormula: 'i - ê - iê', spellingSteps: ['van__i', 'van__e_hat', 'van__ie'] },
      { rime: 'yê', spriteKey: 'van__ye', spellingFormula: 'y - ê - yê', spellingSteps: ['van__y', 'van__e_hat', 'van__ye'] },
      { rime: 'uô', spriteKey: 'van__uo_hat', spellingFormula: 'u - ô - uô', spellingSteps: ['van__u', 'van__o_hat', 'van__uo_hat'] },
      { rime: 'ươ', spriteKey: 'van__uo_horn', spellingFormula: 'ư - ơ - ươ', spellingSteps: ['van__u_horn', 'van__o_horn', 'van__uo_horn'] },
      { rime: 'ai', spriteKey: 'van__ai', spellingFormula: 'a - i - ai', spellingSteps: ['van__a', 'van__i', 'van__ai'] },
      { rime: 'ay', spriteKey: 'van__ay', spellingFormula: 'a - y - ay', spellingSteps: ['van__a', 'van__y', 'van__ay'] },
      { rime: 'ây', spriteKey: 'van__a_hat_y', spellingFormula: 'â - y - ây', spellingSteps: ['van__a_hat', 'van__y', 'van__a_hat_y'] },
      { rime: 'ao', spriteKey: 'van__ao', spellingFormula: 'a - o - ao', spellingSteps: ['van__a', 'van__o', 'van__ao'] },
      { rime: 'au', spriteKey: 'van__au', spellingFormula: 'a - u - au', spellingSteps: ['van__a', 'van__u', 'van__au'] },
      { rime: 'âu', spriteKey: 'van__a_hat_u', spellingFormula: 'â - u - âu', spellingSteps: ['van__a_hat', 'van__u', 'van__a_hat_u'] },
      { rime: 'eo', spriteKey: 'van__eo', spellingFormula: 'e - o - eo', spellingSteps: ['van__e', 'van__o', 'van__eo'] },
      { rime: 'êu', spriteKey: 'van__e_hat_u', spellingFormula: 'ê - u - êu', spellingSteps: ['van__e_hat', 'van__u', 'van__e_hat_u'] },
      { rime: 'iu', spriteKey: 'van__iu', spellingFormula: 'i - u - iu', spellingSteps: ['van__i', 'van__u', 'van__iu'] },
      { rime: 'iêu', spriteKey: 'van__ieu', spellingFormula: 'iê - u - iêu', spellingSteps: ['van__ie', 'van__u', 'van__ieu'] },
      { rime: 'yêu', spriteKey: 'van__yeu', spellingFormula: 'yê - u - yêu', spellingSteps: ['van__ye', 'van__u', 'van__yeu'] },
      { rime: 'oi', spriteKey: 'van__oi', spellingFormula: 'o - i - oi', spellingSteps: ['van__o', 'van__i', 'van__oi'] },
      { rime: 'ôi', spriteKey: 'van__o_hat_i', spellingFormula: 'ô - i - ôi', spellingSteps: ['van__o_hat', 'van__i', 'van__o_hat_i'] },
      { rime: 'ơi', spriteKey: 'van__o_horn_i', spellingFormula: 'ơ - i - ơi', spellingSteps: ['van__o_horn', 'van__i', 'van__o_horn_i'] },
      { rime: 'ui', spriteKey: 'van__ui', spellingFormula: 'u - i - ui', spellingSteps: ['van__u', 'van__i', 'van__ui'] },
      { rime: 'ưi', spriteKey: 'van__u_horn_i', spellingFormula: 'ư - i - ưi', spellingSteps: ['van__u_horn', 'van__i', 'van__u_horn_i'] },
      { rime: 'uôi', spriteKey: 'van__uoi', spellingFormula: 'uô - i - uôi', spellingSteps: ['van__uo_hat', 'van__i', 'van__uoi'] },
      { rime: 'ươi', spriteKey: 'van__u_horn_o_horn_i', spellingFormula: 'ươ - i - ươi', spellingSteps: ['van__uo_horn', 'van__i', 'van__u_horn_o_horn_i'] }
    ]
  },
  {
    id: 'nasal_rimes',
    name: 'Vần Mũi Vang (-m, -n, -ng, -nh)',
    description: 'Các vần có âm cuối là phụ âm mũi vang',
    rimes: [
      { rime: 'am', spriteKey: 'van__am', spellingFormula: 'a - mờ - am', spellingSteps: ['van__a', 'am_dau__m', 'van__am'] },
      { rime: 'ăm', spriteKey: 'van__a_breve_m', spellingFormula: 'ă - mờ - ăm', spellingSteps: ['van__a_breve', 'am_dau__m', 'van__a_breve_m'] },
      { rime: 'âm', spriteKey: 'van__a_hat_m', spellingFormula: 'â - mờ - âm', spellingSteps: ['van__a_hat', 'am_dau__m', 'van__a_hat_m'] },
      { rime: 'em', spriteKey: 'van__em', spellingFormula: 'e - mờ - em', spellingSteps: ['van__e', 'am_dau__m', 'van__em'] },
      { rime: 'êm', spriteKey: 'van__e_hat_m', spellingFormula: 'ê - mờ - êm', spellingSteps: ['van__e_hat', 'am_dau__m', 'van__e_hat_m'] },
      { rime: 'im', spriteKey: 'van__im', spellingFormula: 'i - mờ - im', spellingSteps: ['van__i', 'am_dau__m', 'van__im'] },
      { rime: 'om', spriteKey: 'van__om', spellingFormula: 'o - mờ - om', spellingSteps: ['van__o', 'am_dau__m', 'van__om'] },
      { rime: 'ôm', spriteKey: 'van__o_hat_m', spellingFormula: 'ô - mờ - ôm', spellingSteps: ['van__o_hat', 'am_dau__m', 'van__o_hat_m'] },
      { rime: 'ơm', spriteKey: 'van__o_horn_m', spellingFormula: 'ơ - mờ - ơm', spellingSteps: ['van__o_horn', 'am_dau__m', 'van__o_horn_m'] },
      { rime: 'um', spriteKey: 'van__um', spellingFormula: 'u - mờ - um', spellingSteps: ['van__u', 'am_dau__m', 'van__um'] },
      { rime: 'ưm', spriteKey: 'van__u_horn_m', spellingFormula: 'ư - mờ - ưm', spellingSteps: ['van__u_horn', 'am_dau__m', 'van__u_horn_m'] },
      { rime: 'iêm', spriteKey: 'van__iem', spellingFormula: 'iê - mờ - iêm', spellingSteps: ['van__ie', 'am_dau__m', 'van__iem'] },
      { rime: 'yêm', spriteKey: 'van__yem', spellingFormula: 'yê - mờ - yêm', spellingSteps: ['van__ye', 'am_dau__m', 'van__yem'] },
      { rime: 'uôm', spriteKey: 'van__uom_hat', spellingFormula: 'uô - mờ - uôm', spellingSteps: ['van__uo_hat', 'am_dau__m', 'van__uom_hat'] },
      { rime: 'ươm', spriteKey: 'van__uom_horn', spellingFormula: 'ươ - mờ - ươm', spellingSteps: ['van__uo_horn', 'am_dau__m', 'van__uom_horn'] },
      { rime: 'an', spriteKey: 'van__an', spellingFormula: 'a - nờ - an', spellingSteps: ['van__a', 'am_dau__n', 'van__an'] },
      { rime: 'ăn', spriteKey: 'van__a_breve_n', spellingFormula: 'ă - nờ - ăn', spellingSteps: ['van__a_breve', 'am_dau__n', 'van__a_breve_n'] },
      { rime: 'ân', spriteKey: 'van__a_hat_n', spellingFormula: 'â - nờ - ân', spellingSteps: ['van__a_hat', 'am_dau__n', 'van__a_hat_n'] },
      { rime: 'en', spriteKey: 'van__en', spellingFormula: 'e - nờ - en', spellingSteps: ['van__e', 'am_dau__n', 'van__en'] },
      { rime: 'ên', spriteKey: 'van__e_hat_n', spellingFormula: 'ê - nờ - ên', spellingSteps: ['van__e_hat', 'am_dau__n', 'van__e_hat_n'] },
      { rime: 'in', spriteKey: 'van__in', spellingFormula: 'i - nờ - in', spellingSteps: ['van__i', 'am_dau__n', 'van__in'] },
      { rime: 'on', spriteKey: 'van__on', spellingFormula: 'o - nờ - on', spellingSteps: ['van__o', 'am_dau__n', 'van__on'] },
      { rime: 'ôn', spriteKey: 'van__o_hat_n', spellingFormula: 'ô - nờ - ôn', spellingSteps: ['van__o_hat', 'am_dau__n', 'van__o_hat_n'] },
      { rime: 'ơn', spriteKey: 'van__o_horn_n', spellingFormula: 'ơ - nờ - ơn', spellingSteps: ['van__o_horn', 'am_dau__n', 'van__o_horn_n'] },
      { rime: 'un', spriteKey: 'van__un', spellingFormula: 'u - nờ - un', spellingSteps: ['van__u', 'am_dau__n', 'van__un'] },
      { rime: 'ưn', spriteKey: 'van__u_horn_n', spellingFormula: 'ư - nờ - ưn', spellingSteps: ['van__u_horn', 'am_dau__n', 'van__u_horn_n'] },
      { rime: 'iên', spriteKey: 'van__ien', spellingFormula: 'iê - nờ - iên', spellingSteps: ['van__ie', 'am_dau__n', 'van__ien'] },
      { rime: 'yên', spriteKey: 'van__yen', spellingFormula: 'yê - nờ - yên', spellingSteps: ['van__ye', 'am_dau__n', 'van__yen'] },
      { rime: 'uôn', spriteKey: 'van__uan_hat', spellingFormula: 'uô - nờ - uôn', spellingSteps: ['van__uo_hat', 'am_dau__n', 'van__uan_hat'] },
      { rime: 'ươn', spriteKey: 'van__uan_horn', spellingFormula: 'ươ - nờ - ươn', spellingSteps: ['van__uo_horn', 'am_dau__n', 'van__uan_horn'] },
      { rime: 'ang', spriteKey: 'van__ang', spellingFormula: 'a - ngờ - ang', spellingSteps: ['van__a', 'am_dau__ng', 'van__ang'] },
      { rime: 'ăng', spriteKey: 'van__a_breve_ng', spellingFormula: 'ă - ngờ - ăng', spellingSteps: ['van__a_breve', 'am_dau__ng', 'van__a_breve_ng'] },
      { rime: 'âng', spriteKey: 'van__a_hat_ng', spellingFormula: 'â - ngờ - âng', spellingSteps: ['van__a_hat', 'am_dau__ng', 'van__a_hat_ng'] },
      { rime: 'eng', spriteKey: 'van__eng', spellingFormula: 'e - ngờ - eng', spellingSteps: ['van__e', 'am_dau__ng', 'van__eng'] },
      { rime: 'êng', spriteKey: 'van__e_hat_ng', spellingFormula: 'ê - ngờ - êng', spellingSteps: ['van__e_hat', 'am_dau__ng', 'van__e_hat_ng'] },
      { rime: 'ong', spriteKey: 'van__ong', spellingFormula: 'o - ngờ - ong', spellingSteps: ['van__o', 'am_dau__ng', 'van__ong'] },
      { rime: 'ông', spriteKey: 'van__o_hat_ng', spellingFormula: 'ô - ngờ - ông', spellingSteps: ['van__o_hat', 'am_dau__ng', 'van__o_hat_ng'] },
      { rime: 'ung', spriteKey: 'van__ung', spellingFormula: 'u - ngờ - ung', spellingSteps: ['van__u', 'am_dau__ng', 'van__ung'] },
      { rime: 'ưng', spriteKey: 'van__u_horn_ng', spellingFormula: 'ư - ngờ - ưng', spellingSteps: ['van__u_horn', 'am_dau__ng', 'van__u_horn_ng'] },
      { rime: 'iêng', spriteKey: 'van__ieng', spellingFormula: 'iê - ngờ - iêng', spellingSteps: ['van__ie', 'am_dau__ng', 'van__ieng'] },
      { rime: 'yêng', spriteKey: 'van__yeng', spellingFormula: 'yê - ngờ - yêng', spellingSteps: ['van__ye', 'am_dau__ng', 'van__yeng'] },
      { rime: 'uông', spriteKey: 'van__uong_hat', spellingFormula: 'uô - ngờ - uông', spellingSteps: ['van__uo_hat', 'am_dau__ng', 'van__uong_hat'] },
      { rime: 'ương', spriteKey: 'van__uong_horn', spellingFormula: 'ươ - ngờ - ương', spellingSteps: ['van__uo_horn', 'am_dau__ng', 'van__uong_horn'] },
      { rime: 'anh', spriteKey: 'van__anh', spellingFormula: 'a - nhờ - anh', spellingSteps: ['van__a', 'am_dau__nh', 'van__anh'] },
      { rime: 'ênh', spriteKey: 'van__e_hat_nh', spellingFormula: 'ê - nhờ - ênh', spellingSteps: ['van__e_hat', 'am_dau__nh', 'van__e_hat_nh'] },
      { rime: 'inh', spriteKey: 'van__inh', spellingFormula: 'i - nhờ - inh', spellingSteps: ['van__i', 'am_dau__nh', 'van__inh'] }
    ]
  },
  {
    id: 'checked_rimes',
    name: 'Vần Khép Tắc (-p, -t, -c, -ch)',
    description: 'Các vần khép tắc bằng phụ âm ngắn (chỉ đi với thanh Sắc và Nặng)',
    rimes: [
      { rime: 'ap', spriteKey: 'van__ap', spellingFormula: 'a - pờ - ap', spellingSteps: ['van__a', 'am_dau__p', 'van__ap'] },
      { rime: 'ăp', spriteKey: 'van__a_breve_p', spellingFormula: 'ă - pờ - ắp', spellingSteps: ['van__a_breve', 'am_dau__p', 'van__a_breve_p'] },
      { rime: 'âp', spriteKey: 'van__a_hat_p', spellingFormula: 'â - pờ - ấp', spellingSteps: ['van__a_hat', 'am_dau__p', 'van__a_hat_p'] },
      { rime: 'ep', spriteKey: 'van__ep', spellingFormula: 'e - pờ - ep', spellingSteps: ['van__e', 'am_dau__p', 'van__ep'] },
      { rime: 'êp', spriteKey: 'van__e_hat_p', spellingFormula: 'ê - pờ - ếp', spellingSteps: ['van__e_hat', 'am_dau__p', 'van__e_hat_p'] },
      { rime: 'ip', spriteKey: 'van__ip', spellingFormula: 'i - pờ - ip', spellingSteps: ['van__i', 'am_dau__p', 'van__ip'] },
      { rime: 'op', spriteKey: 'van__op', spellingFormula: 'o - pờ - op', spellingSteps: ['van__o', 'am_dau__p', 'van__op'] },
      { rime: 'ôp', spriteKey: 'van__o_hat_p', spellingFormula: 'ô - pờ - ốp', spellingSteps: ['van__o_hat', 'am_dau__p', 'van__o_hat_p'] },
      { rime: 'ơp', spriteKey: 'van__o_horn_p', spellingFormula: 'ơ - pờ - ớp', spellingSteps: ['van__o_horn', 'am_dau__p', 'van__o_horn_p'] },
      { rime: 'up', spriteKey: 'van__up', spellingFormula: 'u - pờ - up', spellingSteps: ['van__u', 'am_dau__p', 'van__up'] },
      { rime: 'ưp', spriteKey: 'van__u_horn_p', spellingFormula: 'ư - pờ - ứp', spellingSteps: ['van__u_horn', 'am_dau__p', 'van__u_horn_p'] },
      { rime: 'iêp', spriteKey: 'van__iep', spellingFormula: 'iê - pờ - iếp', spellingSteps: ['van__ie', 'am_dau__p', 'van__iep'] },
      { rime: 'uôp', spriteKey: 'van__uop_hat', spellingFormula: 'uô - pờ - uốp', spellingSteps: ['van__uo_hat', 'am_dau__p', 'van__uop_hat'] },
      { rime: 'ươp', spriteKey: 'van__uop_horn', spellingFormula: 'ươ - pờ - ướp', spellingSteps: ['van__uo_horn', 'am_dau__p', 'van__uop_horn'] },
      { rime: 'at', spriteKey: 'van__at', spellingFormula: 'a - tờ - at', spellingSteps: ['van__a', 'am_dau__t', 'van__at'] },
      { rime: 'ăt', spriteKey: 'van__a_breve_t', spellingFormula: 'ă - tờ - ắt', spellingSteps: ['van__a_breve', 'am_dau__t', 'van__a_breve_t'] },
      { rime: 'ât', spriteKey: 'van__a_hat_t', spellingFormula: 'â - tờ - ất', spellingSteps: ['van__a_hat', 'am_dau__t', 'van__a_hat_t'] },
      { rime: 'et', spriteKey: 'van__et', spellingFormula: 'e - tờ - et', spellingSteps: ['van__e', 'am_dau__t', 'van__et'] },
      { rime: 'êt', spriteKey: 'van__e_hat_t', spellingFormula: 'ê - tờ - ết', spellingSteps: ['van__e_hat', 'am_dau__t', 'van__e_hat_t'] },
      { rime: 'it', spriteKey: 'van__it', spellingFormula: 'i - tờ - it', spellingSteps: ['van__i', 'am_dau__t', 'van__it'] },
      { rime: 'ot', spriteKey: 'van__ot', spellingFormula: 'o - tờ - ot', spellingSteps: ['van__o', 'am_dau__t', 'van__ot'] },
      { rime: 'ôt', spriteKey: 'van__o_hat_t', spellingFormula: 'ô - tờ - ốt', spellingSteps: ['van__o_hat', 'am_dau__t', 'van__o_hat_t'] },
      { rime: 'ơt', spriteKey: 'van__o_horn_t', spellingFormula: 'ơ - tờ - ớt', spellingSteps: ['van__o_horn', 'am_dau__t', 'van__o_horn_t'] },
      { rime: 'ut', spriteKey: 'van__ut', spellingFormula: 'u - tờ - ut', spellingSteps: ['van__u', 'am_dau__t', 'van__ut'] },
      { rime: 'ưt', spriteKey: 'van__u_horn_t', spellingFormula: 'ư - tờ - ứt', spellingSteps: ['van__u_horn', 'am_dau__t', 'van__u_horn_t'] },
      { rime: 'iêt', spriteKey: 'van__iet', spellingFormula: 'iê - tờ - iết', spellingSteps: ['van__ie', 'am_dau__t', 'van__iet'] },
      { rime: 'uôt', spriteKey: 'van__uot_hat', spellingFormula: 'uô - tờ - uốt', spellingSteps: ['van__uo_hat', 'am_dau__t', 'van__uot_hat'] },
      { rime: 'ươt', spriteKey: 'van__uot_horn', spellingFormula: 'ươ - tờ - ướt', spellingSteps: ['van__uo_horn', 'am_dau__t', 'van__uot_horn'] },
      { rime: 'ac', spriteKey: 'van__ac', spellingFormula: 'a - cờ - ac', spellingSteps: ['van__a', 'am_dau__c', 'van__ac'] },
      { rime: 'ăc', spriteKey: 'van__a_breve_c', spellingFormula: 'ă - cờ - ắc', spellingSteps: ['van__a_breve', 'am_dau__c', 'van__a_breve_c'] },
      { rime: 'âc', spriteKey: 'van__a_hat_c', spellingFormula: 'â - cờ - ấc', spellingSteps: ['van__a_hat', 'am_dau__c', 'van__a_hat_c'] },
      { rime: 'ec', spriteKey: 'van__ec', spellingFormula: 'e - cờ - ec', spellingSteps: ['van__e', 'am_dau__c', 'van__ec'] },
      { rime: 'êc', spriteKey: 'van__e_hat_c', spellingFormula: 'ê - cờ - ếc', spellingSteps: ['van__e_hat', 'am_dau__c', 'van__e_hat_c'] },
      { rime: 'oc', spriteKey: 'van__oc', spellingFormula: 'o - cờ - oc', spellingSteps: ['van__o', 'am_dau__c', 'van__oc'] },
      { rime: 'ôc', spriteKey: 'van__o_hat_c', spellingFormula: 'ô - cờ - ốc', spellingSteps: ['van__o_hat', 'am_dau__c', 'van__o_hat_c'] },
      { rime: 'uc', spriteKey: 'van__uc', spellingFormula: 'u - cờ - uc', spellingSteps: ['van__u', 'am_dau__c', 'van__uc'] },
      { rime: 'ưc', spriteKey: 'van__u_horn_c', spellingFormula: 'ư - cờ - ức', spellingSteps: ['van__u_horn', 'am_dau__c', 'van__u_horn_c'] },
      { rime: 'iêc', spriteKey: 'van__iec', spellingFormula: 'iê - cờ - iếc', spellingSteps: ['van__ie', 'am_dau__c', 'van__iec'] },
      { rime: 'uôc', spriteKey: 'van__uoc_hat', spellingFormula: 'uô - cờ - uốc', spellingSteps: ['van__uo_hat', 'am_dau__c', 'van__uoc_hat'] },
      { rime: 'ươc', spriteKey: 'van__uoc_horn', spellingFormula: 'ươ - cờ - ước', spellingSteps: ['van__uo_horn', 'am_dau__c', 'van__uoc_horn'] },
      { rime: 'ach', spriteKey: 'van__ach', spellingFormula: 'a - chờ - ach', spellingSteps: ['van__a', 'am_dau__ch', 'van__ach'] },
      { rime: 'êch', spriteKey: 'van__e_hat_ch', spellingFormula: 'ê - chờ - ếch', spellingSteps: ['van__e_hat', 'am_dau__ch', 'van__e_hat_ch'] },
      { rime: 'ich', spriteKey: 'van__ich', spellingFormula: 'i - chờ - ích', spellingSteps: ['van__i', 'am_dau__ch', 'van__ich'] }
    ]
  },
  {
    id: 'glide_rimes',
    name: 'Vần Có Âm Đệm (o-, u-)',
    description: 'Các vần có âm đệm tròn môi o hoặc u đi kèm',
    rimes: [
      { rime: 'oa', spriteKey: 'van__oa', spellingFormula: 'o - a - oa', spellingSteps: ['van__o', 'van__a', 'van__oa'] },
      { rime: 'oe', spriteKey: 'van__oe', spellingFormula: 'o - e - oe', spellingSteps: ['van__o', 'van__e', 'van__oe'] },
      { rime: 'oai', spriteKey: 'van__oai', spellingFormula: 'oa - i - oai', spellingSteps: ['van__oa', 'van__i', 'van__oai'] },
      { rime: 'oay', spriteKey: 'van__oay', spellingFormula: 'oa - y - oay', spellingSteps: ['van__oa', 'van__y', 'van__oay'] },
      { rime: 'oeo', spriteKey: 'van__oeo', spellingFormula: 'oe - o - oeo', spellingSteps: ['van__oe', 'van__o', 'van__oeo'] },
      { rime: 'oam', spriteKey: 'van__oam', spellingFormula: 'oa - mờ - oam', spellingSteps: ['van__oa', 'am_dau__m', 'van__oam'] },
      { rime: 'oan', spriteKey: 'van__oan', spellingFormula: 'oa - nờ - oan', spellingSteps: ['van__oa', 'am_dau__n', 'van__oan'] },
      { rime: 'oăn', spriteKey: 'van__oan_breve', spellingFormula: 'o - ăn - oăn', spellingSteps: ['van__o', 'van__a_breve_n', 'van__oan_breve'] },
      { rime: 'oang', spriteKey: 'van__oang', spellingFormula: 'oa - ngờ - oang', spellingSteps: ['van__oa', 'am_dau__ng', 'van__oang'] },
      { rime: 'oăng', spriteKey: 'van__oang_breve', spellingFormula: 'o - ăng - oăng', spellingSteps: ['van__o', 'van__a_breve_ng', 'van__oang_breve'] },
      { rime: 'oanh', spriteKey: 'van__oanh', spellingFormula: 'oa - nhờ - oanh', spellingSteps: ['van__oa', 'am_dau__nh', 'van__oanh'] },
      { rime: 'oat', spriteKey: 'van__oat', spellingFormula: 'oa - tờ - oat', spellingSteps: ['van__oa', 'am_dau__t', 'van__oat'] },
      { rime: 'oăt', spriteKey: 'van__oat_breve', spellingFormula: 'o - ắt - oắt', spellingSteps: ['van__o', 'van__a_breve_t', 'van__oat_breve'] },
      { rime: 'oac', spriteKey: 'van__oac', spellingFormula: 'oa - cờ - oac', spellingSteps: ['van__oa', 'am_dau__c', 'van__oac'] },
      { rime: 'oăc', spriteKey: 'van__oac_breve', spellingFormula: 'o - ắc - oắc', spellingSteps: ['van__o', 'van__a_breve_c', 'van__oac_breve'] },
      { rime: 'oach', spriteKey: 'van__oach', spellingFormula: 'oa - chờ - oach', spellingSteps: ['van__oa', 'am_dau__ch', 'van__oach'] },
      { rime: 'ue', spriteKey: 'van__ue', spellingFormula: 'u - e - ue', spellingSteps: ['van__u', 'van__e', 'van__ue'] },
      { rime: 'uay', spriteKey: 'van__uay', spellingFormula: 'u - ay - uay', spellingSteps: ['van__u', 'van__ay', 'van__uay'] },
      { rime: 'uân', spriteKey: 'van__uan_hat_a', spellingFormula: 'u - ân - uân', spellingSteps: ['van__u', 'van__a_hat_n', 'van__uan_hat_a'] },
      { rime: 'uên', spriteKey: 'van__uen', spellingFormula: 'u - ên - uên', spellingSteps: ['van__u', 'van__e_hat_n', 'van__uen'] },
      { rime: 'uâng', spriteKey: 'van__uang_hat', spellingFormula: 'u - âng - uâng', spellingSteps: ['van__u', 'van__a_hat_ng', 'van__uang_hat'] },
      { rime: 'uya', spriteKey: 'van__uya', spellingFormula: 'u - ya - uya', spellingSteps: ['van__u', 'van__ya', 'van__uya'] },
      { rime: 'uyu', spriteKey: 'van__uyu', spellingFormula: 'u - y - u - uyu', spellingSteps: ['van__u', 'van__y', 'van__u', 'van__uyu'] },
      { rime: 'uyên', spriteKey: 'van__uyen', spellingFormula: 'u - yên - uyên', spellingSteps: ['van__u', 'van__yen', 'van__uyen'] },
      { rime: 'uyêt', spriteKey: 'van__uyet', spellingFormula: 'u - iết - uyết', spellingSteps: ['van__u', 'van__iet', 'van__uyet'] },
      { rime: 'uynh', spriteKey: 'van__uynh', spellingFormula: 'u - y - nhờ - uynh', spellingSteps: ['van__u', 'van__y', 'am_dau__nh', 'van__uynh'] },
      { rime: 'uýt', spriteKey: 'van__uyt', spellingFormula: 'u - it - uýt', spellingSteps: ['van__u', 'van__it', 'van__uyt'] },
      { rime: 'uých', spriteKey: 'van__uych', spellingFormula: 'u - ích - uých', spellingSteps: ['van__u', 'van__ich', 'van__uych'] }
    ]
  }
];

// =========================================================================
// 4. BẢNG TRA CỨU NHANH TỪ VỰNG KHO MASTER SPRITE CHO KHAY GHÉP ÂM
// =========================================================================
const CORE_WORD_SPRITE_KEYS: Record<string, string> = {
  'ban': 'tu__ban_ngang',
  'bạn': 'tu__ban',
  'bàn': 'tu__ban_ngang',
  'bé': 'tu__be',
  'be': 'tu__be_ngang',
  'bai': 'tu__bai',
  'bài': 'tu__bai_huyen',
  'bắt': 'tu__bat',
  'bơi': 'tu__boi',
  'ca': 'tu__ca',
  'cá': 'tu__ca_sac',
  'cai': 'tu__cai_ngang',
  'cái': 'tu__cai',
  'canh': 'tu__canh',
  'cành': 'tu__canh_huyen',
  'cây': 'tu__cay',
  'chi': 'tu__chi',
  'chỉ': 'tu__chi_hoi',
  'chim': 'tu__chim',
  'chích': 'tu__chich',
  'cho': 'tu__cho',
  'chích chòe': 'tu__choe',
  'chu': 'tu__chu',
  'chữ': 'tu__chu',
  'chú': 'tu__chu_sac',
  'chuột': 'tu__chuot',
  'cô': 'tu__co',
  'con': 'tu__con',
  'của': 'tu__cua',
  'dau': 'tu__dau',
  'dâu': 'tu__dau',
  'đầu': 'tu__dau_huyen',
  'diem': 'tu__diem',
  'điểm': 'tu__diem_hoi',
  'em': 'tu__em',
  'gặp': 'tu__gap_nang',
  'giặt': 'tu__giat',
  'giắt': 'tu__giat_sac',
  'giao': 'tu__giao',
  'giáo': 'tu__giao_sac',
  'giúp': 'tu__giup',
  'hát': 'tu__hat',
  'hoa': 'tu__hoa',
  'học': 'tu__hoc',
  'hót': 'tu__hot',
  'hoi': 'tu__hoi',
  'hỏi': 'tu__hoi',
  'huỵch': 'tu__huych',
  'ít': 'tu__it_nang',
  'khăn': 'tu__khan',
  'khang': 'tu__khang',
  'khen': 'tu__khen',
  'khuỷu': 'tu__khuyu',
  'líu': 'tu__liu',
  'lo': 'tu__lo',
  'me': 'tu__me_ngang',
  'mẹ': 'tu__me',
  'mắt': 'tu__mat',
  'mười': 'tu__muoi',
  'nhanh': 'tu__nhanh',
  'nho': 'tu__nho',
  'nhỏ': 'tu__nho_hoi',
  'ngoan': 'tu__ngoan',
  'nguyên': 'tu__nguyen',
  'quạt': 'tu__quat',
  'quốc': 'tu__quoc',
  'quàng': 'tu__quang',
  'sách': 'tu__sach',
  'sạch': 'tu__sach_nang',
  'sau': 'tu__sau',
  'tay': 'tu__tay',
  'tiếng': 'tu__tieng',
  'trang': 'tu__trang',
  'trên': 'tu__tren',
  'trường': 'tu__truong',
  've': 'tu__ve',
  'vẻ': 'tu__ve_hoi',
  'về': 'tu__ve_huyen',
  'vẽ': 'tu__ve_hoi',
  'vui': 'tu__vui',
  'vịt': 'tu__vit'
};

// =========================================================================
// 5. HÀM GHÉP ÂM TƯƠNG TÁC CHO MONTESSORI BLENDING TRAY
// =========================================================================
export function blendSoundWithPhonics(consonant: string, rime: string): BlendResult {
  const normalizedConsonant = consonant.trim().toLowerCase();
  const normalizedRime = rime.trim().toLowerCase();
  const blendedWord = `${normalizedConsonant}${normalizedRime}`;

  // 1. Tìm spriteKey cho âm đầu
  let consonantKey = `am_dau__${normalizedConsonant}`;
  if (normalizedConsonant === 'đ') consonantKey = 'am_dau__dd';
  else if (normalizedConsonant === 'q') consonantKey = 'am_dau__qu';

  // 2. Tìm spriteKey cho vần
  let rimeKey = `van__${normalizedRime}`;
  // Tra cứu theo danh mục RIME_CATEGORIES nếu có quy tắc đặc biệt
  for (const cat of RIME_CATEGORIES) {
    const found = cat.rimes.find(r => r.rime === normalizedRime);
    if (found) {
      rimeKey = found.spriteKey;
      break;
    }
  }

  // 3. Tìm spriteKey cho từ ghép kết quả (nếu có sẵn trong Master Sprite)
  const blendedWordKey = CORE_WORD_SPRITE_KEYS[blendedWord];

  // 4. Chuỗi âm thanh sư phạm: [âm đầu] -> [vần] -> [tiếng ghép hoàn chỉnh]
  // Luôn đảm bảo đủ 3 bước phát âm sư phạm: âm đầu -> vần -> tiếng ghép
  const audioSteps: string[] = [consonantKey, rimeKey, blendedWordKey || blendedWord];

  return {
    consonant: normalizedConsonant,
    rime: normalizedRime,
    blendedWord,
    consonantKey,
    rimeKey,
    blendedWordKey,
    audioSteps
  };
}
