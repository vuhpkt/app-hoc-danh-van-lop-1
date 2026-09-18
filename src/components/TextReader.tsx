import React from 'react';
import { Token, ReadingMode } from '../types';
import { BookOpen, Volume2, Sparkles } from 'lucide-react';

interface TextReaderProps {
  tokens: Token[];
  activeTokenId?: string;
  activeWordIndex?: number;
  activeSubStepLabel?: string;
  readingMode?: ReadingMode;
  onTokenClick?: (token: Token, index: number) => void;
  title?: string;
  subtitle?: string;
}

export const TextReader: React.FC<TextReaderProps> = ({
  tokens,
  activeTokenId,
  activeWordIndex,
  activeSubStepLabel,
  readingMode = 'fluent',
  onTokenClick,
  title = 'Bài Đọc Lớp 1 Chuẩn SGK',
  subtitle = 'Chạm vào bất kỳ từ nào để nghe đọc riêng hoặc xem đánh vần chi tiết',
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 relative overflow-visible transition-all">
      {/* Header bài đọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200/70 flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Tương tác 1-chạm (FR-09)</span>
          </span>
        </div>
      </div>

      {/* Vùng văn bản tương tác Karaoke 60fps */}
      <div className="min-h-[140px] flex flex-wrap items-center gap-x-2.5 gap-y-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide leading-relaxed p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
        {(() => {
          let syllableCount = -1;
          return tokens.map((token, index) => {
            if (token.type === 'newline') {
              return <div key={token.id} className="w-full h-3 sm:h-5 basis-full block select-none" aria-hidden="true" />;
            }
            if (token.type === 'punctuation') {
              return (
                <span key={token.id} className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-400 select-none self-center mx-0.5">
                  {token.text}
                </span>
              );
            }

            syllableCount++;
            const currentSyllableIdx = syllableCount;
            const isActive =
              (activeTokenId && token.id === activeTokenId) ||
              (activeWordIndex !== undefined && activeWordIndex === currentSyllableIdx);

            const isSpellingMode = readingMode === 'spelling';

          return (
            <div key={token.id} className="relative inline-block my-1">
              <button
                onClick={() => onTokenClick?.(token, index)}
                title={`Chạm để nghe: "${token.text}"`}
                className={`relative px-4 py-2 rounded-2xl transition-all duration-150 cursor-pointer select-none font-black ${
                  isActive
                    ? isSpellingMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110 shadow-xl shadow-blue-500/30 ring-4 ring-blue-300 -translate-y-1 z-20'
                      : 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 scale-110 shadow-xl shadow-amber-500/30 ring-4 ring-amber-200 -translate-y-1 z-20'
                    : 'text-slate-800 bg-white hover:bg-blue-50 hover:text-blue-600 shadow-xs border border-slate-200/60 active:scale-95'
                }`}
              >
                <span>{token.text}</span>

                {/* Khi active trong chế độ đánh vần: Hiển thị Floating Badge âm tiết đang phát */}
                {isActive && isSpellingMode && activeSubStepLabel && (
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5 animate-bounce whitespace-nowrap z-30">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>{activeSubStepLabel}</span>
                  </span>
                )}

                {/* Tooltip khi hover trên Desktop */}
                {!isActive && token.phonics && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-10">
                    {token.phonics.spellingFormulaText}
                  </span>
                )}
              </button>
            </div>
          );
        });
      })()}
      </div>

      {/* Footer gợi ý */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>Tổng số từ: <strong className="text-slate-700 font-bold">{tokens.length} từ</strong></span>
        <span>Chế độ: <strong className="text-blue-600 font-bold">{readingMode === 'fluent' ? '📖 Đọc trơn' : '🔤 Đánh vần chi tiết'}</strong></span>
      </div>
    </div>
  );
};
