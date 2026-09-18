import React from 'react';
import { Volume2 } from 'lucide-react';
import { LetterItem } from '../../core/data/vietnameseAlphabet.ts';

interface LetterCardProps {
  letter: LetterItem;
  isPlaying: boolean;
  onClick: () => void;
}

export const LetterCard: React.FC<LetterCardProps> = React.memo(({ letter, isPlaying, onClick }) => {
  const isVowel = letter.type === 'vowel';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Chữ cái ${letter.uppercase}, phát âm ${letter.soundLabel}`}
      className={`
        relative group flex flex-col items-center justify-between p-3 rounded-2xl
        transition-all duration-150 select-none cursor-pointer outline-none
        min-w-[72px] min-h-[96px] sm:min-w-[88px] sm:min-h-[108px]
        focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
        ${
          isPlaying
            ? 'bg-amber-100 border-2 border-amber-500 shadow-[0_6px_0_#d97706] -translate-y-1 scale-105'
            : isVowel
            ? 'bg-amber-50/80 hover:bg-amber-100/90 border-2 border-amber-200/90 shadow-[0_4px_0_#fde68a] hover:shadow-[0_5px_0_#fcd34d] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
            : 'bg-sky-50/80 hover:bg-sky-100/90 border-2 border-sky-200/90 shadow-[0_4px_0_#bae6fd] hover:shadow-[0_5px_0_#7dd3fc] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
        }
      `}
    >
      {/* Vowel / Consonant Tag */}
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
          isVowel ? 'bg-amber-200/70 text-amber-800' : 'bg-sky-200/70 text-sky-800'
        }`}
      >
        {isVowel ? 'Nguyên âm' : 'Phụ âm'}
      </span>

      {/* Main Letters Display: A a */}
      <div className="flex items-baseline gap-1 my-1">
        <span
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isVowel ? 'text-amber-950' : 'text-sky-950'
          }`}
        >
          {letter.uppercase}
        </span>
        <span
          className={`text-2xl sm:text-3xl font-bold ${
            isVowel ? 'text-amber-800/80' : 'text-sky-800/80'
          }`}
        >
          {letter.lowercase}
        </span>
      </div>

      {/* Sound Label ("bờ", "cờ", "dờ"...) & Playing Icon */}
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
        ) : (
          <span className="text-xs sm:text-sm font-semibold text-stone-500 group-hover:text-stone-700">
            /{letter.soundLabel}/
          </span>
        )}
      </div>
    </button>
  );
});
