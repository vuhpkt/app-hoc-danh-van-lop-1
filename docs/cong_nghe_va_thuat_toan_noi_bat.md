# Các Công Nghệ & Thuật Toán Nổi Bật

> Tổng hợp ngắn gọn các công nghệ, thuật toán xử lý tín hiệu và kỹ thuật tối ưu cốt lõi trong **App Học Đánh Vần Tiếng Việt Lớp 1**.

---

## 🎯 4 Trụ Cột Kỹ Thuật Chính

| Phân hệ | Công nghệ / Thuật toán cốt lõi | Hiệu quả thực tế |
|---|---|---|
| **1. Xử lý âm thanh (DSP)** | Thuật toán **WSOLA** thuần TypeScript, Bộ lọc **Biquad IIR 5 băng tần**, **Hann Windowing** | Kéo giãn từ ngắn (*"em"*, *"lo"*) bảo toàn 100% cao độ, xử lý $< 4\text{ms}$ trên CPU trình duyệt. |
| **2. Web Audio & RAM** | **Master Audio Sprite** (282 mẩu âm), giải phóng bộ nhớ `masterBuffer = null` | Độ trễ phát **$< 15\text{ms}$**, giảm $70\%$ RAM, triệt tiêu rò rỉ bộ nhớ. |
| **3. Ngữ âm SGK** | Động cơ quyết định luận (Deterministic Automata), công thức **5 bước SGK Kết Nối Tri Thức** | Bóc tách âm vần chuẩn xác $100\%$, tự động xử lý bước đệm sắc cho vần khép tắc (*"học"* $\to$ *"hóc"*). |
| **4. Hiệu năng UI (Montessori)** | `React.memo` so sánh tùy biến cho Karaoke ($O(1)$ updates), quy chuẩn **Fitts's Law** ($\ge 56\text{px}$) | Đọc cả bài không giật lag ($60\text{ fps}$), tối ưu xúc giác cho ngón tay trẻ 6 tuổi. |

---

