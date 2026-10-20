# Hướng dẫn làm Content Pack

Tài liệu này dành cho studio bên thứ ba muốn thêm nhân vật, sở thích, sự kiện và cảnh vào **Tửu Sắc Đế Vương** mà không cần sửa code lõi.

Một gói là một thư mục trong `packs/`, gồm vài file JSON và một file `scenes.js`. Lõi lo chỉ số, điều kiện, lựa chọn và gọi HOOK. Gói lo nội dung.

---

## 1. Bắt đầu trong 5 phút

1. Copy thư mục `packs/_template` thành `packs/ten-goi-cua-ban` (chỉ chữ thường, số, dấu gạch ngang).
2. Mở `manifest.json`, đổi `"id"` thành đúng tên thư mục, đổi `"name"` và `"author"`.
3. Tìm và thay mọi chữ `ten-goi-cua-ban` trong các file của gói thành id mới.
4. Thêm tên thư mục vào `packs/index.json`:
   ```json
   { "packs": ["core", "ten-goi-cua-ban"] }
   ```
5. Chạy game qua máy chủ web (xem `README.md`), vào tab **Gói** để xem gói đã nạp chưa và có lỗi gì không.
6. Chạy bộ kiểm tra: `node tools/validate.js`.

Gói `packs/vi-du-den-long` là một gói hoàn chỉnh, chạy được, nên mở ra đọc song song với tài liệu này.

---

## 2. Cấu trúc thư mục

```
packs/ten-goi-cua-ban/
  manifest.json     bắt buộc
  characters.json   nhân vật
  events.json       sự kiện
  fetishes.json     sở thích
  names.json        tên cho tú nữ và con cái ngẫu nhiên
  scenes.js         cảnh cho các HOOK
  assets/           ảnh chân dung, ảnh cảnh
```

Chỉ `manifest.json` là bắt buộc. File nào không dùng thì xóa khỏi `manifest.files`.

---

## 3. manifest.json

```json
{
  "id": "ten-goi-cua-ban",
  "name": "Tên hiển thị",
  "version": "0.1.0",
  "author": "Studio X",
  "game_version": ">=0.1",
  "rating": "25+",
  "requires": ["core"],
  "files": {
    "characters": "characters.json",
    "events": "events.json",
    "fetishes": "fetishes.json",
    "names": "names.json",
    "scenes": "scenes.js"
  }
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `id` | Trùng tên thư mục. Là tiền tố cho mọi id trong gói. |
| `requires` | Các gói phải nạp trước. Thứ tự trong `packs/index.json` phải khớp. |
| `files` | Đường dẫn tương đối tới các file của gói. |

---

## 4. Quy tắc id

Mọi id trong gói bắt đầu bằng `id-gói.` để không đè lên gói khác:

```
ten-goi-cua-ban.dao_hoa          nhân vật
ten-goi-cua-ban.ngam_den         sở thích
ten-goi-cua-ban.gap_go           sự kiện
ten-goi-cua-ban.dem_den          HOOK
```

Được phép tham chiếu id của gói khác (ví dụ `core.lua_la` trong `consent`, `core.uyen_nghi` trong `hasConsort`), miễn gói đó nằm trong `requires`.

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
  "favor": 25,
  "affection": 15,
  "traits": ["Khéo tay", "Lãng mạn", "Tinh nghịch"],
  "likes": ["ten-goi-cua-ban.ngam_den"],
  "consent": {
    "ten-goi-cua-ban.ngam_den": "willing",
    "core.lua_la": "persuade",
    "core.chinh_phuc": "refuse"
  },
  "portrait": { "glyph": "桃", "hue": 340, "image": "assets/dao_hoa.webp" },
  "lines": { "low": "Câu khi Sủng ái thấp.", "high": "Câu khi Sủng ái cao." }
}
```

