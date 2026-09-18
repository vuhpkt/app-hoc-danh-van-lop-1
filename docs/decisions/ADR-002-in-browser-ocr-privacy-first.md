# ADR-002: Nhận Diện Trang Sách Bằng Client-Side In-Browser OCR Bảo Mật Quyền Riêng Tư

## Trạng Thái (Status)
**Accepted (Đã áp dụng)**

## Ngày (Date)
2026-09-16

## Bối Cảnh (Context)
Phụ huynh có nhu cầu nạp bài đọc mới cho con (các bài thơ, câu chuyện trong sách giáo khoa Tiếng Việt lớp 1 của nhiều bộ sách khác nhau: Cánh Diều, Chân Trời Sáng Tạo, Kết Nối Tri Thức). 
Nếu bắt phụ huynh phải gõ tay từng chữ trên điện thoại, trải nghiệm rất bất tiện và dễ nản lòng. 

Yêu cầu đặt ra:
1. Cho phép phụ huynh dùng camera điện thoại hoặc tải ảnh chụp trang sách lên để tự động nhận dạng văn bản tiếng Việt có dấu.
2. **Bảo mật quyền riêng tư tối đa:** Ảnh chụp góc học tập của trẻ, bài vở gia đình tuyệt đối không được gửi lên bất kỳ máy chủ bên thứ ba nào.
3. **Không phụ thuộc Backend Server:** Ứng dụng là Static Web App (PWA-ready), không phát sinh chi phí vận hành máy chủ đắt đỏ.

## Quyết Định (Decision)
1. **Sử dụng Tesseract.js chạy 100% trong Web Worker của trình duyệt:**
   - Tải tệp ngôn ngữ `vie.traineddata` vào bộ nhớ đệm client một lần duy nhất.
   - Quá trình nhận diện ký tự quang học (OCR) diễn ra hoàn toàn trên CPU/GPU của thiết bị người dùng.
2. **Tiền xử lý ảnh bằng HTML5 Canvas (`ImagePreprocessor`):**
   - Trước khi đưa vào OCR, ảnh được vẽ lên Canvas ẩn để:
     * Chuyển đổi về ảnh xám (Grayscale).
     * Kéo giãn độ tương phản động (Dynamic Contrast Stretching).
     * Nhị phân hóa thích ứng (Threshold Binarization) để tách bạch rõ nét chữ đen trên nền giấy sách.
3. **Khử nhiễu văn bản thông minh (`TextSanitizer`):**
   - Chuẩn hóa Unicode tiếng Việt về dạng dựng sẵn NFC (tránh lỗi font tổ hợp).
   - Tự động lọc bỏ số trang (*Trang 24, tr. 15*), tiêu đề đầu trang (*Bài 12, Tập đọc*), ký tự rác do nếp gấp trang sách.
   - Bảo toàn cấu trúc xuống dòng `\n` của các bài thơ.
4. **Giao diện rà soát nhanh 2-in-1 (`ParentLessonModal`):**
   - Không tự ý nạp thẳng văn bản thô vào bảng đọc của bé, mà hiển thị khung chỉnh sửa trực quan (Proofreader) để phụ huynh kiểm tra lại dấu câu và sửa lỗi chính tả trong 3 giây.

## Các Phương Án Đã Cân Nhắc & Lý Do Bác Bỏ (Alternatives Considered)

### 1. Gọi Cloud OCR API (Google Cloud Vision / AWS Textract / Azure OCR)
* **Ưu điểm:** Độ chính xác rất cao, nhận diện được cả ảnh mờ tối.
* **Nhược điểm:**
  * Bắt buộc phải dựng một Backend Server trung gian để lưu trữ API Secret Key.
  * Tốn chi phí trên mỗi lần quét ảnh (Cost per request).
  * Vi phạm chính sách quyền riêng tư của trẻ em (COPPA / GDPR-K) khi ảnh gia đình bị upload lên Cloud.
* **Kết luận:** **Bác bỏ**.

### 2. Chỉ cho phép gõ phím hoặc sao chép văn bản (Manual Input Only)
* **Ưu điểm:** Đơn giản nhất, 0 rủi ro công nghệ.
* **Nhược điểm:** Phụ huynh lười gõ lại cả bài thơ 4 khổ trên điện thoại, làm giảm đáng kể tần suất sử dụng ứng dụng.
* **Kết luận:** Giữ làm tab phụ (Tab "Dán văn bản"), nhưng không thể thiếu tính năng quét ảnh.

## Hệ Quả & Trách Nhiệm Kỹ Thuật (Consequences)
- **Tích cực:**
  - 100% miễn phí vận hành, không cần duy trì máy chủ backend.
  - Bảo mật tuyệt đối, tuân thủ tiêu chuẩn an toàn thông tin cho trẻ nhỏ.
- **Thách thức & Giải pháp quản lý:**
  - File model `vie.traineddata` nặng ~4MB: Đã xử lý nạp lười (Lazy Loading) theo dạng on-demand, chỉ tải về khi phụ huynh bấm mở camera quét ảnh lần đầu tiên, không làm chậm quá trình tải trang đọc của bé.
