# Bộ prompt viết cảnh cho Grok

Mọi chữ của cảnh nằm trong gói **`packs/canh-viet/`**, toàn bộ là file JSON. Mỗi file ứng với một mức ưu tiên:

| Mức | File | Viết gì |
| --- | --- | --- |
| 1 | `scene-texts/1-thi-tam.json` | Thị tẩm thường, theo từng phi và 3 mức thân mật |
| 2 | `scene-texts/2-so-thich-va-combo.json` | Thị tẩm có sở thích (mỗi sở thích một bộ) và 5 combo |
| 3 | `scene-texts/3-gap-go.json` | Gặp gỡ lần đầu |
| 4 | `scene-texts/4-tap-the-va-le-tet.json` | Cảnh tập thể, lễ tết, nhập vai |
| 5 | `scene-texts/5-cot-truyen-rieng.json` | Cao trào cốt truyện riêng từng phi |
| 6 | `scene-texts/6-truy-lac-nang.json` | Trụy lạc nặng |
| 7 | `scene-texts/7-khung-nong-bong.json` | 12 nhóm khung "Sự nóng bỏng" |
| — | `scene-texts/8-canh-moi.json` | Cảnh cho HOOK mới bạn tự thêm |
| — | `fetishes.json` | Sở thích mới bạn tự thêm |

Ô nào còn `[]` (trống) thì game dùng cảnh mặc định. Viết đến đâu, game dùng đến đó.

---

## Quy trình 3 bước

**Bước 1.** Mở một cuộc trò chuyện mới với Grok, dán **Prompt mở đầu** (mục A) một lần duy nhất.

**Bước 2.** Dán prompt của từng phần (mục B trở đi), mỗi lần một prompt. Grok trả về một khối JSON.

**Bước 3.** Đưa khối JSON vào game, chọn một trong ba cách:

- **Cách 1, trên điện thoại (GitHub):** mở file tương ứng trên github.com, bấm biểu tượng bút chì, tìm đúng dòng đang trống của ô đó (ví dụ `"core.tuyet": {"dau": [], "quen": [], "lau": []},`), xóa dòng ấy rồi dán dòng Grok trả về vào chỗ đó. Giữ dấu phẩy cuối dòng nếu dòng cũ có. Bấm **Commit changes**.
- **Cách 2, trên máy tính:** chép câu trả lời của Grok vào file `grok.txt`, chạy `python3 tools/them-canh.py grok.txt`. Công cụ tự tìm đúng file, nối thêm đoạn mới (không xóa đoạn cũ) và chạy kiểm tra. Nếu Grok chỉ trả về một dòng `"core.tuyet": {...}` của mức 1 thì thêm `--hook core.thi_tam`.
- **Cách 3:** gửi câu trả lời của Grok cho Claude để đưa vào repo.

Sau đó chạy `node tools/validate.js` (hoặc nhờ Claude) để chắc JSON không lỗi.

---

## A. Prompt mở đầu (dán một lần)

