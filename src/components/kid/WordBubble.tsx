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
  // Nếu là dấu xuống dòng của bài thơ
  if (token.type === 'newline') {
    return <div className="w-full h-3 sm:h-5 basis-full block select-none" aria-hidden="true" />;
  }

  // Nếu là dấu câu hoặc khoảng trắng
  if (token.type === 'punctuation') {
    return (
      <span className="inline-block text-2xl sm:text-3xl md:text-4xl font-black text-slate-400 select-none mx-0.5 self-center">
        {token.text}
      </span>
    );
  }

  if (token.type === 'space') {
    return <span className="inline-block w-2 sm:w-3" />;
  }

  return (
    <div className="relative inline-block my-1.5 mx-1 group">
      {/* Sub-step tooltip khi đang đánh vần theo nhịp: thanh lịch, không rung lắc */}
      {isActive && readingMode === 'spelling' && subStepLabel && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-stone-900 text-amber-300 text-xs sm:text-sm font-black px-3 py-0.5 rounded-full shadow-md border border-stone-700 animate-fadeIn">
          {subStepLabel}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45" />
        </div>
      )}

      {/* Thẻ bong bóng chữ 1-chạm: Phong cách Thẻ Gỗ Nam Châm (Tactile Tile) */}
      <button
        type="button"
        onClick={() => onClick(token)}
        aria-label={`Từ ${token.text}, chạm để nghe đánh vần`}
        className={`relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-3xl text-2xl sm:text-3xl md:text-4xl font-black transition-all duration-150 cursor-pointer select-none min-h-[48px] ${
          isActive
            ? 'bg-amber-400 text-stone-950 border-2 border-amber-500 shadow-lg ring-4 ring-amber-200/80 scale-110 z-10'
            : 'bg-white text-stone-800 border-2 border-[#E7DEC8] hover:border-amber-400 hover:bg-amber-50/50 hover:-translate-y-0.5 shadow-2xs active:scale-95'
        }`}
        title="Chạm để nghe bóc tách ngữ âm"
      >
        <span>{token.text}</span>
      </button>
    </div>
  );
};
