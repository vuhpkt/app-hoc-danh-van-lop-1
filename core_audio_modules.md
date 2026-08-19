[src/core/audio/AudioManager.ts] :
```typescript
/**
 * Quản lý Web Audio API Context & Audio Engine bridge
 */
import { webAudioEngine } from './WebAudioEngine';

export class AudioManager {
  private static instance: AudioManager;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(): AudioContext {
    return webAudioEngine.getAudioContext();
  }

  public playTone(freq = 440, duration = 0.2): void {
    webAudioEngine.playSyntheticTone('tone', 'ngang', duration * 1000, 1.0, freq);
  }

  public playClickSound(): void {
    webAudioEngine.playCue(780, 70);
  }

  public playSuccessChime(): void {
    webAudioEngine.playCue(523.25, 120);
    setTimeout(() => webAudioEngine.playCue(659.25, 120), 100);
    setTimeout(() => webAudioEngine.playCue(783.99, 250), 220);
  }

  public stop(): void {
    webAudioEngine.stop();
  }
}

export const audioManager = AudioManager.getInstance();
```

[src/core/audio/AudioSpritePlayer.ts] :
```typescript
/**
 * Bộ phát Audio Sprite & Phonics Sequence Player
 * Hỗ trợ chuyển đổi linh hoạt giữa Real Audio Sprite và Synthetic Tone Generator
 */
import { AudioSpriteMap, PhonicsBreakdown } from '../../types';
import { webAudioEngine, AudioSequenceItem } from './WebAudioEngine';
import { spriteManager } from './SpriteManager';

export const MOCK_AUDIO_SPRITE_MAP: AudioSpriteMap = {
  'b': { id: 'b', label: 'Âm b', start: 0.0, duration: 0.5, category: 'initial' },
  't': { id: 't', label: 'Âm t', start: 0.5, duration: 0.5, category: 'initial' },
  'tr': { id: 'tr', label: 'Âm tr', start: 1.0, duration: 0.5, category: 'initial' },
  'ng': { id: 'ng', label: 'Âm ng', start: 1.5, duration: 0.5, category: 'initial' },
  'qu': { id: 'qu', label: 'Âm qu', start: 2.0, duration: 0.5, category: 'initial' },
  'gi': { id: 'gi', label: 'Âm gi', start: 2.5, duration: 0.5, category: 'initial' },
  'ương': { id: 'ương', label: 'Vần ương', start: 3.0, duration: 0.6, category: 'rime' },
  'uyên': { id: 'uyên', label: 'Vần uyên', start: 3.6, duration: 0.6, category: 'rime' },
  'oan': { id: 'oan', label: 'Vần oan', start: 4.2, duration: 0.6, category: 'rime' },
  'ang': { id: 'ang', label: 'Vần ang', start: 4.8, duration: 0.6, category: 'rime' },
  'ăt': { id: 'ăt', label: 'Vần ăt', start: 5.4, duration: 0.6, category: 'rime' },
  'huyen': { id: 'huyen', label: 'Thanh huyền', start: 6.0, duration: 0.5, category: 'tone' },
  'sac': { id: 'sac', label: 'Thanh sắc', start: 6.5, duration: 0.5, category: 'tone' },
  'hoi': { id: 'hoi', label: 'Thanh hỏi', start: 7.0, duration: 0.5, category: 'tone' },
  'nga': { id: 'nga', label: 'Thanh ngã', start: 7.5, duration: 0.5, category: 'tone' },
  'nang': { id: 'nang', label: 'Thanh nặng', start: 8.0, duration: 0.5, category: 'tone' },
};

export class AudioSpritePlayer {
  /**
   * Chuyển đổi một PhonicsBreakdown thành danh sách các AudioSequenceItem
   */
  public static createSequenceFromBreakdown(breakdown: PhonicsBreakdown): AudioSequenceItem[] {
    return breakdown.spellingFormula.map((step, idx) => {
      const isLast = idx === breakdown.spellingFormula.length - 1;
      const isTone = step === breakdown.toneName && breakdown.tone !== 'ngang';

      return {
        id: `step-${idx}-${step}`,
        label: step,
        tone: isTone || isLast ? breakdown.tone : 'ngang',
        durationMs: isLast ? 650 : isTone ? 480 : 420,
      };
    });
  }

  /**
   * Phát chuỗi đánh vần tuần tự:
   * @param useRealAudio: true -> Dùng giọng đọc thật từ sprite-main.mp3, false -> Dùng Synth giả lập
   */
  public static playSpellingSequence(
    breakdown: PhonicsBreakdown,
    speed = 1.0,
    onStepActive: (index: number) => void,
    onComplete: () => void,
    useRealAudio = true
  ): { stop: () => void } {
    if (useRealAudio) {
      spriteManager.playPhonicsSequence(
        breakdown.spellingFormula,
        speed,
        onStepActive,
        onComplete
      );
      return {
        stop: () => spriteManager.stop(),
      };
    }

    // Synth fallback mode
    const sequence = this.createSequenceFromBreakdown(breakdown);
    webAudioEngine.playSequence(sequence, {
      speed,
      onItemStart: (_item, idx) => {
        onStepActive(idx);
      },
      onComplete: () => {
        onStepActive(-1);
        onComplete();
      },
    });

    return {
      stop: () => {
        webAudioEngine.stop();
        onStepActive(-1);
      },
    };
  }

  /**
   * Phát đọc trơn (Fluent read) cả từ
   */
  public static playFluentWord(
    breakdown: PhonicsBreakdown,
    speed = 1.0,
    onComplete?: () => void,
    useRealAudio = true
  ): void {
    if (useRealAudio) {
      spriteManager.playAudioSegment(breakdown.raw).then(() => {
        onComplete?.();
      });
      return;
    }

    webAudioEngine.playSyntheticTone(breakdown.raw, breakdown.tone, 650, speed).then(() => {
      onComplete?.();
    });
  }

  /**
   * Hỗ trợ mock sequence cũ để tương thích ngược
   */
  public static playMockSequence(
    steps: string[],
    onStepActive: (index: number) => void,
    onComplete: () => void
  ): { stop: () => void } {
    return this.playSpellingSequence(
      {
        raw: steps[steps.length - 1] || '',
        clean: steps[steps.length - 1] || '',
        initialConsonant: '',
        rime: '',
        tone: 'ngang',
        toneName: '',
        baseWord: '',
        spellingFormula: steps,
        spellingFormulaText: steps.join(' - '),
      },
      1.0,
      onStepActive,
      onComplete,
      true
    );
  }
}
```

