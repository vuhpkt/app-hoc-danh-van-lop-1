import React from 'react';
import { Token, ReadingMode } from '../../types/index.ts';

interface WordBubbleProps {
  token: Token;
  isActive: boolean;
  readingMode: ReadingMode;
  subStepLabel?: string;
  onClick: (token: Token) => void;
}

export const WordBubble: React.FC<WordBubbleProps> = ({
  token,
  isActive,
  readingMode,
  subStepLabel,
  onClick,
}) => {
  // Nếu là dấu câu hoặc khoảng trắng
  if (token.type === 'punctuation') {
    return (
      <span className="inline-block text-2xl sm:text-3xl md:text-4xl font-bold text-slate-500 select-none mr-1">
        {token.text}
      </span>
    );
  }

  if (token.type === 'space') {
    return <span className="inline-block w-2 sm:w-3" />;
  }

  return (
    <div className="relative inline-block my-1.5 mx-1 group">
      {/* Sub-step tooltip khi đang đánh vần theo nhịp */}
      {isActive && readingMode === 'spelling' && subStepLabel && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-purple-900 text-white text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-lg border border-purple-400 animate-bounce">
          {subStepLabel}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-900 rotate-45" />
        </div>
      )}

      {/* Thẻ bong bóng chữ 1-chạm */}
      <button
        onClick={() => onClick(token)}
        className={`relative px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl sm:rounded-3xl text-2xl sm:text-3xl md:text-4xl font-black transition-all duration-200 cursor-pointer select-none ${
          isActive
            ? 'bg-amber-400 text-slate-900 shadow-xl ring-4 ring-amber-200 scale-110 z-10'
            : 'bg-white text-slate-800 border-2 border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/50 hover:scale-105 shadow-sm active:scale-95'
        }`}
        title="Chạm để nghe bóc tách ngữ âm"
      >
        <span>{token.text}</span>
      </button>
    </div>
  );
};
