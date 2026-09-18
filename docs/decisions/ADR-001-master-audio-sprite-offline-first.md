# ADR-001: Kiến Trúc Master Audio Sprite Offline-First & Loại Bỏ Triệt Để Web Speech API

## Trạng Thái (Status)
**Accepted (Đã áp dụng)**

## Ngày (Date)
2026-09-15 (Cập nhật phiên bản v4.2.0 ngày 2026-09-17)

## Bối Cảnh (Context)
Ứng dụng được thiết kế cho trẻ 6 tuổi (học sinh lớp 1) học đánh vần và đọc trơn tiếng Việt theo chương trình SGK mới (Kết Nối Tri Thức). Trẻ em ở độ tuổi này rất nhạy cảm với ngữ điệu và phát âm chuẩn của người thật (giọng chuẩn sư phạm của cô giáo).

Yêu cầu kỹ thuật và sư phạm đặt ra:
1. **Độ trễ phát âm tức thì ($< 20\text{ms}$):** Khi bé chạm vào thẻ từ, âm thanh phải phát ra ngay lập tức. Bất kỳ độ trễ nào từ 200ms trở lên đều làm bé bấm liên tục, gây rối loạn hàng đợi âm thanh.
2. **Khả năng chạy Offline 100%:** Trẻ có thể học trên máy tính bảng ở nhà, ở quê hoặc trên xe mà không cần phụ thuộc vào kết nối 4G/Wifi ổn định.
3. **Phát âm chuẩn ngữ âm học:** Phải phát âm chuẩn từng âm đầu (*bờ, cờ, dờ, trờ, ngờ...*), từng vần phức tạp (*oang, khuỷu, uyên, ắt...*) và các bước đánh vần trung gian.

## Quyết Định (Decision)
1. **Loại bỏ 100% Web Speech API (`window.speechSynthesis`):** Không sử dụng giọng máy tổng hợp của trình duyệt dưới bất kỳ hình thức nào.
2. **Đóng gói Master Audio Sprite:** Thu âm trước toàn bộ 280 mẩu âm thanh cơ bản (gồm 28 âm đầu, 145 vần, 6 dấu thanh và toàn bộ từ vựng của 4 bài đọc SGK mẫu) thành một file âm thanh duy nhất:
   - `public/audio/sprite-main.mp3` (1020 KB)
   - `public/audio/sprite-main.webm` (696 KB)
   - `public/audio/audio-map.json` (bảng tra toạ độ `start`, `duration`).
3. **Nạp trước vào RAM (AudioBuffer Preloading):** Khi ứng dụng khởi động, toàn bộ Master Sprite được tải về qua 1 HTTP request duy nhất và giải mã vào bộ nhớ RAM (`AudioBuffer`). Khi phát bất kỳ mẩu âm nào, Web Audio Context chỉ cần tạo một `AudioBufferSourceNode` trỏ tới đoạn toạ độ tương ứng, độ trễ phát là $< 15\text{ms}$.
4. **Cơ chế dự phòng động (Dynamic Fallback Cache):** Đối với các từ mới ngoài kho 280 mẩu âm do phụ huynh tự nhập, client gửi tải động qua Zalo AI TTS, sau đó xử lý DSP và lưu vĩnh viễn vào `IndexedDB` (`AudioCacheService`).

## Các Phương Án Đã Cân Nhắc & Lý Do Bác Bỏ (Alternatives Considered)

### 1. Sử dụng Web Speech API có sẵn của trình duyệt
* **Ưu điểm:** Không tốn dung lượng tải về, không cần file âm thanh, không mất chi phí API.
* **Nhược điểm nghiêm trọng:**
  * Giọng đọc robot khô cứng, thiếu tính truyền cảm sư phạm.
  * Hoàn toàn thất bại khi phát âm các âm lẻ hoặc vần lẻ (ví dụ gửi chuỗi `"ắt"`, `"uyu"`, `"ngh"` máy đọc sai hoặc im lặng).
  * Phụ thuộc vào giọng máy cài đặt trên hệ điều hành của người dùng (Windows đọc khác Android, iOS không có giọng Bắc chuẩn).
* **Kết luận:** **Bác bỏ hoàn toàn**.

### 2. Tải 280 file MP3 riêng lẻ khi cần
* **Ưu điểm:** Dễ quản lý từng file độc lập.
* **Nhược điểm nghiêm trọng:**
  * Tạo ra 280 request HTTP đồng thời, làm nghẽn hàng đợi kết nối trình duyệt (trình duyệt chỉ cho phép tối đa 6 kết nối song song HTTP/1.1 cùng một domain).
  * Khi đọc trơn cả câu 10 từ, việc nạp 10 file riêng lẻ gây ra hiện tượng giật cục, từ phát trước từ phát sau không đồng đều nhịp điệu.
* **Kết luận:** **Bác bỏ**.

### 3. Gọi trực tiếp API TTS của Cloud Server mỗi khi bấm
* **Ưu điểm:** Luôn có từ mới, không cần lưu trữ trước.
* **Nhược điểm:** Phải có mạng liên tục, độ trễ từ 300ms - 800ms cho mỗi lần chạm thẻ, tốn chi phí quota API.
* **Kết luận:** **Bác bỏ** (chỉ giữ làm tầng dự phòng thứ 2 cho từ mới phụ huynh nhập).

## Hệ Quả & Trách Nhiệm Kỹ Thuật (Consequences)
- **Tích cực:**
  - Tốc độ phản hồi cực nhanh ($< 15\text{ms}$).
  - Hoạt động mượt mà khi ngắt mạng (Offline-First).
  - Tiết kiệm 100% chi phí API cho toàn bộ các bài học trong sách giáo khoa cốt lõi.
- **Thách thức & Giải pháp quản lý:**
  - Cần kịch bản đóng gói tự động (`scripts/build-audio-sprite.js`).
  - Khi cập nhật kho âm thanh, phải gắn `?v=vX.Y.Z` (Cache-Busting) vào đường dẫn tải file để ép trình duyệt không dùng cache đĩa cũ (`SpriteManager.SPRITE_VERSION`).
