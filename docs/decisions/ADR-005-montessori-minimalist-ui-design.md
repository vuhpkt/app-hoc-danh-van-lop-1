# ADR-005: Thiết Kế Giao Diện Tối Giản Montessori Cho Trẻ 6 Tuổi

## Trạng Thái (Status)
**Accepted (Đã áp dụng)**

## Ngày (Date)
2026-09-17

## Bối Cảnh (Context)
Trẻ em 6 tuổi bước vào lớp 1 đang trong giai đoạn đầu hình thành kỹ năng nhận biết mặt chữ và ghép vần. Não bộ của trẻ rất dễ bị phân tán chú ý và quá tải nhận thức (Cognitive Overload). 

Các vấn đề thường gặp ở các ứng dụng học tập thông thường:
1. **Giao diện hoạt hình quá mức (Over-gamification):** Quá nhiều sticker nhấp nháy, thú cưng nhảy múa, hiệu ứng hạt nổ (particle explosion) khiến bé chỉ chăm chú bấm xem hoạt hình thay vì tập trung vào hình dạng con chữ và lắng nghe âm thanh.
2. **Kích thước nút bấm quá nhỏ:** Không đáp ứng luật Fitts trên màn hình cảm ứng, khiến ngón tay nhỏ của trẻ bấm trượt, bấm nhầm nút hoặc bấm liên tục gây lỗi.
3. **Nhiễm biệt ngữ kỹ thuật:** Hiển thị các thông số kỹ thuật (IndexedDB, Web Audio, DSP, JSON, Hz) gây rối mắt cho cả bé lẫn phụ huynh không am hiểu công nghệ.

## Quyết Định (Decision)
Áp dụng triết lý **Montessori Tối Giản & Sách Giấy Ngà Ấm**:

1. **Bảng đọc Trang Sách Giấy Ngà Ấm (`#FAF8F5`):**
   - Thay thế màu trắng gắt chói mắt bằng gam màu giấy ngà tự nhiên của sách giáo khoa thật.
   - Giảm thiểu tối đa mỏi mắt khi trẻ học đọc liên tục từ 15 - 30 phút.
2. **Thẻ từ vựng Khối Gỗ Nam Châm Xúc Giác (Tactile Magnetic Tiles):**
   - Tệp mã nguồn: [`WordBubble.tsx`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/kid/WordBubble.tsx).
   - Thiết kế dạng thẻ khối nổi nhẹ (`shadow-sm`, bo góc tròn $16\text{px}$).
   - Kích thước chữ to bản rõ nét ($\ge 32\text{px}$).
   - Trạng thái đang đọc (Active) nổi bật với viền vàng hổ phách ấm áp (`amber-400`), chuyển động lướt Karaoke êm ái, loại bỏ hoàn toàn các tooltip nhảy nhót gây mất tập trung.
3. **Thanh điều khiển nổi đa năng (Floating Control Dock):**
   - Tệp mã nguồn: [`KidControlBar.tsx`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/shared/KidControlBar.tsx).
   - Nằm gọn gàng ở cạnh dưới màn hình, tích hợp cụm nút:
     * Nút Phát/Dừng tròn to $\ge 56\text{px}$.
     * Chuyển đổi chế độ: Đọc trơn $\leftrightarrow$ Đánh vần từng từ.
     * Chuyển đổi tốc độ trực quan bằng hình tượng: **Rùa con 0.6x** (chậm rãi cho bé mới học) $\leftrightarrow$ **Thỏ con 0.8x** (chuẩn mực SGK).
4. **Bảng bóc tách ngữ âm 3 màu Pastel Montessori:**
   - Tệp mã nguồn: [`PhonicsBadgeModal.tsx`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/kid/PhonicsBadgeModal.tsx).
   - Phân biệt trực quan 3 thành phần ngữ âm bằng 3 gam màu dịu mát:
     * **Âm đầu:** Xanh da trời mát mẻ (`#E0F2FE`).
     * **Vần:** Vàng mơ mật ong ấm áp (`#FEF3C7`).
     * **Dấu thanh:** Hồng phấn êm đềm (`#FCE7F3`).
5. **Góc Phụ Huynh riêng biệt (Parent Workspace):**
   - Đưa các chức năng nâng cao (Nạp bài mới, Quét ảnh OCR, Xóa cache) vào modal riêng ([`ParentLessonModal.tsx`](file:///d:/Workspace/web_apps/app_hoc_danh_van/src/components/parent/ParentLessonModal.tsx)), bảo vệ không gian học tập tĩnh lặng của bé.

## Các Phương Án Đã Cân Nhắc & Lý Do Bác Bỏ (Alternatives Considered)

### 1. Thiết kế theo phong cách Game hoạt họa rực rỡ (Gamified Cartoon UI)
* **Ưu điểm:** Hút mắt trẻ em trong vài phút đầu.
* **Nhược điểm:** Trẻ nhanh mỏi mắt, chỉ thích bấm hiệu ứng để xem hoạt hình, không rèn luyện được tính kiên nhẫn và khả năng nhận diện mặt chữ tĩnh của sách giáo khoa thật.
* **Kết luận:** **Bác bỏ**.

### 2. Giao diện dạng Dashboard / Web văn phòng tiêu chuẩn
* **Ưu điểm:** Dễ dựng bằng các UI library có sẵn (Tailwind UI / Bootstrap).
* **Nhược điểm:** Các nút bấm nhỏ hơn $40\text{px}$, phông chữ nhỏ, không phù hợp cho trẻ em thao tác trên iPad/điện thoại.
* **Kết luận:** **Bác bỏ**.

## Hệ Quả & Trách Nhiệm Kỹ Thuật (Consequences)
- **Tích cực:** Bé tập trung hoàn toàn vào việc đọc, tỷ lệ nhận diện chữ tiến bộ nhanh, phụ huynh an tâm cho con sử dụng độc lập.
- **Quy chuẩn duy trì:** Mọi component giao diện mới thêm vào bắt buộc phải tuân thủ Fitts's Law ($\ge 48\text{px}$) và chuẩn màu sắc pastel ấm áp.
