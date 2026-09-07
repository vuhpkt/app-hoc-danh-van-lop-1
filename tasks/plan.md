# Kế Hoạch Triển Khai Chi Tiết: Các Giai Đoạn Còn Lại (Phase 2, 3, 4)
## App Học Đánh Vần Tiếng Việt Lớp 1 (Kết Nối Tri Thức)

---

## 1. Tổng Quan Kiến Trúc & Định Hướng Kiểm Thử

Hệ thống đã hoàn tất 100% Phase 1 (chuẩn hóa ngữ âm sư phạm, tải 225 clip Zalo AI TTS sạch, đóng gói Audio Sprite Master và pass 18/18 unit test tự động).

### Nguyên tắc Phân định Kiểm thử (Verification Strategy)
Theo yêu cầu chỉ đạo:
1. **Kiểm thử Tự động (Agent Autonomous Verification):**
   - Áp dụng cho toàn bộ phần việc **không liên quan đến cảm thụ âm thanh**:
     - Kiểm tra kiểu dữ liệu TypeScript và build bundle (`npm run build`).
     - Kiểm tra thuật toán làm sạch văn bản OCR (`test/ocr_sanitizer.test.js`).
     - Kiểm tra cấu trúc phân rã ngữ âm logic (`test/audio_pedagogy.test.js`).
     - Kiểm tra tích hợp module và render component.
2. **Kiểm thử Người dùng qua Playground (User Interactive Verification via Audio Playground):**
   - Áp dụng cho toàn bộ phần việc **liên quan đến âm thanh và phát âm**:
     - Phát âm từng âm vị (26 âm đầu, 44 vần $p, t, c, ch$, 6 thanh, vần hiếm `uyu`).
     - Độ chuẩn xác và tự nhiên của công thức đánh vần (đặc biệt tiếng đệm sắc `giắt`, `hóc`, `vít` trong từ thanh nặng).
     - Nhịp điệu ngắt nghỉ và độ mượt khi đọc câu, đọc bài (Karaoke highlight đồng bộ 60fps).
   - **Giải pháp:** Cung cấp ngay một **Audio & Phonics Playground** trực quan, tiện lợi, tích hợp sẵn các công cụ điều khiển (chọn từ mẫu, gõ từ tùy ý, nút phát từng bước, chỉnh tốc độ 0.75x - 1.25x, visualizer sóng âm) để người dùng có thể nghe và nghiệm thu trực tiếp trên trình duyệt bất cứ lúc nào.

---

## 2. Sơ Đồ Phụ Thuộc (Dependency Graph)

```
[Phase 1: Audio Dataset & Sprite Master] (ĐÃ HOÀN THÀNH 100%)
                     │
    ┌────────────────┴────────────────┐
    ▼                                 ▼
[Phase 2: In-Browser OCR]        [Task 10: Nâng Cấp Playground Kiểm Âm]
(Nạp bài & Rà soát)                           │ (User Test Audio & Formula)
    │                                         │
    └────────────────┬────────────────────────┘
                     ▼
       [Phase 3: Giao Diện Bé Học]
       (KidReaderBoard, WordBubble, Karaoke)
                     │
                     ▼
       [Phase 4: Mobile & Production]
       (Touch unlock, Responsive, PWA)
```

---

## 3. Danh Sách Nhiệm Vụ Phân Rã (Vertical Slices)

### Phase 2: In-Browser OCR & Quản Lý Nạp Bài Phụ Huynh

#### Task 6: Tái cấu trúc Types và Thư mục Kiến trúc Chuẩn
- **Mô tả:** Cập nhật `src/types/index.ts` để bổ sung các định nghĩa cho OCR, Lesson, Trạng thái bài học, và tách cấu trúc thư mục thành `src/components/kid/`, `src/components/parent/`, `src/components/shared/`, `src/core/ocr/`.
- **Phân loại kiểm thử:** Agent tự test (`npm run build`).
- **Files touched:** `src/types/index.ts`.
- **Quy mô:** S (1 file).

