import React from 'react';
import { Sparkles, Volume2, ArrowRight } from 'lucide-react';
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
      <section
        data-testid="phonics-karaoke-stage-empty"
        className="bg-[#FFFDF9] rounded-3xl sm:rounded-[2rem] border-2 sm:border-3 border-[#EADFC7] p-4 sm:p-5 shadow-2xs text-center space-y-1.5 transition-all"
      >
        <div className="flex items-center justify-center gap-2 text-stone-500 font-bold text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Sân Khấu Đánh Vần (Karaoke Phonics)</span>
        </div>
        <p className="text-xs text-stone-400 font-medium">
          Bé chạm vào bất kỳ từ nào trong bài đọc để xem phân rã đánh vần từng bước nhé!
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="phonics-karaoke-stage"
      className="bg-[#FFFDF9] rounded-3xl sm:rounded-[2rem] border-2 sm:border-3 border-[#EADFC7] p-4 sm:p-5 shadow-sm space-y-3.5 transition-all relative overflow-hidden"
    >
      {/* THANH TIÊU ĐỀ SÂN KHẤU */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-2xs shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-black text-stone-800 uppercase tracking-wider block">
              Sân Khấu Đánh Vần
            </span>
            <span className="text-[10px] sm:text-[11px] text-stone-400 font-bold">
              SGK Tiếng Việt 1 • Karaoke từng bước
            </span>
          </div>
        </div>

        {/* NÚT TỪ TRỌNG TÂM ĐANG HỌC */}
        <button
          type="button"
          onClick={onReplayWord}
          title={`Bấm để nghe lại từ "${token.phonics?.clean || token.text}"`}
          className="inline-flex items-center gap-1.5 bg-amber-100/80 hover:bg-amber-200/90 text-amber-950 px-3 py-1 rounded-full text-xs font-black border border-amber-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
          <span>Từ:</span>
          <span className="text-sm font-black text-amber-900 underline decoration-amber-400 underline-offset-2">
            {token.phonics?.clean || token.text}
          </span>
        </button>
      </div>

      {/* CHUỖI THẺ BÀI PHÂN RÃ NGỮ ÂM MONTESSORI & HIỆU ỨNG KARAOKE */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 py-1">
        {formula.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isPassed = activeStepIndex > idx && activeStepIndex >= 0;
          const isFinal = idx === formula.length - 1;
          const roleLabel = getStepPedagogicalLabel(idx, formula.length, toneName);

          return (
            <React.Fragment key={`step-${idx}-${step}`}>
              {/* NÚT / THẺ BÀI BÓC TÁCH NGỮ ÂM */}
              <button
                type="button"
                data-testid={`phonics-tile-${idx}`}
                onClick={() => onStepClick?.(idx, step)}
                title={`Chạm để nghe riêng âm "${step}"`}
                className={`group relative min-w-[56px] sm:min-w-[68px] min-h-[62px] sm:min-h-[72px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-stone-950 font-black shadow-md border-2 sm:border-3 border-amber-600 ring-4 ring-amber-300/80 scale-110 -translate-y-1 z-10'
                    : isPassed
                    ? 'bg-amber-50/90 text-amber-950 border-2 border-amber-300/90 shadow-2xs hover:bg-amber-100/70'
                    : isFinal
                    ? 'bg-amber-100/60 text-stone-900 border-2 border-amber-300/80 hover:bg-amber-200/50 shadow-2xs font-black'
                    : 'bg-white text-stone-700 border-2 border-stone-200/90 hover:border-amber-300 hover:bg-amber-50/60 shadow-2xs font-extrabold'
                }`}
              >
                {/* CHỮ CHÍNH TRÊN THẺ */}
                <span
                  className={`text-xl sm:text-2xl leading-none transition-transform ${
                    isActive ? 'font-black scale-105' : 'font-black'
                  }`}
                >
                  {step}
                </span>

                {/* NHÃN PHỤ SƯ PHẠM TỐI GIẢN */}
                {roleLabel && (
                  <span
                    className={`text-[9px] sm:text-[10px] mt-1 font-bold leading-none tracking-tight whitespace-nowrap ${
                      isActive ? 'text-stone-950 font-black' : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  >
                    {roleLabel}
                  </span>
                )}

                {/* ICON LOA MINI KHI ĐANG PHÁT */}
                {isActive && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-xs animate-bounce">
                    <Volume2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>

              {/* DẤU MŨI TÊN KẾT NỐI GIỮA CÁC BƯỚC */}
              {idx < formula.length - 1 && (
                <div className="flex items-center justify-center text-stone-300 select-none px-0.5">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* DÒNG CHÚ THÍCH HƯỚNG DẪN 1-CHẠM DÀNH CHO BÉ */}
      <div className="text-center pt-0.5">
        <p className="text-[11px] text-stone-400 font-semibold">
          💡 Bé có thể chạm vào từng thẻ bài trên sân khấu để nghe lại mẩu âm riêng nhé!
        </p>
      </div>
    </section>
  );
};