```
Bạn là người viết truyện cho một game web mô phỏng hậu cung, bối cảnh Trung Hoa cổ đại hư cấu, dành cho người lớn (25+). Tôi sẽ lần lượt nhờ bạn viết từng cảnh. Hãy ghi nhớ toàn bộ thông tin dưới đây cho mọi lần trả lời sau.

BỐI CẢNH
- Người chơi là hoàng đế trẻ, các nhân vật gọi là "bệ hạ". Hậu cung có nhiều phi tần.
- Mọi nhân vật đều là người trưởng thành, từ 18 tuổi trở lên, và hoàn toàn tự nguyện. Không bao giờ nhắc đến trẻ em, tuổi dưới 18, hay bất kỳ sự ép buộc nào.
- Cảnh có trói buộc hoặc đổi vai quyền lực luôn nhắc đến "ám hiệu dừng" mà hai bên đã thỏa thuận.
- Cảnh nhiều người: mọi người đều chủ động và vui vẻ tham gia.

NHÂN VẬT CHÍNH
- core.uyen_nghi — Lục Uyển Nghi, 20 tuổi, Đức Phi, con gái Thừa tướng. Đoan trang, giữ lễ trước mặt người khác nhưng riêng tư thì hoàn toàn khác. Thích được "chinh phục".
- core.moc_can — Tô Mộc Cẩn, 19 tuổi, cung nữ hầu bệ hạ từ nhỏ, si tình, hay ngượng, khéo tay, người thơm mùi hoa nhài.
- core.tuyet — Hách Liên Tuyết, 21 tuổi, công chúa thảo nguyên gả sang hòa thân. Táo bạo, hoang dã, thẳng thắn, xưng "ta". Mê ôn tuyền.
- core.nhu_yen — Liễu Như Yên, 22 tuổi, vũ cơ đệ nhất kinh thành. Mê hoặc, tham vọng, biết múa, mê lụa.
- core.tu_lan — Mạc Tử Lan, 24 tuổi, cựu kỹ nữ Giang Nam được chuộc thân. Tinh tế, từng trải, thích nhập vai.
- core.mi_nuong — Hồ Mị Nương, 23 tuổi, chủ tiệm hương phấn. Tinh nghịch, khéo nói, mê mùi hương.
- core.thanh_ca — Thẩm Thanh Ca, 21 tuổi, cầm nữ Giang Nam. Ôn nhu, đa sầu, giọng hát ngọt.
- core.song_nguyet — Song Nguyệt, 20 tuổi, chị song sinh, trầm, mơ mộng.
- core.song_nhat — Song Nhật, 20 tuổi, em song sinh, nghịch ngợm, táo bạo.
- core.hong_tieu — Tạ Hồng Tiêu, 21 tuổi, Quý Phi, sủng phi định mệnh, mê ôn tuyền và trang sức.

CÁCH VIẾT
- Tiếng Việt, văn phong cổ trang. Mỗi đoạn 150 đến 250 chữ, tối thiểu 150 chữ. Không tóm tắt, không viết câu cụt; tả cảm giác, cử chỉ, lời thoại đầy đủ.
- Lời thoại của nhân vật đặt trên một dòng riêng, bắt đầu bằng dấu > và một khoảng trắng.
- Biến game tự thay: {name} (người chính), {names} (danh sách mọi người tham gia), {emperor} (niên hiệu), {fetish} (tên sở thích), {rank} (phẩm của người chính, ví dụ Quý phi). Riêng cảnh cuộc thi có thêm {winner} (người thắng) và {contest} (tên cuộc thi). Không dùng biến nào khác.

CÁCH TRẢ LỜI
- Chỉ trả về JSON đúng mẫu tôi đưa, không lời chào, không giải thích.
- Trong chuỗi JSON: xuống dòng viết là \n, dấu nháy kép bên trong viết là \".
- Mỗi danh sách [...] là MỘT CẢNH hoàn chỉnh: các đoạn nối tiếp nhau theo thời gian (đoạn đầu mở cảnh, các đoạn giữa diễn biến, đoạn cuối là dư âm sau đó). Người chơi đọc từng đoạn theo thứ tự, nên đoạn sau phải nối được với đoạn trước.
- Có đúng số đoạn tôi yêu cầu. Nếu phải viết nhiều ô một lần mà không đủ dài, hãy viết ít ô hơn, đừng rút ngắn.

Trả lời "Đã hiểu" nếu bạn sẵn sàng.
```

---

## Mẹo để Grok viết đủ dài

- Mỗi lần chỉ xin **1 ô** (một nhân vật một mức, hoặc một sở thích). Xin nhiều ô một lúc Grok sẽ tự rút ngắn.
- Nếu đoạn trả về quá ngắn, nhắn thêm: `Viết lại, mỗi đoạn tối thiểu 150 chữ, đừng tóm tắt.`
- Muốn có **nhiều phiên bản** cho cùng một ô (để mỗi đêm khác nhau): cứ xin thêm lần nữa và đưa vào bằng `them-canh.py`. Mỗi lần thêm được tính là một cảnh mới, game bốc lần lượt, không lặp lại cho đến khi xem hết.

