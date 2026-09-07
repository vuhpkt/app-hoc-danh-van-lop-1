# DANH MỤC ÂM THANH TIẾNG VIỆT LỚP 1 (CHUẨN SGK KẾT NỐI TRI THỨC)

> **Mục đích:** Bảng chuẩn danh mục âm thanh để script TTS tự động sinh file `.mp3` và đóng gói Audio Sprite, đảm bảo 100% chính xác ngữ âm sư phạm, loại bỏ triệt để âm rác và từ ma vô nghĩa.
> **Quy chuẩn sư phạm quan trọng:**
> - Các vần kết thúc bằng phụ âm tắc $p, t, c, ch$ là âm tiết khép tắc, trong tiếng Việt **chỉ đi với thanh Sắc và thanh Nặng**.
> - Tuyệt đối không gửi chuỗi không dấu (`ăt, ăc, âc, ăp, giăt...`) cho TTS vì đây là từ không tồn tại, khiến TTS phát ra âm rác.
> - Toàn bộ 44 vần nhóm này khi thu âm TTS BẮT BUỘC gửi ở dạng **thanh Sắc** (`ắt, ất, ắc, ấc, áp, ắp, ấp, ít, óc...`).
> - Tiếng thanh Nặng đánh vần: `[Âm đầu] - [Vần sắc] - [Tiếng đệm sắc] - nặng - [Tiếng đích]` (ví dụ `gi - ắt - giắt - nặng - giặt`).
> - Tiếng thanh Sắc đánh vần 3 bước: `[Âm đầu] - [Vần sắc] - [Tiếng đích]` (ví dụ `b - ắt - bắt`).

---

## 1. BẢNG 28 ÂM ĐẦU (INITIAL CONSONANTS)

| Mã Key | Ký tự | Văn bản đọc cho TTS (tts_text) | Ghi chú sư phạm |
| :--- | :--- | :--- | :--- |
| `am_dau__b` | b | bờ | Âm b |
| `am_dau__c` | c | cờ | Âm c |
| `am_dau__ch` | ch | chờ | Âm ch |
| `am_dau__d` | d | dờ | Âm d |
| `am_dau__dd` | đ | đờ | Âm đ |
| `am_dau__g` | g | gờ | Âm g (đi với a, o, ô, ơ, u, ư) |
| `am_dau__gh` | gh | ghờ | Âm gh (đi với e, ê, i) |
| `am_dau__gi` | gi | giờ | Âm gi |
| `am_dau__h` | h | hờ | Âm h |
| `am_dau__k` | k | kờ | Âm k (đi với e, ê, i, y) |
| `am_dau__kh` | kh | khờ | Âm kh |
| `am_dau__l` | l | lờ | Âm l |
| `am_dau__m` | m | mờ | Âm m |
| `am_dau__n` | n | nờ | Âm n |
| `am_dau__ng` | ng | ngờ | Âm ng (đi với a, o, ô, ơ, u, ư) |
| `am_dau__ngh` | ngh | nghờ | Âm ngh (đi với e, ê, i) |
| `am_dau__nh` | nh | nhờ | Âm nh |
| `am_dau__p` | p | pờ | Âm p |
| `am_dau__ph` | ph | phờ | Âm ph |
| `am_dau__qu` | qu | quờ | Âm qu |
| `am_dau__r` | r | rờ | Âm r |
| `am_dau__s` | s | sờ | Âm s (s uốn lưỡi) |
| `am_dau__t` | t | tờ | Âm t |
| `am_dau__th` | th | thờ | Âm th |
| `am_dau__tr` | tr | trờ | Âm tr (tr uốn lưỡi) |
| `am_dau__v` | v | vờ | Âm v |
| `am_dau__x` | x | xờ | Âm x |

---

## 2. BẢNG 6 DẤU THANH (TONES)

| Mã Key | Tên thanh | Văn bản đọc cho TTS (tts_text) |
| :--- | :--- | :--- |
| `thanh__ngang` | Thanh ngang (không dấu) | ngang |
| `thanh__huyen` | Thanh huyền | huyền |
| `thanh__sac` | Thanh sắc | sắc |
| `thanh__hoi` | Thanh hỏi | hỏi |
| `thanh__nga` | Thanh ngã | ngã |
| `thanh__nang` | Thanh nặng | nặng |

---

## 3. BẢNG TOÀN BỘ VẦN TIẾNG VIỆT LỚP 1 (~145 VẦN CHUẨN)

