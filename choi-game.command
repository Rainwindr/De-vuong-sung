#!/bin/bash
cd "$(dirname "$0")"
echo "Đang mở game tại http://localhost:8000 ... Đóng cửa sổ này để tắt game."
(sleep 1; open http://localhost:8000) &
python3 -m http.server 8000
