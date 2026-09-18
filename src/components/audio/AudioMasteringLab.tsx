import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  Play,
  Square,
  Sliders,
  RotateCcw,
  Headphones,
  Activity,
  Layers,
  Flame,
  Feather,
  CheckCircle2
} from 'lucide-react';
import {
  audioDspProcessor,
  AudioProfileId,
  AUDIO_PROFILES,
  DspOptions
} from '../../core/audio/AudioDspProcessor';
import { webAudioEngine } from '../../core/audio/WebAudioEngine';
import { zaloTtsClient } from '../../core/audio/ZaloTtsClient';
import { spriteManager } from '../../core/audio/SpriteManager';

const QUICK_TEST_WORDS = [
  { word: 'mèo', label: 'mèo', note: 'Thanh huyền mềm, kiểm tra độ ấm' },
  { word: 'giặt', label: 'giặt', note: 'Khép tắc + nặng, kiểm tra độ dứt âm' },
  { word: 'trường', label: 'trường', note: 'Âm đầu tr + vần ương, kiểm tra độ rõ' },
  { word: 'khuỷu', label: 'khuỷu', note: 'Vần hiếm uyu + hỏi, kiểm tra độ vang' },
  { word: 'hoa', label: 'hoa', note: 'Vần mở oa, kiểm tra độ ngân tự nhiên' },
  { word: 'sách', label: 'sách', note: 'Phụ âm xát s + ách, kiểm tra khử chói' },
];

