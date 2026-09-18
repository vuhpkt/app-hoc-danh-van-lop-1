# Cẩm Nang Kỹ Thuật Âm Thanh (Audio Engineering Guide)

Tài liệu này là hướng dẫn thực hành chi tiết dành cho kỹ sư muốn bổ sung từ vựng mới, điều chỉnh âm học, xử lý các từ phát âm bị nhanh/gấp, và đóng gói lại kho Master Audio Sprite.

---

## 1. Cấu Trúc Kho Âm Thanh Của Dự Án

Kho âm thanh của ứng dụng được tổ chức thành 3 tầng:

1. **`raw-audio/`**: Chứa 280 file `.mp3` mẩu âm riêng lẻ (tên quy ước: `am_dau__*.mp3`, `van__*.mp3`, `thanh__*.mp3`, `tu__*.mp3`).
2. **`raw-audio-backup/`** *(Nằm trong `.gitignore`)*: Chứa các bản gốc của file âm thanh trước khi áp dụng thuật toán co giãn thời lượng. Đóng vai trò làm nguồn gốc bất biến để script co giãn hoạt động theo cơ chế Idempotent.
3. **`public/audio/`**: Chứa sản phẩm đóng gói cuối cùng mà client trình duyệt sẽ tải về:
   - `sprite-main.mp3` (1020 KB): Dành cho Safari, iOS, Chrome.
   - `sprite-main.webm` (696 KB): Bản nén Opus siêu nhẹ dành cho Chrome, Android, Edge.
   - `audio-map.json`: Bảng toạ độ thời gian của từng mẩu âm (`start`, `end`, `duration`).

---

## 2. Quy Trình Bổ Sung Từ Vựng / Mẩu Âm Mới Vào Kho Chuẩn

Khi bạn muốn đưa một bài đọc mới hoặc một loạt từ vựng mới vào kho âm thanh cố định của ứng dụng, hãy làm theo 4 bước chuẩn sau:

