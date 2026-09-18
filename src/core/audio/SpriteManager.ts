/**
 * Mô-đun 3.2 & 4: SpriteManager - Nạp và phát Audio Sprite chuẩn Web Audio API
 * NGUỒN DUY NHẤT: danh_muc_am_thanh_lop_1.md (100% chuẩn SGK Tiếng Việt 1 Kết Nối Tri Thức)
 *
 * ĐÃ TỐI ƯU TOÀN DIỆN:
 * 1. Lookahead Audio Scheduling (25ms buffer) chống audio underflow
 * 2. Gain Envelope mượt mà với Fade-in 8ms / Fade-out 8ms và xả Gain 3ms khi stop
 * 3. Zero-Crossing Hann Windowing 12ms & Hard clamp 64 mẫu PCM về 0.0000
 * 4. Đồng bộ Promise thời gian thực bằng setTimeout
 * 5. Giữ nguyên playbackRate = 1.0 bảo toàn cao độ sư phạm tự nhiên
 */

import { webAudioEngine } from './WebAudioEngine.ts';
import { audioCacheService } from './AudioCacheService.ts';
import { zaloTtsClient } from './ZaloTtsClient.ts';
import { audioDspProcessor } from './AudioDspProcessor.ts';

export interface SpriteSegmentInfo {
  start: number;
  end: number;
  duration: number;
}

export type AudioSpriteMap = Record<string, SpriteSegmentInfo>;

