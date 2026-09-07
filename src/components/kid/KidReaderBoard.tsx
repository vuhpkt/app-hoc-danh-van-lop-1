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
    <div className="bg-amber-50/60 rounded-3xl sm:rounded-[2.5rem] border-4 border-amber-200/90 p-6 sm:p-10 md:p-12 shadow-xl space-y-6 relative overflow-hidden">
      {/* Nền trang trí dễ thương cho bé */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Tiêu đề bài đọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-amber-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">
              Bé chạm vào bất kỳ từ nào để nghe bóc tách ngữ âm
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-800 bg-amber-100/90 px-3.5 py-1.5 rounded-full self-start sm:self-center border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
