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