### Nhóm 1: Vần đơn & Nguyên âm đôi (20 vần)
* `van__a`: a
* `van__a_breve`: ă
* `van__a_hat`: â
* `van__e`: e
* `van__e_hat`: ê
* `van__i`: i
* `van__y`: y
* `van__o`: o
* `van__o_hat`: ô
* `van__o_horn`: ơ
* `van__u`: u
* `van__u_horn`: ư
* `van__ia`: ia
* `van__ya`: ya
* `van__ie`: iê
* `van__ye`: yê
* `van__ua`: ua
* `van__uo_hat`: uô
* `van__ua_horn`: ưa
* `van__uo_horn`: ươ

### Nhóm 2: Vần kết thúc bằng bán âm i/y, o/u (25 vần)
* `van__ai`: ai
* `van__ay`: ay
* `van__a_hat_y`: ây
* `van__ao`: ao
* `van__au`: au
* `van__a_hat_u`: âu
* `van__eo`: eo
* `van__e_hat_u`: êu
* `van__iu`: iu
* `van__ieu`: iêu
* `van__yeu`: yêu
* `van__oi`: oi
* `van__o_hat_i`: ôi
* `van__o_horn_i`: ơi
* `van__ui`: ui
* `van__u_horn_i`: ưi
* `van__uoi`: uôi
* `van__u_horn_o_horn_i`: ươi
* `van__oa`: oa
* `van__oe`: oe
* `van__oai`: oai
* `van__oay`: oay
* `van__uay`: uây
* `van__ue`: uê
* `van__oeo`: oeo
* `van__uya`: uya
* `van__uyu`: uyu

### Nhóm 3: Vần kết thúc bằng phụ âm mũi m, n, ng, nh (56 vần)
* **Kết thúc bằng -m:**
  `van__am` (am), `van__a_breve_m` (ăm), `van__a_hat_m` (âm), `van__em` (em), `van__e_hat_m` (êm), `van__im` (im), `van__om` (om), `van__o_hat_m` (ôm), `van__o_horn_m` (ơm), `van__um` (um), `van__u_horn_m` (ưm), `van__iem` (iêm), `van__yem` (yêm), `van__uom_hat` (uôm), `van__uom_horn` (ươm), `van__oam` (oam).
* **Kết thúc bằng -n:**
  `van__an` (an), `van__a_breve_n` (ăn), `van__a_hat_n` (ân), `van__en` (en), `van__e_hat_n` (ên), `van__in` (in), `van__on` (on), `van__o_hat_n` (ôn), `van__o_horn_n` (ơn), `van__un` (un), `van__u_horn_n` (ưn), `van__ien` (iên), `van__yen` (yên), `van__uan_hat` (uôn), `van__uan_horn` (ươn), `van__oan` (oan), `van__oan_breve` (oăn), `van__uan_hat_a` (uân), `van__uen` (uên), `van__uyen` (uyên).
* **Kết thúc bằng -ng:**
  `van__ang` (ang), `van__a_breve_ng` (ăng), `van__a_hat_ng` (âng), `van__eng` (eng), `van__e_hat_ng` (êng), `van__ong` (ong), `van__o_hat_ng` (ông), `van__ung` (ung), `van__u_horn_ng` (ưng), `van__ieng` (iêng), `van__yeng` (yêng), `van__uong_hat` (uông), `van__uong_horn` (ương), `van__oang` (oang), `van__oang_breve` (oăng), `van__uang_hat` (uâng).
* **Kết thúc bằng -nh:**
  `van__anh` (anh), `van__e_hat_nh` (ênh), `van__inh` (inh), `van__oanh` (oanh), `van__uynh` (uynh).

### Nhóm 4: Vần kết thúc bằng phụ âm tắc p, t, c, ch (44 vần) - Đọc bằng dạng thanh sắc
* **Kết thúc bằng -p (14 vần):**
  - `van__ap`: áp
  - `van__a_breve_p`: ắp
  - `van__a_hat_p`: ấp
  - `van__ep`: ép
  - `van__e_hat_p`: ếp
  - `van__ip`: íp
  - `van__op`: óp
  - `van__o_hat_p`: ốp
  - `van__o_horn_p`: ớp
  - `van__up`: úp
  - `van__u_horn_p`: ức (hoặc úp)
  - `van__iep`: iếp
  - `van__uop_hat`: uốp
  - `van__uop_horn`: ướp
