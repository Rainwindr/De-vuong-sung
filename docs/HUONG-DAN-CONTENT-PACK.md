# Hướng dẫn làm Content Pack

Tài liệu dành cho người viết sự kiện và cho studio bên thứ ba muốn thêm nhân vật, sở thích, sự kiện, cuộc thi, quà, công trình, vùng tuần du và cảnh vào **Tửu Sắc Đế Vương** mà không sửa code lõi.

Một gói là một thư mục trong `packs/`, gồm vài file JSON và một hoặc nhiều file `scenes.js`. Lõi lo chỉ số, điều kiện, lựa chọn và gọi HOOK. Gói lo nội dung.

---

## 1. Bắt đầu trong 5 phút

1. Copy `packs/_template` thành `packs/ten-goi-cua-ban` (chỉ chữ thường, số, dấu gạch ngang).
2. Trong `manifest.json`, đổi `"id"` thành đúng tên thư mục, đổi `"name"`, `"author"`.
3. Tìm và thay mọi chữ `ten-goi-cua-ban` trong các file của gói thành id mới.
4. Thêm tên thư mục vào `packs/index.json`, sau các gói nó phụ thuộc:
   ```json
   { "packs": ["core", "khung-nong-bong", "vi-du-den-long", "ten-goi-cua-ban"] }
   ```
5. Chạy `node tools/validate.js` để kiểm tra.
6. Chạy game qua máy chủ web (xem `README.md`), bật **Thiên Đạo** ở màn mở đầu, vào tab **Gói** xem lỗi, vào tab **Thiên Đạo** gọi thẳng sự kiện của gói để thử.

Tham khảo song song:
- `packs/vi-du-den-long`: gói nhỏ hoàn chỉnh (1 nhân vật, 1 sở thích, 2 sự kiện, cảnh).
- `packs/khung-nong-bong`: khung 12 nhóm sở thích có sẵn sự kiện và HOOK, cảnh mặc định chỉ chuyển cảnh. Bên thứ ba thay cảnh bằng cách đăng ký lại HOOK.
- `packs/core`: gói lõi, đọc để biết mọi loại sự kiện được viết thế nào.

---

## 2. Cấu trúc thư mục

```
packs/ten-goi-cua-ban/
  manifest.json       bắt buộc
  characters.json     nhân vật
  fetishes.json       sở thích
  events/             sự kiện, chia nhiều file tùy ý
    gap-go.json
    hang-ngay.json
  contests.json       cuộc thi hậu cung
  gifts.json          quà tặng
  buildings.json      công trình
  regions.json        vùng tuần du
  names.json          tên tú nữ, con cái, phu quân/phu nhân
  scenes.js           cảnh cho các HOOK
  assets/             ảnh
```

Chỉ `manifest.json` là bắt buộc.

---

## 3. manifest.json

```json
{
  "id": "ten-goi-cua-ban",
  "name": "Tên hiển thị",
  "version": "0.1.0",
  "author": "Studio X",
  "game_version": ">=0.2",
  "rating": "25+",
  "requires": ["core"],
  "files": {
    "characters": "characters.json",
    "fetishes": "fetishes.json",
    "events": ["events/gap-go.json", "events/hang-ngay.json"],
    "contests": "contests.json",
    "gifts": "gifts.json",
    "buildings": "buildings.json",
    "regions": "regions.json",
    "names": "names.json",
    "scenes": "scenes.js"
  }
}
```

Mỗi mục trong `files` là một file hoặc một danh sách file; các file cùng loại được gộp lại. Mỗi file JSON (trừ `names.json`) là một **mảng**.

---

## 4. Quy tắc id

Mọi id bắt đầu bằng `id-gói.` và không trùng nhau trong gói, kể cả giữa các loại (đừng đặt sở thích và công trình cùng một id):

```
ten-goi-cua-ban.dao_hoa          nhân vật
ten-goi-cua-ban.ngam_den         sở thích
ten-goi-cua-ban.gap_go           sự kiện
ten-goi-cua-ban.dem_den          HOOK
```

Được tham chiếu id của gói khác (ví dụ `core.lua_la`, `core.uyen_nghi`) miễn gói đó nằm trong `requires`.

---

## 5. Nhân vật (characters.json)

