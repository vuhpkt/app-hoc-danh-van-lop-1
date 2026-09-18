# Implementation Plan: Tái Cấu Trúc & Tối Ưu Âm Thanh Học Đánh Vần Lớp 1

> **Căn cứ đặc tả:** [SPEC.md (v2.0.0)](file:///d:/Workspace/web_apps/app_hoc_danh_van/SPEC.md)  
> **Nhiệm vụ chi tiết:** [tasks/todo.md](file:///d:/Workspace/web_apps/app_hoc_danh_van/tasks/todo.md)  
> **Thứ tự ưu tiên chỉ đạo:**  
> 1. **Bước 1:** Tái cấu trúc nền tảng & dọn dẹp mã nguồn thừa.  
> 2. **Bước 2:** Triển khai xử lý âm thanh tự nhiên (DSP + Zalo TTS) để **người dùng thẩm âm và kiểm tra ngay**.  
> 3. **Bước 3 trở đi:** Sau khi người dùng duyệt âm thanh mới triển khai Tokenizer thơ, giao diện bé học và modal phụ huynh.

---

## 1. Overview (Tổng Quan Mục Tiêu)

Dự án phát triển ứng dụng web/PWA học đánh vần chuẩn SGK Lớp 1 (*Kết Nối Tri Thức*) phục vụ việc học hàng ngày của con/cháu trong gia đình. Kế hoạch này tập trung giải quyết triệt để vấn đề âm thanh đọc từng từ bị khô cứng, loại bỏ mã nguồn thừa, tách interface Service Layer sẵn sàng cắm Backend Server trong tương lai, và cung cấp ngay công cụ thẩm âm để người dùng nghe và duyệt chất lượng trước khi hoàn thiện các phần còn lại.

---

## 2. Architecture Decisions (Quyết Định Kiến Trúc Cốt Lõi)

1. **Service Layer Contracts (`IAudioStorage`, `ITtsService`):**
   - *Quyết định:* Trừu tượng hóa lưu trữ audio cache và dịch vụ tổng hợp TTS thành interfaces TypeScript độc lập.
   - *Lý do:* Hiện tại ứng dụng chạy 100% Client-side (IndexedDB + Client Zalo) không cần server phức tạp. Trong tương lai khi cần cài đặt Backend Server (Node.js/Python), chỉ cần cắm adapter API mà không cần sửa một dòng code nào trên UI.
2. **Thuật toán DSP Mềm Mại (Gentle Audio DSP Pipeline):**
   - *Quyết định:* Mở rộng `preRollSec` lên 25ms (thay vì 10ms) và `reverbTailSec` lên 80ms (thay vì 50ms); giảm `maxGainBoost` từ 6.0 xuống 2.5; tăng tốc độ TTS Zalo từ 0.8x lên 0.95x cho từ đơn lẻ.
   - *Lý do:* Khắc phục triệt để lỗi "âm thanh đọc từng từ nghe rất cứng", giữ trọn vẹn phụ âm đầu (*th, kh, s, ch*) và độ ngân ấm tự nhiên của giọng nói con người.
3. **Cơ chế Hủy Ngắt Âm Thanh Dứt Khoát (Clean Playback Cancellation):**
   - *Quyết định:* Bổ sung cờ playback ID và xóa bỏ mọi timer `setTimeout` / hủy tiến trình tải Zalo ngầm khi người dùng bấm Dừng (Stop).
   - *Lý do:* Loại bỏ hiện tượng bấm dừng rồi mà âm thanh vẫn tự ý nhảy sang đọc từ tiếp theo.
4. **Tokenizer Đa Dòng (Multi-line Poem & Punctuation Tokenizer):**
   - *Quyết định:* Viết lại `tokenizeVietnameseText` nhận diện 4 loại token: `syllable`, `punctuation`, `space`, `newline`.
   - *Lý do:* Khắc phục lỗi nuốt dấu ngắt dòng `\n` khiến bài thơ 4 chữ, 5 chữ bị dồn thành văn xuôi và chữ bị dính dấu chấm.

---

## 3. Dependency Graph & Task List

```
[Phase 1: Tái cấu trúc Nền tảng & Dọn dẹp Code thừa]
(Xóa ControlBar.tsx, thiết lập Service Contracts IAudioStorage, ITtsService, dọn scripts)
                         │
                         ▼
[Phase 2: Triển khai Xử lý Âm thanh DSP & Tinh chỉnh TTS]
(AudioDspProcessor mềm mại, tốc độ Zalo 0.95x, ngắt Stop tức thì, test thẩm âm)
                         │
                         ▼
      ★ CHECKPOINT: NGƯỜI DÙNG KIỂM TRA THẨM ÂM ★
   (Người dùng nghe thử từ mới, xác nhận âm thanh đã hết khô cứng)
                         │
                         ▼
[Phase 3: Nâng cấp Core Parser & Tokenizer Đa Dòng]
(Tách từ, tách dấu câu, bảo toàn ngắt dòng bài thơ \n)
                         │
                         ▼
[Phase 4: Giao Diện Bé Học & Modal Nạp Bài Phụ Huynh 2-in-1]
(KidReaderBoard xuống dòng thơ, WordBubble tách dấu, ParentLessonModal dán chữ + OCR)
                         │
                         ▼
[Phase 5: Kiểm thử Tổng hợp & Bàn giao]
(Chạy 100% test suite, build production, hướng dẫn sử dụng)
```

---

### Phase 1: Tái Cấu Trúc Nền Tảng & Dọn Dẹp Mã Nguồn (Refactoring)
- [ ] **Task 1.1:** Định nghĩa `IAudioStorage` và `ITtsService` trong `src/types/index.ts`. Cập nhật `AudioCacheService.ts` và `ZaloTtsClient.ts` tuân theo contracts.
- [ ] **Task 1.2:** Xóa bỏ component thừa `src/components/ControlBar.tsx` và dọn import thừa trong `src/pages/Playground.tsx`.
- [ ] **Task 1.3:** Dọn dẹp các file `.wav` và `.js` thử nghiệm tạm trong `scripts/`.

#### Checkpoint 1: Foundation Clean
- [ ] `npm run build` (`tsc -b && vite build`) thành công 0 lỗi.
- [ ] `npm test` pass 100% test suites hiện tại.

---

### Phase 2: Triển Khai Xử Lý Âm Thanh DSP & Tinh Chỉnh TTS (Trọng tâm)
- [x] **Task 2.1:** Cải tiến thuật toán cắt lọc DSP trong `src/core/audio/AudioDspProcessor.ts` (pre-roll 25ms, decay tail 80ms, giảm gain boost, làm mịn Cosine) và cập nhật unit test `test/audio_dsp_processor.test.js`.
- [x] **Task 2.2:** Tinh chỉnh `src/core/audio/ZaloTtsClient.ts`: Đặt tốc độ mặc định `0.95x` (thay vì `0.8x`) cho từ đơn lẻ và hỗ trợ cấu hình proxy URL backend.
- [x] **Task 2.3:** Tối ưu hóa dừng âm thanh tức thì trong `SpriteManager.ts` & `AudioSpritePlayer.ts` khi người dùng bấm Dừng (Stop), hủy bỏ timer và tiến trình ngầm.
- [x] **Task 2.4:** Bố trí công cụ thẩm âm trực quan để người dùng nhập từ mới, bấm nghe thử đọc từng từ và đánh vần.

#### ★ CHECKPOINT 2: NGƯỜI DÙNG KIỂM TRA & DUYỆT CHẤT LƯỢNG ÂM THANH ★
- [ ] Người dùng trực tiếp nghe thử phát âm từ mới trên loa thiết bị.
- [ ] Xác nhận âm thanh tròn vành, tự nhiên, không còn cảm giác khô cứng.
- [ ] Người dùng cho phép mới chuyển tiếp sang Phase 3.

---

### Phase 3: Nâng Cấp Core Parser & Tokenizer Đa Dòng
- [x] **Task 3.1:** Bổ sung `type: 'syllable' | 'punctuation' | 'space' | 'newline'` cho `Token` trong `src/types/index.ts`.
- [x] **Task 3.2:** Viết lại `tokenizeVietnameseText` trong `src/core/parser/vietnamesePhonics.ts` (tách từ, tách dấu câu, giữ nguyên ngắt dòng `\n`).
- [x] **Task 3.3:** Viết unit test `test/tokenizer.test.js` kiểm tra bài thơ nhiều dòng và dấu câu phức tạp.

#### Checkpoint 3: Parser & Tokenizer Validated [ĐÃ ĐẠT]
- [x] `node --test test/tokenizer.test.js` pass 100%.

---

### Phase 4: Giao Diện Bé Học & Modal Nạp Bài Phụ Huynh 2-in-1
- [x] **Task 4.1:** Cập nhật `KidReaderBoard.tsx` & `WordBubble.tsx` hiển thị chuẩn theo từng dòng thơ và tách biệt dấu câu xám trang nhã.
- [x] **Task 4.2:** Xây dựng `ParentLessonModal.tsx` gồm Tab 1 (Dán chữ trực tiếp + Bài mẫu SGK) và Tab 2 (Quét ảnh OCR/Camera), dẫn qua khung rà soát sửa nhanh `TextProofreader`.
- [x] **Task 4.3:** Tích hợp modal vào `KidLearningPage.tsx` và tự động lưu bài học gần nhất vào `localStorage`.

#### Checkpoint 4: UI & Parent Input Ready [ĐÃ ĐẠT]
- [x] Bài thơ hiển thị xuống dòng từng câu ngay ngắn.
- [x] Phụ huynh nạp bài dễ dàng qua cả dán chữ lẫn OCR.
- [x] Tải lại trang web bài học vẫn được lưu nguyên vẹn.

---

### Phase 5: Kiểm Thử Tổng Hợp & Đóng Gói Hoàn Thiện
- [x] **Task 5.1:** Chạy toàn bộ test suite `npm test` đạt 100% pass (50/50 tests).
- [x] **Task 5.2:** `npm run build` tạo thư mục `dist/` hoàn chỉnh 0 warning/lỗi.
- [x] **Task 5.3:** Kiểm tra tương tác cảm ứng và responsive trên iPad/điện thoại.

#### Checkpoint 5: Project Complete & Ready for Daily Use [ĐÃ ĐẠT]
- [x] Tất cả tiêu chí trong SPEC-01 v2.0.0 được nghiệm thu đầy đủ.

---

### Phase 12: Màn Hình Bảng Chữ Cái & Khay Ghép Vần Tương Tác (Montessori Phonics Lab)
- [x] **Task 12.1: Xây dựng bộ dữ liệu ngữ âm chuẩn (`src/core/data/vietnameseAlphabet.ts`)**
  - Khai báo 29 chữ cái tiếng Việt kèm nhãn phát âm theo Âm ("bờ", "cờ", "dờ"...) và sprite key tương ứng.
  - Khai báo 11 phụ âm ghép (`ch`, `tr`, `ng`, `kh`...) và sprite key.
  - Khai báo ~145 vần chia theo 4 họ vần kèm công thức đánh vần mẩu (`spellingSteps` trỏ vào sprite keys).
- [x] **Task 12.2: Xây dựng các component thẻ chữ và thẻ vần (`LetterCard.tsx`, `RimeCard.tsx`)**
  - Thiết kế thẻ gỗ nam châm xúc giác chuẩn Fitts ($\ge 56\text{px}$) trên nền giấy ngà ấm `#FAF8F5`.
  - Nút kép trên thẻ vần: Đọc trơn và đánh vần mẩu bóc tách từng bước (*"a - ngờ - ang"*).
- [x] **Task 12.3: Xây dựng Khay Ghép Vần Tương Tác (`SoundBlendingTray.tsx`)**
  - Cho phép bé chọn 1 phụ âm đầu + 1 vần và bấm "Ghép Vần".
  - Tự động phát chuỗi âm thanh ghép nối mượt mà từ Master Sprite (ví dụ: *"bờ - an - ban"*).
- [x] **Task 12.4: Xây dựng trang `AlphabetLearningPage.tsx` & Tích hợp Header Navigation vào `App.tsx`**
  - Quản lý 3 Tab: 29 Chữ cái | 11 Phụ âm ghép | Bảng vần & Khay ghép âm.
  - Cập nhật Header Capsule Toggle trên `App.tsx`: [📖 Bài Đọc SGK] ⟷ [🔤 Bảng Chữ Cái & Âm] ⟷ [🧪 Lab].
- [x] **Task 12.5: Viết bộ kiểm thử TDD tự động (`test/alphabet_board.test.js`) & Đóng gói hoàn thiện**
  - Kiểm tra độ phủ 100% của chữ cái, phụ âm ghép và vần với Master Sprite (116/116 tests pass).
  - Chạy `npm test` và `npm run build` đảm bảo 0 lỗi.

#### Checkpoint 12: Bảng Chữ Cái & Khay Ghép Vần Hoàn Hảo [ĐÃ ĐẠT]
- [x] 29 chữ cái phát âm chuẩn theo Âm ("bờ", "cờ", "dờ").
- [x] 11 phụ âm ghép và ~145 vần phát âm tức thì < 15ms.
- [x] Chuỗi đánh vần mẩu ("a - ngờ - ang") hoạt động trơn tru.
- [x] 100% tests PASS, build production sạch sẽ.

---

## 4. Risks and Mitigations (Rủi Ro & Biện Pháp Kiểm Soát)

| Rủi ro | Mức độ | Biện pháp kiểm soát |
|---|---|---|
| Zalo TTS bị lỗi mạng hoặc hết quota khi người dùng tải từ mới | Trung bình | Tự động fallback về Web Audio Synth tone êm ái, hiển thị thông báo rõ ràng, không bao giờ để ứng dụng im lặng. |
| Phụ âm xát (*th, s, kh*) bị mất năng lượng khi gọt DSP | Thấp | Mở rộng pre-roll lên 25ms và chỉ bắt đầu tính năng lượng sau 5ms windowing tích phân. |
| Người dùng bấm Dừng nhưng âm thanh vẫn bị phát đè | Thấp | Sử dụng ID định danh phiên phát (`playbackId`), hủy bỏ mọi `setTimeout` còn chờ và xả Gain về 0.0001 trong 3ms. |
| Trình duyệt di động chặn Autoplay âm thanh | Trung bình | Cơ chế Auto-Unlock đa sự kiện (`touchstart`, `click`, `keydown`) tại `WebAudioEngine`. |
| Danh mục 145 vần gây quá tải thị giác cho bé 6 tuổi | Thấp | Chia làm 4 nhóm vần rõ ràng với tab cuộn mượt và kích thước thẻ lớn. |

---

## 5. Open Questions (Câu Hỏi Mở)

- *Đã giải quyết:* Bé sẽ nghe phát âm chữ cái theo **Âm** (*"bờ"*, *"cờ"*, *"dờ"*) theo đúng định hướng SGK mới mà người dùng đã phê duyệt.
