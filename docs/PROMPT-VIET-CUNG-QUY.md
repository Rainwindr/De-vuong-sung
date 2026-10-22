# Bộ prompt viết CUNG QUY cho Grok

**Cung quy** là lệ hậu cung do bệ hạ ban: bật trong **Ý chỉ → Cung quy**, có hiệu lực mỗi tháng cho đến khi bãi bỏ. Bật cùng lúc bao nhiêu quy định cũng được.

Cách game xử lý:
- Mỗi quy định gắn với một hoặc vài **sở thích**. Chỉ phi **sẵn lòng** với các sở thích đó mới theo lệ. Phi khác được miễn, nhưng hậu cung chia phe: mỗi phi không theo làm **Hòa khí −0,25/tháng** (tối đa −1,5 cho mỗi quy định).
- **Mỗi tháng**, quy định cộng chỉ số theo trường `monthly` (Trụy lạc, Sủng ái hoặc Tình cảm cho phi theo lệ…).
- **Thỉnh thoảng** (theo `chance`, mặc định 30% mỗi tháng) nổ một sự kiện "lệ hôm nay". Người chơi chọn "Ghé xem" thì vào **cảnh của quy định**, với vài phi theo lệ được chọn ngẫu nhiên.

| Thứ | File |
|---|---|
| Danh sách quy định | `packs/canh-viet/cung-quy.json` |
| Cảnh của quy định | `packs/canh-viet/scene-texts/11-cung-quy.json` |
| Sở thích mới (nếu cần) | `packs/canh-viet/fetishes.json` |

Hiện có 3 quy định mẫu, cảnh vẫn là **bản nháp**: Lệ không mặc quần, Lệ ngọc hành, Lệ hầu sáng. Có thêm sở thích mới **Mang ngọc hành** (`canh-viet.ngoc_hanh`), chưa có cảnh thị tẩm riêng.

---

## Quy trình

1. Mở **cuộc trò chuyện mới** với Grok, dán **Prompt A** một lần.
2. Muốn viết lại cảnh cho quy định đã có: dán **Prompt B**.
3. Muốn tạo quy định mới: dán **Prompt C**, điền ý tưởng vào chỗ in hoa.
4. Gửi kết quả cho Claude như mọi lần, rồi nói "update all".

---

## Prompt A · Thiết lập (dán một lần)

```
Bạn là người viết truyện cho một game web mô phỏng hậu cung, bối cảnh Trung Hoa cổ đại hư cấu, dành cho người lớn (25+). Từ giờ tôi nhờ bạn viết CUNG QUY: những lệ hậu cung do bệ hạ ban, chỉ các phi tần tự nguyện mới theo, và cảnh của từng lệ.

QUY TẮC BẮT BUỘC
- Mọi nhân vật từ 18 tuổi trở lên. Không nhắc tuổi nhỏ, không xưng "con".
- Lệ là thứ các phi TỰ NGUYỆN theo, không phải hình phạt. Phi không muốn thì được miễn, không bị phạt, không bị ép. Trong cảnh chỉ có các phi theo lệ.
- Mọi hành động đều tự nguyện. Ai xin dừng thì dừng ngay. Trói, bịt mắt, đổi vai thì phải có ám hiệu dừng (ví dụ "hoa mai").
- Không cưỡng ép, kể cả giả vờ. Không say rượu, không dùng thuốc. Không bài tiết, không khám chữa bệnh. Không gây thương tích.
- Người chứng kiến chỉ có hoàng đế và các phi tần. Không cung nữ, thái giám, người hầu, thị vệ, quan lại; nếu có thì họ đã lui ra trước.

CÁCH VIẾT
- Tiếng Việt, văn phong cổ trang. Người kể gọi hoàng đế là "bệ hạ" hoặc "người", KHÔNG dùng "hắn". Phi tần xưng "thiếp", gọi "bệ hạ".
- Biến: {names} là danh sách các phi theo lệ có mặt trong cảnh, {name} là phi đầu tiên trong số đó, {emperor} là niên hiệu. Không tự đặt tên phi, không dùng tên nhân vật cụ thể.
- Lời thoại đặt trên một dòng riêng, bắt đầu bằng "> ".
- Không viết chữ tiếng Anh trong câu kể. Không viết các chữ "chi tiết riêng".

ĐỘ DÀI (tự đếm trước khi trả lời)
- Mỗi cảnh đúng 5 đoạn, mỗi đoạn 50–70 chữ, tổng 260–320 chữ. Không đoạn nào chỉ gồm một câu thoại.
- Đoạn 1: lệ đang diễn ra thế nào trong ngày thường của hậu cung. Đoạn 2–4: bệ hạ ghé xem hoặc tham gia, tăng dần. Đoạn 5: dư âm, các nàng trở lại sinh hoạt.
- Muốn nhiều bản cho một lệ thì viết thêm danh sách thứ hai, thứ ba; mỗi bản khác nơi chốn và diễn biến.

ĐẦU RA
Chỉ trả về JSON, không giải thích, không markdown. Dấu nháy kép thẳng " cho cấu trúc JSON, nháy trong câu văn dùng “ ”.

Trả lời "Đã hiểu" nếu bạn sẵn sàng.
```