---

## B. Mức 1 · Thị tẩm thường → `1-thi-tam.json`

Cảnh xuất hiện nhiều nhất (khoảng 42%). Mỗi phi cần 3 mức: `dau` (đêm đầu), `quen` (đã vài lần), `lau` (hơn 20 đêm, rất thân).

**Prompt (đổi phần in hoa cho từng phi):**

```
Cảnh: thị tẩm. Bệ hạ lật thẻ bài, triệu MỘT PHI TẦN thị tẩm một mình ở Dưỡng Tâm điện hoặc ở cung của nàng.
Nhân vật: core.TUYET (xem phần nhân vật chính).
Mỗi mức viết một cảnh gồm 3 đoạn nối tiếp:
- dau: đêm đầu tiên của hai người
- quen: đã gần gũi vài lần
- lau: đã gắn bó rất lâu, hơn hai mươi đêm
Trả về đúng một dòng theo mẫu:
"core.TUYET": {"dau": ["...", "...", "..."], "quen": ["...", "...", "..."], "lau": ["...", "...", "..."]}
```

Làm lần lượt cho 10 phi: `core.uyen_nghi`, `core.moc_can`, `core.tuyet`, `core.nhu_yen`, `core.tu_lan`, `core.mi_nuong`, `core.thanh_ca`, `core.song_nguyet`, `core.song_nhat`, `core.hong_tieu`.

**Bản chung cho tú nữ ngẫu nhiên:**

```
Cảnh: thị tẩm với một phi tần bất kỳ trong hậu cung (không phải nhân vật chính). Không biết tính cách nàng, hãy viết trung tính. Dùng {name} ở mọi chỗ cần tên nàng.
Mỗi mức dau, quen, lau viết một cảnh gồm 4 đoạn nối tiếp.
Trả về đúng một dòng:
"_chung": {"dau": [...], "quen": [...], "lau": [...]}
```

---

## C. Mức 2 · Thị tẩm có sở thích và combo → `2-so-thich-va-combo.json`

Khi lật thẻ, người chơi chọn thêm sở thích. Mỗi sở thích một bộ, dùng chung cho mọi phi (tên phi là `{name}`).

**Prompt (đổi phần in hoa):**

```
Cảnh: thị tẩm theo sở thích. Bệ hạ triệu {name} thị tẩm, đêm nay theo sở thích "TÊN SỞ THÍCH" (MÔ TẢ). Nàng đã đồng ý với sở thích này.
Đây là sở thích tầng SỐ TẦNG (1 nhẹ nhàng, 2 táo bạo hơn, 3 mạnh nhất).
Dùng {name} cho tên nàng, có thể dùng {fetish} cho tên sở thích.
Viết một cảnh gồm 4 đoạn nối tiếp, mỗi đoạn tối thiểu 150 chữ.
Trả về đúng một dòng:
"ID SỞ THÍCH": {"_": ["...", "...", "...", "..."]}
```

