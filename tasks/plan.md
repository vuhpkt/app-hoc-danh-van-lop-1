# Kế Hoạch Triển Khai: App Học Đánh Vần Tiếng Việt Lớp 1 (Kid & Parent Interactive)

## 1. Tổng quan
Kế hoạch triển khai chia nhỏ toàn bộ dự án thành các task độc lập, có thể kiểm chứng (verifiable) với tiêu chí nghiệm thu (acceptance criteria) rõ ràng.  
**Thứ tự ưu tiên cốt lõi theo yêu cầu:**
1. **Ưu tiên số 1 (Giai đoạn hiện tại):** Chuẩn hóa 100% ngữ âm sư phạm, loại bỏ hoàn toàn các "âm rác" do gửi chuỗi không dấu thuộc nhóm phụ âm tắc vô thanh ($p, t, c, ch$), thu âm đầy đủ các âm/vần/tiếng đệm bằng Zalo AI TTS, và đóng gói Audio Sprite hoàn chỉnh.
2. **Ưu tiên số 2:** Tái cấu trúc mã nguồn (Restructuring), tích hợp In-Browser OCR (Tesseract.js) cho phụ huynh nạp bài.
3. **Ưu tiên số 3:** Xây dựng giao diện tương tác trực quan 1-chạm và Karaoke 60fps cho bé 6 tuổi.

---

## 2. Quyết định Kiến trúc & Sư phạm Ngữ âm
- **Quy tắc sư phạm cho nhóm vần kết thúc bằng $p, t, c, ch$ (Checked Syllables):**
  - Trong tiếng Việt, các vần kết thúc bằng $p, t, c, ch$ chỉ đi kèm 2 thanh: **Thanh Sắc** hoặc **Thanh Nặng**.
  - Tuyệt đối không gửi chuỗi vô nghĩa không dấu (`giăt`, `ăt`, `ăc`, `âc`, `ăp`, `âp`, `oăt`, `oăc`...) cho TTS vì sẽ sinh ra "âm rác".
  - Toàn bộ các vần nhóm này khi thu âm TTS được đọc ở dạng **thanh Sắc** (`ắt, ất, ắc, ấc, áp, ắp, ấp, ét, ết, ít...`).
  - **Quy tắc đánh vần tiếng thanh Nặng:** `[Âm đầu] - [Vần sắc] - [Tiếng đệm sắc] - nặng - [Tiếng đích]`.
    - Ví dụ chuẩn 100%: `gi` - `ắt` - `giắt` - `nặng` - `giặt`; `h` - `óc` - `hóc` - `nặng` - `học`; `v` - `ít` - `vít` - `nặng` - `vịt`.
  - **Quy tắc đánh vần tiếng thanh Sắc:** `[Âm đầu] - [Vần sắc] - [Tiếng đích]`.
    - Ví dụ chuẩn 100%: `b` - `ắt` - `bắt`; `c` - `át` - `cát`; `qu` - `ốc` - `quốc`.
- **Tách bạch 2 vai trò người dùng:**
  - `src/components/parent/`: Phụ huynh nạp bài (Dán text / Chụp ảnh OCR), rà soát chính tả.
  - `src/components/kid/`: Màn hình chữ lớn $\ge 36\text{px}$, màu sắc phân biệt `[Âm đầu] - [Vần] - [Thanh]`, tương tác 1-chạm không cản trở.
- **Dịch vụ OCR độc lập (`src/core/ocr/`):** Chạy trên Web Worker riêng biệt bằng `tesseract.js` với model tiếng Việt (`vie`), không làm block main thread.

---

## 3. Danh sách Nhiệm vụ (Task List by Phases)

### Phase 1: Chuẩn Hóa Ngữ Âm Sư Phạm & Hoàn Thiện Kho Âm Thanh Sạch (Ưu tiên Cao nhất) [HOÀN THÀNH 100%]

- [x] **Task 1: Rà soát & Chuẩn hóa Danh mục Âm thanh Sư phạm (`danh_muc_am_thanh_lop_1.md`)**
  - **Mô tả:** Chuyển toàn bộ 44 vần kết thúc bằng $p, t, c, ch$ sang dạng thanh sắc (`ắt, ất, ắc, ấc, áp, ắp, ấp...`) cho text gửi TTS. Loại bỏ từ ma vô nghĩa `giăt` thay bằng tiếng đệm có nghĩa `giắt`. Bổ sung các tiếng đệm mang thanh sắc và từ mẫu cốt lõi của SGK Tiếng Việt 1.
  - **Acceptance:** 100% mục trong danh mục có text gửi TTS là từ/chuỗi tiếng Việt có nghĩa trong từ điển; 0% từ vô nghĩa không dấu thuộc nhóm $p, t, c, ch$.
  - **Files:** `danh_muc_am_thanh_lop_1.md`.

- [x] **Task 2: Tái cấu trúc Bộ máy Bóc tách Ngữ âm (`vietnamesePhonics.ts`) theo Chuẩn $p, t, c, ch$**
  - **Mô tả:** Cập nhật thuật toán bóc tách và sinh công thức đánh vần: tiếng khép tắc thanh nặng sinh công thức `gi - ắt - giắt - nặng - giặt`, tiếng khép tắc thanh sắc sinh công thức rút gọn 3 bước `b - ắt - bắt`, xử lý từ khuyết âm đầu.
  - **Acceptance:** `parseVietnamesePhonics('giặt').spellingFormula` trả về `['gi', 'ắt', 'giắt', 'nặng', 'giặt']`; `parseVietnamesePhonics('bắt').spellingFormula` trả về `['b', 'ắt', 'bắt']`; `quốc` trả về `['qu', 'ốc', 'quốc']`.
  - **Files:** `src/core/parser/vietnamesePhonics.ts`.

