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
  Headphones,
  Edit3,
  CloudDownload,
  AlertCircle
} from 'lucide-react';
import { PhonicsBreakdown, Token, ReadingMode } from '../types';
import { parseVietnamesePhonics, tokenizeVietnameseText } from '../core/parser/vietnamesePhonics';
import { audioManager } from '../core/audio/AudioManager';
import { webAudioEngine } from '../core/audio/WebAudioEngine';
import { spriteManager, SpriteManager } from '../core/audio/SpriteManager';
import { AudioSpritePlayer } from '../core/audio/AudioSpritePlayer';
import { LessonAudioSyncer, SyncProgressInfo } from '../core/audio/LessonAudioSyncer';
import { PhonicsPlayer } from '../components/PhonicsPlayer';
import { TextReader } from '../components/TextReader';
import { ControlBar } from '../components/ControlBar';
import { OCRUploader } from '../components/OCRUploader';

type TabType = 'parser' | 'audio' | 'karaoke' | 'ocr';

const SAMPLE_POEMS = [
  {
    id: 'poem-1',
    title: 'Bài 1: Trường học của em',
    text: 'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ.',
    note: 'SGK Kết nối tri thức - Âm tr, kh, ch, v',
  },
  {
    id: 'poem-2',
    title: 'Bài 2: Vè chim chích',
    text: 'Ve vẻ vè ve. Cái vè chim chích. Bắt sâu đầu cành. Giúp ích cho cây.',
    note: 'Thơ đồng dao ngắn - Luyện dấu thanh & âm ch, v',
  },
  {
    id: 'poem-3',
    title: 'Bài 3: Bé ngoan chăm chỉ',
    text: 'Bé ngoan bé học chăm chỉ. Cô giáo khen bé hoa điểm mười.',
    note: 'Chủ đề trường lớp - Luyện vần oan, am, iêm',
  },
  {
    id: 'poem-4',
    title: 'Bài 4: Luyện âm khó & vần tắc',
    text: 'Bé giặt khăn sạch. Chú vịt bơi nhanh. Bé gập khuỷu tay. Bắt con cá nhỏ.',
    note: 'Luyện âm tắc giặt, vịt, bắt và vần hiếm khuỷu tay',
  },
];

// Danh sách từ mẫu kiểm tra toàn diện mọi quy tắc sư phạm Lớp 1
export const TEST_CORE_WORDS = [
  { word: 'giặt', note: 'Khép tắc + Nặng (gi - ắt - giắt - nặng - giặt)' },
  { word: 'học', note: 'Khép tắc + Nặng (h - óc - hóc - nặng - học)' },
  { word: 'vịt', note: 'Khép tắc + Nặng (v - ít - vít - nặng - vịt)' },
  { word: 'mặt', note: 'Khép tắc + Nặng (m - ắt - mắt - nặng - mặt)' },
  { word: 'quạt', note: 'Khép tắc + Nặng (qu - át - quát - nặng - quạt)' },
  { word: 'chuột', note: 'Khép tắc + Nặng (ch - uốt - chuốt - nặng - chuột)' },
  { word: 'bắt', note: 'Khép tắc + Sắc (b - ắt - bắt, 3 bước)' },
  { word: 'quốc', note: 'Khép tắc + Sắc (qu - ốc - quốc, 3 bước)' },
  { word: 'sách', note: 'Khép tắc + Sắc (s - ách - sách, 3 bước)' },
  { word: 'khuỷu', note: 'Vần hiếm uyu (kh - uyu - khuỷu)' },
  { word: 'trường', note: 'Âm ghép tr + vần ương + huyền' },
  { word: 'nguyễn', note: 'Âm ghép ng + vần uyên + ngã' },
  { word: 'uống', note: 'Khuyết âm đầu + uông + sắc' },
  { word: 'ít', note: 'Khuyết âm đầu khép tắc (đọc trơn)' },
  { word: 'hoa', note: 'Âm đầu h + vần oa + ngang' },
  { word: 'bé', note: 'Âm đầu b + vần e + sắc' },
];

// Bảng dữ liệu âm thanh 225 Clips Zalo AI
export const SB_INITIALS = [
  'b', 'c', 'ch', 'd', 'đ', 'g', 'gh', 'gi', 'h', 'k', 'kh', 
  'l', 'm', 'n', 'ng', 'ngh', 'nh', 'p', 'ph', 'qu', 'r', 
  's', 't', 'th', 'tr', 'v', 'x'
];