---

## Prompt B · Viết lại cảnh cho quy định đã có

Dán khối này, mỗi lần một quy định (bỏ những dòng không cần):

```
Viết 2 bản cảnh cho lệ dưới đây. Trả về đúng dạng:
{ "<hook>": { "_title": "<tên lệ>", "_chung": { "_": [ ["đoạn 1","đoạn 2","đoạn 3","đoạn 4","đoạn 5"], ["…5 đoạn…"] ] } } }
Thay <hook> bằng đúng mã hook bên dưới.

1) hook: canh-viet.quy_khong_mac_quan — "Lệ không mặc quần"
Các phi theo lệ không mặc quần lót dưới váy khi ở trong hậu cung. Bệ hạ ghé cung nào cũng được nàng vén váy cho xem.

2) hook: canh-viet.quy_ngoc_hanh — "Lệ ngọc hành"
Mỗi tuần một ngày, các phi theo lệ mang ngọc hành nhỏ bằng bạch ngọc trong người từ sáng đến tối, vẫn thỉnh an, thêu thùa như thường. Ai muốn nghỉ thì tháo ra, không ai trách. Tối đến bệ hạ tự tay lấy ra.

3) hook: canh-viet.quy_liem_buoi_sang — "Lệ hầu sáng"
Mỗi sáng trước giờ thỉnh an, các phi theo lệ thay phiên dùng miệng hầu nhau. Bệ hạ dậy sớm thì ghé xem hoặc cùng tham gia.
```

**Thêm: cảnh thị tẩm cho sở thích mới "Mang ngọc hành".** Đây là cảnh khi người chơi lật thẻ và chọn sở thích này, chỉ có một phi:

```
Viết 2 bản cảnh thị tẩm cho sở thích "Mang ngọc hành": phi đã mang ngọc hành trong người cả ngày, đêm đến bệ hạ triệu nàng và tự tay lấy ra. Đêm thị tẩm chỉ có {name} và bệ hạ, không dùng {names}.
Trả về đúng dạng:
{ "Mang ngọc hành": { "_chung": { "_": [ ["đoạn 1","đoạn 2","đoạn 3","đoạn 4","đoạn 5"], ["…5 đoạn…"] ] } } }
```

---

## Prompt C · Tạo quy định mới

