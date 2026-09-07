import React, { useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { OCRScanResult, OCRProgress } from '../types/index.ts';
import { tesseractOcrService } from '../core/ocr/tesseractService.ts';
import { CameraCapture } from './parent/CameraCapture.tsx';
import { TextProofreader } from './parent/TextProofreader.tsx';

interface OCRUploaderProps {
  onScanComplete?: (result: OCRScanResult) => void;
}

export const OCRUploader: React.FC<OCRUploaderProps> = ({ onScanComplete }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<OCRProgress | null>(null);
  const [scanResult, setScanResult] = useState<OCRScanResult | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isProofreading, setIsProofreading] = useState<boolean>(false);

  // Xử lý khi tải file ảnh từ máy
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      await executeOcr(file, url);
    }
  };

  // Xử lý khi chụp ảnh qua Camera
  const handleCameraCapture = async (blob: Blob, dataUrl: string) => {
    setShowCamera(false);
    setSelectedImage(dataUrl);
    await executeOcr(blob, dataUrl);
  };

  // Dùng ảnh mẫu SGK
  const handleSampleImage = async () => {
    // Ảnh mẫu trang sách tiếng Việt lớp 1
    const sampleUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
    setSelectedImage(sampleUrl);
    await executeOcr(sampleUrl, sampleUrl);
  };

  // Thực thi OCR với Tesseract.js và ImagePreprocessor
  const executeOcr = async (imageSource: Blob | string, previewUrl: string) => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setIsProofreading(false);

    try {
      const result = await tesseractOcrService.scanImage(imageSource, {
        preprocess: true,
        onProgress: (progress) => {
          setScanProgress(progress);
        },
      });

      result.imageUrl = previewUrl;
      setScanResult(result);
      setIsProofreading(true);
      setIsScanning(false);
    } catch (err: any) {
      console.error('Lỗi khi nhận diện ảnh:', err);
      setError(err.message || 'Không thể nhận diện chữ từ ảnh này. Vui lòng thử ảnh rõ nét hơn.');
      setIsScanning(false);
    }
  };

  const handleProofreadSave = (finalText: string) => {
    if (scanResult) {
      const updated: OCRScanResult = {
        ...scanResult,
        sanitizedText: finalText,
        lines: finalText.split('\n').filter((l) => l.trim().length > 0),
      };
      setScanResult(updated);
      setIsProofreading(false);
      onScanComplete?.(updated);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6 animate-fadeIn">
      {/* Modal Camera Live */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-sm">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">
              Quét Trang Sách Tiếng Việt Bằng Ảnh (In-Browser OCR)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Nhận dạng quang học 100% trên thiết bị, bảo mật, lọc bỏ số trang và rác ảnh tự động
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center gap-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Chụp từ Camera</span>
          </button>
          <button
            onClick={handleSampleImage}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-200/60 transition-all cursor-pointer"
          >
            Dùng ảnh mẫu
          </button>
        </div>
      </div>

      {/* Vùng Chọn / Kéo thả ảnh & Khung xem trước */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dropzone */}
        <label className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-purple-50/30 transition-all group min-h-[220px]">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isScanning}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span className="text-sm font-black text-slate-700">Tải ảnh bài đọc từ thiết bị</span>
          <span className="text-xs text-slate-400 mt-1">Hỗ trợ PNG, JPG, WebP (Rõ nét, đủ sáng)</span>
        </label>

        {/* Khung Xem trước & Trạng thái OCR */}
        <div className="border border-slate-200/80 rounded-3xl p-5 bg-slate-50 flex flex-col justify-between min-h-[220px]">
          {selectedImage ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedImage}
                  alt="Trang sách preview"
                  className="w-20 h-20 object-cover rounded-2xl border-2 border-purple-200 shadow-md"
                />
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                        <span>{scanProgress?.status || 'Đang nhận diện chữ tiếng Việt...'}</span>
                      </>
                    ) : error ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-rose-600">Nhận diện thất bại</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Đã quét xong (Độ tin cậy: {Math.round((scanResult?.confidence || 0.95) * 100)}%)</span>
                      </>
                    )}
                  </div>

                  {/* Thanh tiến trình % Tesseract */}
                  {isScanning && scanProgress && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                          style={{ width: `${Math.round((scanProgress.progress || 0) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 block text-right">
                        {Math.round((scanProgress.progress || 0) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông báo lỗi nếu có */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              {/* Kết quả nhanh nếu không ở chế độ proofreading */}
              {scanResult && !isProofreading && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Văn bản đã làm sạch:
                    </span>
                    <button
                      onClick={() => setIsProofreading(true)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer"
                    >
                      Sửa lại
                    </button>
                  </div>
                  <p className="text-slate-800 font-bold text-sm leading-relaxed whitespace-pre-line">
                    {scanResult.sanitizedText}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-6">
              <FileText className="w-10 h-10 mb-2 stroke-1 opacity-50" />
              <p className="text-xs font-bold">Chưa có ảnh trang sách nào được chọn</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bấm tải ảnh hoặc mở Camera để bắt đầu</p>
            </div>
          )}
        </div>
      </div>

      {/* KHUNG RÀ SOÁT CHỈNH SỬA (PROOFREADER) */}
      {isProofreading && scanResult && (
        <TextProofreader
          initialText={scanResult.sanitizedText}
          confidence={scanResult.confidence}
          onSave={handleProofreadSave}
          onCancel={() => setIsProofreading(false)}
        />
      )}
    </div>
  );
};
