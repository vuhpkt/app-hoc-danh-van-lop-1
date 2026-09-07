import React, { useState } from 'react';
import { X, Volume2, Sparkles, Play, Info } from 'lucide-react';
import { Token } from '../../types/index.ts';
import { spriteManager } from '../../core/audio/SpriteManager.ts';
import { AudioSpritePlayer } from '../../core/audio/AudioSpritePlayer.ts';
import { audioManager } from '../../core/audio/AudioManager.ts';

interface PhonicsBadgeModalProps {
  token: Token | null;
  onClose: () => void;
}

export const PhonicsBadgeModal: React.FC<PhonicsBadgeModalProps> = ({ token, onClose }) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  if (!token || !token.phonics) return null;

  const phonics = token.phonics;

  // Phát toàn bộ chuỗi đánh vần của từ
  const handlePlaySpelling = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStepIdx(0);
    audioManager.playClickSound();

    AudioSpritePlayer.playSpellingSequence(
      phonics,
      0.85,
      (idx) => {
        setActiveStepIdx(idx);
      },
      () => {
        setActiveStepIdx(-1);
        setIsPlaying(false);
        audioManager.playSuccessChime();
      }
    );
  };

  // Phát đọc trơn từ
  const handlePlayFluent = () => {
    audioManager.playClickSound();
    AudioSpritePlayer.playFluentWord(phonics, 0.9);
  };

  // Phát từng mẩu âm riêng rẽ khi bé chạm vào huy hiệu
  const handlePlaySingleSegment = (segment: string) => {
    audioManager.playClickSound();
    spriteManager.playAudioSegment(segment);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border-4 border-amber-300 overflow-hidden space-y-6 p-6 sm:p-8 animate-scaleUp relative">
        {/* Nút đóng lớn */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Tiêu đề & Từ phóng to */}
        <div className="text-center space-y-2 pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bóc Tách Ngữ Âm 1-Chạm</span>
          </span>

          <h2 className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight">
            {phonics.clean}
          </h2>

          <p className="text-xs text-slate-500 font-medium">
            Chạm vào từng huy hiệu màu để nghe phát âm riêng biệt
          </p>
        </div>

        {/* 3 HUY HIỆU MÀU BẮT MẮT: ÂM ĐẦU - VẦN - THANH */}
        <div className="grid grid-cols-3 gap-3">
          {/* Huy hiệu Âm đầu (Xanh dương) */}
          <button
            onClick={() => handlePlaySingleSegment(phonics.initialConsonant || phonics.clean)}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-blue-50 hover:bg-blue-100/80 border-2 border-blue-300 text-blue-900 transition-all cursor-pointer active:scale-95 group shadow-sm"
          >
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Âm Đầu
            </span>
            <span className="text-2xl sm:text-3xl font-black mt-1 group-hover:scale-110 transition-transform">
              {phonics.initialConsonant || '∅ (khuyết)'}
            </span>
            <Volume2 className="w-4 h-4 text-blue-500 mt-1 opacity-70 group-hover:opacity-100" />
          </button>

          {/* Huy hiệu Vần (Cam sáng) */}
          <button
            onClick={() => handlePlaySingleSegment(phonics.rime)}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-orange-50 hover:bg-orange-100/80 border-2 border-orange-300 text-orange-900 transition-all cursor-pointer active:scale-95 group shadow-sm"
          >
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              Vần
            </span>
            <span className="text-2xl sm:text-3xl font-black mt-1 group-hover:scale-110 transition-transform">
              {phonics.rime}
            </span>
            <Volume2 className="w-4 h-4 text-orange-500 mt-1 opacity-70 group-hover:opacity-100" />
          </button>

          {/* Huy hiệu Dấu thanh (Tím) */}
          <button
            onClick={() => handlePlaySingleSegment(phonics.toneName)}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-purple-50 hover:bg-purple-100/80 border-2 border-purple-300 text-purple-900 transition-all cursor-pointer active:scale-95 group shadow-sm"
          >
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              Thanh
            </span>
            <span className="text-xl sm:text-2xl font-black mt-1 group-hover:scale-110 transition-transform">
              {phonics.toneName}
            </span>
            <Volume2 className="w-4 h-4 text-purple-500 mt-1 opacity-70 group-hover:opacity-100" />
          </button>
        </div>

        {/* QUY TRÌNH ĐÁNH VẦN TỪNG BƯỚC */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Quy trình đánh vần sư phạm:
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {phonics.spellingFormula.length} bước
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {phonics.spellingFormula.map((step, idx) => {
              const isCurrent = activeStepIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handlePlaySingleSegment(step)}
                  className={`px-3 py-1.5 rounded-xl font-black text-base transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-900 scale-110 shadow-md ring-2 ring-amber-300'
                      : 'bg-white text-slate-800 border border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  {step}
                </button>
              );
            })}
          </div>
        </div>

        {/* Giải thích quy tắc cho phụ huynh */}
        {phonics.ruleDescription && (
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{phonics.ruleDescription}</p>
          </div>
        )}

        {/* 2 NÚT HÀNH ĐỘNG PHÁT ÂM LỚN */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePlaySpelling}
            disabled={isPlaying}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-lg transition-all cursor-pointer ${
              isPlaying
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95'
            }`}
          >
            <Play className={`w-4 h-4 fill-white ${isPlaying ? 'animate-spin' : ''}`} />
            <span>Phát Đánh Vần</span>
          </button>

          <button
            onClick={handlePlayFluent}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>Đọc Trơn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
