# Tửu Sắc Đế Vương

Game mô phỏng hậu cung dạng text kèm chân dung, chạy trên trình duyệt, ưu tiên điện thoại. Người chơi là một hoàng đế 18 tuổi vừa đăng cơ: tuyển tú, sủng ái phi tần, sinh con nối dõi, và chọn mức độ trụy lạc của mình. Nội dung 25+.

Bản này là **demo 0.1**: lõi game, gói nội dung lõi, một gói ví dụ, cơ chế Content Pack cho bên thứ ba và God Mode.

## Chạy thử

Game đọc gói bằng `fetch`, nên phải chạy qua máy chủ web (mở file trực tiếp sẽ báo lỗi nạp gói):

```bash
python3 -m http.server 8000
# mở http://localhost:8000 trên máy, hoặc http://<IP-máy>:8000 trên điện thoại cùng mạng
```

Hoặc build một file duy nhất, mở trực tiếp được:

```bash
python3 tools/build.py
# mở dist/index.html
```

Đưa lên GitHub Pages: bật Pages cho nhánh `main`, thư mục gốc. Không cần bước build.

## Cấu trúc

```
index.html              trang chính
css/style.css           giao diện (mobile first)
js/engine.js            lõi: chỉ số, tháng, điều kiện, hệ quả, HOOK, quy tắc lõi, God Mode, lưu game
js/ui.js                giao diện: màn chính, thẻ sự kiện, hậu cung, con cái, Thiên Đạo
js/main.js              bộ nạp gói
packs/index.json        danh sách gói được nạp
packs/core/             gói lõi: 9 phi tần, 6 sở thích, 21 sự kiện, cảnh mặc định
packs/vi-du-den-long/   gói ví dụ hoàn chỉnh cho bên thứ ba tham khảo
packs/_template/        mẫu trống để copy khi làm gói mới
docs/HUONG-DAN-CONTENT-PACK.md   hướng dẫn làm gói
tools/validate.js       kiểm tra gói: node tools/validate.js
tools/build.py          đóng gói một file: python3 tools/build.py
```

## Cách chơi

- **Qua tháng**: thời gian trôi một tháng, có thể xảy ra sự kiện, sinh con.
- **Lật thẻ**: chọn phi tần thị tẩm, kèm sở thích nếu đã mở khóa và nàng sẵn lòng.
- **Tuyển tú**: mỗi năm một lần, 1500 lượng, chọn tú nữ lưu bài tử.
- **Hậu cung**: chạm vào phi tần để ghé thăm, triệu thị tẩm, lập Hoàng hậu.
- Game kết thúc khi hoàng đế 65 tuổi hoặc Long thể cạn: thoái vị làm Thái thượng hoàng. Không có kết cục tệ.

## Thiên Đạo (God Mode)

Bật ở màn mở đầu. Mở tab **Thiên Đạo** để kéo chỉ số, tua thời gian, tạo phi tần, gọi bất kỳ sự kiện nào, xem nhật ký HOOK. Trong chi tiết phi tần có thêm thanh Sủng ái và bảng chỉnh mức đồng thuận.

## Quy tắc lõi

Gói nội dung và God Mode không ghi đè được:

1. Mọi nhân vật từ 18 tuổi trở lên. Nhân vật dưới 18 hoặc thiếu tuổi bị từ chối khi nạp.
2. Trước mỗi cảnh (HOOK), mọi người tham gia phải sẵn lòng với mọi sở thích của cảnh. Không đạt thì lựa chọn bị ẩn.
3. Người chơi phải xác nhận đủ tuổi ở màn mở đầu.

## Thêm nội dung

Xem [docs/HUONG-DAN-CONTENT-PACK.md](docs/HUONG-DAN-CONTENT-PACK.md).