export const SB_CHECKED_RIMES = [
  // Tận cùng t (18 vần)
  'ắt', 'ất', 'ét', 'ết', 'ít', 'ót', 'ốt', 'ớt', 'út', 'ứt', 
  'iết', 'uốt', 'ướt', 'oát', 'oắt', 'uất', 'uyết', 'uýt',
  // Tận cùng c (14 vần)
  'ác', 'ắc', 'ấc', 'éc', 'ếc', 'óc', 'ốc', 'úc', 'ức', 
  'iếc', 'uốc', 'ước', 'oác', 'oắc',
  // Tận cùng ch (5 vần)
  'ách', 'ếch', 'ích', 'oách', 'uých',
  // Tận cùng p (13 vần)
  'áp', 'ắp', 'ấp', 'ép', 'ếp', 'íp', 'óp', 'ốp', 'ớp', 'úp', 
  'iếp', 'uốp', 'ướp'
];

export const SB_OPEN_NASAL_RIMES = [
  // Vần đơn & nguyên âm đôi
  'a', 'ă', 'â', 'e', 'ê', 'i', 'y', 'o', 'ô', 'ơ', 'u', 'ư', 'ia', 'ya', 'iê', 'yê', 'ua', 'uô', 'ưa', 'ươ',
  // Vần bán âm
  'ai', 'ay', 'ây', 'ao', 'au', 'âu', 'eo', 'êu', 'iu', 'oi', 'ôi', 'ơi', 'ui', 'ưi', 'oai', 'oay', 'uôi', 'ươi', 'ươu', 
  // Vần hiếm đặc biệt
  'uyu',
  // Vần mũi
  'am', 'ăm', 'âm', 'em', 'êm', 'im', 'om', 'ôm', 'ơm', 'um', 'ươm', 'iêm', 'yêm', 'uôm',
  'an', 'ăn', 'ân', 'en', 'ên', 'in', 'on', 'ôn', 'ơn', 'un', 'ưn', 'oan', 'oăn', 'uân', 'uôn', 'ươn', 'iên', 'yên', 'uyên',
  'ang', 'ăng', 'âng', 'eng', 'oang', 'oăng', 'uông', 'ương', 'iêng', 'yêng', 'anh', 'ênh', 'inh', 'oanh', 'uynh'
];

export const SB_TONES = [
  { name: 'ngang', label: 'Không dấu (Ngang)', symbol: '—', desc: 'Thanh bằng phẳng' },
  { name: 'huyền', label: 'Thanh Huyền', symbol: '`', desc: 'Giáng nhẹ' },
  { name: 'sắc', label: 'Thanh Sắc', symbol: '´', desc: 'Vút lên cao' },
  { name: 'hỏi', label: 'Thanh Hỏi', symbol: '?', desc: 'Xuống rồi lên' },
  { name: 'ngã', label: 'Thanh Ngã', symbol: '~', desc: 'Lên cao có gãy' },
  { name: 'nặng', label: 'Thanh Nặng', symbol: '.', desc: 'Xuống thấp nghẽn' },
];

