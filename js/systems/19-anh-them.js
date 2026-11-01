/*
 * Ảnh thêm (đặt trên kho R2 cùng chỗ với ảnh đầu cảnh, đặt đúng tên là game tự nhận):
 *   - Ảnh toàn thân trong hồ sơ phi: tt-<tên>.webp, hoặc theo phẩm vị tt-<tên>-1/-2/-3.webp
 *     (1: Đáp ứng → Quý nhân, 2: Tần → Phi, 3: Quý phi trở lên). Phi không có ảnh riêng thì lấy ảnh chung
 *     tt-chung-001.webp, tt-chung-002.webp… (mỗi phi nhận cố định một ảnh).
 *   - Biểu tượng đồ vật: do-<mã>.webp (kho phòng the), ao-<mã>.webp (y phục), rieng-<mã>.webp (đồ riêng),
 *     bay-<mã>.webp (bày biện), kinh.webp (Tố Nữ Kinh). Danh sách mã xem docs/ANH-THEM.md.
 *   - Trò "Cởi từng lớp": mỗi bộ 4 ảnh coi-01-0.webp (còn đủ áo) … coi-01-3.webp (cởi hết 3 lớp), bộ sau coi-02-…
 *   - Trò ghép tranh: dùng ngẫu nhiên một ảnh trong kho ảnh đầu cảnh.
 * File nào chưa có thì game giữ cách hiển thị cũ.
 */
(function () {
  "use strict";
  const G = window.Game;
  const base = () => G.SCENE_ART_REMOTE || "";
  const MISS = "dvs.imgMiss";
  let miss;
  try {
    miss = new Set(JSON.parse(sessionStorage.getItem(MISS) || "[]"));
  } catch (e) {
    miss = new Set();
  }
  G.imgMissing = (url) => miss.has(url);
  G.markImgMissing = function (url) {
    if (!url || miss.has(url)) return;
    miss.add(url);
    try {
      sessionStorage.setItem(MISS, JSON.stringify([...miss].slice(-800)));
    } catch (e) {}
  };
  const exists = (url) =>
    new Promise((res) => {
      if (miss.has(url)) return res(false);
      const im = new Image();
      const t = setTimeout(() => res(false), 8000);
      im.onload = () => (clearTimeout(t), res(true));
      im.onerror = () => (clearTimeout(t), G.markImgMissing(url), res(false));
      im.src = url;
    });
  /** Dò dãy ảnh name(1), name(2)… đến khi trống `stop` số liền. Lưu tạm trong phiên. */
  async function probe(key, name, stop, batch) {
    try {
      const c = JSON.parse(sessionStorage.getItem("dvs.probe." + key) || "null");
      if (Array.isArray(c)) return c;
    } catch (e) {}
    const found = [];
    let i = 1, gap = 0;
    while (gap < stop && i < 500) {
      const nums = Array.from({ length: batch }, (_, k) => i + k);
      const ok = await Promise.all(nums.map((n) => exists(name(n))));
      ok.forEach((v, k) => {
        if (v) {
          found.push(nums[k]);
          gap = 0;
        } else gap++;
      });
      i += batch;
    }
    try {
      sessionStorage.setItem("dvs.probe." + key, JSON.stringify(found));
    } catch (e) {}
    return found;
  }
  const pad = (n, w) => String(n).padStart(w, "0");
  G.TT_POOL = [];
  G.UNDRESS_SETS = [];
  G.UNDRESS_LAYERS = 4; // ảnh 0 (đủ áo) … 3 (cởi hết)
  G.extraArtReady = (async () => {
    if (!base()) return;
    try {
      await G.sceneArtReady;
    } catch (e) {}
    let tt = [], coi = [];
    try {
      [tt, coi] = await Promise.all([
      probe("tt", (n) => `${base()}tt-chung-${pad(n, 3)}.webp`, 3, 5),
      probe("coi", (n) => `${base()}coi-${pad(n, 2)}-0.webp`, 2, 3),
      ]);
    } catch (e) {}
    G.TT_POOL = tt.map((n) => `${base()}tt-chung-${pad(n, 3)}.webp`);
    G.UNDRESS_SETS = coi;
  })();

  const hash = (str) => {
    let h = 0;
    for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };
  /** Tên dùng trong file ảnh: core.uyen_nghi → uyen-nghi */
  G.imgSlug = (c) => String((c && c.id) || "").split(".").pop().replace(/_/g, "-").toLowerCase();
  G.rankTier = (c) => (c.rank >= 5 ? 3 : c.rank >= 3 ? 2 : 1);

  /** Các đường dẫn ảnh toàn thân để thử lần lượt (đã bỏ file biết là thiếu). */
  G.fullBodyFor = function (c) {
    if (!c || c.isChild || !base()) return [];
    const slug = G.imgSlug(c);
    const out = [];
    for (let t = G.rankTier(c); t >= 1; t--) out.push(`${base()}tt-${slug}-${t}.webp`);
    out.push(`${base()}tt-${slug}.webp`);
    if (G.TT_POOL.length) out.push(G.TT_POOL[hash(c.id) % G.TT_POOL.length]);
    return out.filter((u) => !miss.has(u));
  };

  G.ICON_PREFIX = { bed: "do-", outfit: "ao-", keep: "rieng-", furn: "bay-" };
  /** Biểu tượng một món đồ, hoặc null nếu đã biết là chưa có. */
  G.iconFor = function (kind, id) {
    if (!base()) return null;
    const url = kind === "kinh" ? `${base()}kinh.webp` : G.ICON_PREFIX[kind] ? `${base()}${G.ICON_PREFIX[kind]}${id}.webp` : null;
    return url && !miss.has(url) ? url : null;
  };

  /** Bộ ảnh cho trò Cởi từng lớp: mảng 4 đường dẫn, hoặc null. */
  G.undressArt = function () {
    const sets = G.UNDRESS_SETS;
    if (!sets.length) return null;
    const n = sets[Math.floor(Math.random() * sets.length)];
    return Array.from({ length: G.UNDRESS_LAYERS }, (_, k) => `${base()}coi-${pad(n, 2)}-${k}.webp`);
  };

  /** Ảnh cho trò ghép tranh: một ảnh ngẫu nhiên trong kho ảnh đầu cảnh, hoặc null. */
  G.puzzleArt = function () {
    const pool = (G.SCENE_ART_POOL || []).filter((u) => /^https?:/.test(u) && !miss.has(u));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };
})();