| Tầng | ID | Tên | Mô tả |
| --- | --- | --- | --- |
| 1 | `core.lua_la` | Lụa là | Mê y phục, lụa mỏng, dải lụa |
| 1 | `core.huong_sac` | Hương sắc | Nghiện mùi hương riêng của từng người |
| 1 | `core.duc_tri` | Dục trì | Tắm chung, suối nước nóng, hồ hoa |
| 1 | `core.ngam_nhin` | Ngắm nhìn | Xem mỹ nhân múa, tắm, đùa giỡn |
| 1 | `core.trang_suc` | Trang sức | Mỹ nhân đeo đầy châu ngọc |
| 2 | `core.nhap_vai` | Nhập vai | Đóng vai thích khách, thôn nữ, nữ tướng |
| 2 | `core.y_phuc` | Y phục đặc biệt | Quan phục, giáp trụ, áo thôn nữ, áo đạo cô |
| 2 | `core.bit_mat` | Bịt mắt và bóng tối | Tắt đèn, bịt mắt, chỉ còn cảm giác |
| 2 | `core.yen_tiec` | Yến tiệc trên người | Rượu, trái cây, mật ong |
| 2 | `core.thi_tham` | Thì thầm | Giọng nói, lời thì thầm bên tai |
| 2 | `core.chinh_phuc` | Chinh phục | Người kiêu ngạo, khó chiều |
| 2 | `core.ganh_dua` | Ganh đua | Nhìn các phi tranh nhau vì mình |
| 2 | `core.ban_thuong` | Ban thưởng | Trao giải, phạt người thua theo thỏa thuận |
| 3 | `core.chu_to` | Chủ và tớ | Đổi vai quyền lực, có ám hiệu dừng |
| 3 | `core.troi_lua` | Trói bằng lụa | Dải lụa đỏ, có ám hiệu dừng |
| 3 | `core.nong_lanh` | Nóng lạnh | Nước ôn tuyền, đá lạnh, ánh nến |
| 3 | `core.trinh_dien` | Trình diễn | Có khán giả là các phi tần tự nguyện |
| 3 | `core.khan_dai` | Khán đài | Cả hậu cung làm khán giả |

Các sở thích của khung "Sự nóng bỏng" (`khung-nong-bong.*`) cũng có dòng riêng trong file này; viết theo cùng prompt, lấy tên và mô tả trong `packs/khung-nong-bong/fetishes.json`.

**Combo** (người chơi chọn đúng hai sở thích cùng lúc). Mỗi combo một khối riêng trong file:

```
Cảnh combo "TÊN COMBO": SỞ THÍCH A + SỞ THÍCH B. Nhân vật là {name}, đã đồng ý.
Viết một cảnh gồm 4 đoạn nối tiếp, mỗi đoạn tối thiểu 150 chữ.
Trả về:
{ "ID COMBO": { "_chung": { "_": ["...", "...", "...", "..."] } } }
```

| ID combo | Tên | Gồm |
| --- | --- | --- |
| `core.combo_ho_ruou` | Đêm Hồ Rượu | Dục trì + Yến tiệc trên người |
| `core.combo_kich` | Kịch Vương Triều | Nhập vai + Y phục đặc biệt |
| `core.combo_huong_toi` | Hương Trong Bóng Tối | Thì thầm + Bịt mắt |
| `core.combo_lua_do` | Lụa Đỏ Quyền Uy | Chủ và tớ + Trói bằng lụa (có ám hiệu dừng) |
| `core.combo_tram_mau` | Hội Trăm Màu | Trình diễn + Trang sức |

**Viết cả 5 combo trong một lần** (dán nguyên khối, Grok trả về một JSON dùng được ngay với `them-canh.py`):

