import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Volume2,
  Camera,
  Play,
  Square,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Code,
  Gauge,
  Music,
  Activity,
  Radio,
  SlidersHorizontal,
  Headphones
} from 'lucide-react';
import { PhonicsBreakdown, Token, ReadingMode } from '../types';
import { parseVietnamesePhonics, tokenizeVietnameseText } from '../core/parser/vietnamesePhonics';
import { INITIAL_CONSONANTS, COMMON_RIMES, TONES } from '../core/parser/vietnameseRules';
import { audioManager } from '../core/audio/AudioManager';
import { webAudioEngine } from '../core/audio/WebAudioEngine';
import { spriteManager, SpriteManager } from '../core/audio/SpriteManager';
import { AudioSpritePlayer } from '../core/audio/AudioSpritePlayer';
import { PhonicsPlayer } from '../components/PhonicsPlayer';
import { TextReader } from '../components/TextReader';
import { ControlBar } from '../components/ControlBar';
import { OCRUploader } from '../components/OCRUploader';

type TabType = 'parser' | 'audio' | 'karaoke' | 'ocr';

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('parser');

  // --- State Tab 1: Test Parser ---
  const [inputWord, setInputWord] = useState<string>('trường');
  const [currentBreakdown, setCurrentBreakdown] = useState<PhonicsBreakdown>(() => parseVietnamesePhonics('trường'));
  const [parserStepActive, setParserStepActive] = useState<number>(-1);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);

  // Danh sách từ mẫu kiểm tra
  const sampleWords = [
    { word: 'trường', note: 'Âm đầu tr + vần ương + thanh huyền' },
    { word: 'nguyễn', note: 'Âm đầu ng + vần uyên + thanh ngã' },
    { word: 'uống', note: 'Khuyết âm đầu + vần uông + thanh sắc' },
    { word: 'khuỷu', note: 'Âm đầu kh + vần uyu + thanh hỏi' },
    { word: 'quang', note: 'Âm đầu qu + vần ang + thanh ngang' },
    { word: 'giặt', note: 'Âm đầu gi + vần ăt + thanh nặng' },
    { word: 'gìn', note: 'Âm đầu gi + rime in (chữ i kép)' },
    { word: 'quốc', note: 'Từ đặc biệt (qu + ôc + sắc)' },
    { word: 'yêu', note: 'Khuyết âm đầu + thanh ngang (đọc trơn)' },
    { word: 'áo', note: 'Khuyết âm đầu + ao + thanh sắc' },
  ];

  const handleSelectWord = (word: string) => {
    setInputWord(word);
    setCurrentBreakdown(parseVietnamesePhonics(word));
    setParserStepActive(-1);
    audioManager.playClickSound();
  };

  const handleInputChange = (text: string) => {
    setInputWord(text);
    if (text.trim()) {
      setCurrentBreakdown(parseVietnamesePhonics(text));
      setParserStepActive(-1);
    }
  };

  const handlePlayFormulaStep = (idx: number) => {
    setParserStepActive(idx);
    const stepLabel = currentBreakdown.spellingFormula[idx];
    if (useRealAudio) {
      spriteManager.playAudioSegment(stepLabel);
    } else {
      const isLast = idx === currentBreakdown.spellingFormula.length - 1;
      const isTone = stepLabel === currentBreakdown.toneName && currentBreakdown.tone !== 'ngang';
      const stepTone = isTone || isLast ? currentBreakdown.tone : 'ngang';
      webAudioEngine.playSyntheticTone(stepLabel, stepTone, 450, 1.0);
    }
  };

  const handlePlayFullBreakdown = () => {
    setParserStepActive(-1);
    AudioSpritePlayer.playSpellingSequence(
      currentBreakdown,
      audioSpeed,
      (idx) => setParserStepActive(idx),
      () => setParserStepActive(-1),
      useRealAudio
    );
  };

  // --- State Tab 2: Test Audio Engine ---
  const [audioInputWord, setAudioInputWord] = useState<string>('trường');
  const [audioBreakdown, setAudioBreakdown] = useState<PhonicsBreakdown>(() => parseVietnamesePhonics('trường'));
  const [audioActiveStepIdx, setAudioActiveStepIdx] = useState<number>(-1);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.8); // 0.3x -> 1.2x
  const [useRealAudio, setUseRealAudio] = useState<boolean>(true); // Toggle Real Sprite vs Mock Synth
  const [spriteLoaded, setSpriteLoaded] = useState<boolean>(false);
  const [activeSoundboardKey, setActiveSoundboardKey] = useState<string | null>(null);

  // Tự động nạp Audio Sprite khi khởi động
  useEffect(() => {
    spriteManager.loadSprite().then((loaded) => {
      setSpriteLoaded(loaded);
    });
  }, []);

  const handleAudioWordChange = (word: string) => {
    setAudioInputWord(word);
    if (word.trim()) {
      setAudioBreakdown(parseVietnamesePhonics(word));
      setAudioActiveStepIdx(-1);
    }
  };

  // Phát Đánh Vần
  const handlePlayAudioSpelling = () => {
    setIsAudioPlaying(true);
    setAudioActiveStepIdx(-1);

    AudioSpritePlayer.playSpellingSequence(
      audioBreakdown,
      audioSpeed,
      (idx) => setAudioActiveStepIdx(idx),
      () => {
        setIsAudioPlaying(false);
        setAudioActiveStepIdx(-1);
        audioManager.playSuccessChime();
      },
      useRealAudio
    );
  };

  // Phát Đọc Trơn
  const handlePlayAudioFluent = () => {
    setIsAudioPlaying(true);
    setAudioActiveStepIdx(-1);

    AudioSpritePlayer.playFluentWord(
      audioBreakdown,
      audioSpeed,
      () => {
        setIsAudioPlaying(false);
      },
      useRealAudio
    );
  };

  const handleStopAudio = () => {
    spriteManager.stop();
    webAudioEngine.stop();
    setIsAudioPlaying(false);
    setAudioActiveStepIdx(-1);
  };

  const playSoundboardItem = (label: string, tone: PhonicsBreakdown['tone'] = 'ngang') => {
    setActiveSoundboardKey(label);
    if (useRealAudio) {
      spriteManager.playAudioSegment(label);
    } else {
      webAudioEngine.playSyntheticTone(label, tone, 420, 1.0);
    }
    setTimeout(() => setActiveSoundboardKey(null), 350);
  };

  // --- State Tab 3: Test Karaoke ---
  const sampleReadingText = 'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây.';
  const [karaokeTokens, setKaraokeTokens] = useState<Token[]>(() => tokenizeVietnameseText(sampleReadingText));
  const [activeKaraokeTokenId, setActiveKaraokeTokenId] = useState<string | undefined>(undefined);
  const [isKaraokePlaying, setIsKaraokePlaying] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('spelling');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedKaraokeToken, setSelectedKaraokeToken] = useState<Token | null>(null);
  const karaokeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startKaraoke = () => {
    if (isKaraokePlaying) {
      if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
      setIsKaraokePlaying(false);
      return;
    }

    setIsKaraokePlaying(true);
    let currentIndex = 0;
    const intervalMs = Math.round(900 / playbackSpeed);

    if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);

    // Phát âm đầu tiên
    setActiveKaraokeTokenId(karaokeTokens[0]?.id);
    if (useRealAudio) {
      spriteManager.playAudioSegment(karaokeTokens[0]?.text || '');
    } else {
      webAudioEngine.playSyntheticTone(karaokeTokens[0]?.text || '', 'ngang', 300, 1.0);
    }

    karaokeTimerRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex < karaokeTokens.length) {
        const token = karaokeTokens[currentIndex];
        setActiveKaraokeTokenId(token.id);
        if (useRealAudio) {
          spriteManager.playAudioSegment(token.text);
        } else {
          const tone = token.phonics?.tone || 'ngang';
          webAudioEngine.playSyntheticTone(token.text, tone, 350, 1.0);
        }
      } else {
        if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
        setIsKaraokePlaying(false);
        audioManager.playSuccessChime();
      }
    }, intervalMs);
  };

  const resetKaraoke = () => {
    if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    spriteManager.stop();
    webAudioEngine.stop();
    setIsKaraokePlaying(false);
    setActiveKaraokeTokenId(undefined);
  };

  useEffect(() => {
    return () => {
      if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    };
  }, []);

  // --- State Tab 4: OCR Playground ---
  const [ocrTransferredText, setOcrTransferredText] = useState<string | null>(null);

  const calculatedGapMs = SpriteManager.calculateSilencePadding(audioSpeed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/40 to-slate-100 text-slate-900 pb-16">
      {/* Header chính */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-xl">
              A
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Học Đọc & Đánh Vần Tiếng Việt Lớp 1
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                  SGK Kết Nối Tri Thức
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                Mô-đun 3.2: Chunked Audio Sprite Loader & Web Audio Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spriteLoaded ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Audio Sprite (79 clips) Sẵn Sàng</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Đang nạp Audio Sprite...</span>
              </div>
            )}
          </div>
        </div>

        {/* Thanh Điều Hướng 4 Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-2 border-t border-slate-100 pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('parser')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'parser'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1. Test Parser (Phân tích Ngữ âm)</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'audio'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>2. Test Audio (Audio Sprite & Synth)</span>
            </button>

            <button
              onClick={() => setActiveTab('karaoke')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'karaoke'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>3. Test Karaoke (Đồng bộ đọc)</span>
            </button>

            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ocr'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>4. Test OCR (Trang sách)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ============================================================ */}
        {/* TAB 1: TEST PARSER */}
        {/* ============================================================ */}
        {activeTab === 'parser' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Thử nghiệm Phân tích Ngữ âm Tiếng Việt
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hỗ trợ đầy đủ các trường hợp: có âm đầu, khuyết âm đầu, âm ghép (tr, ng, ngh, kh, qu, gi), nguyên âm đôi, 6 thanh.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputWord}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Nhập từ tiếng Việt bất kỳ..."
                      className="pl-4 pr-9 py-2.5 bg-slate-50 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded-2xl text-base font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none w-56 md:w-64 transition-all"
                    />
                    {inputWord && (
                      <button
                        onClick={() => handleInputChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowJsonInspector(!showJsonInspector)}
                    title="Xem chi tiết JSON"
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      showJsonInspector
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Các ca kiểm thử tiêu biểu (SGK Lớp 1):
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {sampleWords.map(({ word, note }) => {
                    const isSelected = inputWord.toLowerCase() === word;
                    return (
                      <button
                        key={word}
                        onClick={() => handleSelectWord(word)}
                        title={note}
                        className={`px-3.5 py-2 rounded-2xl text-sm font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:scale-95'
                        }`}
                      >
                        <span>{word}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <PhonicsPlayer
              breakdown={currentBreakdown}
              activeStepIndex={parserStepActive}
              onPlayStep={handlePlayFormulaStep}
              onPlayAll={handlePlayFullBreakdown}
            />

            {showJsonInspector && (
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl animate-fadeIn space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-amber-400 font-bold">JSON Breakdown Output</span>
                  <span className="text-slate-400">parseVietnamesePhonics("{currentBreakdown.raw}")</span>
                </div>
                <pre className="overflow-x-auto leading-relaxed text-emerald-400">
                  {JSON.stringify(currentBreakdown, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: TEST AUDIO (AUDIO SPRITE & SYNTH) */}
        {/* ============================================================ */}
        {activeTab === 'audio' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Box Điều Khiển Kiểm Thử Âm Thanh */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mô-đun Web Audio Sprite Loader
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      Giọng Đọc Sư Phạm Chuẩn
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    Trình Phát Âm Thanh Sprite Đánh Vần
                  </h2>
                </div>

                {/* Switcher: Dùng Mock Synth ⟷ Dùng Audio Sprite Thật */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                  <button
                    onClick={() => setUseRealAudio(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !useRealAudio
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Mock Synth</span>
                  </button>
                  <button
                    onClick={() => setUseRealAudio(true)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      useRealAudio
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Audio Sprite Thật</span>
                  </button>
                </div>
              </div>

              {/* Input nhập từ để test audio */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Từ cần phát:</span>
                  <input
                    type="text"
                    value={audioInputWord}
                    onChange={(e) => handleAudioWordChange(e.target.value)}
                    placeholder="Nhập từ..."
                    className="px-4 py-2 bg-slate-50 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-xl text-base font-black text-slate-800 outline-none w-40 transition-all"
                  />
                </div>

                {/* Nút từ mẫu nhanh */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400">Chọn nhanh:</span>
                  {['trường', 'nguyễn', 'uống', 'khuỷu', 'quang', 'giặt', 'sách', 'hoa', 'bé', 'học'].map((w) => (
                    <button
                      key={w}
                      onClick={() => handleAudioWordChange(w)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        audioInputWord.toLowerCase() === w
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bảng Hiển thị Trạng Thái Phát Thời Gian Thực (Real-time Tracker) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${isAudioPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      Trạng thái phát thời gian thực:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      Nguồn: {useRealAudio ? '🎙️ Hoài My Neural (Sprite)' : '🎛️ Beep Synth'}
                    </span>

                    {isAudioPlaying ? (
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        Đang phát âm...
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                        Sẵn sàng
                      </span>
                    )}
                  </div>
                </div>

                {/* Chuỗi token đang phát tuần tự */}
                <div className="flex flex-wrap items-center gap-3 py-2">
                  {audioBreakdown.spellingFormula.map((step, idx) => {
                    const isStepActive = audioActiveStepIdx === idx;
                    const isLast = idx === audioBreakdown.spellingFormula.length - 1;
                    const resolvedKey = spriteManager.resolveSpriteKey(step);

                    return (
                      <React.Fragment key={idx}>
                        <div
                          className={`px-5 py-3 rounded-2xl text-xl font-black transition-all duration-150 border-2 relative group cursor-pointer ${
                            isStepActive
                              ? 'bg-amber-400 text-slate-950 border-amber-200 scale-120 shadow-xl shadow-amber-500/30 ring-4 ring-amber-300/50 -translate-y-1'
                              : isLast
                              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/50'
                              : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700/80'
                          }`}
                          onClick={() => {
                            if (useRealAudio) {
                              spriteManager.playAudioSegment(step);
                            } else {
                              webAudioEngine.playSyntheticTone(step, 'ngang', 400, 1.0);
                            }
                          }}
                        >
                          <span>{step}</span>
                          {resolvedKey && (
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow border border-slate-800">
                              key: {resolvedKey}
                            </span>
                          )}
                        </div>
                        {idx < audioBreakdown.spellingFormula.length - 1 && (
                          <span className="text-slate-500 font-black text-lg">→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-300 font-mono bg-slate-950/50 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    Công thức: <strong className="text-amber-300">{audioBreakdown.spellingFormulaText}</strong>
                  </span>
                  <span className="text-slate-400">
                    Toạ độ Sprite Map: <strong className="text-emerald-400">{audioBreakdown.spellingFormula.map((s) => spriteManager.resolveSpriteKey(s) || s).join(' ➔ ')}</strong>
                  </span>
                </div>
              </div>

              {/* Thanh Điều Khiển: Phát Đánh Vần, Phát Đọc Trơn, Stop, Slider Tốc độ */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayAudioSpelling}
                    disabled={isAudioPlaying}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-sm text-white shadow-md transition-all cursor-pointer ${
                      isAudioPlaying
                        ? 'bg-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-blue-500/20'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Phát Đánh Vần</span>
                  </button>

                  <button
                    onClick={handlePlayAudioFluent}
                    disabled={isAudioPlaying}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-sm text-white shadow-md transition-all cursor-pointer ${
                      isAudioPlaying
                        ? 'bg-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 shadow-emerald-500/20'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span>Phát Đọc Trơn</span>
                  </button>

                  <button
                    onClick={handleStopAudio}
                    title="Dừng âm thanh"
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-rose-600" />
                    <span>Dừng</span>
                  </button>
                </div>

                {/* Thanh Trượt Tốc Độ Chuẩn Sư Phạm (Khoảng lặng) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-600">Tốc độ:</span>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.1"
                      value={audioSpeed}
                      onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
                      className="w-28 md:w-32 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-black text-blue-700 w-10">
                      {audioSpeed.toFixed(1)}x
                    </span>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                    Khoảng nghỉ: {calculatedGapMs}ms (Giọng tự nhiên)
                  </span>
                </div>
              </div>
            </div>

            {/* Soundboard Bàn Phím Âm Thanh Thử Nghiệm Từng Ký Tự */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Bàn phím Âm Đầu */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    22 Âm Đầu (Hoài My Voice)
                  </h4>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">
                    Fade 3ms
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {INITIAL_CONSONANTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => playSoundboardItem(c, 'ngang')}
                      className={`p-2.5 rounded-xl text-center font-black text-sm transition-all cursor-pointer ${
                        activeSoundboardKey === c
                          ? 'bg-blue-600 text-white scale-105 shadow'
                          : 'bg-blue-50/70 text-blue-800 hover:bg-blue-100 active:scale-95'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Bàn phím Vần Thông Dụng */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600">
                    Vần Tiêu Biểu (Lớp 1)
                  </h4>
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md font-bold">
                    Nguyên vẹn
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {COMMON_RIMES.slice(0, 24).map((r) => (
                    <button
                      key={r}
                      onClick={() => playSoundboardItem(r, 'ngang')}
                      className={`p-2.5 rounded-xl text-center font-black text-sm transition-all cursor-pointer ${
                        activeSoundboardKey === r
                          ? 'bg-orange-500 text-white scale-105 shadow'
                          : 'bg-orange-50/70 text-orange-800 hover:bg-orange-100 active:scale-95'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Bàn phím 6 Dấu Thanh */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600">
                    6 Dấu Thanh (Hoài My Voice)
                  </h4>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold">
                    Thanh điệu
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.values(TONES).map((t) => (
                    <button
                      key={t.type}
                      onClick={() => playSoundboardItem(t.name, t.type)}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${
                        activeSoundboardKey === t.name
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-rose-50/70 text-rose-800 hover:bg-rose-100 active:scale-98'
                      }`}
                    >
                      <span>Thanh {t.name}</span>
                      <span className="font-mono text-base font-black px-2 py-0.5 bg-white/60 rounded">
                        {t.symbol || '—'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: TEST KARAOKE & TEXT READER */}
        {/* ============================================================ */}
        {activeTab === 'karaoke' && (
          <div className="space-y-6 animate-fadeIn">
            <ControlBar
              mode={readingMode}
              onModeChange={setReadingMode}
              isPlaying={isKaraokePlaying}
              onTogglePlay={startKaraoke}
              onReset={resetKaraoke}
              speed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />

            <TextReader
              tokens={karaokeTokens}
              activeTokenId={activeKaraokeTokenId}
              onTokenClick={(token) => {
                setSelectedKaraokeToken(token);
                if (token.phonics) {
                  setCurrentBreakdown(token.phonics);
                  if (useRealAudio) {
                    spriteManager.playAudioSegment(token.text);
                  } else {
                    const tone = token.phonics.tone || 'ngang';
                    webAudioEngine.playSyntheticTone(token.text, tone, 400, 1.0);
                  }
                }
              }}
              title="Bài Đọc 1: Trường Học Của Em"
            />

            {selectedKaraokeToken && selectedKaraokeToken.phonics && (
              <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-md animate-fadeIn space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Từ vừa chọn:
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      "{selectedKaraokeToken.text}"
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedKaraokeToken.phonics) {
                        AudioSpritePlayer.playSpellingSequence(
                          selectedKaraokeToken.phonics,
                          playbackSpeed,
                          () => {},
                          () => {},
                          useRealAudio
                        );
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe đánh vần</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-blue-50 p-2.5 rounded-xl font-bold text-blue-800">
                    Âm đầu: <span className="text-base font-black">{selectedKaraokeToken.phonics.initialConsonant || 'Khuyết'}</span>
                  </div>
                  <div className="bg-orange-50 p-2.5 rounded-xl font-bold text-orange-800">
                    Vần: <span className="text-base font-black">{selectedKaraokeToken.phonics.rime}</span>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-xl font-bold text-rose-800">
                    Dấu: <span className="text-base font-black">{selectedKaraokeToken.phonics.toneName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: TEST OCR */}
        {/* ============================================================ */}
        {activeTab === 'ocr' && (
          <div className="space-y-6 animate-fadeIn">
            <OCRUploader
              onScanComplete={(result) => {
                setOcrTransferredText(result.rawText);
              }}
            />

            {ocrTransferredText && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">Chuyển văn bản đã quét sang Bộ Đọc</h4>
                  <button
                    onClick={() => {
                      setKaraokeTokens(tokenizeVietnameseText(ocrTransferredText));
                      setActiveTab('karaoke');
                      audioManager.playClickSound();
                    }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-all cursor-pointer"
                  >
                    <span>Mở trong Tab Karaoke</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {ocrTransferredText}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
