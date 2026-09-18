# Danh Sách Nhiệm Vụ (Task List) - App Học Đánh Vần Tiếng Việt Lớp 1

> **Căn cứ kế hoạch:** [tasks/plan.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/tasks/plan.md) & [SPEC.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/SPEC.md)  
> **Trạng thái tổng thể:** **HOÀN THÀNH 100% TOÀN BỘ CÁC GIAI ĐOẠN** (Bao gồm nghiên cứu DSP & đồng bộ âm thanh kho gốc).

---

## Phase 1: Tái Cấu Trúc Nền Tảng & Dọn Dẹp Mã Nguồn
- [x] **Task 1.1: Trừu tượng hóa Service Layer (`IAudioStorage` & `ITtsService`)**
  - Contracts `IAudioStorage` và `ITtsService` trong `src/types/index.ts`. `AudioCacheService.ts` và `ZaloTtsClient.ts` tuân theo contracts.
- [x] **Task 1.2: Xóa bỏ component thừa `src/components/ControlBar.tsx`**
  - Xóa component cũ không dùng, tránh xung đột với `KidControlBar.tsx`.
- [x] **Task 1.3: Dọn dẹp file thử nghiệm tạm trong `scripts/`**
  - Xóa sạch các file script debug tạm `.wav`, `.cjs`, `.js`.

### ── Checkpoint 1: Nền tảng sạch sẽ, build và test pass 100% [ĐÃ ĐẠT] ──

---

## Phase 2: Triển Khai Xử Lý Âm Thanh DSP & Tinh Chỉnh TTS
- [x] **Task 2.1: Cải tiến thuật toán cắt lọc DSP trong `AudioDspProcessor.ts`**
  - Pre-roll 25ms, decay tail 80ms, chống cụt âm đầu/đuôi.
- [x] **Task 2.2: Tinh chỉnh Zalo TTS Client tốc độ chuẩn hóa**
  - Khắc phục lỗi 404 Zalo CDN worker với định dạng tốc độ chuẩn 1 chữ số thập phân.
- [x] **Task 2.3: Tối ưu hóa ngắt dứt khoát khi bấm Dừng (Stop)**
  - Ngắt GainNode trong 3ms và hủy toàn bộ timer/request ngầm khi bấm Stop.
- [x] **Task 2.4: Bố trí công cụ thẩm âm trực quan**
  - Thẩm âm trực tiếp trên loa trình duyệt.

### ── Checkpoint 2: Nghiệm thu âm thanh DSP cơ bản [ĐÃ ĐẠT] ──

---

## Phase 3: Nâng Cấp Core Parser & Tokenizer Đa Dòng
- [x] **Task 3.1:** Thêm `'newline'` vào `Token['type']` trong `src/types/index.ts`.
- [x] **Task 3.2:** Viết lại `tokenizeVietnameseText` trong `src/core/parser/vietnamesePhonics.ts` (tách từ, tách dấu câu, giữ ngắt dòng `\n`).
- [x] **Task 3.3:** Viết unit test `test/tokenizer.test.js` kiểm tra bảo toàn khổ thơ và dấu câu (Pass 100%).

### ── Checkpoint 3: Tokenizer chuẩn xác mọi bài thơ và dấu câu [ĐÃ ĐẠT] ──

---

## Phase 4: Hoàn Thiện Giao Diện Bé Học & Modal Nạp Bài Phụ Huynh 2-in-1
- [x] **Task 4.1:** Cập nhật `KidReaderBoard.tsx` & `WordBubble.tsx` hiển thị đúng từng dòng thơ và tách dấu câu.
- [x] **Task 4.2:** Xây dựng `ParentLessonModal.tsx` 2 tab: Dán văn bản trực tiếp + Quét ảnh OCR kèm rà soát sửa nhanh.
- [x] **Task 4.3:** Kết nối vào `KidLearningPage.tsx` và lưu bài học gần nhất vào `localStorage`.

### ── Checkpoint 4: Bé học bài trơn tru, Phụ huynh nạp bài dễ dàng [ĐÃ ĐẠT] ──

---

## Phase 5: Kiểm Thử Toàn Diện & Đóng Gói
- [x] **Task 5.1:** Chạy toàn bộ test suites `npm test` đạt 100% pass (50/50 tests ban đầu).
- [x] **Task 5.2:** `npm run build` tạo thư mục `dist/` hoàn chỉnh 0 lỗi TypeScript.

### ── Checkpoint 5: Đóng gói bản phát hành đầu tiên [ĐÃ ĐẠT] ──

---

