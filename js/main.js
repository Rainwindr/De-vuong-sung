/*
 * Bộ nạp gói.
 * - Chạy từ máy chủ (python -m http.server, GitHub Pages...): đọc packs/index.json rồi fetch từng gói.
 * - Bản build một file (dist/index.html): dữ liệu gói đã nhúng sẵn trong window.__BUNDLED_PACKS__.
 *
 * Trong manifest.files, mỗi loại dữ liệu có thể là một file hoặc danh sách file:
 *   "events": ["events/main.json", "events/daily.json"]
 */
(function () {
  "use strict";
  const G = window.Game;
  const LIST_KINDS = ["characters", "events", "fetishes", "contests", "rules", "gifts", "buildings", "regions"];

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    try {
      return await r.json();
    } catch (e) {
      throw new Error(`${url}: JSON lỗi (${e.message})`);
    }
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
        for (const key of LIST_KINDS) {
          if (!files[key]) continue;
          data[key] = [];
          for (const f of [].concat(files[key])) data[key].push(...(await fetchJSON(base + f)));
        }
        if (files.names) {
          data.names = {};
          for (const f of [].concat(files.names)) {
            const n = await fetchJSON(base + f);
            for (const k of Object.keys(n)) data.names[k] = (data.names[k] || []).concat(n[k]);
          }
        }
        fixAssetPaths(data, base);
        G.packBases[manifest.id] = base;
        if (G.loadPack(data)) {
          for (const f of [].concat(files.scenes || [])) await loadScript(base + f);
          for (const f of [].concat(files.sceneTexts || [])) G.addPackSceneTexts(await fetchJSON(base + f));
          for (const f of [].concat(files.portraits || [])) G.addPortraits(await fetchJSON(base + f), base);
        }
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
      const base = `packs/${p.folder}/`;
      fixAssetPaths(p, base);
      G.packBases[p.manifest.id] = base;
      if (G.loadPack(p)) {
        if (typeof p.scenes === "function") p.scenes(G);
        for (const st of [].concat(p.sceneTexts || [])) G.addPackSceneTexts(st);
        if (p.portraits) G.addPortraits(p.portraits, base);
      }
    }
  }

  async function boot() {
    try {
      if (window.__BUNDLED_PACKS__) {
        loadBundled();
        if (location.protocol === "file:") G.bundleMode = true;
      } else if (location.protocol === "file:") {
        throw new Error("đang mở thẳng file và chưa có packs/bundle.js");
      }
      else await loadFromServer();
    } catch (e) {
      G.registry.errors.push(
        location.protocol === "file:"
          ? "Bạn đang mở thẳng file index.html nên trình duyệt chặn đọc dữ liệu game. Hãy bấm đúp CHOI-GAME.bat (Windows) hoặc choi-game.command (Mac) để chơi, hoặc chạy python3 tools/build.py một lần."
          : "Không đọc được packs/index.json: " + e.message
      );
    }
    G.installSceneTexts();
    G.ui.renderGate();
  }

  boot();
})();
