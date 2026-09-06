# Danh Sách Nhiệm Vụ (Task List) - App Học Đánh Vần Tiếng Việt Lớp 1

> **Nguồn đặc tả:** [SPEC.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/SPEC.md)  
> **Kế hoạch chi tiết:** [tasks/plan.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/tasks/plan.md)  
> **Thứ tự ưu tiên:** Trích xuất âm khó ("uyu") $\rightarrow$ Hoàn thiện kho âm thanh $\rightarrow$ Tái cấu trúc & OCR $\rightarrow$ UI Bé 6 tuổi.

---

## Phase 1: Trích xuất Âm khó & Hoàn thiện Kho Âm thanh (Ưu tiên Cao nhất)

- [x] **Task 1: Script Acoustic Slicing trích xuất vần khó "uyu" từ từ "khuyu"**
  - **Mô tả:** Viết script Node.js `scripts/slice-rare-rimes.js` phân tích sóng âm PCM của `raw-audio/tu__khuyu_ngang.mp3`, xác định điểm chuyển tiếp thanh tính (Voicing Onset), cắt bỏ phụ âm xát vô thanh `kh` ở đầu, áp dụng Hann Windowing 12ms và hard zero 64 samples ở 2 đầu để tạo ra file `raw-audio/van__uyu.mp3` chuẩn xác 100% của giọng HoaiMy.
  - **Acceptance:**
    - [x] File `raw-audio/van__uyu.mp3` tồn tại, dung lượng hợp lệ (> 1.5KB, thực tế: 2.39KB, thời lượng 0.300s).
    - [x] Nghe rõ âm "uyu" tự nhiên, không bị dính phụ âm "kh" ở đầu và không bị giật/click ở 2 đầu (ZCR < 0.18, 32 samples đầu/cuối clamped).
  - **Verify:** Chạy `npm test` (`node --test test/*.test.js`) passed 100%.
  - **Files:** `scripts/slice-rare-rimes.js`, `raw-audio/van__uyu.mp3`, `src/core/audio/SpriteManager.ts`, `test/test_uyu_slice.test.js`.

- [ ] **Task 2: Audit & Sinh đầy đủ 100% các âm/vần/từ chuẩn SGK Kết Nối Tri Thức**
  - **Mô tả:** Bổ sung các vần ghép, tiếng đệm, từ đặc biệt còn thiếu vào `scripts/generate-tts-audio.js` (bao gồm các vần như `uyu`, `oen`, `oet`, `uyn`, `uyt`, các tiếng trung gian như `khuyu`, `khuỷu`, `trương`, `trường`, `quang`, `giặt`...) để đạt độ phủ 100% chương trình SGK Lớp 1.
  - **Acceptance:**
    - Script `scripts/generate-tts-audio.js` chạy không lỗi.
    - Toàn bộ danh mục âm thanh trong `danh_muc_am_thanh_lop_1.md` đều có file mp3 tương ứng trong `raw-audio/`.
  - **Verify:** Chạy `npm run generate:audio`.
  - **Files:** `scripts/generate-tts-audio.js`, `danh_muc_am_thanh_lop_1.md`, `raw-audio/manifest.json`.

- [ ] **Task 3: Đóng gói lại Audio Sprite Master & Cập nhật Audio Map**
  - **Mô tả:** Chạy quy trình đóng gói Audio Sprite (`scripts/build-audio-sprite.js`) với Smart Natural Decay (-52dB tail + 50ms), Hann windowing 12ms, hard zero 32 mẫu đầu/cuối của PCM, tạo ra `public/audio/sprite-main.mp3`, `sprite-main.webm` và `public/audio/audio-map.json`.
  - **Acceptance:**
    - `public/audio/audio-map.json` chứa key `van__uyu` và toàn bộ các âm vị lớp 1.
    - File sprite được nén chuẩn xác, không có độ trễ bất thường.
  - **Verify:** Chạy `npm run build:sprite` và kiểm tra key `van__uyu` trong `audio-map.json`.
  - **Files:** `scripts/build-audio-sprite.js`, `public/audio/audio-map.json`, `public/audio/sprite-main.mp3`, `public/audio/sprite-main.webm`.

