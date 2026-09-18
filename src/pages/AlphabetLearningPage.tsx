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

  // Phát âm âm ghép ("chờ", "gờ", "ngờ"...)
  const handlePlayCompound = async (spriteKey: string) => {
    spriteManager.stop();
    setActiveAudioKey(spriteKey);
    setActiveRimeFormula(null);

    try {
      await spriteManager.playAudioSegment(spriteKey);
    } catch (err) {
      console.warn('Lỗi phát âm âm ghép:', err);
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
              <span>Offline Master v4.4.0</span>
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
                    ? 'bg-amber-500 text-white shadow-[0_4px_0_#b45309] -translate-y-0.5'
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

        {/* TAB 1: 29 CHỮ CÁI (KHÔNG PHÂN CHIA NGUYÊN ÂM / PHỤ ÂM) */}
        {activeTab === 'letters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm text-stone-600 font-medium">
                Chạm vào chữ cái để nghe cô giáo phát âm chuẩn.
              </span>
              <span className="text-xs text-amber-800 font-bold bg-amber-100/70 px-2.5 py-1 rounded-full">
                29 Chữ Cái
              </span>
            </div>

            {/* Grid 29 Thẻ Chữ Cái Thống Nhất */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {ALPHABET_LETTERS.map((item) => (
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

        {/* TAB 2: 11 ÂM GHÉP (KHÔNG PHIÊN ÂM GẠCH CHÉO) */}
        {activeTab === 'compounds' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm text-stone-600 font-medium">
                11 âm ghép cơ bản trong tiếng Việt. Chạm vào chữ để nghe cô giáo phát âm.
              </p>
              <span className="text-xs text-amber-800 font-bold bg-amber-100/70 px-2.5 py-1 rounded-full">
                11 Âm Ghép
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {COMPOUND_CONSONANTS.map((comp) => {
                const isPlaying = activeAudioKey === comp.spriteKey;
                return (
                  <button
                    key={comp.consonant}
                    type="button"
                    onClick={() => handlePlayCompound(comp.spriteKey)}
                    aria-label={`Âm ghép ${comp.consonant}`}
                    className={`
                      relative group flex flex-col items-center justify-between p-4 rounded-3xl border-2 transition-all duration-150 select-none cursor-pointer outline-none min-h-[110px]
                      focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                      ${
                        isPlaying
                          ? 'bg-amber-100 border-amber-500 shadow-[0_6px_0_#d97706] -translate-y-1 scale-105'
                          : 'bg-[#FFFDF9] hover:bg-amber-50/70 border-[#F6EAD8] hover:border-amber-300 shadow-[0_4px_0_#F0DFCA] hover:shadow-[0_5px_0_#FCD34D] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                      }
                    `}
                  >
                    <div className="my-auto">
                      <span className={`text-4xl font-extrabold tracking-tight transition-colors ${
                        isPlaying ? 'text-amber-950' : 'text-stone-800 group-hover:text-amber-950'
                      }`}>
                        {comp.consonant}
                      </span>
                    </div>

                    <div className="flex items-center justify-center h-4 mt-2">
                      {isPlaying ? (
                        <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-500 transition-colors" />
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