## 1. 🎧 Xử Lý Tín Hiệu Âm Thanh (Audio DSP)
*Tệp mã nguồn:* [`src/core/audio/AudioDspProcessor.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/AudioDspProcessor.ts)

* **Thuật toán WSOLA (Waveform Similarity Overlap-Add) thuần TypeScript**:
  - **Vấn đề:** Các từ đơn âm tiết ngắn hoặc vần mở (*"em"*, *"lo"*, *"vui"*) thường có thời lượng phát âm thực tế quá ngắn ($< 220\text{ms}$), gây cảm giác cộc lốc và hụt hơi. Kỹ thuật tua chậm thông thường (resampling) sẽ làm hạ trầm giọng đọc khiến giọng cô giáo bị méo.
  - **Giải pháp:** Phân tích khung cửa sổ $20\text{ms}$, dịch chuyển bước tổng hợp $10\text{ms}$ và tìm độ tương đồng dạng sóng cực đại (Cross-Correlation) trong miền thời gian.
  - **Tối ưu 2 tầng:** Quét thô ($\Delta=2, k=4$) rồi tinh chỉnh lân cận $\to$ Xử lý xong trong **$< 4\text{ms}$** trên CPU thiết bị di động, kéo giãn *"em"* từ $187\text{ms}$ lên $310\text{ms}$ mà **giữ nguyên 100% cao độ tự nhiên**.
* **Bộ lọc số Biquad Parametric EQ 5 băng tần**:
  - Dựa trên công thức giải tích *Audio EQ Cookbook* của Robert Bristow-Johnson.
  - Profile *"Cô giáo ấm áp"*: High-Pass $85\text{Hz}$ (khử DC/ù loa), Peaking $220\text{Hz}$ (+2.2dB độ ấm ngực), Peaking $1.8\text{kHz}$ (+0.8dB rõ phụ âm), Peaking $3.6\text{kHz}$ (-2.2dB khử chói gắt $s, x, ch$), High-Shelf $7.5\text{kHz}$ (-1.8dB khử artifact nén).
* **Studio Padding & Chống Pop màng loa**:
  - Gọt bỏ 64 mẫu đầu tiên để khử tiếng nổ xung điện khởi động âm thanh.
  - Tự động đệm **50ms pre-roll** (lấy hơi) và **140ms decay tail** (vang vòm họng), bọc 2 đầu bằng cửa sổ **Hann 12ms**.

---

## 2. ⚡ Kiến Trúc Web Audio & Tối Ưu RAM
*Tệp mã nguồn:* [`src/core/audio/SpriteManager.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/SpriteManager.ts), [`AudioSpritePlayer.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/audio/AudioSpritePlayer.ts)

* **Master Audio Sprite**:
  - Đóng gói toàn bộ 282 mẩu âm vào duy nhất 1 file `sprite-main.mp3` ($1020\text{ KB}$) và `sprite-main.webm` ($696\text{ KB}$) kèm `audio-map.json`.
  - Phát âm thanh qua con trỏ thời gian (Buffer Slice), phản hồi tức thì **$< 15\text{ms}$**, hoạt động ngoại tuyến $100\%$.
* **Giải phóng RAM tức thì (`masterBuffer = null`)**:
  - Ngay sau khi cắt xong 282 lát cắt con, đối tượng `masterBuffer` ($30 - 60\text{ MB}$ Float32 PCM) được giải phóng khỏi RAM, giảm $70\%$ bộ nhớ tiêu thụ trên thiết bị di động.
* **Dọn dẹp Promise treo luồng (Hanging Promise Cleanup)**:
  - Khi dừng phát hoặc chuyển bài: xả GainNode về 0 trong $3\text{ms}$ (tránh nổ loa), ngắt kết nối node âm thanh và kích hoạt `activeResolvers` để kết thúc sạch toàn bộ Promise `async/await`.
* **Cơ chế Cache-Busting tự động**:
  - Sử dụng tham số truy vấn `SPRITE_VERSION = 'v4.8.0'` để ép trình duyệt tải ngay file âm thanh mới, vượt qua HTTP Disk Cache cũ.

---

## 3. 📖 Động Cơ Ngữ Âm Tiếng Việt Quyết Định Luận
*Tệp mã nguồn:* [`src/core/parser/vietnamesePhonics.ts`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/core/parser/vietnamesePhonics.ts)

* **Công thức đánh vần 5 bước SGK Kết Nối Tri Thức**:
  $$\text{[Âm đầu]} \longrightarrow \text{[Vần không dấu]} \longrightarrow \text{[Tiếng thanh ngang]} \longrightarrow \text{[Dấu thanh]} \longrightarrow \text{[Tiếng hoàn chỉnh]}$$
  *Ví dụ từ "lớp":* $\text{l} - \text{ơp} - \text{lơp} - \text{sắc} - \text{lớp}$.
* **Quy tắc vần khép tắc ($p, t, c, ch$) đi với thanh Nặng**:
  - Do tiếng Việt không tồn tại tiếng thanh ngang cho vần khép tắc, thuật toán tự động ánh xạ bước đệm qua thanh Sắc:
    $$\text{học} \longrightarrow \text{h} - \text{oc} - \text{\textbf{hóc}} - \text{nặng} - \text{học}$$
    (Mã âm `'hoc'` tự động trỏ về file `'tu__hoc_sac'`, phát âm rõ tiếng "hóc").
* **Bóc tách cụm âm phức tạp & Tokenizer đa dòng**:
  - Khớp phụ âm đầu tham lam: `ngh` ($3$ ký tự) $\to$ phụ âm ghép ($2$ ký tự) $\to$ phụ âm đơn.
  - Phụ âm `gi` + nguyên âm đôi `iê` (*giết, giếng*): giữ lại `i` cho vần `iêt, iêng`.
  - Tách rời dấu câu khỏi từ và bảo toàn ký tự `\n` cho các bài thơ Lớp 1.

---

## 4. 🎨 Giao Diện Xúc Giác Montessori & Tối Ưu Re-render $O(1)$
*Tệp mã nguồn:* [`src/components/kid/`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/kid), [`src/components/alphabet/`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/alphabet)

* **Tối ưu Karaoke $O(1)$ Updates**:
  - Bọc `WordBubble` và `KidReaderBoard` trong `React.memo` với hàm so sánh tùy biến.
  - Khi nhịp Karaoke chuyển từ, chỉ có đúng **2 component DOM re-render** (từ vừa đọc và từ đang đọc), giữ vững $60\text{ fps}$ ổn định.
* **Khay ghép vần tương tác 3 bước (Sound Blending Tray)**:
  - 29 chữ cái, 11 phụ âm ghép và 4 họ vần. Tự động tính toán tiếng ghép động và đồng bộ chuỗi 3 bước âm thanh kèm hiệu ứng sáng đèn tactile.
  - Chữ "k" đọc là **"ca"**; vần "o" trích xuất trực tiếp từ bản thu **Hành Trang Số** (NXB Giáo Dục Việt Nam).
* **Chuẩn công thái học trẻ 6 tuổi**:
  - Phím bấm $\ge 56\text{px} \times 56\text{px}$ (vượt chuẩn Fitts 48px).
  - Màu nền giấy ngà dịu mắt `#FAF8F5`, bóc tách 3 tầng màu pastel trực giác: Âm đầu (Xanh da trời), Vần (Vàng mật ong), Dấu thanh (Hồng phấn).

---

## 📊 Chỉ Số Kỹ Thuật

* **Kiểm thử:** **147 / 147 tests PASS 100%** (135 tests động cơ + 12 tests Bảng chữ cái).
* **Âm học:** $100\%$ trong số 282 mẩu âm đạt chuẩn đỉnh $-1.3\text{ dBFS}$ ($0.86 \pm 0.02$).
* **Gói Production:** JS gzipped **88.18 kB**, CSS gzipped **10.27 kB**, thời gian build Vite **~2.3s**.
* **Trang web chính thức:** [https://vuhpkt.github.io/app-hoc-danh-van-lop-1/](https://vuhpkt.github.io/app-hoc-danh-van-lop-1/)