## Phase 6: Nghiên Cứu DSP Playground & Đồng Bộ 100% Thuật Toán Âm Thanh
- [x] **Task 6.1: Xây dựng Audio DSP Playground (`Playground.tsx`)**
  - Cho phép người dùng A/B testing trực quan giữa các thuật toán DSP.
- [x] **Task 6.2: Tìm ra thuật toán xử lý âm thanh hay nhất (`master_sprite_sync`)**
  - Tốc độ giọng đọc chuẩn SGK Lớp 1: **0.8x**.
  - Hann Windowing 12ms làm mịn 2 đầu, Hard zero 64 samples chống DC offset.
  - Biquad Peaking EQ ấm áp (boost 220Hz +2.2dB, cắt chói 3.6kHz -2.2dB), Micro-Ambience phòng thu tự nhiên.
- [x] **Task 6.3: Đồng bộ 100% DSP giữa Client và Kho Gốc trên máy**
  - Tự động tải từ mới qua Zalo AI chuẩn 0.8x, lưu vào IndexedDB dưới dạng WAV 16-bit PCM đã xử lý DSP hoàn chỉnh.

### ── Checkpoint 6: Thuật toán âm thanh hay nhất & đồng bộ 100% [ĐÃ ĐẠT] ──

---

## Phase 7: Khắc Phục Triệt Để Lệch Pha Âm Thanh Trên Màn Hình Bé Đọc
- [x] **Task 7.1: Điều tra và phát hiện nguyên nhân gốc rễ (Root Cause Analysis)**
  - Phát hiện lỗi "MP3 Decoder Pop Header" tại mẫu `0..15` khiến thuật toán đóng gói cũ để sót **~200ms khoảng lặng giả** ở đầu các clip Master Sprite (`cây`, `hỏi`...).
  - Phát hiện xung đột giữa Dấu thanh hỏi (`thanh__hoi`) và Từ vựng hỏi (`tu__hoi`).
- [x] **Task 7.2: Sửa `scripts/build-audio-sprite.js` & đóng gói lại Master Sprite**
  - Bỏ qua 64 mẫu đầu tiên, chèn pre-roll an toàn 15ms.
  - Tái tạo toàn bộ `sprite-main.mp3`, `sprite-main.webm`, `audio-map.json`.
  - Tổng thời lượng sprite giảm từ **135s** xuống **93.67s** (cắt sạch hơn 40s khoảng lặng rác ở đầu các từ).
  - Thời lượng clip `tu__cay` giảm từ 0.461s $\rightarrow$ **0.276s** (phát âm tức thì < 15ms).
- [x] **Task 7.3: Tải từ vựng `"hỏi"` (`tu__hoi.mp3`) chuẩn 0.8x vào Kho Gốc**
  - Phân tách rõ: Đọc câu dùng `tu__hoi`, đánh vần mẩu âm dùng `thanh__hoi`.
- [x] **Task 7.4: Nạp trước Master Sprite khi vào Màn Hình Bé Đọc**
  - Thêm `useEffect` nạp `loadSprite()` trên `KidLearningPage.tsx` và tự động kiểm tra sprite trong `preloadAudio`.
- [x] **Task 7.5: Nâng cấp Cache Version lên `v_synced_v3_`**
  - Tự động bỏ qua cache cũ trong IndexedDB để nạp âm thanh chuẩn DSP mới nhất.
- [x] **Task 7.6: Kiểm thử toàn diện**
  - **60/60 unit tests PASS (100%)**.
  - `npm run build` thành công trong 2.39s.

### ── Checkpoint 7: Âm thanh đồng bộ 100% tức thì trên mọi màn hình [HOÀN TẤT XUẤT SẮC] ──

---

## Phase 8: Nghiên Cứu & Tối Giản Hóa Giao Diện UI/UX (Chuẩn Montessori)
- [x] **Task 8.1: Nghiên cứu UI/UX & Xây dựng Nguyên mẫu tương tác**
  - Xây dựng `minimalist_ui_concept.html` áp dụng triết lý "Trang Sách Giấy Ngà Ấm", phím bấm Fitts's Law $\ge 48\text{px}$.
- [x] **Task 8.2: Nâng cấp Bảng đọc & Thẻ từ vựng Tactile Magnetic Tile**
  - Cập nhật `WordBubble.tsx` (thẻ gỗ nam châm, active amber-400, bỏ tooltip bounce) và `KidReaderBoard.tsx` (trang sách mở `#FAF8F5`).
