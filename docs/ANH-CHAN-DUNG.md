# Thêm ảnh chân dung thật

Game vẽ sẵn chân dung bằng hình học cho mọi nhân vật. Có ảnh thật thì ảnh phủ lên trên; ảnh lỗi hoặc thiếu thì game tự quay về chân dung vẽ, không bao giờ vỡ giao diện. Ảnh áp dụng cả cho bản lưu cũ.

## Các bước

1. **Tạo ảnh** bằng công cụ vẽ ảnh bạn quen (Midjourney, Leonardo, Grok Imagine…). Prompt gợi ý ở cuối trang.
2. **Cắt vuông và nén**: kích thước 512×512, định dạng `.webp` (vào squoosh.app, kéo ảnh vào, chọn WebP, chất lượng ~75). Mỗi ảnh nên dưới 80 KB để điện thoại tải nhanh.
3. **Đặt tên không dấu** và bỏ vào thư mục `packs/canh-viet/portraits/`, ví dụ `tuyet.webp`.
4. **Khai báo** trong `packs/canh-viet/portraits.json`:
   ```json
   "core.tuyet": "portraits/tuyet.webp",
   ```
   Ô nào để `""` thì nhân vật đó vẫn dùng chân dung vẽ.
5. **Tú nữ ngẫu nhiên** (người được tuyển qua tuyển tú): thêm bao nhiêu ảnh cũng được vào danh sách `_tu_nu`. Mỗi tú nữ được gán cố định một ảnh trong đó.
   ```json
   "_tu_nu": ["portraits/tu-nu-1.webp", "portraits/tu-nu-2.webp", "portraits/tu-nu-3.webp"]
   ```
   Càng nhiều ảnh càng ít trùng mặt (nên từ 12 ảnh trở lên).
6. Chạy `node tools/validate.js`: dòng `Ảnh chân dung: N ảnh` cho biết số ảnh đọc được; ảnh sai tên sẽ bị báo `không thấy file ảnh`. Rồi `python tools/build.py`.

Ảnh hiện ở thẻ phi tần, khi lật thẻ, ở đầu mỗi sự kiện và trong hồ sơ. Ảnh nên là **chân dung vai trở lên, kín đáo**: nó xuất hiện ở khắp nơi trong giao diện, kể cả màn hình chính.

Hoàng tử, công chúa không bao giờ dùng ảnh; game luôn vẽ hình đơn giản cho con cái.

## Prompt gợi ý

Giữ chung một đoạn "phong cách" cho mọi ảnh để cả hậu cung trông cùng một bộ:

```
Phong cách chung (dán cuối mọi prompt):
portrait, head and shoulders, adult woman in her twenties, ancient Chinese imperial palace, traditional hanfu, soft painterly digital art, warm candlelight, dark lacquer red and gold background, elegant, tasteful, fully clothed, square 1:1
```

| Nhân vật | Prompt riêng (đặt trước phần phong cách chung) |
| --- | --- |
| `core.uyen_nghi` Lục Uyển Nghi, Đức Phi | composed noble consort, phoenix hairpin, golden-yellow formal robes, calm dignified gaze with a hint of mischief |
| `core.moc_can` Tô Mộc Cẩn | gentle shy young woman, simple pale green robes, jasmine flower in hair, blushing, soft eyes |
| `core.tuyet` Hách Liên Tuyết | steppe princess, fur-trimmed riding robes, braided hair with silver beads, bold confident smile, wind-swept |
| `core.nhu_yen` Liễu Như Yên | famous dancer, flowing silk sleeves, crimson and peach layers, alluring half-smile, dance pose |
| `core.tu_lan` Mạc Tử Lan | worldly refined beauty from Jiangnan, violet robes, folding fan, knowing elegant look |
| `core.mi_nuong` Hồ Mị Nương | playful perfume shop owner, rose-pink robes, holding a small incense burner, teasing grin, fox-like eyes |
| `core.thanh_ca` Thẩm Thanh Ca | gentle zither musician, pale blue robes, guqin in background, melancholic tender expression |
| `core.song_nguyet` Song Nguyệt | dreamy calm twin sister, silver-white robes, moon hairpin, soft quiet smile |
| `core.song_nhat` Song Nhật | lively bold twin sister, same face as her twin, orange-red robes, sun hairpin, cheeky grin |
| `core.hong_tieu` Tạ Hồng Tiêu, Quý Phi | radiant favored consort, lavish red and gold robes, many jeweled hairpins, confident captivating look |
| Tú nữ (`_tu_nu`) | young palace maiden newly selected, varied hairstyles, modest pastel robes — đổi màu áo, kiểu tóc, nét mặt mỗi lần để có nhiều người khác nhau |

Song Nguyệt và Song Nhật là song sinh: tạo một ảnh trước, rồi dùng chức năng "biến thể" hoặc "giữ khuôn mặt" của công cụ để làm người còn lại.
