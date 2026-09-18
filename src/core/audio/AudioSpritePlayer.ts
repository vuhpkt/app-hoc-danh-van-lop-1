/**
 * Mô-đun 4: AudioSpritePlayer - Bộ điều khiển phát âm thanh cấp cao
 * - Hỗ trợ phát từ đơn lẻ (đánh vần / đọc trơn)
 * - Hỗ trợ phát cả câu (Đọc trơn Karaoke / Đánh vần từng từ tuần tự cả câu)
 * - Tương thích mượt mà giữa Real Audio Sprite và Synthetic Tone Generator
 */
import type { AudioSpriteMap, PhonicsBreakdown, Token } from '../../types/index.ts';
import { webAudioEngine } from './WebAudioEngine.ts';
import type { AudioSequenceItem } from './WebAudioEngine.ts';
import { spriteManager, SpriteManager } from './SpriteManager.ts';

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
  private static sentencePlaybackId = 0;
  private static activeDelays: ReturnType<typeof setTimeout>[] = [];

  /**
   * Tính toán khoảng nghỉ tự nhiên giữa các từ:
   * - Tốc độ 1.0x: ~160ms
   * - Tốc độ 0.8x: ~310ms (chuẩn SGK Lớp 1)
   * - Tốc độ 0.6x: ~460ms (chậm cho bé mới làm quen)
   * - Dấu phẩy (,): +150ms
   * - Dấu chấm (.), than (!), hỏi (?), xuống dòng thơ (\n): +320ms
   */
  public static calculateInterWordGap(speed = 0.8, punctuationAfter?: string): number {
    const baseGap = Math.round(160 + Math.max(0, 1 - speed) * 750);
    if (!punctuationAfter) return baseGap;

    if (punctuationAfter === '\n' || /[.!?]/.test(punctuationAfter)) {
      return baseGap + 320;
    }
    if (/[,;:]/.test(punctuationAfter)) {
      return baseGap + 150;
    }
    return baseGap;
  }

  /**
   * Đóng gói tokens thành danh sách từ phát âm kèm thông tin dấu câu/ngắt dòng kế tiếp
   * Giữ nguyên vị trí index để highlight Karaoke chính xác 100%
   */
  public static packageTokensForPlayback(tokens: Token[]): Array<{
    text: string;
    breakdown?: PhonicsBreakdown;
    punctuationAfter?: string;
    originalIndex: number;
  }> {
    const words: Array<{
      text: string;
      breakdown?: PhonicsBreakdown;
      punctuationAfter?: string;
      originalIndex: number;
    }> = [];

    let currentSyllable: {
      text: string;
      breakdown?: PhonicsBreakdown;
      punctuationAfter?: string;
      originalIndex: number;
    } | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'syllable') {
        if (currentSyllable) {
          words.push(currentSyllable);
        }
        currentSyllable = {
          text: token.text,
          breakdown: token.phonics,
          punctuationAfter: undefined,
          originalIndex: words.length,
        };
      } else if (currentSyllable) {
        if (token.type === 'punctuation') {
          currentSyllable.punctuationAfter = token.text;
        } else if (token.type === 'newline') {
          currentSyllable.punctuationAfter = '\n';
        }
      }
    }

    if (currentSyllable) {
      words.push(currentSyllable);
    }

    return words;
  }

  private static cancellableSleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      timer = setTimeout(() => {
        this.activeDelays = this.activeDelays.filter((t) => t !== timer);
        resolve();
      }, ms);
      this.activeDelays.push(timer);
    });
  }

  private static clearDelays(): void {
    this.activeDelays.forEach((t) => clearTimeout(t));
    this.activeDelays = [];
  }

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
   * 1. Phát chuỗi đánh vần của 1 từ đơn lẻ
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
   * 2. Phát đọc trơn (Fluent read) 1 từ đơn lẻ
   */
  public static playFluentWord(
    breakdown: PhonicsBreakdown,
    speed = 1.0,
    onComplete?: () => void,
    useRealAudio = true
  ): { stop: () => void } {
    if (useRealAudio) {
      spriteManager.playAudioSegment(breakdown.raw).then(() => {
        onComplete?.();
      });
      return {
        stop: () => spriteManager.stop(),
      };
    }

    webAudioEngine.playSyntheticTone(breakdown.raw, breakdown.tone, 550, speed).then(() => {
      onComplete?.();
    });

    return {
      stop: () => webAudioEngine.stop(),
    };
  }

  /**
   * Tải trước toàn bộ âm thanh của các từ trong câu trước khi bắt đầu phát
   * Đảm bảo không nhảy vào đọc khi chưa có đủ file âm thanh
   */
  public static async prebufferSentence(
    words: { text: string; breakdown?: PhonicsBreakdown }[],
    onProgress?: (info: { current: number; total: number; word: string }) => void
  ): Promise<void> {
    if (!spriteManager.isSpriteReady()) {
      await spriteManager.loadSprite();
    }

    const cleanWords = words
      .map((w) => w.text.replace(/[,.!?:;]/g, '').trim().toLowerCase())
      .filter((w) => w.length > 0);

    const uniqueWords = Array.from(new Set(cleanWords));
    const total = uniqueWords.length;

    for (let i = 0; i < total; i++) {
      const word = uniqueWords[i];
      onProgress?.({ current: i + 1, total, word });
      await spriteManager.preloadAudio(word);
    }
  }

  /**
   * 3. PHÁT ĐỌC TRƠN CẢ CÂU (Fluent Sentence Reading - Karaoke Mode)
   * - Tự động nạp trước 100% âm thanh trước khi phát
   * - Phát tuần tự từng từ trong câu
   * - Chèn khoảng nghỉ tự nhiên giữa các từ (~150ms ở tốc độ 1.0x)
   * - Kích hoạt callback onWordChange(index) theo thời gian thực để highlight chữ
   */
  public static playSentenceFluent(
    words: { text: string; breakdown?: PhonicsBreakdown; punctuationAfter?: string }[],
    speed = 0.8,
    onWordChange?: (index: number) => void,
    onComplete?: () => void,
    useRealAudio = true,
    onPreparing?: (info: { current: number; total: number; word: string }) => void
  ): { stop: () => void } {
    this.sentencePlaybackId++;
    const currentId = this.sentencePlaybackId;

    const run = async () => {
      // 1. Tải trước toàn bộ âm thanh của câu trước khi nhảy vào đọc!
      if (useRealAudio) {
        await this.prebufferSentence(words, onPreparing);
      }

      if (currentId !== this.sentencePlaybackId) return;

      for (let i = 0; i < words.length; i++) {
        if (currentId !== this.sentencePlaybackId) return;

        const item = words[i];
        const cleanWord = item.text.replace(/[,.!?:;]/g, '').trim();

        if (!cleanWord) continue;

        onWordChange?.(i);

        if (useRealAudio) {
          await spriteManager.playAudioSegment(cleanWord);
        } else {
          const tone = item.breakdown?.tone || 'ngang';
          await webAudioEngine.playSyntheticTone(cleanWord, tone, 500, 1.0);
        }

        if (currentId !== this.sentencePlaybackId) return;

        // Chèn khoảng nghỉ giữa 2 từ (có tính dấu câu hoặc ngắt dòng bài thơ)
        if (i < words.length - 1) {
          const gapMs = AudioSpritePlayer.calculateInterWordGap(speed, item.punctuationAfter);
          await this.cancellableSleep(gapMs);
        }
      }

      if (currentId === this.sentencePlaybackId) {
        onWordChange?.(-1);
        onComplete?.();
      }
    };

    run();

    return {
      stop: () => {
        this.sentencePlaybackId++;
        this.clearDelays();
        spriteManager.stop();
        webAudioEngine.stop();
        onWordChange?.(-1);
      },
    };
  }

  /**
   * 4. PHÁT ĐÁNH VẦN TỪNG TỪ TRONG CẢ CÂU (Spelling Sentence Reading)
   * - Lần lượt đánh vần chi tiết từng từ trong câu
   * - Báo cả vị trí từ đang đánh vần và mẩu âm (sub-step) đang phát để hiển thị Tooltip/Badge
   */
  public static playSentenceSpelling(
    words: { text: string; breakdown?: PhonicsBreakdown; punctuationAfter?: string }[],
    speed = 0.8,
    onStepChange?: (wordIdx: number, subStepIdx: number, subStepLabel: string) => void,
    onComplete?: () => void,
    useRealAudio = true,
    onPreparing?: (info: { current: number; total: number; word: string }) => void
  ): { stop: () => void } {
    this.sentencePlaybackId++;
    const currentId = this.sentencePlaybackId;

    const intraPhonemeGapMs = SpriteManager.calculateSilencePadding(speed);

    const run = async () => {
      if (useRealAudio) {
        if (!spriteManager.isSpriteReady()) {
          await spriteManager.loadSprite();
        }

        // Tải trước toàn bộ các bước đánh vần của toàn bộ từ trong câu
        const allSteps: string[] = [];
        for (const w of words) {
          if (w.breakdown?.spellingFormula) {
            allSteps.push(...w.breakdown.spellingFormula);
          }
        }
        const uniqueSteps = Array.from(new Set(allSteps));
        for (let i = 0; i < uniqueSteps.length; i++) {
          const step = uniqueSteps[i];
          onPreparing?.({ current: i + 1, total: uniqueSteps.length, word: step });
          await spriteManager.preloadAudio(step);
        }
      }

      if (currentId !== this.sentencePlaybackId) return;

      for (let i = 0; i < words.length; i++) {
        if (currentId !== this.sentencePlaybackId) return;

        const item = words[i];
        const breakdown = item.breakdown;

        if (!breakdown || breakdown.spellingFormula.length === 0) {
          continue;
        }

        // Phát từng mẩu âm trong công thức đánh vần của từ i
        for (let s = 0; s < breakdown.spellingFormula.length; s++) {
          if (currentId !== this.sentencePlaybackId) return;

          const stepLabel = breakdown.spellingFormula[s];
          onStepChange?.(i, s, stepLabel);

          if (useRealAudio) {
            await spriteManager.playAudioSegment(stepLabel);
          } else {
            const isLast = s === breakdown.spellingFormula.length - 1;
            const isTone = stepLabel === breakdown.toneName && breakdown.tone !== 'ngang';
            const stepTone = isTone || isLast ? breakdown.tone : 'ngang';
            await webAudioEngine.playSyntheticTone(stepLabel, stepTone, 450, 1.0);
          }

          if (currentId !== this.sentencePlaybackId) return;

          // Khoảng nghỉ giữa các mẩu âm trong 1 từ
          if (s < breakdown.spellingFormula.length - 1) {
            await this.cancellableSleep(intraPhonemeGapMs);
          }
        }

        // Khoảng nghỉ dài hơn giữa 2 từ khác nhau (có tính dấu câu hoặc ngắt dòng bài thơ)
        if (i < words.length - 1) {
          onStepChange?.(i, -1, '');
          const gapMs = AudioSpritePlayer.calculateInterWordGap(speed, item.punctuationAfter) + 120;
          await this.cancellableSleep(gapMs);
        }
      }

      if (currentId === this.sentencePlaybackId) {
        onStepChange?.(-1, -1, '');
        onComplete?.();
      }
    };

    run();

    return {
      stop: () => {
        this.sentencePlaybackId++;
        this.clearDelays();
        spriteManager.stop();
        webAudioEngine.stop();
        onStepChange?.(-1, -1, '');
      },
    };
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
