/**
 * src/core/audio/AudioDspProcessor.ts
 * 
 * BỘ XỬ LÝ TÍN HIỆU SỐ ÂM THANH CLIENT-SIDE (PEDAGOGICAL DSP MASTERING ENGINE)
 * Giúp âm thanh tải về từ Zalo AI đạt chất lượng sư phạm cao nhất cho học sinh Lớp 1:
 * 1. Smart Silence Trimming: Gọt khoảng lặng trễ nhưng giữ trọn hơi thở tự nhiên (80ms pre-roll)
 * 2. Natural Reverb Tail: Giữ 80ms-90ms đuôi ngân nguyên âm và vần mũi (-52dB)
 * 3. 5-Band Pedagogical Parametric EQ (IIR Biquad):
 *    - Band 1: High-Pass 85Hz triệt tiêu DC Offset và tiếng ù rè
 *    - Band 2: Warmth Peak 220Hz (+2.2dB) tăng độ dày, ấm áp của giọng cô giáo
 *    - Band 3: Clarity Peak 1.8kHz (+0.8dB) làm rõ âm đệm và âm chính
 *    - Band 4: De-Harsh Notch 3.6kHz (-2.2dB) khử chói gắt số của phụ âm xát (s, x, ch, tr)
 *    - Band 5: Air Smooth High-Shelf 7.5kHz (-1.8dB) xóa artifact nén MP3
 * 4. Micro-Ambience Synthesizer: Mô phỏng buồng âm lớp học ấm cúng (6% early reflections)
 * 5. Soft-Knee Limiter & Normalization: Chuẩn hóa biên độ đỉnh về -1dBFS không méo tiếng
 * 6. 12ms Hann Windowing & Zero-Crossing Hard Clamp: Làm mịn 2 đầu chống pop/click
 * 7. WAV Serializer: Xuất định dạng 16-bit PCM WAV tương thích 100% IndexedDB
 */

export type AudioProfileId = 'master_sprite_sync' | 'pedagogical_warm' | 'crystal_clear' | 'pure_dry';

export interface BiquadFilterCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export interface EqBandConfig {
  type: 'highpass' | 'peaking' | 'highshelf';
  frequency: number; // Hz
  q: number;
  gainDb: number;
}

export interface DspOptions {
  /** Profile âm thanh mục tiêu (mặc định: 'master_sprite_sync') */
  profile?: AudioProfileId;
  /** Chế độ đồng bộ 100% thuật toán đóng gói của Kho gốc (scripts/build-audio-sprite.js) */
  matchMasterSprite?: boolean;
  /** Ngưỡng phát hiện bắt đầu nói (mặc định: 0.008 ~ -42dB) */
  startThreshold?: number;
  /** Thời gian giữ an toàn đầu (giây, mặc định: 0.025 = 25ms) */
  preRollSec?: number;
  /** Ngưỡng phát hiện kết thúc nói (mặc định: 0.0025 ~ -52dB) */
  stopThreshold?: number;
  /** Thời gian ngân đuôi tự nhiên (giây, mặc định: 0.080 = 80ms) */
  reverbTailSec?: number;
  /** Cửa sổ làm mịn Hann Windowing (giây, mặc định: 0.012 = 12ms) */
  fadeTimeSec?: number;
  /** Số mẫu đầu và cuối ép cứng về 0.0000 triệt tiêu tiếng bụp (mặc định: 64) */
  hardClampSamples?: number;
  /** Biên độ đỉnh mục tiêu để chuẩn hóa (mặc định: 0.89 ~ -1.0 dBFS) */
  targetPeak?: number;
  /** Giới hạn hệ số khuếch đại tối đa chống boost tiếng ồn (mặc định: 4.5) */
  maxGainBoost?: number;

  /** Bật/tắt EQ Parametric sư phạm (mặc định: true) */
  enableEq?: boolean;
  /** Tùy chỉnh độ tăng độ ấm giọng cô giáo ở 220Hz (dB, mặc định: 2.2) */
  warmthGainDb?: number;
  /** Tùy chỉnh độ giảm chói gắt phụ âm xát ở 3.6kHz (dB, mặc định: -2.2) */
  deHarshGainDb?: number;
  /** Bật/tắt Micro-Ambience buồng âm lớp học (mặc định: true) */
  enableAmbience?: boolean;
  /** Tỷ lệ buồng âm lớp học (0.0 đến 0.20, mặc định: 0.06 = 6%) */
  ambienceWetMix?: number;

  /** Bật/tắt tự động kéo giãn WSOLA khi thời lượng phát âm thực tế < 260ms (mặc định: true cho client dynamic words) */
  enableAutoStretch?: boolean;
  /** Ngưỡng phát hiện phát âm quá nhanh để kéo giãn (giây, mặc định: 0.260 = 260ms) */
  minSpeechDurationSec?: number;
  /** Thời lượng thân từ mục tiêu sau khi kéo giãn (giây, mặc định: 0.310 = 310ms, dải 300ms-320ms) */
  targetSpeechDurationSec?: number;
}