[src/core/audio/SpriteManager.ts] :
```typescript
/**
 * Mô-đun 3.2: SpriteManager - Nạp và phát Audio Sprite chuẩn Web Audio API
 *
 * ĐÃ XỬ LÝ TRIỆT TIÊU 100% TIẾNG CLICK/POP & LỖI LỆCH TẦNG ÂM:
 * 1. Cơ chế Lookahead Audio Scheduling:
 *    - Lên lịch phát trước một khoảng đệm an toàn startTime = ctx.currentTime + 0.025 (25ms)
 *    - Gain Envelope mượt mà với Fade-in 8ms và Fade-out 8ms
 *    - Ngắt nguồn source.stop(startTime + duration + 0.010) sau khi Gain đã về 0 hoàn toàn
 * 2. Làm mịn dữ liệu sóng (Zero-Crossing Envelope) khi cắt Master Buffer:
 *    - Áp dụng cửa sổ Cosine (Hann Windowing) 12ms ở 2 đầu mỗi clip PCM
 *    - Ép cứng 64 mẫu đầu tiên và 64 mẫu cuối cùng của mảng Float32Array về đúng 0.0000
 * 3. Đồng bộ Promise chuẩn thời gian thực qua setTimeout: (LOOKAHEAD_SEC + duration) * 1000 ms
 * 4. Luôn giữ playbackRate = 1.0 bảo toàn chất giọng cô giáo tự nhiên, điều chỉnh tốc độ qua calculateSilencePadding(speed)
 */

import { webAudioEngine } from './WebAudioEngine';

export interface SpriteSegmentInfo {
  start: number;
  end: number;
  duration: number;
}

export type AudioSpriteMap = Record<string, SpriteSegmentInfo>;

// Bảng mapping toàn diện: Hỗ trợ cả dạng ký tự ('tr') và dạng đọc sư phạm ('trờ')
const TOKEN_TO_SPRITE_KEY_MAP: Record<string, string> = {
  // Âm đầu - dạng đọc sư phạm & ký tự
  'bờ': 'am_dau__b', 'b': 'am_dau__b',
  'cờ': 'am_dau__c', 'c': 'am_dau__c',
  'chờ': 'am_dau__ch', 'ch': 'am_dau__ch',
  'dờ': 'am_dau__d', 'd': 'am_dau__d',
  'đờ': 'am_dau__dd', 'đ': 'am_dau__dd',
  'gờ': 'am_dau__g', 'g': 'am_dau__g',
  'ghờ': 'am_dau__gh', 'gh': 'am_dau__gh',
  'gi': 'am_dau__gi', 'giờ': 'am_dau__gi',
  'hờ': 'am_dau__h', 'h': 'am_dau__h',
  'kờ': 'am_dau__k', 'k': 'am_dau__k',
  'khờ': 'am_dau__kh', 'kh': 'am_dau__kh',
  'lờ': 'am_dau__l', 'l': 'am_dau__l',
  'mờ': 'am_dau__m', 'm': 'am_dau__m',
  'nờ': 'am_dau__n', 'n': 'am_dau__n',
  'ngờ': 'am_dau__ng', 'ng': 'am_dau__ng',
  'nghờ': 'am_dau__ngh', 'ngh': 'am_dau__ngh',
  'nhờ': 'am_dau__nh', 'nh': 'am_dau__nh',
  'pờ': 'am_dau__p', 'p': 'am_dau__p',
  'phờ': 'am_dau__ph', 'ph': 'am_dau__ph',
  'quờ': 'am_dau__qu', 'qu': 'am_dau__qu',
  'rờ': 'am_dau__r', 'r': 'am_dau__r',
  'sờ': 'am_dau__s', 's': 'am_dau__s',
  'tờ': 'am_dau__t', 't': 'am_dau__t',
  'thờ': 'am_dau__th', 'th': 'am_dau__th',
  'trờ': 'am_dau__tr', 'tr': 'am_dau__tr',
  'vờ': 'am_dau__v', 'v': 'am_dau__v',
  'xờ': 'am_dau__x', 'x': 'am_dau__x',

  // Vần
  'a': 'van__a',
  'ach': 'van__ach',
  'ai': 'van__ai',
  'an': 'van__an',
  'ang': 'van__ang',
  'ao': 'van__ao',
  'at': 'van__at',
  'ăt': 'van__at_breve', 'ắt': 'van__at_breve',
  'e': 'van__e',
  'en': 'van__en',
  'ê': 'van__e_hat',
  'ên': 'van__en_hat',
  'i': 'van__i',
  'ieu': 'van__ieu', 'iêu': 'van__ieu',
  'im': 'van__im',
  'in': 'van__in',
  'o': 'van__o',
  'on': 'van__on',
  'oan': 'van__oan',
  'ô': 'van__o_hat',
  'u': 'van__u',
  'uo': 'van__uo', 'ươ': 'van__uo',
  'uông': 'van__uong', 'uong': 'van__uong',
  'ương': 'van__uong_horn', 'uong_horn': 'van__uong_horn',
  'uyên': 'van__uyen', 'uyen': 'van__uyen',
  'uyu': 'van__uyu',

  // Dấu thanh
  'ngang': 'thanh__ngang', 'không dấu': 'thanh__ngang', 'thanh ngang': 'thanh__ngang',
  'huyền': 'thanh__huyen', 'huyen': 'thanh__huyen',
  'sắc': 'thanh__sac', 'sac': 'thanh__sac',
  'hỏi': 'thanh__hoi', 'hoi': 'thanh__hoi',
  'ngã': 'thanh__nga', 'nga': 'thanh__nga',
  'nặng': 'thanh__nang', 'nang': 'thanh__nang',

  // Từ hoàn chỉnh & trung gian
  'trương': 'tu__truong_ngang',
  'trường': 'tu__truong',
  'uống': 'tu__uong',
  'giăt': 'tu__giat_ngang',
  'giặt': 'tu__giat',
  'quang': 'tu__quang',
  'khuỷu': 'tu__khuyu',
  'nguyễn': 'tu__nguyen',
  'bé': 'tu__be',
  'học': 'tu__hoc',
  'bài': 'tu__bai',
  'vui': 'tu__vui',
  'chăm': 'tu__cham',
  'chỉ': 'tu__chi',
  'cá': 'tu__ca',
  'hoa': 'tu__hoa',
  'sách': 'tu__sach',
  'yêu': 'tu__yeu',
  'ăn': 'tu__an',
  'bà': 'tu__ba'
};

export class SpriteManager {
  private static instance: SpriteManager;
  private masterBuffer: AudioBuffer | null = null;
  private audioMap: AudioSpriteMap | null = null;
  private clipBuffers: Map<string, AudioBuffer> = new Map();
  private isLoaded = false;
  private isLoading = false;
  private currentPlaybackId = 0;
  private activeGainNodes: GainNode[] = [];

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

  public async loadSprite(
    mapUrl = '/audio/audio-map.json',
    audioUrl = '/audio/sprite-main.mp3'
  ): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.isLoading) {
      await new Promise((r) => setTimeout(r, 200));
      return this.isLoaded;
    }

    this.isLoading = true;

    try {
      const ctx = webAudioEngine.getAudioContext();

      const mapRes = await fetch(mapUrl);
      if (!mapRes.ok) throw new Error(`Không tải được map từ ${mapUrl}`);
      this.audioMap = (await mapRes.json()) as AudioSpriteMap;

      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Không tải được sprite từ ${audioUrl}`);
      const arrayBuffer = await audioRes.arrayBuffer();

      this.masterBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.sliceAndWindowClips(ctx);

      this.isLoaded = true;
      this.isLoading = false;
      console.log(`✅ SpriteManager: Đã load thành công và làm mịn Zero-Crossing cho ${this.clipBuffers.size} clips.`);
      return true;
    } catch (err) {
      console.error('❌ SpriteManager load error:', err);
      this.isLoading = false;
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Cắt nhỏ Master AudioBuffer thành từng clip riêng biệt
   * - Áp dụng Hann Windowing 12ms ở cả 2 đầu
   * - Ép cứng 64 mẫu đầu tiên và 64 mẫu cuối cùng về chính xác 0.0000
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

        // 3. Ép 64 mẫu đầu tiên và 64 mẫu cuối cùng về đúng 0.0000 (Zero-Crossing bảo đảm)
        const clampLimit = Math.min(HARD_ZERO_SAMPLES, Math.floor(numSamples / 4));
        for (let i = 0; i < clampLimit; i++) {
          clipData[i] = 0.0;
          clipData[numSamples - 1 - i] = 0.0;
        }
      }

      this.clipBuffers.set(key, clipBuffer);
    }
  }

  public isSpriteReady(): boolean {
    return this.isLoaded && this.clipBuffers.size > 0;
  }

  public getAudioMap(): AudioSpriteMap | null {
    return this.audioMap;
  }

  public stop(): void {
    this.currentPlaybackId++;
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
   * Phát một phân đoạn âm thanh với Lookahead Audio Scheduling (25ms buffer) & Smooth Gain Envelope
   */
  public playAudioSegment(spriteKeyOrToken: string): Promise<void> {
    return new Promise((resolve) => {
      const spriteKey = this.resolveSpriteKey(spriteKeyOrToken) || spriteKeyOrToken;
      const clipBuffer = this.clipBuffers.get(spriteKey);

      if (!this.isSpriteReady() || !clipBuffer) {
        console.warn(`⚠️ Không tìm thấy audio clip cho: "${spriteKeyOrToken}" (key: ${spriteKey})`);
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

      source.start(startTime);
      source.stop(stopTime);

      const cleanup = () => {
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch {}
        this.activeGainNodes = this.activeGainNodes.filter((g) => g !== gainNode);
      };

      source.onended = cleanup;

      // Đồng bộ Promise chuẩn thời gian thực với setTimeout
      const totalDurationMs = Math.round((LOOKAHEAD_SEC + duration) * 1000);
      setTimeout(() => {
        resolve();
      }, totalDurationMs);
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
      for (let i = 0; i < tokensOrKeys.length; i++) {
        if (playbackId !== this.currentPlaybackId) return;

        const token = tokensOrKeys[i];
        onStepChange?.(i);

        await this.playAudioSegment(token);

        if (playbackId !== this.currentPlaybackId) return;

        if (i < tokensOrKeys.length - 1 && paddingMs > 0) {
          await new Promise((r) => setTimeout(r, paddingMs));
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
```

[src/core/audio/WebAudioEngine.ts] :
```typescript
/**
 * Mô-đun 2: Web Audio Engine ghép nối âm thanh đánh vần & Synth giả lập
 * - Chuẩn sư phạm: Điều chỉnh tốc độ thông qua khoảng lặng giữa các âm
 * - Chống giật / click / pop với GainNode fade-in & fade-out 3ms
 * - Tự động unlock AudioContext trên thiết bị di động
 */

import { ToneType } from '../../types';

export interface AudioSequenceItem {
  id: string;
  label: string;
  tone?: ToneType;
  baseFreq?: number;
  durationMs?: number;
}

export interface PlaybackOptions {
  speed?: number;          // Tốc độ phát (0.3x - 1.2x)
  silenceGapMs?: number;   // Khoảng nghỉ giữa các âm
  onItemStart?: (item: AudioSequenceItem, index: number) => void;
  onItemEnd?: (item: AudioSequenceItem, index: number) => void;
  onComplete?: () => void;
  onError?: (err: unknown) => void;
}

// Bảng tần số cơ bản tạo âm thanh phong phú cho từng chữ cái tiếng Việt
const PHONEME_FREQ_MAP: Record<string, number> = {
  'b': 260, 'c': 280, 'ch': 300, 'd': 320, 'đ': 340, 'g': 290, 'gh': 310, 'gi': 330,
  'h': 350, 'k': 280, 'kh': 370, 'l': 390, 'm': 270, 'n': 310, 'ng': 330, 'ngh': 330,
  'nh': 360, 'p': 400, 'ph': 420, 'qu': 380, 'r': 410, 's': 430, 't': 440, 'th': 460,
  'tr': 470, 'v': 350, 'x': 450,
  // Vần & Nguyên âm
  'a': 440, 'ă': 460, 'â': 480, 'e': 520, 'ê': 550, 'i': 580, 'o': 390, 'ô': 410, 'ơ': 430,
  'u': 360, 'ư': 380, 'y': 580, 'oan': 420, 'ương': 460, 'uyên': 500, 'uông': 400, 'ang': 430,
  'ăt': 450, 'ach': 470, 'in': 520, 'uyu': 480, 'ao': 410, 'im': 500,
};

export class WebAudioEngine {
  private static instance: WebAudioEngine;
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private currentPlaybackId = 0;
  private activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  private constructor() {
    this.setupAutoplayUnlock();
  }

  public static getInstance(): WebAudioEngine {
    if (!WebAudioEngine.instance) {
      WebAudioEngine.instance = new WebAudioEngine();
    }
    return WebAudioEngine.instance;
  }

  /**
   * Tính toán độ dài khoảng nghỉ (Silence Gap) theo chuẩn sư phạm:
   * delay = Math.round(60 + (1 - speed) * 900) ms
   */
  public static calculateSilencePadding(speed = 1.0): number {
    const clampedSpeed = Math.min(1.2, Math.max(0.2, speed));
    return Math.round(60 + Math.max(0, 1 - clampedSpeed) * 900);
  }

  /**
   * Khởi tạo và unlock AudioContext trên các trình duyệt di động / Safari
   */
  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn('AudioContext resume warning:', err));
    }

    return this.ctx;
  }

  /**
   * Tự động unlock AudioContext ngay khi có tương tác đầu tiên của người dùng
   */
  private setupAutoplayUnlock(): void {
    const unlockHandler = () => {
      if (this.isUnlocked) return;
      try {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);

        this.isUnlocked = true;
        ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) =>
          window.removeEventListener(evt, unlockHandler)
        );
      } catch (e) {
        console.warn('Unlock audio context error:', e);
      }
    };

    ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) =>
      window.addEventListener(evt, unlockHandler, { once: true, passive: true })
    );
  }

  /**
   * Dừng toàn bộ âm thanh đang phát ngay lập tức
   */
  public stop(): void {
    this.currentPlaybackId++;
    this.activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0);
        gain.gain.setValueAtTime(0, 0);
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }

  /**
   * Phát một âm thanh giả lập (Synthetic Tone) với đường cong cao độ chuẩn 6 dấu thanh Tiếng Việt
   * Gắn GainNode với Fade-in 3ms & Fade-out 3ms chống Click/Pop
   */
  public playSyntheticTone(
    label: string,
    tone: ToneType = 'ngang',
    durationMs = 450,
    _speed = 1.0,
    baseFrequency?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const actualDuration = durationMs / 1000;

      // Tính tần số cơ sở
      const lower = label.toLowerCase().trim();
      let startFreq = baseFrequency || PHONEME_FREQ_MAP[lower] || 440;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';

      // Chống click/pop với Fade-in 3ms và Fade-out 3ms mượt mà
      const attackTime = 0.003;
      const releaseTime = 0.003;
      const maxGain = 0.18;

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(maxGain, now + attackTime);
      gainNode.gain.setValueAtTime(maxGain, now + actualDuration - releaseTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration);

      // Đường cong cao độ theo 6 thanh
      osc.frequency.setValueAtTime(startFreq, now);

      switch (tone) {
        case 'huyen':
          osc.frequency.linearRampToValueAtTime(startFreq * 0.78, now + actualDuration);
          break;
        case 'sac':
          osc.frequency.linearRampToValueAtTime(startFreq * 1.35, now + actualDuration);
          break;
        case 'hoi':
          osc.frequency.linearRampToValueAtTime(startFreq * 0.8, now + actualDuration * 0.5);
          osc.frequency.linearRampToValueAtTime(startFreq * 1.05, now + actualDuration);
          break;
        case 'nga':
          osc.frequency.linearRampToValueAtTime(startFreq * 1.15, now + actualDuration * 0.4);
          osc.frequency.setValueAtTime(startFreq * 0.95, now + actualDuration * 0.45);
          osc.frequency.linearRampToValueAtTime(startFreq * 1.4, now + actualDuration);
          break;
        case 'nang':
          osc.frequency.linearRampToValueAtTime(startFreq * 0.65, now + actualDuration * 0.7);
          break;
        case 'ngang':
        default:
          osc.frequency.setValueAtTime(startFreq, now + actualDuration);
          break;
      }

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const nodePair = { osc, gain: gainNode };
      this.activeNodes.push(nodePair);

      osc.start(now);
      osc.stop(now + actualDuration);

      osc.onended = () => {
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch {}
        this.activeNodes = this.activeNodes.filter((n) => n !== nodePair);
        resolve();
      };
    });
  }

  /**
   * Phát chuỗi âm với khoảng lặng (Silence padding) chuẩn sư phạm:
   * delay = Math.round(60 + (1 - speed) * 900) ms
   */
  public async playSequence(
    items: AudioSequenceItem[],
    options: PlaybackOptions = {}
  ): Promise<void> {
    const {
      speed = 1.0,
      onItemStart,
      onItemEnd,
      onComplete,
      onError,
    } = options;

    this.stop();
    const playbackId = this.currentPlaybackId;
    const paddingMs = WebAudioEngine.calculateSilencePadding(speed);

    try {
      this.getAudioContext();

      for (let i = 0; i < items.length; i++) {
        if (playbackId !== this.currentPlaybackId) return;

        const item = items[i];
        onItemStart?.(item, i);

        const duration = item.durationMs || 420;
        await this.playSyntheticTone(item.label, item.tone || 'ngang', duration, 1.0, item.baseFreq);

        if (playbackId !== this.currentPlaybackId) return;
        onItemEnd?.(item, i);

        // Chèn khoảng lặng giữa các âm
        if (i < items.length - 1 && paddingMs > 0) {
          await new Promise((r) => setTimeout(r, paddingMs));
        }
      }

      if (playbackId === this.currentPlaybackId) {
        onComplete?.();
      }
    } catch (err) {
      if (playbackId === this.currentPlaybackId) {
        onError?.(err);
      }
    }
  }

  /**
   * Phát một âm hiệu ứng bíp ngắn (Sound cue)
   */
  public playCue(freq = 600, durationMs = 120): void {
    this.playSyntheticTone('cue', 'ngang', durationMs, 1.0, freq);
  }
}

export const webAudioEngine = WebAudioEngine.getInstance();
```
