# SPEC-01: Ứng dụng Học Đọc & Đánh Vần Tiếng Việt Lớp 1 (Tương tác SGK)

> **Trạng thái:** DRAFT / PENDING APPROVAL  
> **Phiên bản:** 1.0.0  
> **Chủ quản:** Đội ngũ phát triển `app-hoc-danh-van`  
> **Chuẩn sư phạm:** SGK Tiếng Việt 1 - Bộ "Kết Nối Tri Thức Với Cuộc Sống"

---

## 1. Objective (Mục tiêu & Đối tượng)

### 1.1 Bối cảnh & Vấn đề
Trẻ em 6 tuổi chuẩn bị vào lớp 1 hoặc đang học lớp 1 thường gặp khó khăn khi tự ôn bài tập đọc ở nhà:
- Các bé dễ bị lẫn lộn giữa các vần tương tự (`an/ang`, `oan/oang`, `ươn/ương`) và dấu thanh (`hỏi/ngã/nặng`).
- Phụ huynh không phải ai cũng nắm vững phương pháp sư phạm hiện hành để đánh vần đúng từng bước theo SGK mới.
- Các ứng dụng hiện nay thường là khóa học đóng gói sẵn cứng nhắc, không hỗ trợ bé học đúng đoạn văn/bài thơ cụ thể trong bài tập về nhà của trường.

### 1.2 Giải pháp
Xây dựng ứng dụng web **"Gia sư Đánh vần Tương tác Thông minh"**:
1. **Phụ huynh nạp bài:** Chép/dán đoạn văn bản hoặc chụp ảnh trực tiếp trang sách giáo khoa bằng điện thoại/webcam.
2. **Nhận diện chữ tức thì (In-Browser OCR):** Chạy trực tiếp 100% trong trình duyệt (Tesseract.js tiếng Việt), bảo mật và không cần API key trả phí. Phụ huynh có thể rà soát và sửa nhanh vài ký tự trước khi bắt đầu.
3. **Màn hình học tập tối ưu cho bé 6 tuổi:**
   - **Chế độ Tự động đọc mẫu:** Ứng dụng đọc trôi chảy hoặc đánh vần từng từ toàn bài theo nhịp Karaoke 60fps để bé đọc đuổi theo.
   - **Chế độ Tương tác 1-chạm (Exploratory Learning):** Bé tự đọc bằng mắt; gặp bất kỳ từ khó nào, bé chỉ cần chạm tay vào từ đó để xem phóng to, bóc tách huy hiệu màu `[Âm đầu] - [Vần] - [Thanh]` và nghe công thức đánh vần chuẩn xác.

---

## 2. Capability Map (Bản đồ Năng lực Hệ thống)

Hệ thống được module hóa thành 4 phân hệ độc lập, có ranh giới rõ ràng:

| Module ID | Trách nhiệm chính | Phụ thuộc |
|---|---|---|
| `core-parser` | Phân rã từ tố, bóc tách dấu thanh, âm đầu, vần, sinh công thức đánh vần chuẩn SGK | — |
| `audio-engine` | Quản lý Web Audio API, nạp & cắt Audio Sprite in-memory, chống click/pop, lookahead scheduling, xử lý âm khó (`uyu`) | `core-parser` |
| `ocr-scanner` | Nhận diện ký tự quang học từ ảnh chụp trang sách chạy client-side, tiền xử lý ảnh và khung rà soát cho phụ huynh | — |
| `kid-reader-ui` | Giao diện tương tác trực quan cho trẻ 6 tuổi, Karaoke highlight 60fps, Floating badge âm tiết, thanh điều khiển phụ huynh | `core-parser`, `audio-engine`, `ocr-scanner` |

---

## 3. Tech Stack & Dependencies

- **Ngôn ngữ:** TypeScript 5.7+ (strict mode).
- **Core Framework:** React 18.3+ (Functional components, Hooks).
- **Bundler & Build Tool:** Vite 6.1+.
- **Giao diện & Styling:** Tailwind CSS 3.4+, PostCSS, `lucide-react`.
- **Âm thanh (Browser):** Web Audio API Native (`AudioContext`, `AudioBufferSourceNode`, `GainNode`).
- **Xử lý âm thanh (Build-time CLI):** Node.js 22+, `@andresaya/edge-tts` (`vi-VN-HoaiMyNeural`), `ffmpeg-static`, `fluent-ffmpeg`.
- **Nhận diện chữ (Client-side OCR):** `tesseract.js` v5+ (Vietnamese traineddata `vie.traineddata`).

---

## 4. Commands (Lệnh thực thi)

```bash
# Cài đặt thư viện
npm install

# Chạy môi trường phát triển local
npm run dev

# Kiểm tra kiểu và đóng gói production
npm run build

# Xem thử bản đóng gói production
npm run preview

# Tự động sinh file audio thô từ Edge-TTS (khi cập nhật danh mục)
npm run generate:audio

# Đóng gói Audio Sprite, Hann Windowing và xuất audio-map.json
npm run build:sprite
```

