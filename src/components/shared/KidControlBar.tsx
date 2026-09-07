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
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg border-2 border-slate-200 flex flex-wrap items-center justify-between gap-4">
      {/* 1. NÚT PLAY / PAUSE LỚN TRUNG TÂM */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl transition-all cursor-pointer active:scale-95 ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-200'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 ring-4 ring-emerald-200 hover:scale-105'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-5 h-5 fill-white" />
              <span>Dừng Lại</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-white" />
              <span>Bắt Đầu Đọc</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer active:scale-90"
          title="Đọc lại từ đầu"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* 2. CHỌN CHẾ ĐỘ: ĐỌC TRƠN / ĐÁNH VẦN */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => onModeChange('fluent')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            readingMode === 'fluent'
              ? 'bg-white text-blue-700 shadow-md scale-105'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Đọc Trơn Cả Câu</span>
        </button>

        <button
          onClick={() => onModeChange('spelling')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            readingMode === 'spelling'
              ? 'bg-white text-purple-700 shadow-md scale-105'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Đánh Vần Từng Từ</span>
        </button>
      </div>

      {/* 3. TỐC ĐỘ: RÙA (CHẬM DỄ NGHE) / THỎ (CHUẨN) */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider hidden md:inline">
          Tốc độ:
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onSpeedChange(0.7)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              speed < 0.85 ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Đọc chậm cho bé mới học (0.7x)"
          >
            <Snail className="w-4 h-4" />
            <span>Chậm</span>
          </button>

          <button
            onClick={() => onSpeedChange(0.9)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              speed >= 0.85 ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Đọc tự nhiên chuẩn SGK (0.9x)"
          >
            <Rabbit className="w-4 h-4" />
            <span>Chuẩn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