```
Viết cảnh cho 5 combo dưới đây. Mỗi combo 4 đoạn, mỗi đoạn 80–150 chữ, có ít nhất một câu thoại bắt đầu bằng "> ". Dùng {name} cho phi tần. Mọi người đều trưởng thành, tỉnh táo, tự nguyện; combo có trói phải nhắc ám hiệu dừng.
Đoạn 1 mở đầu và dựng không khí, đoạn 2–3 cao trào theo đúng hai sở thích của combo, đoạn 4 dư âm sau đó.

1. core.combo_ho_ruou — "Đêm Hồ Rượu" (Dục trì + Yến tiệc trên người): bể tắm nước nóng lát ngọc, rượu ấm và trái cây bày trên người {name}, bệ hạ thưởng thức từ trên da nàng. Chỉ nhấp rượu cho vui, không ai say.
2. core.combo_kich — "Kịch Vương Triều" (Nhập vai + Y phục đặc biệt): {name} tự chọn vở và trang phục (nữ hiệp, tiên nữ, tiểu thư khuê các…), bày sân khấu nhỏ trong tẩm cung; nàng là người dẫn dắt vở diễn.
3. core.combo_huong_toi — "Hương Trong Bóng Tối" (Thì thầm + Bịt mắt): {name} bịt mắt bằng lụa đen, mọi thứ chỉ còn tiếng thì thầm sát tai và hơi thở; ám hiệu là siết tay ba lần.
4. core.combo_lua_do — "Lụa Đỏ Quyền Uy" (Chủ và tớ + Trói bằng lụa): dải lụa đỏ, vai chủ và tớ do {name} đề nghị, hai bên nhắc ám hiệu "hoa mai" trước khi bắt đầu.
5. core.combo_tram_mau — "Hội Trăm Màu" (Trình diễn + Trang sức): {name} đeo toàn bộ trang sức được ban, trình diễn trước các phi khác cùng tự nguyện xem; mỗi món trang sức gỡ ra là một màn mới.

Chỉ trả về JSON, đúng dạng:
{
  "core.combo_ho_ruou": { "_chung": { "_": ["...", "...", "...", "..."] } },
  "core.combo_kich": { "_chung": { "_": ["...", "...", "...", "..."] } },
  "core.combo_huong_toi": { "_chung": { "_": ["...", "...", "...", "..."] } },
  "core.combo_lua_do": { "_chung": { "_": ["...", "...", "...", "..."] } },
  "core.combo_tram_mau": { "_chung": { "_": ["...", "...", "...", "..."] } }
}
```

Lưu câu trả lời vào `grok.txt` rồi chạy `python tools/them-canh.py grok.txt`: 5 combo tự vào đúng ô trong `2-so-thich-va-combo.json`. Sửa tay thì dán từng mảng `[...]` vào chỗ `"_chung": {"_": []}` của combo tương ứng.

---

## D. Mức 3 đến 7 · Một prompt chung

Từ mức 3 trở đi, mỗi cảnh là một khối riêng. Dùng chung một prompt, chỉ thay ID và tình huống theo các bảng bên dưới.

```
Cảnh: ID CẢNH.
Tình huống: TÌNH HUỐNG.
Số người tham gia: SỐ NGƯỜI. Dùng {name} cho người chính, {names} cho danh sách mọi người.
Viết một cảnh gồm 4 đoạn nối tiếp, mỗi đoạn tối thiểu 150 chữ.
Trả về:
{ "ID CẢNH": { "_chung": { "_": ["...", "...", "...", "..."] } } }
```

Với cách 1 (GitHub), trong file chỉ cần thay dòng `"_chung": {"_": []}` nằm dưới đúng ID cảnh bằng phần `"_chung": {...}` Grok trả về.

### Mức 3 · Gặp gỡ lần đầu → `3-gap-go.json`

| ID cảnh | Tình huống | Số người |
| --- | --- | --- |
| `core.da_yen_thi_tam` | Đêm yến tiệc đăng cơ, vũ cơ Liễu Như Yên dâng rượu rồi theo bệ hạ về điện | 1 |
| `core.tiem_huong` | Bệ hạ cải trang tìm đến tiệm hương của Hồ Mị Nương, nàng cho bệ hạ ngửi từng lọ hương | 1 |
| `core.den_long_dem` | Đêm hội đèn lồng, cô gái đeo mặt nạ hồ ly (Hồ Mị Nương) kéo bệ hạ vào hẻm sau tiệm hương | 1 |
| `core.tu_lan_dem_dau` | Trên thuyền hoa Tần Hoài, Mạc Tử Lan ngừng đàn, mời "công tử lạ mặt" nghe đoạn cuối câu chuyện | 1 |
| `core.song_phi` | Đêm đầu của hai chị em song sinh Song Nguyệt và Song Nhật, cả hai cùng đợi bệ hạ | 2 |
| `core.uyen_nghi_sa_nga` | Lục Uyển Nghi, vốn đoan trang, lần đầu tháo mũ phượng, chọn sa ngã cùng bệ hạ | 1 |