#### Task 7: Engine OCR Client-Side & Canvas Tiền Xử Lý Ảnh
- **Mô tả:** Tích hợp `tesseract.js` chạy trên Web Worker tiếng Việt (`vie`), xây dựng module xử lý ảnh Canvas (Grayscale, tăng Contrast, Otsu/Static Binarization) giúp ảnh chụp SGK rõ nét trước khi nhận dạng.
- **Phân loại kiểm thử:** Agent tự test (`npm run build`, benchmark canvas).
- **Files touched:** `package.json`, `src/core/ocr/tesseractService.ts`.
- **Quy mô:** M (2 files).

#### Task 8: Bộ Lọc Chuẩn Hóa Văn Bản OCR (`textSanitizer.ts`) & Unit Test
- **Mô tả:** Xây dựng logic làm sạch văn bản nhận dạng: loại bỏ số trang (`Trang 45`, `45.`), lọc ký tự rác ngoài bảng chữ cái tiếng Việt, chuẩn hóa khoảng trắng và ngắt dòng thơ. Viết bộ unit test tự động.
- **Phân loại kiểm thử:** Agent tự test (`npm test` -> `test/ocr_sanitizer.test.js`).
- **Files touched:** `src/core/ocr/textSanitizer.ts`, `test/ocr_sanitizer.test.js`.
- **Quy mô:** S (2 files).

#### Task 9: Giao Diện Nạp Bài & Rà Soát Dành Cho Phụ Huynh
- **Mô tả:** Xây dựng modal nạp bài gồm 2 tab (Dán văn bản trực tiếp & Chụp/tải ảnh OCR) kèm giao diện sửa nhanh (`TextProofreader.tsx`) trước khi kích hoạt bài học cho bé.
- **Phân loại kiểm thử:** Agent tự test (`npm run build`, component render test).
- **Files touched:** `src/components/parent/LessonInputModal.tsx`, `src/components/parent/CameraCapture.tsx`, `src/components/parent/TextProofreader.tsx`.
- **Quy mô:** M (3 files).

### ── Checkpoint 2: Nạp bài và OCR hoạt động trơn tru (Agent tự test build & logic) ──

---

### Phase 3: Giao Diện Học Tập 1-Chạm & Audio Playground Kiểm Thử Âm Thanh

#### Task 10: Nâng Cấp Audio & Phonics Testing Playground (Dành riêng cho Người Dùng Kiểm Âm)
- **Mô tả:** Nâng cấp trang `src/pages/Playground.tsx` thành phòng thí nghiệm âm thanh hoàn chỉnh để người dùng kiểm thử phát âm:
  1. *Bảng kiểm âm vị:* Bấm nghe trực tiếp 225 âm vị (âm đầu, vần $p, t, c, ch$, vần mở, 6 thanh, vần `uyu`).
  2. *Bộ kiểm tra từ & tiếng đệm:* Nhập từ tùy ý, bấm nghe từng bước trong công thức hoặc nghe toàn bộ với thanh trượt chỉnh tốc độ.
  3. *Bộ kiểm tra bài đọc:* Chọn bài văn/thơ mẫu, phát kiểm tra nhịp điệu đọc câu và highlight chữ.
- **Phân loại kiểm thử:** **NGƯỜI DÙNG TRỰC TIẾP KIỂM THỬ TRÊN TRÌNH DUYỆT.**
- **Files touched:** `src/pages/Playground.tsx`.
- **Quy mô:** M (1 file lớn).

#### Task 11: Bảng Bài Đọc Chữ Lớn & Thẻ Từ Tương Tác 1-Chạm (Dành cho Bé)
- **Mô tả:** Xây dựng giao diện học bài cho trẻ 6 tuổi: chữ hiển thị $\ge 36\text{px}$, hiệu ứng tương tác 1-chạm vào từ để phóng to và xem huy hiệu màu phân tách `[Âm đầu] - [Vần] - [Thanh]`.
- **Phân loại kiểm thử:** Agent tự test giao diện (`npm run build`), Người dùng tương tác nghe âm thanh.
- **Files touched:** `src/components/kid/KidReaderBoard.tsx`, `src/components/kid/WordBubble.tsx`, `src/components/kid/PhonicsBadgeModal.tsx`.
- **Quy mô:** M (3 files).

