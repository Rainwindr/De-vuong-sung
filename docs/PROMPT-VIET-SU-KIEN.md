# Bộ prompt viết SỰ KIỆN cho Grok

**Cảnh** là đoạn văn hiện ra sau khi chọn (đã có bộ prompt riêng trong `PROMPT-VIET-CANH.md`).
**Sự kiện** là thứ bật lên trong game: một tình huống, vài nút lựa chọn, mỗi nút có hệ quả và có thể dẫn vào một cảnh.

Sự kiện mới nằm ở:

| Thứ | File |
| --- | --- |
| Sự kiện | `packs/canh-viet/events/su-kien-moi.json` |
| Cảnh đi kèm sự kiện | `packs/canh-viet/scene-texts/8-canh-moi.json` |
| Sở thích mới (nếu có) | `packs/canh-viet/fetishes.json` |

---

## Quy trình

1. Mở cuộc trò chuyện mới với Grok. Dán **Prompt mở đầu** (mục A của `PROMPT-VIET-CANH.md`), rồi dán **Prompt B** bên dưới. Hai prompt này chỉ dán một lần.
2. Mỗi lần muốn có sự kiện, dán một **yêu cầu** theo mẫu ở mục C (ví dụ "viết 3 sự kiện Trung thu cho Mị Nương").
3. Grok trả về một khối JSON `{ "events": [...], "scenes": {...} }`. Đưa vào game theo mục D.

---

## B. Prompt dạy Grok cách viết sự kiện (dán một lần)

````
Từ giờ ngoài cảnh, tôi sẽ nhờ bạn viết SỰ KIỆN cho game. Sự kiện là tình huống bật lên, có lời dẫn và 2–4 nút lựa chọn. Hãy luôn trả về đúng một khối JSON theo mẫu dưới, không giải thích thêm.

MẪU TRẢ VỀ
```json
{
  "events": [
    {
      "id": "canh-viet.ten_su_kien",
      "title": "Tên sự kiện",
      "speaker": "core.mi_nuong",
      "cooldown": 12,
      "weight": 4,
      "when": { "speakerInHarem": true, "favor": { "gte": 40 } },
      "text": "Lời dẫn. {name} là tên người nói.\n> Lời thoại của nàng.",
      "choices": [
        { "label": "Nút dẫn vào cảnh nóng", "fetish": ["core.huong_sac"], "effects": { "favor": 8, "truyLac": 3 }, "hook": "canh-viet.ten_su_kien" },
        { "label": "Nút nhẹ nhàng", "effects": { "affection": 5 }, "result": "Câu kết ngắn hiện ra sau khi chọn." }
      ]
    }
  ],
  "scenes": {
    "canh-viet.ten_su_kien": {
      "_title": "Tên cảnh",
      "_chung": { "_": ["Đoạn cảnh 1...", "Đoạn cảnh 2...", "Đoạn cảnh 3...", "Đoạn cảnh 4...", "Đoạn cảnh 5..."] }
    }
  }
}
```

QUY TẮC BẮT BUỘC
1. Mọi "id" sự kiện và mọi "hook" mới đều bắt đầu bằng "canh-viet." viết thường, không dấu, nối bằng gạch dưới. Không trùng nhau.
2. Mỗi nút có "hook" thì phải có cảnh tương ứng trong "scenes" (cùng tên hook): đúng 5 đoạn NỐI TIẾP nhau thành một cảnh (mở đầu → diễn biến → dư âm), mỗi đoạn 50–70 chữ, tổng 260–320 chữ (tự đếm trước khi trả lời); không đoạn nào chỉ gồm một câu thoại. Nút không có "hook" thì có "result" (một câu).
3. Nút có "hook" phải có "fetish" gồm ít nhất một id trong DANH SÁCH SỞ THÍCH bên dưới. Cảnh nhiều người bắt buộc có "fetish".
4. Mọi nhân vật đều từ 18 tuổi, tự nguyện. Không có con cái, trẻ em trong cảnh nóng. Không cưỡng ép, không say/thuốc, không người ngoài bắt gặp.
5. Trong chữ: xuống dòng viết \n, lời thoại bắt đầu bằng "> ", không dùng dấu " bên trong đoạn (dùng “ ” thay thế).
6. Biến dùng được trong "text", "label", "result": {name} người nói, {name2} người thứ hai (khi speaker là "pair"), {rank} phẩm của nàng, {emperor} niên hiệu. Trong "scenes": {name}, {names} (nhiều người), {emperor}, {fetish}.

