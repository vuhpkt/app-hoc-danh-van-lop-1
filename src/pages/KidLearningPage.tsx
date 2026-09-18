import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PlusCircle, RefreshCw, Trash2, CheckCircle2, AlertCircle, Zap, Settings, BookOpen } from 'lucide-react';
import { Token, ReadingMode } from '../types/index.ts';
import { tokenizeVietnameseText } from '../core/parser/vietnamesePhonics.ts';
import { AudioSpritePlayer } from '../core/audio/AudioSpritePlayer.ts';
import { audioManager } from '../core/audio/AudioManager.ts';
import { audioCacheService } from '../core/audio/AudioCacheService.ts';
import { spriteManager } from '../core/audio/SpriteManager.ts';
import { LessonAudioSyncer, SyncProgressInfo } from '../core/audio/LessonAudioSyncer.ts';
import { GRADE1_LESSONS } from '../core/data/grade1Lessons.ts';
import { KidReaderBoard } from '../components/kid/KidReaderBoard.tsx';
import { KidControlBar } from '../components/shared/KidControlBar.tsx';
import { PhonicsBadgeModal } from '../components/kid/PhonicsBadgeModal.tsx';
import { PhonicsKaraokeStage } from '../components/kid/PhonicsKaraokeStage.tsx';
import { ParentLessonModal, CustomLessonData } from '../components/parent/ParentLessonModal.tsx';

export { GRADE1_LESSONS };

