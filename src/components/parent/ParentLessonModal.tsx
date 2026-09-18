import React, { useState } from 'react';
import {
  FileText,
  Camera,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { OCRUploader } from '../OCRUploader.tsx';
import { TextProofreader } from './TextProofreader.tsx';
import { LessonAudioSyncer } from '../../core/audio/LessonAudioSyncer.ts';
import { audioManager } from '../../core/audio/AudioManager.ts';

export interface CustomLessonData {
  id: string;
  title: string;
  text: string;
  note?: string;
}

interface ParentLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLesson: (lesson: CustomLessonData) => void;
  currentLessonTitle?: string;
}

const QUICK_PRESETS = [
  {
    title: 'Đồng dao: Con mèo trèo cây cau',
    text: 'Con mèo mà trèo cây cau\nHỏi thăm chú chuột đi đâu vắng nhà\nChú chuột đi chợ đường xa\nMua mắm mua muối giỗ cha chú mèo.',
    tag: 'Thơ 4 câu - Vần eo, au, a, uot',
  },
  {
    title: 'Bài thơ: Hoa sen',
    text: 'Hoa sen nở rộ\nHương bay ngạt ngào\nCánh hồng nhị biếc\nGió lùa lao xao.',
    tag: 'Thơ 4 chữ - Luyện dấu thanh & âm s, ng, l',
  },
  {
    title: 'Đoạn văn: Mặt trời buổi sáng',
    text: 'Buổi sáng, mặt trời toả ánh nắng ấm áp. Chú chim nhỏ cất tiếng hót líu lo trên cành cây. Bé thức dậy đánh răng, rửa mặt rồi vui vẻ đến trường.',
    tag: 'Văn xuôi mô tả - Đầy đủ dấu câu & ngắt nhịp',
  },
];

export const ParentLessonModal: React.FC<ParentLessonModalProps> = ({
  isOpen,
  onClose,
  onSaveLesson,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'ocr'>('paste');
  const [lessonTitle, setLessonTitle] = useState<string>('Bài Tập Đọc Hôm Nay');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [ocrRawResult, setOcrRawResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setLessonTitle(preset.title);
    setPasteContent(preset.text);
    audioManager.playClickSound();
  };

  const handleSavePasteText = () => {
    const cleanText = pasteContent.trim();
    if (!cleanText) {
      alert('Vui lòng nhập hoặc dán nội dung bài đọc cho bé.');
      return;
    }

    const title = lessonTitle.trim() || 'Bài Tập Đọc Hôm Nay';
    const newLesson: CustomLessonData = {
      id: `lesson-custom-${Date.now()}`,
      title,
      text: cleanText,
      note: 'Bài đọc phụ huynh nạp trực tiếp',
    };

    onSaveLesson(newLesson);
    audioManager.playSuccessChime();
    onClose();
  };

  const handleOcrScanComplete = (result: any) => {
    setOcrRawResult(result);
    audioManager.playClickSound();
  };

  const handleSaveProofreadOcr = (sanitizedText: string) => {
    const title = lessonTitle.trim() || 'Trang Sách Vừa Quét';
    const newLesson: CustomLessonData = {
      id: `lesson-ocr-${Date.now()}`,
      title,
      text: sanitizedText,
      note: 'Bài đọc phụ huynh quét từ trang sách OCR',
    };

    onSaveLesson(newLesson);
    audioManager.playSuccessChime();
    setOcrRawResult(null);
    onClose();
  };

  const wordCount = LessonAudioSyncer.extractUniqueWords(pasteContent).length;
  const lineCount = pasteContent.split('\n').filter((l) => l.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md shadow-amber-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Nạp Bài Tập Đọc Mới Cho Bé
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                Phụ huynh có thể dán đoạn văn bài thơ hoặc quét trang sách SGK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 py-3.5 px-4 font-black text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-700 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Dán Đoạn Văn / Bài Thơ</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-2 py-3.5 px-4 font-black text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'ocr'
                ? 'border-purple-600 text-purple-700 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>2. Quét Trang Sách (OCR)</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'paste' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Tiêu đề bài học */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Tiêu đề bài đọc:
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 5: Chú mèo mướp..."
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 hover:border-amber-400 focus:border-amber-500 rounded-2xl text-sm sm:text-base font-bold text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Ô Dán Văn Bản Lớn */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Nội dung văn bản (Hỗ trợ nhiều dòng, bài thơ, dấu câu):
                  </label>
                  {pasteContent && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {lineCount} dòng • {wordCount} từ vựng
                    </span>
                  )}
                </div>

                <textarea
                  rows={7}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`Dán đoạn văn hoặc bài thơ vào đây...\n\nVí dụ:\nVe vẻ vè ve\nCái vè chim chích\nBắt sâu đầu cành\nGiúp ích cho cây.`}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 hover:border-amber-400 focus:border-amber-500 rounded-2xl text-base font-bold text-slate-800 outline-none leading-relaxed transition-all resize-y placeholder:text-slate-400"
                />
              </div>

              {/* Các Bài Đọc Mẫu Gợi Ý Sẵn */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Hoặc chọn nhanh bài mẫu SGK có sẵn:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {QUICK_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition-all cursor-pointer group active:scale-95 space-y-1"
                    >
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-amber-900 line-clamp-1">
                        {preset.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{preset.tag}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-4 animate-fadeIn">
              {ocrRawResult ? (
                <TextProofreader
                  initialText={ocrRawResult.sanitizedText || ocrRawResult.rawText}
                  confidence={ocrRawResult.confidence}
                  onSave={handleSaveProofreadOcr}
                  onCancel={() => setOcrRawResult(null)}
                />
              ) : (
                <div className="bg-purple-50/50 p-6 rounded-3xl border-2 border-dashed border-purple-200">
                  <OCRUploader onScanComplete={handleOcrScanComplete} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {activeTab === 'paste' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleSavePasteText}
              disabled={!pasteContent.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg transition-all cursor-pointer ${
                pasteContent.trim()
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-amber-500/20'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Bé Bắt Đầu Học Bài Này</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
