import React from 'react';
import { Volume2 } from 'lucide-react';
import { LetterItem } from '../../core/data/vietnameseAlphabet.ts';

interface LetterCardProps {
  letter: LetterItem;
  isPlaying: boolean;
  onClick: () => void;
}

export const LetterCard: React.FC<LetterCardProps> = React.memo(({ letter, isPlaying, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Chữ cái ${letter.uppercase} ${letter.lowercase}`}
      className={`
        relative group flex flex-col items-center justify-between p-3.5 rounded-2xl
        transition-all duration-150 select-none cursor-pointer outline-none
        min-w-[72px] min-h-[96px] sm:min-w-[88px] sm:min-h-[104px]
        focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
        ${
          isPlaying
            ? 'bg-amber-100 border-2 border-amber-500 shadow-[0_6px_0_#d97706] -translate-y-1 scale-105'
            : 'bg-[#FFFDF9] hover:bg-amber-50/70 border-2 border-[#F6EAD8] hover:border-amber-300 shadow-[0_4px_0_#F0DFCA] hover:shadow-[0_5px_0_#FCD34D] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
        }
      `}
    >
      {/* Main Letters Display: A a */}
      <div className="flex items-baseline justify-center gap-1.5 my-auto">
        <span
          className={`text-3xl sm:text-4xl font-black tracking-tight transition-colors ${
            isPlaying ? 'text-amber-950' : 'text-stone-800 group-hover:text-amber-950'
          }`}
        >
          {letter.uppercase}
        </span>
        <span
          className={`text-2xl sm:text-3xl font-bold transition-colors ${
            isPlaying ? 'text-amber-800' : 'text-stone-600 group-hover:text-amber-800'
          }`}
        >
          {letter.lowercase}
        </span>
      </div>

      {/* Audio Playing / Speaker Affordance Icon */}
      <div className="flex items-center justify-center h-4 mt-1">
        {isPlaying ? (
          <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-500 transition-colors" />
        )}
      </div>
    </button>
  );
});