export const AudioMasteringLab: React.FC = () => {
  const [testWord, setTestWord] = useState('mèo');
  const [selectedProfile, setSelectedProfile] = useState<AudioProfileId>('master_sprite_sync');
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Live DSP Parameters
  const [warmthGainDb, setWarmthGainDb] = useState(2.2);
  const [deHarshGainDb, setDeHarshGainDb] = useState(-2.2);
  const [enableAmbience, setEnableAmbience] = useState(true);
  const [ambienceWetMix, setAmbienceWetMix] = useState(0.06);
  const [enableEq, setEnableEq] = useState(true);
  const [preRollMs, setPreRollMs] = useState(80);
  const [reverbTailMs, setReverbTailMs] = useState(90);

  // Playback state
  const [activeSample, setActiveSample] = useState<'A' | 'B' | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Audio buffer cache for the current word
  const rawBufferRef = useRef<AudioBuffer | null>(null);
  const currentSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const currentGainNodeRef = useRef<GainNode | null>(null);
  const activePlaybackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dừng âm thanh đang phát
  const stopCurrentAudio = () => {
    if (activePlaybackTimerRef.current) {
      clearTimeout(activePlaybackTimerRef.current);
      activePlaybackTimerRef.current = null;
    }
    if (currentSourceNodeRef.current) {
      try {
        currentSourceNodeRef.current.stop();
        currentSourceNodeRef.current.disconnect();
      } catch {}
      currentSourceNodeRef.current = null;
    }
    if (currentGainNodeRef.current) {
      try {
        currentGainNodeRef.current.disconnect();
      } catch {}
      currentGainNodeRef.current = null;
    }
    setActiveSample(null);
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  // Thay đổi profile
  const handleProfileChange = (profileId: AudioProfileId) => {
    setSelectedProfile(profileId);
    const prof = AUDIO_PROFILES[profileId];
    if (prof && prof.options) {
      if (prof.options.warmthGainDb !== undefined) setWarmthGainDb(prof.options.warmthGainDb);
      if (prof.options.deHarshGainDb !== undefined) setDeHarshGainDb(prof.options.deHarshGainDb);
      if (prof.options.enableAmbience !== undefined) setEnableAmbience(prof.options.enableAmbience);
      if (prof.options.ambienceWetMix !== undefined) setAmbienceWetMix(prof.options.ambienceWetMix);
      if (prof.options.enableEq !== undefined) setEnableEq(prof.options.enableEq);
    }
  };

  // Nạp AudioBuffer cho từ được chọn
  const loadWordAudioBuffer = async (word: string): Promise<AudioBuffer | null> => {
    const clean = word.toLowerCase().trim();
    if (!clean) return null;

    // 1. Kiểm tra SpriteManager nếu có clip sẵn
    const spriteClip = spriteManager.getClipBuffer(clean);
    if (spriteClip) {
      return spriteClip;
    }

    // 2. Lấy trực tiếp từ Zalo TTS API
    try {
      setIsLoadingAudio(true);
      setStatusMessage(`Đang tải mẫu âm thanh Zalo AI cho: "${clean}"...`);
      const arrayBuffer = await zaloTtsClient.fetchAudioBuffer(clean);
      const ctx = webAudioEngine.getAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      setStatusMessage(`Đã sẵn sàng mẫu âm cho: "${clean}"`);
      return decoded;
    } catch (err) {
      console.warn('Không thể tải audio Zalo:', err);
      setStatusMessage(`Lỗi tải âm thanh cho "${clean}". Thử lại sau.`);
      return null;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Phát một AudioBuffer với Fade-in / Fade-out mượt mà
  const playBuffer = (buffer: AudioBuffer, label: 'A' | 'B'): Promise<void> => {
    stopCurrentAudio();
    setActiveSample(label);

    return new Promise((resolve) => {
      const ctx = webAudioEngine.getAudioContext();
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      source.playbackRate.value = 1.0;

      const duration = buffer.duration;
      const now = ctx.currentTime;
      const startTime = now + 0.015;

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.008);
      gainNode.gain.setValueAtTime(1.0, Math.max(startTime + 0.008, startTime + duration - 0.008));
      gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      currentSourceNodeRef.current = source;
      currentGainNodeRef.current = gainNode;

      source.start(startTime);

      const timer = setTimeout(() => {
        stopCurrentAudio();
        resolve();
      }, Math.round((duration + 0.05) * 1000));

      activePlaybackTimerRef.current = timer;
    });
  };

  // 1. Phát Mẫu A: Gốc Zalo AI (Mộc, Dry)
  const handlePlaySampleA = async () => {
    stopCurrentAudio();
    let rawBuf = rawBufferRef.current;
    if (!rawBuf) {
      rawBuf = await loadWordAudioBuffer(testWord);
      rawBufferRef.current = rawBuf;
    }
    if (!rawBuf) return;

    // Mẫu A: Không EQ, Không Ambience (profile: pure_dry)
    const ctx = webAudioEngine.getAudioContext();
    const dryBuffer = audioDspProcessor.trimAndEnhanceAudioBuffer(rawBuf, ctx, {
      profile: 'pure_dry',
      preRollSec: 0.025,
      reverbTailSec: 0.050,
      enableEq: false,
      enableAmbience: false,
    });

    setStatusMessage(`🔊 Đang phát Mẫu A (Gốc Zalo AI - Mộc & Khô)...`);
    await playBuffer(dryBuffer, 'A');
    setStatusMessage('');
  };

  // 2. Phát Mẫu B: Thuật toán Sư phạm Đã Xử Lý (Warm, Crisp & Ambience)
  const handlePlaySampleB = async () => {
    stopCurrentAudio();
    let rawBuf = rawBufferRef.current;
    if (!rawBuf) {
      rawBuf = await loadWordAudioBuffer(testWord);
      rawBufferRef.current = rawBuf;
    }
    if (!rawBuf) return;

    const ctx = webAudioEngine.getAudioContext();
    const liveOptions: DspOptions = {
      profile: selectedProfile,
      enableEq,
      warmthGainDb,
      deHarshGainDb,
      enableAmbience,
      ambienceWetMix,
      preRollSec: preRollMs / 1000,
      reverbTailSec: reverbTailMs / 1000,
    };

    const enhancedBuffer = audioDspProcessor.trimAndEnhanceAudioBuffer(rawBuf, ctx, liveOptions);

    setStatusMessage(`✨ Đang phát Mẫu B (DSP Sư Phạm - Ấm Áp & Tự Nhiên)...`);
    await playBuffer(enhancedBuffer, 'B');
    setStatusMessage('');
  };

  // 3. So sánh liên tiếp A ➔ B (Cách nhau 400ms)
  const handleCompareAB = async () => {
    stopCurrentAudio();
    let rawBuf = rawBufferRef.current;
    if (!rawBuf) {
      rawBuf = await loadWordAudioBuffer(testWord);
      rawBufferRef.current = rawBuf;
    }
    if (!rawBuf) return;

    setStatusMessage(`1/2: Đang nghe Mẫu A (Gốc Zalo)...`);
    await handlePlaySampleA();

    // Nghỉ 400ms giữa 2 mẫu
    await new Promise((r) => setTimeout(r, 400));

    setStatusMessage(`2/2: Đang nghe Mẫu B (Sư Phạm Tối Ưu)...`);
    await handlePlaySampleB();
    setStatusMessage('');
  };

  // Đổi từ kiểm tra
  const handleSelectWord = (word: string) => {
    stopCurrentAudio();
    setTestWord(word);
    rawBufferRef.current = null; // reset cache để load từ mới
    setStatusMessage('');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              Nghiên Cứu & Thẩm Định Âm Thanh
            </span>
            <span className="text-xs text-indigo-300 font-mono">
              Pedagogical Audio Mastering Lab
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            Thẩm Định Thuật Toán Âm Thanh Hay Nhất
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            So sánh trực tiếp giữa âm thanh Zalo AI thô và âm thanh sau chuỗi xử lý sư phạm (Ấm áp, Rõ chữ, Không chói gắt).
          </p>
        </div>

        {/* Nút bật/tắt tinh chỉnh chi tiết */}
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
            isCustomizing
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isCustomizing ? 'Ẩn Tinh Chỉnh' : 'Mở Bảng Tinh Chỉnh DSP'}</span>
        </button>
      </div>

      {/* 1. Chọn Từ Kiểm Tra */}
      <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Từ thử nghiệm:</span>
            <input
              type="text"
              value={testWord}
              onChange={(e) => {
                setTestWord(e.target.value);
                rawBufferRef.current = null;
              }}
              placeholder="Nhập từ..."
              className="px-3.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-black text-white outline-none w-36"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Từ mẫu điển hình:</span>
            {QUICK_TEST_WORDS.map((item) => (
              <button
                key={item.word}
                onClick={() => handleSelectWord(item.word)}
                title={item.note}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  testWord.toLowerCase() === item.word.toLowerCase()
                    ? 'bg-amber-400 text-slate-950 scale-105 shadow-sm'
                    : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {statusMessage && (
          <div className="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Bảng Lựa Chọn Profile Âm Thanh */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Chọn Cấu Hình Màu Âm (Audio Profile):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(AUDIO_PROFILES) as AudioProfileId[]).map((profId) => {
            const prof = AUDIO_PROFILES[profId];
            const isSelected = selectedProfile === profId;
            return (
              <div
                key={profId}
                onClick={() => handleProfileChange(profId)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-900/60 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    {profId === 'master_sprite_sync' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {profId === 'pedagogical_warm' && <Flame className="w-4 h-4 text-amber-400" />}
                    {profId === 'crystal_clear' && <Feather className="w-4 h-4 text-cyan-400" />}
                    {profId === 'pure_dry' && <Volume2 className="w-4 h-4 text-slate-400" />}
                    <span>{prof.name}</span>
                  </h4>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {prof.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BẢNG SO SÁNH A/B TRỰC TIẾP (TRUNG TÂM THẨM ĐỊNH) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/80 p-6 rounded-3xl border-2 border-indigo-500/40 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Headphones className="w-4 h-4" />
            Khu Vực Nghe Thẩm Định So Sánh (A/B Listening Test)
          </span>
          <span className="text-[11px] text-slate-400">
            Từ kiểm tra: <strong className="text-amber-300 text-sm">"{testWord}"</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Nút Mẫu A: Gốc Zalo AI */}
          <button
            onClick={handlePlaySampleA}
            disabled={isLoadingAudio}
            className={`p-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer active:scale-95 ${
              activeSample === 'A'
                ? 'bg-blue-600 text-white border-blue-300 shadow-lg shadow-blue-500/30 scale-102 ring-4 ring-blue-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="text-center">
              <div className="text-sm font-black">MẪU A: GỐC ZALO AI</div>
              <div className="text-[10px] font-normal text-slate-400">Mộc, khô, chưa qua lọc âm</div>
            </div>
          </button>

          {/* Nút Mẫu B: Thuật toán Sư phạm */}
          <button
            onClick={handlePlaySampleB}
            disabled={isLoadingAudio}
            className={`p-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer active:scale-95 ${
              activeSample === 'B'
                ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-xl shadow-amber-500/30 scale-102 ring-4 ring-amber-400/30'
                : 'bg-gradient-to-tr from-amber-500/20 to-indigo-900/60 text-amber-200 border-amber-400/40 hover:border-amber-400 hover:bg-amber-500/30'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/30 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-amber-300">MẪU B: SƯ PHẠM (DSP)</div>
              <div className="text-[10px] font-normal text-slate-300">Ấm áp, dịu tai, buồng âm nhẹ</div>
            </div>
          </button>

          {/* Nút So Sánh Liền Mạch A -> B */}
          <button
            onClick={handleCompareAB}
            disabled={isLoadingAudio}
            className="p-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-2 border-2 border-purple-400/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="text-sm font-black">SO SÁNH A ➔ B</div>
              <div className="text-[10px] font-normal text-purple-300">Phát A rồi tự động phát B</div>
            </div>
          </button>
        </div>

        {/* Nút Dừng Âm Thanh */}
        {activeSample && (
          <div className="flex justify-center pt-2">
            <button
              onClick={stopCurrentAudio}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Dừng Phát</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. BẢNG TINH CHỈNH THÔNG SỐ TRỰC TIẾP (KHI BẬT isCustomizing) */}
      {isCustomizing && (
        <div className="bg-slate-950/70 p-6 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Bảng Điều Khiển Tinh Chỉnh Thuật Toán Sư Phạm (Live DSP Tuner)
            </h4>
            <span className="text-[11px] text-slate-400">Thay đổi có tác dụng ngay khi bấm Mẫu B</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột 1: Bộ Lọc Tần Số (Parametric EQ) */}
            <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  1. Bộ Lọc Tần Số Sư Phạm (5-Band EQ)
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={enableEq}
                    onChange={(e) => setEnableEq(e.target.checked)}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span className="font-bold text-slate-300">Bật EQ</span>
                </label>
              </div>

              {/* Slider 1: Warmth Boost (220Hz) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Độ Ấm Giọng Cô Giáo (220Hz):</span>
                  <span className="text-amber-400 font-mono">+{warmthGainDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.2"
                  value={warmthGainDb}
                  onChange={(e) => setWarmthGainDb(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Tăng cộng hưởng ngực, giảm giọng mũi nghẹt.</p>
              </div>

              {/* Slider 2: De-Harsh Notch (3.6kHz) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Khử Chói Phụ Âm Xát (3.6kHz):</span>
                  <span className="text-cyan-400 font-mono">{deHarshGainDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="-5.0"
                  max="0.0"
                  step="0.2"
                  value={deHarshGainDb}
                  onChange={(e) => setDeHarshGainDb(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Làm mềm phụ âm s, x, ch, tr, dịu tai cho bé.</p>
              </div>
            </div>

            {/* Cột 2: Không Gian Buồng Âm & Nhịp Thở */}
            <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  2. Buồng Âm Lớp Học & Nhịp Thở
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={enableAmbience}
                    onChange={(e) => setEnableAmbience(e.target.checked)}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span className="font-bold text-slate-300">Bật Ambience</span>
                </label>
              </div>

              {/* Slider 3: Tỷ lệ Micro-Ambience */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Tỷ Lệ Buồng Âm (Early Reflections):</span>
                  <span className="text-purple-400 font-mono">{(ambienceWetMix * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="0.15"
                  step="0.01"
                  value={ambienceWetMix}
                  onChange={(e) => setAmbienceWetMix(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Độ vang phòng học ấm cúng (khuyên dùng 5% - 8%).</p>
              </div>

              {/* Slider 4: Pre-roll buffer (lấy hơi) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Khoảng Đệm Lấy Hơi Tự Nhiên:</span>
                  <span className="text-emerald-400 font-mono">{preRollMs} ms</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="10"
                  value={preRollMs}
                  onChange={(e) => setPreRollMs(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Giữ nhịp thở tự nhiên của tiếng nói, không bị giật cộc.</p>
              </div>

              {/* Slider 5: Reverb tail (ngân đuôi) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Đuôi Ngân Dây Thanh Quản:</span>
                  <span className="text-indigo-400 font-mono">{reverbTailMs} ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="10"
                  value={reverbTailMs}
                  onChange={(e) => setReverbTailMs(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Giúp chữ dứt êm ái, bảo toàn âm cuối m, n, ng, u, i.</p>
              </div>
            </div>
          </div>

          {/* Nút Khôi phục mặc định */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleProfileChange('pedagogical_warm')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Cấu Hình Chuẩn Lớp 1</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
