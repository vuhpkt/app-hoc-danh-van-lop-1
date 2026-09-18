import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertTriangle, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob, dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<{ blob: Blob; url: string } | null>(null);

  // Khởi chạy camera sau (environment) cho điện thoại hoặc webcam cho laptop
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        setIsLoading(true);
        setError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập Camera (cần HTTPS hoặc localhost).');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLoading(false);
      } catch (err: any) {
        if (!active) return;
        console.error('Lỗi mở Camera:', err);
        setError(err.message || 'Không thể mở Camera. Vui lòng cấp quyền truy cập Camera trên thiết bị.');
        setIsLoading(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Chụp ảnh từ khung hình video hiện tại
  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedPreview({ blob, url });
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Thu hồi Object URL khi unmount component để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (capturedPreview?.url) {
        URL.revokeObjectURL(capturedPreview.url);
      }
    };
  }, [capturedPreview]);

  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview.blob, capturedPreview.url);
    }
  };

  const handleRetake = () => {
    if (capturedPreview?.url) {
      URL.revokeObjectURL(capturedPreview.url);
    }
    setCapturedPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 md:p-6 backdrop-blur-md animate-fadeIn">
      {/* Header điều khiển */}
      <div className="w-full max-w-2xl flex items-center justify-between text-white pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-400" />
          <span className="font-black text-sm">Chụp Ảnh Trang Sách SGK</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Vùng Viewfinder xem trước */}
      <div className="w-full max-w-2xl flex-1 flex items-center justify-center relative overflow-hidden rounded-3xl bg-slate-900 border border-white/10">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 text-white">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
            <span className="text-xs font-bold">Đang kết nối Camera...</span>
          </div>
        )}

        {error && (
          <div className="p-6 text-center max-w-md text-white space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-slate-200">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl"
            >
              Đóng và chọn tải file ảnh thay thế
            </button>
          </div>
        )}

        {/* Video stream thực tế */}
        {!capturedPreview && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isLoading || error ? 'hidden' : 'block'}`}
          />
        )}

        {/* Xem trước ảnh vừa chụp */}
        {capturedPreview && (
          <img
            src={capturedPreview.url}
            alt="Captured page"
            className="w-full h-full object-contain"
          />
        )}

        {/* Khung ngắm định vị trang sách */}
        {!isLoading && !error && !capturedPreview && (
          <div className="absolute inset-8 md:inset-12 border-2 border-dashed border-purple-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
            <div className="text-[11px] font-bold text-purple-200 bg-purple-900/60 backdrop-blur-sm self-center px-3 py-1 rounded-full border border-purple-400/30">
              Căn chỉnh trang sách vuông góc trong khung này
            </div>
            <div className="text-[10px] text-white/70 text-center bg-black/40 px-2 py-0.5 rounded-md self-center">
              Tránh bóng sấp & ánh sáng chói lóa
            </div>
          </div>
        )}
      </div>

      {/* Thanh nút bấm chụp / xác nhận */}
      <div className="w-full max-w-2xl pt-4 flex items-center justify-center gap-4">
        {!capturedPreview ? (
          <button
            onClick={handleSnap}
            disabled={isLoading || !!error}
            className="w-16 h-16 rounded-full border-4 border-white bg-purple-600 hover:bg-purple-700 active:scale-90 transition-all flex items-center justify-center text-white shadow-2xl cursor-pointer disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full border-2 border-purple-300 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-4 animate-fadeIn">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Chụp lại</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Dùng ảnh này để quét</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