#### Task 12: Thanh Điều Khiển Của Bé & Đồng Bộ Karaoke 60fps
- **Mô tả:** Xây dựng thanh điều khiển trực quan (nút Play/Stop lớn, chọn chế độ "Đánh vần từng từ" hoặc "Đọc trôi chảy") và kết nối với `AudioSpritePlayer.ts` để đồng bộ nhịp nhảy Karaoke 60fps theo thời gian thực.
- **Phân loại kiểm thử:** **NGƯỜI DÙNG KIỂM THỬ ÂM THANH & NHỊP ĐIỆU TRÊN PLAYGROUND / APP.**
- **Files touched:** `src/components/shared/KidControlBar.tsx`, `src/core/audio/AudioSpritePlayer.ts`.
- **Quy mô:** M (2 files).

#### Task 13: Ghép Nối Trang Học Chính & Bộ Chuyển Đổi Chế Độ Học / Kiểm Thử
- **Mô tả:** Xây dựng `KidLearningPage.tsx` tích hợp đầy đủ luồng từ Phụ huynh nạp bài đến Bé đọc bài; cập nhật `App.tsx` có nút chuyển đổi linh hoạt giữa "Màn Hình Bé Học" và "Playground Kiểm Thử Âm Thanh".
- **Phân loại kiểm thử:** Agent tự test build, Người dùng trải nghiệm toàn luồng.
- **Files touched:** `src/pages/KidLearningPage.tsx`, `src/App.tsx`.
- **Quy mô:** S (2 files).

### ── Checkpoint 3: Toàn bộ luồng học và công cụ kiểm thử âm thanh hoàn chỉnh ──

---

### Phase 4: Tối Ưu Hóa Thiết Bị Di Động & Kiểm Thử Tổng Thể

#### Task 14: Tối Ưu Mobile Touch & Web Audio Auto-Unlock
- **Mô tả:** Xử lý rào cản Autoplay trên Safari iOS và Chrome Android (mở khóa `AudioContext` ngay ở cú chạm đầu tiên), hỗ trợ cử chỉ vuốt và responsive hoàn hảo trên iPad/điện thoại.
- **Phân loại kiểm thử:** Agent tự test code guard, Người dùng test trên thiết bị thật.
- **Files touched:** `src/core/audio/WebAudioEngine.ts`, `src/index.css`.
- **Quy mô:** S (2 files).

#### Task 15: Kiểm Thử Toàn Bộ Test Suite & Production Build Cuối Cùng
- **Mô tả:** Chạy toàn bộ các bộ test tự động (ngữ âm, OCR sanitizer, sprite resolution, build type check), kiểm tra dung lượng gói bundle, tối ưu hóa asset caching.
- **Phân loại kiểm thử:** Agent tự test (`npm test`, `npm run build`).
- **Files touched:** `package.json`, `test/`.
- **Quy mô:** S (1-2 files).

### ── Checkpoint 4: Ứng dụng sẵn sàng phát hành chính thức ──

---

## 4. Ma Trận Rủi Ro & Biện Pháp Kiểm Soát

| Rủi ro | Mức độ | Biện pháp kiểm soát |
|---|---|---|
| Tesseract Worker tải chậm ở lần đầu tiên | Trung bình | Hiển thị thanh tiến độ %, lưu cache mô hình `vie` trong IndexedDB/CacheStorage của trình duyệt. |
| Ảnh chụp SGK bị tối hoặc mờ | Trung bình | Bộ lọc tiền xử lý Canvas nâng tương phản và nhị phân hóa trước khi đưa vào nhận diện. |
| Người dùng cần kiểm tra kỹ từng âm trước khi giao cho bé | Cao | Cung cấp sẵn Playground kiểm âm chi tiết ngay từ Task 10, người dùng có thể test độc lập mọi từ ngữ. |
| AudioContext bị mute trên iOS Safari | Cao | Cơ chế Touch Unlock đa sự kiện (`touchstart`, `touchend`, `click`) tại WebAudioEngine. |