```json
{
  "id": "ten-goi-cua-ban.dao_hoa",
  "name": "Đào Hoa Nương",
  "age": 22,
  "origin": "Thợ làm đèn bên hồ Thái Dịch",
  "start": false,
  "rank": 1,
  "title": null,
  "favor": 25,
  "affection": 15,
  "traits": ["Khéo tay", "Lãng mạn", "Tinh nghịch"],
  "likes": ["ten-goi-cua-ban.ngam_den"],
  "affinity": { "core.moc_can": 1 },
  "consent": { "ten-goi-cua-ban.ngam_den": "willing", "core.lua_la": "persuade", "core.chinh_phuc": "refuse" },
  "portrait": { "glyph": "桃", "hue": 340, "image": "assets/dao_hoa.webp" },
  "lines": { "low": "Câu khi Sủng ái thấp.", "high": "Câu khi Sủng ái cao." }
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `age` | **Bắt buộc, từ 18 trở lên.** Thiếu hoặc dưới 18 thì lõi từ chối nhân vật. |
| `start` | `true`: có sẵn trong hậu cung khi bắt đầu đời thứ nhất. Mặc định nhân vật chỉ xuất hiện qua sự kiện. |
| `rank` | 0 Đáp ứng → 6 Hoàng quý phi. Hoàng hậu (7) chỉ do người chơi lập. |
| `title` | Phong hiệu cho phẩm Phi trở lên, ví dụ `"Thục"` → "Thục Phi". Bỏ trống thì người chơi tự đặt. |
| `favor`, `affection` | Sủng ái, Tình cảm khởi đầu (0–100). |
| `traits` | Đặc điểm. Ảnh hưởng con cái thừa hưởng, quà hợp gu, cuộc thi, sự kiện có `speakerTrait`. |
| `likes` | Sở thích hợp gu: thị tẩm đúng gu được thêm Sủng ái; quà có sở thích này được nhân đôi. |
| `affinity` | Mức hợp tính với phi khác (1–3). Tình Ý của cặp tăng mỗi tháng theo mức này (hệ thống đối thực). |
| `consent` | Mức đồng thuận theo từng sở thích: `willing` (Sẵn lòng), `persuade` (Cần thuyết phục), `refuse` (Từ chối). Không ghi thì dùng `default_consent` của sở thích. |
| `portrait` | `glyph` (một ký tự), `hue` (0–359), `image` (đường dẫn trong gói, webp vuông 512×512). |

**Thuyết phục:** người chơi có nút "Thuyết phục" với các mục `persuade`. Thành công khi Sủng ái và Tình cảm đều từ `50 + tầng × 10` trở lên; mục chuyển sang `willing`. Mục `refuse` không bao giờ đổi qua cơ chế này hay qua sự kiện.

---

## 6. Sở thích (fetishes.json)

```json
{
  "id": "ten-goi-cua-ban.ngam_den",
  "name": "Dưới ánh đèn hoa",
  "tier": 1,
  "unlock": { "truyLac": { "gte": 10 } },
  "default_consent": "persuade",
  "desc": "Một dòng mô tả.",
  "combos": [{ "with": "core.ngam_nhin", "hook": "ten-goi-cua-ban.combo_den", "name": "Đèn Hoa Muôn Sắc" }]
}
```

- `tier` 1–3. Truyền vào HOOK qua `ctx.tier`.
- `unlock`: điều kiện mở khóa, cùng cú pháp mục 7.2. Làm cây sở thích bằng `fetishLevel` hoặc `fetishUnlocked`, ví dụ `{ "fetishLevel": { "core.lua_la": { "gte": 50 } } }`.
- `consent`: `{ "core.tuyet": "willing" }` khai mức riêng cho nhân vật của gói khác (dùng khi nhân vật đó không tự ghi mức cho sở thích này).
- `consentByTrait`: `{ "Táo bạo": "willing", "Hay ngượng": "refuse" }` khai mức theo trait, áp dụng cả cho tú nữ ngẫu nhiên.
- `combos`: khi người chơi chọn cả hai sở thích trong một đêm Lật thẻ, lõi gọi `hook` của combo thay cho cảnh thường và `ctx.combo` là `name`.
- Độ nghiện tăng mỗi lần dùng. Nghiện từ 80 mà một năm không dùng thì Long thể giảm. Lặp lại đúng một bộ sở thích quá 5 lần liền thì nhạt dần.

---

## 7. Sự kiện (events/*.json)

```json
{
  "id": "ten-goi-cua-ban.dem_den",
  "title": "Chiếc đèn chỉ thắp một lần",
  "speaker": "ten-goi-cua-ban.dao_hoa",
  "cooldown": 6,
  "weight": 4,
  "when": { "speakerInHarem": true, "favor": { "gte": 40 } },
  "text": "{name} treo kín cung bằng đèn.\n> Đêm nay chỉ có ánh đèn thôi, bệ hạ chịu không?",
  "choices": [
    { "label": "Chịu", "fetish": ["ten-goi-cua-ban.ngam_den"], "effects": { "favor": 10, "truyLac": 5 }, "hook": "ten-goi-cua-ban.dem_den" },
    { "label": "Để hôm khác", "effects": { "favor": -2 }, "result": "Đèn vẫn sáng đến sáng." }
  ]
}
```

### 7.1 Trường của sự kiện

| Trường | Ý nghĩa |
| --- | --- |
| `speaker` | Người nói. Một id nhân vật; `"random"` (một phi ngẫu nhiên thỏa điều kiện); `"child"` (một hoàng tử/công chúa); `"pair"` (một cặp phi có Tình Ý); bỏ trống nếu không có người nói. |
| `once` | Chỉ một lần mỗi đời. |
| `perChild` / `perConsort` | Mỗi đứa con / mỗi phi chỉ gặp sự kiện này một lần (dùng với `"child"` / `"random"`). |
| `cooldown` | Số tháng tối thiểu giữa hai lần. |
| `weight` | Trọng số khi bốc ngẫu nhiên. Mỗi tháng có 80% cơ hội bốc một sự kiện trong số đủ điều kiện. |
| `manual` | `true`: không bao giờ tự xảy ra, chỉ gọi được bằng Thiên Đạo. Dùng khi đang viết dở. |
| `when` | Điều kiện (7.2). |
| `text`, `title` | Chữ hiển thị. Dòng bắt đầu bằng `> ` là lời thoại. |

**Biến trong chữ:** `{name}` người nói, `{name2}` người thứ hai của cặp, `{emperor}` niên hiệu, `{rank}` phẩm, `{title}` phẩm kèm phong hiệu, `{mother}` mẹ của đứa trẻ, `{child}` "hoàng tử"/"công chúa", `{trait}` đặc điểm.

### 7.2 Điều kiện (`when`, `requires`, `unlock`)

So sánh số: `{ "gte": 10 }`, `{ "lte": 50 }`, `{ "gt": … }`, `{ "lt": … }`, `{ "in": [1, 2, 3] }` hoặc một giá trị cụ thể.

| Khóa | Kiểm tra |
| --- | --- |
| `age`, `month`, `yearEvery` | Tuổi hoàng đế, tháng (1–12), chỉ những năm chia hết |
| `truyLac`, `longThe`, `quocKho`, `danTam`, `hoaKhi` | Chỉ số |
| `harem`, `children`, `grandchildren` | Số phi tần, số con, số cháu |
| `generation`, `scenario`, `godMode` | Đời thứ mấy, kịch bản (`tu_do`, `xe_de`, `me_lau`, `hoa_thanh`), có bật Thiên Đạo |
| `flag`, `notFlag` | Cờ (một tên hoặc danh sách, tất cả phải thỏa) |
| `building`, `notBuilding` | Công trình đã xây / chưa xây |
| `hasConsort`, `notConsort` | Nhân vật (một id hoặc danh sách) đang / không ở trong hậu cung |
| `hasEmpress` | Đã có Hoàng hậu chưa |
| `fetishLevel`, `fetishUnlocked` | Độ nghiện của hoàng đế; sở thích đã mở |
| `attitude` | Thái độ với đối thực: 0 Cấm, 1 Làm ngơ, 2 Dung túng, 3 Khuyến khích |
| `pairsAt` | `{ "tinhY": 61, "count": { "gte": 2 } }`: số cặp đạt Tình Ý |
| `successor` | Đã chọn người kế vị chưa |
| **Theo người nói** | |
| `speakerInHarem` | Người nói đã nhập cung chưa |
| `favor`, `affection` | Sủng ái, Tình cảm của người nói |
| `speakerAge`, `speakerRank`, `speakerTrait`, `speakerPregnant` | Tuổi, phẩm, có trait, đang mang thai |
| `speakerTopRank` | `true`: người nói có phẩm cao nhất hậu cung (từ Phi trở lên, không ai cao hơn; có Hoàng hậu thì chỉ Hoàng hậu). Dùng `{rank}` trong chữ để gọi đúng phẩm. |
| `speakerWilling` | Người nói đang **sẵn lòng** với (các) sở thích này, ví dụ `"speakerWilling": "core.bit_mat"`. Dùng cho sự kiện "nàng tự đề nghị". |
| `speakerGenerated` | `true`: chỉ chọn tú nữ ngẫu nhiên (không phải nhân vật viết sẵn) |
| `childAge`, `childSex`, `childMarried` | Với `speaker: "child"` |
| `pairTinhY`, `pairFavorBelow` | Với `speaker: "pair"` |

### 7.3 Lựa chọn

| Trường | Ý nghĩa |
| --- | --- |
| `label` | Chữ trên nút (dùng được biến). |
| `requires` | Điều kiện để nút hiện ra. |
| `cost` | Ngân lượng. Không đủ thì nút ẩn. |
| `effects` | Hệ quả (7.4). |
| `result` | Câu hiện sau khi chọn (khi không có HOOK). |
| `hook` | Id cảnh sẽ gọi. |
| `fetish` | Sở thích của cảnh. Mọi người tham gia phải `willing`, sở thích phải đã mở. |
| `participants` | Mặc định là người nói. `"pair"` cho cặp đối thực. `{ "select": "top_favor" \| "random", "count": 3, "includeSpeaker": true }` chọn những phi đang sẵn lòng với mọi sở thích trong `fetish`. Hoặc danh sách id. |
| `minParticipants` | Số người tối thiểu; không đủ thì nút ẩn. |
| `place`, `extra` | Truyền vào `ctx.place`, `ctx.extra`. |

**Cảnh nhiều người nên luôn có ít nhất một sở thích** trong `fetish` (ví dụ `core.ngam_nhin`), để mọi người tham gia đều phải sẵn lòng. Bộ kiểm tra sẽ cảnh báo nếu thiếu.

**Lựa chọn có HOOK tự ẩn** khi bất kỳ người tham gia nào chưa đủ tuổi hoặc chưa sẵn lòng. Sự kiện `speaker: "child"` không được có HOOK; lõi từ chối cả sự kiện.

### 7.4 Hệ quả (`effects`)

| Khóa | Tác dụng |
| --- | --- |
| `truyLac`, `longThe`, `quocKho`, `danTam`, `hoaKhi` | Cộng trừ chỉ số |
| `favor`, `affection` | Sủng ái, Tình cảm của người nói |
| `favor2` | Sủng ái người thứ hai của cặp |
| `favorAll` | Sủng ái cả hậu cung (trừ người nói) |
| `favorConsort` | `{ "core.tuyet": 10 }`: Sủng ái của nhân vật cụ thể |
| `addConsortSpeaker`, `addConsort` | Người nói / các id nhập cung |
| `removeSpeaker`, `removePair` | Người nói / cả cặp rời cung |
| `meet` | Đánh dấu đã gặp, chưa nhập cung |
| `recruit`, `recruitOrigin` | Số tú nữ ngẫu nhiên nhập cung, kèm xuất thân |
| `promote` | Thăng người nói bấy nhiêu phẩm |
| `trait`, `removeTrait` | Thêm / bỏ trait của người nói |
| `fetish` | `{ "id": 10 }`: tăng độ nghiện |
| `consent` | Đổi mức đồng thuận của người nói (không đổi được mục `refuse`) |
| `night` | Tính một đêm thị tẩm với người nói (không gọi HOOK) |
| `flag`, `unflag` | Bật, tắt cờ |
| `building` | Xây công trình miễn phí |
| `attitude` | Đặt thái độ với đối thực (0–3) |
| `tinhY` | Cộng Tình Ý của cặp (với `"pair"`) |
| `closeness`, `childTrait`, `teacher`, `educate`, `marry`, `motherFavor` | Con cái: độ thân thiết, trait thứ hai, thầy dạy (`dai_hoc_si`, `vo_tuong`, `cam_su`), xét học vấn, thành thân, Sủng ái của mẹ |
| `album` | `{ "title": "...", "line": "..." }`: lưu một khoảnh khắc vào album |
| `closeSelection` | Ngừng tuyển tú vĩnh viễn |
| `abdicate` | Thoái vị ngay: `"cam_cung"`, `"hanh_cung"`, `"giang_nam"` |
| `log` | Ghi thêm một dòng nhật ký |

Khi một lựa chọn có `hook`, lõi tự tính đêm thị tẩm cho những người tham gia đã ở trong hậu cung và tăng độ nghiện các sở thích trong `fetish`.

---

### 7.5 Chỉ số và hậu quả

- Thu nhập mỗi tháng = 120 + Dân tâm × 2. Dân tâm thấp thì ngân khố hụt.
- Trụy lạc tự nguội 0,3 mỗi tháng và càng cao càng khó tăng (tăng × (1 − Trụy lạc/130), tối thiểu × 0,3).
- Hòa khí dưới 30: mỗi tháng có thể một phi mất Sủng ái. Hậu cung trên 30 người thì Hòa khí giảm dần.
- Sự kiện hậu quả của chỉ số nằm trong `packs/core/events/he-qua.json` (dân oán, bạo động, ngân khố cạn, hậu cung cãi vã, xin xuất cung…). Viết thêm bằng điều kiện `danTam`, `hoaKhi`, `quocKho`.

### 7.6 Mục tiêu năm

Mỗi đầu năm lõi chọn 3 mục tiêu trong `G.GOALS` (js/systems/01-co-ban.js) còn làm được. Mỗi mục tiêu có `text`, `ok(s)` (có nên đưa ra không), `test(s, base)` (đã xong chưa) và `reward` (cùng cú pháp `effects`). Đủ ba mục tiêu thưởng thêm 1000 lượng.

## 8. Cuộc thi, quà, công trình, vùng

**contests.json** — mùa thi diễn ra tháng 4 và tháng 9 mỗi năm, lõi chọn ngẫu nhiên tối đa 4 cuộc thi đã mở. Người chơi cũng có thể tự mở cuộc thi trong Ý chỉ (800 lượng, 3 tháng một lần). Tháng 12, nếu có ba người điểm cao và Trụy lạc từ 40, có Phong Nguyệt Đại Điển.

**rules (cung quy)**: lệ hậu cung, bật/tắt trong Ý chỉ → Cung quy, không giới hạn số lệ bật cùng lúc. Khai báo trong manifest: `"rules": "cung-quy.json"`. Mỗi mục:

| Trường | Ý nghĩa |
|---|---|
| `id`, `name`, `desc` | Mã, tên, mô tả hiện trên bảng Cung quy |
| `fetish` | Danh sách sở thích. Chỉ phi **sẵn lòng** với tất cả mới theo lệ; mỗi phi không theo làm Hòa khí −0,25/tháng (tối đa −1,5 mỗi lệ, cộng dồn mọi lệ tối đa −3/tháng) |
| `unlock` | Điều kiện mở (như `when`), ngoài ra mọi sở thích trong `fetish` phải đã mở |
| `monthly` | Cộng mỗi tháng khi lệ còn bật: `truyLac`, `hoaKhi`, `danTam`, `longThe`, `quocKho` (cho cả triều) và `favor`, `affection` (cho từng phi theo lệ) |
| `chance`, `count` | Xác suất mỗi tháng nổ sự kiện "lệ hôm nay" (mặc định 0.3), số phi theo lệ xuất hiện trong cảnh (mặc định 3) |
| `hook`, `eventText`, `eventLabel` | Hook của cảnh, lời dẫn sự kiện và chữ trên nút đi xem |
| `lead` | Tùy chọn. `"pregnant"`: người chính của cảnh (`{name}`) luôn là một phi theo lệ đang mang thai; không có ai thì lệ không nổ cảnh |

Cảnh viết bằng JSON như mọi hook (`{name}`, `{names}` là các phi theo lệ có mặt). Prompt cho Grok: `docs/PROMPT-VIET-CUNG-QUY.md`.

```json
{ "id": "ten-goi.thi_den", "name": "Thi làm đèn", "desc": "Ai làm đèn đẹp nhất", "tier": 1,
  "unlock": {}, "fetish": [], "count": 4, "hook": "ten-goi.thi_den",
  "traitsBonus": ["Khéo tay"], "prize": { "favor": 15, "trait": "Đèn khéo" } }