CÁC TRƯỜNG CỦA SỰ KIỆN
- "speaker": id nhân vật (core.uyen_nghi, core.moc_can, core.tuyet, core.nhu_yen, core.tu_lan, core.mi_nuong, core.thanh_ca, core.song_nguyet, core.song_nhat, core.hong_tieu), hoặc "random" (một phi bất kỳ thỏa điều kiện), hoặc "pair" (một cặp phi thích nhau).
- "once": true nếu chỉ xảy ra một lần mỗi đời. "perConsort": true nếu mỗi phi gặp một lần (dùng với "random").
- "cooldown": số tháng tối thiểu giữa hai lần. "weight": độ hay gặp, 2 hiếm, 4 bình thường, 8 hay gặp.
- "when": điều kiện để sự kiện xảy ra.

ĐIỀU KIỆN ("when", và "requires" của từng nút)
So sánh số: { "gte": 40 } là từ 40 trở lên, { "lte": 20 } là tối đa 20, { "in": [1,2] } là một trong các giá trị.
- speakerInHarem: true (người nói đã nhập cung — gần như luôn cần)
- favor, affection: Sủng ái, Tình cảm của người nói (0–100)
- truyLac, longThe, quocKho, danTam, hoaKhi: chỉ số của triều đình
- age: tuổi hoàng đế; month: tháng 1–12; harem: số phi
- flag / notFlag: cờ đã bật / chưa bật (dùng nối chuỗi sự kiện)
- fetishUnlocked: "id sở thích" đã mở; fetishLevel: { "id": { "gte": 50 } } độ nghiện
- building: công trình đã xây (core.phong_huong, core.hoa_vien, core.san_khau, core.cung_dong_tam, core.ho_sen, core.me_lau, core.ho_duc_tri, core.lac_thu_dien)
- speakerTrait: đặc điểm của nàng; speakerPregnant: true/false
- pairTinhY: { "gte": 61 } (khi speaker là "pair")

HỆ QUẢ ("effects" của từng nút)
- favor, affection: cộng/trừ Sủng ái, Tình cảm người nói (thường ±3 đến ±15)
- truyLac, hoaKhi, danTam, longThe: cộng/trừ chỉ số (thường ±2 đến ±10); quocKho: ngân lượng (±100 đến ±1000)
- favorAll: Sủng ái cả hậu cung; favor2: người thứ hai của cặp; tinhY: Tình Ý của cặp
- flag: "ten_co" hoặc ["co1","co2"] — bật cờ để mở sự kiện tiếp theo
- trait / removeTrait: thêm / bỏ đặc điểm của nàng
- fetish: { "id sở thích": 10 } — tăng độ nghiện của bệ hạ
- consent: { "id sở thích": "willing" } — nàng trở nên sẵn lòng với sở thích đó
- promote: 1 — thăng phẩm
- album: { "title": "...", "line": "..." } — lưu khoảnh khắc vào album
- Nút có thể có "cost": 500 (tốn ngân lượng)

NÚT DẪN VÀO CẢNH NHIỀU NGƯỜI
Thêm "participants": { "select": "top_favor", "count": 3, "includeSpeaker": true } và "minParticipants": 3. Game tự chọn những phi đang sẵn lòng với mọi sở thích trong "fetish".
Với cặp đối thực: "participants": "pair".

CHUỖI SỰ KIỆN
Sự kiện 1 bật cờ "canh-viet.ten_chuoi.1"; sự kiện 2 có "when": { "flag": "canh-viet.ten_chuoi.1" } và bật cờ ".2"; cứ thế. Các sự kiện trong chuỗi đều "once": true, Sủng ái yêu cầu tăng dần (30, 55, 75, 95).

