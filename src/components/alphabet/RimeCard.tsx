import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { RimeItem } from '../../core/data/vietnameseAlphabet.ts';

interface RimeCardProps {
  rime: RimeItem;
  isPlaying: boolean;
  activeStepIndex: number | null; // 0, 1, 2... khi đang phát chuỗi bóc tách
  onPlayRime: () => void;
  onPlayFormula: () => void;
}

export const RimeCard: React.FC<RimeCardProps> = React.memo(({
  rime,
  isPlaying,
  activeStepIndex,
  onPlayRime,
  onPlayFormula
}) => {
  // Bóc tách công thức: "a - ngờ - ang" thành các mẩu để highlight từng bước
  const formulaParts = rime.spellingFormula.split(' - ');

  return (
    <div
      className={`
        relative flex flex-col justify-between p-3 rounded-2xl
        transition-all duration-150 select-none
        min-w-[110px] min-h-[110px] sm:min-w-[130px] sm:min-h-[120px]
        border-2 bg-emerald-50/70 border-emerald-200/90
        shadow-[0_4px_0_#a7f3d0] hover:shadow-[0_5px_0_#6ee7b7]
        ${isPlaying ? 'ring-2 ring-emerald-500 bg-emerald-100/90 -translate-y-0.5' : ''}
      `}
    >
      {/* Top Bar: Vần to + Nút nghe trơn */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={onPlayRime}
          title={`Bấm nghe vần "${rime.rime}"`}
          aria-label={`Vần ${rime.rime}, bấm để đọc trơn`}
          className="flex items-center gap-1.5 text-left group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-0.5"
        >
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 group-hover:text-emerald-700 tracking-tight">
            {rime.rime}
          </span>
          <Volume2 className="w-4 h-4 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Nút Đánh Vần Mẩu (Phát chuỗi bóc tách) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayFormula();
          }}
          title={`Đánh vần mẩu: ${rime.spellingFormula}`}
          aria-label={`Đánh vần mẩu vần ${rime.rime}`}
          className={`
            flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold
            transition-all duration-150 cursor-pointer shadow-sm active:scale-95 outline-none
            focus-visible:ring-2 focus-visible:ring-emerald-500
            ${
              isPlaying && activeStepIndex !== null
                ? 'bg-amber-400 text-amber-950 scale-105 shadow-md animate-pulse'
                : 'bg-emerald-200/70 text-emerald-900 hover:bg-emerald-300'
            }
          `}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ghép</span>
        </button>
      </div>

      {/* Bottom Bar: Hiển thị công thức đánh vần với Active Step Highlight */}
      <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-center flex-wrap gap-1">
        {formulaParts.map((part, idx) => {
          const isStepActive = isPlaying && activeStepIndex === idx;
          const isLastBlended = idx === formulaParts.length - 1;

          return (
            <React.Fragment key={`${rime.rime}-step-${idx}`}>
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-md font-semibold transition-all duration-150
                  ${
                    isStepActive
                      ? 'bg-amber-400 text-amber-950 font-bold scale-110 shadow-sm'
                      : isLastBlended
                      ? 'text-emerald-900 font-bold'
                      : 'text-stone-600'
                  }
                `}
              >
                {part}
              </span>
              {idx < formulaParts.length - 1 && (
                <span className="text-[10px] text-stone-400 font-bold">›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});
