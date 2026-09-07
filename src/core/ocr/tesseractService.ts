/**
 * src/core/ocr/tesseractService.ts
 * 
 * Dịch vụ nhận diện ký tự quang học (OCR) chạy 100% trong trình duyệt (Client-Side)
 * - Tích hợp Tesseract.js WebAssembly với gói ngôn ngữ Tiếng Việt ('vie')
 * - Kết hợp pipeline tiền xử lý ảnh Canvas để nâng cao độ chính xác nhận diện chữ in SGK
 * - Tự động dọn dẹp và chuẩn hóa văn bản qua TextSanitizer
 * - Quản lý vòng đời Web Worker để tái sử dụng, không cần tải lại mô hình nhiều lần
 */

import { createWorker, type Worker } from 'tesseract.js';
import type { OCRProgress, OCRScanResult, PreprocessOptions } from '../../types/index.ts';
import { preprocessCanvasImage, DEFAULT_PREPROCESS_OPTIONS } from './imagePreprocessor.ts';
import { sanitizeOcrText } from './textSanitizer.ts';

export interface RecognizeOptions {
  preprocess?: boolean;
  preprocessOptions?: PreprocessOptions;
  onProgress?: (progress: OCRProgress) => void;
}

export class TesseractOcrService {
  private static instance: TesseractOcrService;
  private worker: Worker | null = null;
  private isInitializing = false;
  private initPromise: Promise<Worker> | null = null;

  private constructor() {}

  public static getInstance(): TesseractOcrService {
    if (!TesseractOcrService.instance) {
      TesseractOcrService.instance = new TesseractOcrService();
    }
    return TesseractOcrService.instance;
  }

  /**
   * Khởi tạo hoặc lấy Web Worker tiếng Việt đang chạy
   */
  public async getWorker(onProgress?: (progress: OCRProgress) => void): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      onProgress?.({
        status: 'Đang tải mô hình nhận diện Tiếng Việt...',
        progress: 0.1,
      });

      const worker = await createWorker('vie', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            onProgress?.({
              status: 'Đang quét và nhận diện chữ...',
              progress: 0.3 + (m.progress || 0) * 0.6, // 30% - 90%
            });
          } else if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
            onProgress?.({
              status: `Đang khởi tạo bộ máy OCR (${m.status})...`,
              progress: 0.15,
            });
          }
        },
      });

      this.worker = worker;
      this.isInitializing = false;
      return worker;
    })();

    return this.initPromise;
  }

  /**
   * Quét ảnh trang sách và trích xuất văn bản tiếng Việt
   */
  public async scanImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | Blob | string,
    options: RecognizeOptions = {}
  ): Promise<OCRScanResult> {
    const {
      preprocess = true,
      preprocessOptions = DEFAULT_PREPROCESS_OPTIONS,
      onProgress,
    } = options;

    onProgress?.({
      status: 'Đang tối ưu độ tương phản hình ảnh...',
      progress: 0.05,
    });

    // 1. Tiền xử lý ảnh trực tiếp trên Canvas
    let processedInput: HTMLCanvasElement | Blob | string | HTMLImageElement = imageSource;
    if (preprocess) {
      try {
        processedInput = await preprocessCanvasImage(imageSource, preprocessOptions);
      } catch (err) {
        console.warn('Không thể tiền xử lý canvas, dùng ảnh gốc:', err);
        processedInput = imageSource;
      }
    }

    // 2. Lấy worker và thực thi OCR
    const worker = await this.getWorker(onProgress);

    onProgress?.({
      status: 'Đang phân tích cấu trúc văn bản...',
      progress: 0.3,
    });

    const ret = await worker.recognize(processedInput as any);
    const rawText = ret.data.text || '';
    const confidence = (ret.data.confidence || 0) / 100;

    onProgress?.({
      status: 'Đang làm sạch và chuẩn hóa ngữ âm...',
      progress: 0.95,
    });

    // 3. Làm sạch văn bản OCR (loại bỏ số trang, header, rác quang học)
    const sanitized = sanitizeOcrText(rawText);

    onProgress?.({
      status: 'Hoàn tất nhận diện trang sách!',
      progress: 1.0,
    });

    let imageUrl: string | undefined;
    if (typeof imageSource === 'string') {
      imageUrl = imageSource;
    } else if (imageSource instanceof Blob) {
      imageUrl = URL.createObjectURL(imageSource);
    }

    return {
      imageUrl,
      rawText,
      sanitizedText: sanitized.cleanedText,
      confidence,
      lines: sanitized.lines,
    };
  }

  /**
   * Giải phóng tài nguyên worker khi không sử dụng
   */
  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initPromise = null;
      this.isInitializing = false;
    }
  }
}

export const tesseractOcrService = TesseractOcrService.getInstance();
