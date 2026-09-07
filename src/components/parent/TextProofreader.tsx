import React, { useState, useEffect } from 'react';
import { Check, RotateCcw, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { sanitizeOcrText } from '../../core/ocr/textSanitizer.ts';
import { LessonAudioSyncer } from '../../core/audio/LessonAudioSyncer.ts';

interface TextProofreaderProps {
  initialText: string;
  confidence?: number;
  onSave: (sanitizedText: string) => void;
  onCancel: () => void;
}

export const TextProofreader: React.FC<TextProofreaderProps> = ({
  initialText,
  confidence,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState<string>(initialText);
  const [uniqueWords, setUniqueWords] = useState<string[]>([]);
  const [missingWordCount, setMissingWordCount] = useState<number>(0);

  useEffect(() => {
    const words = LessonAudioSyncer.extractUniqueWords(text);
    setUniqueWords(words);

    let active = true;
    async function checkMissing() {
      let missing = 0;
      for (const w of words) {
        const has = await LessonAudioSyncer.isWordAvailable(w);
        if (!has) missing++;
      }
      if (active) {
        setMissingWordCount(missing);
      }
    }

    checkMissing();
    return () => {
      active = false;
    };
  }, [text]);

  const handleReSanitize = () => {
    const res = sanitizeOcrText(text);
    setText(res.cleanedText);
  };

  const handleCapitalizeFirst = () => {
    const lines = text.split('\n').map((l) => {
      const trimmed = l.trim();
      if (!trimmed) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
    setText(lines.join('\n'));
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-200 space-y-4 animate-fadeIn">
      {/* Tiêu đề & Thông số OCR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-black text-slate-800">
            Rà Soát & Chỉnh Sửa Văn Bản Quét Được (Proofreader)
          </h3>
        </div>

        {confidence !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-bold">Độ tin cậy OCR:</span>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                confidence >= 0.8
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 font-medium">
        Phụ huynh hãy kiểm tra lại dấu thanh và dấu câu để đảm bảo bé được học với văn bản chuẩn xác nhất:
      </p>

      {/* Ô nhập chỉnh sửa văn bản */}
      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-4 bg-slate-50 border-2 border-slate-200 hover:border-purple-300 focus:border-purple-600 rounded-2xl text-base sm:text-lg font-bold text-slate-800 outline-none leading-relaxed transition-all resize-y"
        placeholder="Nội dung bài đọc tiếng Việt..."
      />

      {/* Các công cụ sửa nhanh & Thống kê từ */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReSanitize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold transition-all cursor-pointer border border-purple-200/60"
            title="Lọc lại ký tự rác và số trang"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lọc sạch rác OCR</span>
          </button>
          <button
            onClick={handleCapitalizeFirst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
            title="Viết hoa chữ cái đầu mỗi dòng"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Viết hoa đầu dòng</span>
          </button>
        </div>

        {/* Thống kê từ & độ sẵn sàng âm thanh */}
        <div className="flex items-center gap-3 text-slate-500 font-bold">
          <span>{uniqueWords.length} từ độc nhất</span>
          {missingWordCount > 0 ? (
            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Thiếu {missingWordCount} âm thanh (sẽ tự động tải)</span>
            </span>
          ) : (
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
              Đã đủ 100% âm thanh
            </span>
          )}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          onClick={() => onSave(text.trim())}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>Áp dụng vào bài học</span>
        </button>
      </div>
    </div>
  );
};
