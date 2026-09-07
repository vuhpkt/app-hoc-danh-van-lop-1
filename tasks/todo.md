# Danh Sách Nhiệm Vụ (Task List) - App Học Đánh Vần Tiếng Việt Lớp 1

> **Nguồn đặc tả:** [SPEC.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/SPEC.md)  
> **Kế hoạch chi tiết:** [tasks/plan.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/tasks/plan.md)  
> **Ưu tiên số 1 hiện tại:** Chuẩn hóa ngữ âm sư phạm, thu âm sạch 100% không âm rác bằng Zalo AI TTS, đóng gói Sprite hoàn chỉnh trước khi làm OCR và UI.

---

## Phase 1: Chuẩn Hóa Ngữ Âm Sư Phạm & Hoàn Thiện Kho Âm Thanh Sạch (Ưu tiên Cao nhất)

- [x] **Task 1: Rà soát & Chuẩn hóa Danh mục Âm thanh Sư phạm (`danh_muc_am_thanh_lop_1.md`)**
  - **Mô tả:** Chuyển toàn bộ 44 vần kết thúc bằng $p, t, c, ch$ sang dạng thanh sắc (`ắt, ất, ắc, ấc, áp, ắp, ấp...`) cho text gửi TTS. Loại bỏ hoàn toàn từ ma vô nghĩa `giăt` thay bằng tiếng đệm có nghĩa `giắt`. Bổ sung các tiếng đệm mang thanh sắc và từ mẫu cốt lõi của SGK Tiếng Việt 1.
  - **Acceptance:**
    - [x] 100% mục trong danh mục có text gửi TTS là từ/chuỗi tiếng Việt có nghĩa trong từ điển.
    - [x] 0% từ vô nghĩa không dấu thuộc nhóm $p, t, c, ch$.
  - **Files:** `danh_muc_am_thanh_lop_1.md`.
  - **Scope:** Small (1 file).

- [x] **Task 2: Tái cấu trúc Bộ máy Bóc tách Ngữ âm (`vietnamesePhonics.ts`) theo Chuẩn $p, t, c, ch$**
  - **Mô tả:** Cập nhật thuật toán bóc tách và sinh công thức đánh vần: tiếng khép tắc thanh nặng sinh công thức `gi - ắt - giắt - nặng - giặt`, tiếng khép tắc thanh sắc sinh công thức rút gọn 3 bước `b - ắt - bắt`, xử lý từ khuyết âm đầu.
  - **Acceptance:**
    - [x] `parseVietnamesePhonics('giặt').spellingFormula` trả về `['gi', 'ắt', 'giắt', 'nặng', 'giặt']`.
    - [x] `parseVietnamesePhonics('bắt').spellingFormula` trả về `['b', 'ắt', 'bắt']`.
    - [x] `parseVietnamesePhonics('quốc').spellingFormula` trả về `['qu', 'ốc', 'quốc']`.
    - [x] `parseVietnamesePhonics('trường').spellingFormula` trả về `['tr', 'ương', 'trương', 'huyền', 'trường']`.
  - **Files:** `src/core/parser/vietnamesePhonics.ts`.
  - **Scope:** Small (1 file).

- [ ] **Task 3: Cập nhật Script Zalo AI TTS & Thu Âm Lại Toàn Bộ Âm Chuẩn Không Rác**
  - **Mô tả:** Cập nhật `AUDIO_DATASET` trong `scripts/generate-zalo-tts.js` đồng bộ với danh mục chuẩn. Chạy tải lại bằng Zalo AI TTS API các vần $p, t, c, ch$ và tiếng đệm mới với cờ `--overwrite`.
  - **Acceptance:**
    - [ ] Toàn bộ các file âm thanh vần $p, t, c, ch$ và tiếng đệm được tải thành công từ Zalo AI.
    - [ ] File `raw-audio/van__a_breve_t.mp3` phát rõ âm `ắt`.
    - [ ] File `raw-audio/tu__giat_sac.mp3` phát rõ âm `giắt`.
    - [ ] Không có file nào dưới 1.5KB hoặc bị lỗi HTTP.
  - **Files:** `scripts/generate-zalo-tts.js`, `raw-audio/manifest.json`, `raw-audio/`.
  - **Scope:** Small-Medium (script + audio assets).

