#!/usr/bin/env python3
"""
Đưa câu trả lời của Grok (hoặc AI khác) vào gói packs/canh-viet, không cần sửa JSON bằng tay.

Cách dùng:
  1. Chép nguyên câu trả lời của Grok vào một file chữ, ví dụ grok.txt
  2. Chạy:  python3 tools/them-canh.py grok.txt
     (nhiều file một lúc cũng được:  python3 tools/them-canh.py a.txt b.txt)

Câu trả lời có thể là:
  - một khối JSON  { "core.thi_tam": { "core.tuyet": { "dau": [...] } } }
  - hoặc chỉ một dòng/khối  "core.tuyet": { "dau": [...], ... }   → cần thêm  --hook core.thi_tam
  - hoặc khối sở thích mới  { "fetishes": [ {...} ], "scenes": { ... } }
Chữ thừa trước/sau khối JSON (lời chào, ```json ...) sẽ tự bỏ qua.
Đoạn mới được NỐI THÊM vào đoạn cũ, không xóa gì.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PACK = ROOT / "packs" / "canh-viet"
SCENES = PACK / "scene-texts"
NEW_FILE = SCENES / "8-canh-moi.json"
FETISH_FILE = PACK / "fetishes.json"


def extract_json(text, hook=None):
    t = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", t, flags=re.S)
    if fence:
        t = fence.group(1).strip()
    # Trường hợp Grok trả về  "id": { ... }  (không có ngoặc ngoài cùng) → bọc lại
    m = re.search(r'"[\w-]+(?:\.[\w-]+)+"\s*:\s*[{\[]', t)
    b = t.find("{")
    if m and (b < 0 or m.start() < b):
        end = t.rfind("}")
        t = "{" + t[m.start() : end + 1] + "}"
    else:
        if b < 0:
            raise ValueError("không tìm thấy khối JSON nào")
        t = t[b : t.rfind("}") + 1]
    t = re.sub(r",\s*([}\]])", r"\1", t)  # bỏ dấu phẩy thừa
    data = json.loads(t)
    if hook:
        data = {hook: data}
    return data


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_scene_file(path, data):
    # giữ kiểu "mỗi khóa một dòng" cho dễ đọc
    lines = ["{"]
    hooks = list(data.items())
    for hi, (hook, body) in enumerate(hooks):
        lines.append(f'  "{hook}": {{')
        items = list(body.items())
        for i, (k, v) in enumerate(items):
            comma = "," if i < len(items) - 1 else ""
            if isinstance(v, dict) and any(len(a) for a in v.values()):
                inner = json.dumps(v, ensure_ascii=False, indent=2).replace("\n", "\n    ")
                lines.append(f'    "{k}": {inner}{comma}')
            else:
                lines.append(f'    "{k}": {json.dumps(v, ensure_ascii=False)}{comma}')
        lines.append("  }" + ("," if hi < len(hooks) - 1 else ""))
    lines.append("}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def merge_scenes(scenes):
    files = {p: load(p) for p in sorted(SCENES.glob("*.json"))}
    added = 0
    for hook, body in scenes.items():
        if not isinstance(body, dict):
            print(f"  ! bỏ qua {hook}: không phải khối {{...}}")
            continue
        target = next((p for p, d in files.items() if hook in d), NEW_FILE)
        files.setdefault(target, load(target) if target.exists() else {})
        dst = files[target].setdefault(hook, {})
        for key, by_lv in body.items():
            if key == "_title":
                dst["_title"] = by_lv
                continue
            if isinstance(by_lv, list):  # Grok trả thẳng danh sách → coi là mức "_"
                by_lv = {"_": by_lv}
            slot = dst.setdefault(key, {})
            for lv, arr in by_lv.items():
                if lv not in ("dau", "quen", "lau", "_"):
                    print(f"  ! {hook} / {key}: mức '{lv}' không hợp lệ (chỉ dau, quen, lau, _), bỏ qua")
                    continue
                cur = slot.setdefault(lv, [])
                for s in arr:
                    s = str(s).strip()
                    if s and s not in cur:
                        cur.append(s)
                        added += 1
        print(f"  ✓ {hook} → {target.name}")
    for p, d in files.items():
        save_scene_file(p, d)
    return added


def merge_fetishes(fets):
    cur = load(FETISH_FILE)
    ids = {f["id"]: i for i, f in enumerate(cur)}
    for f in fets:
        if "id" not in f or not str(f["id"]).startswith("canh-viet."):
            print(f"  ! sở thích phải có id bắt đầu bằng 'canh-viet.': {f.get('id')}")
            continue
        if f["id"] in ids:
            cur[ids[f["id"]]] = f
            print(f"  ✓ cập nhật sở thích {f['id']}")
        else:
            cur.append(f)
            print(f"  ✓ thêm sở thích {f['id']}")
    FETISH_FILE.write_text(json.dumps(cur, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    args = sys.argv[1:]
    hook = None
    if "--hook" in args:
        i = args.index("--hook")
        hook = args[i + 1]
        del args[i : i + 2]
    if not args:
        print(__doc__)
        sys.exit(1)
    total = 0
    for name in args:
        print(f"▸ {name}")
        try:
            data = extract_json(pathlib.Path(name).read_text(encoding="utf-8"), hook)
        except Exception as e:
            print(f"  ✗ không đọc được JSON: {e}")
            print("    Mẹo: bảo Grok 'chỉ trả về JSON, không giải thích', rồi chép lại.")
            continue
        if isinstance(data, dict) and ("fetishes" in data or "scenes" in data):
            if data.get("fetishes"):
                merge_fetishes(data["fetishes"])
            if data.get("scenes"):
                total += merge_scenes(data["scenes"])
        elif isinstance(data, list):
            merge_fetishes(data)
        else:
            total += merge_scenes(data)
    print(f"\nĐã thêm {total} đoạn. Đang kiểm tra...")
    code = subprocess.call(["node", str(ROOT / "tools" / "validate.js")])
    if code == 0:
        subprocess.call([sys.executable, str(ROOT / "tools" / "build.py")])


if __name__ == "__main__":
    main()
