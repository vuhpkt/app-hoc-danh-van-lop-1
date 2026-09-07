# Danh Sách Nhiệm Vụ (Task List) - App Học Đánh Vần Tiếng Việt Lớp 1

> **Nguồn đặc tả:** [SPEC.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/SPEC.md)  
> **Kế hoạch chi tiết:** [tasks/plan.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/tasks/plan.md)  
> **Nguyên tắc phân định kiểm thử:**  
> - **Test tự động (Agent thực hiện):** Build type check, thuật toán làm sạch OCR regex, unit test bóc tách logic, DOM render.  
> - **Test âm thanh (Người dùng kiểm thử):** Tích hợp Playground trực quan để người dùng tự do nghe phát âm, kiểm tra từng bước công thức, tiếng đệm và nhịp điệu đọc bài.

---

## Phase 1: Chuẩn Hóa Ngữ Âm Sư Phạm & Hoàn Thiện Kho Âm Thanh Sạch [ĐÃ HOÀN THÀNH 100%]
- [x] Task 1: Rà soát & Chuẩn hóa Danh mục Âm thanh Sư phạm (`danh_muc_am_thanh_lop_1.md`)
- [x] Task 2: Tái cấu trúc Bộ máy Bóc tách Ngữ âm (`vietnamesePhonics.ts`) theo Chuẩn $p, t, c, ch$
- [x] Task 3: Cập nhật Script Zalo AI TTS & Thu Âm Lại Toàn Bộ Âm Chuẩn Không Rác
- [x] Task 4: Cập nhật SpriteManager Mapping & Đóng gói Audio Sprite Master mới
- [x] Task 5: Xây dựng Bộ Test Suite Tự Động Toàn Diện (`test/audio_pedagogy.test.js`)
### ── Checkpoint 1: Kho âm thanh hoàn chỉnh & Sạch 100% âm rác [ĐẠT] ──

---

## Phase 2: Tái Cấu Trúc Mã Nguồn & In-Browser OCR Cho Phụ Huynh

### Task 6: Tái cấu trúc Types và Modular Directory Architecture
- **Mô tả:** Cập nhật `src/types/index.ts` để bổ sung type definitions hoàn chỉnh cho Bài học (`Lesson`), Tiến trình OCR (`OCRProgress`, `OCRScanResult`), Cấu hình tiền xử lý (`PreprocessOptions`), Trạng thái điều khiển (`KidReaderState`). Chuẩn bị các thư mục `src/components/kid/`, `src/components/parent/`, `src/components/shared/`, `src/core/ocr/`.
- **Acceptance Criteria:**
  - [ ] `src/types/index.ts` định nghĩa đầy đủ interfaces cho Lesson, OCR, PhonicsBadge, Karaoke.
  - [ ] Không có circular dependencies giữa các module.
  - [ ] Codebase hiện tại compile hoàn toàn sạch.
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` (`tsc -b && vite build`) thành công 100%, 0 lỗi type.
- **Dependencies:** Checkpoint 1.
- **Files touched:** `src/types/index.ts`.
- **Estimated scope:** S (1 file).

### Task 7: Tích hợp Tesseract.js Web Worker & Canvas Image Preprocessing
- **Mô tả:** Cài đặt `tesseract.js`, tạo singleton `src/core/ocr/tesseractService.ts` quản lý Worker với ngôn ngữ `vie`. Xây dựng pipeline xử lý ảnh trên HTML Canvas (Grayscale, tăng độ tương phản Contrast Boost, Binarization thích nghi) để văn bản trong ảnh chụp SGK tương phản tối đa trước khi đưa vào OCR.
- **Acceptance Criteria:**
  - [ ] `tesseractService.ts` khởi tạo Worker an toàn, hỗ trợ callback theo dõi tiến độ quét (0 - 100%).
  - [ ] Hàm tiền xử lý ảnh Canvas xuất ra ảnh nhị phân rõ nét, loại bỏ bóng mờ nền trang sách.
  - [ ] Quá trình OCR chạy ngầm trên Web Worker, không gây đơ/lag Main UI Thread.
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` thành công, module canvas test pass với mock context.
- **Dependencies:** Task 6.
- **Files touched:** `package.json`, `src/core/ocr/tesseractService.ts`.
- **Estimated scope:** M (2 files).