// BẢNG ÁNH XẠ TOKEN -> SPRITE KEY CHUẨN 100% TỪ danh_muc_am_thanh_lop_1.md
const TOKEN_TO_SPRITE_KEY_MAP: Record<string, string> = {
  // ==========================================
  // 1. 27 ÂM ĐẦU (Ký tự & Dạng đọc sư phạm)
  // ==========================================
  'b': 'am_dau__b', 'bờ': 'am_dau__b',
  'c': 'am_dau__c', 'cờ': 'am_dau__c',
  'ch': 'am_dau__ch', 'chờ': 'am_dau__ch',
  'd': 'am_dau__d', 'dờ': 'am_dau__d',
  'đ': 'am_dau__dd', 'đờ': 'am_dau__dd',
  'g': 'am_dau__g', 'gờ': 'am_dau__g',
  'gh': 'am_dau__gh', 'ghờ': 'am_dau__gh',
  'gi': 'am_dau__gi', 'giờ': 'am_dau__gi',
  'h': 'am_dau__h', 'hờ': 'am_dau__h',
  'k': 'am_dau__k', 'kờ': 'am_dau__k',
  'kh': 'am_dau__kh', 'khờ': 'am_dau__kh',
  'l': 'am_dau__l', 'lờ': 'am_dau__l',
  'm': 'am_dau__m', 'mờ': 'am_dau__m',
  'n': 'am_dau__n', 'nờ': 'am_dau__n',
  'ng': 'am_dau__ng', 'ngờ': 'am_dau__ng',
  'ngh': 'am_dau__ngh', 'nghờ': 'am_dau__ngh',
  'nh': 'am_dau__nh', 'nhờ': 'am_dau__nh',
  'p': 'am_dau__p', 'pờ': 'am_dau__p',
  'ph': 'am_dau__ph', 'phờ': 'am_dau__ph',
  'qu': 'am_dau__qu', 'quờ': 'am_dau__qu',
  'r': 'am_dau__r', 'rờ': 'am_dau__r',
  's': 'am_dau__s', 'sờ': 'am_dau__s',
  't': 'am_dau__t', 'tờ': 'am_dau__t',
  'th': 'am_dau__th', 'thờ': 'am_dau__th',
  'tr': 'am_dau__tr', 'trờ': 'am_dau__tr',
  'v': 'am_dau__v', 'vờ': 'am_dau__v',
  'x': 'am_dau__x', 'xờ': 'am_dau__x',

  // ==========================================
  // 2. 6 DẤU THANH
  // ==========================================
  'ngang': 'thanh__ngang', 'không dấu': 'thanh__ngang', 'thanh ngang': 'thanh__ngang',
  'huyền': 'thanh__huyen', 'huyen': 'thanh__huyen', 'thanh huyền': 'thanh__huyen',
  'sắc': 'thanh__sac', 'sac': 'thanh__sac', 'thanh sắc': 'thanh__sac',
  'thanh hỏi': 'thanh__hoi', 'dấu hỏi': 'thanh__hoi', 'thanh_hoi': 'thanh__hoi',
  'ngã': 'thanh__nga', 'nga': 'thanh__nga', 'thanh ngã': 'thanh__nga',
  'nặng': 'thanh__nang', 'nang': 'thanh__nang', 'thanh nặng': 'thanh__nang',

  // ==========================================
  // 3. TOÀN BỘ VẦN TIẾNG VIỆT LỚP 1
  // ==========================================
  // Nhóm 1: Vần đơn & Nguyên âm đôi (20 vần)
  'a': 'van__a',
  'ă': 'van__a_breve',
  'â': 'van__a_hat',
  'e': 'van__e',
  'ê': 'van__e_hat',
  'i': 'van__i',
  'y': 'van__y',
  'o': 'van__o',
  'ô': 'van__o_hat',
  'ơ': 'van__o_horn',
  'u': 'van__u',
  'ư': 'van__u_horn',
  'ia': 'van__ia',
  'ya': 'van__ya',
  'iê': 'van__ie',
  'yê': 'van__ye',
  'ua': 'van__ua',
  'uô': 'van__uo_hat',
  'ưa': 'van__ua_horn',
  'ươ': 'van__uo_horn',

  // Nhóm 2: Vần kết thúc bằng bán âm i/y, o/u (25 vần)
  'ai': 'van__ai',
  'ay': 'van__ay',
  'ây': 'van__a_hat_y',
  'ao': 'van__ao',
  'au': 'van__au',
  'âu': 'van__a_hat_u',
  'eo': 'van__eo',
  'êu': 'van__e_hat_u',
  'iu': 'van__iu',
  'iêu': 'van__ieu',
  'yêu': 'van__yeu',
  'oi': 'van__oi',
  'ôi': 'van__o_hat_i',
  'ơi': 'van__o_horn_i',
  'ui': 'van__ui',
  'ưi': 'van__u_horn_i',
  'uôi': 'van__uoi',
  'ươi': 'van__u_horn_o_horn_i',
  'oa': 'van__oa',
  'oe': 'van__oe',
  'oai': 'van__oai',
  'oay': 'van__oay',
  'oeo': 'van__oeo',
  'uya': 'van__uya',
  'uyu': 'van__uyu',

  // Nhóm 3: Vần kết thúc bằng phụ âm mũi m, n, ng, nh (56 vần)
  // Kết thúc -m:
  'am': 'van__am',
  'ăm': 'van__a_breve_m',
  'âm': 'van__a_hat_m',
  'vần em': 'van__em', 'van__em': 'van__em',
  'êm': 'van__e_hat_m',
  'im': 'van__im',
  'om': 'van__om',
  'ôm': 'van__o_hat_m',
  'ơm': 'van__o_horn_m',
  'um': 'van__um',
  'ưm': 'van__u_horn_m',
  'iêm': 'van__iem',
  'yêm': 'van__yem',
  'uôm': 'van__uom_hat',
  'ươm': 'van__uom_horn',
  'oam': 'van__oam',

  // Kết thúc -n:
  'an': 'van__an',
  'ăn': 'van__a_breve_n',
  'ân': 'van__a_hat_n',
  'en': 'van__en',
  'ên': 'van__e_hat_n',
  'in': 'van__in',
  'on': 'van__on',
  'ôn': 'van__o_hat_n',
  'ơn': 'van__o_horn_n',
  'un': 'van__un',
  'ưn': 'van__u_horn_n',
  'iên': 'van__ien',
  'yên': 'van__yen',
  'uôn': 'van__uan_hat',
  'ươn': 'van__uan_horn',
  'oan': 'van__oan',
  'oăn': 'van__oan_breve',
  'uân': 'van__uan_hat_a',
  'uên': 'van__uen',

  // Kết thúc -ng:
  'ang': 'van__ang',
  'ăng': 'van__a_breve_ng',
  'âng': 'van__a_hat_ng',
  'eng': 'van__eng',
  'êng': 'van__e_hat_ng',
  'ong': 'van__ong',
  'ông': 'van__o_hat_ng',
  'ung': 'van__ung',
  'ưng': 'van__u_horn_ng',
  'iêng': 'van__ieng',
  'yêng': 'van__yeng',
  'uông': 'van__uong_hat',
  'ương': 'van__uong_horn',
  'oang': 'van__oang',
  'oăng': 'van__oang_breve',
  'uâng': 'van__uang_hat',

  // Kết thúc -nh:
  'anh': 'van__anh',
  'ênh': 'van__e_hat_nh',
  'inh': 'van__inh',
  'oanh': 'van__oanh',
  'uynh': 'van__uynh',

  // Nhóm 4: Vần kết thúc bằng phụ âm tắc p, t, c, ch (44 vần) - Ánh xạ cả 2 dạng (không dấu và sắc)
  // Kết thúc -p:
  'ap': 'van__ap', 'áp': 'van__ap',
  'ăp': 'van__a_breve_p', 'ắp': 'van__a_breve_p',
  'âp': 'van__a_hat_p', 'ấp': 'van__a_hat_p',
  'ep': 'van__ep', 'ép': 'van__ep',
  'êp': 'van__e_hat_p', 'ếp': 'van__e_hat_p',
  'ip': 'van__ip', 'íp': 'van__ip',
  'op': 'van__op', 'óp': 'van__op',
  'ôp': 'van__o_hat_p', 'ốp': 'van__o_hat_p',
  'ơp': 'van__o_horn_p', 'ớp': 'van__o_horn_p',
  'up': 'van__up', 'úp': 'van__up',
  'ưp': 'van__u_horn_p',
  'iep': 'van__iep', 'iêp': 'van__iep', 'iếp': 'van__iep',
  'uop': 'van__uop_hat', 'uôp': 'van__uop_hat', 'uốp': 'van__uop_hat',
  'ươp': 'van__uop_horn', 'ướp': 'van__uop_horn',

  // Kết thúc -t:
  'at': 'van__at', 'át': 'van__at',
  'ăt': 'van__a_breve_t', 'ắt': 'van__a_breve_t',
  'ât': 'van__a_hat_t', 'ất': 'van__a_hat_t',
  'et': 'van__et', 'ét': 'van__et',
  'êt': 'van__e_hat_t', 'ết': 'van__e_hat_t',
  'it': 'van__it', 'ít': 'van__it',
  'ot': 'van__ot', 'ót': 'van__ot',
  'ôt': 'van__o_hat_t', 'ốt': 'van__o_hat_t',
  'ơt': 'van__o_horn_t', 'ớt': 'van__o_horn_t',
  'ut': 'van__ut', 'út': 'van__ut',
  'ưt': 'van__u_horn_t', 'ứt': 'van__u_horn_t',
  'iet': 'van__iet', 'iêt': 'van__iet', 'iết': 'van__iet',
  'yet': 'van__iet', 'yêt': 'van__iet', 'yết': 'van__iet',
  'uot': 'van__uot_hat', 'uôt': 'van__uot_hat', 'uốt': 'van__uot_hat',
  'ươt': 'van__uot_horn', 'ướt': 'van__uot_horn',
  'oat': 'van__oat', 'oát': 'van__oat',
  'oăt': 'van__oat_breve', 'oắt': 'van__oat_breve',
  'uat': 'van__uat_hat', 'uât': 'van__uat_hat', 'uất': 'van__uat_hat',
  'uyet': 'van__uyet', 'uyêt': 'van__uyet', 'uyết': 'van__uyet',
  'uyt': 'van__uyt', 'uýt': 'van__uyt',

  // Kết thúc -c:
  'ac': 'van__ac', 'ác': 'van__ac',
  'ăc': 'van__a_breve_c', 'ắc': 'van__a_breve_c',
  'âc': 'van__a_hat_c', 'ấc': 'van__a_hat_c',
  'ec': 'van__ec', 'éc': 'van__ec',
  'êc': 'van__e_hat_c', 'ếc': 'van__e_hat_c',
  'oc': 'van__oc', 'óc': 'van__oc',
  'ôc': 'van__o_hat_c', 'ốc': 'van__o_hat_c',
  'uc': 'van__uc', 'úc': 'van__uc',
  'ưc': 'van__u_horn_c', 'ức': 'van__u_horn_c',
  'iec': 'van__iec', 'iêc': 'van__iec', 'iếc': 'van__iec',
  'uoc': 'van__uoc_hat', 'uôc': 'van__uoc_hat', 'uốc': 'van__uoc_hat',
  'ươc': 'van__uoc_horn', 'ước': 'van__uoc_horn',
  'oac': 'van__oac', 'oác': 'van__oac',
  'oăc': 'van__oac_breve', 'oắc': 'van__oac_breve',

  // Kết thúc -ch:
  'ach': 'van__ach', 'ách': 'van__ach',
  'êch': 'van__e_hat_ch', 'ếch': 'van__e_hat_ch',
  'ich': 'van__ich', 'ích': 'van__ich',
  'oach': 'van__oach', 'oách': 'van__oach',
  'uych': 'van__uych', 'uých': 'van__uych',

  // ==========================================
  // 4. TIẾNG TRUNG GIAN & TỪ ĐẶC BIỆT SGK LỚP 1
  // ==========================================
  'lớp': 'tu__lop',
  'lơp': 'tu__lop_ngang',
  'lop': 'tu__lop_ngang',
  'băt': 'tu__bat',
  'bat': 'tu__bat',
  'hat': 'tu__hat',
  'sach': 'tu__sach',
  'chich': 'tu__chich',
  'quoc': 'tu__quoc',
  'quôc': 'tu__quoc',
  'giăt': 'tu__giat_sac',
  'giat': 'tu__giat_sac',
  'hoc': 'tu__hoc_sac',
  'vit': 'tu__vit_sac',
  'măt': 'tu__mat_sac',
  'mat': 'tu__mat_sac',
  'quat': 'tu__quat_sac',
  'chuôt': 'tu__chuot_sac',
  'chuot': 'tu__chuot_sac',
  'giắt': 'tu__giat_sac',
  'giặt': 'tu__giat',
  'hóc': 'tu__hoc_sac',
  'học': 'tu__hoc',
  'vít': 'tu__vit_sac',
  'vịt': 'tu__vit',
  'mắt': 'tu__mat_sac',
  'mặt': 'tu__mat',
  'quát': 'tu__quat_sac',
  'quạt': 'tu__quat',
  'chuốt': 'tu__chuot_sac',
  'chuột': 'tu__chuot',
  'bắt': 'tu__bat',
  'hát': 'tu__hat',
  'sách': 'tu__sach',
  'quốc': 'tu__quoc',
  'trương': 'tu__truong_ngang',
  'trường': 'tu__truong',
  'quang': 'tu__quang',
  'khuyu': 'tu__khuyu_ngang',
  'khuỷu': 'tu__khuyu',
  'nguyễn': 'tu__nguyen',
  'chích': 'tu__chich',
  'chòe': 'tu__choe',
  'huých': 'tu__huych',
  'chim': 'tu__chim',
  'hoa': 'tu__hoa',
  'me': 'tu__me_ngang',
  'mẹ': 'tu__me',
  'be': 'tu__be_ngang',
  'bé': 'tu__be',
  'ban': 'tu__ban_ngang',
  'bạn': 'tu__ban',
  'ịt': 'tu__it_nang',
  'ạc': 'tu__ac_nang',

  // ==========================================
  // 5. TOÀN BỘ TỪ VỰNG 4 BÀI ĐỌC MẪU SGK LỚP 1
  // ==========================================
  // Bài 1: Trường học của em
  'em': 'tu__em',
  'của': 'tu__cua', 'cua': 'tu__cua_ngang',
  'khang': 'tu__khang',
  'trang': 'tu__trang',
  'tiếng': 'tu__tieng', 'tiêng': 'tu__tieng_ngang', 'tieng': 'tu__tieng_ngang',
  'hót': 'tu__hot',
  'líu': 'tu__liu_sac', 'liu': 'tu__liu',
  'lo': 'tu__lo',
  'trên': 'tu__tren', 'tren': 'tu__tren',
  'cành': 'tu__canh_huyen', 'canh': 'tu__canh',
  'cây': 'tu__cay', 'cay': 'tu__cay',
  'bài': 'tu__bai_huyen', 'bai': 'tu__bai',
  'vui': 'tu__vui',
  'vẻ': 'tu__ve_hoi', 've': 'tu__ve',

  // Bài 2: Vè chim chích
  'vè': 'tu__ve_huyen',
  'cái': 'tu__cai', 'cai': 'tu__cai_ngang',
  'sâu': 'tu__sau',
  'đầu': 'tu__dau_huyen', 'đâu': 'tu__dau', 'dau': 'tu__dau',
  'giúp': 'tu__giup',
  'cho': 'tu__cho',

  // Bài 3: Bé ngoan chăm chỉ
  'ngoan': 'tu__ngoan',
  'chăm': 'tu__cham',
  'chỉ': 'tu__chi_hoi', 'chi': 'tu__chi',
  'cô': 'tu__co',
  'giáo': 'tu__giao_sac', 'giao': 'tu__giao',
  'khen': 'tu__khen',
  'điểm': 'tu__diem_hoi', 'điêm': 'tu__diem', 'diem': 'tu__diem',
  'mười': 'tu__muoi_huyen', 'mươi': 'tu__muoi', 'muoi': 'tu__muoi',

  // Bài 4: Luyện âm khó & vần tắc
  'khăn': 'tu__khan',
  'sạch': 'tu__sach_nang',
  'chú': 'tu__chu_sac', 'chu': 'tu__chu',
  'bơi': 'tu__boi',
  'nhanh': 'tu__nhanh',
  'gấp': 'tu__gap_sac', 'gập': 'tu__gap_nang',
  'tay': 'tu__tay',
  'con': 'tu__con',
  'cá': 'tu__ca_sac', 'ca': 'tu__ca',
  'nhỏ': 'tu__nho_hoi', 'nho': 'tu__nho',
  'hỏi': 'tu__hoi', 'hoi': 'tu__hoi',
};


