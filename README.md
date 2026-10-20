# Tửu Sắc Đế Vương

Game mô phỏng hậu cung dạng text kèm chân dung, chạy trên trình duyệt, ưu tiên điện thoại. Người chơi là một hoàng đế 18 tuổi vừa đăng cơ: tuyển tú, sủng ái phi tần, sinh con nối dõi, và tự chọn mình sẽ trụy lạc đến đâu. Nội dung 25+.

Phiên bản **0.3**.

## Chạy thử

Game đọc gói bằng `fetch`, nên phải chạy qua máy chủ web:

```bash
python3 -m http.server 8000
# mở http://localhost:8000, hoặc http://<IP-máy>:8000 trên điện thoại cùng mạng
```

Hoặc build một file duy nhất, mở trực tiếp được:

```bash
python3 tools/build.py      # tạo dist/index.html
```

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`. Không cần build.

## Có gì trong game

| Hệ thống | Nội dung |
| --- | --- |
| Nhịp chơi | Nút "Đến chuyện mới" tua thẳng đến sự kiện tiếp theo; 3 mục tiêu mỗi năm có thưởng |
| Hậu cung | 10 phi tần có cốt truyện, tú nữ ngẫu nhiên có thoại và chuyện riêng theo tính cách, 8 phẩm cấp, phong hiệu, lập Hoàng hậu, ban ân xuất cung, ghen tuông, nhật ký hậu cung |
| Chân dung | Vẽ bằng code theo từng nhân vật, nét mặt đổi theo Sủng ái; gói có ảnh thật thì ảnh thay chỗ |
| Chỉ số | Dân tâm quyết định thu nhập; Dân tâm, Hòa khí, Quốc khố thấp sinh sự kiện hậu quả |
| Lật thẻ | Thị tẩm kèm sở thích, combo hai sở thích, mang thai, sinh đôi, sinh ba |
| Sở thích | 18 sở thích lõi + 12 nhóm khung, cây 3 tầng, độ nghiện, nhạt dần, thuyết phục, tu ở hành cung |
| Đối thực | Tình Ý giữa các phi, 4 mức thái độ của bệ hạ, Cung Đồng Tâm, có thể bị "gạt ra ngoài" |
| Con cháu | Tính cách, thầy dạy, học vấn, tước vị, thành thân, cháu, khoảnh khắc cha con |
| Cuộc thi | Mùa thi tháng 6, 10 cuộc thi, Phong Nguyệt Đại Điển cuối năm |
| Cung điện | 9 món quà, 8 công trình, nâng cung từng phi, học phường cầm kỳ thi họa |
| Tuần du | 5 vùng, mỗi vùng có mỹ nhân và sự kiện riêng |
| Kế vị | Chọn người kế vị, chọn nơi an hưởng, 8 kết thúc không có kết cục tệ, sử quan ghi chép, album |
| Truyền đời | Thành tựu lưu giữa các lượt, điểm Huyết mạch, chơi tiếp đời sau với người kế vị |
| Kịch bản | Tự do, Xe dê, Mê Lâu, Hoa Thanh Trì |
| Thiên Đạo | God Mode: chỉnh mọi thứ, quay ngược thời gian, gọi sự kiện, xem nhật ký HOOK |
| Lưu game | Tự lưu, 3 ô lưu thủ công, mã lưu để chuyển sang máy khác |

## Cấu trúc

```
index.html                      trang chính
css/style.css                   giao diện
js/engine.js                    lõi: chỉ số, tháng, điều kiện, hệ quả, sự kiện, HOOK, quy tắc lõi, lưu game
js/systems.js                   hệ thống: con cái, đối thực, sở thích, cuộc thi, cửa hàng, tuần du, kế vị, thành tựu, huyết mạch, kịch bản, Thiên Đạo
js/portrait.js                  chân dung vẽ bằng SVG
js/ui.js                        giao diện các màn
js/main.js                      bộ nạp gói
packs/index.json                danh sách gói được nạp
packs/core/                     gói lõi
  events/chuong-1.json          gặp gỡ, sa ngã
  events/chuong-2.json          bách hoa, sở thích, tập thể
  events/vo-dao.json            trụy lạc cực độ
  events/phi-tan.json           cốt truyện riêng 8 phi (4 chặng mỗi người) + sự kiện chéo
  events/doi-thuc.json          đối thực
  events/con-cai.json           con cái
  events/hang-ngay.json         sự kiện nhỏ hằng ngày
  events/le-hoi.json            Tết, Đoan Ngọ, Thất tịch, Trung Thu
  events/tuan-du.json           sự kiện khi tuần du
  events/he-qua.json            hậu quả khi chỉ số thấp hoặc cao
  events/tu-nu.json             chuyện riêng của tú nữ theo tính cách
  events/chuong-3.json          tuổi già, truyền ngôi
  scenes.js                     cảnh mặc định (chỉ gợi rồi chuyển cảnh)
packs/khung-nong-bong/          khung 12 nhóm sở thích cho bên thứ ba thay cảnh
packs/vi-du-den-long/           gói ví dụ nhỏ hoàn chỉnh
packs/_template/                mẫu trống để copy khi làm gói mới
docs/HUONG-DAN-CONTENT-PACK.md  hướng dẫn viết sự kiện và làm gói
tools/validate.js               kiểm tra gói: node tools/validate.js
tools/build.py                  đóng gói một file: python3 tools/build.py
```

## Sửa sự kiện

Mọi sự kiện nằm trong `packs/core/events/*.json`. Sửa xong chạy `node tools/validate.js`, rồi vào game bật Thiên Đạo, tab **Thiên Đạo → Gọi sự kiện** để thử ngay. Cú pháp đầy đủ trong `docs/HUONG-DAN-CONTENT-PACK.md`.

## Quy tắc lõi

Gói nội dung và Thiên Đạo không ghi đè được:

1. Mọi nhân vật trưởng thành từ 18 tuổi trở lên. Con cái của hoàng đế không bao giờ xuất hiện trong cảnh thân mật.
2. Trước mỗi cảnh (HOOK), mọi người tham gia phải sẵn lòng với mọi sở thích của cảnh.
3. Người chơi phải xác nhận đủ tuổi ở màn mở đầu.