export const KidLearningPage: React.FC = () => {
  const [currentLesson, setCurrentLesson] = useState<{ id: string; title: string; text: string; note?: string }>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('tv1_active_lesson');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            typeof parsed.id === 'string' &&
            typeof parsed.title === 'string' &&
            typeof parsed.text === 'string' &&
            parsed.text.trim().length > 0
          ) {
            return parsed;
          }
        } catch {}
      }
    }
    return GRADE1_LESSONS[0];
  });

  const [tokens, setTokens] = useState<Token[]>(() => tokenizeVietnameseText(currentLesson.text));
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [activeSubStepIndex, setActiveSubStepIndex] = useState<number>(-1);
  const [activeSubStepLabel, setActiveSubStepLabel] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('fluent');
  const [speed, setSpeed] = useState<number>(0.8);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showParentModal, setShowParentModal] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [preparingInfo, setPreparingInfo] = useState<{ current: number; total: number; word: string } | null>(null);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  // Trạng thái kiểm tra & đồng bộ âm thanh bài học với kho gốc
  const [syncStatus, setSyncStatus] = useState<{
    isChecking: boolean;
    isSyncing: boolean;
    missingWords: string[];
    totalUnique: number;
    progress: SyncProgressInfo | null;
  }>({
    isChecking: false,
    isSyncing: false,
    missingWords: [],
    totalUnique: 0,
    progress: null,
  });

  const playbackControllerRef = useRef<{ stop: () => void } | null>(null);

  const handleStop = useCallback(() => {
    if (playbackControllerRef.current) {
      playbackControllerRef.current.stop();
      playbackControllerRef.current = null;
    }
    spriteManager.stop();
    setIsPlaying(false);
    setActiveWordIdx(-1);
    setActiveSubStepIndex(-1);
    setActiveSubStepLabel('');
    setPreparingInfo(null);
  }, []);

  // Nạp trước Audio Sprite Master vào RAM và dọn dẹp âm thanh khi rời màn hình
  useEffect(() => {
    spriteManager.loadSprite().catch((err) => {
      console.warn('Lỗi khi nạp Master Sprite:', err);
    });
    return () => {
      handleStop();
    };
  }, [handleStop]);

  // Tự động kiểm tra độ sẵn sàng âm thanh mỗi khi bài học thay đổi
  useEffect(() => {
    let cancelled = false;
    const checkAvailability = async () => {
      const words = LessonAudioSyncer.extractUniqueWords(currentLesson.text);
      if (words.length === 0) {
        if (!cancelled) setSyncStatus({ isChecking: false, isSyncing: false, missingWords: [], totalUnique: 0, progress: null });
        return;
      }
      setSyncStatus((prev) => ({ ...prev, isChecking: true }));
      const missing: string[] = [];
      for (const w of words) {
        const available = await LessonAudioSyncer.isWordAvailable(w);
        if (!available) missing.push(w);
      }
      if (!cancelled) {
        setSyncStatus({
          isChecking: false,
          isSyncing: false,
          missingWords: missing,
          totalUnique: words.length,
          progress: null,
        });
      }
    };
    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, [currentLesson.text]);

  const handleSyncLessonAudio = async () => {
    if (syncStatus.isSyncing || syncStatus.missingWords.length === 0) return;
    handleStop();
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, progress: null }));
    audioManager.playClickSound();

    try {
      await LessonAudioSyncer.syncLesson(currentLesson.text, (progress) => {
        setSyncStatus((prev) => ({ ...prev, progress }));
      });
      audioManager.playSuccessChime();

      // Cập nhật lại sau khi nạp xong
      const words = LessonAudioSyncer.extractUniqueWords(currentLesson.text);
      const remainingMissing: string[] = [];
      for (const w of words) {
        const available = await LessonAudioSyncer.isWordAvailable(w);
        if (!available) remainingMissing.push(w);
      }
      setSyncStatus({
        isChecking: false,
        isSyncing: false,
        missingWords: remainingMissing,
        totalUnique: words.length,
        progress: null,
      });
      setCacheMessage('Đã tải và sẵn sàng 100% âm thanh chất lượng cao cho bài đọc!');
      setTimeout(() => setCacheMessage(null), 4000);
    } catch (err) {
      console.error('Lỗi khi đồng bộ âm thanh bài học:', err);
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  const handleClearAudioCache = async () => {
    if (window.confirm('Bạn có muốn xóa dữ liệu âm thanh đã lưu để làm mới toàn bộ bài học không?')) {
      handleStop();
      await audioCacheService.clear();
      spriteManager.clearDynamicBuffers();
      audioManager.playSuccessChime();

      // Quét lại bài học hiện tại ngay sau khi làm mới
      const words = LessonAudioSyncer.extractUniqueWords(currentLesson.text);
      const missing: string[] = [];
      for (const w of words) {
        const available = await LessonAudioSyncer.isWordAvailable(w);
        if (!available) missing.push(w);
      }
      setSyncStatus({
        isChecking: false,
        isSyncing: false,
        missingWords: missing,
        totalUnique: words.length,
        progress: null,
      });
      setCacheMessage('Đã làm mới bộ nhớ âm thanh! Bạn có thể nhấn "Đồng Bộ Ngay" để nạp âm thanh mới.');
      setTimeout(() => setCacheMessage(null), 4500);
    }
  };

  const syllablesOnly = useMemo(() => tokens.filter((t) => t.type === 'syllable'), [tokens]);

  const currentStageToken = useMemo(() => {
    if (activeWordIdx >= 0 && activeWordIdx < syllablesOnly.length) {
      return syllablesOnly[activeWordIdx];
    }
    if (selectedToken) {
      return selectedToken;
    }
    return syllablesOnly[0] || null;
  }, [activeWordIdx, selectedToken, syllablesOnly]);

  const handleSelectLesson = (lesson: { id: string; title: string; text: string; note?: string }) => {
    handleStop();
    setSelectedToken(null);
    setCurrentLesson(lesson);
    setTokens(tokenizeVietnameseText(lesson.text));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tv1_active_lesson', JSON.stringify(lesson));
    }
    audioManager.playClickSound();
  };

  const handleSaveLesson = (lesson: CustomLessonData) => {
    handleStop();
    setSelectedToken(null);
    setCurrentLesson(lesson);
    setTokens(tokenizeVietnameseText(lesson.text));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tv1_active_lesson', JSON.stringify(lesson));
    }
    setCacheMessage(`Đã nạp bài học mới: "${lesson.title}". Sẵn sàng phát đọc và đánh vần!`);
    setTimeout(() => setCacheMessage(null), 4000);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    setIsPlaying(true);
    setActiveWordIdx(-1);
    setActiveSubStepIndex(-1);
    setActiveSubStepLabel('');
    setPreparingInfo(null);
    setSelectedToken(null);
    audioManager.playClickSound();

    const wordsData = AudioSpritePlayer.packageTokensForPlayback(tokens);

    if (readingMode === 'fluent') {
      // 1. Đọc trơn cả câu
      playbackControllerRef.current = AudioSpritePlayer.playSentenceFluent(
        wordsData,
        speed,
        (idx) => {
          setPreparingInfo(null);
          setActiveWordIdx(idx);
        },
        () => {
          setIsPlaying(false);
          setActiveWordIdx(-1);
          setActiveSubStepIndex(-1);
          setActiveSubStepLabel('');
          setPreparingInfo(null);
          audioManager.playSuccessChime();
        },
        true,
        (info) => {
          setPreparingInfo(info);
        }
      );
    } else {
      // 2. Đánh vần từng từ trong câu
      playbackControllerRef.current = AudioSpritePlayer.playSentenceSpelling(
        wordsData,
        speed,
        (wIdx, subIdx, subLabel) => {
          setPreparingInfo(null);
          setActiveWordIdx(wIdx);
          setActiveSubStepIndex(subIdx);
          setActiveSubStepLabel(subLabel);
        },
        () => {
          setIsPlaying(false);
          setActiveWordIdx(-1);
          setActiveSubStepIndex(-1);
          setActiveSubStepLabel('');
          setPreparingInfo(null);
          audioManager.playSuccessChime();
        },
        true,
        (info) => {
          setPreparingInfo(info);
        }
      );
    }
  };

  // Tương tác 1-chạm: Click vào từ lập tức dừng câu, highlight từ đó và phát ngay âm thanh
  const handleTokenClick = useCallback((token: Token) => {
    handleStop();
    setSelectedToken(token);

    const syllableIdx = syllablesOnly.findIndex((t) => t.id === token.id);
    if (syllableIdx !== -1) {
      setActiveWordIdx(syllableIdx);
    }

    if (token.phonics) {
      if (readingMode === 'fluent') {
        AudioSpritePlayer.playFluentWord(token.phonics, speed);
      } else {
        setIsPlaying(true);
        playbackControllerRef.current = AudioSpritePlayer.playSpellingSequence(
          token.phonics,
          speed,
          (subIdx) => {
            setActiveSubStepIndex(subIdx);
            const step = token.phonics?.spellingFormula[subIdx] || '';
            setActiveSubStepLabel(step);
          },
          () => {
            setIsPlaying(false);
            setActiveSubStepIndex(-1);
            setActiveSubStepLabel('');
          }
        );
      }
    } else {
      audioManager.playClickSound();
    }
  }, [handleStop, syllablesOnly, readingMode, speed]);

  // Tương tác 1-chạm trên sân khấu: Bé bấm vào từng mẩu âm để nghe lại mẩu âm riêng
  const handleStageStepClick = (stepIndex: number, stepLabel: string) => {
    handleStop();
    setActiveSubStepIndex(stepIndex);
    setActiveSubStepLabel(stepLabel);
    spriteManager.playAudioSegment(stepLabel).then(() => {
      setActiveSubStepIndex(-1);
      setActiveSubStepLabel('');
    });
  };

  // Bấm nút loa trên sân khấu để nghe lại toàn bộ công thức đánh vần của từ đang học
  const handleStageReplayWord = () => {
    if (!currentStageToken?.phonics) return;
    handleStop();
    setIsPlaying(true);

    const syllableIdx = syllablesOnly.findIndex((t) => t.id === currentStageToken.id);
    if (syllableIdx !== -1) {
      setActiveWordIdx(syllableIdx);
    }

    playbackControllerRef.current = AudioSpritePlayer.playSpellingSequence(
      currentStageToken.phonics,
      speed,
      (subIdx) => {
        setActiveSubStepIndex(subIdx);
        const step = currentStageToken.phonics?.spellingFormula[subIdx] || '';
        setActiveSubStepLabel(step);
      },
      () => {
        setIsPlaying(false);
        setActiveSubStepIndex(-1);
        setActiveSubStepLabel('');
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-5 max-w-4xl mx-auto transition-colors">
      {/* HEADER BÉ HỌC: THANH LỊCH & TỐI GIẢN */}
      <header className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-2xs">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Bé Tập Đọc & Đánh Vần
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-500 font-bold">
              SGK Tiếng Việt 1 • Kết Nối Tri Thức
            </p>
          </div>
        </div>

        {/* GÓC PHỤ HUYNH TINH GỌN */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowParentModal(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Dán văn bản hoặc chụp ảnh trang sách để nạp bài học mới"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nạp Bài Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Cài đặt & Dọn dẹp kho âm"
            aria-label="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* MENU CÀI ĐẶT PHỤ HUYNH THU GỌN */}
          {showSettingsMenu && (
            <div className="absolute right-0 top-12 z-30 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsMenu(false);
                  handleClearAudioCache();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-bold transition-all text-left cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Làm mới kho âm (Xóa cache)</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* THÔNG BÁO NHẸ NHÀNG KHI LÀM MỚI KHO ÂM */}
      {cacheMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-fadeIn shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cacheMessage}</span>
        </div>
      )}

      {/* MODAL NẠP BÀI DÁN CHỮ & OCR */}
      <ParentLessonModal
        isOpen={showParentModal}
        onClose={() => setShowParentModal(false)}
        onSaveLesson={handleSaveLesson}
        currentLessonTitle={currentLesson.title}
      />

      {/* THANH CHỌN BÀI ĐỌC DẠNG PILL CAROUSEL GỌN GÀNG */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none py-1">
        {!GRADE1_LESSONS.some((l) => l.id === currentLesson.id) && (
          <button
            type="button"
            onClick={() => handleSelectLesson(currentLesson)}
            className="px-3.5 py-1.5 rounded-full text-xs font-black border-2 border-amber-500 bg-amber-500 text-white shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>✏️ {currentLesson.title}</span>
          </button>
        )}

        {GRADE1_LESSONS.map((lesson) => {
          const isSelected = currentLesson.id === lesson.id;
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => handleSelectLesson(lesson)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-400 text-stone-950 border-2 border-amber-500 font-black shadow-2xs scale-105'
                  : 'bg-white text-stone-600 border border-stone-200/80 font-bold hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              {lesson.title}
            </button>
          );
        })}
      </div>

      {/* VI THÔNG BÁO ĐỒNG BỘ ÂM THANH (TINH TẾ, KHÔNG THUẬT NGỮ RỐI RẮM) */}
      {syncStatus.isSyncing ? (
        <div className="flex items-center justify-between gap-3 p-3 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Đang chuẩn bị giọng đọc cho bài: "{syncStatus.progress?.word || '...'}"</span>
          </div>
          <span className="font-black text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
            {syncStatus.progress?.percent || 0}%
          </span>
        </div>
      ) : syncStatus.missingWords.length > 0 ? (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-stone-800 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bài học có {syncStatus.missingWords.length} từ mới cần chuẩn bị giọng đọc</span>
          </div>
          <button
            type="button"
            onClick={handleSyncLessonAudio}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Chuẩn bị giọng đọc</span>
          </button>
        </div>
      ) : null}

      {/* VI THÔNG BÁO KHI ĐANG PHÁT MÀ CẦN TẢI TỪ MỚI */}
      {preparingInfo && (
        <div className="flex items-center justify-between gap-3 p-3 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Đang chuẩn bị từ: "{preparingInfo.word}"...</span>
          </div>
          <span className="font-black text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
            {Math.round((preparingInfo.current / preparingInfo.total) * 100)}%
          </span>
        </div>
      )}

      {/* SÂN KHẤU ĐÁNH VẦN KARAOKE (OPTION 1: PHÍA TRÊN BÀI ĐỌC) */}
      {readingMode === 'spelling' && (
        <PhonicsKaraokeStage
          token={currentStageToken}
          activeStepIndex={activeSubStepIndex}
          activeStepLabel={activeSubStepLabel}
          isPlaying={isPlaying}
          onStepClick={handleStageStepClick}
          onReplayWord={handleStageReplayWord}
        />
      )}

      {/* BẢNG BÀI ĐỌC (TRANG SÁCH GIẤY NGÀ ẤM ÁP) */}
      <KidReaderBoard
        tokens={tokens}
        title={currentLesson.title}
        activeWordIndex={activeWordIdx}
        activeSubStepLabel={activeSubStepLabel}
        readingMode={readingMode}
        onTokenClick={handleTokenClick}
      />

      {/* BẢNG ĐIỀU KHIỂN NỔI SIÊU GỌN (FLOATING CONTROL DOCK) */}
      <KidControlBar
        isPlaying={isPlaying}
        readingMode={readingMode}
        speed={speed}
        onTogglePlay={handleTogglePlay}
        onReset={handleStop}
        onModeChange={(m) => {
          handleStop();
          setSelectedToken(null);
          setReadingMode(m);
        }}
        onSpeedChange={setSpeed}
      />

      {/* POPUP BÓC TÁCH NGỮ ÂM KHI CHẠM VÀO TỪ TRONG CHẾ ĐỘ ĐỌC TRƠN */}
      {readingMode === 'fluent' && selectedToken && (
        <PhonicsBadgeModal
          token={selectedToken}
          speed={speed}
          onClose={() => {
            setSelectedToken(null);
            setActiveWordIdx(-1);
            setActiveSubStepLabel('');
          }}
        />
      )}
    </div>
  );
};