---

## 5. Cấu trúc Dự án (Project Structure)

```
d:\Workspace\web_apps\app_hoc_danh_van
├── SPEC.md                      # [Tài liệu này] Đặc tả kỹ thuật và kiến trúc
├── danh_muc_am_thanh_lop_1.md   # Danh mục âm vị chuẩn 100% SGK Lớp 1 (198 items)
├── public/
│   ├── audio/
│   │   ├── audio-map.json       # Bảng băm thời gian (start, end, duration) từng clip
│   │   ├── sprite-main.mp3      # Audio Sprite Master chất lượng cao
│   │   └── sprite-main.webm     # Audio Sprite Master nén nhẹ cho mobile
│   └── tessdata/                # (Tùy chọn) Cache vie.traineddata offline cho OCR
├── raw-audio/                   # Kho âm thanh gốc .mp3 cho từng âm đầu, vần, thanh
│   └── manual/                  # Các âm hiếm đặc biệt được thu âm hoặc cắt lọc thủ công
├── scripts/
│   ├── generate-tts-audio.js    # CLI sinh âm mẫu từ Edge-TTS
│   └── build-audio-sprite.js    # CLI cắt thông minh, làm mịn zero-crossing và ghép sprite
└── src/
    ├── types/                   # Khai báo TypeScript Interfaces & Types
    │   └── index.ts
    ├── core/
    │   ├── parser/              # Bộ máy ngữ âm tiếng Việt
    │   │   ├── vietnameseRules.ts    # 26 âm đầu, 6 thanh, danh mục vần SGK
    │   │   ├── vietnamesePhonics.ts  # Logic tách thanh, greedy consonants, qu/gi, lookup
    │   │   └── vietnameseParser.ts   # Re-export facade
    │   ├── audio/               # Bộ máy phát âm thanh sư phạm
    │   │   ├── WebAudioEngine.ts     # AudioContext singleton, mobile unlock, fade ramp
    │   │   ├── SpriteManager.ts      # Slice buffer, Hann window 12ms, lookahead 25ms
    │   │   ├── AudioSpritePlayer.ts  # Orchestrator phát từ, câu, karaoke
    │   │   └── AudioManager.ts       # Sound effects giao diện
    │   └── ocr/                 # Dịch vụ OCR Client-side
    │       ├── tesseractService.ts   # Quản lý Worker Tesseract, tiền xử lý ảnh grayscale
    │       └── textSanitizer.ts      # Làm sạch chữ nhận diện, lọc số trang thừa
    ├── components/
    │   ├── kid/                 # UI dành riêng cho bé 6 tuổi
    │   │   ├── KidReaderBoard.tsx    # Vùng hiển thị chữ siêu lớn, màu sắc tươi vui
    │   │   ├── WordBubble.tsx        # Từng từ tương tác 1-chạm, hiệu ứng nhún nhảy
    │   │   └── PhonicsBadgeModal.tsx # Popup phóng to bóc tách [Âm đầu]-[Vần]-[Thanh]
    │   ├── parent/              # UI dành cho phụ huynh nạp bài
    │   │   ├── LessonInputModal.tsx  # Modal dán văn bản hoặc chụp ảnh sách
    │   │   ├── CameraCapture.tsx     # Chụp trực tiếp từ camera điện thoại/laptop
    │   │   └── TextProofreader.tsx   # Khung sửa nhanh văn bản sau khi OCR
    │   └── shared/
    │       └── KidControlBar.tsx     # Nút Đọc toàn bài / Dừng / Tốc độ thiết kế cho trẻ
    ├── pages/
    │   ├── KidLearningPage.tsx  # Trang học chính của bé
    │   └── Playground.tsx       # Trang dev sandbox kiểm thử kỹ thuật
    ├── App.tsx
    └── main.tsx
```

---

## 6. Giải pháp Triệt để cho các Âm khó & Vần hiếm (như vần "uyu")

### 6.1 Bản chất vấn đề
- Trong ngữ âm Tiếng Việt Lớp 1, có một số vần tam trùng cực hiếm: điển hình là vần **`uyu`** (chỉ xuất hiện trong đúng 1 từ duy nhất của toàn bộ tiếng Việt: từ **"khuỷu"** - trong *khuỷu tay*).
- **Tại sao TTS không đọc được riêng "uyu":** Các hệ thống Text-To-Speech (kể cả Microsoft Neural, Google Cloud TTS hay ElevenLabs) được huấn luyện trên từ vựng có nghĩa. Chuỗi ký tự `"uyu"` không phải là một từ độc lập trong từ điển, nên TTS sẽ phát âm sai (đánh vần rời rạc theo bảng chữ cái tiếng Anh / u-y-u, hoặc ngọng).