### Task 8: Bộ Lọc Chuẩn Hóa Văn Bản OCR (`textSanitizer.ts`) & Unit Test Tự Động
- **Mô tả:** Xây dựng `src/core/ocr/textSanitizer.ts` chuyên lọc sạch rác nhận dạng: loại bỏ số trang (`Trang 45`, `45.`), lọc ký tự lạ/icon nhiễu ngoài bảng chữ cái tiếng Việt, chuẩn hóa khoảng trắng kép, bảo toàn ngắt dòng câu thơ tự nhiên. Viết bài kiểm thử tự động `test/ocr_sanitizer.test.js`.
- **Acceptance Criteria:**
  - [ ] Chuỗi chứa số trang `"Trang 25. Bé đi học"` được lọc sạch thành `"Bé đi học"`.
  - [ ] Giữ nguyên 100% dấu câu tiếng Việt chuẩn (`.`, `,`, `?`, `!`, `-`, `"`).
  - [ ] Bảo toàn cấu trúc xuống dòng của các bài thơ lớp 1 (thơ 4 chữ, 5 chữ).
- **Verification:**
  - [ ] *Agent tự test:* `npm test` pass toàn bộ các case trong `test/ocr_sanitizer.test.js`.
- **Dependencies:** Task 6.
- **Files touched:** `src/core/ocr/textSanitizer.ts`, `test/ocr_sanitizer.test.js`.
- **Estimated scope:** S (2 files).

### Task 9: Xây dựng Giao Diện Nạp Bài Cho Phụ Huynh (`LessonInputModal` & `Proofreader`)
- **Mô tả:** Xây dựng modal nạp bài thân thiện cho phụ huynh gồm 2 chế độ: (1) Dán trực tiếp đoạn văn bản / Chọn bài mẫu SGK có sẵn; (2) Tải ảnh chụp trang sách / Chụp qua camera (`CameraCapture.tsx`) kèm thanh tiến độ OCR thời gian thực và khung rà soát sửa nhanh (`TextProofreader.tsx`) trước khi kích hoạt bài học.
- **Acceptance Criteria:**
  - [ ] Phụ huynh có thể gõ/dán văn bản hoặc tải ảnh chụp bài đọc.
  - [ ] Có thanh progress bar hiển thị phần trăm khi OCR đang chạy.
  - [ ] Cho phép phụ huynh rà soát và chỉnh sửa từng chữ trước khi bấm "Vào học".
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` thành công, kiểm tra luồng component props.
  - [ ] *User kiểm thử UI:* Mở modal, dán thử văn bản bài đọc, sửa chữ trong khung rà soát.
- **Dependencies:** Task 7, Task 8.
- **Files touched:**
  - `src/components/parent/LessonInputModal.tsx`
  - `src/components/parent/CameraCapture.tsx`
  - `src/components/parent/TextProofreader.tsx`
- **Estimated scope:** M (3 files).

### ── Checkpoint 2: Phụ huynh nạp bài & OCR in-browser hoạt động trơn tru ──
- [ ] Agent: Tất cả test tự động (`npm test`) và build (`npm run build`) pass sạch.
- [ ] User: Có thể mở modal, nạp văn bản hoặc quét ảnh để nạp bài tập đọc.

---

## Phase 3: Giao Diện Bé Học 1-Chạm & Playground Kiểm Thử Âm Thanh Cho Người Dùng

### Task 10: Nâng Cấp Audio & Phonics Testing Playground (User Kiểm Thử Âm Thanh)
- **Mô tả:** Nâng cấp toàn diện `src/pages/Playground.tsx` thành trung tâm kiểm thử âm thanh sư phạm để **người dùng trực tiếp nghe, kiểm tra và thẩm định chất lượng phát âm**:
  1. *Tab 1 - Phoneme Auditor:* Bảng lưới phân loại 225 âm vị Zalo AI (âm đầu, vần $p, t, c, ch$, vần mở, thanh điệu, vần `uyu`). Bấm vào âm nào nghe ngay âm đó.
  2. *Tab 2 - Spelling Formula Auditor:* Ô nhập từ bất kỳ (ví dụ `giặt`, `học`, `vịt`, `quốc`, `chuột`, `trường`), hiển thị công thức từng bước, có nút "Nghe từng bước", "Nghe tiếng đệm sắc", "Nghe toàn bộ", và thanh trượt tốc độ (0.75x, 1.0x, 1.25x).
  3. *Tab 3 - Rhythm & Sentence Auditor:* Chọn bài văn mẫu hoặc gõ câu văn, bấm phát để kiểm tra độ trơn tru, không click/pop và nhịp đồng bộ của câu.
- **Acceptance Criteria:**
  - [ ] Giao diện Playground trực quan, dễ thao tác, hiển thị đầy đủ 225 âm vị.
  - [ ] Bấm bất kỳ âm vị hoặc bước công thức nào đều phát âm thanh tức thì qua AudioContext.
  - [ ] Người dùng có thể thẩm âm từng tiếng đệm sắc (`giắt`, `hóc`, `vít`) trong từ thanh nặng.
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` thành công.
  - [ ] **NGƯỜI DÙNG KIỂM THỬ TRỰC TIẾP TRÊN TRÌNH DUYỆT:** Mở Playground, bấm nghe các âm vị và gõ các từ khó để kiểm tra phát âm.
