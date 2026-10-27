# Tửu Sắc Đế Vương

Game mô phỏng hậu cung dạng text kèm chân dung, chạy trên trình duyệt, ưu tiên điện thoại. Người chơi là một hoàng đế 18 tuổi vừa đăng cơ: tuyển tú, sủng ái phi tần, sinh con nối dõi, và tự chọn mình sẽ trụy lạc đến đâu. 

Phiên bản **0.5.4**. Mới ở 0.5.4: 8 sở thích Bồn chứa tinh, Phá trinh, Mang thai, Đêm trước đại hôn, Trừng phạt, Bất lực, Cầu quan, Yến tiệc mở sẵn cho mọi phi ở mọi đêm (Mang thai vẫn là cách để triệu phi đang hoài thai). Mới ở 0.5.3: giao diện gọn hơn: đầu trang một dòng, tab mờ mép khi còn tab khuất, bảng trượt có nút ✕ và vuốt xuống để đóng, nút quay lại của điện thoại đóng bảng thay vì thoát game, hồ sơ phi chia tab (Thông tin, Tặng quà, Sở thích, Học phường), xuất cung phải xác nhận. Mới ở 0.5.2: **Lật thẻ bài** thành thẻ tên lật được, thêm **Bốc thẻ úp · duyên trời** (mỗi tháng một lần, triệu người bốc được thì Tình cảm +3), **Ghen tuông** (triệu một phi 3 đêm liền thì một phi khác dỗi 2 tháng), **Đêm không như ý** (thỉnh thoảng nàng mệt, buồn hoặc đang dỗi mà xin dời; bệ hạ an ủi hoặc để nàng nghỉ). Mới ở 0.5.1: **Ghé thăm có hội thoại** (hỏi chuyện, trêu, khen; nàng phản ứng theo tính cách), **Lời hẹn** (giữ lời được thưởng, quên thì nàng dỗi), **Việc cần để ý** ở tab Triều. Mới ở 0.5.0: **Tâm nguyện** (mỗi phi một ước nguyện 12 tháng), **Lịch lễ** (7 lễ nổ đúng tháng, thêm Hoa triêu), **Hành cung** (tháng 6 và 11, mang 3 phi), **Lễ sắc phong** (lên Phi trở lên phải qua lễ), **Phe phái**, **Tin đồn**, **Hòa thân** (2 năm một lần, chọn tranh công chúa), thêm 3 quẻ. Mới ở 0.4.1: **Bảng vàng** (11 bảng xếp hạng phi tần, xem trong tab Hậu cung, mỗi tháng có thể nêu tên người đứng nhất hoặc đứng chót), **Đêm nàng chọn** (phi thân thiết xin tự chọn sở thích, ưu tiên sở thích bệ hạ ít dùng), **Phi xin ban lệ** (phi dâng tấu xin bật một cung quy khi nửa hậu cung sẵn lòng), **Quẻ đầu năm** (9 quẻ đổi tỉ lệ cả năm, gieo lại được một lần). Từ 0.4.0: **Cung quy**, lệ hậu cung bật/tắt trong Ý chỉ; chỉ phi sẵn lòng mới theo, phi không theo làm Hòa khí giảm. Gói `canh-viet` có cảnh viết sẵn, sự kiện khám phá sở thích, và chỗ cắm ảnh chân dung thật. Mỗi tháng có thêm lượt "chuyện hậu cung", sự kiện bốc theo gói, thi hai mùa mỗi năm và tự mở cuộc thi được. Sau mỗi đêm thị tẩm có thể nổ thêm chuyện trong đêm (sự kiện, nghi lễ, cuộc thi); cảnh sở thích đã xem hết thì mượn cảnh thị tẩm riêng của nàng thay vì lặp lại.

## Chạy thử

**Cách dễ nhất:** bấm đúp **`CHOI-GAME.bat`** (Windows) hoặc **`choi-game.command`** (Mac). Trình duyệt tự mở game tại `http://localhost:8000`. Đóng cửa sổ đen để tắt. Cần cài Python.

Mở thẳng `index.html` cũng chơi được, nhưng game dùng bản đóng gói `packs/bundle.js`: sửa JSON xong phải chạy `python3 tools/build.py` thì mới thấy thay đổi.

Chạy tay bằng dòng lệnh:

```bash
python3 -m http.server 8000
# mở http://localhost:8000, hoặc http://<IP-máy>:8000 trên điện thoại cùng mạng
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
| Cuộc thi | Mùa thi tháng 4 và 9, tự mở trong Ý chỉ, 10 cuộc thi, Phong Nguyệt Đại Điển cuối năm |
| Cung điện | 9 món quà, 8 công trình, nâng cung từng phi, học phường cầm kỳ thi họa |
| Tuần du | 5 vùng, mỗi vùng có mỹ nhân và sự kiện riêng |
| Kế vị | Chọn người kế vị, chọn nơi an hưởng, 8 kết thúc không có kết cục tệ, sử quan ghi chép, album |
| Truyền đời | Thành tựu lưu giữa các lượt, điểm Huyết mạch, chơi tiếp đời sau với người kế vị |
| Kịch bản | Tự do, Xe dê, Mê Lâu, Hoa Thanh Trì |
| Thiên Đạo | God Mode: gõ số trực tiếp cho mọi chỉ số (ngân khố không giới hạn), khóa chỉ số, đổi tuổi bệ hạ, chỉnh hàng loạt Sủng ái/Tình cảm/đồng thuận, độ nghiện, thân thiết của con, điểm huyết mạch, quay ngược thời gian, gọi sự kiện, xem nhật ký HOOK |
| Lưu game | Tự lưu, 3 ô lưu thủ công, mã lưu để chuyển sang máy khác |

## Cấu trúc

```
index.html                      trang chính
css/style.css                   giao diện
js/engine.js                    lõi: chỉ số, tháng, điều kiện, hệ quả, sự kiện, HOOK, quy tắc lõi, lưu game
js/systems.js                   hệ thống: con cái, đối thực, sở thích, cuộc thi, cửa hàng, tuần du, kế vị, thành tựu, huyết mạch, kịch bản, Thiên Đạo
js/portrait.js                  chân dung vẽ bằng SVG
js/scene-texts.js               nạp cảnh viết bằng JSON (scene-texts.json của các gói)
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
  events/cung-dinh.json         Thái hậu, lễ tết, đời sống cung đình, Hồng Tiêu, thêm con cái và đối thực
  events/chuong-3.json          tuổi già, truyền ngôi
  scenes.js                     cảnh mặc định (chỉ gợi rồi chuyển cảnh)
packs/khung-nong-bong/          khung 12 nhóm sở thích cho bên thứ ba thay cảnh
packs/canh-viet/                chữ của cảnh (JSON, 7 mức ưu tiên) và sở thích tự thêm
packs/vi-du-den-long/           gói ví dụ nhỏ hoàn chỉnh
packs/_template/                mẫu trống để copy khi làm gói mới
docs/HUONG-DAN-CONTENT-PACK.md  hướng dẫn viết sự kiện và làm gói
docs/PROMPT-VIET-CANH.md        bộ prompt cho Grok theo 7 mức ưu tiên
docs/PROMPT-VIET-SU-KIEN.md     bộ prompt cho Grok viết sự kiện có lựa chọn
docs/ANH-CHAN-DUNG.md           cách thêm ảnh chân dung thật, kèm prompt vẽ ảnh
docs/PROMPT-VIET-CUOC-THI.md    bộ prompt cho Grok viết cuộc thi trong cung
tools/validate.js               kiểm tra gói: node tools/validate.js
tools/build.py                  đóng gói: tạo dist/index.html và packs/bundle.js
packs/bundle.js                 TỰ SINH, dữ liệu đóng gói cho khi mở thẳng index.html (đừng sửa tay)
CHOI-GAME.bat, choi-game.command  bấm đúp để chơi trên máy
tools/them-canh.py              đưa câu trả lời của Grok vào packs/canh-viet
```

## Viết cảnh bằng Grok

Toàn bộ chữ của cảnh nằm trong `packs/canh-viet/` dưới dạng JSON, chia theo 7 mức ưu tiên. Bộ prompt, cách đưa câu trả lời của Grok vào file, và cách tự thêm sở thích mới nằm trong **[docs/PROMPT-VIET-CANH.md](docs/PROMPT-VIET-CANH.md)**. Muốn viết sự kiện mới (tình huống có nút lựa chọn) thì dùng **[docs/PROMPT-VIET-SU-KIEN.md](docs/PROMPT-VIET-SU-KIEN.md)**; sự kiện nằm trong `packs/canh-viet/events/su-kien-moi.json`.

Trên máy tính có thể dùng công cụ: chép câu trả lời của Grok vào `grok.txt` rồi chạy `python3 tools/them-canh.py grok.txt`.

## Sửa sự kiện

Mọi sự kiện nằm trong `packs/core/events/*.json`. Sửa xong chạy `node tools/validate.js`, rồi vào game bật Thiên Đạo, tab **Thiên Đạo → Gọi sự kiện** để thử ngay. Cú pháp đầy đủ trong `docs/HUONG-DAN-CONTENT-PACK.md`.

## Quy tắc lõi

Gói nội dung và Thiên Đạo không ghi đè được:

1. Mọi nhân vật trưởng thành từ 18 tuổi trở lên. Con cái của hoàng đế không bao giờ xuất hiện trong cảnh thân mật.
2. Trước mỗi cảnh (HOOK), mọi người tham gia phải sẵn lòng với mọi sở thích của cảnh.
3. Người chơi phải xác nhận đủ tuổi ở màn mở đầu.