export class SpriteManager {
  private static instance: SpriteManager;
  private masterBuffer: AudioBuffer | null = null;
  private audioMap: AudioSpriteMap | null = null;
  private clipBuffers: Map<string, AudioBuffer> = new Map();
  private dynamicBuffers: Map<string, AudioBuffer> = new Map();
  private pendingFetches: Map<string, Promise<AudioBuffer | null>> = new Map();
  private isLoaded = false;
  private isLoading = false;
  private currentPlaybackId = 0;
  private activeGainNodes: GainNode[] = [];
  private activeSources: AudioBufferSourceNode[] = [];
  private activeResolvers: Array<() => void> = [];
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];

  private constructor() {}

  public static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  public static calculateSilencePadding(speed = 1.0): number {
    const clampedSpeed = Math.min(1.2, Math.max(0.2, speed));
    return Math.round(80 + Math.max(0, 1 - clampedSpeed) * 850);
  }

  public static readonly SPRITE_VERSION = 'v4.8.0';

  public async loadSprite(
    mapUrl?: string,
    audioUrl?: string
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isLoaded) return true;
    if (this.isLoading) {
      await new Promise((r) => setTimeout(r, 200));
      return this.isLoaded;
    }

    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const resolvedMapUrl = mapUrl || `${cleanBase}audio/audio-map.json?v=${SpriteManager.SPRITE_VERSION}`;
    const resolvedAudioUrl = audioUrl || `${cleanBase}audio/sprite-main.mp3?v=${SpriteManager.SPRITE_VERSION}`;

    this.isLoading = true;

    try {
      const ctx = webAudioEngine.getAudioContext();

      const mapRes = await fetch(resolvedMapUrl);
      if (!mapRes.ok) throw new Error(`Không tải được map từ ${resolvedMapUrl}`);
      this.audioMap = (await mapRes.json()) as AudioSpriteMap;

      const audioRes = await fetch(resolvedAudioUrl);
      if (!audioRes.ok) throw new Error(`Không tải được sprite từ ${resolvedAudioUrl}`);
      const arrayBuffer = await audioRes.arrayBuffer();

      this.masterBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.sliceAndWindowClips(ctx);

      this.isLoaded = true;
      this.isLoading = false;
      console.log(`✅ SpriteManager: Đã nạp thành công và làm mịn Zero-Crossing cho ${this.clipBuffers.size} clips.`);
      return true;
    } catch (err) {
      console.error('❌ SpriteManager load error:', err);
      this.isLoading = false;
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Cắt nhỏ Master AudioBuffer thành từng clip riêng biệt trong RAM
   * - Cửa sổ Cosine (Hann Windowing 12ms) ở 2 đầu
   * - Ép cứng 64 mẫu đầu tiên và 64 mẫu cuối cùng về đúng 0.0000
   */
  private sliceAndWindowClips(ctx: AudioContext): void {
    if (!this.masterBuffer || !this.audioMap) return;

    this.clipBuffers.clear();
    const sampleRate = this.masterBuffer.sampleRate;
    const channels = this.masterBuffer.numberOfChannels;
    const FADE_TIME_SEC = 0.012; // 12 miligiây làm mịn
    const HARD_ZERO_SAMPLES = 64; // 64 mẫu triệt tiêu hoàn toàn DC Offset

    for (const [key, seg] of Object.entries(this.audioMap)) {
      const startSample = Math.max(0, Math.floor(seg.start * sampleRate));
      const endSample = Math.min(this.masterBuffer.length, Math.ceil(seg.end * sampleRate));
      const numSamples = endSample - startSample;

      if (numSamples <= 0) continue;

      const clipBuffer = ctx.createBuffer(channels, numSamples, sampleRate);
      const fadeSamples = Math.min(Math.floor(sampleRate * FADE_TIME_SEC), Math.floor(numSamples / 2));

      for (let ch = 0; ch < channels; ch++) {
        const masterData = this.masterBuffer.getChannelData(ch);
        const clipData = clipBuffer.getChannelData(ch);

        // 1. Sao chép dữ liệu PCM
        for (let i = 0; i < numSamples; i++) {
          clipData[i] = masterData[startSample + i];
        }

        // 2. Áp dụng cửa sổ Cosine (Hann Windowing 12ms) ở 2 đầu
        for (let i = 0; i < fadeSamples; i++) {
          const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
          clipData[i] *= factor;
          clipData[numSamples - 1 - i] *= factor;
        }

        // 3. Ép cứng 64 mẫu đầu & cuối về đúng 0.0000
        const clampLimit = Math.min(HARD_ZERO_SAMPLES, Math.floor(numSamples / 4));
        for (let i = 0; i < clampLimit; i++) {
          clipData[i] = 0.0;
          clipData[numSamples - 1 - i] = 0.0;
        }
      }

      this.clipBuffers.set(key, clipBuffer);
    }

    // Giải phóng AudioBuffer tổng khỏi RAM sau khi đã bóc tách 282 clip con
    this.masterBuffer = null;
  }

  public isSpriteReady(): boolean {
    return this.isLoaded && this.clipBuffers.size > 0;
  }

  public getAudioMap(): AudioSpriteMap | null {
    return this.audioMap;
  }

  public getLoadedClipCount(): number {
    return this.clipBuffers.size;
  }

  public getClipBuffer(tokenOrKey: string): AudioBuffer | undefined {
    const clean = tokenOrKey.toLowerCase().trim();
    const key = this.resolveSpriteKey(clean) || clean;
    return this.clipBuffers.get(key) || this.dynamicBuffers.get(clean);
  }

  public clearDynamicBuffers(): void {
    this.dynamicBuffers.clear();
  }

  public stop(): void {
    this.currentPlaybackId++;
    this.activeTimeouts.forEach((t) => clearTimeout(t));
    this.activeTimeouts = [];

    // Dừng và ngắt toàn bộ AudioBufferSourceNode đang phát dở
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    this.activeSources = [];

    const ctx = webAudioEngine.getAudioContext();
    const now = ctx.currentTime;

    // Xả âm lượng GainNode về 0 trong 3ms để không bị tiếng nổ "bụp" khi dừng đột ngột
    this.activeGainNodes.forEach((gain) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.003);
      } catch {}
    });
    this.activeGainNodes = [];

    // Giải phóng tất cả các Promise đang chờ để không bị treo hàm async
    const resolvers = [...this.activeResolvers];
    this.activeResolvers = [];
    resolvers.forEach((r) => {
      try {
        r();
      } catch {}
    });

    webAudioEngine.stop();
  }

  public resolveSpriteKey(token: string): string | null {
    const clean = token.toLowerCase().trim();
    if (TOKEN_TO_SPRITE_KEY_MAP[clean]) {
      return TOKEN_TO_SPRITE_KEY_MAP[clean];
    }
    if (this.clipBuffers.has(clean) || (this.audioMap && this.audioMap[clean])) {
      return clean;
    }
    return null;
  }

  /**
   * Tải trước âm thanh của một từ vào RAM (từ Master Sprite, IndexedDB cache, hoặc Zalo AI TTS API)
   * Đảm bảo file âm thanh sẵn sàng 100% trước khi phát
   */
  public async preloadAudio(spriteKeyOrToken: string): Promise<boolean> {
    // 0. Đảm bảo Master Sprite đã được nạp sẵn trong RAM
    if (!this.isSpriteReady()) {
      await this.loadSprite();
    }

    const clean = spriteKeyOrToken.toLowerCase().trim();
    const spriteKey = this.resolveSpriteKey(clean) || clean;

    // 1. Đã có trong RAM (Master Sprite hoặc Dynamic Buffer)
    if (this.clipBuffers.has(spriteKey) || this.dynamicBuffers.has(clean)) {
      return true;
    }

    // 2. Có trong IndexedDB cache
    const cachedData = await audioCacheService.getClip(clean);
    if (cachedData) {
      const ctx = webAudioEngine.getAudioContext();
      try {
        const cachedClipBuffer = await ctx.decodeAudioData(cachedData.slice(0));
        let bufferToStore = cachedClipBuffer;
        const chData = cachedClipBuffer.numberOfChannels > 0 ? cachedClipBuffer.getChannelData(0) : null;
        const activeSpeechDur = chData ? audioDspProcessor.detectActiveSpeechDuration(chData, cachedClipBuffer.sampleRate) : 0;
        // Nếu bản ghi cũ trong cache bị ngắn (active speech < 260ms hoặc total duration < 260ms), tự động nâng cấp bằng WSOLA
        if (activeSpeechDur > 0 ? activeSpeechDur < 0.260 : cachedClipBuffer.duration < 0.260) {
          bufferToStore = audioDspProcessor.trimAndEnhanceAudioBuffer(cachedClipBuffer, ctx, {
            profile: 'master_sprite_sync',
            enableAutoStretch: true,
            matchMasterSprite: false,
            maxGainBoost: 4.5,
            preRollSec: 0.050,
            reverbTailSec: 0.140,
            targetPeak: 0.89,
          });
          // Nâng cấp bản ghi trong IndexedDB cache ngoại tuyến lên bản WAV 16-bit PCM đã WSOLA
          try {
            const wavData = audioDspProcessor.audioBufferToWavArrayBuffer(bufferToStore);
            audioCacheService.saveClip(clean, wavData, 'audio/wav').catch(() => {});
          } catch {}
        }
        this.dynamicBuffers.set(clean, bufferToStore);
        return true;
      } catch (err) {
        console.warn(`Lỗi giải mã audio cho từ cache "${clean}":`, err);
      }
    }

    // 3. Gọi Zalo AI TTS API nếu chưa có
    if (this.pendingFetches.has(clean)) {
      const buffer = await this.pendingFetches.get(clean);
      return !!buffer;
    }

    const fetchPromise = (async () => {
      try {
        console.log(`🎙️ Đang lấy âm thanh Zalo AI cho từ mới: "${clean}" (tốc độ 0.8x)...`);
        const arrayBuffer = await zaloTtsClient.fetchAudioBuffer(clean);
        const ctx = webAudioEngine.getAudioContext();
        const rawDecoded = await ctx.decodeAudioData(arrayBuffer.slice(0));

        // Xử lý In-Browser WSOLA DSP: kéo giãn tự động nếu < 260ms, pre-roll 50ms, decay tail 140ms, chuẩn hóa đỉnh 0.89
        const enhancedBuffer = audioDspProcessor.trimAndEnhanceAudioBuffer(rawDecoded, ctx, {
          profile: 'master_sprite_sync',
          enableAutoStretch: true,
          matchMasterSprite: false,
          maxGainBoost: 4.5,
          preRollSec: 0.050,
          reverbTailSec: 0.140,
          targetPeak: 0.89,
        });
        this.dynamicBuffers.set(clean, enhancedBuffer);

        // Lưu bản WAV 16-bit PCM đã xử lý hoàn chỉnh vào cache ngoại tuyến
        try {
          const wavData = audioDspProcessor.audioBufferToWavArrayBuffer(enhancedBuffer);
          await audioCacheService.saveClip(clean, wavData, 'audio/wav');
        } catch {
          await audioCacheService.saveClip(clean, arrayBuffer, 'audio/mpeg');
        }

        return enhancedBuffer;
      } catch (err) {
        console.warn(`⚠️ Không thể lấy âm thanh Zalo AI cho từ "${clean}":`, err);
        return null;
      } finally {
        this.pendingFetches.delete(clean);
      }
    })();

    this.pendingFetches.set(clean, fetchPromise);
    const result = await fetchPromise;
    return !!result;
  }

  /**
   * Phát một phân đoạn âm thanh với Lookahead Audio Scheduling (25ms buffer) & Smooth Gain Envelope
   * Tự động chờ nạp đủ âm thanh từ Zalo AI trước khi phát
   */
  public async playAudioSegment(spriteKeyOrToken: string): Promise<void> {
    const clean = spriteKeyOrToken.toLowerCase().trim();
    const spriteKey = this.resolveSpriteKey(clean) || clean;
    const playbackId = this.currentPlaybackId;

    // Đảm bảo clip đã được nạp sẵn vào RAM trước khi phát
    await this.preloadAudio(clean);
    if (playbackId !== this.currentPlaybackId) return;

    const clipBuffer = this.clipBuffers.get(spriteKey) || this.dynamicBuffers.get(clean);

    // Nếu vẫn không có clip (do offline hoặc API lỗi), fallback sang synthetic tone thay vì đứng im
    if (!clipBuffer) {
      console.warn(`⚠️ Không thể lấy clip thực cho: "${spriteKeyOrToken}" (key: ${spriteKey}) - Fallback âm thanh tổng hợp Web Audio`);
      if (playbackId === this.currentPlaybackId) {
        await webAudioEngine.playSyntheticTone(clean, 'ngang', 450, 1.0);
      }
      return;
    }

    return new Promise((resolve) => {
      if (playbackId !== this.currentPlaybackId) {
        resolve();
        return;
      }

      const ctx = webAudioEngine.getAudioContext();
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      const duration = clipBuffer.duration;
      const LOOKAHEAD_SEC = 0.025; // 25ms buffer an toàn chống audio underflow
      const FADE_SEC = 0.008;      // 8ms Fade-in & Fade-out

      const now = ctx.currentTime;
      const startTime = now + LOOKAHEAD_SEC;
      const stopTime = startTime + duration + 0.010;

      source.buffer = clipBuffer;
      source.playbackRate.setValueAtTime(1.0, now);

      // Gain Envelope chính xác với lookahead
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(1.0, startTime + FADE_SEC);
      gainNode.gain.setValueAtTime(1.0, Math.max(startTime + FADE_SEC, startTime + duration - FADE_SEC));
      gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      this.activeGainNodes.push(gainNode);
      this.activeSources.push(source);

      let isFinished = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch {}
        this.activeGainNodes = this.activeGainNodes.filter((g) => g !== gainNode);
        this.activeSources = this.activeSources.filter((s) => s !== source);
        this.activeResolvers = this.activeResolvers.filter((r) => r !== finish);
        if (timer) {
          clearTimeout(timer);
          this.activeTimeouts = this.activeTimeouts.filter((t) => t !== timer);
        }
        resolve();
      };

      this.activeResolvers.push(finish);
      source.onended = finish;

      source.start(startTime);
      source.stop(stopTime);

      // Đồng bộ Promise chuẩn thời gian thực với setTimeout
      const totalDurationMs = Math.round((LOOKAHEAD_SEC + duration) * 1000);
      timer = setTimeout(finish, totalDurationMs);
      this.activeTimeouts.push(timer);
    });
  }


  public async playPhonicsSequence(
    tokensOrKeys: string[],
    speed = 1.0,
    onStepChange?: (index: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    this.stop();
    const playbackId = this.currentPlaybackId;

    if (!this.isSpriteReady()) {
      await this.loadSprite();
    }

    const paddingMs = SpriteManager.calculateSilencePadding(speed);

    try {
      // 1. Tải trước toàn bộ âm thanh của các bước vào RAM để phát liền mạch không giật lag
      for (const token of tokensOrKeys) {
        if (playbackId !== this.currentPlaybackId) return;
        await this.preloadAudio(token);
      }

      // 2. Phát tuần tự từng bước nhịp nhàng
      for (let i = 0; i < tokensOrKeys.length; i++) {
        if (playbackId !== this.currentPlaybackId) return;

        const token = tokensOrKeys[i];
        onStepChange?.(i);

        await this.playAudioSegment(token);

        if (playbackId !== this.currentPlaybackId) return;

        if (i < tokensOrKeys.length - 1 && paddingMs > 0) {
          await new Promise<void>((resolve) => {
            let timer: ReturnType<typeof setTimeout> | null = null;
            const finishPause = () => {
              this.activeResolvers = this.activeResolvers.filter((r) => r !== finishPause);
              if (timer) {
                clearTimeout(timer);
                this.activeTimeouts = this.activeTimeouts.filter((t) => t !== timer);
              }
              resolve();
            };
            this.activeResolvers.push(finishPause);
            timer = setTimeout(finishPause, paddingMs);
            this.activeTimeouts.push(timer);
          });
        }
      }

      if (playbackId === this.currentPlaybackId) {
        onStepChange?.(-1);
        onComplete?.();
      }
    } catch (err) {
      console.warn('Playback sequence error:', err);
      if (playbackId === this.currentPlaybackId) {
        onStepChange?.(-1);
      }
    }
  }
}

export const spriteManager = SpriteManager.getInstance();
