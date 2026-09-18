# ADR-003: Xử Lý Tín Hiệu Số DSP & Kéo Giãn Âm Học WSOLA Bảo Toàn Cao Độ

## Trạng Thái (Status)
**Accepted (Đã áp dụng)**

## Ngày (Date)
2026-09-17

## Bối Cảnh (Context)
Khi tích hợp các mẩu âm thanh từ Zalo AI TTS vào ứng dụng học đọc lớp 1, chúng tôi gặp phải 3 vấn đề âm học nghiêm trọng:
1. **Lỗi tiếng nổ "Click/Pop" do MP3 Decoder Header:** Tại các mẫu đầu tiên (samples 0..15), bộ giải mã MP3 của trình duyệt sinh ra các xung năng lượng giả (DC offset) lên tới $0.6 - 0.9$, khiến thuật toán cắt khoảng lặng cũ nhầm là giọng nói và để sót tới 200ms khoảng lặng rác ở đầu các từ như *"cây"*, *"hỏi"*.
2. **Hiện tượng ngắt cụt & phát âm gấp gáp:** Các từ bắt đầu bằng nguyên âm như **"em"** không có phụ âm đầu cản luồng hơi, khiến Zalo AI tổng hợp quá nhanh với thời lượng phát âm thực tế (Active Speech) chỉ vỏn vẹn **187ms** và biên độ đỉnh chỉ đạt **0.46**. Tương tự, từ **"lo"** chỉ dài **241ms**. Khi ghép vào bài đọc cùng các từ dài như *"Trường"* (457ms), *"khang"* (335ms), tai người nghe cảm thấy từ *"em"* và *"lo"* bị cộc lốc, gấp gáp và hụt hơi rõ rệt.
3. **Méo cao độ nếu chỉnh tốc độ bằng Web Audio:** Nếu giảm tốc độ bằng thuộc tính `playbackRate = 0.8` trên trình duyệt, tần số giọng nói bị kéo tụt xuống, khiến giọng cô giáo trở nên trầm ồm, ma quái và biến dạng ngữ âm.

## Quyết Định (Decision)

### 1. Chuỗi Xử Lý Tín Hiệu Số DSP (DSP Audio Pipeline)
Tích hợp thuật toán xử lý DSP đồng nhất trong cả kịch bản đóng gói sprite ([`scripts/build-audio-sprite.js`](file:///d:/Workspace/web_apps/app_hoc_danh_van/scripts/build-audio-sprite.js)) và bộ xử lý tại client ([`AudioDspProcessor.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/AudioDspProcessor.ts)):
* **Bỏ qua xung nổ MP3 Header (Header Pop Bypass):** Buộc xóa cứng 64 mẫu đầu tiên (`samples 0..63 = 0.0`) trước khi tính toán năng lượng RMS.
* **Khoảng đệm lấy hơi tự nhiên (Natural Pre-roll):** Giữ lại **50ms** khoảng lặng trước khi nguyên âm cất lên, tạo cảm giác lấy hơi mềm mại của cô giáo.
* **Độ ngân phòng thu (Studio Decay Tail):** Giữ lại **140ms** đuôi ngân tự nhiên của dây thanh và các âm mũi (`-m`, `-n`, `-ng`).
* **Làm mịn bằng Hann Windowing (12ms):** Áp dụng cửa sổ Hann ở 2 đầu mỗi clip để triệt tiêu 100% tiếng bụp khi bật/tắt âm thanh.
* **Chuẩn hóa âm lượng (-1dBFS):** Đưa biên độ đỉnh về $\sim 0.89$, đảm bảo âm lượng đồng đều giữa tất cả các mẩu âm.
* **Cân bằng ngữ âm sư phạm (Pedagogical Parametric EQ):**
  * Boost $+2.2\text{dB}$ tại dải tần $220\text{Hz}$ (tăng độ ấm áp, truyền cảm của giọng cô giáo).
  * Cut $-2.2\text{dB}$ tại dải tần $3.6\text{kHz}$ (triệt tiêu tiếng chói gắt của mic kỹ thuật số).

### 2. Kéo Giãn Thời Lượng Bằng Thuật Toán WSOLA (Waveform Similarity Overlap-Add)
* Sử dụng công cụ FFmpeg với bộ lọc `atempo` ([`scripts/stretch-raw-audio.js`](file:///d:/Workspace/web_apps/app_hoc_danh_van/scripts/stretch-raw-audio.js)):
  * `tu__em.mp3` & `van__em.mp3`: Áp dụng `atempo=0.65,volume=1.8` $\rightarrow$ kéo dài phát âm thực tế từ **187ms lên 307ms**, biên độ đỉnh tăng từ $0.46 \rightarrow 0.813$.
  * `tu__lo.mp3`: Áp dụng `atempo=0.72,volume=1.05` $\rightarrow$ kéo dài phát âm thực tế từ **241ms lên 335ms**, biên độ đỉnh đạt $0.829$.
  * Các từ ngắn khác (`ve`, `co`): Đồng bộ lên $280\text{ms} - 310\text{ms}$.
* **Bảo toàn tính bất biến (Idempotent):** Kịch bản luôn đọc từ thư mục sao lưu gốc `raw-audio-backup/`, đảm bảo chạy nhiều lần không bao giờ bị kéo giãn chồng lặp.

## Các Phương Án Đã Cân Nhắc & Lý Do Bác Bỏ (Alternatives Considered)

### 1. Thay đổi thuộc tính `source.playbackRate` trên Web Audio API
* **Ưu điểm:** Có thể thay đổi tốc độ linh hoạt bằng code JavaScript tại runtime.
* **Nhược điểm nghiêm trọng:** Thay đổi `playbackRate` làm thay đổi pitch (cao độ). Ở tốc độ 0.6x, giọng đọc bị méo mó, biến dạng ngữ âm hoàn toàn, vi phạm nguyên tắc sư phạm.
* **Kết luận:** **Bác bỏ tuyệt đối**. `playbackRate` luôn cố định ở $1.0$.

### 2. Chèn thêm khoảng lặng thuần túy (Silent Padding) ở hai đầu
* **Ưu điểm:** Dễ làm, chỉ cần thêm số 0 vào mảng PCM.
* **Nhược điểm:** Khoảng lặng chỉ giúp từ không bị đập vào tai quá đột ngột, nhưng bản thân thân từ (vocal core) của từ "em" vẫn chỉ có 187ms, bé và nói cực nhanh, không giải quyết được cảm giác "gấp gáp và cộc lốc".
* **Kết luận:** Bắt buộc phải kết hợp cả kéo giãn thân từ (WSOLA) lẫn chèn khoảng đệm tự nhiên.

## Hệ Quả & Trách Nhiệm Kỹ Thuật (Consequences)
- **Tích cực:** Giọng đọc đạt chuẩn chất lượng phòng thu, ấm áp, thong thả, tròn vành rõ chữ, nhịp điệu hài hòa hoàn hảo với toàn bộ bài đọc.
- **Trách nhiệm kỹ thuật:** Mọi file âm thanh sau khi stretch cần được đóng gói lại vào Master Sprite bằng lệnh `npm run build:sprite` và nâng cấp `SPRITE_VERSION` trong `SpriteManager.ts`.