- **Dependencies:** Checkpoint 1.
- **Files touched:** `src/pages/Playground.tsx`.
- **Estimated scope:** M (1 file lớn).

### Task 11: Bảng Bài Đọc Chữ Lớn & Thẻ Từ Tương Tác 1-Chạm (`KidReaderBoard` & `WordBubble`)
- **Mô tả:** Xây dựng giao diện học bài tối ưu cho trẻ 6 tuổi: chữ hiển thị kích thước lớn ($\ge 36\text{px}$), font bo tròn dễ đọc. Mỗi từ là một `WordBubble` có hiệu ứng nhún nhảy vui mắt. Chạm vào từ sẽ kích hoạt `PhonicsBadgeModal` phóng to hiển thị huy hiệu 3 màu: `[Âm đầu - Xanh]` + `[Vần - Cam]` + `[Thanh - Tím]` và phát âm thanh đánh vần.
- **Acceptance Criteria:**
  - [ ] Chữ hiển thị rõ ràng, tương phản cao, chống mỏi mắt cho trẻ.
  - [ ] Chạm 1 lần vào bất kỳ từ nào là mở popup bóc tách và phát âm thanh từ đó.
  - [ ] Màu sắc huy hiệu phân tách rõ ràng âm đầu, vần và thanh điệu.
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` thành công.
  - [ ] *User kiểm thử âm thanh & tương tác:* Chạm vào từng từ trên bảng bài đọc để nghe phát âm.
- **Dependencies:** Task 10.
- **Files touched:**
  - `src/components/kid/KidReaderBoard.tsx`
  - `src/components/kid/WordBubble.tsx`
  - `src/components/kid/PhonicsBadgeModal.tsx`
- **Estimated scope:** M (3 files).

### Task 12: Thanh Điều Khiển Của Bé & Chế Độ Karaoke 60fps
- **Mô tả:** Xây dựng `KidControlBar.tsx` với các nút điều khiển lớn, biểu tượng vui nhộn (Bắt đầu đọc, Tạm dừng, Chọn chế độ: "Đọc trôi chảy" hoặc "Đánh vần từng từ"). Kết nối với `AudioSpritePlayer.ts` để đồng bộ vệt sáng Karaoke highlight từng từ mượt mà theo nhịp 60fps qua `requestAnimationFrame`.
- **Acceptance Criteria:**
  - [ ] Khi bấm "Đọc toàn bài", âm thanh phát liên tục từ đầu đến cuối bài theo đúng nhịp.
  - [ ] Vệt highlight Karaoke nhảy chính xác tới từ đang được phát âm, không bị lệch pha.
  - [ ] Nút Tạm dừng/Dừng phản hồi ngay lập tức, ngắt âm thanh êm ái (fade-out 20ms) không click.
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` thành công.
  - [ ] **NGƯỜI DÙNG KIỂM THỬ TRÊN PLAYGROUND / UI:** Bấm phát toàn bài và thẩm định nhịp điệu đọc cũng như vệt highlight Karaoke.
