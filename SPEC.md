# SPEC-01: Ứng Dụng Học Đọc & Đánh Vần Tiếng Việt Lớp 1 (Kết Nối Tri Thức)

> **Trạng thái:** DRAFT FOR APPROVAL  
> **Phiên bản:** 2.0.0  
> **Chuẩn sư phạm:** SGK Tiếng Việt 1 - Bộ "Kết Nối Tri Thức Với Cuộc Sống"  
> **Mục tiêu triển khai:** Ứng dụng Web/PWA tối ưu cho bé tự học và phụ huynh nạp bài trên máy tính bảng / điện thoại / máy tính; kiến trúc Service Layer sẵn sàng cắm Backend Server khi mở rộng.

---

## 1. Objective (Mục Tiêu & Bối Cảnh)

### 1.1 Bối Cảnh & Vấn Đề Thực Tế
- Bé lớp 1 (6 tuổi) cần luyện đọc và đánh vần bài tập đọc về nhà mỗi ngày theo sách giáo khoa mới.
- Các ứng dụng trước đây hoặc dự án dở dang gặp các hạn chế nghiêm trọng:
  1. **Âm thanh khô cứng:** Chế độ đọc từng từ phát âm gượng gạo, giật cục; thuật toán cắt lọc DSP client-side cắt quá gắt làm mất phụ âm đầu/đuôi và mất độ ngân tự nhiên của giọng đọc.
  2. **Lỗi hiển thị thơ:** Bộ tách từ (`tokenizeVietnameseText`) nuốt mất ký tự xuống dòng `\n`, biến các bài thơ 4 chữ, 5 chữ ngắn thành một đoạn văn xuôi dài, đồng thời dính liền dấu chấm/phẩy vào chữ.
  3. **Bất tiện cho phụ huynh:** Chưa có khung nhập/dán văn bản trực tiếp (khi cô giáo gửi bài qua tin nhắn), chỉ có nút quét ảnh OCR.
  4. **Kiến trúc chưa module hóa:** Chưa có lớp trừu tượng (Service Layer) để khi cần kết nối Server Backend (Node.js/Python) thì không phải viết lại UI.

### 1.2 Giải Pháp Cốt Lõi
Xây dựng ứng dụng **Gia sư Đánh vần Tương tác Thông minh** cho gia đình:
1. **Phụ huynh nạp bài 2 trong 1:** Dán/gõ nhanh văn bản bài học hoặc chụp ảnh trang sách qua In-Browser OCR, có khung rà soát sửa lỗi (`TextProofreader`) trước khi kích hoạt bài cho bé.
2. **Giao diện học tập trực quan cho bé 6 tuổi:**
   - **Bảng đọc chữ lớn:** Typography $\ge 32\text{px}$, hiển thị chuẩn từng dòng thơ, khổ thơ; dấu câu tách rời rõ ràng.
   - **Tương tác 1-chạm:** Bé chạm vào bất kỳ từ nào sẽ mở popup phóng to bóc tách 3 màu: `[Âm đầu - Xanh]` + `[Vần - Cam]` + `[Thanh - Đỏ/Tím]` và phát âm thanh đánh vần chuẩn sư phạm.
   - **Chế độ Karaoke đồng bộ:** Vệt sáng nhảy chính xác theo nhịp đọc của từng từ theo thời gian thực (60fps).
3. **Bộ máy Âm thanh Tự nhiên & DSP Mềm Mại:**
   - Tận dụng kho 225 clip Audio Sprite Master chuẩn sư phạm đã đóng gói.
   - Thuật toán DSP cải tiến với khoảng an toàn đầu (pre-roll 25ms), đuôi ngân tự nhiên (reverb decay tail 80ms) và micro fade 8ms, triệt tiêu hoàn toàn cảm giác cụt tiếng và khô cứng.
   - Cơ chế ngắt dứt khoát khi bấm Dừng (Stop) mà không để lại tác vụ nền chạy ngầm.
4. **Kiến trúc Service Layer sẵn sàng cắm Backend:** Tách bạch các interface `IAudioStorage` và `ITtsService`. Hiện tại chạy 100% Client-side (IndexedDB + Zalo Client), tương lai chỉ cần trỏ sang Backend API mà không cần sửa đổi giao diện.

---

## 2. Capability Map (Bản Đồ Năng Lực Hệ Thống)

