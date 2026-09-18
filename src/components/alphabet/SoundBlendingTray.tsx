import React, { useState } from 'react';
import { Volume2, Wand2, ArrowRight, RotateCcw } from 'lucide-react';
import {
  ALPHABET_LETTERS,
  COMPOUND_CONSONANTS,
  RIME_CATEGORIES,
  blendSoundWithPhonics
} from '../../core/data/vietnameseAlphabet.ts';
import { spriteManager } from '../../core/audio/SpriteManager.ts';

interface SoundBlendingTrayProps {
  onSpeed?: number;
}

// Danh sách gợi ý từ quen thuộc chuẩn SGK Lớp 1
const POPULAR_PRESETS = [
  { c: 'b', r: 'an', label: 'b + an = ban' },
  { c: 'c', r: 'a', label: 'c + a = ca' },
  { c: 'v', r: 'ui', label: 'v + ui = vui' },
  { c: 'm', r: 'e', label: 'm + e = me' },
  { c: 'ch', r: 'im', label: 'ch + im = chim' },
  { c: 'tr', r: 'ang', label: 'tr + ang = trang' },
  { c: 'kh', r: 'ang', label: 'kh + ang = khang' },
  { c: 'l', r: 'o', label: 'l + o = lo' },
];

// Danh sách tĩnh tối ưu hiệu năng (không tính lại mỗi lần render)
const SINGLE_CONSONANTS = ALPHABET_LETTERS.filter((l) => l.type === 'consonant').map((l) => ({
  val: l.letter,
  label: `${l.uppercase} (${l.soundLabel})`
}));
const COMPOUND_CONSONANTS_LIST = COMPOUND_CONSONANTS.map((c) => ({
  val: c.consonant,
  label: `${c.consonant} (${c.soundLabel})`
}));
const ALL_CONSONANTS = [...SINGLE_CONSONANTS, ...COMPOUND_CONSONANTS_LIST];
const ALL_RIMES = RIME_CATEGORIES.flatMap((c) => c.rimes);

