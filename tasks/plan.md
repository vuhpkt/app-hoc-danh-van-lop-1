# Kế Hoạch Triển Khai: App Học Đánh Vần Tiếng Việt Lớp 1 (Kid & Parent Interactive)

## 1. Tổng quan
Kế hoạch triển khai chia nhỏ toàn bộ dự án thành các task độc lập, có thể kiểm chứng (verifiable) với tiêu chí nghiệm thu (acceptance criteria) rõ ràng.  
**Thứ tự ưu tiên cốt lõi theo yêu cầu:**
1. **Ưu tiên số 1:** Trích xuất và chuẩn hóa các âm/vần khó như vần `"uyu"` bằng kỹ thuật bóc tách âm vị tự nhiên (Acoustic Trimming).
2. **Ưu tiên số 2:** Hoàn thiện 100% kho âm thanh chuẩn SGK Kết Nối Tri Thức và đóng gói Audio Sprite hoàn chỉnh.
3. **Ưu tiên số 3:** Tái cấu trúc mã nguồn (Restructuring), tích hợp In-Browser OCR (Tesseract.js) cho phụ huynh nạp bài, và xây dựng giao diện tương tác trực quan 1-chạm cho bé 6 tuổi.

---

## 2. Quyết định Kiến trúc & Tái cấu trúc
- **Tách bạch 2 vai trò người dùng (Separation of Concerns):**
  - `src/components/parent/`: Phụ huynh nạp bài (Dán text / Chụp ảnh OCR), rà soát chính tả.
  - `src/components/kid/`: Màn hình chữ lớn $\ge 36\text{px}$, màu sắc phân biệt `[Âm đầu] - [Vần] - [Thanh]`, tương tác 1-chạm không cản trở.
- **Dịch vụ OCR độc lập (`src/core/ocr/`):** Chạy trên Web Worker riêng biệt bằng `tesseract.js` với model tiếng Việt (`vie`), không làm block main thread và UI 60fps.
- **Acoustic Slicing Engine (`scripts/slice-rare-rimes.js`):** Tự động phát hiện điểm bắt đầu rung thanh (Voicing Onset) trong PCM để cắt bỏ phụ âm đầu (như `kh`), trích xuất chính xác vần khó như `uyu`.

---

## 3. Danh sách Nhiệm vụ (Task List by Phases)

### Phase 1: Trích xuất Âm khó & Hoàn thiện Kho Âm thanh (Ưu tiên Cao nhất)
- [ ] **Task 1: Script Acoustic Slicing trích xuất vần khó "uyu" từ từ "khuyu"**
  - **Mô tả:** Viết script Node.js phân tích tín hiệu PCM của `raw-audio/tu__khuyu_ngang.mp3`, cắt bỏ `~100ms` phụ âm xát `kh` ở đầu, áp dụng Hann Windowing 12ms và hard zero 64 samples ở 2 đầu để tạo ra file `raw-audio/van__uyu.mp3` chuẩn xác 100% của giọng HoaiMy.
  - **Files:** `scripts/slice-rare-rimes.js`, `raw-audio/van__uyu.mp3`, `src/core/audio/SpriteManager.ts`.
  - **Acceptance:** File `van__uyu.mp3` nghe rõ vần "uyu" tự nhiên, không còn tiếng khạc/xát của âm "kh", biên độ mượt mà không click/pop.

- [ ] **Task 2: Audit & Sinh đầy đủ 100% các âm/vần/từ chuẩn SGK Kết Nối Tri Thức**
  - **Mô tả:** Rà soát và cập nhật `scripts/generate-tts-audio.js` để sinh tất cả các âm đầu, vần ghép, tiếng đệm, từ đặc biệt còn thiếu theo SGK (bao gồm `uyu`, `oen`, `oet`, `uyn`, `uyt`, các tiếng mẫu `khuyu`, `khuỷu`, `trương`, `trường`, `quang`, `giặt`...).
  - **Files:** `scripts/generate-tts-audio.js`, `danh_muc_am_thanh_lop_1.md`.
  - **Acceptance:** Thư mục `raw-audio/` có đầy đủ 100% các file `.mp3` âm vị theo chuẩn danh mục sư phạm.

