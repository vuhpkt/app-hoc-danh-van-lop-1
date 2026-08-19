/**
 * Mô-đun 4: AudioSpritePlayer - Bộ điều khiển phát âm thanh cấp cao
 * - Hỗ trợ phát từ đơn lẻ (đánh vần / đọc trơn)
 * - Hỗ trợ phát cả câu (Đọc trơn Karaoke / Đánh vần từng từ tuần tự cả câu)
 * - Tương thích mượt mà giữa Real Audio Sprite và Synthetic Tone Generator
 */
import { AudioSpriteMap, PhonicsBreakdown } from '../../types';
import { webAudioEngine, AudioSequenceItem } from './WebAudioEngine';
import { spriteManager, SpriteManager } from './SpriteManager';

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
   * 3. PHÁT ĐỌC TRƠN CẢ CÂU (Fluent Sentence Reading - Karaoke Mode)
   * - Phát tuần tự từng từ trong câu
   * - Chèn khoảng nghỉ tự nhiên giữa các từ (~150ms ở tốc độ 1.0x)
   * - Kích hoạt callback onWordChange(index) theo thời gian thực để highlight chữ
   */
  public static playSentenceFluent(
    words: { text: string; breakdown?: PhonicsBreakdown }[],
    speed = 1.0,
    onWordChange?: (index: number) => void,
    onComplete?: () => void,
    useRealAudio = true
  ): { stop: () => void } {
    this.sentencePlaybackId++;
    const currentId = this.sentencePlaybackId;

    // Khoảng nghỉ tự nhiên giữa các từ trong câu: ~160ms ở 1.0x, ~400ms ở 0.7x, ~600ms ở 0.5x
    const interWordGapMs = Math.round(160 + Math.max(0, 1 - speed) * 750);

    const run = async () => {
      if (useRealAudio && !spriteManager.isSpriteReady()) {
        await spriteManager.loadSprite();
      }

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

        // Chèn khoảng nghỉ giữa 2 từ
        if (i < words.length - 1) {
          await new Promise((r) => setTimeout(r, interWordGapMs));
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
    words: { text: string; breakdown?: PhonicsBreakdown }[],
    speed = 1.0,
    onStepChange?: (wordIdx: number, subStepIdx: number, subStepLabel: string) => void,
    onComplete?: () => void,
    useRealAudio = true
  ): { stop: () => void } {
    this.sentencePlaybackId++;
    const currentId = this.sentencePlaybackId;

    const interWordGapMs = Math.round(350 + Math.max(0, 1 - speed) * 800);
    const intraPhonemeGapMs = SpriteManager.calculateSilencePadding(speed);

    const run = async () => {
      if (useRealAudio && !spriteManager.isSpriteReady()) {
        await spriteManager.loadSprite();
      }

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
            await new Promise((r) => setTimeout(r, intraPhonemeGapMs));
          }
        }

        // Khoảng nghỉ dài hơn giữa 2 từ khác nhau
        if (i < words.length - 1) {
          onStepChange?.(i, -1, '');
          await new Promise((r) => setTimeout(r, interWordGapMs));
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
