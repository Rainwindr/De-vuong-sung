# Bộ prompt viết CUỘC THI cho Grok

Cuộc thi diễn ra vào **tháng 4 và tháng 9** mỗi năm (người chơi cũng có thể tự mở trong Ý chỉ): game bốc tối đa 4 cuộc thi đã mở khóa cho người chơi chọn, tự chọn các phi Sủng ái cao nhất (và sẵn lòng với sở thích của cuộc thi) làm thí sinh, chấm điểm, trao thưởng cho người thắng rồi hiện cảnh. Điểm thi cộng dồn; cứ 3 năm, nếu Trụy lạc từ 40, tháng 12 có Phong Nguyệt Đại Điển cho ba người điểm cao nhất.

Cuộc thi mới nằm ở:

| Thứ | File |
| --- | --- |
| Định nghĩa cuộc thi | `packs/canh-viet/contests.json` (tự tạo khi thêm lần đầu) |
| Cảnh của cuộc thi | `packs/canh-viet/scene-texts/8-canh-moi.json` |

## Quy trình

1. Mở cuộc trò chuyện mới với Grok, dán **Prompt mở đầu** (mục A của `PROMPT-VIET-CANH.md`), rồi dán **Prompt B** dưới đây. Hai prompt này chỉ dán một lần.
2. Mỗi lần cần cuộc thi, dán một **yêu cầu** theo mẫu ở mục C.
3. Đưa câu trả lời vào game (mục D).

---

## B. Prompt dạy Grok cách viết cuộc thi (dán một lần)

````
Từ giờ tôi sẽ nhờ bạn viết CUỘC THI trong hậu cung cho game. Mỗi cuộc thi gồm phần định nghĩa (luật chơi, ai được dự, phần thưởng) và một cảnh. Luôn trả về đúng một khối JSON theo mẫu, không giải thích thêm.

MẪU TRẢ VỀ
```json
{
  "contests": [
    {
      "id": "canh-viet.ten_cuoc_thi",
      "name": "Tên cuộc thi",
      "desc": "Mô tả một dòng, hiện trên nút chọn",
      "tier": 2,
      "unlock": { "truyLac": { "gte": 40 } },
      "fetish": ["id sở thích"],
      "count": 4,
      "hook": "canh-viet.ten_cuoc_thi",
      "traitsBonus": ["Táo bạo", "Biết múa"],
      "prize": { "favor": 20, "trait": "Danh hiệu người thắng" }
    }
  ],
  "scenes": {
    "canh-viet.ten_cuoc_thi": {
      "_title": "Tên cuộc thi",
      "_chung": { "_": ["Đoạn 1", "Đoạn 2", "Đoạn 3", "Đoạn 4", "Đoạn 5"] }
    }
  }
}
```

QUY TẮC BẮT BUỘC
1. "id" và "hook" giống nhau, bắt đầu bằng "canh-viet.", viết thường không dấu, nối bằng gạch dưới. Không trùng với cuộc thi đã có (danh sách bên dưới).
2. Mọi thí sinh đều trưởng thành, tỉnh táo, tự nguyện ghi tên. Khán giả chỉ là bệ hạ và các phi khác cùng tự nguyện. Không cưỡng ép, không say/thuốc, không người ngoài.
3. Cuộc thi có yếu tố thân mật thì "fetish" phải có ít nhất một id trong DANH SÁCH SỞ THÍCH (chỉ phi sẵn lòng với sở thích đó mới được chọn dự thi). Cuộc thi tài nghệ thuần túy (thơ, đàn, múa) để "fetish": [].
4. Cảnh: đúng 5 đoạn NỐI TIẾP nhau thành một cảnh: đoạn 1 mở màn và giới thiệu luật; đoạn 2, 3, 4 các thí sinh lần lượt thi, cao trào; đoạn 5 công bố người thắng, trao giải và dư âm. Mỗi đoạn 50–70 chữ, tổng 260–320 chữ (tự đếm trước khi trả lời), không tóm tắt, có lời thoại; không đoạn nào chỉ gồm một câu thoại.
5. Biến trong cảnh: {names} danh sách thí sinh, {name} một thí sinh (người đầu danh sách), {winner} người thắng, {contest} tên cuộc thi, {emperor} niên hiệu. Không dùng biến nào khác, không tự đặt tên thí sinh.
6. Trong chữ: xuống dòng viết \n, lời thoại bắt đầu bằng "> ", không dùng dấu " bên trong đoạn (dùng “ ” thay thế).