```
┌────────────────────────────────────────────────────────┐
│                   GIAO DIỆN NGƯỜI DÙNG                 │
│  [KidLearningPage]               [ParentLessonModal]   │
│  ├── KidReaderBoard              ├── DirectTextInput   │
│  ├── WordBubble (Poem/Lines)     └── OCR / Proofreader │
│  ├── PhonicsBadgeModal (1-Touch)                       │
│  └── KidControlBar (Play/Mode)                         │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│                 TẦNG XỬ LÝ NGHIỆP VỤ                   │
│  [core-parser]                 [audio-orchestrator]    │
│  ├── vietnamesePhonics.ts       ├── AudioSpritePlayer   │
│  ├── vietnameseRules.ts         └── LessonAudioSyncer   │
│  └── tokenizeVietnameseText                            │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│               SERVICE ABSTRACTION LAYER                │
│  [IAudioStorage]               [ITtsService]           │
│  ├── Client: AudioCacheService ├── Client: ZaloTts     │
│  └── Future: BackendApiStorage └── Future: BackendTts  │
│                                                        │
│  [AudioEngine & DSP]                                   │
│  ├── WebAudioEngine (Lookahead, Auto-Unlock Safari)   │
│  ├── SpriteManager (Master 225 clips, In-Memory RAM)  │
│  └── AudioDspProcessor (Smart Decay, Hann Window 12ms) │
└────────────────────────────────────────────────────────┘
```

| Module ID | Trách nhiệm chính | Phụ thuộc |
|---|---|---|
| `core-parser` | Phân rã ngữ âm chuẩn SGK (âm đầu, vần, thanh, công thức), tokenizer đa dòng bảo toàn thơ và dấu câu | Không |
| `audio-dsp` | Xử lý tín hiệu PCM: gọt khoảng lặng mềm (pre-roll 25ms, decay tail 80ms), Hann window 12ms, chuẩn hóa âm lượng | Không |
| `audio-engine` | Web Audio API singleton, Sprite slicing in-memory, lookahead scheduling 25ms, mobile audio unlock | `audio-dsp` |
| `service-layer` | Interfaces trừu tượng cho Cache và TTS, hiện tại chạy IndexedDB & Client Zalo, sẵn sàng gắn Backend Server | `audio-engine` |
| `ocr-pipeline` | In-browser OCR với Tesseract.js Web Worker tiếng Việt, Canvas preprocessor tăng tương phản, bộ lọc văn bản | `service-layer` |
| `kid-parent-ui` | Giao diện thân thiện bé 6 tuổi, thơ ngắt dòng, 1-chạm ngữ âm, modal nạp bài phụ huynh 2 trong 1 | Tất cả modules trên |

---

## 3. Tech Stack & Dependencies

- **Ngôn ngữ:** TypeScript 5.7+ (Strict mode, no implicit any).
- **Frontend Framework:** React 18.3+ (Functional components, Hooks).
- **Build Tool:** Vite 6.1+.
- **Giao diện:** Tailwind CSS 3.4+, PostCSS, `lucide-react`.
- **Âm thanh Client:** Web Audio API Native (`AudioContext`, `AudioBufferSourceNode`, `GainNode`).
- **Kho âm thanh nền tảng:** 225 clip chuẩn SGK (`sprite-main.mp3`, `audio-map.json`).
- **Lưu trữ ngoại tuyến Client:** IndexedDB (`AudioCacheService`) lưu vĩnh viễn âm thanh từ mới.
- **Client OCR:** `tesseract.js` v7 running Web Worker (`vie`).
- **Mở rộng tương lai (Optional Backend):** REST API endpoints (`/api/tts`, `/api/audio-cache`).

---

## 4. Commands (Lệnh Thực Thi Chuẩn)

```bash
# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy môi trường phát triển local (Vite dev server)
npm run dev

# Kiểm tra kiểu TypeScript và đóng gói bản phát hành
npm run build

# Xem thử bản đóng gói production (preview)
npm run preview

# Chạy toàn bộ bộ kiểm thử tự động (Unit test suite)
npm test

# Tái đóng gói Audio Sprite Master khi cập nhật danh mục âm thanh
npm run build:sprite
```

---

## 5. Project Structure (Cấu Trúc Thư Mục Chuẩn)