- [ ] **Task 3: Đóng gói lại Audio Sprite Master & Cập nhật Audio Map**
  - **Mô tả:** Chạy `scripts/build-audio-sprite.js` để tự động bóc tách -52dB decay tail, Hann windowing 12ms, đóng gói thành `public/audio/sprite-main.mp3`, `sprite-main.webm` và `audio-map.json`.
  - **Files:** `scripts/build-audio-sprite.js`, `public/audio/audio-map.json`, `public/audio/sprite-main.mp3`.
  - **Acceptance:** `audio-map.json` chứa đầy đủ thông tin offset của toàn bộ âm vị (bao gồm `van__uyu`), thời lượng và bắt đầu chính xác.

- [ ] **Task 4: Unit Test kiểm thử Phonics Parser & Sprite Mapping cho từ khó**
  - **Mô tả:** Viết script kiểm thử tự động bóc tách ngữ âm và resolve sprite key cho các trường hợp đặc biệt: `khuỷu`, `trường`, `quốc`, `gì`, `áo`, `uống`, `yêu`.
  - **Files:** `scripts/test-phonics-suite.js` hoặc `src/core/parser/__tests__/phonics.test.ts`.
  - **Acceptance:** 100% các từ kiểm tra đều sinh đúng công thức đánh vần và tìm thấy audio clip trong sprite map.

### ─── CHECKPOINT 1: Kho âm thanh hoàn chỉnh & Âm khó "uyu" hoạt động 100% ───

---

### Phase 2: Tái Cấu Trúc Mã Nguồn & Tích Hợp In-Browser OCR
- [ ] **Task 5: Tái cấu trúc thư mục Components & Types**
  - **Mô tả:** Tái cấu trúc dự án thành các thư mục rõ ràng: `src/components/kid/`, `src/components/parent/`, `src/components/shared/`, `src/core/ocr/`. Cập nhật các types cần thiết.
  - **Files:** `src/types/index.ts`, tái tổ chức thư mục `src/components/`.
  - **Acceptance:** `npm run build` thành công, không có đường dẫn import nào bị gãy.

- [ ] **Task 6: Tích hợp Tesseract.js Worker & Tiền xử lý ảnh Canvas**
  - **Mô tả:** Cài đặt `tesseract.js`, tạo module `src/core/ocr/tesseractService.ts` khởi tạo Web Worker với ngôn ngữ `vie`. Tích hợp xử lý Canvas Grayscale và tăng tương phản để nâng cao độ chính xác nhận diện.
  - **Files:** `package.json`, `src/core/ocr/tesseractService.ts`, `src/core/ocr/textSanitizer.ts`.
  - **Acceptance:** Hàm `recognizeVietnamesePage(image)` nhận diện ra chữ tiếng Việt có dấu, báo tiến trình % theo thời gian thực mà không làm đơ giao diện.

- [ ] **Task 7: Xây dựng Giao diện Phụ huynh Nạp bài (LessonInputModal & Proofreader)**
  - **Mô tả:** Xây dựng modal nạp bài cho phụ huynh: Tab 1 dán văn bản / gõ chữ, Tab 2 chụp ảnh hoặc tải ảnh sách. Có khung sửa nhanh văn bản (TextProofreader) và nút bấm to rõ *"Bắt đầu cho bé học"*.
  - **Files:** `src/components/parent/LessonInputModal.tsx`, `src/components/parent/TextProofreader.tsx`.
  - **Acceptance:** Phụ huynh chụp/dán bài đọc, sửa nhanh nếu cần và chuyển dữ liệu sang bài học chỉ với 1 cú nhấp.

### ─── CHECKPOINT 2: Nạp bài và OCR In-Browser hoạt động trơn tru ───

---

### Phase 3: Giao Diện Học Tập Tương Tác Dành Riêng Cho Bé 6 Tuổi
- [ ] **Task 8: Xây dựng Bảng Bài Đọc Chữ Lớn & Thẻ Từ Tương Tác (KidReaderBoard & WordBubble)**
  - **Mô tả:** Tạo giao diện bài đọc với cỡ chữ lớn $\ge 36\text{px}$, font chữ thân thiện trẻ nhỏ. Mỗi từ là một `WordBubble` có hiệu ứng nhún nhảy khi hover/chạm. Khi bé chạm vào từ, phát tiếng pop vui tai và hiển thị khung bóc tách `[Âm đầu]` (xanh), `[Vần]` (cam), `[Thanh]` (đỏ) kèm công thức đánh vần.
  - **Files:** `src/components/kid/KidReaderBoard.tsx`, `src/components/kid/WordBubble.tsx`, `src/components/kid/PhonicsBadgeModal.tsx`.
  - **Acceptance:** Bé chạm vào từ bất kỳ thì từ đó phóng to, nghe đánh vần từng bước mượt mà, phản hồi lập tức.