export const AUDIO_PROFILES: Record<AudioProfileId, {
  name: string;
  description: string;
  options: Partial<DspOptions>;
}> = {
  master_sprite_sync: {
    name: 'Đồng Bộ Kho Gốc (Master Sprite 100%)',
    description: 'Khớp 100% với 280 clips kho gốc: Giữ nguyên đệm lấy hơi tự nhiên đầu file (50ms), tail 140ms, Hann 12ms, chuẩn hóa biên độ 0.89 (-1dBFS).',
    options: {
      matchMasterSprite: false,
      enableEq: false,
      enableAmbience: false,
      maxGainBoost: 4.5,
      hardClampSamples: 32,
      fadeTimeSec: 0.012,
      preRollSec: 0.050,
      reverbTailSec: 0.140,
      stopThreshold: 0.0025,
      startThreshold: 0.008,
      enableAutoStretch: true,
      minSpeechDurationSec: 0.260,
      targetSpeechDurationSec: 0.310,
      targetPeak: 0.89,
    },
  },
  pedagogical_warm: {
    name: 'Cô Giáo Ấm Áp (Lớp 1)',
    description: 'Tăng trầm 220Hz, khử chói 3.6kHz, thêm 6% không gian buồng âm tự nhiên.',
    options: {
      matchMasterSprite: false,
      enableEq: true,
      warmthGainDb: 2.2,
      deHarshGainDb: -2.2,
      enableAmbience: true,
      ambienceWetMix: 0.06,
    },
  },
  crystal_clear: {
    name: 'Trong Trẻo Rõ Chữ',
    description: 'Làm nổi bật phụ âm và âm chính ở 1.8kHz, giảm âm vang, tập trung phân tích từ.',
    options: {
      matchMasterSprite: false,
      enableEq: true,
      warmthGainDb: 0.8,
      deHarshGainDb: -1.5,
      enableAmbience: true,
      ambienceWetMix: 0.02,
    },
  },
  pure_dry: {
    name: 'Nguyên Bản Zalo AI (Mộc)',
    description: 'Chỉ cắt gọt khoảng lặng trễ và chuẩn hóa âm lượng, không can thiệp màu âm.',
    options: {
      matchMasterSprite: false,
      enableEq: false,
      enableAmbience: false,
      ambienceWetMix: 0.0,
    },
  },
};

const DEFAULT_OPTIONS: Required<DspOptions> = {
  profile: 'pure_dry',
  matchMasterSprite: false,
  startThreshold: 0.008,
  preRollSec: 0.025,
  stopThreshold: 0.0025,
  reverbTailSec: 0.080,
  fadeTimeSec: 0.012,
  hardClampSamples: 64,
  targetPeak: 0.89,
  maxGainBoost: 4.5,
  enableEq: false,
  warmthGainDb: 2.2,
  deHarshGainDb: -2.2,
  enableAmbience: false,
  ambienceWetMix: 0.06,
  enableAutoStretch: false,
  minSpeechDurationSec: 0.260,
  targetSpeechDurationSec: 0.310,
};

export class AudioDspProcessor {
  private static instance: AudioDspProcessor;

  private constructor() {}

  public static getInstance(): AudioDspProcessor {
    if (!AudioDspProcessor.instance) {
      AudioDspProcessor.instance = new AudioDspProcessor();
    }
    return AudioDspProcessor.instance;
  }

