import React from 'react';
import { Token } from '../types';
import { Sparkles } from 'lucide-react';

interface TextReaderProps {
  tokens: Token[];
  activeTokenId?: string;
  onTokenClick?: (token: Token) => void;
  title?: string;
}

export const TextReader: React.FC<TextReaderProps> = ({
  tokens,
  activeTokenId,
  onTokenClick,
  title = 'Bài Đọc Mẫu Lớp 1',
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200/60">
          Chạm vào từng từ để nghe đánh vần
        </span>
      </div>

      {/* Vùng văn bản tương tác */}
      <div className="leading-relaxed flex flex-wrap gap-x-3 gap-y-4 text-2xl md:text-3xl font-extrabold tracking-wide">
        {tokens.map((token) => {
          const isActive = token.id === activeTokenId;
          return (
            <button
              key={token.id}
              onClick={() => onTokenClick?.(token)}
              className={`px-3 py-1.5 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 scale-110 shadow-md ring-4 ring-amber-200 -translate-y-1'
                  : 'text-slate-800 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
              }`}
            >
              <span>{token.text}</span>

              {/* Tooltip nhỏ khi hover */}
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                {token.phonics?.spellingFormulaText || token.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
