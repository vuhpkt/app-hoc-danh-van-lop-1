import React from 'react';
import { Play, Pause, RotateCcw, Volume2, BookOpen, Gauge, Layers } from 'lucide-react';
import { ReadingMode } from '../types';

interface ControlBarProps {
  mode: ReadingMode;
  onModeChange: (mode: ReadingMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentWordIndex?: number;
  totalWords?: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  mode,
  onModeChange,
  isPlaying,
  onTogglePlay,
  onReset,
  speed,
  onSpeedChange,
  currentWordIndex = -1,
  totalWords = 0,
}) => {
  const speedPresets = [
    { value: 0.3, label: '0.3x (Rất chậm)' },
    { value: 0.5, label: '0.5x (Chậm)' },
    { value: 0.7, label: '0.7x (Vừa)' },
    { value: 1.0, label: '1.0x (Chuẩn)' },
  ];

  const progressPercent = totalWords > 0 && currentWordIndex >= 0
    ? Math.round(((currentWordIndex + 1) / totalWords) * 100)
    : isPlaying
    ? 100
    : 0;

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 shadow-md border border-slate-200/80 space-y-4 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 1. Bộ Chuyển Chế Độ Đọc: Đọc Trơn ⟷ Đánh Vần */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider hidden sm:inline">
            Chế độ:
          </span>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto">
            <button
              onClick={() => onModeChange('fluent')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'fluent'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Đọc trơn cả câu</span>
            </button>
            <button
              onClick={() => onModeChange('spelling')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'spelling'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Đánh vần từng từ</span>
            </button>
          </div>
        </div>

        {/* 2. Cụm Nút Điều Khiển Trung Tâm (Play / Pause / Reset) */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onReset}
            title="Đọc lại từ đầu"
            className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-3 px-7 py-3.5 rounded-2xl font-black text-base text-white shadow-lg active:scale-95 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{currentWordIndex >= 0 ? 'Tiếp tục đọc' : 'Bắt đầu đọc'}</span>
              </>
            )}
          </button>
        </div>

        {/* 3. Bộ Chọn Tốc Độ Đọc */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Gauge className="w-4 h-4 text-slate-500" />
            <div className="flex items-center gap-1">
              {speedPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onSpeedChange(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    Math.abs(speed - preset.value) < 0.05
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {preset.value}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh tiến trình Karaoke */}
      {totalWords > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
              <span>
                {currentWordIndex >= 0
                  ? `Đang đọc từ: ${currentWordIndex + 1} / ${totalWords}`
                  : 'Sẵn sàng phát'}
              </span>
            </span>
            <span>{progressPercent}%</span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-200 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
