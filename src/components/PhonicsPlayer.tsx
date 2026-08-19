import React from 'react';
import { PhonicsBreakdown } from '../types';
import { Play, Sparkles, Volume2 } from 'lucide-react';

interface PhonicsPlayerProps {
  breakdown: PhonicsBreakdown;
  activeStepIndex?: number;
  onPlayStep?: (index: number) => void;
  onPlayAll?: () => void;
}

export const PhonicsPlayer: React.FC<PhonicsPlayerProps> = ({
  breakdown,
  activeStepIndex = -1,
  onPlayStep,
  onPlayAll,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
      {/* Tiêu đề & Từ gốc & Nút Đánh vần */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Từ đang phân tích
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200/60">
              SGK Kết Nối Tri Thức
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {breakdown.raw}
            </h2>
            {breakdown.baseWord && breakdown.baseWord !== breakdown.clean && (
              <span className="text-sm font-bold text-slate-400">
                (Thanh ngang: <span className="text-slate-600 font-extrabold">{breakdown.baseWord}</span>)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onPlayAll}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold px-5 py-3 rounded-2xl shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Đánh vần từng bước</span>
        </button>
      </div>

      {/* 1. KHỐI THẺ MÀU (BADGES): [ÂM ĐẦU] + [VẦN] + [THANH] */}
      <div>
        <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Thành phần cấu tạo tiếng (Badges)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Badge 1: Âm Đầu */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 hover:border-blue-400 rounded-3xl p-5 transition-all text-center relative overflow-hidden group">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider mb-2">
              <span>[ÂM ĐẦU]</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-blue-700 my-2 tracking-tight">
              {breakdown.initialConsonant || '∅'}
            </div>
            <div className="text-xs text-blue-600 font-bold">
              {breakdown.initialConsonant ? `Âm "${breakdown.initialConsonant}"` : 'Khuyết âm đầu'}
            </div>
          </div>

          {/* Badge 2: Vần Nguyên Vẹn */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-400 rounded-3xl p-5 transition-all text-center relative overflow-hidden group">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider mb-2">
              <span>[VẦN]</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-orange-700 my-2 tracking-tight">
              {breakdown.rime || '—'}
            </div>
            <div className="text-xs text-orange-600 font-bold">
              Vần nguyên vẹn "{breakdown.rime}"
            </div>
          </div>

          {/* Badge 3: Dấu Thanh */}
          <div className="bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-200 hover:border-rose-400 rounded-3xl p-5 transition-all text-center relative overflow-hidden group">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider mb-2">
              <span>[THANH]</span>
            </div>
            <div className="text-3xl md:text-4xl font-black text-rose-700 my-3 tracking-tight">
              {breakdown.toneName}
            </div>
            <div className="text-xs text-rose-600 font-bold">
              Thanh: {breakdown.tone}
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUY TRÌNH ĐÁNH VẦN TỪNG BƯỚC (SPELLING STEPS) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>[Quy trình đánh vần từng bước]:</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Bấm vào từng bước để nghe
          </span>
        </div>

        {/* Các chip công thức to rõ */}
        <div className="flex flex-wrap items-center gap-2.5 py-1">
          {breakdown.spellingFormula.map((step, idx) => {
            const isStepActive = activeStepIndex === idx;
            const isLast = idx === breakdown.spellingFormula.length - 1;

            return (
              <React.Fragment key={idx}>
                <button
                  onClick={() => onPlayStep?.(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-lg md:text-xl font-black transition-all duration-200 cursor-pointer ${
                    isStepActive
                      ? 'bg-amber-400 text-slate-950 scale-115 shadow-lg ring-4 ring-amber-200 -translate-y-1 z-10'
                      : isLast
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-105'
                      : 'bg-white text-slate-800 border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:scale-105 shadow-xs'
                  }`}
                >
                  {step}
                </button>
                {!isLast && (
                  <span className="text-slate-400 font-black text-lg px-0.5">
                    {idx === breakdown.spellingFormula.length - 2 ? '→' : '+'}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Chuỗi text công thức & Giải thích chi tiết */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-1.5">
          <div className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="text-slate-400 font-bold text-xs uppercase">Công thức:</span>
            <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg font-black text-base">
              {breakdown.spellingFormulaText}
            </code>
          </div>
          {breakdown.ruleDescription && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed pl-0.5">
              💡 {breakdown.ruleDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