- [x] **Task 3: Cập nhật Script Zalo AI TTS & Thu Âm Lại Toàn Bộ Âm Chuẩn Không Rác**
  - **Mô tả:** Cập nhật `AUDIO_DATASET` trong `scripts/generate-zalo-tts.js` đồng bộ với danh mục chuẩn. Chạy tải lại bằng Zalo AI TTS API các vần $p, t, c, ch$ và tiếng đệm mới với cờ `--overwrite`.
  - **Acceptance:** Toàn bộ các file âm thanh vần $p, t, c, ch$ và tiếng đệm được tải thành công từ Zalo AI; file `van__a_breve_t.mp3` phát rõ âm `ắt`; `tu__giat_sac.mp3` phát rõ âm `giắt`; 0 file nào dưới 1.5KB.
  - **Files:** `scripts/generate-zalo-tts.js`, `raw-audio/manifest.json`, `raw-audio/`.

- [x] **Task 4: Cập nhật SpriteManager Mapping & Đóng gói Audio Sprite Master mới**
  - **Mô tả:** Cập nhật `TOKEN_TO_SPRITE_KEY_MAP` trong `SpriteManager.ts` hỗ trợ cả 2 dạng token (hiển thị `ăt` và âm thanh `ắt`), ánh xạ các tiếng đệm mang thanh sắc. Chạy `scripts/build-audio-sprite.js` đóng gói lại `sprite-main.mp3`, `sprite-main.webm` và `audio-map.json`.
  - **Acceptance:** `audio-map.json` chứa đầy đủ các phân đoạn mới; Audio sprite master nghe rõ ràng, không click/pop.
  - **Files:** `src/core/audio/SpriteManager.ts`, `scripts/build-audio-sprite.js`, `public/audio/audio-map.json`, `public/audio/sprite-main.mp3`, `public/audio/sprite-main.webm`.

- [x] **Task 5: Xây dựng Bộ Test Suite Tự Động Toàn Diện (`test/audio_pedagogy.test.js`)**
  - **Mô tả:** Viết test suite kiểm chứng tự động: (1) Quét danh mục 0% từ rác, (2) Kiểm tra 25+ trường hợp từ bóc tách ngữ âm đúng chuẩn, (3) 100% bước trong công thức resolve thành công tới audio clip trong `audio-map.json`, (4) Kiểm tra biên độ sóng PCM đạt chuẩn không clipping.
  - **Acceptance:** Lệnh `npm test` chạy pass 100% tất cả các bài kiểm tra (18/18 tests passed).
  - **Files:** `test/audio_pedagogy.test.js`.

### ─── CHECKPOINT 1: Kho âm thanh hoàn chỉnh & Sạch 100% âm rác, Đạt chuẩn Sư phạm [ĐÃ ĐẠT 100%] ───

---

### Phase 2: Tái Cấu Trúc Mã Nguồn & Tích Hợp In-Browser OCR
- [ ] **Task 6: Tái cấu trúc thư mục Components & Types**
- [ ] **Task 7: Tích hợp Tesseract.js Worker & Tiền xử lý ảnh Canvas**
- [ ] **Task 8: Xây dựng Giao diện Phụ huynh Nạp bài (LessonInputModal & Proofreader)**

### ─── CHECKPOINT 2: Nạp bài và OCR In-Browser hoạt động trơn tru ───

---

### Phase 3: Giao Diện Học Tập Tương Tác Dành Riêng Cho Bé 6 Tuổi
- [ ] **Task 9: Bảng Bài Đọc Chữ Lớn & Thẻ Từ Tương Tác (KidReaderBoard & WordBubble)**
- [ ] **Task 10: Thanh Điều Khiển Học Sinh & Chế độ Đọc Mẫu Toàn Bài (KidControlBar & Karaoke)**
- [ ] **Task 11: Tích hợp trang chính App.tsx & Chuyển đổi Sandbox**

### ─── CHECKPOINT 3: Toàn bộ luồng Người dùng Bé & Phụ huynh hoạt động hoàn chỉnh ───

---

### Phase 4: Kiểm Thử Đóng Gói & Tối Ưu Hóa Thiết Bị Di Động
- [ ] **Task 12: Tối ưu tương thích Trình duyệt Di động (Mobile/Tablet)**
- [ ] **Task 13: Production Build & E2E Verification**

---

## 4. Ma trận Rủi ro & Giải pháp (Risks & Mitigations)

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|---|---|---|
| Gọi TTS với chuỗi vô nghĩa sinh ra âm rác | Cao | Rà soát 100% text gửi TTS, thay toàn bộ các vần kết thúc bằng $p, t, c, ch$ bằng dạng có thanh sắc (`ắt, ất, ắc...`) và tiếng đệm có nghĩa (`giắt, hóc, vít...`). |
| Giới hạn API Quota Zalo AI | Thấp | Chỉ tải lại nhóm file vần khép tắc và tiếng đệm bị ảnh hưởng (~50-60 files), các âm đầu và vần mũi đã tốt trước đó được bảo lưu. |
| Từ mới trong bài tập đọc của phụ huynh chưa có trong Sprite | Trung bình | Bộ vần và âm đầu phủ 100% nên luôn đánh vần được phần đầu-vần; từ vựng phủ toàn bộ từ mẫu SGK Lớp 1, từ lạ dùng Synth fallback an toàn. |