| Trường | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `age` | Có | **Từ 18 trở lên.** Thiếu hoặc dưới 18, nhân vật bị lõi từ chối khi nạp. |
| `start` | | `true` thì có sẵn trong hậu cung khi bắt đầu game. Mặc định nhân vật chỉ xuất hiện qua sự kiện. |
| `rank` | | 0 Đáp ứng → 6 Hoàng quý phi. Hoàng hậu (7) chỉ do người chơi lập. |
| `favor`, `affection` | | Sủng ái và Tình cảm khởi đầu, 0–100. |
| `likes` | | Sở thích hợp gu. Thị tẩm đúng gu được cộng thêm Sủng ái. |
| `consent` | | Mức đồng thuận theo từng id sở thích: `willing` (Sẵn lòng), `persuade` (Cần thuyết phục), `refuse` (Từ chối). Sở thích không ghi thì dùng `default_consent` của sở thích đó. |
| `portrait.glyph` | | Một ký tự hiện trong khung chân dung khi chưa có ảnh. |
| `portrait.hue` | | Màu khung, 0–359. |
| `portrait.image` | | Ảnh chân dung, đường dẫn tương đối với thư mục gói. Khuyên dùng webp vuông 512×512. |

---

## 6. Sở thích (fetishes.json)

```json
{
  "id": "ten-goi-cua-ban.ngam_den",
  "name": "Dưới ánh đèn hoa",
  "tier": 1,
  "unlock": { "truyLac": { "gte": 10 } },
  "default_consent": "persuade",
  "desc": "Một dòng mô tả."
}
```

- `tier`: 1 đến 3. Được truyền vào HOOK qua `ctx.tier` để gói chỉnh cường độ cảnh.
- `unlock`: điều kiện mở khóa, cùng cú pháp với `when` của sự kiện (mục 7.2).
- `default_consent`: mức đồng thuận cho nhân vật không ghi rõ sở thích này. Nên để `persuade`.

Sở thích hiện trong tab **Sở thích**, trong bảng chi tiết của từng phi tần, và trong màn **Lật thẻ bài** khi đã mở khóa.

---

## 7. Sự kiện (events.json)

```json
{
  "id": "ten-goi-cua-ban.dem_den",
  "title": "Chiếc đèn chỉ thắp một lần",
  "speaker": "ten-goi-cua-ban.dao_hoa",
  "once": false,
  "cooldown": 6,
  "weight": 4,
  "when": { "speakerInHarem": true, "favor": { "gte": 40 } },
  "text": "{name} treo kín cung bằng đèn.\n> Đêm nay chỉ có ánh đèn thôi, bệ hạ chịu không?",
  "choices": [
    {
      "label": "Chịu",
      "fetish": ["ten-goi-cua-ban.ngam_den"],
      "effects": { "favor": 10, "truyLac": 5 },
      "hook": "ten-goi-cua-ban.dem_den"
    },
    { "label": "Để hôm khác", "effects": { "favor": -2 }, "result": "Đèn vẫn sáng đến sáng." }
  ]
}
```

### 7.1 Trường của sự kiện

| Trường | Ý nghĩa |
| --- | --- |
| `speaker` | Id nhân vật nói chính. `"random"` để lõi chọn ngẫu nhiên một phi trong hậu cung. Bỏ trống nếu không có người nói. |
| `once` | `true` thì chỉ xảy ra một lần mỗi lượt chơi. |
| `cooldown` | Số tháng tối thiểu giữa hai lần xảy ra. |
| `weight` | Trọng số khi bốc ngẫu nhiên. Cao thì dễ ra hơn. Mỗi tháng có 80% cơ hội bốc một sự kiện trong số đủ điều kiện. |
| `when` | Điều kiện xuất hiện (7.2). |
| `text` | Lời dẫn. `{name}` thay bằng tên người nói, `{emperor}` thay bằng niên hiệu, `{rank}` thay bằng phẩm. Dòng bắt đầu bằng `> ` hiện thành lời thoại. |

### 7.2 Điều kiện (`when`, `requires`, `unlock`)

So sánh số dùng `{ "gte": 10 }`, `{ "lte": 50 }`, `{ "gt": .. }`, `{ "lt": .. }`, `{ "in": [1, 2, 3] }` hoặc một số cụ thể.

