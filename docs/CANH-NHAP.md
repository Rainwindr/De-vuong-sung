# Cảnh nháp cần sửa

File này liệt kê các cảnh **Claude viết nháp** để game có chữ hiện ra trong lúc chờ bản chính thức. Bản nháp mới có khung truyện (mở màn, luật chơi, diễn biến, người thắng), cố ý **chưa có cảnh nóng chi tiết**. Bạn sửa hoặc viết lại tùy ý.

## Ở đâu

- File: `packs/canh-viet/scene-texts/9-cuoc-thi-nhap.json`
- Mỗi cảnh có dòng `"_ghi_chu": "BẢN NHÁP do Claude viết…"`. Game bỏ qua dòng này.
- Chạy `node tools/validate.js`: cuối kết quả sẽ in **"Còn N cảnh nháp cần sửa"** kèm danh sách. Sửa xong cảnh nào thì **xóa dòng `_ghi_chu`** của cảnh đó, danh sách tự ngắn lại.

## Cách sửa một cảnh

```json
"canh-viet.thi_marking": {
  "_title": "Dấu ấn",
  "_ghi_chu": "BẢN NHÁP … ← xóa dòng này khi sửa xong",
  "_chung": { "_": [
    ["đoạn 1", "đoạn 2", "đoạn 3"],          ← cảnh 1 (bản nháp)
    ["đoạn 1", "đoạn 2", "đoạn 3", "đoạn 4"] ← muốn thêm cảnh 2 thì thêm một danh sách nữa
  ] }
}
```

- Thay chữ trong từng đoạn, hoặc thêm hay bớt đoạn tùy ý. Mỗi đoạn là một trang, người chơi bấm "Tiếp" để sang trang sau.
- Thêm danh sách thứ hai, thứ ba thì mỗi lần thi game sẽ bốc một cảnh chưa xem.
- Muốn bỏ hẳn bản nháp thì xóa danh sách đầu, giữ lại bản của bạn.
- Biến dùng được: `{names}` (các thí sinh), `{name}` (thí sinh đầu), `{winner}` (người thắng), `{contest}` (tên cuộc thi), `{emperor}`, `{rank}`.
- Muốn nhờ Grok hoặc bên thứ ba viết: dùng `docs/PROMPT-VIET-CUOC-THI.md`, gửi kèm bản nháp làm khung. Có JSON mới thì gửi Claude ghép vào, Claude sẽ thay bản nháp.
- Các bản nháp giữ đúng quy tắc của game: tự nguyện, có ám hiệu dừng, ai muốn rút thì rút, người xem chỉ có bệ hạ và các phi. Khi viết lại cũng giữ những điều này.

## Danh sách (27 cuộc thi)

| # | Cuộc thi | Hook | Tiêu đề cảnh | Số thí sinh | Đã sửa |
|---|---|---|---|---|---|
| 1 | Edging Tập Thể | `canh-viet.thi_edging_tap_the` | Edging tập thể | 6 | ☐ |
| 2 | Thi Vắt Sữa | `canh-viet.milking_contest` | Thi vắt sữa | 4 | ☑ |
| 3 | Marathon Creampie | `canh-viet.thi_creampie_marathon` | Marathon đêm dài | 5 | ☑ |
| 4 | Squirting Mess | `canh-viet.squirting_mess` | Đêm nước tràn | 4 | ☑ |
| 5 | CMNF Show | `canh-viet.cmnf_show` | Trình diễn không xiêm y | 5 | ☑ |
| 6 | Women Having Orgasms | `canh-viet.women_orgasms` | Khoảnh khắc đẹp nhất | 5 | ☑ |
| 7 | Massage Pussy | `canh-viet.thi_massage_pussy` | Đôi tay khéo léo | 4 | ☑ |
| 8 | Row of Girls Dildo | `canh-viet.thi_row_of_girls_dildo` | Hàng đồ chơi ngọc | 6 | ☑ |
| 9 | Shaving Pussy | `canh-viet.thi_shaving_pussy` | Lưỡi dao bạc | 4 | ☑ |
| 10 | Nóng Lạnh Cuộc Thi | `canh-viet.nong_lanh_cuoc_thi` | Băng và nến | 5 | ☐ |
| 11 | Khán Đài Trình Diễn | `canh-viet.khan_dai_trinh_dien` | Khán đài hậu cung | 5 | ☐ |
| 12 | BDSM Nhẹ Nhàng | `canh-viet.bdsm_nhe_nhang` | Dây lụa và ám hiệu | 4 | ☐ |
| 13 | Breeding Contest | `canh-viet.breeding_contest` | Mùa hoa kết trái | 5 | ☐ |
| 14 | Sensory Deprivation | `canh-viet.thi_sensory_deprivation` | Bóng tối tĩnh lặng | 4 | ☐ |
| 15 | Praise Kink | `canh-viet.thi_praise_kink` | Lời khen của bệ hạ | 4 | ☐ |
| 16 | Outdoor Night | `canh-viet.thi_outdoor_night` | Đêm trăng hoa viên | 5 | ☐ |
| 17 | Double Penetration Toys | `canh-viet.thi_double_penetration_toys` | Đôi ngọc song hành | 4 | ☐ |
| 18 | Voice Control | `canh-viet.thi_voice_control` | Theo lời bệ hạ | 4 | ☐ |
| 19 | Sweat Play | `canh-viet.thi_sweat_play` | Mồ hôi mùa hạ | 4 | ☐ |
| 20 | Slow Tease Long | `canh-viet.thi_slow_tease_long` | Chậm như hương tàn | 3 | ☐ |
| 21 | Marking | `canh-viet.thi_marking` | Dấu ấn | 4 | ☐ |
| 22 | Mutual Masturbation | `canh-viet.thi_mutual_masturbation` | Đối diện | 4 | ☐ |
| 23 | Lesbian Massage Contest | `canh-viet.thi_lesbian_massage_contest` | Dầu thơm và tỷ muội | 4 | ☐ |
| 24 | Japanese Gameshow | `canh-viet.thi_japanese_gameshow` | Trò chơi phương Đông | 6 | ☐ |
| 25 | Multiple Continuous Orgasms | `canh-viet.multiple_orgasms` | Nối tiếp không dứt | 5 | ☐ |
| 26 | Tickle Toàn Thân | `canh-viet.tickle_full` | Tiếng cười khắp điện | 5 | ☐ |
| 27 | Tickle Vùng Nhạy Cảm | `canh-viet.tickle_sensitive` | Chỗ nhột nhất | 4 | ☐ |

## Cung quy (3 lệ, file `scene-texts/11-cung-quy.json`)

| Lệ | Hook | Đã sửa |
|---|---|---|
| Lệ không mặc quần | `canh-viet.quy_khong_mac_quan` | ☐ |
| Lệ ngọc hành | `canh-viet.quy_ngoc_hanh` | ☐ |
| Lệ hầu sáng | `canh-viet.quy_liem_buoi_sang` | ☐ |

Prompt viết lại: `docs/PROMPT-VIET-CUNG-QUY.md` (Prompt B).

Đánh dấu ☑ ở cột "Đã sửa" nếu muốn theo dõi ngay trong file này. Cách chắc chắn nhất vẫn là xóa `_ghi_chu` rồi chạy validate.