```
d:\Workspace\web_apps\app_hoc_danh_van
├── SPEC.md                           # [Tài liệu này] Đặc tả kiến trúc và yêu cầu hệ thống
├── danh_muc_am_thanh_lop_1.md        # Danh mục 198 âm vị chuẩn SGK Tiếng Việt 1
├── tasks/
│   ├── plan.md                       # Kế hoạch triển khai chi tiết
│   └── todo.md                       # Danh sách task theo dõi tiến độ
├── public/
│   └── audio/
│       ├── audio-map.json            # Toạ độ start, end, duration 225 clips
│       ├── sprite-main.mp3           # Audio Sprite Master chất lượng cao
│       └── sprite-main.webm          # Audio Sprite Master tối ưu nén
├── test/                             # Toàn bộ automated unit test suite
│   ├── audio_pedagogy.test.js        # Test bóc tách ngữ âm & công thức đánh vần
│   ├── audio_dsp_processor.test.js   # Test thuật toán gọt khoảng lặng & Hann windowing
│   ├── ocr_sanitizer.test.js         # Test làm sạch văn bản và lọc số trang
│   └── tokenizer.test.js             # Test ngắt dòng thơ và tách biệt dấu câu
└── src/
    ├── types/
    │   └── index.ts                  # Toàn bộ TypeScript interfaces & service contracts
    ├── core/
    │   ├── parser/
    │   │   ├── vietnameseRules.ts    # Bảng chữ cái, 28 âm đầu, vần SGK, 6 thanh
    │   │   ├── vietnamesePhonics.ts  # Logic bóc tách, tiếng đệm sắc, tokenizer đa dòng
    │   │   └── vietnameseParser.ts   # Re-export facade
    │   ├── audio/
    │   │   ├── WebAudioEngine.ts     # AudioContext singleton, mobile unlock
    │   │   ├── AudioDspProcessor.ts  # Bộ xử lý PCM mềm mại, smart decay 80ms
    │   │   ├── SpriteManager.ts      # Quản lý RAM buffer, ngắt dứt khoát khi stop
    │   │   ├── AudioSpritePlayer.ts  # Phát trơn, phát đánh vần, điều phối Karaoke
    │   │   ├── AudioCacheService.ts  # Lưu trữ ngoại tuyến IndexedDB (IAudioStorage)
    │   │   ├── ZaloTtsClient.ts      # Gọi TTS Zalo (ITtsService), sẵn sàng proxy Backend
    │   │   └── LessonAudioSyncer.ts  # Đồng bộ âm bài đọc mới
    │   └── ocr/
    │       ├── tesseractService.ts   # Quản lý Web Worker Tesseract vie
    │       ├── imagePreprocessor.ts  # Canvas filter (contrast + binarize)
    │       └── textSanitizer.ts      # Làm sạch chữ nhận diện
    ├── components/
    │   ├── kid/
    │   │   ├── KidReaderBoard.tsx    # Vùng hiển thị bài đọc (hỗ trợ dòng thơ & văn xuôi)
    │   │   ├── WordBubble.tsx        # Thẻ từ 1-chạm, tách biệt dấu câu
    │   │   └── PhonicsBadgeModal.tsx # Popup phóng to [Âm đầu]-[Vần]-[Thanh]
    │   ├── parent/
    │   │   ├── ParentLessonModal.tsx # Modal nạp bài 2 trong 1 (Dán chữ + Quét ảnh)
    │   │   ├── CameraCapture.tsx     # Chụp ảnh trực tiếp từ camera
    │   │   └── TextProofreader.tsx   # Khung sửa nhanh văn bản bài học
    │   └── shared/
    │       └── KidControlBar.tsx     # Nút Đọc/Dừng lớn, chọn chế độ, chỉnh tốc độ
    ├── pages/
    │   ├── KidLearningPage.tsx       # Màn hình học tập chính của bé
    │   └── Playground.tsx            # Phòng thử nghiệm âm thanh & kiểm tra công thức
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

---

## 6. Code Style & Technical Conventions

### 6.1 Quy Chuẩn Lập Trình
- Sử dụng **Named Exports** cho mọi components, classes và utilities.
- Các hàm phân rã trong `core/parser` bắt buộc là **Pure Functions** (không side-effects).
- Các module âm thanh trong `core/audio` tuân theo **Singleton Pattern** để chia sẻ duy nhất 1 instance `AudioContext`.
- Không gọi Web Speech API (giọng đọc robot tiếng Việt mặc định của trình duyệt) vì phát âm sai phương pháp sư phạm tiểu học.

### 6.2 Snippet Mẫu: Service Layer Contract & Phonics Tokenizer

```typescript
// src/types/index.ts - Hợp đồng trừu tượng sẵn sàng gắn Backend Server
export interface IAudioStorage {
  hasClip(key: string): Promise<boolean>;
  getClip(key: string): Promise<ArrayBuffer | null>;
  saveClip(key: string, data: ArrayBuffer, mimeType: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ITtsService {
  synthesizeWord(word: string, speed?: number): Promise<ArrayBuffer>;
}

// Token hỗ trợ chuẩn ngắt dòng bài thơ
export interface Token {
  id: string;
  text: string;
  type: 'syllable' | 'punctuation' | 'space' | 'newline';
  phonics?: PhonicsBreakdown;
  isActive?: boolean;
}
```

---

## 7. Testing Strategy (Chiến Lược Kiểm Thử)

1. **Unit Testing Tự Động (Agent thực hiện bằng Node.js Native Test Runner):**
   - Chạy lệnh: `npm test`
   - Kiểm thử 100% các ca ngữ âm đặc biệt: vần khép tắc $p, t, c, ch$ với thanh nặng và tiếng đệm sắc (`giặt` $\rightarrow$ `giắt`, `học` $\rightarrow$ `hóc`, `vịt` $\rightarrow$ `vít`), vần `uyu` trong `khuỷu`.
   - Kiểm thử thuật toán DSP: Cắt khoảng lặng với pre-roll an toàn, Hann windowing 12ms, bảo toàn năng lượng âm thanh.
   - Kiểm thử Tokenizer: Đảm bảo ngắt dòng `\n` không bị nuốt, dấu câu được tách riêng khỏi từ.
2. **Build TypeCheck & Lint (Agent thực hiện):**
   - Chạy lệnh: `npm run build`
   - Đảm bảo 0 lỗi TypeScript strict mode, bundle production sạch sẽ.
3. **Kiểm Thử Trực Quan & Thẩm Âm (Người dùng nghiệm thu trên trình duyệt):**
   - Nghe thử các từ mới phát ra từ loa điện thoại/máy tính để xác nhận không còn khô cứng.
   - Kiểm tra bài thơ hiển thị xuống dòng từng câu dễ đọc cho trẻ.
   - Thử dán văn bản và thử quét ảnh trang sách qua modal phụ huynh.

---

## 8. Boundaries (Quy Chuẩn & Ranh Giới)

### Always Do (Luôn luôn thực hiện)
1. Luôn chạy `npm test` và `npm run build` trước khi hoàn tất mỗi phân hệ để bảo đảm 0 lỗi biên dịch và không gây hồi quy (regression).
2. Khi cắt gọt âm thanh Zalo mới tải về, luôn giữ pre-roll tối thiểu 20ms và đuôi ngân tự nhiên 80ms để bảo toàn âm sắc người thật.
3. Khi người dùng bấm **Dừng (Stop)**, phải ngắt âm thanh và hủy bỏ ngay các tác vụ tải ngầm (`setTimeout`, `pendingFetches`).
4. Thiết kế giao diện nút bấm tối thiểu $48\text{px} \times 48\text{px}$ để bé chạm ngón tay thoải mái trên iPad/điện thoại.

### Ask First (Phải hỏi ý kiến người dùng trước khi làm)
1. Thay đổi danh mục 198 âm vị cốt lõi trong `danh_muc_am_thanh_lop_1.md`.
2. Cài đặt thêm các thư viện NPM nặng ngoài những gói đã có trong `package.json`.
3. Triển khai phần Backend Server thực tế (khi nào bạn yêu cầu làm backend thì mới tiến hành).

### Never Do (Tuyệt đối không làm)
1. **Không** dùng Web Speech API robot của trình duyệt để đọc từ thay thế giọng người thật.
2. **Không** nuốt dấu ngắt dòng `\n` của các bài thơ tiếng Việt.
3. **Không** gửi ảnh trang sách hoặc dữ liệu của bé ra các máy chủ bên ngoài không rõ nguồn gốc (bảo toàn nguyên tắc In-Browser OCR bảo mật).
4. **Không** xóa các đoạn comment hoặc tài liệu sư phạm quan trọng trong codebase.

---

## 9. Success Criteria (Tiêu Chí Nghiệm Thu Dự Án)

- [ ] **SC-01 (Natural Audio Quality):** Chế độ đọc từng từ và đánh vần phát ra âm thanh tròn tiếng, tự nhiên, không bị cụt phụ âm đầu/đuôi, không còn cảm giác khô cứng.
- [ ] **SC-02 (Poem Layout & Punctuation):** Các bài thơ 4 chữ, 5 chữ lớp 1 hiển thị xuống dòng ngay ngắn theo từng câu; dấu câu tách rời bong bóng từ của bé.
- [ ] **SC-03 (Parent Lesson Input 2-in-1):** Phụ huynh có thể nạp bài bằng cả 2 cách (Dán văn bản trực tiếp hoặc Quét ảnh OCR) và sửa nhanh qua khung Proofreader.
- [ ] **SC-04 (Clean State & Responsive Stop):** Khi bấm nút Dừng lại, âm thanh tắt êm ái trong 3ms, không bị hiện tượng tự động nhảy tiếp các từ sau đó.
- [ ] **SC-05 (Backend-Ready Architecture):** Service Layer được module hóa theo interfaces rõ ràng, sẵn sàng cắm server backend mà không phải viết lại code UI.
- [ ] **SC-06 (Code Hygiene & 100% Tests Pass):** Xóa bỏ component thừa `ControlBar.tsx`, dọn file tạm trong `scripts/`, `npm test` và `npm run build` pass 100%.
