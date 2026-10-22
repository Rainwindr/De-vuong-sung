/* Giao diện. Chỉ đọc/ghi qua API của Game; không chứa luật chơi. */
(function () {
  "use strict";
  const G = window.Game;
  const R = G.registry;
  const UI = (G.ui = {});
  const $app = () => document.getElementById("app");
  const $sheet = () => document.getElementById("sheet");
  let tab = "log";
  let logFilter = "all";
  const queue = [];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  UI.esc = esc;
  const $ = (root, sel) => root.querySelector(sel);
  const on = (root, sel, ev, fn) => root.querySelectorAll(sel).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));

  /* ---------------- Mảnh giao diện dùng chung ---------------- */
  function hashHue(s) {
    let h = 0;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }
  function portrait(c, size) {
    const p = c.portrait || {};
    const hue = p.hue != null ? p.hue : hashHue(c.id || c.name);
    const mood = c.favor >= 70 ? " mood-high" : "";
    // Ảnh thật của gói (nếu có) phủ lên chân dung vẽ; ảnh lỗi thì tự gỡ, lộ chân dung vẽ bên dưới
    const src = c.isChild ? null : G.portraitImageFor(c) || p.image;
    const img = src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : "";
    return `<span class="portrait${size ? " " + size : ""}${mood}${c.isChild ? " child" : ""}" style="--h:${hue}" aria-hidden="true">${G.portraitSVG(c)}${img}</span>`;
  }
  const bar = (v, cls) => `<span class="bar${cls ? " " + cls : ""}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span>`;
  const meter = (label, v, cls) => `<div class="favor">${bar(v, cls)}<span>${esc(label)} ${Math.round(v)}</span></div>`;
  const notesHtml = (notes) => (notes && notes.length ? `<div class="notes">${notes.map((n) => `<span>${esc(n)}</span>`).join("")}</div>` : "");
  const pill = (t, cls) => `<span class="pill${cls ? " " + cls : ""}">${esc(t)}</span>`;
  const fmtMoney = (v) => (v >= 10000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + "k" : String(Math.round(v)));

  function formatText(t) {
    // Dòng bắt đầu bằng ">" là lời thoại
    return esc(t)
      .split("\n")
      .map((line) => (line.startsWith("&gt; ") ? `<span class="q">${line.slice(5)}</span>` : line))
      .join("\n");
  }

  /* ================================================================== */
  /* Màn mở đầu                                                          */
  /* ================================================================== */
  UI.renderGate = function () {
    const rating = (R.packs.map((p) => p.rating).find((r) => r) || "25+").replace(/\+$/, "");
    const canContinue = G.hasSave();
    const d = G.dynasty();
    const scen = Object.entries(G.SCENARIOS);
    $app().innerHTML = `
      <section class="gate">
        <div class="seal">帝</div>
        <h1><small>Mô phỏng hậu cung · ${esc(rating)}+</small>Tửu Sắc Đế Vương</h1>
        <p>Mười tám tuổi, bạn đăng cơ. Thiên hạ thái bình, chỉ có hậu cung còn trống. Lấp đầy nó, chinh phục từng mỹ nhân, để lại con cháu đầy nhà.</p>
        <div class="notice"><strong>Nội dung dành cho người từ ${esc(rating)} tuổi.</strong> Mọi nhân vật trưởng thành trong game đều từ 18 tuổi trở lên. Cảnh thân mật do các gói nội dung cung cấp và chỉ chạy khi nhân vật sẵn lòng.</div>
        <label class="check"><input type="checkbox" id="age-ok"> <span>Tôi xác nhận mình đủ ${esc(rating)} tuổi.</span></label>
        <div class="field"><label for="emp-name">Niên hiệu</label><input id="emp-name" value="Hạ Huyền Đế" maxlength="30" autocomplete="off"></div>
        <div class="field"><label for="scenario">Kịch bản</label><select id="scenario">${scen.map(([id, sc]) => `<option value="${id}">${esc(sc.name)}</option>`).join("")}</select><span class="hint" id="scen-desc">${esc(scen[0][1].desc)}</span></div>
        <label class="check"><input type="checkbox" id="god-on"> <span>Bật Thiên Đạo (God Mode). Lượt chơi này không tính thành tựu thường và huyết mạch.</span></label>
        <div class="actions">
          <button class="btn btn-primary" id="btn-new" disabled>Đăng cơ</button>
          ${d.last ? `<button class="btn" id="btn-heir" disabled>Đời sau: ${esc(d.last.name)} kế vị (${d.last.age} tuổi)</button>` : ""}
          ${canContinue ? `<button class="btn" id="btn-cont" disabled>Tiếp tục lượt đang chơi</button>` : ""}
        </div>
        ${[1, 2, 3].some((n) => G.slotInfo(n)) ? `<details><summary>Tải từ ô lưu</summary><div class="cards">${slotsHtml(false)}</div></details>` : ""}
        <details class="legacy" ${d.points ? "open" : ""}>
          <summary>Huyết mạch · ${d.points} điểm danh vọng</summary>
          <p class="hint">Điểm có được khi kết thúc một đời: mỗi con 1, mỗi cháu 2, mỗi thành tựu mới 5. Huyết mạch đã mua có hiệu lực cho mọi đời sau.</p>
          <div class="cards">${Object.entries(G.LEGACIES)
            .map(([id, L]) => {
              const owned = d.owned.includes(id);
              return `<div class="row-card"><div><b>${esc(L.name)}</b><br><span class="hint">${esc(L.desc)}</span></div>${owned ? pill("Đã có", "rank") : `<button class="btn btn-sm" data-legacy="${id}" ${d.points < L.cost ? "disabled" : ""}>${L.cost} điểm</button>`}</div>`;
            })
            .join("")}</div>
        </details>
        ${packSummary()}
      </section>`;
    const root = $app();
    const ok = $(root, "#age-ok");
    const btns = ["#btn-new", "#btn-cont", "#btn-heir"].map((s) => $(root, s)).filter(Boolean);
    ok.addEventListener("change", () => btns.forEach((b) => (b.disabled = !ok.checked)));
    $(root, "#scenario").addEventListener("change", (e) => ($(root, "#scen-desc").textContent = G.SCENARIOS[e.target.value].desc));
    const start = (extra) => {
      G.newState(Object.assign({ name: $(root, "#emp-name").value.trim() || "Hạ Huyền Đế", godMode: $(root, "#god-on").checked, scenario: $(root, "#scenario").value, legacies: G.dynasty().owned }, extra || {}));
      G.save();
      tab = "log";
      UI.render();
    };
    $(root, "#btn-new").addEventListener("click", () => start());
    const heir = $(root, "#btn-heir");
    if (heir) heir.addEventListener("click", () => start({ name: d.last.name + " Đế", age: d.last.age, generation: d.last.generation, scenario: "tu_do" }));
    const cont = $(root, "#btn-cont");
    if (cont)
      cont.addEventListener("click", () => {
        if (G.loadSave()) UI.render();
        else cont.textContent = "Bản lưu cũ không tương thích phiên bản này";
      });
    on(root, "[data-slot-load]", "click", (b) => {
      if (!ok.checked) return ok.focus();
      if (G.loadSlot(Number(b.dataset.slotLoad))) {
        G.save();
        tab = "log";
        UI.render();
      }
    });
    on(root, "[data-legacy]", "click", (b) => {
      if (G.buyLegacy(b.dataset.legacy)) UI.renderGate();
    });
  };

  function packSummary() {
    const errs = R.errors.length ? `<div class="notice err"><strong>${R.errors.length} lỗi khi nạp gói:</strong><br>${R.errors.slice(0, 5).map(esc).join("<br>")}</div>` : "";
    const bundle = G.bundleMode ? `<p class="hint">Đang chạy bản đóng gói (mở thẳng file). Sửa JSON xong thì chạy <span class="mono">python3 tools/build.py</span> hoặc dùng CHOI-GAME.bat để thấy thay đổi.</p>` : "";
    return `<p class="hint">Đã nạp ${R.packs.length} gói: ${R.packs.map((p) => esc(p.name)).join(", ")}.</p>${bundle}${errs}`;
  }

  /* ================================================================== */
  /* Màn chính                                                           */
  /* ================================================================== */
  UI.render = function () {
    const s = G.state;
    if (!s) return UI.renderGate();
    if (s.ended) return renderEnding();
    const tabs = [
      ["log", "Triều"],
      ["harem", "Hậu cung"],
      ["kids", "Con cháu"],
      ["me", "Bệ hạ"],
      ["palace", "Cung điện"],
    ];
    if (s.godMode) tabs.push(["god", "Thiên Đạo"]);
    $app().innerHTML = `
      <header class="topbar">
        <div class="who">
          <h2>${esc(s.emperorName)}</h2>
          <span class="date">${s.godMode ? '<span class="god-badge">Thiên Đạo · </span>' : ""}${s.age} tuổi · năm ${s.year}, th.${s.month}</span>
          <button class="icon-btn" id="b-menu" aria-label="Lưu game, gói nội dung và cài đặt">☰</button>
        </div>
        <div class="stats">${Object.entries(G.STATS)
          .map(([k, d]) => {
            const v = s.stats[k];
            const pct = k === "quocKho" ? Math.min(100, v / 200) : v;
            return `<div class="stat ${k}"><span class="k">${d.label}</span><span class="v">${k === "quocKho" ? fmtMoney(v) : Math.round(v)}</span>${bar(pct)}</div>`;
          })
          .join("")}</div>
        <nav class="tabs" role="tablist">${tabs.map(([id, l]) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${tab === id}">${l}</button>`).join("")}</nav>
      </header>
      <main id="view">${renderTab()}</main>
      <div class="dock"><div class="dock-inner">
        <button class="btn" id="b-summon">Lật thẻ</button>
        <button class="btn" id="b-actions">Ý chỉ</button>
        <button class="btn" id="b-next">+1 tháng</button>
        <button class="btn btn-primary" id="b-skip">Đến chuyện mới</button>
      </div></div>
      <div class="toast" id="toast" hidden></div>`;
    const root = $app();
    on(root, ".tab", "click", (b) => {
      tab = b.dataset.tab;
      UI.render();
      window.scrollTo(0, 0);
    });
    $(root, "#b-next").addEventListener("click", nextMonth);
    $(root, "#b-skip").addEventListener("click", skipToEvent);
    $(root, "#b-summon").addEventListener("click", openSummon);
    $(root, "#b-actions").addEventListener("click", openActions);
    $(root, "#b-menu").addEventListener("click", openMenu);
    bindTab(root);
    if (!$sheet().hidden) return;
    if (s.pendingTitles.length) openTitlePrompt();
  };

  function renderTab() {
    return ({ harem: renderHarem, kids: renderKids, me: () => renderFetish() + renderAch(), palace: renderPalace, god: renderGod }[tab] || renderLog)();
  }

  /* ---------------- Nhật ký ---------------- */
  const LOG_FILTERS = [
    ["all", "Tất cả", null],
    ["story", "Câu chuyện", ["story", "milestone", "goal", "ach"]],
    ["harem", "Hậu cung", ["harem", "pair", "diary"]],
    ["night", "Thị tẩm", ["night"]],
    ["child", "Con cháu", ["child"]],
  ];
  function renderGoals() {
    const s = G.state;
    if (!s.goals || !s.goals.list.length) return "";
    const done = s.goals.list.filter((g) => g.done).length;
    return `<div class="goals"><div class="section-head"><h3>Mục tiêu năm ${s.goals.year}</h3><span class="hint">${done}/${s.goals.list.length} · đủ ba được thưởng 1000 lượng</span></div>
      <ul>${s.goals.list
        .map((g) => {
          const d = G.goalDef(g.id);
          return d ? `<li class="${g.done ? "done" : ""}"><span class="tick">${g.done ? "✓" : ""}</span>${esc(d.text)}</li>` : "";
        })
        .join("")}</ul></div>`;
  }
  function renderLog() {
    const s = G.state;
    const f = LOG_FILTERS.find((x) => x[0] === logFilter) || LOG_FILTERS[0];
    const rows = s.log.filter((l) => !f[2] || f[2].includes(l.kind)).slice(0, 150);
    return `<section class="section">${renderGoals()}
      <div class="chips" role="group" aria-label="Lọc nhật ký">${LOG_FILTERS.map(([id, label]) => `<button class="chip" data-logf="${id}" aria-pressed="${logFilter === id}">${label}</button>`).join("")}</div>
      ${rows.length ? `<ul class="log">${rows.map((l) => `<li class="${esc(l.kind)}"><span class="when">${l.age}t · T${l.month}</span><span class="txt">${esc(l.text)}</span></li>`).join("")}</ul>` : `<p class="empty">Chưa có gì ở mục này.</p>`}
    </section>`;
  }

  /* ---------------- Hậu cung ---------------- */
  function consortCard(c, extra) {
    const p = G.partnerOf(c.id);
    return `<button class="consort" data-consort="${esc(c.id)}">
      ${portrait(c)}
      <span class="body">
        <span class="name">${esc(c.name)}</span>
        <span class="meta">${pill(G.displayTitle(c), "rank")} ${c.age} tuổi${c.kids ? ` · ${c.kids} con` : ""} ${c.pregnantDue != null ? pill("Hoài thai", "preg") : ""}${p && p.tinhY >= 61 ? " " + pill(p.status + " · " + p.other.name, "pair") : ""}</span>
        <span class="favor">${bar(c.favor)}<span>Sủng ái ${c.favor}</span></span>
        ${extra || ""}
      </span>
    </button>`;
  }

  function renderHarem() {
    const s = G.state;
    const list = [...s.consorts].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    const pairs = G.listPairs().filter((p) => p.tinhY >= 31);
    return `<section class="section">
      <div class="section-head"><h3>Hậu cung</h3><span class="hint">Chạm để ghé thăm, tặng quà, xem chi tiết</span></div>
      ${list.length ? `<div class="cards">${list.map((c) => consortCard(c)).join("")}</div>` : `<p class="empty">Hậu cung trống. Mở tuyển tú để nạp phi.</p>`}
      <div class="section-head"><h3>Đối thực</h3><span class="hint">Thái độ của bệ hạ: ${G.ATTITUDE_LABEL[s.attitude]}</span></div>
      ${
        pairs.length
          ? `<div class="scroll-x"><table class="mini-table"><tr><th>Cặp</th><th>Tình Ý</th><th>Trạng thái</th></tr>${pairs.map((p) => `<tr><td>${esc(p.a.name)} · ${esc(p.b.name)}</td><td>${Math.round(p.tinhY)}</td><td>${esc(p.status)}</td></tr>`).join("")}</table></div>`
          : `<p class="empty">Chưa có cặp nào thân thiết. Tình Ý tăng khi các phi học cùng lớp, cùng bị lạnh nhạt, hoặc hợp tính.</p>`
      }
      ${s.former.length ? `<p class="hint">Đã rời cung: ${s.former.map((f) => esc(f.name) + " (" + esc(f.reason) + ")").join(", ")}.</p>` : ""}
    </section>`;
  }

  /* ---------------- Con cháu ---------------- */
  function renderKids() {
    const s = G.state;
    if (!s.children.length) return `<section class="section"><p class="empty">Chưa có con. Hoàng tử, công chúa sẽ hiện ở đây cùng mẫu phi.</p></section>`;
    const sons = s.children.filter((c) => c.sex === "m").length;
    return `<section class="section">
      <div class="section-head"><h3>Gia phả</h3><span class="hint">${sons} hoàng tử · ${s.children.length - sons} công chúa · ${s.grandchildren.length} cháu</span></div>
      <div class="cards">${s.children
        .map((ch) => {
          const age = G.childAge(ch);
          const succ = s.successor === ch.id ? pill("Người kế vị", "rank") : "";
          return `<div class="kid">${portrait(G.childSpeaker(ch), "sm")}<div class="body">
            <b>${ch.sex === "m" ? "Hoàng tử" : "Công chúa"} ${esc(ch.name)}</b> ${succ}
            <span class="hint">${age} tuổi · mẹ ${esc(ch.motherName)} · ${esc(ch.trait)}${ch.trait2 ? ", " + esc(ch.trait2) : ""} · phẩm chất ${esc(ch.quality)}</span>
            <span class="hint">${ch.teacher ? "Thầy: " + esc(G.TEACHERS[ch.teacher].name) + " · " : ""}${ch.education ? "Học vấn " + esc(ch.education) + " · " : ""}${ch.title ? esc(ch.title) + " · " : ""}${ch.spouse ? "Đã thành thân với " + esc(ch.spouse) : ""}</span>
            ${meter("Thân thiết", ch.closeness, "gold")}
            ${s.godMode ? `<div class="slider"><label for="ca-${esc(ch.id)}">Tuổi</label><input type="range" id="ca-${esc(ch.id)}" data-childage="${esc(ch.id)}" min="0" max="40" value="${age}"><output>${age}</output></div>` : ""}
          </div></div>`;
        })
        .join("")}</div>
      ${s.grandchildren.length ? `<div class="section-head"><h3>Cháu</h3></div><p>${s.grandchildren.map((g) => `${esc(g.name)} <span class="hint">(con của ${esc(g.parentName)})</span>`).join(", ")}</p>` : ""}
    </section>`;
  }

  /* ---------------- Sở thích ---------------- */
  function renderFetish() {
    const s = G.state;
    const list = Object.values(R.fetishes).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
    if (!list.length) return `<p class="empty">Chưa có gói nào thêm sở thích.</p>`;
    const combos = [];
    for (const f of list) for (const cb of f.combos || []) combos.push({ a: f, b: R.fetishes[cb.with], cb });
    const tiers = [1, 2, 3].map((t) => list.filter((f) => f.tier === t)).filter((x) => x.length);
    return `<section class="section">
      <div class="section-head"><h3>Sở thích của bệ hạ</h3><span class="hint">Mở khóa theo Trụy lạc và tầng trước</span></div>
      ${tiers
        .map(
          (fs) => `<h4 class="tier-h">Tầng ${fs[0].tier}</h4>${fs
            .map((f) => {
              const un = G.fetishUnlocked(f.id);
              const lv = Math.round(s.fetish[f.id] || 0);
              return `<div class="fetish${un ? "" : " locked"}"><div class="row"><b>${esc(f.name)}</b><span class="tier">${un ? (lv >= 80 ? "NGHIỆN NẶNG" : "ĐÃ MỞ") : "CHƯA MỞ"}</span></div>
                ${un ? meter("Nghiện", lv, "red") : ""}
                ${f.desc ? `<span class="hint">${esc(f.desc)}</span>` : ""}</div>`;
            })
            .join("")}`
        )
        .join("")}
      ${combos.length ? `<h4 class="tier-h">Combo</h4><div class="scroll-x"><table class="mini-table">${combos.map((x) => `<tr><td>${esc(x.cb.name)}</td><td class="hint">${esc(x.a.name)} + ${esc(x.b ? x.b.name : x.cb.with)}</td><td>${s.flags["combo." + x.cb.hook] ? "Đã thử" : ""}</td></tr>`).join("")}</table></div>` : ""}
      <div class="notice">Độ nghiện từ 80 trở lên mà một năm không được thỏa mãn thì Long thể giảm mỗi tháng. Lặp lại đúng một bộ sở thích quá 5 lần liền sẽ nhạt dần.</div>
      <button class="btn" id="b-detox">Tu ở hành cung một năm (độ nghiện về 30, Trụy lạc −20)</button>
    </section>`;
  }

  /* ---------------- Cung điện ---------------- */
  function renderPalace() {
    const s = G.state;
    const blds = Object.values(R.buildings).sort((a, b) => a.cost - b.cost);
    return `<section class="section">
      <div class="section-head"><h3>Công trình</h3><span class="hint">Quốc khố ${fmtMoney(s.stats.quocKho)} lượng</span></div>
      <div class="cards">${blds
        .map((b) => {
          const built = s.buildings[b.id];
          const reqOk = !b.requires || G.checkWhen(b.requires, null, null);
          return `<div class="row-card"><div><b>${esc(b.name)}</b><br><span class="hint">${esc(b.desc || "")}</span>${!reqOk && !built && b.requiresText ? `<br><span class="hint err">${esc(b.requiresText)}</span>` : ""}</div>
            ${built ? pill("Đã xây", "rank") : `<button class="btn btn-sm" data-build="${esc(b.id)}" ${reqOk ? "" : "disabled"}>${fmtMoney(b.cost)}</button>`}</div>`;
        })
        .join("")}</div>
      <div class="section-head"><h3>Cung của phi tần</h3><span class="hint">Từ phẩm Tần trở lên, nâng tối đa 3 cấp</span></div>
      <div class="cards">${s.consorts
        .filter((c) => c.rank >= 3)
        .map((c) => `<div class="row-card"><div><b>${esc(c.name)}</b><br><span class="hint">${esc(G.displayTitle(c))} · cung cấp ${c.palace}</span></div>${c.palace >= 3 ? pill("Tối đa", "rank") : `<button class="btn btn-sm" data-upgrade="${esc(c.id)}">${fmtMoney(G.PALACE_COST[c.palace])}</button>`}</div>`)
        .join("") || `<p class="empty">Chưa có phi tần nào từ phẩm Tần.</p>`}</div>
    </section>`;
  }

  /* ---------------- Thành tựu và album ---------------- */
  function renderAch() {
    const s = G.state;
    const got = G.achievementsUnlocked();
    const list = G.ACHIEVEMENTS.filter((a) => (s.godMode ? a.god : !a.god));
    return `<section class="section">
      <div class="section-head"><h3>Thành tựu</h3><span class="hint">${list.filter((a) => got[a.id]).length}/${list.length}${s.godMode ? " · Thiên Đạo" : ""}</span></div>
      <div class="ach-grid">${list
        .map((a) => {
          const ok = !!got[a.id];
          return `<div class="ach${ok ? " ok" : ""}"><b>${ok || !a.hidden ? esc(a.name) : "???"}</b><span class="hint">${ok || !a.hidden ? esc(a.desc) : "Thành tựu ẩn"}</span></div>`;
        })
        .join("")}</div>
      <div class="section-head"><h3>Album</h3><span class="hint">${s.album.length} khoảnh khắc</span></div>
      ${s.album.length ? `<div class="album">${[...s.album].reverse().map((a) => `<figure><figcaption><b>${esc(a.title)}</b><span class="hint">${a.age} tuổi</span></figcaption><p>${esc(a.line)}</p></figure>`).join("")}</div>` : `<p class="empty">Các khoảnh khắc đáng nhớ sẽ được lưu ở đây.</p>`}
    </section>`;
  }

  /* ---------------- Gói ---------------- */
  function renderPacks() {
    const hooks = G.hooks.list();
    const count = (k) => Object.values(R[k]).length;
    return `<section class="section">
      <div class="section-head"><h3>Gói nội dung</h3><span class="hint">Thêm gói trong thư mục packs/</span></div>
      <div class="scroll-x"><table class="mini-table"><tr><th>Gói</th><th>Phiên bản</th><th>Tác giả</th></tr>
      ${R.packs.map((p) => `<tr><td>${esc(p.name)}<br><span class="mono">${esc(p.id)}</span></td><td>${esc(p.version)}</td><td>${esc(p.author)}</td></tr>`).join("")}</table></div>
      <p class="hint">${G.sceneTextStats().count} đoạn trong ${G.sceneTextStats().scenes} cảnh viết bằng JSON (${G.sceneTextStats().hooks.length} loại cảnh) · ${count("characters")} nhân vật · ${count("events")} sự kiện · ${count("fetishes")} sở thích · ${count("contests")} cuộc thi · ${count("gifts")} quà · ${count("buildings")} công trình · ${count("regions")} vùng</p>
      <details><summary>HOOK đã đăng ký (${hooks.length})</summary><div class="scroll-x"><table class="mini-table">${hooks.map((h) => `<tr><td class="mono">${esc(h.id)}</td><td>${esc(h.pack)}</td></tr>`).join("") || "<tr><td>Chưa có</td></tr>"}</table></div></details>
      <h4 class="tier-h">Lỗi và cảnh báo khi nạp</h4>
      ${R.errors.length ? R.errors.map((e) => `<div class="err mono">${esc(e)}</div>`).join("") : '<div class="ok">Không có lỗi.</div>'}
      ${R.warnings.map((e) => `<div class="mono hint">${esc(e)}</div>`).join("")}
      <button class="btn btn-sm btn-ghost" id="b-reset">Bỏ lượt này, về màn đầu</button>
    </section>`;
  }

  /* ---------------- Thiên Đạo ---------------- */
  function renderGod() {
    const s = G.state;
    const evs = Object.values(R.events).sort((a, b) => a.id.localeCompare(b.id));
    const cs = s.consorts;
    return `<section class="section god">
      <fieldset><legend>Chỉ số</legend>
        <p class="hint">Gõ số trực tiếp. Tick "Khóa" để chỉ số không đổi nữa.</p>
        ${Object.entries(G.STATS)
          .map(([k, d]) => {
            const max = k === "quocKho" ? 9999999 : 100;
            return `<div class="num-row"><label for="g-${k}">${d.label}</label><input type="number" inputmode="numeric" id="g-${k}" data-statnum="${k}" min="0" max="${max}" value="${Math.round(s.stats[k])}"><label class="check"><input type="checkbox" data-lock="${k}" ${s.godFlags.lockStats[k] ? "checked" : ""}> Khóa</label></div>`;
          })
          .join("")}
        <div class="row-wrap"><button class="btn btn-sm" data-money="10000">+10k lượng</button><button class="btn btn-sm" data-money="100000">+100k lượng</button><button class="btn btn-sm" data-maxstats="1">Mọi chỉ số tối đa</button></div>
        <div class="row-wrap">
          <label class="check"><input type="checkbox" data-godflag="infiniteMoney" ${s.godFlags.infiniteMoney ? "checked" : ""}> Ngân lượng vô hạn</label>
          <label class="check"><input type="checkbox" data-godflag="unlockAllFetish" ${s.godFlags.unlockAllFetish ? "checked" : ""}> Mở mọi sở thích</label>
          <label class="check"><input type="checkbox" data-godflag="alwaysConceive" ${s.godFlags.alwaysConceive ? "checked" : ""}> Lần nào cũng thụ thai</label>
        </div>
      </fieldset>
      <fieldset><legend>Bệ hạ</legend>
        <div class="num-row"><label for="g-eage">Tuổi</label><input type="number" id="g-eage" min="18" max="80" value="${s.age}"><button class="btn btn-sm" id="g-eage-set">Đặt</button></div>
        <div class="num-row"><label for="g-dyn">Huyết mạch</label><input type="number" id="g-dyn" value="100"><button class="btn btn-sm" id="g-dyn-add">Cộng điểm</button></div>
        <p class="hint">Đổi tuổi bệ hạ thì phi tần già hoặc trẻ đi theo, nhưng không ai dưới 18. Điểm huyết mạch hiện có: ${G.dynasty().points}.</p>
      </fieldset>
      <fieldset><legend>Hậu cung hàng loạt</legend>
        <div class="num-row"><label for="g-allfav">Sủng ái</label><input type="number" id="g-allfav" min="0" max="100" value="80"><button class="btn btn-sm" data-setall="favor">Đặt cho tất cả</button></div>
        <div class="num-row"><label for="g-allaff">Tình cảm</label><input type="number" id="g-allaff" min="0" max="100" value="80"><button class="btn btn-sm" data-setall="affection">Đặt cho tất cả</button></div>
        <div class="num-row"><label for="g-allcon">Đồng thuận</label><select id="g-allcon">${G.CONSENT.map((c) => `<option value="${c}">${G.CONSENT_LABEL[c]}</option>`).join("")}</select><button class="btn btn-sm" id="g-allcon-set">Đặt cho tất cả</button></div>
        <div class="row-wrap"><button class="btn btn-sm" id="g-birthnow">Mọi phi đang mang thai sinh tháng sau</button></div>
      </fieldset>
      <fieldset><legend>Độ nghiện sở thích</legend>
        <details><summary>${Object.keys(R.fetishes).length} sở thích</summary>
        ${Object.values(R.fetishes)
          .sort((a, b) => a.tier - b.tier)
          .map((f) => `<div class="num-row"><label for="g-f-${esc(f.id)}">${esc(f.name)}</label><input type="number" id="g-f-${esc(f.id)}" data-fet="${esc(f.id)}" min="0" max="100" value="${Math.round(s.fetish[f.id] || 0)}"><span class="hint">T${f.tier}</span></div>`)
          .join("")}
        </details>
      </fieldset>
      <fieldset><legend>Con cháu</legend>
        <div class="num-row"><label for="g-close">Thân thiết</label><input type="number" id="g-close" min="0" max="100" value="80"><button class="btn btn-sm" id="g-close-set">Đặt cho mọi con</button></div>
        <p class="hint">Chỉnh tuổi từng con trong tab Con cháu.</p>
      </fieldset>
      <fieldset><legend>Sự kiện</legend>
        <button class="btn btn-sm" id="g-resetseen">Cho mọi sự kiện "một lần" xảy ra lại</button>
      </fieldset>
      <fieldset><legend>Thời gian</legend>
        <div class="row-wrap"><button class="btn btn-sm" data-skip="1">+1 tháng</button><button class="btn btn-sm" data-skip="12">+1 năm</button><button class="btn btn-sm" data-skip="60">+5 năm</button><button class="btn btn-sm" id="g-rewind" ${s.snapshots.length ? "" : "disabled"}>Quay lại 1 năm (${s.snapshots.length})</button><button class="btn btn-sm" id="g-abdicate">Thoái vị ngay</button></div>
        <p class="hint">Tua nhanh bỏ qua sự kiện. Ảnh chụp để quay lại được lưu mỗi đầu năm, tối đa 10.</p>
      </fieldset>
      <fieldset><legend>Tạo phi tần</legend>
        <div class="field"><label for="g-name">Tên</label><input id="g-name" maxlength="40" placeholder="Ví dụ: Bạch Linh Lung"></div>
        <div class="field"><label for="g-age">Tuổi (tối thiểu 18)</label><input id="g-age" type="number" min="18" max="60" value="20"></div>
        <div class="field"><label for="g-rank">Phẩm</label><select id="g-rank">${G.RANKS.slice(0, 7).map((r, i) => `<option value="${i}">${r}</option>`).join("")}</select></div>
        <div class="field"><label for="g-consent">Mức đồng thuận mặc định</label><select id="g-consent">${G.CONSENT.map((c) => `<option value="${c}">${G.CONSENT_LABEL[c]}</option>`).join("")}</select></div>
        <button class="btn btn-sm btn-primary" id="g-create">Tạo</button>
      </fieldset>
      <fieldset><legend>Đối thực</legend>
        <div class="field"><label for="g-att">Thái độ của bệ hạ</label><select id="g-att">${G.ATTITUDE_LABEL.map((l, i) => `<option value="${i}" ${s.attitude === i ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        ${
          cs.length >= 2
            ? `<div class="field"><label for="g-pa">Cặp</label><div class="row-wrap"><select id="g-pa">${cs.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}</select><select id="g-pb">${cs.map((c, i) => `<option value="${esc(c.id)}" ${i === 1 ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div></div>
               <div class="slider"><label for="g-ty">Tình Ý</label><input type="range" id="g-ty" min="0" max="100" value="70"><output>70</output></div>
               <button class="btn btn-sm" id="g-setpair">Đặt Tình Ý</button>`
            : `<p class="hint">Cần ít nhất hai phi tần.</p>`
        }
      </fieldset>
      <fieldset><legend>Gọi sự kiện (bỏ qua điều kiện)</legend>
        <div class="field"><label for="g-ev">Sự kiện</label><select id="g-ev">${evs.map((e) => `<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.title)}</option>`).join("")}</select></div>
        <button class="btn btn-sm" id="g-fire">Gọi</button>
      </fieldset>
      <fieldset><legend>Nhật ký HOOK</legend>
        ${G.hookLog.length ? G.hookLog.slice(0, 15).map((h) => `<div class="mono ${h.ok ? "ok" : "err"}">${esc(h.id)} · ${h.ok ? esc(h.pack) : esc(h.reason)}</div>`).join("") : '<div class="mono">Chưa gọi HOOK nào.</div>'}
      </fieldset>
      <p class="hint">Thiên Đạo bỏ qua điều kiện cốt truyện, nhưng không bỏ qua quy tắc lõi: tuổi tối thiểu 18 và mức đồng thuận vẫn được kiểm tra trước mọi HOOK. Muốn một phi chịu một sở thích, chỉnh mức đồng thuận của nàng trong chi tiết phi tần.</p>
    </section>`;
  }

  function bindTab(root) {
    const s = G.state;
    on(root, "[data-consort]", "click", (b) => openConsort(b.dataset.consort));
    on(root, "[data-logf]", "click", (b) => {
      logFilter = b.dataset.logf;
      UI.render();
    });
    on(root, "#b-reset", "click", () => {
      G.clearSave();
      G.state = null;
      UI.renderGate();
    });
    on(root, "#b-detox", "click", () => {
      G.detox();
      G.save();
      if (s.ended) return UI.render();
      showMessage("Hành cung", "Một năm thanh tu trôi qua. Bệ hạ trở về, tâm thần nhẹ nhõm.", ["Trụy lạc −20", "Độ nghiện tối đa 30"]);
    });
    on(root, "[data-build]", "click", (b) => {
      const r = G.build(b.dataset.build);
      if (r) showMessage(r.ok ? "Khánh thành" : "Chưa thể xây", r.text, r.notes);
    });
    on(root, "[data-upgrade]", "click", (b) => {
      const r = G.upgradePalace(b.dataset.upgrade);
      if (r) showMessage(r.ok ? "Nâng cung" : "Chưa thể nâng", r.text, r.notes);
    });
    on(root, "[data-childage]", "input", (inp) => (inp.nextElementSibling.textContent = inp.value));
    on(root, "[data-childage]", "change", (inp) => {
      G.god.setChildAge(inp.dataset.childage, inp.value);
      G.save();
      UI.render();
    });
    if (tab !== "god") return;
    const keepRender = () => {
      const y = window.scrollY;
      G.save();
      UI.render();
      window.scrollTo(0, y);
    };
    on(root, "[data-statnum]", "change", (inp) => {
      G.god.setStat(inp.dataset.statnum, inp.value);
      keepRender();
    });
    on(root, "[data-lock]", "change", (inp) => {
      G.god.lockStat(inp.dataset.lock, inp.checked);
      G.save();
    });
    on(root, "[data-money]", "click", (b) => {
      G.god.setStat("quocKho", s.stats.quocKho + Number(b.dataset.money));
      keepRender();
    });
    on(root, "[data-maxstats]", "click", () => {
      for (const k of ["longThe", "danTam", "hoaKhi"]) G.god.setStat(k, 100);
      keepRender();
    });
    on(root, "#g-eage-set", "click", () => {
      G.god.setEmperorAge($(root, "#g-eage").value);
      keepRender();
    });
    on(root, "#g-dyn-add", "click", () => {
      G.god.addDynasty($(root, "#g-dyn").value);
      keepRender();
    });
    on(root, "[data-setall]", "click", (b) => {
      const f = b.dataset.setall;
      G.god.setAll(f, $(root, f === "favor" ? "#g-allfav" : "#g-allaff").value);
      keepRender();
    });
    on(root, "#g-allcon-set", "click", () => {
      G.god.setAllConsent($(root, "#g-allcon").value);
      keepRender();
    });
    on(root, "#g-birthnow", "click", () => {
      G.god.endPregnancies();
      keepRender();
    });
    on(root, "[data-fet]", "change", (inp) => {
      G.god.setFetish(inp.dataset.fet, inp.value);
      G.save();
    });
    on(root, "#g-close-set", "click", () => {
      G.god.setAllCloseness($(root, "#g-close").value);
      keepRender();
    });
    on(root, "#g-resetseen", "click", () => {
      G.god.resetSeen();
      keepRender();
    });
    on(root, "[data-godflag]", "change", (inp) => {
      s.godFlags[inp.dataset.godflag] = inp.checked;
      G.save();
    });
    on(root, "[data-skip]", "click", (b) => {
      G.god.skipMonths(Number(b.dataset.skip));
      G.save();
      UI.render();
    });
    on(root, "#g-rewind", "click", () => {
      G.god.rewindYear();
      G.save();
      UI.render();
    });
    on(root, "#g-abdicate", "click", () => {
      G.abdicate();
      G.save();
      UI.render();
    });
    on(root, "#g-create", "click", () => {
      const lvl = $(root, "#g-consent").value;
      const consent = {};
      for (const f of Object.keys(R.fetishes)) consent[f] = lvl;
      const c = G.god.createConsort({ name: $(root, "#g-name").value, age: $(root, "#g-age").value, rank: $(root, "#g-rank").value, consent });
      G.save();
      if (c) showMessage("Thiên Đạo", `${c.name}, ${c.age} tuổi, đã nhập cung với phẩm ${G.RANKS[c.rank]}.`);
    });
    on(root, "#g-att", "change", (sel) => {
      G.god.setAttitude(sel.value);
      G.save();
    });
    on(root, "#g-ty", "input", (inp) => (inp.nextElementSibling.textContent = inp.value));
    on(root, "#g-setpair", "click", () => {
      G.god.setTinhY($(root, "#g-pa").value, $(root, "#g-pb").value, $(root, "#g-ty").value);
      G.save();
      showMessage("Thiên Đạo", "Đã đặt Tình Ý.");
    });
    on(root, "#g-fire", "click", () => {
      const ev = G.god.forceEvent($(root, "#g-ev").value);
      if (ev && ev.choices.length) showEvent(ev);
      else showMessage("Thiên Đạo", "Sự kiện này cần một người nói chưa có trong game (ví dụ cần có con, hoặc có hai phi tần).");
    });
  }

  /* ================================================================== */
  /* Bảng trượt                                                          */
  /* ================================================================== */
  function openSheet(html, onBind, opts) {
    const el = $sheet();
    el.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true">${html}</div>`;
    el.hidden = false;
    el.dataset.dismiss = opts && opts.locked ? "no" : "";
    el.onclick = (e) => {
      if (e.target === el && el.dataset.dismiss !== "no") closeSheet();
    };
    $(el, ".sheet-card").scrollTop = 0;
    if (onBind) onBind(el);
    const first = el.querySelector("button");
    if (first) first.focus({ preventScroll: true });
  }
  function closeSheet() {
    const el = $sheet();
    el.hidden = true;
    el.innerHTML = "";
    el.dataset.dismiss = "";
    G.save();
    if (queue.length) queue.shift()();
    else UI.render();
  }
  UI.closeSheet = closeSheet;

  function showMessage(title, text, notes) {
    openSheet(`<h3>${esc(title)}</h3><p class="ev-text">${formatText(text || "")}</p>${notesHtml(notes)}<button class="btn btn-primary" id="s-ok">Tiếp</button>`, (el) => $(el, "#s-ok").addEventListener("click", closeSheet));
  }

  /** Cảnh nhiều đoạn: hiện từng đoạn, bấm "Tiếp" để sang đoạn sau; đoạn cuối mới hiện hệ quả và nút kết thúc. */
  function showScene(scene, notes, page) {
    const pages = scene.pages && scene.pages.length ? scene.pages : [scene.text || ""];
    const i = Math.min(page || 0, pages.length - 1);
    const last = i === pages.length - 1;
    const img = scene.image
      ? `<img class="scene-img" src="${esc(scene.image)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'scene-veil',textContent:'· · ·'}))">`
      : `<div class="scene-veil">· · ·</div>`;
    const dots = pages.length > 1 ? `<div class="scene-dots" aria-label="Đoạn ${i + 1} trên ${pages.length}">${pages.map((_, k) => `<i class="${k === i ? "on" : k < i ? "done" : ""}"></i>`).join("")}</div>` : "";
    const btns = last
      ? `${notesHtml(notes || scene.notes)}<button class="btn btn-primary" id="s-ok">${scene.blocked ? "Đóng" : "Sáng hôm sau"}</button>`
      : `<div class="choices scene-nav"><button class="btn btn-primary" id="s-next">Tiếp · ${i + 1}/${pages.length}</button><button class="btn btn-ghost btn-sm" id="s-all">Đọc liền một mạch</button></div>`;
    openSheet(`${i === 0 ? img : ""}<h3>${esc(scene.title || "")}</h3>${dots}<p class="ev-text">${formatText(pages[i])}</p>${btns}`, (el) => {
      if (last) $(el, "#s-ok").addEventListener("click", closeSheet);
      else {
        $(el, "#s-next").addEventListener("click", () => showScene(scene, notes, i + 1));
        $(el, "#s-all").addEventListener("click", () => showScene(Object.assign({}, scene, { pages: [pages.slice(i).join("\n\n")] }), notes, 0));
      }
    }, last ? undefined : { locked: true });
  }

  function eventHead(prepared) {
    const sp = prepared.speaker;
    const sp2 = prepared.speaker2;
    if (!sp) return `<div class="ev-head"><div class="t"><span class="eyebrow">Sự kiện</span><h3>${esc(prepared.title)}</h3></div></div>`;
    const inHarem = !sp.isChild && G.findConsort(sp.id);
    const sub = sp.isChild ? `${sp.sex === "m" ? "Hoàng tử" : "Công chúa"} · ${sp.age} tuổi` : inHarem ? G.displayTitle(sp) : "Người lạ";
    return `<div class="ev-head"><span class="duo">${portrait(sp, "lg")}${sp2 ? portrait(sp2, "lg") : ""}</span><div class="t"><span class="eyebrow">${esc(sp.name)}${sp2 ? " · " + esc(sp2.name) : " · " + esc(sub)}</span><h3>${esc(prepared.title)}</h3></div></div>`;
  }

  function showEvent(prepared) {
    openSheet(
      `${eventHead(prepared)}<p class="ev-text">${formatText(prepared.text)}</p>
       <div class="choices">${prepared.choices.map((c) => `<button class="btn" data-choice="${c.index}">${esc(c.label)}${c.cost ? `<span class="cost">−${fmtMoney(c.cost)} lượng</span>` : ""}</button>`).join("")}</div>`,
      (el) =>
        on(el, "[data-choice]", "click", (b) => {
          const res = G.choose(prepared, Number(b.dataset.choice));
          G.save();
          if (G.state.ended) return closeSheet();
          if (res.scene) showScene(res.scene, res.notes);
          else if (res.after || res.notes.length) showMessage(prepared.title, res.after || "Ý chỉ đã ban.", res.notes);
          else closeSheet();
        }),
      { locked: true }
    );
  }
  UI.showEvent = showEvent;
  /** Sự kiện thứ hai trong tháng: bỏ qua nếu sau sự kiện trước người nói đã rời cung hoặc game đã kết thúc. */
  function showLaterEvent(prepared) {
    const sp = prepared.speaker;
    const gone = G.state.ended || (sp && !sp.isChild && prepared.ev.when && prepared.ev.when.speakerInHarem && !G.findConsort(sp.id));
    if (!gone) return showEvent(prepared);
    if (queue.length) queue.shift()();
    else UI.render();
  }

  /* ---------------- Qua tháng ---------------- */
  function toast(text) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 2200);
  }

  function skipToEvent() {
    const r = G.advanceUntilEvent(24);
    G.save();
    for (const b of r.births) {
      const label = b.kids.map((k) => (k.sex === "m" ? "hoàng tử " : "công chúa ") + k.name).join(" và ");
      queue.push(() => showMessage("Tin vui", `${b.mother.name} hạ sinh ${label}. Toàn cung chúc mừng.`, [`Sủng ái ${b.mother.name} +5`]));
    }
    if (r.event) queue.push(() => showEvent(r.event));
    if (r.event2) queue.push(() => showLaterEvent(r.event2));
    if (queue.length) queue.shift()();
    else UI.render();
    if (r.months > 1) toast(`Đã qua ${r.months} tháng`);
  }

  function nextMonth() {
    const r = G.advanceMonth();
    G.save();
    for (const b of r.births) {
      const label = b.kids.map((k) => (k.sex === "m" ? "hoàng tử " : "công chúa ") + k.name).join(" và ");
      queue.push(() => showMessage("Tin vui", `${b.mother.name} hạ sinh ${label}. Toàn cung chúc mừng.`, [`Sủng ái ${b.mother.name} +5`]));
    }
    if (r.event) queue.push(() => showEvent(r.event));
    if (r.event2) queue.push(() => showLaterEvent(r.event2));
    if (queue.length) queue.shift()();
    else UI.render();
  }

  /* ---------------- Ý chỉ (hành động) ---------------- */
  function openActions() {
    const s = G.state;
    const selWhy = G.selectionStatus();
    const ctWhy = G.contestStatus();
    openSheet(
      `<h3>Ý chỉ</h3>
       <div class="cards">
         <div class="row-card"><div><b>Tuyển tú</b><br><span class="hint">${esc(selWhy || `Mỗi năm một lần, ${G.SELECTION_COST} lượng. Chọn trong bốn tú nữ.`)}</span></div><button class="btn btn-sm" id="a-select" ${selWhy ? "disabled" : ""}>Mở</button></div>
         <div class="row-card"><div><b>Tuần du</b><br><span class="hint">${G.canTravel() ? "Mỗi năm một chuyến. Mỗi vùng có mỹ nhân và chuyện riêng." : "Năm nay đã tuần du rồi."}</span></div><button class="btn btn-sm" id="a-travel" ${G.canTravel() ? "" : "disabled"}>Chọn vùng</button></div>
         <div class="row-card"><div><b>Mở cuộc thi</b><br><span class="hint">${esc(ctWhy || `${G.CONTEST_COST} lượng mỗi lần, ${G.CONTEST_COOLDOWN} tháng mới mở lại. Mùa thi tự đến vào tháng ${G.CONTEST_MONTHS.join(" và ")}.`)}</span></div><button class="btn btn-sm" id="a-contest" ${ctWhy ? "disabled" : ""}>Mở</button></div>
         <div class="row-card"><div><b>Tặng quà, xuất cung, học phường</b><br><span class="hint">Chạm vào từng phi trong tab Hậu cung.</span></div><button class="btn btn-sm" id="a-harem">Hậu cung</button></div>
         <div class="row-card"><div><b>Xây dựng</b><br><span class="hint">Công trình và nâng cung phi tần.</span></div><button class="btn btn-sm" id="a-palace">Cung điện</button></div>
       </div>
       <p class="hint">Thu nhập mỗi tháng: ${G.monthlyIncome()} lượng (tăng theo Dân tâm).</p>
       <button class="btn btn-ghost" id="a-close">Đóng</button>`,
      (el) => {
        $(el, "#a-close").addEventListener("click", closeSheet);
        on(el, "#a-select", "click", openSelection);
        on(el, "#a-travel", "click", openTravel);
        on(el, "#a-contest", "click", () => {
          const ev = G.openContest();
          if (ev) showEvent(ev);
          else showMessage("Mở cuộc thi", G.contestStatus() || "Chưa mở được cuộc thi.");
        });
        on(el, "#a-harem", "click", () => {
          tab = "harem";
          closeSheet();
        });
        on(el, "#a-palace", "click", () => {
          tab = "palace";
          closeSheet();
        });
      }
    );
  }

  /* ---------------- Menu: lưu, gói, về màn đầu ---------------- */
  function slotsHtml(withSave) {
    return [1, 2, 3]
      .map((n) => {
        const info = G.slotInfo(n);
        const desc = info ? `${esc(info.name)} · ${info.age} tuổi · năm ${info.year} · ${info.harem} phi · ${info.kids} con${info.ended ? " · đã kết thúc" : ""}` : "Trống";
        return `<div class="row-card"><div><b>Ô ${n}</b><br><span class="hint">${desc}</span></div><div class="row-wrap">
          ${withSave ? `<button class="btn btn-sm" data-slot-save="${n}">Lưu</button>` : ""}
          ${info ? `<button class="btn btn-sm" data-slot-load="${n}">Tải</button>` : ""}
        </div></div>`;
      })
      .join("");
  }
  function bindSlots(el, after) {
    on(el, "[data-slot-save]", "click", (b) => {
      G.saveSlot(Number(b.dataset.slotSave));
      after ? after() : openMenu();
    });
    on(el, "[data-slot-load]", "click", (b) => {
      if (G.loadSlot(Number(b.dataset.slotLoad))) {
        G.save();
        tab = "log";
        closeSheet();
      } else showMessage("Không tải được", "Bản lưu này thuộc phiên bản khác hoặc đã hỏng.");
    });
  }
  function openMenu() {
    openSheet(
      `<h3>Lưu game</h3><p class="hint">Game tự lưu sau mỗi lượt. Lưu thêm vào ô để giữ một mốc quay lại.</p>
       <div class="cards">${slotsHtml(true)}</div>
       <details><summary>Chuyển sang máy khác</summary>
         <p class="hint">Chép mã lưu này, dán vào ô Nhập ở máy kia.</p>
         <div class="field"><label for="m-code">Mã lưu</label><textarea id="m-code" rows="3" readonly></textarea></div>
         <div class="row-wrap"><button class="btn btn-sm" id="m-export">Tạo mã</button><button class="btn btn-sm" id="m-copy">Chép</button></div>
         <div class="field"><label for="m-import">Nhập mã lưu</label><textarea id="m-import" rows="3" placeholder="Dán mã vào đây"></textarea></div>
         <button class="btn btn-sm" id="m-doimport">Nhập</button>
       </details>
       ${renderPacks()}
       <button class="btn btn-ghost" id="m-close">Đóng</button>`,
      (el) => {
        bindSlots(el);
        $(el, "#m-close").addEventListener("click", closeSheet);
        $(el, "#m-export").addEventListener("click", () => ($(el, "#m-code").value = G.exportSave()));
        $(el, "#m-copy").addEventListener("click", () => {
          const t = $(el, "#m-code");
          if (!t.value) t.value = G.exportSave();
          const done = () => ($(el, "#m-copy").textContent = "Đã chép");
          try {
            navigator.clipboard.writeText(t.value).then(done, () => (t.select(), done()));
          } catch (e) {
            t.select();
          }
        });
        $(el, "#m-doimport").addEventListener("click", () => {
          if (G.importSave($(el, "#m-import").value)) {
            G.save();
            tab = "log";
            closeSheet();
          } else showMessage("Không nhập được", "Mã lưu không hợp lệ hoặc thuộc phiên bản khác.");
        });
        on(el, "#b-reset", "click", () => {
          G.clearSave();
          G.state = null;
          $sheet().hidden = true;
          UI.renderGate();
        });
      }
    );
  }

  /* ---------------- Phong hiệu ---------------- */
  const TITLE_SUGGEST = ["Thục", "Hiền", "Đức", "Lệ", "Mỹ", "Ninh", "Uyển", "Dung", "Nhu", "Tĩnh", "Hoa", "Diễm"];
  function openTitlePrompt() {
    const s = G.state;
    const id = s.pendingTitles[0];
    const c = G.findConsort(id);
    if (!c) {
      s.pendingTitles.shift();
      return UI.render();
    }
    openSheet(
      `<div class="ev-head">${portrait(c, "lg")}<div class="t"><span class="eyebrow">Lễ sắc phong · ${G.RANKS[c.rank]}</span><h3>${esc(c.name)}</h3></div></div>
       <p class="ev-text">Thánh chỉ đã soạn, chỉ còn chờ bệ hạ ban phong hiệu.</p>
       <div class="row-wrap">${TITLE_SUGGEST.map((t) => `<button class="btn btn-sm" data-t="${t}">${t} ${G.RANKS[c.rank]}</button>`).join("")}</div>
       <div class="field"><label for="t-own">Hoặc tự đặt</label><input id="t-own" maxlength="12" placeholder="Một hai chữ"></div>
       <div class="choices"><button class="btn btn-primary" id="t-ok">Ban phong hiệu</button></div>`,
      (el) => {
        on(el, "[data-t]", "click", (b) => ($(el, "#t-own").value = b.dataset.t));
        $(el, "#t-ok").addEventListener("click", () => {
          G.setTitle(c.id, $(el, "#t-own").value || pick(TITLE_SUGGEST));
          showMessage("Lễ sắc phong", `${c.name} quỳ tạ ân, từ nay là ${G.displayTitle(c)}.`);
        });
      },
      { locked: true }
    );
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------------- Chi tiết phi tần ---------------- */
  function openConsort(id) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c) return;
    const fets = Object.values(R.fetishes).sort((a, b) => a.tier - b.tier);
    const canCrown = !s.consorts.some((x) => x.rank === 7) && c.favor >= 70;
    const partner = G.partnerOf(c.id);
    const gifts = Object.values(R.gifts).sort((a, b) => a.cost - b.cost);
    openSheet(
      `<div class="ev-head">${portrait(c, "lg")}<div class="t"><span class="eyebrow">${esc(G.displayTitle(c))} · ${c.age} tuổi</span><h3>${esc(c.name)}</h3><span class="hint">${esc(c.origin)}</span></div></div>
       ${meter("Sủng ái", c.favor)}
       ${meter("Tình cảm", c.affection, "gold")}
       <div class="row-wrap">${c.traits.map((t) => pill(t)).join("")}</div>
       <p class="hint">${c.nights} đêm thị tẩm · ${c.kids} con${c.contestWins ? ` · ${c.contestWins} lần thắng thi` : ""}${partner && partner.tinhY >= 31 ? ` · ${partner.status} với ${esc(partner.other.name)} (${Math.round(partner.tinhY)})` : ""}</p>
       <div class="choices">
         <button class="btn" id="c-visit">Ghé thăm</button>
         <button class="btn" id="c-night" ${G.cannotSummon(c) ? "disabled" : ""}>Triệu thị tẩm${c.pregnantDue != null ? " (đang hoài thai)" : ""}</button>
         ${canCrown ? `<button class="btn" id="c-crown">Lập làm Hoàng hậu</button>` : ""}
       </div>
       <details><summary>Tặng quà</summary><div class="cards">${gifts
         .map((g) => `<div class="row-card"><div><b>${esc(g.name)}</b>${(g.likes || []).some((l) => c.likes.includes(l) || c.traits.includes(l) || l === c.id) ? " ♥" : ""}<br><span class="hint">${esc(g.desc || "")}${c.gifts[g.id] ? ` · đã tặng ${c.gifts[g.id]} lần` : ""}</span></div><button class="btn btn-sm" data-gift="${esc(g.id)}">${fmtMoney(g.cost)}</button></div>`)
         .join("")}</div></details>
       <details><summary>Học phường</summary>
         <div class="field"><label for="c-school">Lớp</label><select id="c-school"><option value="">Không học</option>${Object.entries(G.SUBJECTS).map(([k, v]) => `<option value="${k}" ${c.school === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
         <p class="hint">Các phi học chung lớp thân nhau hơn. Học đủ 12 tháng được trait tinh thông.${c.school ? ` Đã học ${c.schoolMonths} tháng.` : ""}</p>
       </details>
       ${
         fets.length
           ? `<details ${s.godMode ? "open" : ""}><summary>Sở thích và mức sẵn lòng</summary><div class="scroll-x"><table class="mini-table">${fets
               .map((f) => {
                 const lvl = G.consentOf(c, f.id);
                 const cell = s.godMode
                   ? `<select data-consent="${esc(f.id)}">${G.CONSENT.map((x) => `<option value="${x}" ${x === lvl ? "selected" : ""}>${G.CONSENT_LABEL[x]}</option>`).join("")}</select>`
                   : `${esc(G.CONSENT_LABEL[lvl])}${lvl === "persuade" && G.fetishUnlocked(f.id) ? ` <button class="btn btn-sm" data-persuade="${esc(f.id)}">Thuyết phục</button>` : ""}`;
                 return `<tr><td>${esc(f.name)}${c.likes.includes(f.id) ? " ♥" : ""}<br><span class="hint">Tầng ${f.tier}${G.fetishUnlocked(f.id) ? "" : " · chưa mở"}</span></td><td>${cell}</td></tr>`;
               })
               .join("")}</table></div></details>`
           : ""
       }
       ${
         s.godMode
           ? `<details open><summary>Thiên Đạo</summary>
               <div class="slider"><label for="g-fav">Sủng ái</label><input type="range" id="g-fav" min="0" max="100" value="${c.favor}"><output>${c.favor}</output></div>
               <div class="slider"><label for="g-aff">Tình cảm</label><input type="range" id="g-aff" min="0" max="100" value="${c.affection}"><output>${c.affection}</output></div>
               <div class="field"><label for="g-crank">Phẩm</label><select id="g-crank">${G.RANKS.map((r, i) => `<option value="${i}" ${c.rank === i ? "selected" : ""}>${r}</option>`).join("")}</select></div>
               <button class="btn btn-sm" id="g-birth">Cho sinh con ngay</button>
             </details>`
           : ""
       }
       <details><summary>Ban ân xuất cung</summary>
         <p class="hint">Nàng rời cung về quê với hồi môn ${G.RELEASE_COST} lượng. Không thể hoàn tác.</p>
         <button class="btn btn-sm" id="c-release">Xác nhận cho ${esc(c.name)} xuất cung</button>
       </details>
       <button class="btn btn-ghost" id="c-close">Đóng</button>`,
      (el) => {
        $(el, "#c-close").addEventListener("click", closeSheet);
        $(el, "#c-visit").addEventListener("click", () => showMessage(c.name, G.visit(c.id), ["Sủng ái +3"]));
        $(el, "#c-night").addEventListener("click", () => openNight(c));
        on(el, "#c-crown", "click", () => {
          G.crownEmpress(c.id);
          showMessage("Đại lễ sách phong", `${c.name} đội mũ phượng, chính thức trở thành Hoàng hậu.`, ["Sủng ái +10"]);
        });
        on(el, "#c-release", "click", () => {
          const r = G.releaseConsort(c.id);
          if (r) showMessage(r.ok ? "Xuất cung" : "Chưa thể", r.text, r.notes);
        });
        on(el, "[data-gift]", "click", (b) => {
          const r = G.buyGift(c.id, b.dataset.gift);
          if (r) showMessage(r.ok ? "Ban thưởng" : "Không thể ban thưởng", r.text, r.notes);
        });
        on(el, "#c-school", "change", (sel) => G.setSchool(c.id, sel.value));
        on(el, "[data-persuade]", "click", (b) => {
          const r = G.persuade(c.id, b.dataset.persuade);
          if (r) showMessage(c.name, r.text);
        });
        on(el, "[data-consent]", "change", (sel) => G.god.setConsent(c.id, sel.dataset.consent, sel.value));
        on(el, "#g-fav", "input", (inp) => {
          G.god.setFavor(c.id, inp.value);
          inp.nextElementSibling.textContent = inp.value;
        });
        on(el, "#g-aff", "input", (inp) => {
          G.god.setAffection(c.id, inp.value);
          inp.nextElementSibling.textContent = inp.value;
        });
        on(el, "#g-crank", "change", (sel) => G.god.setRank(c.id, sel.value));
        on(el, "#g-birth", "click", () => {
          const kids = G.god.forceBirth(c.id);
          if (kids) showMessage("Tin vui", `${c.name} hạ sinh ${kids.map((k) => (k.sex === "m" ? "hoàng tử " : "công chúa ") + k.name).join(" và ")}.`);
        });
      }
    );
  }

  /** Chọn sở thích cho đêm thị tẩm. Sở thích nàng chưa sẵn lòng sẽ bị khóa. */
  /* Ghim sở thích: lưu trên trình duyệt, mất cũng không sao. */
  const PIN_KEY = "tsdv-pins-v1";
  const loadPins = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(PIN_KEY) || "[]"));
    } catch (e) {
      return new Set();
    }
  };
  const savePins = (set) => {
    try {
      localStorage.setItem(PIN_KEY, JSON.stringify([...set]));
    } catch (e) {
      /* bỏ qua */
    }
  };
  const fold = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

  function openNight(c) {
    const fets = Object.values(R.fetishes)
      .filter((f) => G.fetishUnlocked(f.id))
      .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name, "vi"));
    const pins = loadPins();
    const picked = new Set();
    let query = "";
    let onlyWilling = true;
    const lvlOf = (f) => G.consentOf(c, f.id);

    const row = (f) => {
      const lvl = lvlOf(f);
      const ok = lvl === "willing";
      const on = picked.has(f.id);
      return `<div class="fx-row${ok ? "" : " fx-off"}">
        <label class="check"><input type="checkbox" data-fx="${esc(f.id)}" ${on ? "checked" : ""} ${ok ? "" : "disabled"}> <span>${esc(f.name)}${c.likes.includes(f.id) ? " ♥" : ""} <span class="hint">· ${esc(G.CONSENT_LABEL[lvl])}</span></span></label>
        <button class="fx-pin" data-pin="${esc(f.id)}" aria-pressed="${pins.has(f.id)}" aria-label="Ghim ${esc(f.name)}">${pins.has(f.id) ? "★" : "☆"}</button>
      </div>`;
    };

    const renderList = (el) => {
      const q = fold(query.trim());
      const shown = fets.filter((f) => (!onlyWilling || lvlOf(f) === "willing" || picked.has(f.id)) && (!q || fold(f.name).includes(q) || fold(f.id).includes(q)));
      const groups = [];
      const pinned = shown.filter((f) => pins.has(f.id));
      if (pinned.length) groups.push(["★ Đã ghim", pinned, true]);
      for (const t of [1, 2, 3]) {
        const g = shown.filter((f) => f.tier === t && !pins.has(f.id));
        if (g.length) groups.push([`Tầng ${t}`, g, !!q || t === 1]);
      }
      const box = $(el, "#fx-list");
      box.innerHTML = groups.length
        ? groups.map(([label, list, open]) => `<details class="fx-group" ${open ? "open" : ""}><summary>${esc(label)} <span class="hint">(${list.length})</span></summary><div class="check-list">${list.map(row).join("")}</div></details>`).join("")
        : `<p class="empty">Không có sở thích nào khớp.</p>`;
      renderStatus(el);
    };

    const renderStatus = (el) => {
      const ids = [...picked];
      const combo = G.findCombo(ids);
      const names = ids.map((id) => (R.fetishes[id] || {}).name || id);
      $(el, "#fx-status").innerHTML = ids.length
        ? `Đã chọn: ${names.map(esc).join(", ")}${combo ? ` · <strong>Combo: ${esc(combo.name)}</strong>` : ""} <button class="btn btn-sm btn-ghost" id="fx-clear">Bỏ chọn</button>`
        : `<span class="hint">Chưa chọn sở thích nào (đêm thường).</span>`;
    };

    openSheet(
      `<div class="ev-head">${portrait(c)}<div class="t"><span class="eyebrow">Lật thẻ bài · ${esc(G.displayTitle(c))}</span><h3>${esc(c.name)}</h3></div></div>
       ${
         fets.length
           ? `<p class="hint">Chọn sở thích cho đêm nay (tùy chọn). Chọn hai sở thích hợp nhau để mở combo. Bấm ☆ để ghim lên đầu.</p>
              <div class="fx-tools">
                <input type="search" id="fx-q" placeholder="Tìm sở thích…" aria-label="Tìm sở thích" autocomplete="off">
                <label class="check fx-only"><input type="checkbox" id="fx-only" checked> Chỉ điều nàng sẵn lòng</label>
              </div>
              <div id="fx-status" class="fx-status"></div>
              <div id="fx-list"></div>`
           : ""
       }
       <div class="choices"><button class="btn btn-primary" id="n-go">Truyền chỉ</button><button class="btn btn-ghost" id="n-back">Thôi</button></div>`,
      (el) => {
        $(el, "#n-back").addEventListener("click", closeSheet);
        if (fets.length) {
          renderList(el);
          $(el, "#fx-q").addEventListener("input", (e) => {
            query = e.target.value;
            renderList(el);
          });
          $(el, "#fx-only").addEventListener("change", (e) => {
            onlyWilling = e.target.checked;
            renderList(el);
          });
          const card = $(el, ".sheet-card");
          card.addEventListener("change", (e) => {
            const id = e.target.dataset && e.target.dataset.fx;
            if (!id) return;
            if (e.target.checked) picked.add(id);
            else picked.delete(id);
            renderStatus(el);
          });
          card.addEventListener("click", (e) => {
            const pin = e.target.closest && e.target.closest("[data-pin]");
            if (pin) {
              const id = pin.dataset.pin;
              if (pins.has(id)) pins.delete(id);
              else pins.add(id);
              savePins(pins);
              renderList(el);
              return;
            }
            if (e.target.id === "fx-clear") {
              picked.clear();
              renderList(el);
            }
          });
        }
        $(el, "#n-go").addEventListener("click", () => {
          const scene = G.summon(c.id, [...picked]);
          const later = scene && !scene.blocked ? G.rollNightEvent(c.id) : null;
          G.save();
          if (later) queue.push(() => showLaterEvent(later));
          showScene(scene);
        });
      }
    );
  }

  function openSummon() {
    const s = G.state;
    const list = s.consorts.filter((c) => !G.cannotSummon(c)).sort((a, b) => b.favor - a.favor);
    openSheet(
      `<h3>Lật thẻ bài</h3><p class="hint">Lý công công dâng khay thẻ tên. Đêm nay bệ hạ chọn ai?</p>
       ${list.length ? `<div class="cards">${list.map((c) => consortCard(c)).join("")}</div>` : `<p class="empty">Không có phi tần nào có thể thị tẩm.</p>`}
       <button class="btn btn-ghost" id="sm-close">Đóng</button>`,
      (el) => {
        $(el, "#sm-close").addEventListener("click", closeSheet);
        on(el, "[data-consort]", "click", (b) => openNight(G.findConsort(b.dataset.consort)));
      }
    );
  }

  function recruitPicker(title, intro, recruits, cost) {
    openSheet(
      `<h3>${esc(title)}</h3><p class="hint">${esc(intro)}</p>
       <div class="cards">${recruits
         .map(
           (r) => `<label class="consort" style="cursor:pointer">${portrait(r)}<span class="body"><span class="name">${esc(r.name)}</span><span class="meta">${r.age} tuổi · ${esc(r.origin)}</span><span class="row-wrap">${r.traits.map((t) => pill(t)).join("")}</span><span class="check"><input type="checkbox" value="${esc(r.id)}" checked> Giữ lại</span></span></label>`
         )
         .join("")}</div>
       <button class="btn btn-primary" id="sel-ok">Xác nhận</button>`,
      (el) => {
        $(el, "#sel-ok").addEventListener("click", () => {
          const ids = [...el.querySelectorAll("input:checked")].map((i) => i.value);
          const names = ids
            .map((id) => G.addConsort(id, true))
            .filter(Boolean)
            .map((c) => c.name);
          if (names.length) G.log(`${title}: giữ lại ${names.join(", ")}.`, "harem");
          G.addStat("truyLac", names.length * 2);
          G.save();
          showMessage(title, names.length ? `${names.join(", ")} nhập cung với phẩm Đáp ứng.` : "Bệ hạ ban hoa cho tất cả về nhà.", cost ? [`Quốc khố −${cost}`] : []);
        });
      },
      { locked: true }
    );
  }

  function openSelection() {
    const why = G.selectionStatus();
    if (why) return showMessage("Tuyển tú", why);
    const recruits = G.holdSelection();
    G.save();
    recruitPicker("Tuyển tú", "Bốn tú nữ vào vòng cuối, tất cả từ 18 tuổi trở lên. Chọn người được lưu bài tử.", recruits, G.SELECTION_COST);
  }

  function openTravel() {
    if (!G.canTravel()) return showMessage("Tuần du", "Năm nay đã tuần du rồi.");
    const regions = Object.values(R.regions);
    openSheet(
      `<h3>Tuần du</h3><p class="hint">Mỗi năm một chuyến. Long thể −3, Trụy lạc +4. Mỗi vùng có mỹ nhân và sự kiện riêng.</p>
       <div class="cards">${regions.map((r) => `<div class="row-card"><div><b>${esc(r.name)}</b><br><span class="hint">${esc(r.desc || "")}</span></div><button class="btn btn-sm" data-region="${esc(r.id)}">${fmtMoney(r.cost)}</button></div>`).join("")}</div>
       <button class="btn btn-ghost" id="tr-close">Thôi</button>`,
      (el) => {
        $(el, "#tr-close").addEventListener("click", closeSheet);
        on(el, "[data-region]", "click", (b) => {
          const r = G.travel(b.dataset.region);
          if (!r) return;
          if (!r.ok) return showMessage("Tuần du", r.text);
          G.save();
          recruitPicker("Tuần du " + r.region.name, r.region.arrive || `Đoàn thuyền rồng cập bến ${r.region.name}. Địa phương dâng mỹ nhân.`, r.recruits, r.region.cost);
        });
      }
    );
  }

  /* ================================================================== */
  /* Kết thúc                                                            */
  /* ================================================================== */
  function renderEnding() {
    const s = G.state;
    const e = s.ended;
    const d = G.dynasty();
    const succ = s.children.find((c) => c.id === s.successor);
    $app().innerHTML = `<section class="ending">
      <span class="god-badge">${s.godMode ? "Lượt chơi Thiên Đạo" : "Sử quan ghi chép"}</span>
      <h1>${esc(e.main.title)}</h1>
      <blockquote>${esc(e.main.line)}</blockquote>
      <div class="chronicle">${(e.chronicle || []).map((l) => `<p>${esc(l)}</p>`).join("")}</div>
      <div class="tally">
        <div><b>${s.consorts.length + s.former.length}</b><span>phi tần</span></div>
        <div><b>${s.children.length}</b><span>hoàng tử, công chúa</span></div>
        <div><b>${s.grandchildren.length}</b><span>cháu</span></div>
        <div><b>${s.nightsTotal}</b><span>đêm thị tẩm</span></div>
      </div>
      ${e.extras.length ? `<p>Danh hiệu phụ: ${e.extras.map((x) => esc(x.title)).join(", ")}</p>` : ""}
      ${e.dynastyEarned ? `<p class="hint">Huyết mạch +${e.dynastyEarned} điểm danh vọng (tổng ${d.points}).</p>` : ""}
      ${s.album.length ? `<h3>Album</h3><div class="album">${s.album.map((a) => `<figure><figcaption><b>${esc(a.title)}</b><span class="hint">${a.age} tuổi</span></figcaption><p>${esc(a.line)}</p></figure>`).join("")}</div>` : ""}
      <div class="actions">
        ${succ && !s.godMode ? `<button class="btn btn-primary" id="e-heir">Chơi tiếp đời sau: ${esc(succ.name)}</button>` : ""}
        <button class="btn${succ && !s.godMode ? "" : " btn-primary"}" id="e-new">Bắt đầu đời mới</button>
      </div>
    </section>`;
    const root = $app();
    on(root, "#e-heir", "click", () => {
      const last = G.dynasty().last;
      G.clearSave();
      G.newState({ name: last.name + " Đế", age: last.age, generation: last.generation, legacies: G.dynasty().owned });
      G.save();
      tab = "log";
      UI.render();
    });
    $(root, "#e-new").addEventListener("click", () => {
      G.clearSave();
      G.state = null;
      UI.renderGate();
    });
  }
})();