### Bước 1: Khai báo vào kịch bản Zalo AI TTS
Mở tệp [`scripts/generate-zalo-tts.js`](file:///d:/Workspace/web_apps/app_hoc_danh_van/scripts/generate-zalo-tts.js) và thêm từ mới vào mảng `AUDIO_DATASET`:

```javascript
// Ví dụ bổ sung từ "chim" và "hoa"
{ key: 'tu__chim', text: 'chim', category: 'word' },
{ key: 'tu__hoa',  text: 'hoa',  category: 'word' },
```

> [!IMPORTANT]
> **Quy tắc đặt tên Key:**
> - Âm đầu: `am_dau__<tên>` (ví dụ: `am_dau__tr`, `am_dau__ngh`)
> - Vần: `van__<tên>` (ví dụ: `van__ang`, `van__oac_breve`)
> - Dấu thanh: `thanh__<tên>` (ví dụ: `thanh__huyen`, `thanh__nang`)
> - Từ vựng nguyên từ: `tu__<tên_khong_dau>` (ví dụ: `tu__truong`, `tu__cay`)

### Bước 2: Tải file MP3 chất lượng cao qua Zalo AI
Chạy lệnh trong terminal:
```bash
npm run generate:zalo
```
Lệnh này sẽ gọi API Zalo AI (giọng Nữ Bắc Ngọc Huyền, tốc độ SGK 0.8x) và lưu các file `.mp3` mới vào thư mục `raw-audio/`.

### Bước 3: Ánh xạ vào `SpriteManager.ts`
Mở tệp [`src/core/audio/SpriteManager.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/SpriteManager.ts), thêm ánh xạ từ chữ hiển thị sang Key vừa tạo vào `TOKEN_TO_SPRITE_KEY_MAP`:

```typescript
export const TOKEN_TO_SPRITE_KEY_MAP: Record<string, string> = {
  // ...
  'chim': 'tu__chim',
  'hoa':  'tu__hoa',
};
```

---

## 3. Kéo Giãn Thời Lượng Bằng WSOLA Cho Các Từ Bị Nhanh / Gấp

### Vấn Đề Gặp Phải
Một số từ tiếng Việt (đặc biệt là các từ bắt đầu bằng nguyên âm như *"em"*, hoặc các từ đơn âm tiết ngắn như *"lo"*, *"ve"*, *"cô"*) khi được AI tổng hợp thường có thời lượng phát âm thực tế (Active Speech) quá ngắn ($< 240\text{ms}$) và âm lượng nhỏ hơn các từ có phụ âm bật hơi ($330\text{ms} - 450\text{ms}$). Điều này tạo cảm giác từ bị đọc vội, giật cục và hụt hơi.

### Cách Xử Lý Bằng Kịch Bản `stretch:audio`
Mở tệp [`scripts/stretch-raw-audio.js`](file:///d:/Workspace/web_apps/app_hoc_danh_van/scripts/stretch-raw-audio.js) và bổ sung từ cần điều chỉnh vào mảng `ITEMS_TO_STRETCH`:

```javascript
const ITEMS_TO_STRETCH = [
  // Kéo giãn từ "em" với bộ lọc atempo=0.65 và tăng gain 1.8 lần (+5.1dB)
  { file: 'tu__em.mp3', filter: 'atempo=0.65,volume=1.8', desc: 'Stretch "em" to ~310ms' },
  // Kéo giãn từ "lo" với atempo=0.72
  { file: 'tu__lo.mp3', filter: 'atempo=0.72,volume=1.05', desc: 'Stretch "lo" to ~335ms' },
];
```

Chạy lệnh trong terminal:
```bash
npm run stretch:audio
```
* **Cơ chế hoạt động:** Kịch bản sẽ tự động sao lưu bản gốc vào `raw-audio-backup/`, sau đó dùng FFmpeg thực hiện thuật toán WSOLA (`atempo`). Cao độ (pitch) của giọng đọc được giữ nguyên tuyệt đối 100%, không bị biến dạng như khi tua chậm thông thường.

---

## 4. Đóng Gói Lại Master Audio Sprite

Sau khi đã có đầy đủ các file MP3 trong `raw-audio/` (và đã chạy stretch nếu cần), bạn chạy lệnh:

```bash
npm run build:sprite
```

### Các Thông Số DSP Tự Động Được Áp Dụng:
- **Header Click Pop Protection:** Bỏ qua 64 mẫu đầu tiên của file MP3 để không bị xung điện giả.
- **Natural Pre-roll:** Đệm **50ms** khoảng lặng tự nhiên ở đầu mỗi mẩu âm.
- **Studio Decay Tail:** Giữ trọn **140ms** đuôi ngân tự nhiên của âm mũi và dây thanh.
- **Hann Windowing 12ms:** Làm mịn 2 đầu để triệt tiêu tiếng "bụp" khi ngắt âm.
- **Peak Normalization:** Chuẩn hóa toàn bộ về $-1\text{dBFS}$ ($\sim 0.89$).

---

## 5. Kích Hoạt Cache-Busting (Bắt Buộc Khi Cập Nhật Âm Thanh)

Khi bạn cập nhật Master Sprite, các trình duyệt của người dùng (Chrome, Safari, Edge) có xu hướng giữ lại file `sprite-main.mp3` cũ trong HTTP Disk Cache.

Để ép trình duyệt tải ngay file mới:
1. Mở tệp [`src/core/audio/SpriteManager.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/SpriteManager.ts).
2. Tăng giá trị `SPRITE_VERSION`:
   ```typescript
   // Tăng từ v4.2.0 lên v4.3.0
   public static readonly SPRITE_VERSION = 'v4.3.0';
   ```
3. Khi đó, client sẽ tự động request tới `/audio/sprite-main.mp3?v=v4.3.0`, vượt qua 100% cache cũ mà không yêu cầu người dùng phải tự tay xóa cache trình duyệt.

---

## 6. Bảng Kiểm Tra Sau Khi Thay Đổi (Checklist)

Mỗi lần chỉnh sửa kho âm thanh, bạn hãy chạy lần lượt 2 lệnh sau:

```bash
# 1. Kiểm tra toàn bộ 77 bài kiểm thử âm học & dữ liệu
npm test

# 2. Kiểm tra biên dịch TypeScript
npm run build
```
Nếu cả hai lệnh đều báo **PASS 100%**, kho âm thanh đã sẵn sàng để phát hành!