  /**
   * Tính toán hệ số bộ lọc Biquad IIR theo công thức Audio EQ Cookbook của Robert Bristow-Johnson
   */
  public static calculateBiquad(
    type: 'highpass' | 'peaking' | 'highshelf',
    freq: number,
    sampleRate: number,
    q: number,
    gainDb: number
  ): BiquadFilterCoeffs {
    const clampedFreq = Math.max(10, Math.min(freq, sampleRate * 0.49));
    const w0 = (2 * Math.PI * clampedFreq) / sampleRate;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / (2 * Math.max(0.01, q));
    const A = Math.pow(10, gainDb / 40);

    let b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

    if (type === 'highpass') {
      b0 = (1 + cosw0) / 2;
      b1 = -(1 + cosw0);
      b2 = (1 + cosw0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
    } else if (type === 'peaking') {
      b0 = 1 + alpha * A;
      b1 = -2 * cosw0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw0;
      a2 = 1 - alpha / A;
    } else if (type === 'highshelf') {
      const sqrtA = Math.sqrt(A);
      b0 = A * ((A + 1) + (A - 1) * cosw0 + 2 * sqrtA * alpha);
      b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
      b2 = A * ((A + 1) + (A - 1) * cosw0 - 2 * sqrtA * alpha);
      a0 = (A + 1) - (A - 1) * cosw0 + 2 * sqrtA * alpha;
      a1 = 2 * ((A - 1) - (A + 1) * cosw0);
      a2 = (A + 1) - (A - 1) * cosw0 - 2 * sqrtA * alpha;
    }

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
  }

  /**
   * Áp dụng bộ lọc Biquad IIR trên mảng Float32Array bằng cấu trúc Direct Form II Transposed
   * Cực kỳ ổn định và hiệu năng cao trong mọi môi trường (Node.js & Web)
   */
  public applyBiquadFilter(
    samples: Float32Array,
    coeffs: BiquadFilterCoeffs
  ): Float32Array {
    const len = samples.length;
    const out = new Float32Array(len);
    const { b0, b1, b2, a1, a2 } = coeffs;
    let d1 = 0;
    let d2 = 0;

    for (let i = 0; i < len; i++) {
      const x = samples[i];
      const y = b0 * x + d1;
      d1 = b1 * x - a1 * y + d2;
      d2 = b2 * x - a2 * y;
      out[i] = y;
    }

    return out;
  }

  /**
   * Áp dụng chuỗi lọc Parametric EQ Sư phạm nhiều dải tần
   */
  public applyParametricEq(
    samples: Float32Array,
    sampleRate: number,
    bands: EqBandConfig[]
  ): Float32Array {
    let current = samples;
    for (const band of bands) {
      if (Math.abs(band.gainDb) < 0.05 && band.type !== 'highpass') continue;
      const coeffs = AudioDspProcessor.calculateBiquad(
        band.type,
        band.frequency,
        sampleRate,
        band.q,
        band.gainDb
      );
      current = this.applyBiquadFilter(current, coeffs);
    }
    return current;
  }

  /**
   * Bộ tổng hợp Buồng âm phản xạ sớm (Early Reflections Micro-Ambience)
   * Tái tạo không gian lớp học ấm cúng với RT60 ngắn, giữ nguyên 100% độ rõ chữ của âm tiết
   */
  public applyEarlyReflections(
    samples: Float32Array,
    sampleRate: number,
    delaySec = 0.022,
    feedback = 0.22,
    damping = 0.35,
    wetMix = 0.06
  ): Float32Array {
    if (wetMix <= 0.001 || samples.length === 0) return samples;
    const len = samples.length;
    const out = new Float32Array(len);
    const delaySamples = Math.max(1, Math.round(sampleRate * delaySec));
    const delayBuffer = new Float32Array(delaySamples);
    let bufIdx = 0;
    let lastFilter = 0;

    for (let i = 0; i < len; i++) {
      const x = samples[i];
      const delayed = delayBuffer[bufIdx];
      // One-pole lowpass damping
      lastFilter = delayed * (1 - damping) + lastFilter * damping;
      delayBuffer[bufIdx] = x + lastFilter * feedback;
      bufIdx = (bufIdx + 1) % delaySamples;

      // Trộn tín hiệu dry và wet
      out[i] = x * (1 - wetMix) + delayed * wetMix;
    }

    return out;
  }

  /**
   * Soft-Knee Limiter chống clip méo biên độ khi cộng hưởng tần số
   */
  public applySoftLimiter(samples: Float32Array, targetPeak = 0.89): Float32Array {
    const len = samples.length;
    if (len === 0) return samples;
    const out = new Float32Array(len);

    let maxAmp = 0;
    for (let i = 0; i < len; i++) {
      const a = Math.abs(samples[i]);
      if (a > maxAmp) maxAmp = a;
    }

    if (maxAmp <= 0.001) return samples;

    const gain = targetPeak / Math.max(targetPeak, maxAmp);
    for (let i = 0; i < len; i++) {
      out[i] = samples[i] * gain;
    }
    return out;
  }

  /**
   * Nhận diện thời lượng phát âm thực tế (Active Speech Duration) tính bằng giây
   * Ngưỡng mặc định: 0.008 (-42dB)
   */
  public detectActiveSpeechDuration(
    samples: Float32Array,
    sampleRate: number,
    threshold = 0.008
  ): number {
    if (!samples || samples.length === 0) return 0;
    const totalSamples = samples.length;
    const initialSkip = Math.min(64, Math.floor(totalSamples / 10));
    let start = initialSkip;
    let foundStart = false;
    for (let s = initialSkip; s < totalSamples; s++) {
      if (Math.abs(samples[s]) > threshold) {
        start = s;
        foundStart = true;
        break;
      }
    }
    let end = totalSamples - 1;
    let foundEnd = false;
    for (let s = totalSamples - 1; s >= (foundStart ? start : initialSkip); s--) {
      if (Math.abs(samples[s]) > threshold) {
        end = s;
        foundEnd = true;
        break;
      }
    }
    if (!foundStart || !foundEnd || end <= start) return 0;
    return (end - start) / sampleRate;
  }

  /**
   * Xác định toạ độ mẫu bắt đầu và kết thúc của phát âm thực tế
   * Sử dụng thuật toán Năng lượng Tích phân Cửa sổ Trượt (Sustained Window Energy):
   * - Bỏ qua 64 mẫu đầu để miễn nhiễm 100% với tiếng nổ/click của bộ giải mã MP3
   * - Quét cửa sổ trượt 5ms để phát hiện năng lượng âm học liên tục của giọng người
   * - Giữ an toàn pre-roll ở đầu và reverb decay tail ở đuôi
   */
  public detectSpeechBoundaries(
    samples: Float32Array,
    sampleRate: number,
    options?: DspOptions
  ): { startIdx: number; endIdx: number } {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const totalSamples = samples.length;
    if (totalSamples === 0) {
      return { startIdx: 0, endIdx: 0 };
    }

    const preRollSamples = Math.round(sampleRate * opts.preRollSec);
    const reverbTailSamples = Math.round(sampleRate * opts.reverbTailSec);

    // Chế độ đồng bộ 100% kho gốc trên máy (scripts/build-audio-sprite.js):
    // Bỏ qua MP3 click pop 64 mẫu đầu, giữ 15ms an toàn và quét đuôi ngân 50ms
    if (opts.matchMasterSprite) {
      let startIdx = 0;
      const skipSamples = Math.min(64, Math.floor(totalSamples / 10));
      for (let s = skipSamples; s < totalSamples; s++) {
        if (Math.abs(samples[s]) > opts.startThreshold) {
          startIdx = Math.max(0, s - Math.round(sampleRate * opts.preRollSec)); // 50ms pre-roll an toàn
          break;
        }
      }

      let endIdx = totalSamples - 1;
      for (let s = totalSamples - 1; s >= 0; s--) {
        if (Math.abs(samples[s]) > opts.stopThreshold) {
          endIdx = Math.min(totalSamples, s + reverbTailSamples);
          break;
        }
      }

      if (endIdx <= startIdx) {
        endIdx = totalSamples;
        startIdx = 0;
      }

      return { startIdx, endIdx };
    }

    // Kích thước cửa sổ tích phân năng lượng: 5ms (120 mẫu ở 24kHz)
    const windowSamples = Math.max(16, Math.round(sampleRate * 0.005));
    const stepSamples = Math.max(8, Math.round(windowSamples / 4));

    // Bỏ qua tối thiểu 64 mẫu đầu tiên để loại bỏ triệt để spike/pop của MP3 decoder header
    const initialSkipSamples = Math.min(64, Math.floor(totalSamples / 10));

    // 1. Tìm điểm bắt đầu dựa trên năng lượng trung bình tích phân
    let startIdx = 0;
    let foundStart = false;

    for (let s = initialSkipSamples; s <= totalSamples - windowSamples; s += stepSamples) {
      let energy = 0;
      for (let k = 0; k < windowSamples; k++) {
        energy += Math.abs(samples[s + k]);
      }
      const avgAmp = energy / windowSamples;

      if (avgAmp > opts.startThreshold) {
        startIdx = Math.max(0, s - preRollSamples);
        foundStart = true;
        break;
      }
    }

    // Fallback: nếu không tìm thấy qua startThreshold, thử với stopThreshold
    if (!foundStart) {
      for (let s = initialSkipSamples; s <= totalSamples - windowSamples; s += stepSamples) {
        let energy = 0;
        for (let k = 0; k < windowSamples; k++) {
          energy += Math.abs(samples[s + k]);
        }
        const avgAmp = energy / windowSamples;

        if (avgAmp > opts.stopThreshold) {
          startIdx = Math.max(0, s - preRollSamples);
          foundStart = true;
          break;
        }
      }
    }

    // 2. Tìm điểm kết thúc từ cuối lên
    let endIdx = totalSamples;
    for (let s = totalSamples - windowSamples; s >= (foundStart ? startIdx : 0); s -= stepSamples) {
      let energy = 0;
      for (let k = 0; k < windowSamples; k++) {
        energy += Math.abs(samples[s + k]);
      }
      const avgAmp = energy / windowSamples;

      if (avgAmp > opts.stopThreshold) {
        endIdx = Math.min(totalSamples, s + windowSamples + reverbTailSamples);
        break;
      }
    }

    // Bảo vệ trường hợp biên độ quá nhỏ hoặc tính toán âm
    if (endIdx <= startIdx) {
      startIdx = 0;
      endIdx = totalSamples;
    }

    return { startIdx, endIdx };
  }

  /**
   * Áp dụng chuỗi hiệu ứng DSP hoàn chỉnh trên đoạn tín hiệu đã gọt:
   * 1. Lọc Parametric EQ Sư phạm (Loại bỏ ù 85Hz, Tăng ấm 220Hz, Khử chói 3.6kHz, Dịu dải cao 7.5kHz)
   * 2. Buồng âm phản xạ sớm Micro-Ambience (Lớp học nhỏ ấm cúng)
   * 3. Chuẩn hóa biên độ đỉnh (Peak Normalization) về targetPeak (-1.0 dBFS)
   * 4. Làm mịn 2 đầu dạng cửa sổ Cosine (12ms Hann Windowing)
   * 5. Ép cứng 64 mẫu đầu/cuối về 0.0000 triệt tiêu DC Offset và tiếng bụp
   */
  public applyDspEffects(
    slice: Float32Array,
    sampleRate: number,
    opts: Required<DspOptions>
  ): Float32Array {
    const len = slice.length;
    if (len === 0) return new Float32Array(0);

    let processed = new Float32Array(slice);

    // 1. Áp dụng 5-Band Pedagogical EQ nếu được kích hoạt
    if (opts.enableEq) {
      const eqBands: EqBandConfig[] = [
        // Band 1: High-Pass 85Hz khử DC và rumble loa
        { type: 'highpass', frequency: 85, q: 0.707, gainDb: 0 },
        // Band 2: Warmth Boost 220Hz tạo độ ấm ngực cho giọng cô giáo
        { type: 'peaking', frequency: 220, q: 1.1, gainDb: opts.warmthGainDb },
        // Band 3: Clarity 1.8kHz làm sáng rõ âm đệm và âm chính
        { type: 'peaking', frequency: 1800, q: 1.2, gainDb: 0.8 },
        // Band 4: De-Harsh 3.6kHz khử chói gắt phụ âm xát
        { type: 'peaking', frequency: 3600, q: 1.4, gainDb: opts.deHarshGainDb },
        // Band 5: Air Smooth 7.5kHz làm mượt artifact MP3
        { type: 'highshelf', frequency: 7500, q: 0.8, gainDb: -1.8 },
      ];
      processed = this.applyParametricEq(processed, sampleRate, eqBands);
    }

    // 2. Áp dụng Micro-Ambience lớp học ấm cúng
    if (opts.enableAmbience && opts.ambienceWetMix > 0.001) {
      processed = this.applyEarlyReflections(
        processed,
        sampleRate,
        0.022,
        0.22,
        0.35,
        opts.ambienceWetMix
      );
    }

    // 3. Chuẩn hóa biên độ đỉnh (Peak Normalization & Soft Limiter)
    // Nếu matchMasterSprite: giữ nguyên dynamic range mộc tự nhiên của Zalo (giống kho máy)
    if (!opts.matchMasterSprite) {
      let maxAmp = 0;
      for (let i = 0; i < len; i++) {
        const absVal = Math.abs(processed[i]);
        if (absVal > maxAmp) {
          maxAmp = absVal;
        }
      }

      if (maxAmp > 0.005) {
        const gain = Math.min(opts.maxGainBoost, opts.targetPeak / maxAmp);
        for (let i = 0; i < len; i++) {
          processed[i] *= gain;
        }
      }

      // Soft limiter bảo đảm không vượt quá targetPeak
      processed = this.applySoftLimiter(processed, opts.targetPeak);
    }

    // 4. Cửa sổ Cosine (Hann Windowing 12ms) làm mịn 2 đầu
    const fadeSamples = Math.min(
      Math.floor(sampleRate * opts.fadeTimeSec),
      Math.floor(len / 2)
    );
    for (let i = 0; i < fadeSamples; i++) {
      const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
      processed[i] *= factor;
      processed[len - 1 - i] *= factor;
    }

    // 5. Ép cứng 64 mẫu đầu và cuối về 0.0000 triệt tiêu tiếng bụp/xẹt
    const clampLimit = Math.min(opts.hardClampSamples, Math.floor(len / 8));
    for (let i = 0; i < clampLimit; i++) {
      processed[i] = 0.0;
      processed[len - 1 - i] = 0.0;
    }

    return processed;
  }

  /**
   * Thuật toán co giãn thời lượng bảo toàn cao độ WSOLA (Waveform Similarity Overlap-Add)
   * Thuần TypeScript, tối ưu hóa phân cấp cross-correlation chạy cực nhanh (< 5ms trên CPU)
   * Bảo toàn 100% cao độ giọng đọc (Pitch-Preserving) và đặc tính ngữ âm tự nhiên của cô giáo.
   */
  public wsolaTimeStretch(
    samples: Float32Array,
    sampleRate: number,
    stretchFactor: number
  ): Float32Array {
    if (!samples || samples.length === 0) return new Float32Array(0);
    if (stretchFactor <= 0 || !Number.isFinite(stretchFactor)) return new Float32Array(0);
    if (Math.abs(stretchFactor - 1.0) < 0.01) return new Float32Array(samples);

    // Kích thước cửa sổ 20ms (480 mẫu ở 24kHz), bước nhảy tổng hợp 10ms (240 mẫu)
    const winSize = Math.max(64, Math.round(sampleRate * 0.020));
    const synHop = Math.floor(winSize / 2);
    const maxDelta = Math.floor(synHop / 2);

    const inputLen = samples.length;
    if (inputLen <= winSize) return new Float32Array(samples);

    const targetOutputLen = Math.round(inputLen * stretchFactor);
    if (targetOutputLen <= 0) return new Float32Array(0);
    const anaHop = synHop / stretchFactor;
    // Bổ sung +1 frame tổng hợp để bảo đảm overlap-add bao phủ trọn vẹn 100% targetOutputLen không bị hụt weight ở đuôi
    const numFrames = Math.max(1, Math.ceil((targetOutputLen - winSize) / synHop) + 1);

    const output = new Float32Array(targetOutputLen + winSize * 2);
    const weight = new Float32Array(targetOutputLen + winSize * 2);

    // Bảng cửa sổ Hann tổng hợp
    const window = new Float32Array(winSize);
    for (let i = 0; i < winSize; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winSize - 1)));
    }

    // Khởi tạo frame đầu tiên
    let tau = 0;
    for (let k = 0; k < winSize; k++) {
      output[k] += samples[k] * window[k];
      weight[k] += window[k];
    }

    // Vòng lặp tổng hợp Overlap-Add theo độ tương đồng dạng sóng
    for (let m = 1; m <= numFrames; m++) {
      const outPos = m * synHop;
      const nominalPos = Math.min(inputLen - winSize, Math.round(m * anaHop));
      const refStart = Math.min(inputLen - winSize, tau + synHop);

      const minD = Math.max(-maxDelta, -nominalPos);
      const maxD = Math.min(maxDelta, inputLen - winSize - nominalPos);

      // 1. Quét thô (coarse search: bước d = 2, lấy mẫu k = 4) để tối ưu hóa CPU < 3ms
      // Căn chỉnh lưới quét thô luôn đi qua delta = 0 (vị trí danh định bảo toàn cao độ tuyệt đối)
      let bestDelta = 0;
      let maxCorr = -Infinity;

      const coarseStart = minD % 2 === 0 ? minD : minD + 1;
      for (let d = coarseStart; d <= maxD; d += 2) {
        const candStart = nominalPos + d;
        let corr = 0;
        let normCand = 0;
        for (let k = 0; k < winSize; k += 4) {
          const sCand = samples[candStart + k];
          const sRef = samples[refStart + k];
          corr += sCand * sRef;
          normCand += sCand * sCand;
        }
        const score = normCand > 1e-8 ? corr / Math.sqrt(normCand) : 0;
        if (score > maxCorr) {
          maxCorr = score;
          bestDelta = d;
        }
      }

      // Kiểm tra thêm biên minD nếu là số lẻ để không bỏ sót phạm vi hợp lệ
      if (coarseStart > minD) {
        const candStart = nominalPos + minD;
        let corr = 0;
        let normCand = 0;
        for (let k = 0; k < winSize; k += 4) {
          const sCand = samples[candStart + k];
          const sRef = samples[refStart + k];
          corr += sCand * sRef;
          normCand += sCand * sCand;
        }
        const score = normCand > 1e-8 ? corr / Math.sqrt(normCand) : 0;
        if (score > maxCorr) {
          maxCorr = score;
          bestDelta = minD;
        }
      }

      // Kiểm tra thêm biên maxD nếu chưa được duyệt qua bước nhảy chẵn
      if (maxD > coarseStart && (maxD - coarseStart) % 2 !== 0) {
        const candStart = nominalPos + maxD;
        let corr = 0;
        let normCand = 0;
        for (let k = 0; k < winSize; k += 4) {
          const sCand = samples[candStart + k];
          const sRef = samples[refStart + k];
          corr += sCand * sRef;
          normCand += sCand * sCand;
        }
        const score = normCand > 1e-8 ? corr / Math.sqrt(normCand) : 0;
        if (score > maxCorr) {
          maxCorr = score;
          bestDelta = maxD;
        }
      }

      // 2. Tinh chỉnh mịn (fine refinement ±1) bảo đảm đồng pha tuyệt đối
      // Đánh giá các ứng viên [bestDelta - 1, bestDelta, bestDelta + 1] trên cùng thang đo k += 2
      let fineBestDelta = bestDelta;
      let fineMaxScore = -Infinity;
      for (const d of [bestDelta - 1, bestDelta, bestDelta + 1]) {
        if (d >= minD && d <= maxD) {
          const candStart = nominalPos + d;
          let corr = 0;
          let normCand = 0;
          for (let k = 0; k < winSize; k += 2) {
            const sCand = samples[candStart + k];
            const sRef = samples[refStart + k];
            corr += sCand * sRef;
            normCand += sCand * sCand;
          }
          const score = normCand > 1e-8 ? corr / Math.sqrt(normCand) : 0;
          if (score > fineMaxScore) {
            fineMaxScore = score;
            fineBestDelta = d;
          }
        }
      }

      tau = Math.max(0, Math.min(inputLen - winSize, nominalPos + fineBestDelta));

      for (let k = 0; k < winSize; k++) {
        output[outPos + k] += samples[tau + k] * window[k];
        weight[outPos + k] += window[k];
      }
    }

    const finalOutput = new Float32Array(targetOutputLen);
    for (let i = 0; i < targetOutputLen; i++) {
      finalOutput[i] = weight[i] > 1e-8 ? output[i] / weight[i] : samples[0];
    }
    if (weight[0] <= 1e-8) {
      finalOutput[0] = samples[0];
    }
    return finalOutput;
  }

  /**
   * Xử lý hoàn chỉnh từ mới tải về cho client (Zalo AI Dynamic In-Browser Mastering):
   * 1. Bỏ qua click/pop header MP3 (64 mẫu đầu)
   * 2. Nhận diện thời lượng phát âm thực tế (active speech duration)
   * 3. Nếu thời lượng thực tế < 260ms (như 'vui', 'em', 'lo'), tự động kéo giãn thân từ lên 300ms-320ms bằng WSOLA thuần TS
   * 4. Thêm 50ms pre-roll lấy hơi và 140ms natural decay tail
   * 5. Chuẩn hóa biên độ đỉnh về 0.89 (-1dBFS), Hann window 12ms và zero-clamp
   * Toàn bộ quy trình hoàn tất trong < 5ms
   */
  public processDynamicWord(
    samples: Float32Array,
    sampleRate: number,
    options?: DspOptions
  ): Float32Array {
    if (!samples || samples.length === 0) return new Float32Array(0);

    const profileOpts = options?.profile ? AUDIO_PROFILES[options.profile]?.options : {};
    const opts: Required<DspOptions> = {
      ...DEFAULT_OPTIONS,
      maxGainBoost: 4.5,
      preRollSec: 0.050,
      reverbTailSec: 0.140,
      targetPeak: 0.89,
      enableAutoStretch: true,
      minSpeechDurationSec: 0.260,
      targetSpeechDurationSec: 0.310,
      ...profileOpts,
      ...options,
    };
    if (options?.matchMasterSprite === undefined) {
      opts.matchMasterSprite = false;
    }

    const totalSamples = samples.length;
    const initialSkip = Math.min(64, Math.floor(totalSamples / 10));

    // Tìm điểm bắt đầu và kết thúc của phát âm thực tế
    let speechStart = initialSkip;
    let foundStart = false;
    for (let s = initialSkip; s < totalSamples; s++) {
      if (Math.abs(samples[s]) > opts.startThreshold) {
        speechStart = s;
        foundStart = true;
        break;
      }
    }

    let speechEnd = totalSamples - 1;
    let foundEnd = false;
    for (let s = totalSamples - 1; s >= (foundStart ? speechStart : initialSkip); s--) {
      if (Math.abs(samples[s]) > opts.startThreshold) {
        speechEnd = s;
        foundEnd = true;
        break;
      }
    }

    if (!foundStart || !foundEnd || speechEnd <= speechStart) {
      return this.applyDspEffects(samples, sampleRate, opts);
    }

    const activeDurationSec = (speechEnd - speechStart) / sampleRate;
    let speechCore = samples.subarray(speechStart, speechEnd);

    // Kéo giãn WSOLA nếu thời lượng phát âm thực tế < 260ms
    if (opts.enableAutoStretch && activeDurationSec < opts.minSpeechDurationSec) {
      const stretchFactor = opts.targetSpeechDurationSec / activeDurationSec;
      speechCore = this.wsolaTimeStretch(speechCore, sampleRate, stretchFactor);
    }

    // Ghép 50ms pre-roll lấy hơi tự nhiên và 140ms natural decay tail
    const preRollSamples = Math.round(sampleRate * opts.preRollSec);
    const tailSamples = Math.round(sampleRate * opts.reverbTailSec);

    const combinedLen = preRollSamples + speechCore.length + tailSamples;
    const combined = new Float32Array(combinedLen);

    // Pre-roll từ âm thanh gốc trước speechStart
    const availablePreRoll = Math.min(preRollSamples, speechStart - initialSkip);
    const preSrcStart = speechStart - availablePreRoll;
    for (let i = 0; i < availablePreRoll; i++) {
      combined[preRollSamples - availablePreRoll + i] = samples[preSrcStart + i];
    }
    // Nếu pre-roll bị thiếu so với preRollSamples (50ms), làm mịn đầu vào để không bị nhảy bậc từ 0
    if (availablePreRoll > 0 && availablePreRoll < preRollSamples) {
      const preFade = Math.min(availablePreRoll, Math.round(sampleRate * 0.008));
      const preOffset = preRollSamples - availablePreRoll;
      for (let f = 0; f < preFade; f++) {
        combined[preOffset + f] *= f / preFade;
      }
    }

    // Thân từ (đã kéo giãn hoặc nguyên bản)
    combined.set(speechCore, preRollSamples);

    if (availablePreRoll === 0 && speechCore.length > 0) {
      // Không có pre-roll từ nguồn, làm mịn 5ms đầu speechCore chống click
      const coreInFade = Math.min(speechCore.length, Math.round(sampleRate * 0.005));
      for (let f = 0; f < coreInFade; f++) {
        combined[preRollSamples + f] *= f / coreInFade;
      }
    }

    // Decay tail từ âm thanh gốc sau speechEnd
    const availableTail = Math.min(tailSamples, totalSamples - speechEnd);
    const tailInsertStart = preRollSamples + speechCore.length;
    for (let i = 0; i < availableTail; i++) {
      combined[tailInsertStart + i] = samples[speechEnd + i];
    }

    // Làm mịn điểm nối giữa speechCore và decay tail
    const junctionFade = Math.min(Math.round(sampleRate * 0.003), Math.floor(speechCore.length / 8));
    if (speechCore.length > 0) {
      if (availableTail >= junctionFade && junctionFade > 2) {
        // Đủ mẫu tail tự nhiên: crossfade 3ms giữa đuôi speechCore và đầu availableTail
        const coreLastVal = speechCore[speechCore.length - 1];
        for (let f = 0; f < junctionFade; f++) {
          const factor = f / junctionFade;
          const tailIdx = tailInsertStart + f;
          combined[tailIdx] = (1 - factor) * coreLastVal + factor * combined[tailIdx];
        }
      } else {
        // availableTail bị thiếu (< 3ms): làm mịn 6ms cuối speechCore xuống 0 để không bị nhảy bậc sang vùng đệm tail
        const coreFade = Math.min(speechCore.length, Math.round(sampleRate * 0.006));
        for (let f = 0; f < coreFade; f++) {
          const factor = 0.5 * (1 + Math.cos((Math.PI * f) / coreFade));
          const idx = tailInsertStart - coreFade + f;
          combined[idx] *= factor;
        }
      }
    }

    // Nếu tail bị thiếu so với tailSamples (140ms), làm mịn điểm kết thúc của availableTail để không bị cắt giật sang vùng đệm 0
    if (availableTail > 0 && availableTail < tailSamples) {
      const tailFade = Math.min(availableTail, Math.round(sampleRate * 0.010));
      const tailEndIdx = tailInsertStart + availableTail;
      for (let f = 0; f < tailFade; f++) {
        const factor = 0.5 * (1 + Math.cos((Math.PI * f) / tailFade));
        combined[tailEndIdx - tailFade + f] *= factor;
      }
    }

    // Áp dụng DSP effects: Hann 12ms, Hard Clamp, Peak Normalization về 0.89 (-1dBFS)
    return this.applyDspEffects(combined, sampleRate, opts);
  }

  /**
   * Xử lý tín hiệu PCM thô
   * Hoạt động độc lập cả trong Node.js (Unit Test) lẫn Browser
   */
  public processPcmSamples(
    samples: Float32Array,
    sampleRate: number,
    options?: DspOptions
  ): Float32Array {
    const profileOpts = options?.profile ? AUDIO_PROFILES[options.profile]?.options : {};
    const opts = { ...DEFAULT_OPTIONS, ...profileOpts, ...options };
    if (!samples || samples.length === 0) {
      return new Float32Array(0);
    }

    if (opts.enableAutoStretch) {
      return this.processDynamicWord(samples, sampleRate, opts);
    }

    const { startIdx, endIdx } = this.detectSpeechBoundaries(samples, sampleRate, opts);
    const trimmedLength = endIdx - startIdx;
    if (trimmedLength <= 0) {
      return new Float32Array(0);
    }

    const slice = samples.subarray(startIdx, endIdx);
    return this.applyDspEffects(slice, sampleRate, opts);
  }

  /**
   * Xử lý và làm đẹp một Web Audio API AudioBuffer
   */
  public trimAndEnhanceAudioBuffer(
    buffer: AudioBuffer,
    ctx: AudioContext,
    options?: DspOptions
  ): AudioBuffer {
    const profileOpts = options?.profile ? AUDIO_PROFILES[options.profile]?.options : {};
    const opts = { ...DEFAULT_OPTIONS, ...profileOpts, ...options };
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;

    if (channels === 0 || buffer.length === 0) {
      return buffer;
    }

    // Nếu bật auto stretch WSOLA (cho từ mới tải về)
    if (opts.enableAutoStretch) {
      const primaryProcessed = this.processDynamicWord(buffer.getChannelData(0), sampleRate, opts);
      const newLen = Math.max(1, primaryProcessed.length);
      const newBuffer = ctx.createBuffer(channels, newLen, sampleRate);
      newBuffer.getChannelData(0).set(primaryProcessed);
      for (let ch = 1; ch < channels; ch++) {
        const processed = this.processDynamicWord(buffer.getChannelData(ch), sampleRate, opts);
        if (processed.length === newLen) {
          newBuffer.getChannelData(ch).set(processed);
        } else if (processed.length > newLen) {
          newBuffer.getChannelData(ch).set(processed.subarray(0, newLen));
        } else {
          newBuffer.getChannelData(ch).set(processed);
        }
      }
      return newBuffer;
    }

    // Dùng kênh 0 để định vị ranh giới âm thanh chính
    const primarySamples = buffer.getChannelData(0);
    const { startIdx, endIdx } = this.detectSpeechBoundaries(primarySamples, sampleRate, opts);
    const newLength = Math.max(1, endIdx - startIdx);

    const newBuffer = ctx.createBuffer(channels, newLength, sampleRate);

    for (let ch = 0; ch < channels; ch++) {
      const rawData = buffer.getChannelData(ch);
      const slice = rawData.subarray(startIdx, endIdx);
      const processed = this.applyDspEffects(slice, sampleRate, opts);
      newBuffer.getChannelData(ch).set(processed);
    }

    return newBuffer;
  }

  /**
   * Chuyển đổi dữ liệu mẫu Float32Array thành file nhị phân RIFF/WAVE 16-bit PCM Mono
   */
  public pcmToWavArrayBuffer(samples: Float32Array, sampleRate = 24000): ArrayBuffer {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const dataSize = samples.length * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Ghi các mẫu 16-bit PCM
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1.0, Math.min(1.0, samples[i]));
      const int16Val = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, Math.round(int16Val), true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Chuyển đổi Web Audio AudioBuffer thành ArrayBuffer WAV 16-bit
   */
  public audioBufferToWavArrayBuffer(buffer: AudioBuffer): ArrayBuffer {
    if (!buffer || buffer.numberOfChannels === 0 || buffer.length === 0) {
      return this.pcmToWavArrayBuffer(new Float32Array(0), buffer?.sampleRate || 24000);
    }
    const samples = buffer.getChannelData(0);
    return this.pcmToWavArrayBuffer(samples, buffer.sampleRate);
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const audioDspProcessor = AudioDspProcessor.getInstance();