export const SB_INTERMEDIATES_AND_WORDS = [
  // Tiếng đệm sắc cho từ khép tắc thanh nặng
  { label: 'giắt (đệm sắc)', token: 'giắt', type: 'diem' },
  { label: 'hóc (đệm sắc)', token: 'hóc', type: 'diem' },
  { label: 'vít (đệm sắc)', token: 'vít', type: 'diem' },
  { label: 'mắt (đệm sắc)', token: 'mắt', type: 'diem' },
  { label: 'quát (đệm sắc)', token: 'quát', type: 'diem' },
  { label: 'chuốt (đệm sắc)', token: 'chuốt', type: 'diem' },
  // Từ đích mẫu
  { label: 'giặt', token: 'giặt', type: 'word' },
  { label: 'học', token: 'học', type: 'word' },
  { label: 'vịt', token: 'vịt', type: 'word' },
  { label: 'mặt', token: 'mặt', type: 'word' },
  { label: 'quạt', token: 'quạt', type: 'word' },
  { label: 'chuột', token: 'chuột', type: 'word' },
  { label: 'bắt', token: 'bắt', type: 'word' },
  { label: 'quốc', token: 'quốc', type: 'word' },
  { label: 'sách', token: 'sách', type: 'word' },
  { label: 'khuỷu', token: 'khuỷu', type: 'word' },
  { label: 'chim', token: 'chim', type: 'word' },
  { label: 'hoa', token: 'hoa', type: 'word' },
  { label: 'bé', token: 'bé', type: 'word' },
  { label: 'mẹ', token: 'mẹ', type: 'word' },
  { label: 'bạn', token: 'bạn', type: 'word' },
  { label: 'trường', token: 'trường', type: 'word' },
];

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('audio'); // Mặc định mở tab audio để người dùng test ngay

  // --- State Tab 1: Test Parser ---
  const [inputWord, setInputWord] = useState<string>('giặt');
  const [currentBreakdown, setCurrentBreakdown] = useState<PhonicsBreakdown>(() => parseVietnamesePhonics('giặt'));
  const [parserStepActive, setParserStepActive] = useState<number>(-1);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);

  const sampleWords = TEST_CORE_WORDS;


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
  const [audioInputWord, setAudioInputWord] = useState<string>('giặt');
  const [audioBreakdown, setAudioBreakdown] = useState<PhonicsBreakdown>(() => parseVietnamesePhonics('giặt'));
  const [audioActiveStepIdx, setAudioActiveStepIdx] = useState<number>(-1);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.8); // 0.3x -> 1.0x
  const [useRealAudio, setUseRealAudio] = useState<boolean>(true); // Toggle Real Sprite vs Mock Synth
  const [spriteLoaded, setSpriteLoaded] = useState<boolean>(false);
  const [activeSoundboardKey, setActiveSoundboardKey] = useState<string | null>(null);
  const [soundboardTab, setSoundboardTab] = useState<'initial' | 'checked_rime' | 'open_nasal_rime' | 'tones' | 'words_diem'>('checked_rime');

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

  // ============================================================
  // STATE TAB 3: TEST KARAOKE & TEXT READER HIGHLIGHT (BƯỚC 4)
  // ============================================================
  const [karaokeRawText, setKaraokeRawText] = useState<string>(SAMPLE_POEMS[0].text);
  const [karaokeTitle, setKaraokeTitle] = useState<string>(SAMPLE_POEMS[0].title);
  const [karaokeTokens, setKaraokeTokens] = useState<Token[]>(() => tokenizeVietnameseText(SAMPLE_POEMS[0].text));
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [activeSubStepLabel, setActiveSubStepLabel] = useState<string>('');
  const [isKaraokePlaying, setIsKaraokePlaying] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('fluent');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.8);
  const [selectedKaraokeToken, setSelectedKaraokeToken] = useState<Token | null>(null);
  const [showCustomTextInput, setShowCustomTextInput] = useState<boolean>(false);

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

  // Tự động kiểm tra độ sẵn sàng âm thanh mỗi khi bài đọc hoặc văn bản thay đổi
  useEffect(() => {
    let cancelled = false;
    const checkAvailability = async () => {
      const words = LessonAudioSyncer.extractUniqueWords(karaokeRawText);
      if (words.length === 0) {
        if (!cancelled) setSyncStatus({ isChecking: false, isSyncing: false, missingWords: [], totalUnique: 0, progress: null });
        return;
      }
      const missing: string[] = [];
      for (const w of words) {
        const available = await LessonAudioSyncer.isWordAvailable(w);
        if (!available) {
          missing.push(w);
        }
      }
      if (!cancelled) {
        setSyncStatus(prev => ({
          ...prev,
          isChecking: false,
          missingWords: missing,
          totalUnique: words.length,
        }));
      }
    };
    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, [karaokeRawText]);

  const handleSyncLessonAudio = async () => {
    if (syncStatus.isSyncing || syncStatus.missingWords.length === 0) return;
    setSyncStatus(prev => ({ ...prev, isSyncing: true, progress: null }));
    audioManager.playClickSound();

    try {
      await LessonAudioSyncer.syncLesson(karaokeRawText, (progress) => {
        setSyncStatus(prev => ({ ...prev, progress }));
      });
      audioManager.playSuccessChime();

      // Cập nhật lại sau khi đồng bộ
      const words = LessonAudioSyncer.extractUniqueWords(karaokeRawText);
      const remainingMissing: string[] = [];
      for (const w of words) {
        const available = await LessonAudioSyncer.isWordAvailable(w);
        if (!available) {
          remainingMissing.push(w);
        }
      }
      setSyncStatus({
        isChecking: false,
        isSyncing: false,
        missingWords: remainingMissing,
        totalUnique: words.length,
        progress: null,
      });
    } catch (err) {
      console.error('Lỗi khi đồng bộ âm thanh Zalo AI:', err);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const sentenceControllerRef = useRef<{ stop: () => void } | null>(null);

  const handleSelectSamplePoem = (poem: typeof SAMPLE_POEMS[0]) => {
    handleResetKaraoke();
    setKaraokeTitle(poem.title);
    setKaraokeRawText(poem.text);
    setKaraokeTokens(tokenizeVietnameseText(poem.text));
    setSelectedKaraokeToken(null);
    audioManager.playClickSound();
  };

  const handleApplyCustomText = () => {
    handleResetKaraoke();
    if (karaokeRawText.trim()) {
      setKaraokeTokens(tokenizeVietnameseText(karaokeRawText));
      setKaraokeTitle('Đoạn Văn Tùy Chỉnh');
      setShowCustomTextInput(false);
      audioManager.playSuccessChime();
    }
  };

  const handleToggleKaraoke = () => {
    if (isKaraokePlaying) {
      handleStopKaraoke();
      return;
    }

    setIsKaraokePlaying(true);
    setActiveWordIdx(0);
    setSelectedKaraokeToken(null);

    const wordsData = karaokeTokens.map((t) => ({
      text: t.text,
      breakdown: t.phonics,
    }));

    if (readingMode === 'fluent') {
      // 1. Chế độ Đọc trơn cả câu (Karaoke Mode)
      sentenceControllerRef.current = AudioSpritePlayer.playSentenceFluent(
        wordsData,
        playbackSpeed,
        (idx) => {
          setActiveWordIdx(idx);
        },
        () => {
          setIsKaraokePlaying(false);
          setActiveWordIdx(-1);
          audioManager.playSuccessChime();
        },
        useRealAudio
      );
    } else {
      // 2. Chế độ Đánh vần chi tiết từng từ trong câu
      sentenceControllerRef.current = AudioSpritePlayer.playSentenceSpelling(
        wordsData,
        playbackSpeed,
        (wordIdx, _subStepIdx, subStepLabel) => {
          setActiveWordIdx(wordIdx);
          setActiveSubStepLabel(subStepLabel);
        },
        () => {
          setIsKaraokePlaying(false);
          setActiveWordIdx(-1);
          setActiveSubStepLabel('');
          audioManager.playSuccessChime();
        },
        useRealAudio
      );
    }
  };

  const handleStopKaraoke = () => {
    if (sentenceControllerRef.current) {
      sentenceControllerRef.current.stop();
      sentenceControllerRef.current = null;
    }
    spriteManager.stop();
    webAudioEngine.stop();
    setIsKaraokePlaying(false);
    setActiveWordIdx(-1);
    setActiveSubStepLabel('');
  };

  const handleResetKaraoke = () => {
    handleStopKaraoke();
    setSelectedKaraokeToken(null);
  };

  // Tương tác 1-chạm (FR-09): Click vào bất kỳ từ nào sẽ dừng câu và phát riêng từ đó
  const handleTokenClick = (token: Token, index: number) => {
    handleStopKaraoke();
    setActiveWordIdx(index);
    setSelectedKaraokeToken(token);

    if (token.phonics) {
      if (readingMode === 'fluent') {
        AudioSpritePlayer.playFluentWord(token.phonics, playbackSpeed, undefined, useRealAudio);
      } else {
        AudioSpritePlayer.playSpellingSequence(
          token.phonics,
          playbackSpeed,
          (_subIdx) => {
            const step = token.phonics?.spellingFormula[_subIdx] || '';
            setActiveSubStepLabel(step);
          },
          () => {
            setActiveSubStepLabel('');
          },
          useRealAudio
        );
      }
    }
  };

  useEffect(() => {
    return () => {
      handleStopKaraoke();
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
                Phòng Thí Nghiệm Ngữ Âm & Thẩm Định Âm Thanh Sư Phạm (Zalo AI TTS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spriteLoaded ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Audio Sprite Master ({spriteManager.getLoadedClipCount() || 225} clips) Sẵn Sàng</span>
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
              onClick={() => {
                handleStopKaraoke();
                setActiveTab('parser');
              }}
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
              onClick={() => {
                handleStopKaraoke();
                setActiveTab('audio');
              }}
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
              onClick={() => {
                handleStopKaraoke();
                setActiveTab('ocr');
              }}
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
                      Kho Âm Thanh Zalo AI TTS (225 Clips Sạch)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      Giọng Nữ Bắc Ngọc Huyền (Speaker ID 2)
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    Trình Kiểm Âm & Thẩm Định Phát Âm Sư Phạm
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
                    <span>Zalo AI Sprite Thật</span>
                  </button>
                </div>
              </div>

              {/* Input nhập từ để test audio */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Nhập từ kiểm tra:</span>
                    <input
                      type="text"
                      value={audioInputWord}
                      onChange={(e) => handleAudioWordChange(e.target.value)}
                      placeholder="Nhập từ..."
                      className="px-4 py-2 bg-slate-50 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-xl text-base font-black text-slate-800 outline-none w-48 transition-all"
                    />
                  </div>

                  <span className="text-xs text-slate-500">
                    💡 Gợi ý: Kiểm tra từ có vần khép tắc (<code className="text-rose-600 font-bold">giặt, học, vịt, chuột</code>) và vần hiếm (<code className="text-purple-600 font-bold">khuỷu</code>).
                  </span>
                </div>

                {/* Nút từ mẫu nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-400 mr-1">Thử nhanh từ mẫu:</span>
                  {TEST_CORE_WORDS.map((item) => (
                    <button
                      key={item.word}
                      onClick={() => handleAudioWordChange(item.word)}
                      title={item.note}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        audioInputWord.toLowerCase() === item.word.toLowerCase()
                          ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {item.word}
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
                      Nguồn: {useRealAudio ? '🎙️ Zalo AI (Ngọc Huyền)' : '🎛️ Beep Synth'}
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
                    const isIntermediate = audioBreakdown.spellingFormula.length === 5 && idx === 2;
                    const resolvedKey = spriteManager.resolveSpriteKey(step);

                    return (
                      <React.Fragment key={idx}>
                        <div
                          className={`px-5 py-3 rounded-2xl text-xl font-black transition-all duration-150 border-2 relative group cursor-pointer ${
                            isStepActive
                              ? 'bg-amber-400 text-slate-950 border-amber-200 scale-120 shadow-xl shadow-amber-500/30 ring-4 ring-amber-300/50 -translate-y-1'
                              : isIntermediate
                              ? 'bg-purple-900/60 text-purple-200 border-purple-400/60 hover:bg-purple-800/80 shadow-xs'
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
                          title={`Bấm để nghe riêng: "${step}"`}
                        >
                          <span>{step}</span>
                          {isIntermediate && (
                            <span className="block text-[9px] font-bold text-purple-300 uppercase tracking-tighter text-center">
                              tiếng đệm sắc
                            </span>
                          )}
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
                    Công thức đánh vần: <strong className="text-amber-300">{audioBreakdown.spellingFormulaText}</strong>
                  </span>
                  <span className="text-slate-400">
                    Toạ độ Sprite: <strong className="text-emerald-400">{audioBreakdown.spellingFormula.map((s) => spriteManager.resolveSpriteKey(s) || s).join(' ➔ ')}</strong>
                  </span>
                </div>
              </div>

              {/* Thanh Điều Khiển: Phát Đánh Vần, Phát Đọc Trơn, Nghe Tiếng Đệm Riêng, Stop, Slider Tốc độ */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
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

                  {/* Nút kiểm tra tiếng đệm sắc nếu là từ thanh nặng khép tắc */}
                  {audioBreakdown.spellingFormula.length === 5 && (
                    <button
                      onClick={() => {
                        const intermediate = audioBreakdown.spellingFormula[2];
                        if (useRealAudio) {
                          spriteManager.playAudioSegment(intermediate);
                        } else {
                          webAudioEngine.playSyntheticTone(intermediate, 'sac', 450, 1.0);
                        }
                      }}
                      disabled={isAudioPlaying}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-sm text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 transition-all cursor-pointer shadow-xs active:scale-95"
                      title={`Nghe riêng tiếng đệm sắc "${audioBreakdown.spellingFormula[2]}"`}
                    >
                      <Volume2 className="w-4 h-4 text-purple-700" />
                      <span>Nghe Đệm Sắc ("{audioBreakdown.spellingFormula[2]}")</span>
                    </button>
                  )}

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
                      max="1.2"
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
                    Khoảng nghỉ: {calculatedGapMs}ms
                  </span>
                </div>
              </div>
            </div>

            {/* BẢNG THẨM ÂM 225 CLIPS ZALO AI (SOUNDBOARD PHÂN LOẠI 5 DANH MỤC) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-purple-600" />
                    Bảng Thẩm Âm Chi Tiết (Toàn Bộ 225 Clips Zalo AI)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bấm vào bất kỳ âm vị nào dưới đây để nghe trực tiếp phát âm giọng Nữ Bắc Ngọc Huyền:
                  </p>
                </div>

                {/* Thanh chọn 5 danh mục Soundboard */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
                  <button
                    onClick={() => setSoundboardTab('checked_rime')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      soundboardTab === 'checked_rime'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    44 Vần Tắc (Sắc)
                  </button>
                  <button
                    onClick={() => setSoundboardTab('initial')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      soundboardTab === 'initial'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    26 Âm Đầu
                  </button>
                  <button
                    onClick={() => setSoundboardTab('open_nasal_rime')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      soundboardTab === 'open_nasal_rime'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vần Mở & Mũi & uyu
                  </button>
                  <button
                    onClick={() => setSoundboardTab('tones')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      soundboardTab === 'tones'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    6 Dấu Thanh
                  </button>
                  <button
                    onClick={() => setSoundboardTab('words_diem')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      soundboardTab === 'words_diem'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tiếng Đệm & Từ Mẫu
                  </button>
                </div>
              </div>

              {/* Danh mục 1: 44 Vần Khép Tắc mang thanh Sắc */}
              {soundboardTab === 'checked_rime' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                      44 Vần Tắc (Tận cùng p, t, c, ch - 100% Phát Âm Sắc Sư Phạm)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Bấm vào âm để nghe rõ âm sắc không có rác
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                    {SB_CHECKED_RIMES.map((r) => (
                      <button
                        key={r}
                        onClick={() => playSoundboardItem(r, 'sac')}
                        className={`p-3 rounded-2xl text-center font-black text-base transition-all cursor-pointer border ${
                          activeSoundboardKey === r
                            ? 'bg-rose-600 text-white scale-110 shadow-lg ring-4 ring-rose-200 border-rose-600'
                            : 'bg-rose-50/70 text-rose-900 border-rose-200/80 hover:bg-rose-100 hover:border-rose-300 active:scale-95'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh mục 2: 26 Âm Đầu */}
              {soundboardTab === 'initial' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                      26 Âm Đầu (Đơn & Ghép: tr, ng, ngh, nh, ch, qu, gi, kh...)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Phát âm theo phương pháp sư phạm
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                    {SB_INITIALS.map((c) => (
                      <button
                        key={c}
                        onClick={() => playSoundboardItem(c, 'ngang')}
                        className={`p-3 rounded-2xl text-center font-black text-base transition-all cursor-pointer border ${
                          activeSoundboardKey === c
                            ? 'bg-blue-600 text-white scale-110 shadow-lg ring-4 ring-blue-200 border-blue-600'
                            : 'bg-blue-50/70 text-blue-900 border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 active:scale-95'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh mục 3: Vần Mở, Vần Mũi & Vần "uyu" */}
              {soundboardTab === 'open_nasal_rime' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200">
                      Vần Mở, Vần Bán Âm & Vần Mũi (Có Vần Hiếm uyu)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Tổng hợp các vần thanh ngang tự nhiên
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {SB_OPEN_NASAL_RIMES.map((r) => {
                      const isRare = r === 'uyu';
                      return (
                        <button
                          key={r}
                          onClick={() => playSoundboardItem(r, 'ngang')}
                          className={`p-3 rounded-2xl text-center font-black text-base transition-all cursor-pointer border relative ${
                            activeSoundboardKey === r
                              ? 'bg-orange-600 text-white scale-110 shadow-lg ring-4 ring-orange-200 border-orange-600'
                              : isRare
                              ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200 ring-2 ring-purple-300'
                              : 'bg-orange-50/70 text-orange-900 border-orange-200/80 hover:bg-orange-100 hover:border-orange-300 active:scale-95'
                          }`}
                        >
                          {r}
                          {isRare && (
                            <span className="block text-[8px] font-bold text-purple-700 uppercase tracking-tighter">
                              hiếm
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Danh mục 4: 6 Dấu Thanh */}
              {soundboardTab === 'tones' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                      6 Dấu Thanh Tiếng Việt
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Tên gọi chuẩn sư phạm của từng thanh điệu
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {SB_TONES.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => playSoundboardItem(t.name, t.name as any)}
                        className={`p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                          activeSoundboardKey === t.name
                            ? 'bg-purple-600 text-white scale-105 shadow-lg ring-4 ring-purple-200 border-purple-600'
                            : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:bg-purple-100 hover:border-purple-300 active:scale-98'
                        }`}
                      >
                        <div className="text-left">
                          <h4 className="font-black text-base">{t.label}</h4>
                          <p className={`text-xs ${activeSoundboardKey === t.name ? 'text-purple-100' : 'text-slate-500'}`}>
                            {t.desc}
                          </p>
                        </div>
                        <span className={`font-mono text-2xl font-black px-3 py-1 rounded-xl ${
                          activeSoundboardKey === t.name ? 'bg-white/20 text-white' : 'bg-white text-purple-800 border border-purple-200'
                        }`}>
                          {t.symbol}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh mục 5: Tiếng Đệm Sắc & Từ Mẫu */}
              {soundboardTab === 'words_diem' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      Tiếng Đệm Sắc & Từ Mẫu SGK Lớp 1
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Kiểm tra độ vang và trong trẻo của các tiếng đệm sắc
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {SB_INTERMEDIATES_AND_WORDS.map((item) => {
                      const isDiem = item.type === 'diem';
                      return (
                        <button
                          key={item.token}
                          onClick={() => playSoundboardItem(item.token, isDiem ? 'sac' : 'ngang')}
                          className={`p-3 rounded-2xl text-center font-black transition-all cursor-pointer border ${
                            activeSoundboardKey === item.token
                              ? 'bg-emerald-600 text-white scale-110 shadow-lg ring-4 ring-emerald-200 border-emerald-600'
                              : isDiem
                              ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 active:scale-95'
                              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100 active:scale-95'
                          }`}
                        >
                          <span className="text-base">{item.token}</span>
                          <span className={`block text-[9px] font-bold uppercase tracking-tighter ${
                            isDiem ? 'text-purple-600' : 'text-emerald-600'
                          }`}>
                            {isDiem ? 'tiếng đệm' : 'từ mẫu'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ============================================================ */}
        {/* TAB 3: TEST KARAOKE & TEXT READER HIGHLIGHT (MÔ-ĐUN 4) */}
        {/* ============================================================ */}
        {activeTab === 'karaoke' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Box chọn bài đọc mẫu hoặc nhập văn bản mới */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Kho Bài Đọc Mẫu SGK Tiếng Việt 1 (Kết Nối Tri Thức)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Chọn nhanh các bài thơ / câu chuyện ngắn chuẩn phân phối chương trình Lớp 1:
                  </p>
                </div>

                <button
                  onClick={() => setShowCustomTextInput(!showCustomTextInput)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    showCustomTextInput
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{showCustomTextInput ? 'Đóng ô nhập' : 'Nhập văn bản mới'}</span>
                </button>
              </div>

              {/* 4 Bài đọc mẫu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {SAMPLE_POEMS.map((poem) => {
                  const isSelected = karaokeTitle === poem.title;
                  return (
                    <button
                      key={poem.id}
                      onClick={() => handleSelectSamplePoem(poem)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-100'
                          : 'border-slate-200/80 bg-white hover:border-blue-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <h4 className="text-sm font-black text-slate-900">{poem.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{poem.text}</p>
                      <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md mt-1">
                        {poem.note}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Ô nhập văn bản tùy chỉnh */}
              {showCustomTextInput && (
                <div className="pt-4 border-t border-slate-100 space-y-3 animate-fadeIn">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Nhập hoặc dán văn bản tiếng Việt bất kỳ (tối đa 50 từ):
                  </label>
                  <textarea
                    rows={3}
                    value={karaokeRawText}
                    onChange={(e) => setKaraokeRawText(e.target.value)}
                    placeholder="Nhập đoạn văn..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded-2xl text-base font-bold text-slate-800 outline-none transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleApplyCustomText}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      Áp dụng vào Trình Đọc Karaoke
                    </button>
                  </div>
                </div>
              )}

              {/* TRẠNG THÁI ÂM THANH NGOẠI TUYẾN CỦA BÀI ĐỌC (OFFLINE AUDIO STATUS) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    syncStatus.missingWords.length === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {syncStatus.missingWords.length === 0 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Kho Âm Thanh Ngoại Tuyến (Offline Audio)
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        syncStatus.missingWords.length === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {syncStatus.missingWords.length === 0
                          ? '100% Sẵn Sàng'
                          : `Thiếu ${syncStatus.missingWords.length} từ`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {syncStatus.missingWords.length === 0
                        ? `Toàn bộ ${syncStatus.totalUnique} từ trong bài đều đã có giọng Zalo AI (Nữ Bắc Ngọc Huyền). Đọc mượt không cần mạng.`
                        : `Còn ${syncStatus.missingWords.length} từ mới chưa có file âm thanh: [ ${syncStatus.missingWords.slice(0, 5).join(', ')}${syncStatus.missingWords.length > 5 ? '...' : ''} ]`}
                    </p>
                  </div>
                </div>

                {/* Nút tải âm thanh khi có từ còn thiếu */}
                {syncStatus.missingWords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncLessonAudio}
                      disabled={syncStatus.isSyncing}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
                        syncStatus.isSyncing
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95'
                      }`}
                    >
                      <CloudDownload className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-bounce' : ''}`} />
                      <span>
                        {syncStatus.isSyncing
                          ? `Đang tải: ${syncStatus.progress?.percent || 0}%`
                          : `Tải âm thanh Zalo AI (${syncStatus.missingWords.length} từ)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar khi đang tải */}
              {syncStatus.isSyncing && syncStatus.progress && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5 animate-fadeIn mt-2">
                  <div className="flex justify-between text-xs font-bold text-blue-800">
                    <span>Đang tải âm thanh cho từ "{syncStatus.progress.word}"...</span>
                    <span>{syncStatus.progress.current}/{syncStatus.progress.total} ({syncStatus.progress.percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${syncStatus.progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BỘ ĐIỀU KHIỂN PLAY / PAUSE / SPEED (ControlBar) */}
            <ControlBar
              mode={readingMode}
              onModeChange={(newMode) => {
                handleStopKaraoke();
                setReadingMode(newMode);
              }}
              isPlaying={isKaraokePlaying}
              onTogglePlay={handleToggleKaraoke}
              onReset={handleResetKaraoke}
              speed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
              currentWordIndex={activeWordIdx}
              totalWords={karaokeTokens.length}
            />

            {/* TRÌNH HIỂN THỊ VĂN BẢN KARAOKE 60FPS (TextReader) */}
            <TextReader
              tokens={karaokeTokens}
              activeWordIndex={activeWordIdx}
              activeSubStepLabel={activeSubStepLabel}
              readingMode={readingMode}
              onTokenClick={handleTokenClick}
              title={karaokeTitle}
            />

            {/* CARD CHI TIẾT TỪ ĐƯỢC CHỌN (1-Touch Interactivity FR-09) */}
            {selectedKaraokeToken && selectedKaraokeToken.phonics && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-blue-300 shadow-xl animate-fadeIn space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                      Chi tiết Ngữ Âm Từ Vừa Chạm:
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                      "{selectedKaraokeToken.text}"
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (selectedKaraokeToken.phonics) {
                          AudioSpritePlayer.playFluentWord(
                            selectedKaraokeToken.phonics,
                            playbackSpeed,
                            undefined,
                            useRealAudio
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Đọc trơn</span>
                    </button>

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
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Nghe đánh vần</span>
                    </button>
                  </div>
                </div>

                {/* 3 Thẻ Badges Ngữ Âm */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <span className="text-xs font-bold text-blue-600 uppercase">Âm đầu</span>
                    <p className="text-2xl font-black text-blue-900 mt-1">
                      {selectedKaraokeToken.phonics.initialConsonant || 'Khuyết'}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <span className="text-xs font-bold text-orange-600 uppercase">Vần</span>
                    <p className="text-2xl font-black text-orange-900 mt-1">
                      {selectedKaraokeToken.phonics.rime}
                    </p>
                  </div>

                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <span className="text-xs font-bold text-rose-600 uppercase">Dấu thanh</span>
                    <p className="text-2xl font-black text-rose-900 mt-1">
                      {selectedKaraokeToken.phonics.toneName}
                    </p>
                  </div>
                </div>

                {/* Chuỗi công thức đánh vần */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-extrabold uppercase">Quy trình đánh vần:</span>
                    <strong className="text-base font-black text-emerald-300">
                      {selectedKaraokeToken.phonics.spellingFormulaText}
                    </strong>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    [{selectedKaraokeToken.phonics.spellingFormula.join(' ➔ ')}]
                  </span>
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
                setOcrTransferredText(result.sanitizedText || result.rawText);
              }}
            />

            {ocrTransferredText && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">Chuyển văn bản đã quét sang Bộ Đọc</h4>
                  <button
                    onClick={() => {
                      setKaraokeRawText(ocrTransferredText);
                      setKaraokeTokens(tokenizeVietnameseText(ocrTransferredText));
                      setKaraokeTitle('Trang Sách Đã Quét OCR');
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