- [ ] **Task 4: Cập nhật SpriteManager Mapping & Đóng gói Audio Sprite Master mới**
  - **Mô tả:** Cập nhật `TOKEN_TO_SPRITE_KEY_MAP` trong `SpriteManager.ts` hỗ trợ cả 2 dạng token (hiển thị `ăt` và âm thanh `ắt`), ánh xạ các tiếng đệm mang thanh sắc. Chạy `scripts/build-audio-sprite.js` đóng gói lại `sprite-main.mp3`, `sprite-main.webm` và `audio-map.json`.
  - **Acceptance:**
    - [ ] `audio-map.json` chứa đầy đủ các phân đoạn mới.
    - [ ] Audio sprite master nghe rõ ràng, không click/pop.
  - **Files:** `src/core/audio/SpriteManager.ts`, `scripts/build-audio-sprite.js`, `public/audio/audio-map.json`, `public/audio/sprite-main.mp3`, `public/audio/sprite-main.webm`.
  - **Scope:** Medium (2 code files + 3 generated public assets).

- [ ] **Task 5: Xây dựng Bộ Test Suite Tự Động Toàn Diện (`test/audio_pedagogy.test.js`)**
  - **Mô tả:** Viết test suite kiểm chứng tự động: (1) Quét danh mục 0% từ rác, (2) Kiểm tra 25+ trường hợp từ bóc tách ngữ âm đúng chuẩn, (3) 100% bước trong công thức resolve thành công tới audio clip trong `audio-map.json`, (4) Kiểm tra biên độ sóng PCM đạt chuẩn không clipping.
  - **Acceptance:**
    - [ ] Lệnh `npm test` chạy pass 100% tất cả các bài kiểm tra.
  - **Files:** `test/audio_pedagogy.test.js`.
  - **Scope:** Small (1 test file).

### ─── CHECKPOINT 1: Kho âm thanh hoàn chỉnh & Sạch 100% âm rác, Đạt chuẩn Sư phạm ───

---

## Phase 2: Tái Cấu Trúc Mã Nguồn & Tích Hợp In-Browser OCR

- [ ] **Task 6: Tái cấu trúc thư mục Components & Types**
- [ ] **Task 7: Tích hợp Tesseract.js Worker & Tiền xử lý ảnh Canvas**
- [ ] **Task 8: Xây dựng Giao diện Phụ huynh Nạp bài (LessonInputModal & Proofreader)**

### ─── CHECKPOINT 2: Nạp bài và OCR In-Browser hoạt động trơn tru ───

---

## Phase 3: Giao Diện Học Tập Tương Tác Dành Riêng Cho Bé 6 Tuổi

- [ ] **Task 9: Bảng Bài Đọc Chữ Lớn & Thẻ Từ Tương Tác (KidReaderBoard & WordBubble)**
- [ ] **Task 10: Thanh Điều Khiển Học Sinh & Chế độ Đọc Mẫu Toàn Bài (KidControlBar & Karaoke)**
- [ ] **Task 11: Tích hợp trang chính App.tsx & Chuyển đổi Sandbox**

### ─── CHECKPOINT 3: Toàn bộ luồng Người dùng Bé & Phụ huynh hoạt động hoàn chỉnh ───

---

## Phase 4: Kiểm Thử Đóng Gói & Tối Ưu Hóa Thiết Bị Di Động

- [ ] **Task 12: Tối ưu tương thích Trình duyệt Di động (Mobile/Tablet)**
- [ ] **Task 13: Production Build & E2E Verification**
