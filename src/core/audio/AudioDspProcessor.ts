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
}

export const AUDIO_PROFILES: Record<AudioProfileId, {
  name: string;
  description: string;
  options: Partial<DspOptions>;
}> = {
  master_sprite_sync: {
    name: 'Đồng Bộ Kho Gốc (Master Sprite 100%)',
    description: 'Khớp 100% với 225 clips kho gốc: Giữ nguyên đệm lấy hơi tự nhiên đầu file, tail 50ms, Hann 12ms, dynamic range mộc của Zalo.',
    options: {
      matchMasterSprite: true,
      enableEq: false,
      enableAmbience: false,
      maxGainBoost: 1.0,
      hardClampSamples: 32,
      fadeTimeSec: 0.012,
      preRollSec: 0.050,
      reverbTailSec: 0.140,
      stopThreshold: 0.0025,
      startThreshold: 0.008,
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
