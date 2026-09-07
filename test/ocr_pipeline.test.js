import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyContrast,
  applyThreshold,
  preprocessCanvasImage,
} from '../src/core/ocr/imagePreprocessor.ts';
import { tesseractOcrService } from '../src/core/ocr/tesseractService.ts';

test('ImagePreprocessor - Pixel Contrast Function', () => {
  // Middle gray (128) stays neutral
  assert.equal(applyContrast(128, 1.0), 128);

  // When contrast increases (> 1.0), bright pixels (> 128) become brighter
  const bright = applyContrast(200, 1.5);
  assert.ok(bright > 200, 'Bright pixels should get brighter');

  // When contrast increases (> 1.0), dark pixels (< 128) become darker
  const dark = applyContrast(60, 1.5);
  assert.ok(dark < 60, 'Dark pixels should get darker');
});

test('ImagePreprocessor - Thresholding (Binarization)', () => {
  // Below threshold becomes 0 (black text)
  assert.equal(applyThreshold(100, 128), 0);

  // Above threshold becomes 255 (white background)
  assert.equal(applyThreshold(150, 128), 255);
});

test('ImagePreprocessor - Node.js Fallback Passthrough', async () => {
  // In Node.js where DOM canvas is not present, should safely return the original input
  const mockInput = 'data:image/png;base64,mock';
  const result = await preprocessCanvasImage(mockInput);
  assert.equal(result, mockInput);
});

test('TesseractService - Singleton Instance Integrity', () => {
  assert.ok(tesseractOcrService, 'Tesseract service should be defined');
  assert.equal(typeof tesseractOcrService.scanImage, 'function');
  assert.equal(typeof tesseractOcrService.terminate, 'function');
});
