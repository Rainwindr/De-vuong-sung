/*
 * Đợt 6: Hoạt cảnh mốc lớn, Bản đồ cung, Trùng tu cung.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const R = G.registry;
  const { clamp, pick, shuffle, rand } = G.util;
  const log = (t, k) => G.log(t, k);
  const monthly = (fn) => G.monthlyHooks.push(fn);

  /* ================================================================== */
  /* ĐỢT 6 · Hoạt cảnh mốc lớn                                           */
  /* ================================================================== */
  // Hàng đợi hoạt cảnh cho giao diện (không lưu vào bản lưu). UI lấy ra bằng G.takeFx().
  G.fxQueue = [];
  G.pushFx = (fx) => {
    if (G.fxQueue.length < 6) G.fxQueue.push(fx);
  };
  G.takeFx = () => G.fxQueue.splice(0);
  const birthD6 = G.birth;
  G.birth = function (c) {
    const kids = birthD6(c);
    if (kids && kids.length) G.pushFx({ type: "petals", text: `${c.name} hạ sinh ${kids.length > 1 ? kids.length + " con" : kids[0].sex === "m" ? "hoàng tử" : "công chúa"}` });
    return kids;
  };
  const buildD6 = G.build;
  G.build = function (bid) {
    const r = buildD6(bid);
    if (r && r.ok) G.pushFx({ type: "stamp", text: "Khánh thành", sub: (R.buildings[bid] || {}).name });
    return r;
  };
  const ruleD6 = G.toggleRule;
  G.toggleRule = function (id) {
    const ok = ruleD6(id);
    if (ok && G.ruleEnabled(id)) G.pushFx({ type: "stamp", text: "Ban lệ", sub: (R.rules[id] || {}).name });
    return ok;
  };

  /* ---------------- Bản đồ hậu cung ---------------- */
  G.PALACES = {
    east: ["Ngưng Hương cung", "Thính Vũ cung", "Tê Phượng cung", "Lâm Nguyệt cung", "Vọng Xuân cung", "Hàm Yên cung"],
    west: ["Lưu Vân cung", "Bích Đào cung", "Tuyết Mai cung", "Thu Thủy cung", "Cẩm Tú cung", "Lan Chi cung"],
  };
  /** Mỗi phi ở một cung cố định (lưu lại), Hoàng hậu ở Khôn Ninh cung. */
  G.palaceMap = function () {
    const s = G.state;
    if (!s.d6) s.d6 = {};
    if (!s.d6.home) s.d6.home = {};
    const home = s.d6.home;
    const east = G.PALACES.east.map((name, i) => ({ id: "e" + i, name }));
    const west = G.PALACES.west.map((name, i) => ({ id: "w" + i, name }));
    const queen = { id: "kn", name: "Khôn Ninh cung", kind: "queen" };
    const all = east.concat(west, [queen]);
    const six = east.concat(west);
    const residents = {};
    for (const p of all) residents[p.id] = [];
    const ids = new Set(s.consorts.map((c) => c.id));
    for (const k of Object.keys(home)) if (!ids.has(k)) delete home[k];
    const sorted = [...s.consorts].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    for (const c of sorted) {
      if (c.rank === 7) {
        residents.kn.push(c);
        continue;
      }
      let h = home[c.id];
      if (!h || h === "kn" || !residents[h]) {
        // chọn cung ít người nhất, xen kẽ đông tây
        h = six.slice().sort((a, b) => residents[a.id].length - residents[b.id].length)[0].id;
        home[c.id] = h;
      }
      residents[h].push(c);
    }
    for (const k of Object.keys(residents)) residents[k].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    return { east, west, queen, all, residents };
  };
})();