### 6.2 Chiến lược 3 lớp giải quyết triệt để (3-Tier Strategy)

```
                      [Yêu cầu phát vần "uyu"]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [Có clip trong Sprite?]          [Chưa có trong Sprite]
                 │                               │
        Có ──────┴────── Không                   │
        │                 │                      │
        ▼                 ▼                      ▼
  [Phát Audio Clip]   [Cắt âm vị từ "khuyu"]  [Fallback Synthetic Formant]
  (Âm thanh tự nhiên) (Acoustic Trimming)      (Web Audio Osc 480Hz)
```

1. **Lớp 1 - Phương pháp Cắt Âm Vị Tự Nhiên (Acoustic Trimming / Slicing):**
   - TTS đọc từ thanh ngang `"khuyu"` cực kỳ chuẩn xác, tự nhiên và mượt mà.
   - Phụ âm `kh` là phụ âm xát vô thanh (voiceless velar fricative) kéo dài trung bình `90ms - 130ms` ở đầu dải sóng PCM.
   - Script `scripts/slice-rare-rimes.js` sẽ tự động:
     1. Sinh file âm thanh cho từ `khuyu.mp3` qua Edge-TTS.
     2. Dùng thuật toán phát hiện điểm chuyển tiếp thanh tính (Voicing Onset Detection) để cắt bỏ phụ âm `kh`.
     3. Giữ lại phần thân nguyên âm ba `uyu` nguyên vẹn với cao độ tự nhiên.
     4. Áp dụng Hann Window 12ms ở 2 đầu và đưa vào `raw-audio/van__uyu.mp3`.
   - Kết quả: Vần `uyu` có âm thanh chuẩn 100% của giọng đọc sư phạm `vi-VN-HoaiMyNeural` mà không cần tìm nguồn tải bên ngoài!

2. **Lớp 2 - Manual Sample Injection (`raw-audio/manual/`):**
   - Với các âm vị mà TTS phát âm chưa đạt chuẩn sư phạm địa phương, phụ huynh hoặc giáo viên có thể ghi âm 1 file `.wav` ngắn (1 giây) đọc rõ `"u - y - u"` và đặt vào thư mục `raw-audio/manual/van__uyu.wav`.
   - Script `build-audio-sprite.js` được cấu hình để **ưu tiên nạp file trong thư mục `manual/` trước**, ghi đè lên file TTS tự động.

3. **Lớp 3 - Web Audio Synthetic Formant Fallback (Đã có sẵn):**
   - Nếu một vần chưa kịp bổ sung vào sprite, hàm `WebAudioEngine.playSyntheticTone(token, tone, 480, speed)` sẽ phát âm mô phỏng với tần số `480Hz` và đường cong cao độ của dấu thanh tương ứng, đảm bảo luồng học của bé **không bao giờ bị gián đoạn hay im lặng**.

---

## 7. Kiến trúc Nhận diện Chữ Trực tiếp trên Trình duyệt (In-Browser OCR)

### 7.1 Luồng xử lý không máy chủ (Serverless Client-side Flow)
```
[Ảnh chụp SGK] ──> [Tiền xử lý Canvas: Grayscale + Binarize] 
               ──> [Tesseract.js Web Worker (vie)] 
               ──> [Text Sanitizer: Chuẩn hóa tiếng Việt, lọc ký tự rác] 
               ──> [Khung Phụ huynh Rà soát & Bấm Học] 
               ──> [Bóc tách Token & Chuyển sang Màn hình Bé]
```

### 7.2 Chi tiết Kỹ thuật
1. **Web Worker Isolation:** Chạy Tesseract trên Web Worker độc lập để UI không bị giật lag (duy trì 60fps).
2. **Tiền xử lý tăng độ chính xác:**
   - Tăng độ tương phản (Contrast Boost).
   - Chuyển sang ảnh thang độ xám (Grayscale).
   - Tự động xoay ảnh nếu chụp nghiêng nhẹ.
3. **Bộ lọc chữ rác sư phạm (Pedagogical Sanitizer):**
   - Tự động loại bỏ số trang (ví dụ: `Trang 42`, `42.`), tên bài học thừa nếu ở ngoài bài đọc.
   - Giữ nguyên toàn bộ dấu câu tiếng Việt chuẩn (`.`, `,`, `?`, `!`, `-`).

---

## 8. Trải nghiệm Người dùng (UX/UI cho Bé 6 Tuổi)

### 8.1 Nguyên tắc Thiết kế
- **Cỡ chữ siêu lớn:** Tối thiểu `36px - 48px` trên máy tính bảng và màn hình điện thoại, font chữ bo tròn thân thiện với trẻ nhỏ (như *Baloo 2*, *Nunito* hoặc *Quicksand*).
- **Màu sắc phân biệt thành phần ngữ âm:**
  - **Âm đầu:** Xanh dương (`#2563eb`).
  - **Vần:** Cam hổ phách (`#ea580c`).
  - **Dấu thanh:** Đỏ hồng (`#e11d48`).