- [ ] **Task 9: Thanh Điều Khiển Học Sinh & Chế độ Đọc Mẫu Toàn Bài (KidControlBar & Karaoke)**
  - **Mô tả:** Xây dựng thanh điều khiển đơn giản hóa cho bé: Nút Play/Pause lớn, nút chuyển giữa "Đọc trơn cả bài" và "Đánh vần từng từ cả bài", nút chọn tốc độ đọc chậm rãi (0.5x, 0.7x, 1.0x).
  - **Files:** `src/components/shared/KidControlBar.tsx`, `src/pages/KidLearningPage.tsx`.
  - **Acceptance:** Ở chế độ Karaoke, vệt sáng chạy nhịp nhàng qua từng từ với tốc độ chuẩn sư phạm, giọng đọc tự nhiên không click/pop.

- [ ] **Task 10: Tích hợp trang chính App.tsx & Chuyển đổi linh hoạt giữa Chế độ Học và Sandbox**
  - **Mô tả:** Đặt `KidLearningPage.tsx` làm giao diện mặc định cho người dùng; giữ lại `Playground.tsx` ở một nút kín góc trên cho nhà phát triển/kiểm thử kỹ thuật.
  - **Files:** `src/App.tsx`, `src/pages/KidLearningPage.tsx`.
  - **Acceptance:** Khi mở ứng dụng, màn hình hiện ngay bài đọc sinh động của bé với nút "Nạp bài mới" cho phụ huynh.

### ─── CHECKPOINT 3: Toàn bộ luồng Người dùng Bé & Phụ huynh hoạt động hoàn chỉnh ───

---

### Phase 4: Kiểm Thử Đóng Gói & Tối Ưu Hóa Thiết Bị Di Động
- [ ] **Task 11: Tối ưu tương thích Trình duyệt Di động (Mobile/Tablet)**
  - **Mô tả:** Kiểm tra và hoàn thiện cơ chế tự động unlock AudioContext trên iOS Safari & Android Chrome khi có tương tác chạm đầu tiên. Đảm bảo layout co giãn responsive hoàn hảo trên iPad và điện thoại.
  - **Files:** `src/core/audio/WebAudioEngine.ts`, `src/index.css`.
  - **Acceptance:** Ứng dụng phát âm thanh chuẩn ngay lần chạm đầu tiên trên iPhone/iPad/Android mà không bị chặn autoplay.

- [ ] **Task 12: Production Build & E2E Verification**
  - **Mô tả:** Chạy kiểm tra toàn diện `npm run build`, đo đạc bundle size và thời gian tải trang.
  - **Files:** Toàn bộ dự án.
  - **Acceptance:** `npm run build` hoàn thành với 0 lỗi, kích thước bundle tối ưu, ứng dụng sẵn sàng triển khai.

---

## 4. Ma trận Rủi ro & Giải pháp (Risks & Mitigations)

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|---|---|---|
| Cắt âm vị `uyu` từ `khuyu` bị sót âm xát `kh` hoặc bị hụt vần | Trung bình | Dùng thuật toán phát hiện điểm khởi phát thanh tính (Voicing Onset) dựa trên biên độ và chu kỳ dao động của sóng âm, kiểm tra bằng tai người trước khi đưa vào sprite. |
| Model OCR `vie.traineddata` tải chậm trên mạng yếu | Thấp | Tesseract.js tự động cache model vào IndexedDB của trình duyệt sau lần tải đầu tiên; hiển thị thanh tiến trình rõ ràng cho phụ huynh. |
| Trẻ chạm liên tục nhiều từ gây giật lag âm thanh | Trung bình | `SpriteManager.stop()` xả âm lượng GainNode về 0 trong 3ms trước khi phát clip mới, bảo vệ AudioContext không bị quá tải. |
