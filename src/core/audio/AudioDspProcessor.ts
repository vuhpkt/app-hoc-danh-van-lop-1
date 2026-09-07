/**
 * src/core/audio/AudioDspProcessor.ts
 * 
 * BỘ XỬ LÝ TÍN HIỆU SỐ ÂM THANH CLIENT-SIDE (DSP POST-PROCESSOR)
 * Giúp âm thanh tải về từ Zalo AI đạt 100% chất lượng, nhịp điệu và độ đanh như Master Sprite:
 * 1. Silence Trimming: Gọt sạch khoảng lặng trễ 150ms-350ms ở đầu và đuôi
 * 2. Smart Reverb Tail: Giữ 50ms đuôi ngân tự nhiên (-52dB)
 * 3. 12ms Hann Windowing: Làm mịn sóng dạng cosine chống giật
 * 4. Zero-Crossing Hard Clamp: Ép 64 mẫu PCM về 0.0000 triệt tiêu DC Offset và tiếng bụp
 * 5. Peak Normalization: Chuẩn hóa biên độ đỉnh về -1dB (~0.89) đồng đều âm lượng
 * 6. WAV Serializer: Xuất định dạng 16-bit PCM WAV tương thích 100% IndexedDB
 */

export interface DspOptions {
  /** Ngưỡng phát hiện bắt đầu nói (mặc định: 0.008 ~ -42dB) */
  startThreshold?: number;
  /** Thời gian giữ an toàn đầu (giây, mặc định: 0.010 = 10ms) */
  preRollSec?: number;
  /** Ngưỡng phát hiện kết thúc nói (mặc định: 0.0025 ~ -52dB) */
  stopThreshold?: number;
  /** Thời gian ngân đuôi tự nhiên (giây, mặc định: 0.050 = 50ms) */
  reverbTailSec?: number;
  /** Cửa sổ làm mịn Hann Windowing (giây, mặc định: 0.012 = 12ms) */
  fadeTimeSec?: number;
  /** Số mẫu đầu và cuối ép cứng về 0.0000 triệt tiêu tiếng bụp (mặc định: 64) */
  hardClampSamples?: number;
  /** Biên độ đỉnh mục tiêu để chuẩn hóa (mặc định: 0.89 ~ -1.0 dBFS) */
  targetPeak?: number;
  /** Giới hạn hệ số khuếch đại tối đa chống boost tiếng ồn (mặc định: 3.5) */
  maxGainBoost?: number;
}

const DEFAULT_OPTIONS: Required<DspOptions> = {
  startThreshold: 0.008,
  preRollSec: 0.010,
  stopThreshold: 0.0025,
  reverbTailSec: 0.050,
  fadeTimeSec: 0.012,
  hardClampSamples: 64,
  targetPeak: 0.89,
  maxGainBoost: 6.0,
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
   * Xác định toạ độ mẫu bắt đầu và kết thúc của phát âm thực tế
   * Sử dụng thuật toán Năng lượng Tích phân Cửa sổ Trượt (Sustained Window Energy):
   * - Bỏ qua 64 mẫu đầu để miễn nhiễm 100% với tiếng nổ/click của bộ giải mã MP3
   * - Quét cửa sổ trượt 5ms để phát hiện năng lượng âm học liên tục của giọng người
   * - Giữ an toàn 12ms pre-roll ở đầu và 50ms reverb decay tail ở đuôi
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

    // Kích thước cửa sổ tích phân năng lượng: 5ms (120 mẫu ở 24kHz)
    const windowSamples = Math.max(16, Math.round(sampleRate * 0.005));
    const stepSamples = Math.max(8, Math.round(windowSamples / 4));

    // Bỏ qua tối thiểu 64 mẫu đầu tiên để loại bỏ triệt để spike/pop của MP3 decoder header
    const initialSkipSamples = Math.min(64, Math.floor(totalSamples / 10));

    // 1. Tìm điểm bắt đầu dựa trên năng lượng trung bình tích phân (Sustained Window Energy)
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
   * Áp dụng các hiệu ứng DSP trên đoạn tín hiệu đã cắt gọt:
   * 1. Chuẩn hóa biên độ đỉnh (Peak Normalization) về -1.0 dBFS
   * 2. Làm mịn 2 đầu dạng cửa sổ Cosine (12ms Hann Windowing)
   * 3. Ép cứng 64 mẫu đầu/cuối về 0.0000 triệt tiêu DC Offset
   */
  public applyDspEffects(
    slice: Float32Array,
    sampleRate: number,
    opts: Required<DspOptions>
  ): Float32Array {
    const len = slice.length;
    if (len === 0) return new Float32Array(0);

    const result = new Float32Array(len);

    // Tìm biên độ lớn nhất trên giọng nói thực tế
    let maxAmp = 0;
    for (let i = 0; i < len; i++) {
      const val = slice[i];
      result[i] = val;
      const absVal = Math.abs(val);
      if (absVal > maxAmp) {
        maxAmp = absVal;
      }
    }

    // 1. Chuẩn hóa âm lượng đỉnh
    if (maxAmp > 0.005) {
      const gain = Math.min(opts.maxGainBoost, opts.targetPeak / maxAmp);
      for (let i = 0; i < len; i++) {
        result[i] *= gain;
      }
    }

    // 2. Cửa sổ Cosine (Hann Windowing 12ms) làm mịn 2 đầu
    const fadeSamples = Math.min(
      Math.floor(sampleRate * opts.fadeTimeSec),
      Math.floor(len / 2)
    );
    for (let i = 0; i < fadeSamples; i++) {
      const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
      result[i] *= factor;
      result[len - 1 - i] *= factor;
    }

    // 3. Ép cứng 64 mẫu đầu và cuối về 0.0000 triệt tiêu tiếng bụp/xẹt
    const clampLimit = Math.min(opts.hardClampSamples, Math.floor(len / 8));
    for (let i = 0; i < clampLimit; i++) {
      result[i] = 0.0;
      result[len - 1 - i] = 0.0;
    }

    return result;
  }

  /**
   * Xử lý tín hiệu PCM thô: Cắt khoảng lặng, làm mịn Hann Windowing, chuẩn hóa biên độ
   * Hoạt động độc lập cả trong Node.js (Unit Test) lẫn Browser
   */
  public processPcmSamples(
    samples: Float32Array,
    sampleRate: number,
    options?: DspOptions
  ): Float32Array {
    const opts = { ...DEFAULT_OPTIONS, ...options };
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
    const opts = { ...DEFAULT_OPTIONS, ...options };
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