- **Tương tác 1-chạm không cản trở:** Bé chạm vào từ $\rightarrow$ phát ra tiếng `pop` vui tai $\rightarrow$ từ nổi bật lên và popup mở ra đọc to công thức.
- **Không có menu kỹ thuật:** Ẩn toàn bộ JSON viewer, thông số tần số âm thanh, chỉ để lại giao diện trực quan cho bé. Các nút của phụ huynh (nạp bài mới, chỉnh tốc độ) nằm gọn ở góc phụ.

---

## 9. Code Conventions & Snippets

### 9.1 Quy ước Lập trình
- Sử dụng **Named Exports** cho tất cả components và utilities.
- Các hàm phân rã trong `src/core/parser` phải là **Pure Functions** (không side-effect).
- Các module âm thanh trong `src/core/audio` triển khai theo mô hình **Singleton Pattern** để chia sẻ một `AudioContext` duy nhất.
- Luôn giữ `source.playbackRate.setValueAtTime(1.0, now)` khi phát clip thực tế để bảo toàn cao độ sư phạm. Điều chỉnh tốc độ thông qua độ dài khoảng lặng giữa các âm (`SilenceGap`).

### 9.2 Snippet Mẫu: Khởi tạo Tesseract OCR Client-side an toàn
```typescript
import { createWorker } from 'tesseract.js';

export async function recognizeVietnamesePage(
  imageBlob: Blob | string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const worker = await createWorker('vie', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  try {
    const ret = await worker.recognize(imageBlob);
    await worker.terminate();
    return ret.data.text.trim();
  } catch (error) {
    await worker.terminate();
    throw new Error(`Lỗi nhận diện trang sách: ${error}`);
  }
}
```

---

## 10. Boundaries (Ranh giới & Quy chuẩn)

### Always Do (Luôn luôn thực hiện)
1. Luôn chạy `npm run build` (`tsc -b && vite build`) trước khi xác nhận bất kỳ thay đổi nào để đảm bảo 0 lỗi kiểu dữ liệu.
2. Mọi clip âm thanh mới đưa vào sprite bắt buộc phải qua khâu **Hann Windowing 12ms** và **Hard Zero 64 samples** ở 2 đầu để triệt tiêu tiếng click/pop.
3. Luôn bảo toàn cao độ giọng đọc gốc (`playbackRate = 1.0`).

### Ask First (Phải hỏi trước khi làm)
1. Thêm thư viện ngoài có dung lượng lớn vào `package.json` (ví dụ thư viện UI nặng).
2. Thay đổi cấu trúc bảng mã trong `danh_muc_am_thanh_lop_1.md`.

### Never Do (Tuyệt đối không làm)
1. **Không** tích hợp micro chấm điểm giọng nói ở giai đoạn này.
2. **Không** gửi ảnh trang sách lên server ngoài (tuân thủ nguyên tắc 100% In-Browser OCR).
3. **Không** làm gián đoạn luồng âm thanh khi bé chạm liên tục vào nhiều từ (phải xử lý debounce hoặc dừng nhẹ nhàng clip trước trong 3ms trước khi phát clip sau).

---

## 11. Success Criteria (Tiêu chí Nghiệm thu Hoàn thành)

- [ ] **SC-01 (Audio Completeness):** Xử lý thành công các vần khó như `uyu` bằng kỹ thuật cắt âm vị từ `"khuyu"` hoặc file thu âm thủ công, đạt 100% độ phủ âm thanh SGK Tiếng Việt 1.
- [ ] **SC-02 (In-Browser OCR):** Phụ huynh tải ảnh chụp bài đọc SGK lên, ứng dụng nhận diện ra chữ tiếng Việt có dấu với độ chính xác $\ge 90\%$ trên ảnh chụp rõ nét, có khung cho phụ huynh sửa nhanh.
- [ ] **SC-03 (Kid-Friendly UI):** Giao diện chính của bé hiển thị chữ to $\ge 32\text{px}$, màu sắc tươi sáng, hỗ trợ đọc trơn Karaoke 60fps và chạm 1-chạm mở bảng đánh vần `[Âm đầu] - [Vần] - [Thanh]`.
- [ ] **SC-04 (Audio Quality):** Khi phát liên tục hoặc bấm dừng đột ngột, hoàn toàn không xuất hiện tiếng nổ "bụp" hay méo tiếng trên cả máy tính và điện thoại di động.
- [ ] **SC-05 (Build & Performance):** Bản build production tải nhanh dưới 2 giây, không có lỗi TypeScript hoặc cảnh báo bộ nhớ.
