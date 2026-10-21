/*
 * Cảnh viết bằng JSON (không cần code).
 *
 * Gói khai báo trong manifest: "files": { "sceneTexts": "scene-texts.json" }
 *
 * Cấu trúc:
 * {
 *   "<hook>": {
 *     "_title": "Tiêu đề hiện trên cảnh (không bắt buộc)",
 *     "<khóa>": { "<mức>": [ ["đoạn 1", "đoạn 2", ...], ["phiên bản 2: đoạn 1", ...] ] }
 *   }
 * }
 *   Mỗi phần tử của danh sách là MỘT CẢNH (các đoạn nối tiếp, người chơi bấm "Tiếp" để sang đoạn sau).
 *   Mỗi đêm game bốc một cảnh, không lặp lại cho đến khi đã xem hết.
 *   Viết gọn ["đoạn 1", "đoạn 2"] (toàn chuỗi, không có ngoặc lồng) cũng được: cả danh sách là một cảnh.
 *   khóa: id nhân vật (ví dụ "core.tuyet"), id sở thích (ví dụ "core.lua_la"), hoặc "_chung"
 *   mức:  "dau" (đêm đầu), "quen" (vài lần), "lau" (hơn 20 đêm), hoặc "_" (dùng cho mọi lúc)
 *
 * Game tìm theo thứ tự: nhân vật chính → sở thích của cảnh → "_chung";
 * trong mỗi khóa: đúng mức thân mật → "quen" → "_". Không có gì thì dùng cảnh cũ của scenes.js.
 * Biến dùng được trong chữ: {name} {names} {emperor} {fetish}; riêng cảnh cuộc thi và Đại Điển có thêm {winner} (người thắng) và {contest} (tên cuộc thi). Dòng bắt đầu bằng "> " là lời thoại.
 */
(function () {
  "use strict";
  const G = window.Game;
  const texts = {};

  G.addPackSceneTexts = function (data, packId) {
    for (const [hook, byKey] of Object.entries(data || {})) {
      if (hook.startsWith("_")) continue;
      const dst = (texts[hook] = texts[hook] || {});
      for (const [key, val] of Object.entries(byKey || {})) {
        if (key === "_title") {
          if (val) dst._title = val;
          continue;
        }
        if (key.startsWith("_") && key !== "_chung") continue; // _ghi_chu, _vi_du...
        dst[key] = dst[key] || {};
        for (const [lv, arr] of Object.entries(val || {})) {
          const vers = G.sceneVersions(arr);
          if (vers.length) dst[key][lv] = (dst[key][lv] || []).concat(vers);
        }
      }
    }
  };
  /** Chuẩn hóa một ô thành danh sách cảnh, mỗi cảnh là danh sách đoạn. */
  G.sceneVersions = function (arr) {
    if (!Array.isArray(arr)) return [];
    const clean = (a) => a.map((x) => String(x).trim()).filter(Boolean);
    const vers = arr.some(Array.isArray) ? arr.map((x) => clean([].concat(x))) : [clean(arr)];
    return vers.filter((v) => v.length);
  };
  G.sceneTextStats = function () {
    let n = 0;
    let scenes = 0;
    const hooks = [];
    for (const [hook, byKey] of Object.entries(texts)) {
      let h = 0;
      for (const [k, byLv] of Object.entries(byKey))
        if (k !== "_title")
          for (const vers of Object.values(byLv)) {
            scenes += vers.length;
            for (const v of vers) h += v.length;
          }
      if (h) hooks.push(hook);
      n += h;
    }
    return { count: n, scenes, hooks };
  };

  const levelOf = (p) => (!p || p.nights === 0 ? "dau" : p.nights > 20 ? "lau" : "quen");

  function fillText(t, ctx) {
    const names = ctx.participants.map((p) => p.name);
    const list = names.length <= 1 ? names.join("") : names.slice(0, -1).join(", ") + " và " + names[names.length - 1];
    const fet = ctx.fetish.map((f) => (G.registry.fetishes[f] || {}).name || f).join(", ");
    return t
      .replace(/\{name\}/g, names[0] || "nàng")
      .replace(/\{names\}/g, list)
      .replace(/\{emperor\}/g, ctx.emperor.name)
      .replace(/\{fetish\}/g, fet || "ý bệ hạ")
      .replace(/\{winner\}/g, (ctx.extra && ctx.extra.winner) || names[0] || "nàng")
      .replace(/\{contest\}/g, (ctx.extra && ctx.extra.contestName) || "cuộc thi");
  }

  /**
   * Bốc một đoạn chưa hiện trong vòng này. Khi đã hiện hết mới bắt đầu vòng mới,
   * và đoạn đầu vòng mới không trùng đoạn cuối vòng trước. Ghi nhớ trong bản lưu (state.textSeen).
   */
  function pickUnseen(slot, arr) {
    const s = G.state;
    if (!s || arr.length === 1) return arr[Math.floor(Math.random() * arr.length)];
    const store = (s.textSeen = s.textSeen || {});
    const rec = store[slot] || { seen: [], last: -1 };
    let pool = [];
    for (let i = 0; i < arr.length; i++) if (!rec.seen.includes(i)) pool.push(i);
    if (!pool.length) {
      rec.seen = [];
      pool = arr.map((_, i) => i).filter((i) => i !== rec.last);
    }
    const i = pool[Math.floor(Math.random() * pool.length)];
    rec.seen.push(i);
    rec.last = i;
    store[slot] = rec;
    return arr[i];
  }

  function findText(hook, ctx) {
    const byKey = texts[hook];
    if (!byKey) return null;
    const p = ctx.participants[0];
    const keys = [...ctx.participants.map((x) => x.id), ...ctx.fetish, "_chung"];
    const lvs = [levelOf(p), "quen", "_"];
    for (const k of keys) {
      const byLv = byKey[k];
      if (!byLv) continue;
      for (const lv of lvs) {
        const arr = byLv[lv];
        if (arr && arr.length) return pickUnseen(`v2|${hook}|${k}|${lv}`, arr);
      }
    }
    return null;
  }

  /** Gọi sau khi nạp xong mọi gói: đăng ký đè các HOOK có chữ, giữ cảnh cũ làm dự phòng. */
  G.installSceneTexts = function () {
    for (const hook of Object.keys(texts)) {
      const prev = G.hooks.resolve(hook);
      G.hooks.register(
        hook,
        (ctx) => {
          const t = findText(hook, ctx);
          if (!t) return prev ? prev.fn(ctx) : null;
          const pages = t.map((x) => fillText(x, ctx));
          const base = texts[hook]._title || (prev && prev.fn(ctx) || {}).title || "Đêm ở hậu cung";
          const title = texts[hook]._title ? (ctx.participants.length > 1 ? `${base} · ${ctx.participants.length} người` : `${base} · ${(ctx.participants[0] || {}).name || ""}`) : base;
          return { title, text: pages.join("\n\n"), pages };
        },
        "scene-texts"
      );
    }
  };
})();
