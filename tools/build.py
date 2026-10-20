#!/usr/bin/env python3
"""
Đóng gói game thành một file HTML duy nhất (nhúng CSS, JS và mọi gói trong packs/index.json).
Dùng: python3 tools/build.py
Kết quả:
  dist/index.html     file hoàn chỉnh, mở trực tiếp được (không cần máy chủ)
  dist/fragment.html  phần thân, dùng để nhúng vào trang khác
Lưu ý: ảnh trong assets/ của các gói KHÔNG được nhúng; hãy copy thư mục packs/ cạnh dist/index.html nếu gói có ảnh.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKS = ROOT / "packs"
DIST = ROOT / "dist"


def read(p):
    return (ROOT / p).read_text(encoding="utf-8")


def as_list(v):
    return v if isinstance(v, list) else [v]


def safe_js(s):
    # Không để chuỗi "</script" xuất hiện trong mã nhúng
    return s.replace("</script", "<\\/script")


def bundle_packs():
    index = json.loads((PACKS / "index.json").read_text(encoding="utf-8"))
    parts = []
    for folder in index.get("packs", []):
        d = PACKS / folder
        manifest = json.loads((d / "manifest.json").read_text(encoding="utf-8"))
        files = manifest.get("files", {})
        data = {"folder": folder, "manifest": manifest}
        for key in ("characters", "events", "fetishes", "contests", "gifts", "buildings", "regions"):
            if key in files:
                data[key] = []
                for f in as_list(files[key]):
                    data[key].extend(json.loads((d / f).read_text(encoding="utf-8")))
        if "names" in files:
            data["names"] = {}
            for f in as_list(files["names"]):
                for k, v in json.loads((d / f).read_text(encoding="utf-8")).items():
                    data["names"].setdefault(k, []).extend(v)
        js = "Object.assign(" + json.dumps(data, ensure_ascii=False) + ", {scenes: "
        scenes = [f for f in as_list(files.get("scenes", [])) if (d / f).exists()]
        if scenes:
            js += "function(){\n" + "\n".join((d / f).read_text(encoding="utf-8") for f in scenes) + "\n}"
        else:
            js += "null"
        js += "})"
        parts.append(js)
    return "window.__BUNDLED_PACKS__ = [\n" + ",\n".join(parts) + "\n];"


def main():
    css = read("css/style.css")
    fonts = (
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Noto+Serif:wght@500;700&display=swap">'
    )
    scripts = "\n".join(
        f"<script>\n{safe_js(s)}\n</script>"
        for s in [read("js/engine.js"), read("js/systems.js"), read("js/ui.js"), bundle_packs(), read("js/main.js")]
    )
    body = '<div id="app" class="app" aria-live="polite"></div>\n<div id="sheet" class="sheet" hidden></div>'
    head = (
        "<title>Tửu Sắc Đế Vương</title>\n"
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        f"{fonts}\n<style>\n{css}\n</style>"
    )
    DIST.mkdir(exist_ok=True)
    (DIST / "fragment.html").write_text(f"{head}\n{body}\n{scripts}\n", encoding="utf-8")
    full = (
        '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f"{head}\n</head>\n<body>\n{body}\n{scripts}\n</body>\n</html>\n"
    )
    (DIST / "index.html").write_text(full, encoding="utf-8")
    print("Đã tạo dist/index.html và dist/fragment.html")


if __name__ == "__main__":
    main()
