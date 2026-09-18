import React, { useState } from 'react';
import { X, Volume2, Sparkles, Play, Info } from 'lucide-react';
import { Token } from '../../types/index.ts';
import { spriteManager } from '../../core/audio/SpriteManager.ts';
import { AudioSpritePlayer } from '../../core/audio/AudioSpritePlayer.ts';
import { audioManager } from '../../core/audio/AudioManager.ts';

interface PhonicsBadgeModalProps {
  token: Token | null;
  speed?: number;
  onClose: () => void;
}

export const PhonicsBadgeModal: React.FC<PhonicsBadgeModalProps> = ({ token, speed = 0.8, onClose }) => {
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
      speed,
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
    AudioSpritePlayer.playFluentWord(phonics, speed);
  };

  // Phát từng mẩu âm riêng rẽ khi bé chạm vào huy hiệu
  const handlePlaySingleSegment = (segment: string) => {
    audioManager.playClickSound();
    spriteManager.playAudioSegment(segment);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden space-y-5 p-6 sm:p-7 animate-scaleUp relative">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng bóc tách ngữ âm"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all cursor-pointer active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề & Từ phóng to */}
        <div className="text-center space-y-1.5 pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200/80">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Bóc Tách Ngữ Âm</span>
          </span>

          <h2 className="text-5xl sm:text-6xl font-black text-stone-900 tracking-tight">
            {phonics.clean}
          </h2>

          <p className="text-xs text-stone-400 font-bold">
            Chạm vào từng phần để nghe phát âm riêng
          </p>
        </div>

        {/* 3 HUY HIỆU MÀU PASTEL: ÂM ĐẦU - VẦN - THANH */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Huy hiệu Âm đầu (Xanh pastel) */}
          <button
            type="button"
            onClick={() => handlePlaySingleSegment(phonics.initialConsonant || phonics.clean)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200 text-sky-950 transition-all cursor-pointer active:scale-95 group shadow-2xs"
          >
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
              Âm đầu
            </span>
            <span className="text-2xl font-black mt-0.5 group-hover:scale-105 transition-transform">
              {phonics.initialConsonant || '∅'}
            </span>
            <Volume2 className="w-3.5 h-3.5 text-sky-500 mt-0.5 opacity-60 group-hover:opacity-100" />
          </button>

          {/* Huy hiệu Vần (Vàng mơ pastel) */}
          <button
            type="button"
            onClick={() => handlePlaySingleSegment(phonics.rime)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-950 transition-all cursor-pointer active:scale-95 group shadow-2xs"
          >
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Vần
            </span>
            <span className="text-2xl font-black mt-0.5 group-hover:scale-105 transition-transform">
              {phonics.rime}
            </span>
            <Volume2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 opacity-60 group-hover:opacity-100" />
          </button>

          {/* Huy hiệu Dấu thanh (Hồng phấn pastel) */}
          <button
            type="button"
            onClick={() => handlePlaySingleSegment(phonics.toneName)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 text-rose-950 transition-all cursor-pointer active:scale-95 group shadow-2xs"
          >
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
              Thanh
            </span>
            <span className="text-xl font-black mt-0.5 group-hover:scale-105 transition-transform">
              {phonics.toneName}
            </span>
            <Volume2 className="w-3.5 h-3.5 text-rose-500 mt-0.5 opacity-60 group-hover:opacity-100" />
          </button>
        </div>

        {/* QUY TRÌNH ĐÁNH VẦN TỪNG BƯỚC */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-stone-700">
              Các bước đánh vần:
            </span>
            <span className="text-[11px] font-bold text-stone-400">
              {phonics.spellingFormula.length} bước
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {phonics.spellingFormula.map((step, idx) => {
              const isCurrent = activeStepIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePlaySingleSegment(step)}
                  className={`px-3 py-1.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-stone-950 scale-105 shadow-2xs ring-2 ring-amber-300'
                      : 'bg-white text-stone-800 border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50'
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
          <div className="flex items-start gap-2 p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium text-[11px]">{phonics.ruleDescription}</p>
          </div>
        )}

        {/* 2 NÚT HÀNH ĐỘNG PHÁT ÂM */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handlePlaySpelling}
            disabled={isPlaying}
            className={`flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white shadow-2xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-stone-900 hover:bg-stone-800 active:scale-95'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isPlaying ? 'animate-spin' : ''}`} />
            <span>Phát Đánh Vần</span>
          </button>

          <button
            type="button"
            onClick={handlePlayFluent}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-amber-500 hover:bg-amber-600 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Đọc Trơn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