- [x] **Task 8.3: Tối giản Thanh điều khiển nổi Floating Control Dock**
  - Tích hợp cụm Play, Capsule Mode Switch và Tốc độ Thỏ 0.8x / Rùa 0.6x vào `KidControlBar.tsx`.
- [x] **Task 8.4: Tách biệt Góc Phụ Huynh & Loại bỏ 100% biệt ngữ kỹ thuật**
  - Cập nhật `KidLearningPage.tsx`: Chuyển danh sách bài sang Pill Carousel 1 dòng, ẩn banner DSP/Zalo AI thành vi thông báo nhẹ, đưa xóa cache vào menu Settings.
- [x] **Task 8.5: Bảng bóc tách ngữ âm Pastel Montessori**
  - Cập nhật `PhonicsBadgeModal.tsx` với 3 màu pastel dịu mát: Âm đầu xanh trời, Vần vàng mơ, Dấu thanh hồng phấn.
- [x] **Task 8.6: Kiểm thử TDD & Đóng gói sản phẩm**
  - Viết suite `test/kid_ui_minimalist.test.js`: **63/63 tests PASS (100%)**.
  - `npm run build` thành công trong 2.39s.

### ── Checkpoint 8: Giao diện tối giản, thanh lịch, chuẩn sư phạm hoàn tất 100% [XUẤT SẮC] ──

---

## Phase 9: Làm Sạch Kho Âm Cũ & Tải Lại 100% Chuẩn Zalo AI
- [x] **Task 9.1: Sao lưu an toàn thư mục `raw-audio/`**
  - Đã sao chép toàn bộ 340 files sang `raw-audio-backup/` phòng ngừa rủi ro kết nối.
- [x] **Task 9.2: Bổ sung từ vựng `tu__hoi` vào `scripts/generate-zalo-tts.js`**
  - Đã có đủ 280 mẩu âm chuẩn khớp 100% với `TOKEN_TO_SPRITE_KEY_MAP`. Test `test/audio_dataset_coverage.test.js` PASS 100%.
- [x] **Task 9.3: Dọn sạch 339 file mp3 cũ và rác trong `raw-audio/`**
  - Đã xóa sạch thư mục `raw-audio/` (0 files), loại bỏ triệt để 59 file rác và các clip cũ.
- [x] **Task 9.4: Tải mới 100% 280 mẩu âm qua Zalo AI TTS API (`npm run generate:zalo`)**
  - Giọng Nữ Bắc Ngọc Huyền, tốc độ SGK 0.8x, 280/280 files hợp lệ (>13KB), manifest 280 items chuẩn.
- [x] **Task 9.5: Đóng gói lại Master Audio Sprite (`npm run build:sprite`)**
  - Đóng gói 280 mẩu âm thành `sprite-main.mp3` (741KB) và `sprite-main.webm` (569KB), `audio-map.json` (280 keys).
  - Thuật toán DSP skip 64 samples chống pop, pre-roll 15ms, smart natural decay và Hann Windowing 12ms.
- [x] **Task 9.6: Nâng cấp Cache version client lên `v_synced_v4_` trong `AudioCacheService.ts`**
  - Đã đổi `CACHE_PREFIX` thành `'v_synced_v4_'`, bỏ qua toàn bộ cache cũ để nạp Master Sprite mới.
- [x] **Task 9.7: Kiểm thử tự động & Nghiệm thu thẩm âm**
  - Viết suite `test/sprite_integrity.test.js` và `test/audio_dataset_coverage.test.js`.
  - **74/74 tests PASS (100%)**, `npm run build` thành công xuất sắc (15.82s).

---

## Phase 10: Cân Bằng Độ Ngân & Nhịp Điệu Âm Học Cho "em", "lo" (v4.2.0)
- [x] **Task 10.1: Điều tra nguyên nhân gốc rễ (Deep Root Cause)**
  - Đo đạc Waveform Energy Profile: Từ "em" (`tu__em.mp3` & `van__em.mp3`) có active speech chỉ 187ms, đỉnh chỉ 0.46. Từ "lo" (`tu__lo.mp3`) có active speech chỉ 241ms (so với từ chuẩn 335ms - 457ms).
  - Phát hiện thiếu mapping `'em': 'tu__em'` trong `TOKEN_TO_SPRITE_KEY_MAP` (Bài 1).
