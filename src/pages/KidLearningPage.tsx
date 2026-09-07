import React, { useState, useRef } from 'react';
import { Sparkles, PlusCircle, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { Token, ReadingMode } from '../types/index.ts';
import { tokenizeVietnameseText } from '../core/parser/vietnamesePhonics.ts';
import { AudioSpritePlayer } from '../core/audio/AudioSpritePlayer.ts';
import { audioManager } from '../core/audio/AudioManager.ts';
import { audioCacheService } from '../core/audio/AudioCacheService.ts';
import { spriteManager } from '../core/audio/SpriteManager.ts';
import { KidReaderBoard } from '../components/kid/KidReaderBoard.tsx';
import { KidControlBar } from '../components/shared/KidControlBar.tsx';
import { PhonicsBadgeModal } from '../components/kid/PhonicsBadgeModal.tsx';
import { OCRUploader } from '../components/OCRUploader.tsx';

export const GRADE1_LESSONS = [
  {
    id: 'lesson-1',
    title: 'Bài 1: Trường học của em',
    text: 'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ.',
    note: 'SGK Kết nối tri thức - Âm tr, kh, ch, v',
  },
  {
    id: 'lesson-2',
    title: 'Bài 2: Vè chim chích',
    text: 'Ve vẻ vè ve. Cái vè chim chích. Bắt sâu đầu cành. Giúp ích cho cây.',
    note: 'Thơ đồng dao - Luyện dấu thanh & âm ch, v',
  },
  {
    id: 'lesson-3',
    title: 'Bài 3: Bé ngoan chăm chỉ',
    text: 'Bé ngoan bé học chăm chỉ. Cô giáo khen bé hoa điểm mười.',
    note: 'Chủ đề trường lớp - Luyện vần oan, am, iêm',
  },
  {
    id: 'lesson-4',
    title: 'Bài 4: Luyện âm khó & vần tắc',
    text: 'Bé giặt khăn sạch. Chú vịt bơi nhanh. Bé gập khuỷu tay. Bắt con cá nhỏ.',
    note: 'Luyện âm tắc giặt, vịt, bắt và vần hiếm khuỷu tay',
  },
];

export const KidLearningPage: React.FC = () => {
  const [currentLesson, setCurrentLesson] = useState(GRADE1_LESSONS[0]);
  const [tokens, setTokens] = useState<Token[]>(() => tokenizeVietnameseText(GRADE1_LESSONS[0].text));
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [activeSubStepLabel, setActiveSubStepLabel] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('fluent');
  const [speed, setSpeed] = useState<number>(0.85);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);
  const [preparingInfo, setPreparingInfo] = useState<{ current: number; total: number; word: string } | null>(null);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const playbackControllerRef = useRef<{ stop: () => void } | null>(null);

  const handleClearAudioCache = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ âm thanh tải về trước đây để làm mới kho âm thanh theo chuẩn DSP mới nhất không?')) {
      handleStop();
      await audioCacheService.clear();
      spriteManager.clearDynamicBuffers();
      audioManager.playSuccessChime();
      setCacheMessage('Đã làm mới sạch kho âm! Các từ mới sẽ được xử lý DSP chất lượng cao nhất.');
      setTimeout(() => setCacheMessage(null), 4500);
    }
  };

  const handleSelectLesson = (lesson: typeof GRADE1_LESSONS[0]) => {
    handleStop();
    setCurrentLesson(lesson);
    setTokens(tokenizeVietnameseText(lesson.text));
    audioManager.playClickSound();
  };

  const handleStop = () => {
    if (playbackControllerRef.current) {
      playbackControllerRef.current.stop();
      playbackControllerRef.current = null;
    }
    setIsPlaying(false);
    setActiveWordIdx(-1);
    setActiveSubStepLabel('');
    setPreparingInfo(null);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    setIsPlaying(true);
    setActiveWordIdx(-1);
    setPreparingInfo(null);
    setSelectedToken(null);
    audioManager.playClickSound();

    const wordsData = tokens.map((t) => ({
      text: t.text,
      breakdown: t.phonics,
    }));

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
        (wIdx, _subIdx, subLabel) => {
          setPreparingInfo(null);
          setActiveWordIdx(wIdx);
          setActiveSubStepLabel(subLabel);
        },
        () => {
          setIsPlaying(false);
          setActiveWordIdx(-1);
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

  const handleTokenClick = (token: Token) => {
    handleStop();
    setSelectedToken(token);
    audioManager.playClickSound();
  };

  const handleOcrResult = (result: any) => {
    const text = result.sanitizedText || result.rawText;
    if (text) {
      const customLesson = {
        id: `custom-${Date.now()}`,
        title: 'Trang Sách Vừa Quét OCR',
        text,
        note: 'Bài đọc phụ huynh tải lên',
      };
      setCurrentLesson(customLesson);
      setTokens(tokenizeVietnameseText(text));
      setShowOcrModal(false);
      audioManager.playSuccessChime();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 p-4 sm:p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      {/* HEADER BÉ HỌC */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-lg shadow-amber-200/80">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bé Tập Đọc & Đánh Vần
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">
              Chuẩn SGK Tiếng Việt Lớp 1 (Kết Nối Tri Thức)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleClearAudioCache}
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            title="Xóa kho âm thanh cũ để nạp lại bản xử lý DSP chất lượng cao"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="hidden md:inline">Làm Mới Kho Âm</span>
          </button>

          <button
            onClick={() => setShowOcrModal(!showOcrModal)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quét Thêm Trang Sách (OCR)</span>
          </button>
        </div>
      </header>

      {/* THÔNG BÁO DỌN DẸP KHO ÂM THÀNH CÔNG */}
      {cacheMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cacheMessage}</span>
        </div>
      )}

      {/* MODAL QUÉT TRANG SÁCH OCR */}
      {showOcrModal && (
        <div className="p-4 bg-purple-50/60 rounded-3xl border-2 border-purple-200 animate-fadeIn">
          <OCRUploader onScanComplete={handleOcrResult} />
        </div>
      )}

      {/* DANH SÁCH 4 BÀI ĐỌC MẪU */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {GRADE1_LESSONS.map((lesson) => {
          const isSelected = currentLesson.id === lesson.id;
          return (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson)}
              className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer space-y-1 ${
                isSelected
                  ? 'bg-amber-100/80 border-amber-400 shadow-md ring-2 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                {lesson.title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-1">{lesson.text}</p>
            </button>
          );
        })}
      </div>

      {/* BẢNG ĐIỀU KHIỂN BÉ HỌC */}
      <KidControlBar
        isPlaying={isPlaying}
        readingMode={readingMode}
        speed={speed}
        onTogglePlay={handleTogglePlay}
        onReset={handleStop}
        onModeChange={(m) => {
          handleStop();
          setReadingMode(m);
        }}
        onSpeedChange={setSpeed}
      />

      {/* BANNER CHUẨN BỊ ÂM THANH KHI CÓ TỪ MỚI CẦN TẢI TỪ ZALO AI */}
      {preparingInfo && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="text-xs sm:text-sm font-black text-blue-900">
                Đang chuẩn bị âm thanh Zalo AI cho từ: <span className="underline decoration-blue-400">"{preparingInfo.word}"</span>
              </p>
              <p className="text-[11px] text-blue-600 font-medium">
                Ứng dụng đang tải giọng Nữ Bắc Ngọc Huyền và lưu vào máy ({preparingInfo.current}/{preparingInfo.total})...
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            {Math.round((preparingInfo.current / preparingInfo.total) * 100)}%
          </span>
        </div>
      )}

      {/* BẢNG BÀI ĐỌC TYPOGRAPHY LỚN */}
      <KidReaderBoard
        tokens={tokens}
        title={currentLesson.title}
        activeWordIndex={activeWordIdx}
        activeSubStepLabel={activeSubStepLabel}
        readingMode={readingMode}
        onTokenClick={handleTokenClick}
      />

      {/* POPUP BÓC TÁCH NGỮ ÂM 3 MÀU KHI CHẠM VÀO TỪ */}
      {selectedToken && (
        <PhonicsBadgeModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </div>
  );
};