- [ ] **Task 4: Unit Test kiểm thử Phonics Parser & Sprite Mapping cho từ khó**
  - **Mô tả:** Viết script kiểm thử tự động `scripts/test-phonics-suite.js` kiểm tra bóc tách ngữ âm và khớp sprite key cho các từ khó: `khuỷu`, `trường`, `quốc`, `gì`, `áo`, `uống`, `yêu`, `giặt`, `quang`.
  - **Acceptance:**
    - 100% các từ kiểm tra đều sinh đúng công thức đánh vần (ví dụ `khuỷu` $\rightarrow$ `['kh', 'uyu', 'khuyu', 'hỏi', 'khuỷu']`).
    - Mỗi bước trong công thức đều ánh xạ thành công tới 1 key âm thanh có thật trong `audio-map.json`.
  - **Verify:** Chạy `node scripts/test-phonics-suite.js` báo All Passed.
  - **Files:** `scripts/test-phonics-suite.js`, `src/core/parser/vietnamesePhonics.ts`, `src/core/audio/SpriteManager.ts`.

### ─── CHECKPOINT 1: Kho âm thanh hoàn chỉnh & Âm khó "uyu" hoạt động 100% ───

---

## Phase 2: Tái Cấu Trúc Mã Nguồn & Tích Hợp In-Browser OCR

- [ ] **Task 5: Tái cấu trúc thư mục Components & Modules**
  - **Mô tả:** Tổ chức lại mã nguồn theo domain:
    - `src/components/kid/`: Giao diện học sinh (chữ lớn, thẻ từ, popup bóc tách).
    - `src/components/parent/`: Giao diện phụ huynh (modal nạp bài, khung sửa chữ).
    - `src/components/shared/`: Thanh điều khiển chung.
    - `src/core/ocr/`: Module nhận diện chữ và làm sạch text.
  - **Acceptance:**
    - Thư mục được sắp xếp gọn gàng theo chuẩn kiến trúc sạch.
    - `npm run build` thành công, 0 lỗi biên dịch.
  - **Verify:** Chạy `npm run build`.
  - **Files:** `src/types/index.ts`, tái cấu trúc `src/components/`, `src/core/ocr/`.

- [ ] **Task 6: Tích hợp Tesseract.js Worker & Tiền xử lý ảnh Canvas**
  - **Mô tả:** Cài đặt `tesseract.js`. Xây dựng `src/core/ocr/tesseractService.ts` quản lý Web Worker với gói ngôn ngữ `vie`. Tích hợp xử lý Canvas (Grayscale + Tăng tương phản) và module `src/core/ocr/textSanitizer.ts` để lọc bỏ số trang và ký tự rác.
  - **Acceptance:**
    - Hàm `recognizeVietnamesePage` nhận diện thành công ảnh chụp văn bản tiếng Việt có dấu.
    - Có callback báo tiến trình `%` (0-100%) theo thời gian thực mà không làm gián đoạn main UI thread.
  - **Verify:** Chạy script test nhận diện với 1 ảnh mẫu trang sách SGK.
  - **Files:** `package.json`, `src/core/ocr/tesseractService.ts`, `src/core/ocr/textSanitizer.ts`.

- [ ] **Task 7: Giao diện Phụ huynh Nạp bài (LessonInputModal & Proofreader)**
  - **Mô tả:** Xây dựng modal nạp bài thân thiện cho phụ huynh:
    - Tab 1: Dán văn bản hoặc gõ trực tiếp.
    - Tab 2: Tải ảnh hoặc chụp từ camera thiết bị.
    - Khung `TextProofreader.tsx`: Hiển thị chữ quét được cho phụ huynh kiểm tra, sửa nhanh lỗi chính tả nếu có, kèm nút to rõ *"Bắt đầu cho bé học"*.
  - **Acceptance:**
    - Phụ huynh có thể nạp bài bằng cả 2 cách (dán text hoặc ảnh).
    - Có thể chỉnh sửa nội dung trong textarea và bấm xác nhận để cập nhật bài đọc ngay lập tức.
  - **Verify:** Kiểm tra thao tác nạp bài trên giao diện web.
  - **Files:** `src/components/parent/LessonInputModal.tsx`, `src/components/parent/TextProofreader.tsx`.

### ─── CHECKPOINT 2: Nạp bài và OCR In-Browser hoạt động trơn tru ───

---

## Phase 3: Giao Diện Học Tập Tương Tác Dành Riêng Cho Bé 6 Tuổi