DANH SÁCH SỞ THÍCH (dùng id trong ngoặc)
Cơ bản: core.lua_la (Lụa là), core.huong_sac (Hương sắc), core.duc_tri (Tắm chung), core.ngam_nhin (Ngắm nhìn), core.trang_suc (Trang sức), core.nhap_vai (Nhập vai), core.y_phuc (Y phục), core.bit_mat (Bịt mắt), core.yen_tiec (Yến tiệc trên người), core.thi_tham (Thì thầm), core.chinh_phuc (Chinh phục), core.ganh_dua (Ganh đua), core.ban_thuong (Ban thưởng), core.chu_to (Chủ và tớ), core.troi_lua (Trói lụa), core.nong_lanh (Nóng lạnh), core.trinh_dien (Trình diễn trước hậu cung), core.khan_dai (Khán đài).
Nóng bỏng: khung-nong-bong.phuc_dich, khung-nong-bong.tu_do, khung-nong-bong.kiem_che, khung-nong-bong.long_chung, khung-nong-bong.xoa_bop, khung-nong-bong.nghi_thuc, khung-nong-bong.y_phuc_goi, khung-nong-bong.doi_thuc_nong, khung-nong-bong.gameshow, khung-nong-bong.troi_buoc, khung-nong-bong.khan_gia, khung-nong-bong.tan_phi.
Mở rộng: canh-viet.toc_dai, canh-viet.guong, canh-viet.am_thanh, canh-viet.chan_tay, canh-viet.phuc_trang, canh-viet.doi_noi, canh-viet.cham_cham, canh-viet.nuoc_mat, canh-viet.hai_nguoi, canh-viet.quan_sat_bi, canh-viet.lenh_phat, canh-viet.sau_man, canh-viet.harem_phuc_vu_hang_ngay, canh-viet.edging_tap_the, canh-viet.khoi_dong_gai_moi, canh-viet.tho_phung_ca_dem, canh-viet.milking, canh-viet.hai_loc_dau_ngay, canh-viet.breast, canh-viet.creampie_marathon, canh-viet.squirting_mess_fuck, canh-viet.tickle_fuck, canh-viet.cmnf, canh-viet.women_being_carried_and_fucked, canh-viet.sexy_lingerie_thong_bikini, canh-viet.men_watching_lesbian, canh-viet.massage_pussy, canh-viet.always_bottomless, canh-viet.row_of_girls_dildo, canh-viet.shaving_pussy, canh-viet.porn_gameshow, canh-viet.lesbian_eating, canh-viet.women_wearing_see_through_clothing, canh-viet.gloryholes, canh-viet.sex_in_front_of_others, canh-viet.phong_van, canh-viet.multiple_continuous_long_orgasms, canh-viet.lesbian_femdom, canh-viet.bdsm, canh-viet.force_squirt, canh-viet.one_bar, canh-viet.breeding, canh-viet.sensory_deprivation, canh-viet.temperature_play, canh-viet.praise_kink, canh-viet.degradation, canh-viet.mirror_sex, canh-viet.outdoor_night, canh-viet.double_penetration_toys, canh-viet.aftercare_intense, canh-viet.voice_control, canh-viet.slow_tease_long, canh-viet.marking, canh-viet.mutual_masturbation, canh-viet.lesbian_eating_contest, canh-viet.lesbian_massage_contest, canh-viet.japanese_gameshow.

Nếu cần một sở thích chưa có trong danh sách, thêm vào khối trả về:
"fetishes": [ { "id": "canh-viet.ten_moi", "name": "Tên", "tier": 2, "unlock": { "truyLac": { "gte": 35 } }, "default_consent": "persuade", "desc": "Mô tả ngắn" } ]

Trả lời "Đã hiểu" nếu bạn nắm hết.
````

---

## C. Mẫu yêu cầu (dán mỗi lần cần)

**Sự kiện cho một phi:**
```
Viết 3 sự kiện cho core.tuyet. Bối cảnh: mùa đông, nàng nhớ thảo nguyên. Mỗi sự kiện 3 nút, ít nhất một nút dẫn vào cảnh nóng dùng core.duc_tri. Chỉ trả về JSON.
```

