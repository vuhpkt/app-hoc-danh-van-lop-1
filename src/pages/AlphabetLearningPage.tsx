import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import {
  ALPHABET_LETTERS,
  COMPOUND_CONSONANTS,
  RIME_CATEGORIES,
  LetterItem,
  RimeItem
} from '../core/data/vietnameseAlphabet.ts';
import { spriteManager } from '../core/audio/SpriteManager.ts';
import { LetterCard } from '../components/alphabet/LetterCard.tsx';
import { RimeCard } from '../components/alphabet/RimeCard.tsx';
import { SoundBlendingTray } from '../components/alphabet/SoundBlendingTray.tsx';

type AlphabetTab = 'letters' | 'compounds' | 'rimes';

export const AlphabetLearningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AlphabetTab>('letters');
  const [letterFilter, setLetterFilter] = useState<'all' | 'vowel' | 'consonant'>('all');
  const [selectedRimeCatId, setSelectedRimeCatId] = useState<string>('open_semivowel');

  // Trạng thái phát âm
  const [activeAudioKey, setActiveAudioKey] = useState<string | null>(null);
  const [activeRimeFormula, setActiveRimeFormula] = useState<{
    rimeKey: string;
    stepIndex: number | null;
  } | null>(null);

  // Nạp trước sprite khi vào trang
  useEffect(() => {
    spriteManager.loadSprite();
    return () => {
      spriteManager.stop();
    };
  }, []);

  // Dừng âm thanh khi chuyển tab
  const handleTabChange = (tab: AlphabetTab) => {
    spriteManager.stop();
    setActiveAudioKey(null);
    setActiveRimeFormula(null);
    setActiveTab(tab);
  };

  // Phát âm chữ cái (theo Âm: "bờ", "cờ", "dờ"...)
  const handlePlayLetter = async (letter: LetterItem) => {
    spriteManager.stop();
    setActiveAudioKey(letter.spriteKey);
    setActiveRimeFormula(null);

    try {
      await spriteManager.playAudioSegment(letter.spriteKey);
    } catch (err) {
      console.warn('Lỗi phát âm chữ cái:', err);
    } finally {
      setActiveAudioKey((prev) => (prev === letter.spriteKey ? null : prev));
    }
  };

  // Phát âm phụ âm ghép ("chờ", "trờ", "ngờ"...)
  const handlePlayCompound = async (spriteKey: string) => {
    spriteManager.stop();
    setActiveAudioKey(spriteKey);
    setActiveRimeFormula(null);

    try {
      await spriteManager.playAudioSegment(spriteKey);
    } catch (err) {
      console.warn('Lỗi phát âm phụ âm ghép:', err);
    } finally {
      setActiveAudioKey((prev) => (prev === spriteKey ? null : prev));
    }
  };

  // Phát đọc trơn vần ("ang", "an"...)
  const handlePlayRimeDirect = async (rime: RimeItem) => {
    spriteManager.stop();
    setActiveAudioKey(rime.spriteKey);
    setActiveRimeFormula(null);

    try {
      await spriteManager.playAudioSegment(rime.spriteKey);
    } catch (err) {
      console.warn('Lỗi đọc trơn vần:', err);
    } finally {
      setActiveAudioKey((prev) => (prev === rime.spriteKey ? null : prev));
    }
  };

  // Phát công thức đánh vần mẩu từng bước ("a - ngờ - ang")
  const handlePlayRimeFormula = async (rime: RimeItem) => {
    spriteManager.stop();
    setActiveAudioKey(rime.spriteKey);
    setActiveRimeFormula({ rimeKey: rime.spriteKey, stepIndex: 0 });

    try {
      await spriteManager.playPhonicsSequence(
        rime.spellingSteps,
        0.8,
        (stepIdx) => {
          setActiveRimeFormula((prev) =>
            prev?.rimeKey === rime.spriteKey ? { rimeKey: rime.spriteKey, stepIndex: stepIdx } : prev
          );
        },
        () => {
          setActiveAudioKey((prev) => (prev === rime.spriteKey ? null : prev));
          setActiveRimeFormula((prev) => (prev?.rimeKey === rime.spriteKey ? null : prev));
        }
      );
    } catch (err) {
      console.warn('Lỗi đánh vần mẩu:', err);
      setActiveAudioKey((prev) => (prev === rime.spriteKey ? null : prev));
      setActiveRimeFormula((prev) => (prev?.rimeKey === rime.spriteKey ? null : prev));
    }
  };

  // Lọc danh sách chữ cái
  const filteredLetters = ALPHABET_LETTERS.filter((l) => {
    if (letterFilter === 'vowel') return l.type === 'vowel';
    if (letterFilter === 'consonant') return l.type === 'consonant';
    return true;
  });

  const activeRimeCategory =
    RIME_CATEGORIES.find((c) => c.id === selectedRimeCatId) || RIME_CATEGORIES[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans pb-16 select-none">
      {/* Container Chính */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        {/* Banner Giới Thiệu & Điều Hướng Tab */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border-2 border-amber-200/80 shadow-[0_4px_0_#fde68a] mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-950 flex items-center gap-2">
                <span>🔤</span> Bảng Chữ Cái & Âm Vần Tiếng Việt
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
                Chuẩn ngữ âm SGK Lớp 1 (Bộ GD&ĐT) • Phát âm chuẩn theo Âm ("bờ", "cờ", "dờ")
              </p>
            </div>

            {/* Hint âm thanh 100% Offline */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-center">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Offline Master v4.3.0</span>
            </div>
          </div>

          {/* 3 Tab Điều Hướng Chuẩn Montessori */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleTabChange('letters')}
              className={`
                flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-sm
                ${
                  activeTab === 'letters'
                    ? 'bg-amber-500 text-white shadow-[0_4px_0_#b45309] -translate-y-0.5'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }
              `}
            >
              <span>Aa</span>
              <span className="hidden sm:inline">29 Chữ Cái</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('compounds')}
              className={`
                flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-sm
                ${
                  activeTab === 'compounds'
                    ? 'bg-sky-500 text-white shadow-[0_4px_0_#0369a1] -translate-y-0.5'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }
              `}
            >
              <span>ch</span>
              <span className="hidden sm:inline">11 Âm Ghép</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('rimes')}
              className={`
                flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-sm
                ${
                  activeTab === 'rimes'
                    ? 'bg-emerald-600 text-white shadow-[0_4px_0_#047857] -translate-y-0.5'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }
              `}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bảng Vần & Lab</span>
            </button>
          </div>
        </div>

        {/* TAB 1: 29 CHỮ CÁI ĐƠN */}
        {activeTab === 'letters' && (
          <div>
            {/* Bộ Lọc Nguyên Âm / Phụ Âm */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLetterFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    letterFilter === 'all'
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  Tất cả (29)
                </button>
                <button
                  type="button"
                  onClick={() => setLetterFilter('vowel')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    letterFilter === 'vowel'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Nguyên âm (12)
                </button>
                <button
                  type="button"
                  onClick={() => setLetterFilter('consonant')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    letterFilter === 'consonant'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  Phụ âm (17)
                </button>
              </div>

              <span className="text-xs text-stone-500 font-semibold hidden sm:inline">
                Chạm vào chữ cái để nghe phát âm
              </span>
            </div>

            {/* Grid 29 Thẻ Chữ Cái */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {filteredLetters.map((item) => (
                <LetterCard
                  key={item.letter}
                  letter={item}
                  isPlaying={activeAudioKey === item.spriteKey}
                  onClick={() => handlePlayLetter(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: 11 PHỤ ÂM GHÉP */}
        {activeTab === 'compounds' && (
          <div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-stone-600 font-medium">
                11 phụ âm ghép cơ bản trong tiếng Việt. Chạm vào để nghe cô giáo phát âm chuẩn.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {COMPOUND_CONSONANTS.map((comp) => {
                const isPlaying = activeAudioKey === comp.spriteKey;
                return (
                  <button
                    key={comp.consonant}
                    type="button"
                    onClick={() => handlePlayCompound(comp.spriteKey)}
                    aria-label={`Phụ âm ghép ${comp.consonant}, phát âm ${comp.soundLabel}`}
                    className={`
                      flex flex-col items-center justify-between p-4 rounded-3xl border-2 transition-all duration-150 select-none cursor-pointer outline-none min-h-[110px]
                      focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
                      ${
                        isPlaying
                          ? 'bg-sky-100 border-sky-500 shadow-[0_6px_0_#0284c7] -translate-y-1 scale-105'
                          : 'bg-sky-50/80 hover:bg-sky-100/90 border-sky-200 shadow-[0_4px_0_#bae6fd] hover:shadow-[0_5px_0_#7dd3fc] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                      }
                    `}
                  >
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider bg-sky-200/70 px-2 py-0.5 rounded-full">
                      Phụ âm ghép
                    </span>

                    <div className="my-2">
                      <span className="text-4xl font-extrabold text-sky-950 tracking-tight">
                        {comp.consonant}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isPlaying ? (
                        <Volume2 className="w-4 h-4 text-sky-600 animate-pulse" />
                      ) : (
                        <span className="text-sm font-bold text-stone-500">
                          /{comp.soundLabel}/
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BẢNG VẦN & KHAY GHÉP VẦN */}
        {activeTab === 'rimes' && (
          <div>
            {/* Khay Ghép Vần Tương Tác */}
            <SoundBlendingTray />

            {/* Bộ Chọn 4 Họ Vần */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {RIME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedRimeCatId(cat.id)}
                    className={`
                      px-3 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer
                      ${
                        selectedRimeCatId === cat.id
                          ? 'bg-emerald-700 text-white shadow-md -translate-y-0.5'
                          : 'bg-white text-stone-700 hover:bg-emerald-50 border border-emerald-200'
                      }
                    `}
                  >
                    {cat.name} ({cat.rimes.length})
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-1">
                {activeRimeCategory.description} • Bấm <span className="font-bold text-emerald-800">Ghép</span> để nghe chuỗi đánh vần mẩu.
              </p>
            </div>

            {/* Grid Thẻ Vần */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {activeRimeCategory.rimes.map((item) => {
                const isPlaying = activeAudioKey === item.spriteKey;
                const isFormulaPlaying =
                  activeRimeFormula?.rimeKey === item.spriteKey;

                return (
                  <RimeCard
                    key={item.rime}
                    rime={item}
                    isPlaying={isPlaying}
                    activeStepIndex={
                      isFormulaPlaying ? activeRimeFormula.stepIndex : null
                    }
                    onPlayRime={() => handlePlayRimeDirect(item)}
                    onPlayFormula={() => handlePlayRimeFormula(item)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