* **Kết thúc bằng -t (19 vần):**
  - `van__at`: át
  - `van__a_breve_t`: ắt
  - `van__a_hat_t`: ất
  - `van__et`: ét
  - `van__e_hat_t`: ết
  - `van__it`: ít
  - `van__ot`: ót
  - `van__o_hat_t`: ốt
  - `van__o_horn_t`: ớt
  - `van__ut`: út
  - `van__u_horn_t`: ứt
  - `van__iet`: iết
  - `van__uot_hat`: uốt
  - `van__uot_horn`: ướt
  - `van__oat`: oát
  - `van__oat_breve`: oắt
  - `van__uat_hat`: uất
  - `van__uyet`: uyết
  - `van__uyt`: uýt
* **Kết thúc bằng -c (14 vần):**
  - `van__ac`: ác
  - `van__a_breve_c`: ắc
  - `van__a_hat_c`: ấc
  - `van__ec`: éc
  - `van__e_hat_c`: ếc
  - `van__oc`: óc
  - `van__o_hat_c`: ốc
  - `van__uc`: úc
  - `van__u_horn_c`: ức
  - `van__iec`: iếc
  - `van__uoc_hat`: uốc
  - `van__uoc_horn`: ước
  - `van__oac`: oác
  - `van__oac_breve`: oắc
* **Kết thúc bằng -ch (5 vần):**
  - `van__ach`: ách
  - `van__e_hat_ch`: ếch
  - `van__ich`: ích
  - `van__oach`: oách
  - `van__uych`: uých

---

## 4. BẢNG TIẾNG TRUNG GIAN & TỪ ĐẶC BIỆT SGK LỚP 1

| Mã Key | Ký tự từ | Văn bản đọc cho TTS (tts_text) | Quy trình đánh vần sư phạm |
| :--- | :--- | :--- | :--- |
| `tu__giat_sac` | giắt | giắt | giờ - ắt - giắt (tiếng đệm mang sắc của giặt) |
| `tu__giat` | giặt | giặt | gi - ắt - giắt - nặng - giặt |
| `tu__hoc_sac` | hóc | hóc | hờ - óc - hóc (tiếng đệm mang sắc của học) |
| `tu__hoc` | học | học | h - óc - hóc - nặng - học |
| `tu__vit_sac` | vít | vít | vờ - ít - vít (tiếng đệm mang sắc của vịt) |
| `tu__vit` | vịt | vịt | v - ít - vít - nặng - vịt |
| `tu__mat_sac` | mắt | mắt | mờ - ắt - mắt (tiếng đệm mang sắc của mặt) |
| `tu__mat` | mặt | mặt | m - ắt - mắt - nặng - mặt |
| `tu__quat_sac` | quát | quát | quờ - át - quát (tiếng đệm mang sắc của quạt) |
| `tu__quat` | quạt | quạt | qu - át - quát - nặng - quạt |
| `tu__chuot_sac` | chuốt | chuốt | chờ - uốt - chuốt (tiếng đệm mang sắc của chuột) |
| `tu__chuot` | chuột | chuột | ch - uốt - chuốt - nặng - chuột |
| `tu__bat` | bắt | bắt | b - ắt - bắt (tiếng sắc, 3 bước) |
| `tu__hat` | hát | hát | h - át - hát (tiếng sắc, 3 bước) |
| `tu__sach` | sách | sách | s - ách - sách (tiếng sắc, 3 bước) |
| `tu__quoc` | quốc | quốc | qu - ốc - quốc (tiếng sắc, 3 bước) |
| `tu__truong_ngang` | trương | trương | trờ - ương - trương (tiếng đệm của trường) |
| `tu__truong` | trường | trường | tr - ương - trương - huyền - trường |
| `tu__quang` | quang | quang | qu - ang - quang |
| `tu__khuyu_ngang` | khuyu | khuyu | kh - uyu - khuyu (tiếng đệm của khuỷu) |
| `tu__khuyu` | khuỷu | khuỷu | kh - uyu - khuyu - hỏi - khuỷu |
| `tu__nguyen` | nguyễn | nguyễn | ng - uyên - nguyên - ngã - nguyễn |
| `tu__chich` | chích | chích | ch - ích - chích |
| `tu__choe` | chòe | chòe | ch - oe - choe - huyền - chòe |
| `tu__huych` | huých | huých | h - uých - huých |
| `tu__chim` | chim | chim | ch - im - chim |
| `tu__hoa` | hoa | hoa | h - oa - hoa |
| `tu__me` | mẹ | mẹ | m - e - me - nặng - mẹ |
| `tu__be` | bé | bé | b - e - be - sắc - bé |
| `tu__ban` | bạn | bạn | b - an - ban - nặng - bạn |
