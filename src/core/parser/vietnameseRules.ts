/**
 * Quy chuẩn Ngữ âm Tiếng Việt Lớp 1 - SGK Kết nối tri thức với cuộc sống
 */
import { ToneInfo, ToneType } from '../../types';

// Danh sách 22 Âm đầu chính thức theo SGK Tiếng Việt 1
export const INITIAL_CONSONANTS = [
  'b', 'c', 'd', 'đ', 'g', 'gh', 'gi', 'h', 'k', 'kh', 
  'l', 'm', 'n', 'ng', 'ngh', 'nh', 'p', 'ph', 'qu', 'r', 
  's', 't', 'th', 'tr', 'v', 'x'
] as const;

// 6 Dấu thanh Tiếng Việt
export const TONES: Record<ToneType, ToneInfo> = {
  ngang: { type: 'ngang', name: 'không dấu (ngang)', symbol: '', description: 'Thanh không' },
  huyen: { type: 'huyen', name: 'huyền', symbol: '`', description: 'Thanh huyền (giáng nhẹ)' },
  sac: { type: 'sac', name: 'sắc', symbol: '´', description: 'Thanh sắc (lên cao)' },
  hoi: { type: 'hoi', name: 'hỏi', symbol: '?', description: 'Thanh hỏi (xuống rồi lên)' },
  nga: { type: 'nga', name: 'ngã', symbol: '~', description: 'Thanh ngã (lên cao có gãy)' },
  nang: { type: 'nang', name: 'nặng', symbol: '.', description: 'Thanh nặng (xuống thấp nghẽn)' },
};

// Các vần thông dụng Lớp 1
export const COMMON_RIMES = [
  // Vần đơn
  'a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y',
  // Vần ghép 2 âm
  'ai', 'ay', 'ây', 'ao', 'au', 'âu', 'an', 'ăn', 'ân', 'am', 'ăm', 'âm',
  'ap', 'ắp', 'ập', 'at', 'ắt', 'ật', 'ac', 'ắc', 'ặc', 'ach', 'ech', 'ich',
  'em', 'êm', 'en', 'ên', 'ep', 'êp', 'et', 'êt', 'in', 'im', 'ip', 'it',
  'om', 'ôm', 'ơm', 'on', 'ôn', 'ơn', 'op', 'ôp', 'ơp', 'ot', 'ôt', 'ơt',
  'oi', 'ôi', 'ơi', 'ong', 'ông', 'ung', 'ưng', 'oc', 'ôc', 'uc', 'ưc',
  // Vần ghép 3 âm
  'oan', 'oat', 'oang', 'oac', 'oai', 'oay', 'oen', 'oet',
  'uân', 'uât', 'uông', 'uôc', 'uôi', 'uôm',
  'uyên', 'uyêt', 'uy', 'uya', 'uyn', 'uyt',
  'iên', 'iêt', 'iêng', 'iêc', 'iêm', 'iêp', 'ieu', 'yêu',
  'ươn', 'ươt', 'ương', 'ươc', 'ươm', 'ươp', 'ươu'
] as const;