- **Dependencies:** Task 11.
- **Files touched:**
  - `src/components/shared/KidControlBar.tsx`
  - `src/core/audio/AudioSpritePlayer.ts`
- **Estimated scope:** M (2 files).

### Task 13: Ghép Nối Trang Học Chính & Bộ Chuyển Đổi Chế Độ Bé Học / Playground
- **Mô tả:** Xây dựng `KidLearningPage.tsx` tích hợp hoàn chỉnh toàn bộ luồng từ Nạp bài đến Học bài. Cập nhật `App.tsx` có thanh công cụ chuyển đổi nhanh giữa chế độ "Bé Học Bài" và "Playground Kiểm Thử Âm Thanh", giúp người dùng dễ dàng chuyển qua lại để kiểm tra âm thanh bất kỳ lúc nào.
- **Acceptance Criteria:**
  - [ ] Người dùng chuyển đổi mượt mà giữa Màn hình Bé Học và Playground Kiểm Âm.
  - [ ] Dữ liệu bài đọc nạp từ Phụ huynh được đồng bộ sang Bảng đọc của Bé.
- **Verification:**
  - [ ] *Agent tự test:* `npm run build` thành công.
  - [ ] *User trải nghiệm:* Chuyển đổi giữa 2 chế độ và kiểm thử toàn bộ luồng học.
- **Dependencies:** Task 9, Task 12.
- **Files touched:**
  - `src/pages/KidLearningPage.tsx`
  - `src/App.tsx`
- **Estimated scope:** S (2 files).

### ── Checkpoint 3: Toàn bộ luồng Bé Học & Playground Kiểm Âm hoàn thành ──
- [ ] Agent: Build và test tự động đạt 100%.
- [ ] User: Kiểm thử âm thanh thực tế trên Playground, duyệt chất lượng phát âm và nhịp Karaoke.

---

## Phase 4: Tối Ưu Mobile, Web Audio Auto-Unlock & Đóng Gói

### Task 14: Tối Ưu Mobile Touch & Mở Khóa Web Audio Safari/Chrome
- **Mô tả:** Xử lý chính sách Autoplay khắt khe của trình duyệt di động (iOS Safari, Chrome Android): tự động mở khóa `AudioContext` ngay cú chạm/vuốt đầu tiên của trẻ. Căn chỉnh CSS touch-target tối thiểu $48\text{px}$, chống zoom vô ý (`user-scalable=no`).
- **Acceptance Criteria:**
  - [ ] Trẻ chạm vào màn hình iPhone/iPad phát được âm thanh ngay lập tức mà không bị câm tiếng.
  - [ ] Các nút bấm và từ vựng có diện tích chạm thoải mái cho ngón tay trẻ nhỏ.
- **Verification:**
  - [ ] *Agent tự test:* Code guard kiểm tra AudioContext state ('suspended' -> 'running').
  - [ ] *User kiểm thử:* Trải nghiệm trên thiết bị di động / máy tính bảng thực tế.
- **Dependencies:** Task 13.
- **Files touched:** `src/core/audio/WebAudioEngine.ts`, `src/index.css`.
- **Estimated scope:** S (2 files).

### Task 15: Kiểm Thử Tổng Hợp Tự Động & Đóng Gói Production Build
- **Mô tả:** Rà soát toàn bộ các bài test tự động, kiểm tra dung lượng bundle tối ưu, kiểm tra asset caching Audio Sprite trong CacheStorage/ServiceWorker.
- **Acceptance Criteria:**
  - [ ] `npm test` pass 100% tất cả test suites.
  - [ ] `npm run build` tạo thư mục `dist/` hoàn chỉnh, không có warning nghiêm trọng.
- **Verification:**
  - [ ] *Agent tự test:* `npm test` và `npm run build`.
- **Dependencies:** Task 14.
- **Files touched:** `test/`, `vite.config.ts`.
- **Estimated scope:** S (1-2 files).

### ── Checkpoint 4: Ứng dụng hoàn thiện sẵn sàng phát hành ──