CÁC TRƯỜNG
- "tier": 1 nhẹ nhàng, 2 táo bạo, 3 trụy lạc. Tầng càng cao Trụy lạc tăng càng nhiều sau cuộc thi.
- "unlock": điều kiện để cuộc thi xuất hiện. Dùng một hoặc kết hợp:
  { "truyLac": { "gte": 40 } }   — Trụy lạc từ 40 (tầng 1: 0–30, tầng 2: 40–55, tầng 3: 60–80)
  { "building": "id công trình" } — đã xây: core.phong_huong (Phòng hương), core.hoa_vien (Hoa viên riêng), core.san_khau (Sân khấu nhỏ), core.cung_dong_tam (Cung Đồng Tâm), core.ho_sen (Hồ sen), core.me_lau (Mê Lâu), core.ho_duc_tri (Dục Trì Thiên Hương), core.lac_thu_dien (Lạc Thú điện)
  {} — mở ngay từ đầu
- "count": số thí sinh, 3 đến 6.
- "traitsBonus": đặc điểm được cộng điểm, chọn 1–3 trong: Giọng hát ngọt, Eo thon, Hay ngượng, Táo bạo, Mùi hương lạ, Biết múa, Khéo tay, Phúc tướng, Tinh nghịch, Ôn nhu, Thích chưng diện, Lãng mạn, Kiêu kỳ, Đa sầu, Đoan trang, Hoang dã, Thẳng thắn, Mê hoặc, Tham vọng, Tinh tế, Từng trải, Diễn giỏi, Khéo nói, Si tình.
- "prize": phần thưởng cho người thắng. Dùng một hoặc vài khóa:
  "favor": 15 đến 25 (Sủng ái)
  "affection": 5 đến 15 (Tình cảm)
  "trait": "Danh hiệu" (ví dụ "Hoa khôi", "Vũ hậu") — người thắng mang danh hiệu này
  "promote": 1 (thăng một phẩm, chỉ cho cuộc thi tầng 3)
  "consent": { "id sở thích": "willing" } (người thắng trở nên sẵn lòng với sở thích đó)

CUỘC THI ĐÃ CÓ (không viết trùng)
Thi thơ hậu cung, Đàn trong đêm trăng, Bách Hoa Tuyển Diễm (nhan sắc, trang sức), Hương Đấu (đoán mùi hương), Vũ Mị (múa quyến rũ), Dục Trì Tranh Sủng (trò chơi dưới nước), Đại Kịch Phong Nguyệt (dựng kịch), Thì Thầm Mê Hồn (bịt mắt, thì thầm), Ngự Yến Phong Lưu (yến tiệc trên người), Hoàng Hậu Một Đêm (làm chủ một đêm).

DANH SÁCH SỞ THÍCH (dùng id trong ngoặc)
Cơ bản: core.lua_la (Lụa là), core.huong_sac (Hương sắc), core.duc_tri (Tắm chung), core.ngam_nhin (Ngắm nhìn), core.trang_suc (Trang sức), core.nhap_vai (Nhập vai), core.y_phuc (Y phục), core.bit_mat (Bịt mắt), core.yen_tiec (Yến tiệc trên người), core.thi_tham (Thì thầm), core.chinh_phuc (Chinh phục), core.ganh_dua (Ganh đua), core.ban_thuong (Ban thưởng), core.chu_to (Chủ và tớ), core.troi_lua (Trói lụa), core.nong_lanh (Nóng lạnh), core.trinh_dien (Trình diễn trước hậu cung), core.khan_dai (Khán đài).
Nóng bỏng: khung-nong-bong.phuc_dich, khung-nong-bong.tu_do, khung-nong-bong.kiem_che, khung-nong-bong.long_chung, khung-nong-bong.xoa_bop, khung-nong-bong.nghi_thuc, khung-nong-bong.y_phuc_goi, khung-nong-bong.doi_thuc_nong, khung-nong-bong.gameshow, khung-nong-bong.troi_buoc, khung-nong-bong.khan_gia, khung-nong-bong.tan_phi.
Mở rộng: canh-viet.toc_dai, canh-viet.guong, canh-viet.am_thanh, canh-viet.chan_tay, canh-viet.phuc_trang, canh-viet.doi_noi, canh-viet.cham_cham, canh-viet.nuoc_mat, canh-viet.hai_nguoi, canh-viet.quan_sat_bi, canh-viet.lenh_phat, canh-viet.sau_man, canh-viet.edging_tap_the, canh-viet.khoi_dong_gai_moi, canh-viet.tho_phung_ca_dem, canh-viet.milking, canh-viet.breast, canh-viet.creampie_marathon, canh-viet.squirting_mess_fuck, canh-viet.tickle_fuck, canh-viet.cmnf, canh-viet.sexy_lingerie_thong_bikini, canh-viet.men_watching_lesbian, canh-viet.women_having_orgasms, canh-viet.massage_pussy, canh-viet.titties_clit_massage, canh-viet.row_of_girls_dildo, canh-viet.shaving_pussy, canh-viet.porn_gameshow, canh-viet.lesbian_eating, canh-viet.women_wearing_see_through_clothing, canh-viet.sex_in_front_of_others, canh-viet.women_taking_off_their_clothes, canh-viet.phong_van, canh-viet.multiple_continuous_long_orgasms, canh-viet.lesbian_femdom, canh-viet.bdsm, canh-viet.one_bar, canh-viet.breeding, canh-viet.sensory_deprivation, canh-viet.temperature_play, canh-viet.praise_kink, canh-viet.mirror_sex, canh-viet.outdoor_night, canh-viet.double_penetration_toys, canh-viet.voice_control, canh-viet.sweat_play, canh-viet.slow_tease_long, canh-viet.marking, canh-viet.mutual_masturbation, canh-viet.lesbian_eating_contest, canh-viet.lesbian_massage_contest, canh-viet.japanese_gameshow.

