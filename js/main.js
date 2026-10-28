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

  /**
   * Nạp từ máy chủ, hai đợt để màn hình đầu hiện nhanh:
   *  1. Dữ liệu lõi của mọi gói (tải song song), nạp theo đúng thứ tự trong packs/index.json.
   *  2. Chữ của cảnh (phần nặng nhất) tải song song ở nền; xong mới cài vào game.
   */
  async function loadFromServer() {
    const index = await fetchJSON("packs/index.json");
    const folders = index.packs || [];
    const fetched = await Promise.all(
      folders.map(async (folder) => {
        const base = `packs/${folder}/`;
        try {
          const manifest = await fetchJSON(base + "manifest.json");
          const files = manifest.files || {};
          const data = { manifest };
          await Promise.all(
            LIST_KINDS.filter((k) => files[k]).map(async (key) => {
              const parts = await Promise.all([].concat(files[key]).map((f) => fetchJSON(base + f)));
              data[key] = [].concat(...parts);
            })
          );
          if (files.names) {
            data.names = {};
            for (const n of await Promise.all([].concat(files.names).map((f) => fetchJSON(base + f))))
              for (const k of Object.keys(n)) data.names[k] = (data.names[k] || []).concat(n[k]);
          }
          const portraits = await Promise.all([].concat(files.portraits || []).map((f) => fetchJSON(base + f)));
          return { folder, base, manifest, files, data, portraits };
        } catch (e) {
          return { folder, error: e };
        }
      })
    );
    const loaded = [];
    for (const p of fetched) {
      if (p.error) {
        G.registry.errors.push(`[${p.folder}] ${p.error.message}`);
        continue;
      }
      try {
        fixAssetPaths(p.data, p.base);
        G.packBases[p.manifest.id] = p.base;
        if (G.loadPack(p.data)) {
          for (const f of [].concat(p.files.scenes || [])) await loadScript(p.base + f);
          for (const m of p.portraits) G.addPortraits(m, p.base);
          loaded.push(p);
        }
      } catch (e) {
        G.registry.errors.push(`[${p.folder}] ${e.message}`);
      }
    }
    // đợt 2: chữ của cảnh, tải song song, nạp theo thứ tự gói (trả về trong object để không bị await nuốt)
    const texts = Promise.all(
      loaded.map((p) =>
        Promise.all([].concat(p.files.sceneTexts || []).map((f) => fetchJSON(p.base + f))).catch((e) => {
          G.registry.errors.push(`[${p.folder}] ${e.message}`);
          return [];
        })
      )
    ).then((lists) => {
      for (const list of lists) for (const st of list) G.addPackSceneTexts(st);
    });
    return { texts };
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
      else {
        const { texts } = await loadFromServer();
        // màn hình đầu hiện ngay; chữ cảnh nạp xong ở nền
        G.textsPending = texts
          .then(() => G.installSceneTexts())
          .catch((e) => G.registry.errors.push("Không nạp được chữ cảnh: " + e.message))
          .finally(() => (G.textsPending = null));
        G.ui.renderGate();
        return;
      }
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
