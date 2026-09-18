# Bảng Chữ Cái & Khay Ghép Vần Tương Tác (Montessori Phonics Lab)

## 1. Tuyên Bố Bài Toán (Problem Statement)
Làm thế nào để trẻ 5-6 tuổi vừa có thể chạm-nghe phát âm từng chữ cái và phụ âm ghép độc lập theo **Âm** ("bờ", "cờ", "dờ" chuẩn SGK Kết Nối Tri Thức), vừa hiểu được trực quan cơ chế ghép vần từng bước (ví dụ: $a + ng \longrightarrow ang$), mà không bị xao nhãng hay quá tải nhận thức?

---

## 2. Quyết Định Thiết Kế Cốt Lõi (Core Design Decisions)

### 2.1. Chuẩn Phát Âm: 100% Theo Âm (Phonetic Sounds)
- Khi bé chạm vào các chữ cái phụ âm như `B`, `C`, `D`, âm thanh phát ra là **Âm** của chữ cái (*"bờ"*, *"cờ"*, *"dờ"*), không dùng tên chữ cái (*"bê"*, *"xê"*).
- Đây là cách tiếp cận sư phạm trực diện của Chương trình GDPT 2018, giúp trẻ dùng ngay âm đó để ghép vào vần (*"bờ" + "an" $\rightarrow$ "ban"*).

### 2.2. Bố Cục 3 Tab Montessori Khoa Học
1. **Tab 1: Bảng 29 Chữ Cái Đơn (Aa, Ăă, Ââ, Bb, Cc...):**
   - 29 chữ cái tiếng Việt hiển thị song hành chữ in hoa và in thường.
   - Thẻ gỗ nam châm xúc giác, chữ to rõ ràng ($\ge 56\text{px}$).
   - Chạm vào thẻ: Phát âm thanh cô giáo đọc chuẩn ngay lập tức ($< 15\text{ms}$) từ Master Sprite `v4.3.0`.
2. **Tab 2: Bảng 11 Phụ Âm Ghép Cốt Lõi (ch, gh, gi, kh, nh, ng, ngh, ph, qu, th, tr):**
   - Viền màu pastel xanh dương dịu mát (chuẩn âm đầu).
   - Phát âm thanh chuẩn: *"chờ"*, *"ghờ"*, *"giờ"*, *"khờ"*, *"nhờ"*, *"ngờ"*, *"nghờ"*, *"phờ"*, *"quờ"*, *"thờ"*, *"trờ"*.
3. **Tab 3: Bảng Vần & Khay Ghép Vần Tương Tác:**
   - Phân loại vần thành 4 họ vần thân thiện:
     * *Vần mở / Bán âm:* `ai, ay, ây, oi, ơi, ao, au, âu, eo, êu, iu, ưu, uôi, ươi...`
     * *Vần mũi vang:* `am, an, ang, anh, em, en, eng, enh, im, in, inh, um, un, ung...`
     * *Vần khép tắc:* `ap, at, ac, ach, ắp, ắt, ắc, ấp, ất, ấc, ep, et, ec, ech, ip, it, ic, ich, op, ot, oc...`
     * *Vần có âm đệm:* `oa, oe, oan, oang, oanh, oat, oac, uan, uang, uat, uac, uya, uyen, uyet, uynh, uyu...`
   - **Tương Tác Kép Sư Phạm:**
     * Chạm thẻ: Đọc trơn vần (ví dụ: *"ang"*).
     * Chạm nút "Đánh vần mẩu": Phát chuỗi bóc tách:
       $$\text{a} \longrightarrow \text{ngờ} \longrightarrow \text{ang}$$

### 2.3. Điều Hướng & Trải Nghiệm Người Dùng
- Nút gạt chuyển đổi nhẹ nhàng tại thanh tiêu đề ứng dụng (Header Capsule Switcher):
  **[ 📖 Bé Học Đọc ] $\longleftrightarrow$ [ 🔤 Bảng Chữ Cái & Âm ]**
- Không làm gián đoạn trạng thái bài đọc hiện tại khi bé quay lại.

---

## 3. Không Làm (Not Doing)
1. Không đưa vào hệ thống chấm điểm hay phần thưởng ảo (tránh xao nhãng nhận thức).
2. Không thu âm giọng bé qua micro (tránh ức chế khi AI nhận diện sai phát âm ngọng sinh lý).
3. Không dồn 145 vần vào một màn hình dài vô tận (chia tab và nhóm rõ ràng).
