import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { Token, ReadingMode } from '../../types/index.ts';
import { WordBubble } from './WordBubble.tsx';

interface KidReaderBoardProps {
  tokens: Token[];
  title: string;
  activeWordIndex: number;
  activeSubStepLabel?: string;
  readingMode: ReadingMode;
  onTokenClick: (token: Token) => void;
}

export const KidReaderBoard: React.FC<KidReaderBoardProps> = ({
  tokens,
  title,
  activeWordIndex,
  activeSubStepLabel,
  readingMode,
  onTokenClick,
}) => {
  let wordCounter = -1;

  return (
    <div className="bg-[#FAF8F5] rounded-3xl sm:rounded-[2.25rem] border-2 sm:border-3 border-[#E7DEC8] p-5 sm:p-8 md:p-10 shadow-sm space-y-6 relative overflow-hidden transition-all">
      {/* Tiêu đề bài đọc: Trang nhã & Tối giản */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/90 text-stone-900 flex items-center justify-center font-black shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-bold mt-0.5">
              Bé chạm vào chữ bất kỳ để nghe đánh vần
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-black text-stone-600 bg-stone-100/80 px-3.5 py-1.5 rounded-full self-start sm:self-center border border-stone-200/80">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>SGK Tiếng Việt 1</span>
        </span>
      </div>

      {/* KHUNG BÀI ĐỌC CHÍNH VỚI TYPOGRAPHY LỚN DÀNH CHO BÉ 6 TUỔI */}
      <div className="leading-relaxed flex flex-wrap items-center content-start min-h-[220px]">
        {tokens.map((token) => {
          const isSyllable = token.type === 'syllable';
          if (isSyllable) {
            wordCounter++;
          }
          const currentWordIdx = wordCounter;
          const isActive = isSyllable && currentWordIdx === activeWordIndex;

          return (
            <WordBubble
              key={token.id}
              token={token}
              isActive={isActive}
              readingMode={readingMode}
              subStepLabel={isActive ? activeSubStepLabel : undefined}
              onClick={onTokenClick}
            />
          );
        })}
      </div>
    </div>
  );
};