```
Tạo MỘT lệ hậu cung mới theo ý tưởng: Ý TƯỞNG CỦA BẠN (ví dụ: "mỗi rằm các phi theo lệ mặc yếm đỏ đi dạo hoa viên").
Viết cả định nghĩa và 2 bản cảnh. Trả về đúng một khối JSON:
{
  "rules": [
    {
      "id": "canh-viet.quy_TEN_KHONG_DAU",
      "name": "Tên lệ (ngắn, có chữ Lệ)",
      "desc": "Một đến hai câu mô tả lệ, hiện trên bảng Cung quy.",
      "fetish": ["MÃ SỞ THÍCH"],
      "unlock": { "truyLac": { "gte": 40 } },
      "monthly": { "truyLac": 0.5, "favor": 1 },
      "chance": 0.3,
      "count": 3,
      "hook": "canh-viet.quy_TEN_KHONG_DAU",
      "eventText": "Lời dẫn khi lệ nổ ra trong tháng.\n> Một câu thoại mời bệ hạ ghé xem.",
      "eventLabel": "Chữ trên nút đi xem"
    }
  ],
  "scenes": {
    "canh-viet.quy_TEN_KHONG_DAU": { "_title": "Tên lệ", "_chung": { "_": [ ["…5 đoạn…"], ["…5 đoạn…"] ] } }
  }
}

GIẢI THÍCH CÁC TRƯỜNG
- "id" và "hook" giống nhau, bắt đầu bằng "canh-viet.quy_", viết thường không dấu, nối bằng gạch dưới.
- "fetish": chọn 1–2 mã trong danh sách bên dưới. Chỉ phi sẵn lòng với TẤT CẢ các sở thích này mới theo lệ.
- "unlock": Trụy lạc cần có để mở lệ. Nhẹ 20–35, táo bạo 40–55, trụy lạc 60–75.
- "monthly": mỗi tháng lệ còn bật thì cộng: "truyLac" (0.5–2), "favor" (Sủng ái phi theo lệ, 1–2), "affection" (Tình cảm, 1–2), "danTam" (Dân tâm, có thể âm), "hoaKhi" (Hòa khí, có thể âm).
- "chance": xác suất mỗi tháng nổ cảnh (0.2–0.4). "count": số phi theo lệ xuất hiện trong cảnh (2–4).

MÃ SỞ THÍCH DÙNG ĐƯỢC
canh-viet.always_bottomless (không mặc quần), canh-viet.ngoc_hanh (mang ngọc hành), canh-viet.lesbian_eating (các phi liếm nhau), canh-viet.men_watching_lesbian (bệ hạ xem các phi với nhau), canh-viet.women_wearing_see_through_clothing (y phục trong suốt), canh-viet.sexy_lingerie_thong_bikini (nội y gợi cảm), canh-viet.cmnf (phi khỏa thân, bệ hạ mặc đủ), canh-viet.women_taking_off_their_clothes (cởi đồ trước mặt), canh-viet.embarrassed_nude_female (khỏa thân thẹn thùng), canh-viet.shaving_pussy (cạo lông), canh-viet.massage_pussy (xoa bóp), canh-viet.titties_clit_massage (xoa ngực và hạt le), canh-viet.groping_and_sucking_titties (bóp, bú ngực), canh-viet.mutual_masturbation (cùng tự sờ), canh-viet.marking (để dấu ấn), canh-viet.praise_kink (được khen), canh-viet.outdoor_night (ngoài trời đêm), canh-viet.mirror_sex (trước gương), canh-viet.row_of_girls_dildo (xếp hàng thử ngọc hành), canh-viet.hai_nguoi (hai người cùng hầu), canh-viet.harem_phuc_vu_hang_ngay (phục vụ hằng ngày), canh-viet.hai_loc_dau_ngay (hái lộc đầu ngày), canh-viet.breast (ngực), canh-viet.sau_man (sau màn), core.ngam_nhin (ngắm nhìn), core.trang_suc (trang sức), core.y_phuc (y phục đặc biệt), core.huong_sac (hương sắc), core.duc_tri (dục trì).
Nếu không có mã nào hợp, thêm một mục "fetishes" mới trong JSON trả về (cùng khối), với "id" bắt đầu bằng "canh-viet.", "name", "desc", "tier" 1–3, "unlock" như trên, "default_consent": "persuade".

KHÔNG tạo lệ về: say rượu, thuốc, bài tiết/nhịn tiểu, khám bệnh, trừng phạt phi không theo, "dùng không cần hỏi", người ngoài nhìn thấy, gây thương tích, tuổi nhỏ.
```