| Khóa | Kiểm tra |
| --- | --- |
| `age` | Tuổi hoàng đế |
| `month` | Tháng 1–12 |
| `yearEvery` | Chỉ những năm chia hết (ví dụ 3 = mỗi ba năm) |
| `truyLac`, `longThe`, `quocKho`, `danTam`, `hoaKhi` | Chỉ số |
| `harem` | Số phi tần |
| `children` | Số con |
| `flag`, `notFlag` | Cờ đã bật hoặc chưa bật |
| `hasConsort`, `notConsort` | Một nhân vật đã hoặc chưa ở trong hậu cung |
| `fetishLevel` | `{ "core.lua_la": { "gte": 50 } }`: độ nghiện của hoàng đế |
| `speakerInHarem` | `true` / `false`: người nói đã nhập cung chưa |
| `favor` | Sủng ái của người nói (chỉ khi đã nhập cung) |

### 7.3 Lựa chọn

| Trường | Ý nghĩa |
| --- | --- |
| `label` | Chữ trên nút. |
| `requires` | Điều kiện để nút hiện ra. |
| `cost` | Ngân lượng phải trả. Không đủ thì nút ẩn. |
| `effects` | Hệ quả (7.4). |
| `result` | Câu hiện sau khi chọn (nếu không có HOOK). |
| `hook` | Id cảnh sẽ gọi. |
| `fetish` | Danh sách sở thích của cảnh. Người tham gia phải ở mức `willing` với tất cả, và sở thích phải đã mở khóa. |
| `participants` | Ai tham gia cảnh. Mặc định là người nói. `{ "select": "top_favor", "count": 3 }` chọn những phi Sủng ái cao nhất đang sẵn lòng với mọi sở thích trong `fetish`. Hoặc danh sách id cụ thể. |
| `place`, `extra` | Truyền thẳng vào `ctx.place`, `ctx.extra` của HOOK. |

**Lựa chọn có HOOK sẽ tự ẩn** nếu bất kỳ người tham gia nào chưa đủ tuổi hoặc chưa sẵn lòng. Đây là quy tắc lõi, gói không tắt được.

### 7.4 Hệ quả (`effects`)

| Khóa | Tác dụng |
| --- | --- |
| `truyLac`, `longThe`, `quocKho`, `danTam`, `hoaKhi` | Cộng trừ chỉ số |
| `favor`, `affection` | Cộng trừ Sủng ái, Tình cảm của người nói |
| `favorAll` | Cộng trừ Sủng ái cả hậu cung (trừ người nói) |
| `addConsortSpeaker` | `true`: người nói nhập cung |
| `addConsort` | Id hoặc danh sách id nhân vật nhập cung |
| `meet` | `true`: đánh dấu đã gặp, chưa nhập cung |
| `recruit` | Số tú nữ ngẫu nhiên nhập cung |
| `fetish` | `{ "id": 10 }`: tăng độ nghiện |
| `consent` | `{ "id": "willing" }`: đổi mức đồng thuận của người nói. Không thể đổi một mục đang là `refuse`. |
| `flag`, `unflag` | Bật, tắt cờ |
| `night` | `true`: tính một đêm thị tẩm với người nói (không gọi HOOK) |
| `log` | Ghi thêm một dòng vào nhật ký |

Khi một lựa chọn có `hook`, lõi tự tính đêm thị tẩm cho những người tham gia đã ở trong hậu cung (Sủng ái, Long thể, cơ hội thụ thai) và tăng độ nghiện các sở thích trong `fetish`.

---

## 8. Cảnh (scenes.js)

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

Hàm cảnh nhận `ctx` (chỉ đọc) và trả về `{ title, text, image? }`. Trả về `null` thì lõi dùng cảnh mặc định.

### 8.1 Nội dung của `ctx`

| Trường | Ý nghĩa |
| --- | --- |
| `hook` | Id HOOK đang gọi |
| `participants` | `[{ id, name, age, rank, favor, affection, traits, consent }]` |
| `fetish` | Id sở thích của cảnh |
| `fetishLevels` | Độ nghiện hiện tại của hoàng đế theo id |
| `tier` | Tầng cao nhất trong các sở thích (0 nếu không có) |
| `truyLac` | Chỉ số Trụy lạc |
| `emperor` | `{ name, age }` |
| `place`, `extra` | Do sự kiện truyền vào |

Dùng `ctx.tier`, `ctx.fetishLevels` và `ctx.participants[i].favor` để thay đổi cảnh theo tiến trình, ví dụ lần đầu và lần thứ mười khác nhau.

### 8.2 Ghi đè và bắt nhóm