```
HOOK của cuộc thi nhận `ctx.extra.winner`, `ctx.extra.ranking`, `ctx.extra.contestName`. Trong cảnh viết bằng JSON dùng `{winner}` và `{contest}`.

**gifts.json**
```json
{ "id": "ten-goi.den_hoa", "name": "Đèn hoa đào", "cost": 300, "favor": 8, "desc": "...", "likes": ["Lãng mạn", "ten-goi.ngam_den", "ten-goi.dao_hoa"], "pair": false, "album": false }
```
`likes` khớp với sở thích, trait hoặc id nhân vật thì quà được nhân đôi. Tặng trùng nhiều lần hiệu quả giảm dần. `pair: true` cộng Tình Ý cho người thương của nàng.

**buildings.json**
```json
{ "id": "ten-goi.lau_den", "name": "Lầu đèn", "cost": 3000, "desc": "...", "requires": { "truyLac": { "gte": 20 } }, "requiresText": "Cần Trụy lạc từ 20", "effects": { "hoaKhi": 5 }, "done": "Câu hiện khi xây xong." }
```
Sự kiện dùng `"when": { "building": "ten-goi.lau_den" }` để chỉ xảy ra sau khi xây.

**regions.json**
```json
{ "id": "ten-goi.lac_duong", "name": "Lạc Dương", "cost": 2000, "recruit": 2, "origin": "Mỹ nhân Lạc Dương", "desc": "...", "arrive": "Câu khi đến nơi.", "album": "Dòng lưu vào album." }
```
Đi tuần du bật cờ `travel.<id vùng>`, ví dụ `travel.ten-goi.lac_duong`; viết sự kiện có `"when": { "flag": "travel.ten-goi.lac_duong" }` để có chuyện xảy ra ở vùng đó.

**names.json** — `female` (tú nữ), `child_m`, `child_f` (con), `spouse_m`, `spouse_f` (người con thành thân cùng).

---

## 9. Cảnh (scenes.js)

```js
(function (Game) {
  "use strict";
  const PACK = "ten-goi-cua-ban";

  Game.hooks.register(PACK + ".dem_den", (ctx) => {
    const p = ctx.participants[0];
    return {
      title: "Đêm đèn hoa",
      text: `Nội dung với ${p.name}.\n> Lời thoại.`,
      image: Game.asset(PACK, "assets/dem_den.webp"),
    };
  }, PACK);
})(window.Game);
```

Hàm nhận `ctx` (chỉ đọc), trả về `{ title, text, image? }`. Trả về `null` thì lõi dùng cảnh mặc định.

| `ctx` | Ý nghĩa |
| --- | --- |
| `hook` | Id HOOK |
| `participants` | `[{ id, name, title, age, rank, favor, affection, nights, traits, consent }]` |
| `fetish`, `tier`, `combo` | Sở thích của cảnh, tầng cao nhất, tên combo nếu có |
| `fetishLevels` | Độ nghiện hiện tại của hoàng đế |
| `count` | Đây là lần thứ mấy HOOK này được gọi trong đời này |
| `truyLac`, `emperor` | Trụy lạc; `{ name, age }` |
| `place`, `extra` | Do sự kiện truyền vào |

Dùng `ctx.count`, `ctx.participants[i].nights`, `ctx.tier` để cảnh lần đầu khác lần thứ mười.

### 9.1 Ghi đè và bắt nhóm

- Đăng ký lại đúng id → gói nạp sau ghi đè gói nạp trước. Ví dụ thay cảnh thị tẩm mặc định: `Game.hooks.register("core.thi_tam", fn, PACK)`.
- Id kết thúc bằng `*` bắt mọi HOOK có tiền tố đó: `"core.thi_*"` bắt mọi cuộc thi của lõi. Id cụ thể luôn thắng id có `*`; giữa hai id có `*`, id dài hơn thắng.
- Gói lõi đã đăng ký `core.*` làm cảnh dự phòng, cùng cảnh riêng cho từng HOOK. Danh sách đầy đủ xem trong `packs/core/scenes.js` hoặc tab **Gói** trong game.

### 9.2 Ảnh

Đặt trong `assets/`, gọi bằng `Game.asset(PACK, "assets/ten.webp")`. Ảnh cảnh hiển thị tỉ lệ 4:3, nên xuất 1200×900 webp dưới 300 KB. Ảnh lỗi thì giao diện tự hiện khung thay thế.

---

### 9.3 Cảnh viết tay, không cần code (scene-texts.json)

Cách dễ nhất để thêm cảnh: chỉ viết chữ. Trong manifest khai báo `"sceneTexts": "scene-texts.json"`:

```json
{
  "core.thi_tam": {
    "core.uyen_nghi": {
      "dau": [ ["cảnh 1 · đoạn 1", "cảnh 1 · đoạn 2"], ["cảnh 2 · đoạn 1", "cảnh 2 · đoạn 2", "cảnh 2 · đoạn 3"] ],
      "quen": [ ["..."] ],
      "lau": [ ["..."] ]
    },
    "_chung": { "quen": [ ["Đoạn dùng cho mọi phi, tên nàng là {name}.", "Đoạn tiếp theo…"] ] }
  },
  "core.thi_tam_so_thich": {
    "core.lua_la": { "_": [ ["Đêm nay theo ý bệ hạ: {fetish}...", "…", "…"] ] }
  },
  "core.bach_hoa": { "_chung": { "_": ["{names} cùng ở bên bệ hạ...", "Đoạn 2…"] } }
}
```

- **Mỗi phần tử trong danh sách là một cảnh**, tức một danh sách đoạn nối tiếp nhau. Game hiện từng đoạn, người chơi bấm "Tiếp" để đọc đoạn sau (hoặc "Đọc liền một mạch").
- Mỗi lần gọi, game bốc một cảnh trong danh sách và không lặp lại cho đến khi đã xem hết.
- Viết gọn `["đoạn 1", "đoạn 2"]` (không có ngoặc lồng) cũng được: cả danh sách được hiểu là một cảnh duy nhất, như ví dụ `core.bach_hoa` ở trên.

- Khóa cấp hai: id nhân vật (cảnh `core.thi_tam`), id sở thích (cảnh `core.thi_tam_so_thich`), hoặc `_chung`.
- Khóa cấp ba: `dau` / `quen` / `lau` cho cảnh thị tẩm, `_` cho mọi cảnh khác.
- Biến: `{name}`, `{names}`, `{emperor}`, `{fetish}`, `{rank}` (phẩm của người chính, ví dụ Quý phi). Riêng cảnh cuộc thi và Đại Điển có thêm `{winner}` (người thắng) và `{contest}` (tên cuộc thi). Dòng bắt đầu bằng `> ` là lời thoại.
- Chưa có chữ phù hợp thì game dùng cảnh cũ (của `scenes.js`).
- Nhiều file cùng viết cho một HOOK thì game nối thêm, không file nào đè file nào.
- Gói `packs/canh-viet` đã có sẵn khung trống cho mọi cảnh; bộ prompt cho Grok nằm ở `docs/PROMPT-VIET-CANH.md`.
- Có thể thêm `"_title": "..."` trong khối của một HOOK để đặt tiêu đề cảnh.

## 10. Quy tắc lõi (không ghi đè được)

1. **Tuổi:** mọi nhân vật trưởng thành từ 18 tuổi trở lên. Nhân vật dưới 18 hoặc thiếu tuổi bị từ chối khi nạp; Thiên Đạo không tạo được; lõi kiểm tra lại tuổi trước mỗi HOOK. Con cái của hoàng đế không bao giờ được đưa vào HOOK.
2. **Đồng thuận:** trước mỗi HOOK, mọi người tham gia phải `willing` với mọi sở thích của cảnh. Không đạt thì lựa chọn bị ẩn; gọi cưỡng bằng Thiên Đạo thì HOOK bị chặn và ghi vào nhật ký HOOK.
3. **Cổng tuổi người chơi:** màn mở đầu bắt xác nhận đủ tuổi theo `rating`.

---

## 11. Kiểm tra và gỡ lỗi

- `node tools/validate.js`: JSON hợp lệ, tuổi, id trùng, tiền tố, id tham chiếu tồn tại, sở thích trong `consent`/`fetish`/`combos`, HOOK chưa có cảnh, cảnh nhiều người thiếu sở thích, sự kiện con cái có HOOK.
- Tab **Gói**: gói đã nạp, số lượng nội dung, HOOK, lỗi và cảnh báo.
- **Thiên Đạo**: kéo chỉ số, tua thời gian, quay lại một năm, tạo phi, đặt Tình Ý, đổi thái độ đối thực, chỉnh đồng thuận, cho sinh con, chỉnh tuổi con, gọi thẳng sự kiện, xem nhật ký HOOK.

---

## 12. Phát hành

Nén thư mục gói thành `.zip`. Người chơi giải nén vào `packs/` và thêm tên vào `packs/index.json`. Tăng `version` mỗi lần phát hành và ghi rõ gói cần `core` phiên bản nào.