- [ ] **Task 8: Bảng Bài Đọc Chữ Lớn & Thẻ Từ Tương Tác (KidReaderBoard & WordBubble)**
  - **Mô tả:** Xây dựng màn hình bài đọc dành cho bé:
    - Cỡ chữ lớn `36px - 48px`, font tròn, màu sắc tương phản cao.
    - Mỗi từ bọc trong `WordBubble.tsx` có hiệu ứng nhún nhảy khi chạm.
    - Khi chạm vào từ: phát âm thanh vui tai, phóng to từ và mở popup `PhonicsBadgeModal.tsx` hiển thị 3 huy hiệu màu `[ÂM ĐẦU]` (xanh), `[VẦN]` (cam), `[THANH]` (đỏ), tự động kích hoạt đánh vần từng bước.
  - **Acceptance:**
    - Bé chạm vào bất kỳ từ nào (kể cả từ khó như `khuỷu`) đều lập tức thấy bóc tách và nghe âm thanh chuẩn xác.
    - Giao diện không có bất kỳ nút kỹ thuật rườm rà nào gây rối cho bé.
  - **Verify:** Thao tác chạm thử trên nhiều từ khác nhau.
  - **Files:** `src/components/kid/KidReaderBoard.tsx`, `src/components/kid/WordBubble.tsx`, `src/components/kid/PhonicsBadgeModal.tsx`.

- [ ] **Task 9: Thanh Điều Khiển Đơn Giản Cho Bé & Chế độ Đọc Mẫu Toàn Bài (KidControlBar & Karaoke)**
  - **Mô tả:** Thiết kế thanh điều khiển `KidControlBar.tsx` với icon trực quan:
    - Nút Play/Pause lớn dễ chạm.
    - Chuyển đổi giữa: "Đọc trơn cả bài" và "Đánh vần từng từ cả bài".
    - Bộ chọn tốc độ đọc chậm (`0.5x`, `0.7x`, `1.0x`) với khoảng nghỉ tự nhiên (`SilenceGap`).
    - Vạch highlight Karaoke 60fps chạy mượt mà theo từng từ đang phát.
  - **Acceptance:**
    - Khi bấm Play, bài đọc tự động chạy từ đầu đến cuối, từ đang đọc sáng rõ nổi bật.
    - Khi bấm Tạm dừng hoặc chạm từ khác, âm thanh dừng ngay lập tức trong 3ms không bị tiếng "bụp".
  - **Verify:** Phát trọn vẹn 1 bài thơ mẫu ở các tốc độ khác nhau.
  - **Files:** `src/components/shared/KidControlBar.tsx`, `src/pages/KidLearningPage.tsx`.

- [ ] **Task 10: Tích hợp Trang Chính App.tsx & Chế độ Chuyển đổi Sandbox**
  - **Mô tả:** Cập nhật `App.tsx` đặt `KidLearningPage.tsx` làm màn hình chính mặc định. Tích hợp nút phụ "Nạp bài tập đọc mới" cho bố mẹ ở góc trên, và một nút nhỏ ẩn dành cho kỹ thuật viên chuyển sang `Playground.tsx`.
  - **Acceptance:**
    - Mở ứng dụng là vào ngay bài học của bé.
    - Phụ huynh bấm nạp bài mới $\rightarrow$ cập nhật bài đọc tức thì mà không cần reload trang.
  - **Verify:** Luồng phụ huynh nạp bài $\rightarrow$ bé học diễn ra trơn tru từ đầu đến cuối.
  - **Files:** `src/App.tsx`, `src/pages/KidLearningPage.tsx`.

### ─── CHECKPOINT 3: Toàn bộ luồng Người dùng Bé & Phụ huynh hoạt động hoàn chỉnh ───

---

## Phase 4: Kiểm Thử Đóng Gói & Tối Ưu Hóa Thiết Bị Di Động

- [ ] **Task 11: Tối ưu tương thích Trình duyệt Di động (Mobile/Tablet)**
  - **Mô tả:** Đảm bảo tự động unlock AudioContext ngay khi bé chạm lần đầu trên iPad/iPhone/Android. Tối ưu CSS responsive cho cả màn hình ngang và dọc.
  - **Acceptance:**
    - Âm thanh phát ngay từ lần chạm đầu tiên trên mọi trình duyệt di động.
    - Layout không bị tràn ngang hoặc che khuất nút bấm trên màn hình nhỏ.
  - **Verify:** Kiểm tra giao diện qua responsive viewport test.
  - **Files:** `src/core/audio/WebAudioEngine.ts`, `src/index.css`.

- [ ] **Task 12: Production Build & E2E Verification**
  - **Mô tả:** Chạy quy trình kiểm tra toàn diện: TypeScript check, Vite production build, kiểm tra kích thước bundle và thời gian tải.
  - **Acceptance:**
    - Lệnh `npm run build` hoàn thành với mã thoát 0, không có warning nghiêm trọng.
    - Ứng dụng sẵn sàng deploy production.
  - **Verify:** Chạy `npm run build` và `npm run preview`.
  - **Files:** Toàn bộ dự án.