- Đăng ký lại đúng một id đã có thì gói nạp sau ghi đè gói nạp trước. Ví dụ thay cảnh thị tẩm mặc định:
  ```js
  Game.hooks.register("core.thi_tam", (ctx) => ({ title: "...", text: "..." }), PACK);
  ```
- Id kết thúc bằng `*` bắt mọi HOOK có tiền tố đó, ví dụ `"core.thi_tam*"` bắt cả `core.thi_tam` và `core.thi_tam_so_thich`. Id cụ thể luôn được ưu tiên hơn id có `*`.

### 8.3 HOOK của gói lõi

Gói khác có thể ghi đè các HOOK này:

| HOOK | Gọi khi |
| --- | --- |
| `core.thi_tam` | Lật thẻ bài, không chọn sở thích |
| `core.thi_tam_so_thich` | Lật thẻ bài có chọn sở thích (xem `ctx.fetish`) |
| `core.da_yen_thi_tam` | Dạ yến đăng cơ |
| `core.moc_can_dem_dau` | Đêm đầu của Tô Mộc Cẩn |
| `core.den_long_dem` | Lễ hội đèn lồng |
| `core.tu_lan_dem_dau` | Thuyền hoa Tần Hoài |
| `core.uyen_nghi_sa_nga` | Hoàng hậu sa ngã |
| `core.xe_de` | Xe dê dừng trước cửa |
| `core.me_lau` | Mê Lâu |
| `core.bach_hoa` | Đêm Bách Hoa (3 hoặc 6 người) |
| `core.that_tich` | Đêm Thất tịch |
| `core.mua_dem` | Trú mưa ở cung phi |

### 8.4 Ảnh

- Đặt ảnh trong `assets/` của gói, dùng `Game.asset(PACK, "assets/ten.webp")`.
- Ảnh cảnh hiển thị tỉ lệ 4:3, nên xuất 1200×900 webp, dưới 300 KB mỗi ảnh để chạy mượt trên điện thoại.
- Ảnh lỗi hoặc thiếu thì giao diện tự hiện khung thay thế, game không dừng.

---

## 9. Quy tắc lõi (gói không ghi đè được)

1. **Tuổi:** mọi nhân vật từ 18 tuổi trở lên. Nhân vật thiếu tuổi hoặc dưới 18 bị từ chối khi nạp, God Mode không tạo được nhân vật dưới 18, và lõi kiểm tra lại tuổi trước mỗi HOOK.
2. **Đồng thuận:** trước mỗi HOOK, mọi người tham gia phải ở mức `willing` với mọi sở thích của cảnh. Lựa chọn không đạt bị ẩn; nếu bị gọi cưỡng bằng God Mode thì HOOK bị chặn và ghi vào nhật ký HOOK.
3. **Cổng tuổi người chơi:** màn mở đầu bắt người chơi xác nhận đủ tuổi theo `rating` của gói.

Mức `refuse` của một nhân vật không thể bị gói khác đổi qua `effects.consent`. Chỉ người chơi chỉnh trong God Mode.

---

## 10. Kiểm tra và gỡ lỗi

- `node tools/validate.js` kiểm tra mọi gói trong `packs/index.json`: JSON hợp lệ, tuổi, tiền tố id, id tham chiếu tồn tại, sở thích trong `consent` và `fetish` tồn tại, HOOK được dùng nhưng chưa đăng ký.
- Trong game, tab **Gói** liệt kê gói đã nạp, HOOK đã đăng ký, lỗi và cảnh báo.
- Bật **Thiên Đạo** (God Mode) ở màn mở đầu để:
  - kéo chỉ số tới đúng điều kiện cần thử,
  - gọi thẳng sự kiện của gói (bỏ qua điều kiện),
  - chỉnh mức đồng thuận từng phi trong bảng chi tiết phi tần,
  - xem nhật ký HOOK (gọi được hay bị chặn, vì sao).

---

## 11. Phát hành gói

- Đóng gói cả thư mục thành `.zip`. Người chơi giải nén vào `packs/` rồi thêm tên vào `packs/index.json`.
- Tăng `version` mỗi lần phát hành.
- Ghi rõ trong mô tả gói: gói cần `core` phiên bản nào, thêm những nhân vật, sở thích, sự kiện nào.
