import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { OCRResult } from '../types';

interface OCRUploaderProps {
  onScanComplete?: (result: OCRResult) => void;
}

export const OCRUploader: React.FC<OCRUploaderProps> = ({ onScanComplete }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');

  // Xử lý chọn ảnh giả lập
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      simulateOCR(url);
    }
  };

  // Giả lập OCR quét trang sách SGK Lớp 1
  const simulateOCR = (imageUrl: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockExtracted = 'Bé xem cá vàng. Cá vàng bơi trong bể nước. Mẹ khen bé ngoan.';
      setResultText(mockExtracted);
      setIsProcessing(false);
      onScanComplete?.({
        imageUrl,
        rawText: mockExtracted,
        confidence: 0.96,
        lines: [
          'Bé xem cá vàng.',
          'Cá vàng bơi trong bể nước.',
          'Mẹ khen bé ngoan.',
        ],
      });
    }, 1200);
  };

  const handleSampleImage = () => {
    const sampleUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
    setSelectedImage(sampleUrl);
    simulateOCR(sampleUrl);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Quét Trang Sách Bằng Ảnh (OCR)</h3>
            <p className="text-xs text-slate-500">Tải ảnh trang bài đọc hoặc chụp từ điện thoại</p>
          </div>
        </div>

        <button
          onClick={handleSampleImage}
          className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200/60"
        >
          Dùng ảnh bài đọc mẫu
        </button>
      </div>

      {/* Vùng Dropzone tải ảnh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-purple-50/30 transition-all group min-h-[220px]">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700">Kéo thả ảnh hoặc bấm để chọn</span>
          <span className="text-xs text-slate-400 mt-1">Hỗ trợ PNG, JPG, WebP</span>
        </label>

        {/* Khung Xem trước & Trạng thái Quét */}
        <div className="border border-slate-200/80 rounded-3xl p-5 bg-slate-50 flex flex-col justify-between min-h-[220px]">
          {selectedImage ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedImage}
                  alt="Trang sách preview"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                        <span>Đang nhận diện chữ tiếng Việt...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Đã quét xong (Độ chính xác 96%)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {resultText && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kết quả nhận diện:
                  </div>
                  <p className="text-slate-800 font-bold text-base leading-relaxed">{resultText}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-6">
              <FileText className="w-10 h-10 mb-2 stroke-1 opacity-50" />
              <p className="text-xs font-medium">Chưa có ảnh nào được chọn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