### Mức 4 · Tập thể, lễ tết, nhập vai → `4-tap-the-va-le-tet.json`

| ID cảnh | Tình huống | Số người |
| --- | --- | --- |
| `core.dai_dien` | Phong Nguyệt Đại Điển cuối năm, ba phi đứng đầu mùa thi hậu cung, ba đêm ba vòng | 3 |
| `core.xe_de` | Xe dê dừng trước cửa cung của {name}, nàng giả vờ không biết chuyện rắc muối dụ dê | 1 |
| `core.bit_mat_o_lai` | Chơi bịt mắt bắt dê, người bị bắt là {name}, theo luật nàng ở lại | 1 |
| `core.bit_mat_hai` | Chơi bịt mắt, bệ hạ bắt được cùng lúc hai người | 2 |
| `core.bach_hoa` | Đêm Bách Hoa, mỗi người một màu lụa, cùng ở bên bệ hạ | 3 hoặc 6 |
| `core.that_tich` | Đêm Thất tịch, bệ hạ chọn chiếc đèn có bài thơ của {name} | 1 |
| `core.tet` | Đêm giao thừa, bệ hạ đón năm mới cùng {name} | 1 |
| `core.trung_thu` | Đêm Trung Thu, bệ hạ thả đèn hoa đăng cùng {name} | 1 |
| `core.nhap_vai_thich_khach` | {name} đóng vai nữ thích khách bị bệ hạ bắt được | 1 |
| `core.nhap_vai_thon_nu` | {name} đóng vai thôn nữ hái dâu gặp vị quan tuần du | 1 |
| `core.nhap_vai_nu_tuong` | {name} đóng vai nữ tướng bại trận | 1 |
| `core.nhap_vai_dao_vai` | {name} đóng vai chủ nhân, bệ hạ làm nô bộc, có ám hiệu dừng | 1 |

### Mức 5 · Cao trào cốt truyện riêng → `5-cot-truyen-rieng.json`

| ID cảnh | Tình huống | Số người |
| --- | --- | --- |
| `core.tuyet_lua_trai` | Sau đêm lửa trại thảo nguyên giữa hoàng cung, Hách Liên Tuyết kéo bệ hạ về lều | 1 |
| `core.nhu_yen_vu_rieng` | Liễu Như Yên múa điệu múa chỉ dành cho bệ hạ, dưới một ngọn đèn | 1 |
| `core.mi_nuong_huong_moi` | Hồ Mị Nương thử mùi hương Mộng Hồ vừa chế lại được, mọi thứ mờ như trong mơ | 1 |
| `core.hong_tieu_ho` | Tạ Hồng Tiêu kéo bệ hạ xuống hồ ôn tuyền Hoa Thanh Trì | 1 |
| `core.song_phi_rieng` | Lần đầu Song Nhật ở riêng với bệ hạ, không có chị | 1 |
| `core.lua_do_a` | Bệ hạ cầm dải lụa đỏ, {name} nhắc ám hiệu dừng trước | 1 |
| `core.lua_do_b` | {name} cầm dải lụa đỏ, đêm nay nàng làm chủ, có ám hiệu dừng | 1 |
| `core.moc_can_tuong_thanh` | Tô Mộc Cẩn và bệ hạ thả lại chiếc diều năm tám tuổi trên tường thành, rồi về cung nàng | 1 |
| `core.uyen_nghi_ngay_tu_do` | Lục Uyển Nghi và bệ hạ cải trang ra phố một ngày, tối về kiệu | 1 |

### Mức 6 · Trụy lạc nặng → `6-truy-lac-nang.json`

