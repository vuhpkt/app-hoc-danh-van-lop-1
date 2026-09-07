/**
 * src/core/ocr/imagePreprocessor.ts
 * 
 * Pipeline tiền xử lý ảnh chụp trang sách SGK Lớp 1 trên Canvas (Trình duyệt)
 * - Thu nhỏ kích thước ảnh nếu quá lớn (>2000px) để giảm tải RAM và tăng tốc OCR
 * - Chuyển đổi mức xám (Grayscale)
 * - Tăng độ tương phản (Contrast Enhancement) để chữ in đen nổi bật trên nền giấy
 * - Nhị phân hóa thích nghi (Adaptive Binarization) loại bỏ bóng đổ mờ khi chụp bằng điện thoại
 */

import type { PreprocessOptions } from '../../types/index.ts';

export const DEFAULT_PREPROCESS_OPTIONS: PreprocessOptions = {
  grayscale: true,
  contrast: 1.3,      // Tăng tương phản 30%
  threshold: 140,     // Ngưỡng tách nền trắng và chữ đen
  invert: false,
};

/**
 * Tính toán giá trị pixel sau khi điều chỉnh độ tương phản
 */
export function applyContrast(val: number, contrast: number): number {
  // contrast: 1.0 = giữ nguyên, 1.3 = tăng tương phản 30%
  const factor = (259 * ((contrast - 1) * 255 + 255)) / (255 * (259 - (contrast - 1) * 255));
  const res = factor * (val - 128) + 128;
  return Math.min(255, Math.max(0, Math.round(res)));
}

/**
 * Tính toán giá trị pixel sau khi nhị phân hóa (chữ đen, nền trắng)
 */
export function applyThreshold(grayVal: number, threshold = 128): number {
  return grayVal < threshold ? 0 : 255;
}

/**
 * Tiền xử lý ảnh trực tiếp trên Canvas của trình duyệt
 */
export async function preprocessCanvasImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | Blob | string,
  options: PreprocessOptions = DEFAULT_PREPROCESS_OPTIONS
): Promise<HTMLCanvasElement | HTMLImageElement | Blob | string> {
  // Nếu đang chạy trong môi trường không có DOM/Canvas (vd: Node.js test runner)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return imageSource;
  }

  const {
    grayscale = true,
    contrast = 1.3,
    threshold,
    invert = false,
  } = options;

  let img: HTMLImageElement;

  if (imageSource instanceof HTMLImageElement) {
    img = imageSource;
  } else if (imageSource instanceof HTMLCanvasElement) {
    img = new Image();
    img.src = imageSource.toDataURL();
    await new Promise((resolve) => {
      img.onload = resolve;
    });
  } else if (imageSource instanceof Blob) {
    img = new Image();
    img.src = URL.createObjectURL(imageSource);
    await new Promise((resolve) => {
      img.onload = resolve;
    });
  } else {
    // String URL
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSource;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  }

  // Khởi tạo Canvas làm việc
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSource;

  // Giới hạn chiều dài tối đa 2048px để tối ưu bộ nhớ
  const MAX_DIM = 2048;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Lặp qua từng điểm ảnh (R, G, B, A)
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Chuyển sang mức xám theo độ nhạy quang học chuẩn ITU-R BT.601
    if (grayscale) {
      let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      // 2. Tăng độ tương phản
      if (contrast && contrast !== 1.0) {
        gray = applyContrast(gray, contrast);
      }

      // 3. Nhị phân hóa (Binarization) nếu có chỉ định ngưỡng
      if (threshold !== undefined) {
        gray = applyThreshold(gray, threshold);
      }

      // 4. Đảo màu (nếu cần)
      if (invert) {
        gray = 255 - gray;
      }

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
