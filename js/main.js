/*
 * Bộ nạp gói.
 * - Chạy từ máy chủ (python -m http.server, GitHub Pages...): đọc packs/index.json rồi fetch từng gói.
 * - Bản build một file (dist/index.html): dữ liệu gói đã nhúng sẵn trong window.__BUNDLED_PACKS__.
 */
(function () {
  "use strict";
  const G = window.Game;

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = () => reject(new Error("không tải được " + url));
      document.head.appendChild(s);
    });
  }

  async function loadFromServer() {
    const index = await fetchJSON("packs/index.json");
    for (const folder of index.packs || []) {
      const base = `packs/${folder}/`;
      try {
        const manifest = await fetchJSON(base + "manifest.json");
        const files = manifest.files || {};
        const data = { manifest };
        for (const key of ["characters", "events", "fetishes", "names"]) {
          if (files[key]) data[key] = await fetchJSON(base + files[key]);
        }
        // Đường dẫn ảnh trong gói là tương đối với thư mục gói
        fixAssetPaths(data, base);
        G.packBases[manifest.id] = base;
        if (G.loadPack(data) && files.scenes) await loadScript(base + files.scenes);
      } catch (e) {
        G.registry.errors.push(`[${folder}] ${e.message}`);
      }
    }
  }

  function fixAssetPaths(data, base) {
    for (const c of data.characters || []) {
      if (c.portrait && c.portrait.image && !/^(https?:|data:|\/)/.test(c.portrait.image)) c.portrait.image = base + c.portrait.image;
    }
  }

  function loadBundled() {
    for (const p of window.__BUNDLED_PACKS__) {
      fixAssetPaths(p, `packs/${p.folder}/`);
      G.packBases[p.manifest.id] = `packs/${p.folder}/`;
      if (G.loadPack(p) && typeof p.scenes === "function") p.scenes(G);
    }
  }

  async function boot() {
    try {
      if (window.__BUNDLED_PACKS__) loadBundled();
      else await loadFromServer();
    } catch (e) {
      G.registry.errors.push("Không đọc được packs/index.json: " + e.message + ". Hãy chạy qua máy chủ web, không mở file trực tiếp.");
    }
    G.ui.renderGate();
  }

  boot();
})();