Nếu cần một sở thích chưa có, thêm vào khối trả về:
"fetishes": [ { "id": "canh-viet.ten_moi", "name": "Tên", "tier": 2, "unlock": { "truyLac": { "gte": 40 } }, "default_consent": "persuade", "desc": "Mô tả ngắn" } ]

Trả lời "Đã hiểu" nếu bạn nắm hết.
````

---

## C. Mẫu yêu cầu (dán mỗi lần cần)

Mỗi lần chỉ xin **1–2 cuộc thi** để Grok viết đủ dài.

**Cuộc thi tài nghệ, mở từ đầu:**
```
Viết 1 cuộc thi tầng 1, mở ngay từ đầu, fetish để trống: thi làm hoa đăng đêm rằm. Thưởng favor 15 và danh hiệu. Chỉ trả về JSON.
```

**Cuộc thi táo bạo:**
```
Viết 1 cuộc thi tầng 2, mở khi Trụy lạc từ 45, 4 thí sinh, dùng sở thích core.ngam_nhin và canh-viet.women_taking_off_their_clothes: thi cởi lụa đẹp nhất trước bệ hạ. Người thắng được trait "Tiên lụa". Chỉ trả về JSON.
```

**Cuộc thi gắn với công trình:**
```
Viết 1 cuộc thi tầng 2, mở khi đã xây core.ho_duc_tri, 5 thí sinh, sở thích core.duc_tri: thi lặn tìm ngọc trong bể tắm. Chỉ trả về JSON.
```

**Cuộc thi trụy lạc:**
```
Viết 1 cuộc thi tầng 3, mở khi Trụy lạc từ 65 và đã xây core.lac_thu_dien, 4 thí sinh, sở thích canh-viet.lesbian_massage_contest. Người thắng được thăng một phẩm. Chỉ trả về JSON.
```

**Nhiều phiên bản cảnh cho một cuộc thi đã có:**
```
Viết thêm một cảnh khác cho cuộc thi canh-viet.ten_cuoc_thi (khác tình tiết với lần trước). Chỉ trả về:
{ "scenes": { "canh-viet.ten_cuoc_thi": { "_chung": { "_": ["Đoạn 1", "Đoạn 2", "Đoạn 3", "Đoạn 4", "Đoạn 5"] } } } }
```
Cuộc thi trong `core` (Thi thơ, Vũ Mị…) cũng viết thêm cảnh được theo cách này: thay id bằng hook của nó (`core.thi_tho`, `core.thi_cam`, `core.thi_tuyen_diem`, `core.thi_huong_dau`, `core.thi_vu_mi`, `core.thi_duc_tri`, `core.thi_dai_kich`, `core.thi_thi_tham`, `core.thi_ngu_yen`, `core.thi_hoang_hau_mot_dem`).

---

## D. Đưa vào game

- **Cách nhanh:** chép nguyên câu trả lời của Grok vào `grok.txt`, chạy `python tools/them-canh.py grok.txt`. Công cụ tự đặt định nghĩa vào `contests.json` (tự tạo và tự khai báo trong `manifest.json` nếu chưa có), cảnh vào `8-canh-moi.json`, sở thích mới vào `fetishes.json`, rồi kiểm tra lỗi và build.
- **Gửi cho Claude:** gửi file JSON hoặc dán câu trả lời của Grok, Claude ghép giúp.
- **Thử ngay:** bấm **Ý chỉ → Mở cuộc thi** (cần 800 lượng; Thiên Đạo có thể bật vô hạn tiền), hoặc đưa game đến tháng 3/8 rồi bấm **+1 tháng** ở thanh dưới. Game bốc ngẫu nhiên tối đa 4 cuộc thi đã mở và cần ít nhất 3 phi trong hậu cung; nếu chưa thấy cuộc thi mới thì dùng mục ảnh chụp đầu năm của Thiên Đạo để quay lại thử tiếp.
