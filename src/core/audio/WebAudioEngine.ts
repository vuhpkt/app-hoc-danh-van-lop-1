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