| ID cảnh | Tình huống | Số người |
| --- | --- | --- |
| `core.cuu_phi_mot_dem` | Chín phi tần, chín màu lụa, cùng một đêm | 9 |
| `core.cuu_phi_chin_dem` | Chín đêm liên tiếp, mỗi đêm một phi, một màu lụa | 9 (lần lượt) |
| `core.ngu_hoa` | Năm phi được phong Ngũ Hoa, chỉ thị tẩm cùng nhau | 5 |
| `core.tuu_tri_hoi` | Hồ rượu giữa cung, ba ngày ba đêm | 4 đến 8 |
| `core.duc_tri_tap_the` | Cửa hồ ôn tuyền mở cho nhiều phi cùng lúc | 3 đến 5 |
| `core.thuyen_hoa_ba_ngay` | Thuyền rồng ba ngày không cập bến | 4 |
| `core.dem_ty_muoi` | Các cặp đối thực tự tổ chức, bệ hạ là khách duy nhất | 4 đến 6 |
| `core.doi_thuc_tam_nguoi` | Một cặp đối thực được bệ hạ cho phép cùng hầu | 2 |
| `core.me_lau` | Lạc trong Mê Lâu nghìn phòng, rèm lụa phủ kín | 3 |

### Mức 7 · Khung "Sự nóng bỏng" → `7-khung-nong-bong.json`

Tình huống của từng nhóm nằm ở trường `desc` trong `packs/khung-nong-bong/fetishes.json`. Viết như các cảnh khác, với tình huống là tên và mô tả của nhóm.

| ID cảnh | Nhóm | Số người |
| --- | --- | --- |
| `khung-nong-bong.phuc_dich` | Phục dịch thường nhật | 1 |
| `khung-nong-bong.tu_do` | Thánh chỉ Tự Do | 1 |
| `khung-nong-bong.kiem_che` | Kiềm chế và cao trào | 3 |
| `khung-nong-bong.long_chung` | Long chủng | 1 |
| `khung-nong-bong.xoa_bop` | Chăm sóc thân thể | 1 |
| `khung-nong-bong.nghi_thuc` | Nghi thức trước thị tẩm | 1 |
| `khung-nong-bong.y_phuc_goi` | Y phục khêu gợi | 1 |
| `khung-nong-bong.doi_thuc_nong` | Đối thực nóng bỏng | 2 |
| `khung-nong-bong.gameshow` | Gameshow hậu cung | 3 |
| `khung-nong-bong.troi_buoc` | Trói buộc (có ám hiệu dừng) | 1 |
| `khung-nong-bong.khan_gia` | Khán giả hậu cung | 3 |
| `khung-nong-bong.tan_phi` | Khởi động tân phi | 2 |

Các phi mặc định ở mức "Cần thuyết phục" với nhóm này, nên cảnh ít xuất hiện. Muốn gặp nhiều hơn, xem mục E để khai báo mức "Sẵn lòng" cho từng phi.

---

## E. Tự tạo sở thích mới (ngoài khung có sẵn) → `fetishes.json`

Một sở thích mới gồm hai phần: **định nghĩa** (đặt trong `fetishes.json`) và **cảnh** (một dòng trong `2-so-thich-va-combo.json`). Sở thích sẽ tự hiện trong màn Lật thẻ khi đủ điều kiện mở khóa và phi tần sẵn lòng.

**Prompt:**

```
Tôi muốn thêm một sở thích mới vào game: "TÊN SỞ THÍCH" — MÔ TẢ NGẮN.
Tầng: SỐ (1 nhẹ nhàng, 2 táo bạo hơn, 3 mạnh nhất).
Viết một cảnh thị tẩm theo sở thích này, gồm 4 đoạn nối tiếp, dùng {name} cho tên phi tần, {fetish} cho tên sở thích.
Trả về đúng JSON sau, chỉ đổi phần chữ hoa và thêm 4 đoạn:
{
  "fetishes": [
    {
      "id": "canh-viet.TEN_KHONG_DAU",
      "name": "TÊN SỞ THÍCH",
      "tier": SỐ,
      "unlock": { "truyLac": { "gte": 30 } },
      "default_consent": "persuade",
      "desc": "MÔ TẢ NGẮN",
      "consent": { "core.tuyet": "willing", "core.nhu_yen": "willing" },
      "consentByTrait": { "Táo bạo": "willing", "Hay ngượng": "refuse" }
    }
  ],
  "scenes": {
    "core.thi_tam_so_thich": {
      "canh-viet.TEN_KHONG_DAU": { "_": ["...", "...", "...", "..."] }
    }
  }
}
```