export const SoundBlendingTray: React.FC<SoundBlendingTrayProps> = ({ onSpeed = 0.8 }) => {
  const [selectedConsonant, setSelectedConsonant] = useState<string>('b');
  const [selectedRime, setSelectedRime] = useState<string>('an');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  // Dọn dẹp âm thanh khi component unmount
  React.useEffect(() => {
    return () => {
      spriteManager.stop();
    };
  }, []);

  const blendResult = blendSoundWithPhonics(selectedConsonant, selectedRime);

  const handlePlayBlend = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStepIndex(0);

    try {
      await spriteManager.playPhonicsSequence(
        blendResult.audioSteps,
        onSpeed,
        (stepIdx) => {
          setActiveStepIndex(stepIdx);
        },
        () => {
          setIsPlaying(false);
          setActiveStepIndex(-1);
        }
      );
    } catch (err) {
      console.warn('Lỗi phát âm khay ghép:', err);
      setIsPlaying(false);
      setActiveStepIndex(-1);
    }
  };

  const handleReset = () => {
    spriteManager.stop();
    setIsPlaying(false);
    setActiveStepIndex(-1);
    setSelectedConsonant('b');
    setSelectedRime('an');
  };

  return (
    <div className="bg-gradient-to-b from-amber-50/90 to-stone-50/90 border-2 border-amber-200/90 rounded-3xl p-4 sm:p-6 shadow-[0_6px_0_#fde68a] mb-6 select-none">
      {/* Header Khay */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-amber-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-amber-600" />
            Khay Ghép Vần Tương Tác (Montessori Phonics Lab)
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
            Chọn 1 âm đầu + 1 vần để nghe cô giáo đánh vần bóc tách từng bước
          </p>
        </div>

        {/* Nút Đặt Lại */}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 bg-white/80 hover:bg-white border border-stone-200 shadow-sm active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Đặt lại
        </button>
      </div>

      {/* Preset Suggestions Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
        <span className="text-xs font-bold text-stone-500 whitespace-nowrap mr-1">
          Gợi ý nhanh:
        </span>
        {POPULAR_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={isPlaying}
            onClick={() => {
              setSelectedConsonant(p.c);
              setSelectedRime(p.r);
            }}
            className={`
              px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm
              ${isPlaying ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              ${
                selectedConsonant === p.c && selectedRime === p.r
                  ? 'bg-amber-500 text-amber-950 scale-105 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/90 text-stone-700 hover:bg-amber-100/70 border border-amber-200/60'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Magnetic Slots Display */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 my-4">
        {/* Slot 1: Âm Đầu */}
        <div className="flex flex-col items-center">
          <div
            className={`
              w-24 h-28 sm:w-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center
              border-2 transition-all duration-200 shadow-[0_4px_0_#bae6fd]
              ${
                isPlaying && activeStepIndex === 0
                  ? 'bg-sky-200 border-sky-500 scale-105 ring-4 ring-sky-300 animate-pulse'
                  : 'bg-sky-50/90 border-sky-300'
              }
            `}
          >
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              Âm Đầu
            </span>
            <span className="text-4xl sm:text-5xl font-black text-sky-950 tracking-tight">
              {selectedConsonant}
            </span>
          </div>

          <select
            value={selectedConsonant}
            disabled={isPlaying}
            onChange={(e) => setSelectedConsonant(e.target.value)}
            aria-label="Chọn âm đầu"
            className={`mt-2 text-xs font-bold px-2 py-1.5 rounded-xl border border-sky-300 bg-white shadow-sm text-sky-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              isPlaying ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {ALL_CONSONANTS.map((c) => (
              <option key={c.val} value={c.val}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-2xl font-black text-stone-400 self-center hidden md:inline">
          +
        </span>

        {/* Slot 2: Vần */}
        <div className="flex flex-col items-center">
          <div
            className={`
              w-24 h-28 sm:w-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center
              border-2 transition-all duration-200 shadow-[0_4px_0_#a7f3d0]
              ${
                isPlaying && activeStepIndex === 1
                  ? 'bg-emerald-200 border-emerald-500 scale-105 ring-4 ring-emerald-300 animate-pulse'
                  : 'bg-emerald-50/90 border-emerald-300'
              }
            `}
          >
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              Vần
            </span>
            <span className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
              {selectedRime}
            </span>
          </div>

          <select
            value={selectedRime}
            disabled={isPlaying}
            onChange={(e) => setSelectedRime(e.target.value)}
            aria-label="Chọn vần"
            className={`mt-2 text-xs font-bold px-2 py-1.5 rounded-xl border border-emerald-300 bg-white shadow-sm text-emerald-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 max-w-[130px] ${
              isPlaying ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {ALL_RIMES.map((r) => (
              <option key={r.rime} value={r.rime}>
                {r.rime} ({r.spellingFormula})
              </option>
            ))}
          </select>
        </div>

        <ArrowRight className="w-6 h-6 text-stone-400 hidden md:inline" />

        {/* Slot 3: Từ Kết Quả */}
        <div className="flex flex-col items-center">
          <div
            className={`
              w-32 h-28 sm:w-36 sm:h-32 rounded-2xl flex flex-col items-center justify-center
              border-2 transition-all duration-200 shadow-[0_4px_0_#fed7aa]
              ${
                isPlaying && activeStepIndex >= 2
                  ? 'bg-amber-200 border-amber-500 scale-105 ring-4 ring-amber-300 shadow-xl'
                  : 'bg-amber-50/90 border-amber-300'
              }
            `}
          >
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
              Tiếng Ghép
            </span>
            <span className="text-3xl sm:text-4xl font-black text-amber-950 tracking-tight">
              {blendResult.blendedWord}
            </span>
          </div>

          <span className="mt-2 text-xs font-semibold text-stone-500">
            {blendResult.blendedWordKey ? '✓ Có audio trọn vẹn' : '• Đánh vần ghép âm'}
          </span>
        </div>
      </div>

      {/* Action Button: Ghép Vần & Nghe Đọc */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={handlePlayBlend}
          disabled={isPlaying}
          className={`
            flex items-center gap-2.5 px-6 py-3 rounded-2xl text-base font-extrabold text-white
            shadow-[0_5px_0_#b45309] active:translate-y-1 active:shadow-none transition-all duration-150 cursor-pointer
            ${
              isPlaying
                ? 'bg-amber-400 cursor-not-allowed opacity-90'
                : 'bg-amber-500 hover:bg-amber-600'
            }
          `}
        >
          <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
          {isPlaying ? 'Đang đọc bóc tách...' : `Đánh vần "${blendResult.blendedWord}"`}
        </button>
      </div>
    </div>
  );
};
