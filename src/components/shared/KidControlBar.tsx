import React from 'react';
import { Play, Square, RotateCcw, Volume2, Sparkles, Rabbit, Snail } from 'lucide-react';
import { ReadingMode } from '../../types/index.ts';

interface KidControlBarProps {
  isPlaying: boolean;
  readingMode: ReadingMode;
  speed: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onModeChange: (mode: ReadingMode) => void;
  onSpeedChange: (speed: number) => void;
}

export const KidControlBar: React.FC<KidControlBarProps> = ({
  isPlaying,
  readingMode,
  speed,
  onTogglePlay,
  onReset,
  onModeChange,
  onSpeedChange,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-md border border-stone-200/90 flex flex-wrap items-center justify-between gap-3 transition-all">
      {/* 1. NÚT PLAY / DỪNG CHỦ ĐẠO */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base text-white shadow-sm transition-all cursor-pointer active:scale-95 ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 ring-2 ring-rose-200'
              : 'bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-200/80 hover:shadow-md'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>Dừng lại</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>Đọc cho bé nghe</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="p-2.5 sm:p-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-600 transition-all cursor-pointer active:scale-90"
          title="Đọc lại từ đầu"
          aria-label="Đọc lại từ đầu"
        >
          <RotateCcw className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* 2. CHỌN CHẾ ĐỘ: ĐỌC TRƠN / ĐÁNH VẦN (CAPSULE SWITCH) */}
      <div className="flex items-center bg-stone-100/90 p-1 rounded-xl sm:rounded-2xl border border-stone-200/70 text-xs font-bold">
        <button
          type="button"
          onClick={() => onModeChange('fluent')}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
            readingMode === 'fluent'
              ? 'bg-white text-stone-900 font-black shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-stone-600" />
          <span>Đọc trơn</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('spelling')}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
            readingMode === 'spelling'
              ? 'bg-white text-stone-900 font-black shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Đánh vần</span>
        </button>
      </div>

      {/* 3. TỐC ĐỘ: RÙA (CHẬM DỄ NGHE 0.6x) / THỎ (CHUẨN SGK 0.8x) */}
      <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl sm:rounded-2xl border border-stone-200/70 text-xs font-bold">
        <button
          type="button"
          onClick={() => onSpeedChange(0.6)}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
            speed <= 0.7
              ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          title="Đọc chậm cho bé mới học ghép vần (0.6x)"
        >
          <Snail className="w-3.5 h-3.5" />
          <span>Chậm</span>
        </button>

        <button
          type="button"
          onClick={() => onSpeedChange(0.8)}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
            speed > 0.7
              ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          title="Đọc tự nhiên chuẩn SGK Lớp 1 (0.8x)"
        >
          <Rabbit className="w-3.5 h-3.5" />
          <span>Chuẩn</span>
        </button>
      </div>
    </div>
  );
};