- [x] **Task 10.2: Xây dựng công cụ kéo giãn âm học tự nhiên (`scripts/stretch-raw-audio.js`)**
  - Sử dụng thuật toán WSOLA (`atempo`) bảo toàn cao độ:
    * `tu__em.mp3` & `van__em.mp3`: kéo giãn lên 307ms, tăng gain volume lên 1.8 (đỉnh 0.813).
    * `tu__lo.mp3`: kéo giãn lên 335ms, volume 1.05 (đỉnh 0.829).
    * Các từ ngắn khác (`ve`, `co`): kéo giãn lên 280ms - 310ms.
- [x] **Task 10.3: Cập nhật SpriteManager & Cache-Busting lên `v4.2.0`**
  - Bổ sung `'em': 'tu__em'` vào nhóm Bài 1.
  - Nâng `SPRITE_VERSION = 'v4.2.0'` để ép trình duyệt tải ngay Master Sprite mới, loại bỏ 100% cache cũ.
- [x] **Task 10.4: Đóng gói lại Master Audio Sprite (`npm run build:sprite`)**
  - Tái tạo `sprite-main.mp3` (1020KB), `sprite-main.webm` (696KB), `audio-map.json` (280 clips).
- [x] **Task 10.5: Kiểm thử TDD toàn diện**
  - Cập nhật và bổ sung test cases âm học: **77/77 tests PASS (100%)**.
  - TypeScript build thành công 0 lỗi.

### ── Checkpoint 10: Âm thanh tự nhiên, ngân vang tròn trịa, cân bằng nhịp điệu 100% [HOÀN TẤT] ──

---

## Phase 11: Mastering Toàn Diện 280 Mẩu Âm Kho Gốc & Thuật Toán WSOLA In-Browser (v4.3.0)
- [x] **Task 11.1: Xây dựng kịch bản Mastering tự động hóa 100% (`scripts/master-audio-dataset.js`)**
  - Quét toàn bộ 280 mẩu âm từ nguồn gốc bất biến `raw-audio-backup/`.
  - Tự động đo đạc thời lượng nói thực tế (Active Speech) và biên độ đỉnh (Peak).
  - Tự động áp dụng bộ lọc WSOLA (`atempo`) kéo giãn thời lượng đạt chuẩn sư phạm:
    * Vần mở/vang (như *"vui"*, *"lo"*, *"em"*, *"chim"*, *"cây"*, *"cô"*): chuẩn hóa $\ge 300\text{ms}$.
    * Vần khép tắc $p, t, c, ch$ (như *"học"*, *"bắt"*, *"sạch"*, *"vịt"*, *"gập"*): chuẩn hóa $\ge 220\text{ms}$.
  - Chuẩn hóa biên độ đỉnh của **100% mẩu âm (280 clips)** về chuẩn $0.86 \pm 0.02$ ($-1.3\text{dBFS}$).
- [x] **Task 11.2: Tái đóng gói Master Audio Sprite & Kích hoạt Cache-Busting `v4.3.0`**
  - Đóng gói 280 clips đạt chuẩn vào `public/audio/sprite-main.mp3`, `sprite-main.webm` và `audio-map.json`.
  - Nâng `SpriteManager.SPRITE_VERSION = 'v4.3.0'` để ép trình duyệt xóa sạch cache đĩa cũ.
- [x] **Task 11.3: Tích hợp thuật toán WSOLA thuần TypeScript In-Browser vào `AudioDspProcessor.ts`**
  - Xây dựng hàm `wsolaTimeStretch` xử lý trực tiếp trên mảng `Float32Array` trong trình duyệt ($< 10\text{ms}$, bảo toàn $100\%$ cao độ).
  - Tích hợp `processDynamicWord`: khi người dùng nạp từ mới ngoài kho có thời lượng $< 260\text{ms}$, tự động kéo giãn lên $300\text{ms} - 320\text{ms}$, chèn $50\text{ms}$ pre-roll, $140\text{ms}$ decay tail, Hann windowing $12\text{ms}$ và chuẩn hóa đỉnh về $0.89$ ($-1\text{dBFS}$).
  - Xuất định dạng 16-bit PCM WAV tương thích hoàn toàn với IndexedDB offline storage.
- [x] **Task 11.4: Bộ kiểm thử hồi quy độc lập 3 vòng phản biện (Adversarial Review & Victory Audit)**
  - Viết suite `test/pedagogical_mastering.test.js` kiểm tra độ nguyên vẹn, dạng sóng và các trường hợp biên.
  - **108/108 tests PASS (100%)**, `npm run build` thành công xuất sắc 0 lỗi (2.48s).

### ── Checkpoint 11: Bộ âm thanh đạt chất lượng sư phạm hoàn hảo toàn diện v4.3.0 [CHIẾN THẮNG TUYỆT ĐỐI] ──