Ý nghĩa các trường:

| Trường | Ý nghĩa |
| --- | --- |
| `id` | Luôn bắt đầu bằng `canh-viet.`, sau đó là chữ thường không dấu, nối bằng gạch dưới |
| `tier` | 1, 2 hoặc 3 |
| `unlock` | Khi nào mở. `{ "truyLac": { "gte": 30 } }` là khi Trụy lạc từ 30. Muốn mở sau một sở thích khác: `{ "fetishLevel": { "core.lua_la": { "gte": 50 } } }` |
| `default_consent` | Mức mặc định của mọi phi: `willing` (Sẵn lòng), `persuade` (Cần thuyết phục, người chơi bấm Thuyết phục được), `refuse` (Từ chối) |
| `consent` | Mức riêng cho từng phi chính, theo id nhân vật |
| `consentByTrait` | Mức theo tính cách, áp dụng cho tú nữ ngẫu nhiên (ví dụ `Táo bạo`, `Hay ngượng`, `Ôn nhu`, `Kiêu kỳ`…) |
| `combos` (tùy chọn) | `[{ "with": "core.lua_la", "hook": "canh-viet.combo_ten", "name": "Tên combo" }]`; viết thêm cảnh cho `canh-viet.combo_ten` vào `8-canh-moi.json` |

**Đưa vào game:**
- Cách 2 (máy tính): `python3 tools/them-canh.py grok.txt` tự chia phần định nghĩa vào `fetishes.json` và phần cảnh vào đúng file.
- Cách 1 (GitHub): dán khối `{ "id": ... }` vào giữa hai dấu `[` `]` của `fetishes.json` (nếu đã có sở thích khác thì thêm dấu phẩy ngăn cách), rồi dán dòng `"canh-viet....": {"_": [...]}` vào khối `"core.thi_tam_so_thich"` trong `2-so-thich-va-combo.json`.

**Đổi mức sẵn lòng cho sở thích có sẵn:** thêm vào `fetishes.json` của gói này không được (id phải mới). Thay vào đó sửa trường `consent` của nhân vật trong `packs/core/characters.json`, hoặc nhờ Claude.

---

## F. Kiểm tra trong game

1. `node tools/validate.js` phải báo **0 lỗi**. Lỗi thường gặp: thiếu dấu phẩy giữa hai dòng, thừa dấu phẩy ở dòng cuối khối, dấu nháy kép trong lời thoại chưa viết thành `\"`.
2. Mở game, bật **Thiên Đạo** ở màn đầu:
   - tick **Mở mọi sở thích**;
   - trong chi tiết phi tần, chỉnh mức sẵn lòng thành **Sẵn lòng** cho sở thích cần thử;
   - kéo Sủng ái lên để thử mức `lau` (cần hơn 20 đêm, có thể dùng **Lật thẻ** liên tục);
   - tab Thiên Đạo → **Gọi sự kiện** để gọi thẳng cảnh tập thể.
3. Menu ☰ → mục Gói nội dung hiện tổng số đoạn đã viết.

---

## G. Mẹo khi làm việc với Grok

- Nếu Grok trả lời kèm chữ giải thích, nhắc: "Chỉ trả về JSON, không giải thích."
- Muốn thêm biến thể cho ô đã có chữ: dùng cách 2 hoặc 3, đoạn mới được nối thêm, không ghi đè.
- Mỗi lần chỉ nhờ một ô để câu trả lời ngắn, ít lỗi.
- Giữ văn phong thống nhất: thỉnh thoảng dán lại một đoạn bạn thích nhất và bảo "viết tiếp theo giọng này".