**Chuỗi cốt truyện:**
```
Viết chuỗi 4 sự kiện liên tiếp cho core.thanh_ca, tên chuỗi canh-viet.thanh_ca_dan. Nàng dạy bệ hạ gảy đàn, càng về sau càng thân mật. Dùng cờ để nối, Sủng ái yêu cầu 30/55/75/95. Sự kiện cuối có nút lưu album. Chỉ trả về JSON.
```

**Sự kiện cho phi ngẫu nhiên:**
```
Viết 5 sự kiện speaker "random", perConsort true, xảy ra khi Trụy lạc từ 40. Chủ đề: các tú nữ mới tìm cách gây chú ý. Chỉ trả về JSON.
```

**Sự kiện tập thể:**
```
Viết 2 sự kiện tập thể khi đã xây core.lac_thu_dien. Nút dẫn vào cảnh dùng participants top_favor 3–4 người, fetish khung-nong-bong.gameshow. Chỉ trả về JSON.
```

**Sự kiện đối thực:**
```
Viết 2 sự kiện speaker "pair", pairTinhY từ 61. Bệ hạ bắt gặp hai nàng bên nhau và được mời tham gia. Nút dẫn vào cảnh dùng participants "pair" và fetish khung-nong-bong.doi_thuc_nong. Chỉ trả về JSON.
```

**Sự kiện theo mùa:**
```
Viết 3 sự kiện tháng 8 (Trung thu) cho speaker "random", cooldown 12. Chỉ trả về JSON.
```

---

## D. Đưa vào game

**Cách nhanh (máy tính):** chép nguyên câu trả lời của Grok vào `grok.txt` trong thư mục game, chạy

```
python tools/them-canh.py grok.txt
```

Công cụ tự chia: sự kiện vào `events/su-kien-moi.json`, cảnh vào `8-canh-moi.json`, sở thích mới vào `fetishes.json`. Sự kiện trùng id thì thay bản cũ. Xong tự kiểm tra lỗi và build.

**Cách tay (GitHub hoặc VS Code):**

1. Mở `packs/canh-viet/events/su-kien-moi.json`. File là danh sách `[ ... ]`.
   - Nếu đang là `[]`: dán các sự kiện vào giữa hai ngoặc, cách nhau bằng dấu phẩy.
   - Nếu đã có sự kiện: thêm dấu phẩy sau `}` của sự kiện cuối, rồi dán sự kiện mới trước dấu `]`.
2. Mở `packs/canh-viet/scene-texts/8-canh-moi.json`. Dán phần bên trong `"scenes"` (từ `"canh-viet.ten_su_kien": {` đến `}` tương ứng) vào trước dấu `}` cuối file. Nhớ dấu phẩy ngăn cách với mục phía trên.
3. Nếu Grok có trả `"fetishes"`, dán vào cuối `packs/canh-viet/fetishes.json` như hướng dẫn thêm sở thích.
4. Chạy `node tools/validate.js` → `0 lỗi` → `python tools/build.py` → chơi thử bằng `CHOI-GAME.bat`.

**Thử ngay sự kiện vừa thêm:** vào tab **Thiên Đạo**, phần gọi sự kiện, chọn id `canh-viet.ten_su_kien`. Không cần chờ nó tự bật.

---

## E. Lỗi hay gặp

| Bộ kiểm tra báo | Nghĩa là | Sửa |
| --- | --- | --- |
| `thiếu tiền tố canh-viet.` | id sự kiện không bắt đầu bằng `canh-viet.` | đổi id |
| `sở thích không tồn tại` | Grok bịa id sở thích | đổi sang id trong danh sách, hoặc thêm sở thích mới |
| `cảnh nhiều người thiếu fetish` | nút tập thể không có `fetish` | thêm ít nhất một sở thích |
| `HOOK ... chưa có cảnh` | nút có `hook` nhưng thiếu cảnh | thêm cảnh vào `8-canh-moi.json`, hoặc để vậy (game dùng cảnh mặc định) |
| JSON lỗi ở dòng X | thiếu/thừa dấu phẩy, ngoặc, hoặc có `"` trong đoạn | xem đúng dòng X |

Sự kiện viết dở chưa muốn bật tự nhiên: thêm `"manual": true`, chỉ gọi được bằng Thiên Đạo.
