import React from 'react';
import { Volume2 } from 'lucide-react';
import { Token } from '../../types/index.ts';

export interface PhonicsKaraokeStageProps {
  token: Token | null;
  activeStepIndex: number; // 0..n hoặc -1 khi không phát
  activeStepLabel?: string;
  isPlaying?: boolean;
  onStepClick?: (stepIndex: number, stepLabel: string) => void;
  onReplayWord?: () => void;
}

/**
 * Lấy nhãn gợi ý sư phạm bên dưới mỗi thẻ (tối giản, dễ hiểu cho trẻ lớp 1)
 */
export function getStepPedagogicalLabel(stepIndex: number, totalSteps: number, toneName: string): string {
  if (totalSteps === 5) {
    switch (stepIndex) {
      case 0: return 'âm đầu';
      case 1: return 'vần';
      case 2: return 'tiếng';
      case 3: return 'dấu ' + toneName;
      case 4: return 'từ đọc';
      default: return '';
    }
  }

  if (totalSteps === 3) {
    switch (stepIndex) {
      case 0: return 'âm đầu';
      case 1: return 'vần';
      case 2: return 'từ đọc';
      default: return '';
    }
  }

  return stepIndex === totalSteps - 1 ? 'từ đọc' : '';
}

export const PhonicsKaraokeStage: React.FC<PhonicsKaraokeStageProps> = ({
  token,
  activeStepIndex,
  onStepClick,
  onReplayWord,
}) => {
  const phonics = token?.phonics;
  const formula = phonics?.spellingFormula || [];
  const toneName = phonics?.toneName || 'ngang';

  if (!token || !phonics || formula.length === 0) {
    return (
      <div
        data-testid="phonics-karaoke-stage-empty"
        className="bg-white/80 rounded-2xl border border-stone-200/80 px-4 py-2.5 text-center shadow-2xs transition-all"
      >
        <p className="text-xs sm:text-sm text-stone-500 font-medium">
          Chạm vào từ bất kỳ trong bài để xem và nghe đánh vần từng bước
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="phonics-karaoke-stage"
      className="bg-[#FFFDF9] rounded-2xl border border-amber-200/80 p-3.5 sm:p-4 shadow-xs space-y-2.5 transition-all"
    >
      {/* THANH THÔNG TIN TỪ ĐANG ĐÁNH VẦN */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-bold">Đánh vần:</span>
          <span className="text-sm sm:text-base font-black text-stone-900 px-2.5 py-0.5 rounded-lg bg-amber-100 border border-amber-300/80">
            {token.phonics?.clean || token.text}
          </span>
        </div>

        {onReplayWord && (
          <button
            type="button"
            onClick={onReplayWord}
            title={`Nghe lại từ "${token.phonics?.clean || token.text}"`}
            className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 px-2.5 py-1 rounded-xl text-xs font-bold border border-stone-200 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Nghe cả từ</span>
          </button>
        )}
      </div>

      {/* CHUỖI THẺ ÂM TIẾT */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 py-1">
        {formula.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isPassed = activeStepIndex > idx && activeStepIndex >= 0;
          const isFinal = idx === formula.length - 1;
          const roleLabel = getStepPedagogicalLabel(idx, formula.length, toneName);

          return (
            <React.Fragment key={`step-${idx}-${step}`}>
              <button
                type="button"
                data-testid={`phonics-tile-${idx}`}
                onClick={() => onStepClick?.(idx, step)}
                title={`Nghe âm "${step}"`}
                className={`relative min-w-[56px] sm:min-w-[64px] min-h-[62px] sm:min-h-[68px] px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 font-black shadow-sm ring-4 ring-amber-300 scale-105 -translate-y-0.5 z-10'
                    : isPassed
                    ? 'bg-amber-50 text-amber-950 border border-amber-200 font-bold'
                    : isFinal
                    ? 'bg-stone-100 text-stone-900 border border-stone-200 font-black'
                    : 'bg-white text-stone-800 border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 font-extrabold shadow-2xs'
                }`}
              >
                <span className="text-xl sm:text-2xl leading-none font-black">
                  {step}
                </span>

                {roleLabel && (
                  <span
                    className={`text-[10px] mt-1 font-bold leading-none tracking-tight whitespace-nowrap ${
                      isActive ? 'text-stone-950 font-black' : 'text-stone-400'
                    }`}
                  >
                    {roleLabel}
                  </span>
                )}
              </button>

              {/* Dấu nối nhẹ nhàng giữa các bước */}
              {idx < formula.length - 1 && (
                <span className="text-stone-300 font-bold select-none text-base sm:text-lg px-0.5">
                  —
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
