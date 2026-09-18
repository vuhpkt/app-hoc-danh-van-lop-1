# Ứng Dụng Học Đánh Vần Tiếng Việt Lớp 1 (Kết Nối Tri Thức)

> Ứng dụng web sư phạm chuẩn mực hỗ trợ trẻ 6 tuổi học đọc, ghép vần và đánh vần Tiếng Việt Lớp 1. Được xây dựng theo nguyên tắc **Offline-First**, **100% giọng đọc người thật (Zero Robot TTS)**, giao diện **Montessori tối giản** và tích hợp **nhận diện trang sách OCR ngay trên trình duyệt**.

[![Node.js Tests](https://img.shields.io/badge/Tests-77%2F77%20PASS-brightgreen)](file:///d:/Workspace/web_apps/app_hoc_danh_van/test)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](file:///d:/Workspace/web_apps/app_hoc_danh_van/tsconfig.json)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%26%20Modular-orange)](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/architecture.md)
[![Audio Pipeline](https://img.shields.io/badge/Audio-Master%20Sprite%20v4.2.0-purple)](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/audio_guide.md)

---

## 1. Bắt Đầu Nhanh (Quick Start)

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 20.x hoặc 22.x LTS (khuyến nghị $\ge 20.10.0$).
- **Trình duyệt**: Chrome, Microsoft Edge, Firefox, Safari (hỗ trợ Web Audio API & IndexedDB).
- **Hệ điều hành**: Windows, macOS hoặc Linux.

### Cài Đặt & Chạy Phát Triển
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển (Vite Dev Server)
npm run dev

# 3. Mở trình duyệt truy cập:
# http://localhost:5173
```

### Các Lệnh Quan Trọng Trong Dự Án
| Lệnh (`npm run ...`) | Mô tả chi tiết |
| :--- | :--- |
| `npm run dev` | Khởi động Vite dev server với Hot Module Replacement (HMR). |
| `npm test` | Chạy toàn bộ 77 bài kiểm thử tự động (Unit & Integration tests) qua Node.js Native Test Runner. |
| `npm run build` | Biên dịch TypeScript (`tsc -b`) và đóng gói mã nguồn production qua Vite (`dist/`). |
| `npm run stretch:audio` | Kéo giãn thời lượng tự nhiên (WSOLA) và chuẩn hóa âm lượng cho các từ ngắn/gấp. |
| `npm run build:sprite` | Đóng gói 280 file mẩu âm thành Master Audio Sprite (`sprite-main.mp3` & `.webm` + `audio-map.json`). |
| `npm run generate:zalo` | Tải lại 280 mẩu âm thanh chuẩn từ Zalo AI API (giọng Bắc Ngọc Huyền 0.8x). |

---

## 2. Kiến Trúc Cốt Lõi Dự Án (Core Architecture)

```
app_hoc_danh_van/
├── public/
│   └── audio/
│       ├── audio-map.json            # Bảng toạ độ 280 mẩu âm thanh (start, end, duration)
│       ├── sprite-main.mp3           # Master Audio Sprite định dạng MP3 (1020 KB)
│       └── sprite-main.webm          # Master Audio Sprite định dạng WebM (696 KB)
├── raw-audio/                        # 280 file âm thanh MP3 gốc được Zalo AI tổng hợp
├── scripts/
│   ├── build-audio-sprite.js         # Đóng gói mẩu âm vào sprite với DSP padding & Hann windowing
│   ├── generate-zalo-tts.js          # Script tải âm thanh tự động qua Zalo AI TTS API
│   └── stretch-raw-audio.js          # Thuật toán WSOLA time-stretching bảo toàn cao độ
├── src/
│   ├── components/
│   │   ├── audio/                    # AudioMasteringLab & Visualizer cho DSP
│   │   ├── kid/                      # Giao diện bé học (KidReaderBoard, WordBubble, PhonicsBadgeModal)
│   │   ├── parent/                   # Modal phụ huynh nạp bài (ParentLessonModal: Text & OCR Scanner)
│   │   └── shared/                   # Thanh điều khiển nổi KidControlBar (Phát, Tốc độ, Chế độ)
│   ├── core/
│   │   ├── audio/                    # Động cơ âm thanh: AudioDspProcessor, SpriteManager, CacheService
│   │   ├── data/                     # Dữ liệu 4 bài đọc mẫu chuẩn SGK Lớp 1 (grade1Lessons.ts)
│   │   └── parser/                   # Bộ bóc tách ngữ âm Tiếng Việt (vietnamesePhonics.ts)
│   ├── pages/
│   │   ├── KidLearningPage.tsx       # Màn hình chính bé học đọc & tương tác
│   │   └── Playground.tsx            # Phòng thí nghiệm A/B Testing âm thanh
│   ├── types/                        # Khai báo kiểu dữ liệu TypeScript & Service Contracts
│   └── App.tsx                       # Bộ điều hướng trung tâm (Học bài / Phòng thí nghiệm)
└── test/                             # 77 bài kiểm thử tự động (Acoustics, Parser, OCR, UI, Cache)
```

---

## 3. Ba Trụ Cột Kỹ Thuật Đặc Biệt (Key Pillars)

### 1. Động Cơ Ngữ Âm Thuần Khiết (Deterministic Vietnamese Phonics Engine)
* **Tệp mã nguồn:** [`src/core/parser/vietnamesePhonics.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/parser/vietnamesePhonics.ts)
* **Nguyên lý:** Phân tích toán học thuần khiết (Pure Functions), không phụ thuộc vào từ điển khổng lồ hay mạng AI trực tuyến.
* **Quy tắc sư phạm:**
  * **Vần khép tắc ($p, t, c, ch$):** Tiếng Việt chỉ cho phép đi với thanh **Sắc** hoặc thanh **Nặng**. Khi đánh vần tiếng thanh Nặng, quy trình bắt buộc đi qua tiếng đệm sắc:
    $$\text{giặt} \longrightarrow \text{gi} - \text{ắt} - \text{giắt} - \text{nặng} - \text{giặt}$$
    $$\text{học} \longrightarrow \text{h} - \text{óc} - \text{hóc} - \text{nặng} - \text{học}$$
  * **Tokenizer đa dòng:** Tách rời dấu câu khỏi bong bóng từ, bảo toàn nguyên vẹn cấu trúc ngắt dòng `\n` của các bài thơ lớp 1.

### 2. Hệ Thống Âm Thanh 3 Tầng (3-Tier Natural Audio Pipeline)
* **Tệp mã nguồn:** [`src/core/audio/SpriteManager.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/SpriteManager.ts), [`AudioDspProcessor.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/AudioDspProcessor.ts)
* **Tầng 1 - Master Audio Sprite (RAM Cache):** 280 mẩu âm cơ bản (28 âm đầu, 145 vần, 6 dấu thanh, 100+ từ vựng SGK) được nạp trước vào RAM AudioBuffer ngay khi mở ứng dụng. Độ trễ phát tức thì **< 15ms**, hoạt động 100% khi không có mạng (Offline).
* **Tầng 2 - Client DSP Dynamic Cache (IndexedDB):** Đối với từ vựng mới phụ huynh nhập vào, client tự động gửi tải qua Zalo AI, sau đó đưa qua `AudioDspProcessor` (cắt tỉa khoảng lặng thông minh, Hann Windowing 12ms, Biquad Peaking EQ ấm áp, Micro-Ambience) và lưu vào IndexedDB.
* **Tầng 3 - Co giãn âm học WSOLA (Time-Stretching):** Sử dụng thuật toán Waveform Similarity Overlap-Add (`atempo`) để kéo giãn các từ nguyên âm ngắn như *"em"* (từ 187ms lên 307ms) và *"lo"* (từ 241ms lên 335ms), cân bằng hoàn hảo nhịp điệu bài đọc mà **không làm thay đổi cao độ**.

### 3. Giao Diện Tối Giản Montessori & Nhận Diện OCR 2-in-1
* **Tệp mã nguồn:** [`src/components/kid/`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/kid), [`src/components/parent/ParentLessonModal.tsx`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/parent/ParentLessonModal.tsx)
* **Triết lý Sách Giấy Ngà Ấm (#FAF8F5):** Loại bỏ hoạt họa màu mè gây xao nhãng; sử dụng thẻ từ dạng khối gỗ nam châm xúc giác (Tactile Magnetic Tiles) với tương tác vi mô nổi khối.
* **Quy chuẩn xúc giác trẻ em:** Phím bấm tuân thủ luật Fitts ($48\text{px} \times 48\text{px}$), chữ to rõ nét $\ge 32\text{px}$, đạt chuẩn tương phản màu sắc WCAG AA.
* **Bóc tách ngữ âm 3 màu pastel:** Âm đầu (Xanh da trời mát), Vần (Vàng mơ mật ong), Dấu thanh (Hồng phấn êm ái).
* **Nhận diện OCR trên trình duyệt (In-Browser OCR):** Phụ huynh chụp ảnh trang sách giáo khoa, Tesseract.js xử lý trực tiếp trên máy không gửi ảnh ra máy chủ bên ngoài, có khung rà soát sửa nhanh trước khi nạp vào bảng đọc.

---

## 4. Các Tài Liệu Kỹ Thuật Chuyên Sâu (Documentation & ADRs)

Dự án duy trì hệ thống tài liệu kiến trúc và quyết định thiết kế đầy đủ:

1. **[Kiến Trúc Hệ Thống & Luồng Hoạt Động (Architecture Guide)](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/architecture.md)**: Chi tiết thiết kế các phân hệ, vòng đời Audio Context và tương tác giữa các service.
2. **[Cẩm Nang Quản Lý Kho Âm Thanh (Audio Engineering Guide)](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/audio_guide.md)**: Hướng dẫn chi tiết cách bổ sung từ mới, chạy DSP time-stretching, đóng gói sprite và quản lý cache.
3. **Danh Sách Quyết Định Kiến Trúc (Architecture Decision Records - ADRs):**
   - **[ADR-001: Master Audio Sprite Offline-First & Loại Bỏ Web Speech API](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/decisions/ADR-001-master-audio-sprite-offline-first.md)**
   - **[ADR-002: Client-Side In-Browser OCR Bảo Mật Quyền Riêng Tư](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/decisions/ADR-002-in-browser-ocr-privacy-first.md)**
   - **[ADR-003: Xử Lý Tín Hiệu Số DSP & Kéo Giãn WSOLA Bảo Toàn Cao Độ](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/decisions/ADR-003-dsp-audio-processing-and-wsola-stretching.md)**
   - **[ADR-004: Động Cơ Phân Tách Ngữ Âm Thuần Khiết Chuẩn SGK](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/decisions/ADR-004-vietnamese-phonics-deterministic-parser.md)**
   - **[ADR-005: Thiết Kế Giao Diện Tối Giản Montessori Cho Trẻ 6 Tuổi](file:///d:/Workspace/web_apps/app_hoc_danh_van/docs/decisions/ADR-005-montessori-minimalist-ui-design.md)**

---

## 5. Những Điều Cần Lưu Ý Khi Phát Triển Tiếp (Developer Gotchas)

> [!CAUTION]
> **1. Tuyệt đối không sử dụng Web Speech API**  
> Giọng máy tổng hợp mặc định của trình duyệt (`window.speechSynthesis`) không thể phát âm chuẩn ngữ âm tiếng Việt lớp 1, bị ngọng dấu thanh và không thể bóc tách âm vần. Mọi âm thanh phải đi qua Master Sprite hoặc Zalo AI TTS.

> [!WARNING]
> **2. Tuyệt đối không thay đổi `playbackRate` của AudioContext để chỉnh tốc độ đọc**  
> Việc tăng/giảm `playbackRate` trên Web Audio API sẽ làm biến đổi cao độ giọng nói (khiến giọng cô giáo bị the thé như hoạt hình hoặc trầm ồm méo mó). Thay vào đó:
> - Giữ nguyên `source.playbackRate.setValueAtTime(1.0, now)`.
> - Để bé đọc chậm (Chế độ Rùa 0.6x), hãy tăng khoảng lặng giữa các từ (`silenceGap`) và áp dụng thuật toán FFmpeg WSOLA `atempo` khi xử lý file thô.

> [!IMPORTANT]
> **3. Cơ chế vượt bộ nhớ đệm (Cache-Busting) cho Master Sprite**  
> Khi bạn thêm từ mới hoặc re-build lại Master Sprite, bắt buộc phải nâng giá trị hằng số `SPRITE_VERSION` trong [`src/core/audio/SpriteManager.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/SpriteManager.ts) (ví dụ từ `v4.2.0` lên `v4.3.0`). Điều này buộc trình duyệt xóa bỏ file tĩnh trong HTTP Disk Cache.

> [!TIP]
> **4. Tính chất Idempotent khi chạy `npm run stretch:audio`**  
> Kịch bản `stretch:audio` luôn đọc từ thư mục gốc bất biến `raw-audio-backup/`. Nếu cần điều chỉnh tham số co giãn cho từ nào, hãy sửa trực tiếp mảng `ITEMS_TO_STRETCH` trong [`scripts/stretch-raw-audio.js`](file:///d:/Workspace/web_apps/app_hoc_danh_van/scripts/stretch-raw-audio.js) và chạy lại lệnh.

---

## 6. Tiêu Chuẩn Kiểm Thử & Đóng Gói (Quality Gates)

Trước khi tạo commit hoặc triển khai tính năng mới, luôn đảm bảo vượt qua 2 bước kiểm tra bắt buộc:

```bash
# 1. Chạy toàn bộ 77 bài kiểm thử
npm test
# Kết quả mong đợi: 77 pass, 0 fail, 0 skipped

# 2. Biên dịch Production Build
npm run build
# Kết quả mong đợi: 0 lỗi TypeScript, tạo thư mục dist/ thành công
```

---
*Dự án được xây dựng với tình yêu thương dành cho các em nhỏ lớp 1 bắt đầu bước vào thế giới con chữ.*
