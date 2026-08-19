import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { ReadingMode } from '../types';

interface ControlBarProps {
  mode: ReadingMode;
  onModeChange: (mode: ReadingMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  mode,
  onModeChange,
  isPlaying,
  onTogglePlay,
  onReset,
  speed,
  onSpeedChange,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Chọn Chế Độ Đọc */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chế độ:</span>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onModeChange('spelling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'spelling'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đánh vần
          </button>
          <button
            onClick={() => onModeChange('fluent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'fluent'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đọc trơn
          </button>
          <button
            onClick={() => onModeChange('interactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'interactive'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tương tác
          </button>
        </div>
      </div>

      {/* Điều khiển Phát / Dừng */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          title="Đọc lại từ đầu"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-md active:scale-95 transition-all ${
            isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu đọc</span>
            </>
          )}
        </button>
      </div>

      {/* Tốc độ đọc */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span>Tốc độ:</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="bg-slate-100 border-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value={0.75}>0.75x (Chậm)</option>
          <option value={1.0}>1.0x (Chuẩn)</option>
          <option value={1.25}>1.25x (Nhanh)</option>
        </select>
      </div>
    </div>
  );
};
