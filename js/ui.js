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
  /** Lớp hiệu ứng mùa: cánh đào, đom đóm, lá phong, tuyết. Chỉ trang trí, không chặn bấm. */
  function seasonLayer(se) {
    let out = "";
    for (let i = 0; i < 14; i++) {
      const x = (i * 37) % 100;
      const d = 9 + ((i * 7) % 9);
      const delay = -((i * 13) % 17);
      const sz = 5 + ((i * 5) % 6);
      out += `<i style="left:${x}%;--d:${d}s;--dl:${delay}s;--sz:${sz}px"></i>`;
    }
    return `<div class="season-fx fx-${se}" aria-hidden="true">${out}</div>`;
  }
  UI.render = function () {
    const s = G.state;
    if (!s) return UI.renderGate();
    if (s.ended) return renderEnding();
    const tabs = [
      ["log", (() => { const n = G.reminders ? G.reminders().length : 0; return n ? `Triều (${n})` : "Triều"; })()],
      ["harem", "Hậu cung"],
      ["kids", "Con cháu"],
      ["me", "Bệ hạ"],
      ["palace", "Cung điện"],
    ];
    if (s.godMode) tabs.push(["god", "Thiên Đạo"]);
    $app().innerHTML = `
      <header class="topbar">
        <div class="who">
          <h2 title="${esc(s.emperorName)}">${esc(s.emperorName)}</h2>
          <span class="date">${s.godMode ? '<span class="god-badge">Thiên Đạo · </span>' : ""}${s.age} tuổi · năm ${s.year} th.${s.month}${G.seasonOf ? ` <span class="season-pill s-${G.seasonOf(s.month)}">${G.SEASONS[G.seasonOf(s.month)]}</span>` : ""}${G.currentQue && G.currentQue() ? ` <span class="que-pill">${esc(G.currentQue().name)}</span>` : ""}</span>
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
      <div class="toast" id="toast" hidden></div>
      ${G.seasonOf ? seasonLayer(G.seasonOf(s.month)) : ""}`;
    if (G.seasonOf) document.body.dataset.season = G.seasonOf(s.month);
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
    const tb = $(root, ".tabs");
    if (tb) {
      const edge = () => {
        tb.classList.toggle("more-r", tb.scrollLeft + tb.clientWidth < tb.scrollWidth - 4);
        tb.classList.toggle("more-l", tb.scrollLeft > 4);
      };
      const cur = $(tb, '[aria-selected="true"]');
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest", inline: "nearest" });
      edge();
      tb.addEventListener("scroll", edge, { passive: true });
    }
    if (!$sheet().hidden) return;
    playFx();
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
  function renderReminders() {
    const list = G.reminders ? G.reminders() : [];
    if (!list.length) return "";
    return `<div class="goals reminders"><div class="section-head"><h3>Việc cần để ý</h3><span class="hint">${list.length} việc</span></div>
      <ul>${list.map((r) => `<li class="${r.hot ? "hot" : ""}">${r.consort ? `<button class="link-btn" data-consort="${esc(r.consort)}">${esc(r.text)}</button>` : esc(r.text)}</li>`).join("")}</ul></div>`;
  }
  function renderLog() {
    const s = G.state;
    const f = LOG_FILTERS.find((x) => x[0] === logFilter) || LOG_FILTERS[0];
    const rows = s.log.filter((l) => !f[2] || f[2].includes(l.kind)).slice(0, 150);
    return `<section class="section">${renderReminders()}${renderGoals()}
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
        <span class="meta">${pill(G.displayTitle(c), "rank")} ${c.age} tuổi${c.kids ? ` · ${c.kids} con` : ""} ${c.pregnantDue != null ? pill("Hoài thai", "preg") : ""}${p && p.tinhY >= 61 ? " " + pill(p.status + " · " + p.other.name, "pair") : ""}${G.state.d1 && G.state.d1.badge && G.state.d1.badge.id === c.id ? " " + pill(G.state.d1.badge.label, "rank") : ""}${G.isSulking && G.isSulking(c) ? " " + pill("Đang dỗi", "preg") : ""}${(() => { const pr = G.promiseNow && G.promiseNow(); return pr && pr.c.id === c.id && !pr.done ? " " + pill(pr.thisMonth ? "Hẹn tháng này" : "Hẹn tháng sau", "pair") : ""; })()}</span>
        <span class="favor">${bar(c.favor)}<span>Sủng ái ${c.favor}</span></span>
        ${extra || ""}
      </span>
    </button>`;
  }

  let haremView = (() => {
    try {
      return localStorage.getItem("dvs.haremView") || "list";
    } catch (e) {
      return "list";
    }
  })();
  /** Bản đồ hậu cung: mỗi phi ở một cung, cung có chuyện thì sáng đèn. */
  function renderPalaceMap() {
    const s = G.state;
    const M = G.palaceMap();
    const pr = G.promiseNow && G.promiseNow();
    const status = (c) => {
      const out = [];
      if (pr && pr.c.id === c.id && !pr.done) out.push("hen");
      if (G.isSulking && G.isSulking(c)) out.push("doi");
      if (c.pregnantDue != null) out.push("thai");
      if (G.state.summonStreak.id === c.id && G.state.summonStreak.count >= 2) out.push("sung");
      return out;
    };
    const tile = (p) => {
      const res = M.residents[p.id] || [];
      const st = new Set(res.flatMap(status));
      const lit = st.has("hen") ? "lit-gold" : st.has("doi") ? "lit-red" : res.length ? "" : "empty";
      const dots = [st.has("hen") ? `<i class="d-gold" title="Có hẹn"></i>` : "", st.has("doi") ? `<i class="d-red" title="Đang dỗi"></i>` : "", st.has("thai") ? `<i class="d-jade" title="Hoài thai"></i>` : ""].join("");
      return `<button class="palace ${lit} ${p.kind || ""}" data-palace="${p.id}" ${res.length ? "" : "disabled"}>
        <span class="roof"></span>
        <span class="p-name">${esc(p.name)}</span>
        <span class="p-who">${res.length ? res.slice(0, 3).map((c) => portrait(c, "xs")).join("") + (res.length > 3 ? `<em>+${res.length - 3}</em>` : "") : `<em>Trống</em>`}</span>
        <span class="p-main">${res[0] ? esc(res[0].name) : ""}</span>
        ${dots ? `<span class="p-dots">${dots}</span>` : ""}
      </button>`;
    };
    const built = Object.keys(s.buildings || {}).map((b) => (R.buildings[b] || {}).name).filter(Boolean);
    return `<div class="palace-map">
      <div class="pm-col">${M.east.map(tile).join("")}</div>
      <div class="pm-mid">
        <div class="palace throne"><span class="roof"></span><span class="p-name">Càn Nguyên điện</span><span class="p-main">Bệ hạ</span></div>
        ${tile(M.queen)}
        <div class="pm-road"></div>
      </div>
      <div class="pm-col">${M.west.map(tile).join("")}</div>
      <div class="pm-garden"><span class="p-name">Ngự hoa viên</span>${built.length ? `<span class="pm-built">${built.map((n) => `<span class="pill">${esc(n)}</span>`).join("")}</span>` : `<span class="hint">Chưa xây công trình nào.</span>`}</div>
    </div>
    <p class="hint pm-legend"><i class="d-gold"></i> có hẹn · <i class="d-red"></i> đang dỗi · <i class="d-jade"></i> hoài thai. Chạm vào cung để xem người ở.</p>`;
  }
  function openPalace(pid) {
    const M = G.palaceMap();
    const res = M.residents[pid] || [];
    const p = M.all.find((x) => x.id === pid);
    if (res.length === 1) return openConsort(res[0].id);
    openSheet(`<h3>${esc(p ? p.name : "")}</h3><p class="hint">${res.length} người ở. Chủ vị là người phẩm cao nhất.</p><div class="cards">${res.map((c) => consortCard(c)).join("")}</div>`, (el) =>
      on(el, "[data-consort]", "click", (b) => openConsort(b.dataset.consort))
    );
  }

  function renderHarem() {
    const s = G.state;
    const list = [...s.consorts].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    const pairs = G.listPairs().filter((p) => p.tinhY >= 31);
    return `<section class="section">
      <div class="section-head"><h3>Hậu cung</h3><span class="hint">Chạm để ghé thăm, tặng quà, xem chi tiết</span></div>
      <div class="seg" role="tablist"><button class="seg-btn" data-hview="list" aria-selected="${haremView !== "map"}">Danh sách</button><button class="seg-btn" data-hview="map" aria-selected="${haremView === "map"}">Bản đồ cung</button></div>
      ${!list.length ? `<p class="empty">Hậu cung trống. Mở tuyển tú để nạp phi.</p>` : haremView === "map" ? renderPalaceMap() : `<div class="cards">${list.map((c) => consortCard(c)).join("")}</div>`}
      <div class="section-head"><h3>Đối thực</h3><span class="hint">Thái độ của bệ hạ: ${G.ATTITUDE_LABEL[s.attitude]}</span></div>
      ${
        pairs.length
          ? `<div class="scroll-x"><table class="mini-table"><tr><th>Cặp</th><th>Tình Ý</th><th>Trạng thái</th></tr>${pairs.map((p) => `<tr><td>${esc(p.a.name)} · ${esc(p.b.name)}</td><td>${Math.round(p.tinhY)}</td><td>${esc(p.status)}</td></tr>`).join("")}</table></div>`
          : `<p class="empty">Chưa có cặp nào thân thiết. Tình Ý tăng khi các phi học cùng lớp, cùng bị lạnh nhạt, hoặc hợp tính.</p>`
      }
      ${renderPhe()}
      ${renderBangVang()}
      ${s.former.length ? `<p class="hint">Đã rời cung: ${s.former.map((f) => esc(f.name) + " (" + esc(f.reason) + ")").join(", ")}.</p>` : ""}
    </section>`;
  }

  /** Phe phái: người cầm đầu, số người theo, sức mạnh (tổng Sủng ái). */
  function renderPhe() {
    const list = G.factionList ? G.factionList() : [];
    if (!list.length) return `<div class="section-head"><h3>Phe phái</h3></div><p class="empty">Chưa chia phe. Cần ít nhất hai phi từ phẩm Tần trở lên; phi khác theo người mình thân nhất (Tình Ý từ ${G.PHE_MIN_TINHY}).</p>`;
    const max = Math.max(...list.map((f) => f.strength), 1);
    const d = G.state.d2 || {};
    const lop = list.length >= 2 && list[0].strength > 2 * list[list.length - 1].strength;
    return `<div class="section-head"><h3>Phe phái</h3><span class="hint">${lop ? "Lệch phe: Hòa khí −1/tháng" : "Sức mạnh = tổng Sủng ái"}</span></div>
      <div class="cards">${list
        .map((f) => `<div class="row-card"><div><b>Phe ${esc(f.leader.name)}</b>${d.queenLeader === f.leader.id ? " · <span class=\"tag\">phe Hoàng hậu</span>" : ""}${d.sulkUntil >= G.state.turn && d.sulkLeader && d.sulkLeader !== f.leader.id ? " · <span class=\"tag\">đang dỗi</span>" : ""}<br><span class="hint">${f.members.length ? esc(f.members.map((c) => c.name).join(", ")) : "Chưa ai theo"}</span><span class="favor">${bar((f.strength / max) * 100)}<span>${f.strength}</span></span></div></div>`)
        .join("")}</div>`;
  }

  /** Bảng vàng: ba người đứng đầu mỗi bảng, chấm lại cuối mỗi tháng. */
  function renderBangVang() {
    const d = G.state.d1;
    const boards = d && d.boards ? G.BOARDS.filter((b) => d.boards[b.id]) : [];
    if (!boards.length) return `<div class="section-head"><h3>Bảng vàng</h3></div><p class="empty">Cần ít nhất ${G.BANG_MIN} phi tần. Bảng chấm lại cuối mỗi tháng.</p>`;
    const cell = (e, b) => (e ? `${esc(e.name)} <span class="hint">${e.v}</span>` : "");
    return `<div class="section-head"><h3>Bảng vàng</h3><span class="hint">Chấm cuối mỗi tháng · số bên cạnh là điểm</span></div>
      <div class="scroll-x"><table class="mini-table"><tr><th>Bảng</th><th>Đệ nhất</th><th>Đệ nhị</th><th>Đệ tam</th></tr>${boards
        .map((b) => {
          const r = d.boards[b.id];
          return `<tr><td>${esc(b.name)}<br><span class="hint">${esc(b.unit)}</span></td><td>${cell(r.top[0], b)}</td><td>${cell(r.top[1], b)}</td><td>${cell(r.top[2], b)}</td></tr>`;
        })
        .join("")}</table></div>`;
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
    on(root, "[data-palace]", "click", (b) => openPalace(b.dataset.palace));
    on(root, "[data-hview]", "click", (b) => {
      haremView = b.dataset.hview;
      try {
        localStorage.setItem("dvs.haremView", haremView);
      } catch (e) {}
      UI.render();
    });
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
  // Nút quay lại của điện thoại: khi bảng trượt mở, giữ một mục lịch sử; bấm quay lại thì đóng bảng thay vì rời game.
  const hist = { pending: false };
  const sheetInHistory = () => !!(history.state && history.state.sheet);
  function pushSheetHistory() {
    try {
      if (!sheetInHistory()) history.pushState({ sheet: 1 }, "");
    } catch (e) {}
  }
  window.addEventListener("popstate", () => {
    const el = $sheet();
    if (hist.pending) {
      hist.pending = false;
      if (!el.hidden) pushSheetHistory(); // bảng kế tiếp đã mở trong lúc chờ
      return;
    }
    if (el.hidden) return;
    if (el.dataset.dismiss === "no") return pushSheetHistory(); // bảng bắt buộc chọn: ở lại
    closeSheet(true);
  });

  function openSheet(html, onBind, opts) {
    const el = $sheet();
    const locked = !!(opts && opts.locked);
    el.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true">${locked ? "" : `<button class="sheet-x" aria-label="Đóng" title="Đóng">✕</button>`}${html}</div>`;
    el.hidden = false;
    el.dataset.dismiss = locked ? "no" : "";
    el.onclick = (e) => {
      if (e.target === el && el.dataset.dismiss !== "no") closeSheet();
    };
    const card = $(el, ".sheet-card");
    card.scrollTop = 0;
    const x = el.querySelector(".sheet-x");
    if (x) x.addEventListener("click", () => closeSheet());
    if (!locked) swipeToClose(card);
    pushSheetHistory();
    if (onBind) onBind(el);
    const first = el.querySelector("button:not(.sheet-x)");
    if (first) first.focus({ preventScroll: true });
    playFx();
  }

  /* ---------------- Hoạt cảnh mốc lớn ---------------- */
  let fxBusy = false;
  function playFx() {
    if (fxBusy || !G.takeFx) return;
    const list = G.takeFx();
    if (!list.length) return;
    // gộp: mỗi loại một lần, ưu tiên sắc phong > thắng thi > sinh con > ấn son
    const order = ["crown", "fireworks", "petals", "stamp"];
    list.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const seen = new Set();
    const run = list.filter((f) => !seen.has(f.type) && seen.add(f.type)).slice(0, 2);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    fxBusy = true;
    let k = 0;
    const next = () => {
      if (k >= run.length) return (fxBusy = false);
      const ms = showFx(run[k++]);
      setTimeout(next, ms + 150);
    };
    setTimeout(next, 180);
  }
  UI.playFx = playFx;
  function showFx(f) {
    const box = document.createElement("div");
    box.className = `fx-layer fx-${f.type}`;
    box.setAttribute("aria-hidden", "true");
    let ms = 1800;
    if (f.type === "petals") {
      let s = "";
      for (let i = 0; i < 26; i++) s += `<i style="left:${(i * 41) % 100}%;--d:${1.6 + ((i * 7) % 10) / 10}s;--dl:${((i * 13) % 9) / 10}s;--r:${(i * 53) % 360}deg"></i>`;
      box.innerHTML = s + `<div class="fx-cap">${esc(f.text || "Tin vui")}</div>`;
      ms = 2600;
    } else if (f.type === "fireworks") {
      let s = "";
      const spots = [[30, 28], [70, 22], [50, 40], [22, 50], [78, 46]];
      spots.forEach(([x, y], n) => {
        s += `<span class="burst" style="left:${x}%;top:${y}%;--dl:${n * 0.28}s;--h:${[45, 350, 160, 30, 280][n]}">`;
        for (let a = 0; a < 12; a++) s += `<b style="--a:${a * 30}deg"></b>`;
        s += "</span>";
      });
      box.innerHTML = s + `<div class="fx-cap">${esc(f.text || "")}</div>`;
      ms = 2400;
    } else if (f.type === "crown") {
      const c = G.findConsort(f.id);
      if (!c) return 0;
      box.innerHTML = `<div class="crown-wrap"><svg class="crown" viewBox="0 0 120 60"><path d="M8 52 L14 18 L34 36 L60 6 L86 36 L106 18 L112 52Z" fill="#e3bb62" stroke="#8a6420" stroke-width="2"/><circle cx="60" cy="8" r="5" fill="#d2442f"/><circle cx="14" cy="18" r="4" fill="#6fae8e"/><circle cx="106" cy="18" r="4" fill="#6fae8e"/><rect x="8" y="46" width="104" height="8" rx="2" fill="#c99a3e"/></svg>${portrait(c, "xl")}</div><div class="fx-cap">${esc(c.name)} · ${esc(G.RANKS[f.rank] || "")}</div>`;
      ms = 2300;
    } else if (f.type === "stamp") {
      box.innerHTML = `<div class="seal-stamp"><span>${esc(f.text || "Chuẩn")}</span></div>${f.sub ? `<div class="fx-cap">${esc(f.sub)}</div>` : ""}`;
      ms = 1400;
    }
    document.body.appendChild(box);
    if (navigator.vibrate) try { navigator.vibrate(f.type === "stamp" ? 20 : [15, 40, 15]); } catch (e) {}
    setTimeout(() => box.remove(), ms);
    return ms;
  }
  /** Vuốt xuống khi bảng đang ở đầu trang thì đóng. */
  function swipeToClose(card) {
    let y0 = null;
    let dy = 0;
    card.addEventListener("touchstart", (e) => {
      y0 = card.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
      dy = 0;
    }, { passive: true });
    card.addEventListener("touchmove", (e) => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy < 0 || card.scrollTop > 0) {
        y0 = null;
        card.style.transform = "";
        return;
      }
      card.style.transition = "none";
      card.style.transform = `translateY(${Math.min(dy, 400) * 0.8}px)`;
    }, { passive: true });
    card.addEventListener("touchend", () => {
      if (y0 == null) return;
      y0 = null;
      card.style.transition = "";
      if (dy > 110) closeSheet();
      else card.style.transform = "";
    });
  }
  function closeSheet(fromBack) {
    const el = $sheet();
    el.hidden = true;
    el.innerHTML = "";
    el.dataset.dismiss = "";
    G.save();
    if (fromBack !== true && sheetInHistory()) {
      hist.pending = true;
      try {
        history.back();
      } catch (e) {
        hist.pending = false;
      }
    }
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
      ? `${notesHtml(notes || scene.notes)}${roundBtn(scene)}<button class="btn btn-primary" id="s-ok">${scene.blocked ? "Đóng" : "Sáng hôm sau"}</button>`
      : `<div class="choices scene-nav"><button class="btn btn-primary" id="s-next">Tiếp · ${i + 1}/${pages.length}</button><button class="btn btn-ghost btn-sm" id="s-all">Đọc liền một mạch</button></div>`;
    openSheet(`${i === 0 ? img : ""}<h3>${esc(scene.title || "")}</h3>${dots}<p class="ev-text ink">${formatText(pages[i])}</p>${btns}`, (el) => {
      const card = $(el, ".sheet-card");
      card.classList.add("scene-card");
      if (i === 0) card.classList.add("scroll-open");
      if (last) {
        $(el, "#s-ok").addEventListener("click", closeSheet);
        on(el, "#s-more", "click", () => openRoundPicker(G.findConsort(scene.roundOf)));
      }
      else {
        $(el, "#s-next").addEventListener("click", () => showScene(scene, notes, i + 1));
        $(el, "#s-all").addEventListener("click", () => showScene(Object.assign({}, scene, { pages: [pages.slice(i).join("\n\n")] }), notes, 0));
      }
    }, last ? undefined : { locked: true });
  }

  function roundBtn(scene) {
    if (!scene || scene.blocked || !scene.roundOf || !G.roundState) return "";
    const c = G.findConsort(scene.roundOf);
    const st = c && G.roundState(c);
    if (!st) return "";
    if (st.why && !(st.left <= 0 && st.canBuy)) return `<p class="hint">${esc(st.why)}</p>`;
    return `<button class="btn" id="s-more">Thêm hiệp nữa<span class="cost">${st.left > 0 ? `còn ${st.left} hiệp · Long thể −${G.ROUND_COST}` : `uống canh bổ để thêm hiệp`}</span></button>`;
  }
  /** Chọn sở thích cho hiệp tiếp theo. */
  function openRoundPicker(c) {
    if (!c) return closeSheet();
    const st = G.roundState(c);
    if (!st) return closeSheet();
    const willing = Object.values(R.fetishes)
      .filter((f) => G.fetishUnlocked(f.id) && G.consentOf(c, f.id) === "willing")
      .sort((a, b) => (c.likes.includes(b.id) ? 1 : 0) - (c.likes.includes(a.id) ? 1 : 0) || a.tier - b.tier || a.name.localeCompare(b.name, "vi"));
    let q = "";
    const list = () => {
      const f = fold(q.trim());
      const shown = willing.filter((x) => !f || fold(x.name).includes(f)).slice(0, 30);
      return `<button class="btn" data-round="">Đêm thường</button>${shown.map((x) => `<button class="btn" data-round="${esc(x.id)}">${esc(x.name)}${c.likes.includes(x.id) ? " ♥" : ""}</button>`).join("")}`;
    };
    openSheet(
      `<div class="ev-head">${portrait(c)}<div class="t"><span class="eyebrow">Hiệp ${st.rounds + 2} · ${esc(c.name)}</span><h3>Thêm hiệp nữa</h3></div></div>
       <p class="hint">Đêm nay đã ${st.rounds + 1} hiệp, còn ${Math.max(0, st.left)}. Long thể hiện ${Math.round(G.state.stats.longThe)} (mỗi hiệp −${G.ROUND_COST}). Long thể từ 70 được 2 hiệp thêm, dưới 70 được 1.</p>
       ${st.left <= 0 ? (st.canBuy ? `<button class="btn btn-primary" id="r-canh">Uống canh bổ<span class="cost">${fmtMoney(st.cost)} lượng · thêm 1 hiệp</span></button>` : `<p class="empty">${esc(st.why || "Bệ hạ đã hết sức đêm nay.")}</p>`) : `
       ${st.canBuy ? `<button class="btn btn-ghost btn-sm" id="r-canh">Uống canh bổ trước (${fmtMoney(st.cost)} lượng, thêm 1 hiệp)</button>` : ""}
       <input type="search" id="r-q" placeholder="Tìm sở thích nàng sẵn lòng…" aria-label="Tìm sở thích" autocomplete="off">
       <div class="choices" id="r-list">${list()}</div>`}
       <button class="btn btn-ghost" id="r-end">Thôi, nghỉ thôi</button>`,
      (el) => {
        on(el, "#r-end", "click", () => closeSheet());
        on(el, "#r-canh", "click", () => {
          const r = G.drinkCanhBo();
          G.save();
          if (r && r.ok) {
            queue.unshift(() => openRoundPicker(c));
            showMessage("Canh bổ", r.text, r.notes);
          } else if (r) showMessage("Canh bổ", r.text);
        });
        on(el, "#r-q", "input", (inp) => {
          q = inp.value;
          $(el, "#r-list").innerHTML = list();
        });
        const box = el.querySelector("#r-list");
        if (box)
          box.addEventListener("click", (e) => {
            const b = e.target.closest("[data-round]");
            if (!b) return;
            const scene = G.extraRound(c.id, b.dataset.round || null);
            G.save();
            showScene(scene);
          });
      }
    );
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
          const idx = Number(b.dataset.choice);
          const ch = prepared.ev.choices[idx];
          const p = ch && ch.hook && ch.participants;
          if (p && typeof p === "object" && !Array.isArray(p) && (p.count || 3) > 1 && !b.dataset.picked) return openGroupPicker(prepared, idx);
          const res = G.choose(prepared, idx);
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
  /** Chọn người cho cảnh nhiều người: 2–4 phi cùng sẵn lòng, chọn người chính. */
  function openGroupPicker(prepared, idx) {
    const ch = prepared.ev.choices[idx];
    const p = ch.participants;
    const sp = { speaker: prepared.speaker, speaker2: prepared.speaker2, pair: prepared.pair };
    const all = G.participantsFor(Object.assign({}, ch, { participants: Object.assign({}, p, { count: 99 }) }), sp);
    const def = G.participantsFor(ch, sp);
    const min = Math.max(2, ch.minParticipants || 2);
    const max = Math.max(4, p.count || 3);
    const picked = def.map((c) => c.id).slice(0, max);
    let lead = picked[0];
    const run = () => {
      const old = ch.participants;
      const order = [lead].concat(picked.filter((id) => id !== lead));
      ch.participants = order;
      let res;
      try {
        res = G.choose(prepared, idx);
      } finally {
        ch.participants = old;
      }
      G.save();
      if (G.state.ended) return closeSheet();
      if (res.scene) showScene(res.scene, res.notes);
      else if (res.after || res.notes.length) showMessage(prepared.title, res.after || "Ý chỉ đã ban.", res.notes);
      else closeSheet();
    };
    if (all.length <= min) return run();
    const draw = () =>
      openSheet(
        `<h3>Chọn người hầu đêm nay</h3><p class="hint">${esc(ch.label ? G.fill(ch.label, sp) : prepared.title)} · chọn ${min}–${max} phi đều sẵn lòng. Chạm ★ để chọn người chính.</p>
         <div class="cards">${all
           .map((c) => {
             const on = picked.includes(c.id);
             return `<div class="row-card gp-row${on ? " on" : ""}"><label class="check">${portrait(c, "sm")}<input type="checkbox" data-gp="${esc(c.id)}" ${on ? "checked" : ""}> <span><b>${esc(c.name)}</b><br><span class="hint">${esc(G.displayTitle(c))} · Sủng ái ${Math.round(c.favor)}</span></span></label><button class="fx-pin" data-lead="${esc(c.id)}" aria-pressed="${lead === c.id}" ${on ? "" : "disabled"} aria-label="Người chính">${lead === c.id ? "★" : "☆"}</button></div>`;
           })
           .join("")}</div>
         <p class="hint" id="gp-msg">Đã chọn ${picked.length}/${max}.</p>
         <div class="choices"><button class="btn btn-primary" id="gp-go" ${picked.length < min ? "disabled" : ""}>Truyền chỉ</button><button class="btn btn-ghost" id="gp-back">Thôi</button></div>`,
        (el) => {
          on(el, "#gp-back", "click", () => showEvent(prepared));
          on(el, "#gp-go", "click", run);
          on(el, "[data-lead]", "click", (b) => {
            lead = b.dataset.lead;
            draw();
          });
          el.querySelector(".sheet-card").addEventListener("change", (e) => {
            const id = e.target.dataset && e.target.dataset.gp;
            if (!id) return;
            if (e.target.checked) {
              if (picked.length >= max) {
                e.target.checked = false;
                $(el, "#gp-msg").textContent = `Tối đa ${max} người.`;
                return;
              }
              picked.push(id);
            } else picked.splice(picked.indexOf(id), 1);
            if (!picked.includes(lead)) lead = picked[0];
            draw();
          });
        },
        { locked: true }
      );
    draw();
  }
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
    if (r.ruleEvent) queue.push(() => showLaterEvent(r.ruleEvent));
    for (const e of r.sideEvents || []) queue.push(() => showLaterEvent(e));
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
    if (r.ruleEvent) queue.push(() => showLaterEvent(r.ruleEvent));
    for (const e of r.sideEvents || []) queue.push(() => showLaterEvent(e));
    if (queue.length) queue.shift()();
    else UI.render();
  }

  /* ---------------- Cung quy ---------------- */
  function openRules(msg) {
    const s = G.state;
    const all = Object.values(R.rules);
    const open = all.filter((r) => G.ruleUnlocked(r) || G.ruleEnabled(r.id));
    const locked = all.length - open.length;
    const card = (r) => {
      const on = G.ruleEnabled(r.id);
      const fol = G.ruleFollowers(r);
      const ref = s.consorts.length - fol.length;
      const loss = Math.min(G.RULE_HOAKHI_CAP, ref * G.RULE_HOAKHI_PER_REFUSER);
      return `<div class="row-card"><div><b>${esc(r.name)}</b>${on ? " · <span class=\"tag\">đang bật</span>" : ""}<br><span class="hint">${esc(r.desc || "")}</span><br><span class="hint">Theo lệ: ${fol.length}/${s.consorts.length} phi${fol.length ? " (" + esc(fol.slice(0, 4).map((c) => c.name).join(", ")) + (fol.length > 4 ? "…" : "") + ")" : ""}${ref ? ` · Hòa khí −${loss}/tháng` : ""}</span></div><span class="row-btns"><button class="btn btn-sm${on ? "" : " btn-primary"}" data-rule="${esc(r.id)}">${on ? "Bãi bỏ" : "Ban lệ"}</button>${ref && (r.fetish || []).some((f) => G.fetishUnlocked(f) && s.consorts.some((c) => G.consentOf(c, f) === "persuade")) ? `<button class="btn btn-sm btn-ghost" data-rule-pers="${esc(r.id)}">Thuyết phục</button>` : ""}</span></div>`;
    };
    openSheet(
      `<h3>Cung quy</h3><p class="hint">Lệ hậu cung do bệ hạ ban. Chỉ phi sẵn lòng với sở thích của lệ mới theo; phi khác được miễn nhưng hậu cung chia phe, Hòa khí giảm mỗi tháng (cộng dồn mọi lệ tối đa −${G.RULE_HOAKHI_TOTAL_CAP}/tháng).</p>
       ${msg ? `<p class="hint fx-msg">${esc(msg)}</p>` : ""}
       ${open.length ? `<div class="cards">${open.map(card).join("")}</div>` : `<p class="empty">Chưa mở quy định nào.</p>`}
       ${locked ? `<p class="hint">Còn ${locked} quy định chưa mở.</p>` : ""}
       <button class="btn btn-ghost" id="r-close">Đóng</button>`,
      (el) => {
        $(el, "#r-close").addEventListener("click", closeSheet);
        on(el, "[data-rule]", "click", (b) => {
          G.toggleRule(b.dataset.rule);
          G.save();
          openRules();
        });
        on(el, "[data-rule-pers]", "click", (b) => {
          const r = R.rules[b.dataset.rulePers];
          const texts = (r.fetish || []).map((f) => G.persuadeAll(f)).filter(Boolean).map((x) => x.text);
          G.save();
          openRules(`Thuyết phục cho ${r.name}. ` + texts.join(" "));
        });
      }
    );
  }

  /* ---------------- Ý chỉ (hành động) ---------------- */
  function openActions() {
    const s = G.state;
    const selWhy = G.selectionStatus();
    const ctWhy = G.contestStatus();
    openSheet(
      `<h3>Ý chỉ</h3>
       <div class="cards">
         <div class="row-card"><div><b>Tuyển tú</b><br><span class="hint">${esc(selWhy || `Mỗi năm một lần, ${G.selectionCost()} lượng. Chọn trong bốn tú nữ.`)}</span></div><button class="btn btn-sm" id="a-select" ${selWhy ? "disabled" : ""}>Mở</button></div>
         <div class="row-card"><div><b>Tuần du</b><br><span class="hint">${G.canTravel() ? "Mỗi năm một chuyến. Mỗi vùng có mỹ nhân và chuyện riêng." : "Năm nay đã tuần du rồi."}</span></div><button class="btn btn-sm" id="a-travel" ${G.canTravel() ? "" : "disabled"}>Chọn vùng</button></div>
         ${(() => {
           const H = G.hanhCungNow && G.hanhCungNow();
           const hint = H ? (H.why ? H.why : `${H.desc} ${H.cost} lượng, mang theo ${H.take} phi; phi ở lại hơi buồn.`) : "Tháng 6: Tiểu thử sơn trang · Tháng 11: Suối nước nóng.";
           return `<div class="row-card"><div><b>Ngự giá hành cung${H ? " · " + esc(H.name) : ""}</b><br><span class="hint">${esc(hint)}</span></div><button class="btn btn-sm" id="a-hanh" ${H && !H.why ? "" : "disabled"}>Chọn phi</button></div>`;
         })()}
         <div class="row-card"><div><b>Cung quy</b><br><span class="hint">${(() => { const on = Object.keys(s.rules || {}).length; const n = Object.values(R.rules).filter((r) => G.ruleUnlocked(r)).length; return n ? `Lệ hậu cung đang bật ${on}, đã mở ${n}. Chỉ phi sẵn lòng mới theo; phi không theo làm Hòa khí giảm.` : "Chưa mở quy định nào (cần Trụy lạc hoặc sở thích)."; })()}</span></div><button class="btn btn-sm" id="a-rules">Xem</button></div>
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
        on(el, "#a-hanh", "click", openHanhCung);
        on(el, "#a-rules", "click", openRules);
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
  /** Sổ tay phòng the của nàng. */
  function renderBook(c) {
    const v = G.bookView(c);
    const nx = G.levelNext(c);
    const row = (k, val) => `<div class="bk-row"><span class="k">${k}</span><span>${val}</span></div>`;
    return `<div class="pane book" data-pane-body="book" hidden>
      <div class="bk-level"><b>Cấp thân mật: ${esc(G.levelName(c))}</b>${nx ? `<span class="hint">Lên ${esc(nx.name)}: còn ${nx.nights} đêm${nx.affection ? `, Tình cảm thêm ${nx.affection}` : ""}. Cấp này tự mở các sở thích cần thuyết phục đến tầng ${G.LEVEL_TIER[G.levelOf(c) + 1]}.</span>` : `<span class="hint">Cấp cao nhất. Nàng sẵn lòng với mọi sở thích không bị từ chối, và thỉnh thoảng tự xin thị tẩm.</span>`}</div>
      ${row("Số đêm", v.nights)}
      ${row("Đêm đầu tiên", v.first != null ? G.turnLabel(v.first) : "Chưa")}
      ${row("Gần nhất", v.last != null ? G.turnLabel(v.last) : "Chưa")}
      ${row("Nhiều hiệp nhất", v.maxRounds ? `${v.maxRounds} hiệp một đêm` : "Chưa")}
      ${row("Nơi nhạy cảm", v.spot ? esc(v.spot) : `<span class="hint">Biết sau ${v.spotLeft} đêm nữa</span>`)}
      ${row("Tư thế nàng thích", v.pose ? esc(v.pose) : `<span class="hint">Biết sau ${v.poseLeft} đêm nữa</span>`)}
      ${row("Đã thử", `${v.tried} sở thích`)}
      ${v.top.length ? `<div class="bk-sub">Hay dùng nhất</div><div class="row-wrap">${v.top.map((x) => pill(`${x.name} · ${x.n}`)).join("")}</div>` : ""}
      ${v.firsts.length ? `<div class="bk-sub">Lần đầu gần đây</div>${v.firsts.map((x) => row(esc(x.name), esc(x.when))).join("")}` : ""}
    </div>`;
  }
  let consortPane = "info";
  function openConsort(id) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c) return;
    const fets = Object.values(R.fetishes).sort((a, b) => a.tier - b.tier);
    const crownWhy = G.crownBlock ? G.crownBlock(c) : null;
    const canCrown = !s.consorts.some((x) => x.rank === 7) && c.favor >= 70;
    const wish = G.wishText ? G.wishText(c) : null;
    const queued = s.d2 && s.d2.sacQueue.find((q) => q.id === c.id);
    const partner = G.partnerOf(c.id);
    const gifts = Object.values(R.gifts).sort((a, b) => a.cost - b.cost);
    openSheet(
      `<div class="ev-head"><button class="whisper-btn" id="c-whisper" aria-label="Nghe nàng thì thầm">${portrait(c, "lg")}</button><div class="t"><span class="eyebrow">${esc(G.displayTitle(c))} · ${c.age} tuổi</span><h3>${esc(c.name)}</h3><span class="hint">${esc(c.origin)}</span>${G.levelName ? `<span class="lv-pill lv-${G.levelOf(c)}">${esc(G.levelName(c))}</span>` : ""}</div></div>
       <p class="whisper" id="c-whisper-text" hidden></p>
       ${meter("Sủng ái", c.favor)}
       ${meter("Tình cảm", c.affection, "gold")}
       <div class="choices">
         <button class="btn" id="c-visit">Ghé thăm</button>
         <button class="btn" id="c-night" ${G.cannotSummon(c) ? "disabled" : ""}>Triệu thị tẩm${G.cannotSummon(c) ? `<span class="cost">${esc(c.pregnantDue != null ? "Đang hoài thai" : G.isResting && G.isResting(c) ? "Tháng này nàng nghỉ" : "Chưa thể triệu")}</span>` : ""}</button>
         ${canCrown ? `<button class="btn" id="c-crown" ${crownWhy ? "disabled" : ""}>Lập làm Hoàng hậu${crownWhy ? `<span class="cost">${esc(crownWhy)}</span>` : ""}</button>` : ""}
       </div>
       <div class="seg" role="tablist">${[["info", "Chung"], ["gift", "Quà"], fets.length ? ["fx", "Sở thích"] : null, ["school", "Học phường"], G.bookView ? ["book", "Sổ tay"] : null, s.godMode ? ["god", "Thiên Đạo"] : null]
         .filter(Boolean)
         .map(([k, l]) => `<button class="seg-btn" role="tab" data-pane="${k}">${l}</button>`)
         .join("")}</div>
       <div class="pane" data-pane-body="info">
       <div class="row-wrap">${c.traits.map((t) => pill(t)).join("")}</div>
       <p class="hint">${c.nights} đêm thị tẩm · ${c.kids} con${c.contestWins ? ` · ${c.contestWins} lần thắng thi` : ""}${partner && partner.tinhY >= 31 ? ` · ${partner.status} với ${esc(partner.other.name)} (${Math.round(partner.tinhY)})` : ""}</p>
       ${wish ? `<p class="hint"><b>Tâm nguyện:</b> ${esc(wish.text)} · còn ${wish.left} tháng. Toại nguyện: Tình cảm +${G.WISH_AFFECTION}.</p>` : ""}
       ${queued ? `<p class="hint"><b>Chờ lễ sắc phong</b> lên ${esc(G.RANKS[queued.rank])} (${G.SAC_PHONG_COST[queued.rank]} lượng). Lễ bộ sẽ dâng tấu.</p>` : ""}
       </div>
       ${G.bookView ? renderBook(c) : ""}
       <div class="pane" data-pane-body="gift" hidden><div class="cards">${gifts
         .map((g) => `<div class="row-card"><div><b>${esc(g.name)}</b>${(g.likes || []).some((l) => c.likes.includes(l) || c.traits.includes(l) || l === c.id) ? " ♥" : ""}<br><span class="hint">${esc(g.desc || "")}${c.gifts[g.id] ? ` · đã tặng ${c.gifts[g.id]} lần` : ""}</span></div><button class="btn btn-sm" data-gift="${esc(g.id)}">${fmtMoney(g.cost)}</button></div>`)
         .join("")}</div></div>
       <div class="pane" data-pane-body="school" hidden>
         <div class="field"><label for="c-school">Lớp</label><select id="c-school"><option value="">Không học</option>${Object.entries(G.SUBJECTS).map(([k, v]) => `<option value="${k}" ${c.school === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
         <p class="hint">Các phi học chung lớp thân nhau hơn. Học đủ 12 tháng được trait tinh thông.${c.school ? ` Đã học ${c.schoolMonths} tháng.` : ""}</p>
       </div>
       ${
         fets.length
           ? `<div class="pane" data-pane-body="fx" hidden>
               ${s.godMode ? "" : `<div class="fx-tools"><input type="search" id="c-fxq" placeholder="Tìm sở thích…" aria-label="Tìm sở thích" autocomplete="off"><label class="check fx-only"><input type="checkbox" id="c-fxp"> Chỉ Cần thuyết phục</label></div>
               <p class="hint">Thuyết phục được khi Sủng ái và Tình cảm của nàng đều đạt mức cần (tầng 1: 60, tầng 2: 70, tầng 3: 80). "Cả hậu cung" thử với mọi phi.</p><p class="hint fx-msg" id="c-fxmsg" hidden></p>`}
               <div class="scroll-x" id="c-fxt"></div></div>`
           : ""
       }
       ${
         s.godMode
           ? `<div class="pane" data-pane-body="god" hidden>
               <div class="slider"><label for="g-fav">Sủng ái</label><input type="range" id="g-fav" min="0" max="100" value="${c.favor}"><output>${c.favor}</output></div>
               <div class="slider"><label for="g-aff">Tình cảm</label><input type="range" id="g-aff" min="0" max="100" value="${c.affection}"><output>${c.affection}</output></div>
               <div class="field"><label for="g-crank">Phẩm</label><select id="g-crank">${G.RANKS.map((r, i) => `<option value="${i}" ${c.rank === i ? "selected" : ""}>${r}</option>`).join("")}</select></div>
               <button class="btn btn-sm" id="g-birth">Cho sinh con ngay</button>
             </div>`
           : ""
       }
       <button class="btn btn-ghost" id="c-close">Đóng</button>
       <div class="danger-zone">
         <button class="btn btn-sm btn-danger-ghost" id="c-release-ask">Ban ân xuất cung…</button>
         <div id="c-release-box" hidden>
           <p class="hint">${esc(c.name)} sẽ rời cung về quê với hồi môn ${G.RELEASE_COST} lượng. <b>Không thể hoàn tác.</b></p>
           <div class="row-btns"><button class="btn btn-sm btn-danger" id="c-release">Xác nhận cho nàng xuất cung</button><button class="btn btn-sm btn-ghost" id="c-release-no">Thôi</button></div>
         </div>
       </div>`,
      (el) => {
        let fxQuery = "";
        let fxOnlyPersuade = false;
        const renderFx = () => {
          const box = el.querySelector("#c-fxt");
          if (!box) return;
          const q = fold(fxQuery.trim());
          const shown = fets.filter((f) => (!q || fold(f.name).includes(q) || fold(f.id).includes(q)) && (!fxOnlyPersuade || (G.consentOf(c, f.id) === "persuade" && G.fetishUnlocked(f.id))));
          box.innerHTML = shown.length
            ? `<table class="mini-table">${shown
                .map((f) => {
                  const lvl = G.consentOf(c, f.id);
                  const open = G.fetishUnlocked(f.id);
                  let cell;
                  if (s.godMode) cell = `<select data-consent="${esc(f.id)}">${G.CONSENT.map((x) => `<option value="${x}" ${x === lvl ? "selected" : ""}>${G.CONSENT_LABEL[x]}</option>`).join("")}</select>`;
                  else if (lvl === "persuade" && open) {
                    const need = G.persuadeNeedFor ? G.persuadeNeedFor(c, f.id) : G.persuadeNeed(f.id);
                    const fv = Math.round(c.favor);
                    const af = Math.round(c.affection);
                    const ready = fv >= need && af >= need;
                    cell = `${esc(G.CONSENT_LABEL[lvl])}<br><span class="hint">Cần ${need}/${need} · nàng <b class="${fv >= need ? "" : "short"}">${fv}</b>/<b class="${af >= need ? "" : "short"}">${af}</b></span><br><button class="btn btn-sm${ready ? " btn-primary" : ""}" data-persuade="${esc(f.id)}">Thuyết phục</button> <button class="btn btn-sm btn-ghost" data-persuade-all="${esc(f.id)}">Cả hậu cung</button>`;
                  } else cell = esc(G.CONSENT_LABEL[lvl]);
                  return `<tr><td>${esc(f.name)}${c.likes.includes(f.id) ? " ♥" : ""}<br><span class="hint">Tầng ${f.tier}${open ? "" : " · chưa mở"}</span></td><td>${cell}</td></tr>`;
                })
                .join("")}</table>`
            : `<p class="empty">Không có sở thích nào khớp.</p>`;
        };
        const fxMsg = (text) => {
          const m = el.querySelector("#c-fxmsg");
          if (!m) return;
          m.textContent = text;
          m.hidden = false;
        };
        renderFx();
        on(el, "#c-fxq", "input", (inp) => {
          fxQuery = inp.value;
          renderFx();
        });
        on(el, "#c-fxp", "change", (inp) => {
          fxOnlyPersuade = inp.checked;
          renderFx();
        });
        $(el, "#c-close").addEventListener("click", () => closeSheet());
        // tab trong hồ sơ: nhớ tab đã chọn lần trước
        const showPane = (k) => {
          if (!el.querySelector(`[data-pane-body="${k}"]`)) k = "info";
          consortPane = k;
          for (const b of el.querySelectorAll("[data-pane]")) b.setAttribute("aria-selected", b.dataset.pane === k);
          for (const p of el.querySelectorAll("[data-pane-body]")) p.hidden = p.dataset.paneBody !== k;
        };
        showPane(consortPane);
        on(el, "#c-whisper", "click", () => {
          const box = $(el, "#c-whisper-text");
          const lv = G.levelOf(c);
          box.innerHTML = formatText(G.fill(G.d3one(G.D7_TEXT.whisper[lv]), { speaker: c }));
          box.hidden = false;
          box.classList.remove("pop");
          void box.offsetWidth;
          box.classList.add("pop");
        });
        on(el, "[data-pane]", "click", (b) => showPane(b.dataset.pane));
        on(el, "#c-release-ask", "click", (b) => {
          b.hidden = true;
          $(el, "#c-release-box").hidden = false;
        });
        on(el, "#c-release-no", "click", () => {
          $(el, "#c-release-box").hidden = true;
          $(el, "#c-release-ask").hidden = false;
        });
        $(el, "#c-visit").addEventListener("click", () => openTalk(c));
        $(el, "#c-night").addEventListener("click", () => openNight(c));
        on(el, "#c-crown", "click", () => {
          const ev = G.crownEvent ? G.crownEvent(c.id) : null;
          if (ev) showEvent(ev);
          else showMessage("Lập hậu", (G.crownBlock && G.crownBlock(c)) || "Chưa thể lập hậu.");
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
        // bảng sở thích được vẽ lại, nên bắt sự kiện bấm trên cả hộp
        const fxBox = el.querySelector("#c-fxt");
        if (fxBox)
          fxBox.addEventListener("click", (e) => {
            const one = e.target.closest("[data-persuade]");
            const all = e.target.closest("[data-persuade-all]");
            if (one) {
              const r = G.persuade(c.id, one.dataset.persuade);
              if (r) fxMsg(r.text);
            } else if (all) {
              const r = G.persuadeAll(all.dataset.persuadeAll);
              if (r) fxMsg(r.text);
            } else return;
            G.save();
            renderFx();
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

  /** Ghé thăm: chọn cách nói chuyện, nàng phản ứng theo tính cách. */
  function openTalk(c) {
    const s = G.state;
    const can = G.talkAvailable ? G.talkAvailable(c) : false;
    const known = (s.d3 && s.d3.talkKnown && s.d3.talkKnown[c.id]) || {};
    const mark = { good: " ♥", bad: " ✗", ok: " ·" };
    const sulk = G.isSulking && G.isSulking(c);
    const greet = sulk ? G.fill(G.d3one(G.D3_TEXT.sulkLine), { speaker: c }) : `> ${c.favor >= 60 ? c.lines.high || "Bệ hạ đến rồi! Thiếp chờ mãi." : c.lines.low || "Thần thiếp tham kiến bệ hạ."}`;
    openSheet(
      `<div class="ev-head">${portrait(c, "lg")}<div class="t"><span class="eyebrow">Ghé thăm · ${esc(G.displayTitle(c))}</span><h3>${esc(c.name)}</h3></div></div>
       <p class="ev-text">${formatText(greet)}</p>
       ${can ? `<p class="hint">Nói đúng ý nàng: Tình cảm +4, Sủng ái +2, tháng này thuyết phục dễ hơn ${G.TALK_BONUS} điểm. ♥ đúng ý · ✗ không hợp · · bình thường (đã thử).</p>` : `<p class="hint">Tháng này đã trò chuyện với nàng rồi. Ghé thăm vẫn được Sủng ái +3, Tình cảm +2.</p>`}
       <div class="choices">${can ? Object.entries(G.D3_TEXT.talk).map(([k, v]) => `<button class="btn" data-talk="${k}">${esc(v.label)}${known[k] ? mark[known[k]] : ""}</button>`).join("") : ""}
         ${G.canPlayGame ? `<button class="btn" id="t-game" ${G.canPlayGame(c) ? "" : "disabled"}>Chơi một ván cùng nàng${G.canPlayGame(c) ? "" : `<span class="cost">tháng này đã chơi</span>`}</button>` : ""}
         <button class="btn btn-ghost" data-talk="">Chỉ ghé thăm</button></div>`,
      (el) => {
        on(el, "#t-game", "click", () => openGames(c));
        on(el, "[data-talk]", "click", (b) => {
          const opt = b.dataset.talk;
          if (!opt) {
            const line = G.visit(c.id);
            G.save();
            return showMessage(c.name, line, ["Sủng ái +3", "Tình cảm +2"]);
          }
          const r = G.talk(c.id, opt);
          G.save();
          if (r) showMessage(c.name, r.text, r.notes);
        });
      }
    );
  }

  /* ---------------- Mini game ---------------- */
  function openGames(c) {
    const head = `<div class="ev-head">${portrait(c)}<div class="t"><span class="eyebrow">Chơi cùng ${esc(c.name)}</span><h3>Chọn trò</h3></div></div>`;
    openSheet(
      `${head}<p class="hint">Mỗi tháng chơi với mỗi phi một ván. Thắng: Tình cảm +5. Thua hay hòa nàng vẫn vui: Tình cảm +3. Trò nàng thích (♥) được thêm +2.</p>
       <div class="choices">${Object.entries(G.MINI_GAMES).map(([k, g]) => `<button class="btn" data-game="${k}">${esc(g.name)}${g.likes.some((x) => c.traits.includes(x)) ? " ♥" : ""}<span class="cost">${esc(g.desc)}</span></button>`).join("")}</div>`,
      (el) => on(el, "[data-game]", "click", (b) => ({ dau_ho: gameDauHo, hoa_dang: gameHoaDang, doi_tho: gameDoiTho, danh_co: gameDanhCo })[b.dataset.game](c))
    );
  }
  function endGame(c, id, outcome, line) {
    const r = G.miniGameResult(c, id, outcome);
    G.save();
    if (r) showMessage(`${G.MINI_GAMES[id].name} · ${outcome === "win" ? "Bệ hạ thắng" : outcome === "draw" ? "Hòa" : "Nàng thắng"}`, (line ? line + "\n\n" : "") + r.text, r.notes);
  }
  const gameHead = (c, id, sub) => `<div class="ev-head">${portrait(c, "sm")}<div class="t"><span class="eyebrow">${esc(c.name)}</span><h3>${esc(G.MINI_GAMES[id].name)}</h3></div></div><p class="hint" id="g-sub">${sub}</p>`;

  // Ném thẻ vào bình: kim chạy qua lại, bấm khi kim nằm trong vùng sáng
  function gameDauHo(c) {
    let shot = 0, hit = 0, pos = 0, dir = 1, raf = 0, last = 0, live = true;
    const speed = 0.9 + Math.random() * 0.3; // phần thanh mỗi giây
    let zone = null;
    const newZone = () => {
      const w = 0.16 + Math.random() * 0.06;
      const x = 0.12 + Math.random() * (0.76 - w);
      zone = [x, x + w];
    };
    newZone();
    openSheet(
      `${gameHead(c, "dau_ho", "Bấm Ném khi kim nằm trong vùng sáng. Năm lần, trúng ba là thắng.")}
       <div class="dh-bar" id="dh-bar"><span class="dh-zone" id="dh-zone"></span><span class="dh-needle" id="dh-needle"></span></div>
       <div class="dh-score" id="dh-score">${"○".repeat(5)}</div>
       <button class="btn btn-primary" id="dh-go">Ném</button>`,
      (el) => {
        const needle = $(el, "#dh-needle");
        const z = $(el, "#dh-zone");
        const drawZone = () => {
          z.style.left = zone[0] * 100 + "%";
          z.style.width = (zone[1] - zone[0]) * 100 + "%";
        };
        drawZone();
        const tick = (ts) => {
          if (!live || !el.contains(needle)) return;
          const dt = last ? (ts - last) / 1000 : 0;
          last = ts;
          pos += dir * speed * (1 + shot * 0.12) * dt;
          if (pos > 1) (pos = 1), (dir = -1);
          if (pos < 0) (pos = 0), (dir = 1);
          needle.style.left = pos * 100 + "%";
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        $(el, "#dh-go").addEventListener("click", () => {
          if (!live) return;
          const ok = pos >= zone[0] && pos <= zone[1];
          shot++;
          if (ok) hit++;
          const marks = [...$(el, "#dh-score").textContent];
          marks[shot - 1] = ok ? "●" : "×";
          $(el, "#dh-score").textContent = marks.join("");
          $(el, "#g-sub").textContent = ok ? "Trúng! Thẻ rơi gọn vào miệng bình." : "Trượt rồi, thẻ chạm vành bình bật ra.";
          if (shot >= 5 || hit >= 3 || shot - hit > 2) {
            live = false;
            cancelAnimationFrame(raf);
            setTimeout(() => endGame(c, "dau_ho", hit >= 3 ? "win" : "lose", `Trúng ${hit} trên ${shot} lần ném.`), 500);
          } else {
            newZone();
            drawZone();
          }
        });
      },
      { locked: true }
    );
  }

  // Thả đèn hoa đăng: đèn hiện chỗ ngẫu nhiên trên mặt hồ, chạm trước khi đèn trôi mất
  function gameHoaDang(c) {
    const NEED = 7, TIME = 14;
    let got = 0, left = TIME, live = true;
    openSheet(
      `${gameHead(c, "hoa_dang", `Chạm vào đèn trước khi đèn trôi đi. Đủ ${NEED} chiếc trong ${TIME} giây là thắng.`)}
       <div class="hd-lake" id="hd-lake"></div>
       <div class="hd-info"><span class="pill" id="hd-got">0/${NEED} đèn</span><span class="pill" id="hd-time">${TIME} giây</span></div>`,
      (el) => {
        const lake = $(el, "#hd-lake");
        const finish = () => {
          if (!live) return;
          live = false;
          clearInterval(clock);
          clearInterval(spawn);
          setTimeout(() => endGame(c, "hoa_dang", got >= NEED ? "win" : "lose", `Thả được ${got} chiếc đèn.`), 400);
        };
        const add = () => {
          if (!live || !el.contains(lake)) return;
          const d = document.createElement("button");
          d.className = "hd-lamp";
          d.setAttribute("aria-label", "Đèn hoa đăng");
          d.style.left = 6 + Math.random() * 78 + "%";
          d.style.top = 8 + Math.random() * 70 + "%";
          d.addEventListener("pointerdown", () => {
            if (!live || d.dataset.done) return;
            d.dataset.done = "1";
            d.classList.add("got");
            got++;
            $(el, "#hd-got").textContent = `${got}/${NEED} đèn`;
            if (got >= NEED) finish();
          });
          lake.appendChild(d);
          setTimeout(() => d.remove(), 1300);
        };
        const spawn = setInterval(add, 620);
        add();
        const clock = setInterval(() => {
          left--;
          const tm = el.querySelector("#hd-time");
          if (tm) tm.textContent = `${left} giây`;
          if (left <= 0) finish();
        }, 1000);
      },
      { locked: true }
    );
  }

  // Đối thơ: ba câu, chọn vế dưới đúng
  function gameDoiTho(c) {
    const qs = shuffleArr(G.COUPLETS.slice()).slice(0, 3);
    let i = 0, ok = 0;
    const round = () => {
      const [a, b] = qs[i];
      const wrong = shuffleArr(G.COUPLETS.filter((x) => x[1] !== b).map((x) => x[1])).slice(0, 2);
      const opts = shuffleArr([b].concat(wrong));
      openSheet(
        `${gameHead(c, "doi_tho", `Câu ${i + 1}/3 · đã đối đúng ${ok}`)}
         <p class="ev-text"><span class="q">${esc(a)}</span></p>
         <div class="choices">${opts.map((o) => `<button class="btn" data-op="${esc(o)}">${esc(o)}</button>`).join("")}</div>`,
        (el) =>
          on(el, "[data-op]", "click", (btn) => {
            const right = btn.dataset.op === b;
            if (right) ok++;
            for (const x of el.querySelectorAll("[data-op]")) {
              x.disabled = true;
              if (x.dataset.op === b) x.classList.add("btn-primary");
            }
            $(el, "#g-sub").textContent = right ? "Đối chuẩn! Nàng gật gù tán thưởng." : "Chưa chỉnh lắm, nàng mỉm cười chỉ vế đúng.";
            setTimeout(() => {
              i++;
              if (i < 3) round();
              else endGame(c, "doi_tho", ok >= 2 ? "win" : "lose", `Đối đúng ${ok} trên 3 câu.`);
            }, 900);
          }),
        { locked: true }
      );
    };
    round();
  }

  // Đánh cờ ba quân (3x3). Nàng giỏi cờ thì đi chặt hơn.
  // quân cờ: bệ hạ = đồng xu vàng có chữ thập, nàng = bông hoa hồng
  const PIECE_X = `<svg viewBox="0 0 40 40" aria-label="Quân bệ hạ"><circle cx="20" cy="20" r="15" fill="#d9ad55"/><circle cx="20" cy="20" r="11" fill="none" stroke="#7a5418" stroke-width="2"/><path d="M20 11 L22.6 17.4 L29 20 L22.6 22.6 L20 29 L17.4 22.6 L11 20 L17.4 17.4Z" fill="#7a5418"/></svg>`;
  const PIECE_O = `<svg viewBox="0 0 40 40" aria-label="Quân của nàng">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(20 + Math.cos(((a - 90) * Math.PI) / 180) * 8).toFixed(1)}" cy="${(20 + Math.sin(((a - 90) * Math.PI) / 180) * 8).toFixed(1)}" r="7" fill="#f3a6bd"/>`).join("")}<circle cx="20" cy="20" r="5" fill="#d9ad55"/></svg>`;
  function gameDanhCo(c) {
    const b = Array(9).fill("");
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const smart = ["Sâu sắc", "Lanh lợi", "Thông minh", "Hai mặt", "Kiêu kỳ"].some((x) => c.traits.includes(x)) ? 0.9 : 0.6;
    const winner = () => {
      for (const [x, y, z] of L) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
      return b.every(Boolean) ? "draw" : null;
    };
    const finder = (m) => {
      for (const l of L) {
        const v = l.map((k) => b[k]);
        if (v.filter((q) => q === m).length === 2 && v.includes("")) return l[v.indexOf("")];
      }
      return -1;
    };
    const herMove = () => {
      let k = -1;
      if (Math.random() < smart) k = finder("o");
      if (k < 0 && Math.random() < smart) k = finder("x");
      if (k < 0 && !b[4] && Math.random() < smart) k = 4;
      if (k < 0) {
        const free = b.map((v, j) => (v ? -1 : j)).filter((j) => j >= 0);
        k = free[Math.floor(Math.random() * free.length)];
      }
      if (k >= 0) b[k] = "o";
    };
    let over = false;
    const draw = (msg) =>
      openSheet(
        `${gameHead(c, "danh_co", msg)}
         <div class="co-board">${b.map((v, j) => `<button class="co-cell ${v}" data-cell="${j}" ${v || over ? "disabled" : ""} aria-label="Ô ${j + 1}">${v === "x" ? PIECE_X : v === "o" ? PIECE_O : ""}</button>`).join("")}</div>`,
        (el) =>
          on(el, "[data-cell]", "click", (btn) => {
            const j = Number(btn.dataset.cell);
            if (over || b[j]) return;
            b[j] = "x";
            let w = winner();
            if (!w) {
              herMove();
              w = winner();
            }
            if (w) {
              over = true;
              const outcome = w === "x" ? "win" : w === "o" ? "lose" : "draw";
              draw(outcome === "win" ? "Ba quân của bệ hạ thẳng hàng!" : outcome === "lose" ? "Nàng xếp được ba quân trước." : "Kín bàn, hòa.");
              setTimeout(() => endGame(c, "danh_co", outcome), 900);
            } else draw("Đến lượt bệ hạ.");
          }),
        { locked: true }
      );
    draw(`Bệ hạ đi trước, cầm quân vàng <span class="co-mini">${PIECE_X}</span>. Nàng cầm quân hoa hồng <span class="co-mini">${PIECE_O}</span>.`);
  }
  function shuffleArr(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

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
        <label class="check"><input type="checkbox" data-fx="${esc(f.id)}" ${on ? "checked" : ""} ${ok ? "" : "disabled"}> <span>${esc(f.name)}${c.likes.includes(f.id) ? " ♥" : ""} <span class="hint">· ${esc(G.CONSENT_LABEL[lvl])}${lvl === "persuade" ? ` (cần ${G.persuadeNeedFor ? G.persuadeNeedFor(c, f.id) : G.persuadeNeed(f.id)}, nàng ${Math.round(c.favor)}/${Math.round(c.affection)})` : ""}</span></span></label>
        ${lvl === "persuade" ? `<button class="btn btn-sm btn-ghost" data-pers="${esc(f.id)}">Thuyết phục</button>` : ""}
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
       ${G.fateNow && G.fateNow(c) ? `<p class="hint fate-hint">Duyên trời: triệu nàng đêm nay được Tình cảm +${G.FATE_BONUS}.</p>` : ""}
       ${G.state.summonStreak.id === c.id && G.state.summonStreak.count >= G.JEALOUS_AT - 1 ? `<p class="hint warn-hint">Đã triệu nàng ${G.state.summonStreak.count} đêm liền. Đêm nay sẽ có phi khác ghen.</p>` : ""}
       ${
         fets.length
           ? `<p class="hint">Chọn sở thích cho đêm nay (tùy chọn). Chọn hai sở thích hợp nhau để mở combo. Bấm ☆ để ghim lên đầu. Bỏ chọn "Chỉ điều nàng sẵn lòng" để thấy và thuyết phục những sở thích nàng còn ngại.</p>
              <div class="fx-tools">
                <input type="search" id="fx-q" placeholder="Tìm sở thích…" aria-label="Tìm sở thích" autocomplete="off">
                <label class="check fx-only"><input type="checkbox" id="fx-only" checked> Chỉ điều nàng sẵn lòng</label>
              </div>
              <div id="fx-status" class="fx-status"></div>
              <p class="hint fx-msg" id="fx-msg" hidden></p>
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
            const pers = e.target.closest && e.target.closest("[data-pers]");
            if (pers) {
              const r = G.persuade(c.id, pers.dataset.pers);
              const m = $(el, "#fx-msg");
              if (r && m) {
                m.textContent = r.text;
                m.hidden = false;
              }
              G.save();
              renderList(el);
              return;
            }
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
          const mood = G.nightMood ? G.nightMood(c) : null;
          if (mood) {
            G.save();
            return showMood(c, mood);
          }
          const scene = G.summon(c.id, [...picked]);
          const later = scene && !scene.blocked ? G.rollNightEvent(c.id) : null;
          G.save();
          if (scene && scene.jealous) queue.push(() => showJealous(scene.jealous));
          if (later) queue.push(() => showLaterEvent(later));
          showScene(scene);
        });
      }
    );
  }

  /** Một thẻ tên: mặt trước ghi tên, mặt sau là ấn "Đêm nay". */
  function tablet(c, faceDown) {
    const pr = G.promiseNow && G.promiseNow();
    const tags = [
      G.isSulking && G.isSulking(c) ? pill("Đang dỗi", "preg") : "",
      pr && pr.c.id === c.id && !pr.done ? pill(pr.thisMonth ? "Hẹn tháng này" : "Hẹn tháng sau", "pair") : "",
      G.state.summonStreak.id === c.id && G.state.summonStreak.count >= 1 ? pill(`${G.state.summonStreak.count} đêm liền`, "rank") : "",
    ].filter(Boolean).join(" ");
    return `<button class="tablet${faceDown ? " down" : ""}" data-tablet="${esc(c.id)}" aria-label="${faceDown ? "Thẻ úp" : esc(c.name)}">
      <span class="tablet-in">
        <span class="tablet-face front">${portrait(c)}<span class="t-name">${esc(c.name)}</span><span class="t-rank">${esc(G.displayTitle(c))}</span>${tags ? `<span class="t-tags">${tags}</span>` : ""}<span class="t-favor">${bar(c.favor)}<span>Sủng ái ${Math.round(c.favor)}</span></span></span>
        <span class="tablet-face back"><span class="seal">御</span><span class="t-back">${faceDown ? "Thẻ úp" : "Đêm nay"}</span></span>
      </span>
    </button>`;
  }
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FLIP_MS = 620;

  function openSummon() {
    const s = G.state;
    const list = s.consorts.filter((c) => !G.cannotSummon(c)).sort((a, b) => b.favor - a.favor);
    const fate = G.canDrawFate && G.canDrawFate();
    let busy = false;
    openSheet(
      `<h3>Lật thẻ bài</h3><p class="hint">Lý công công dâng khay thẻ tên. Bệ hạ chạm vào thẻ để lật, đêm nay chọn ai?</p>
       ${list.length >= 2 ? `<button class="btn fate-btn" id="sm-fate" ${fate ? "" : "disabled"}>Bốc thẻ úp · duyên trời <span class="hint">${fate ? `Tình cảm +${G.FATE_BONUS} nếu triệu người bốc được` : "tháng này đã bốc"}</span></button>` : ""}
       ${list.length ? `<div class="tray">${list.map((c) => tablet(c)).join("")}</div>` : `<p class="empty">Không có phi tần nào có thể thị tẩm.</p>`}
       <button class="btn btn-ghost" id="sm-close">Đóng</button>`,
      (el) => {
        $(el, "#sm-close").addEventListener("click", closeSheet);
        const f = el.querySelector("#sm-fate");
        if (f) f.addEventListener("click", openFate);
        on(el, "[data-tablet]", "click", (b) => {
          if (busy) return;
          busy = true;
          const c = G.findConsort(b.dataset.tablet);
          if (reduceMotion()) return openNight(c);
          b.classList.add("down", "picked");
          setTimeout(() => openNight(c), FLIP_MS);
        });
      }
    );
  }

  /** Bốc 3 thẻ úp: lật một thẻ, hai thẻ còn lại lật theo cho biết suýt nữa là ai. */
  function openFate() {
    const cards = G.drawFate();
    G.save();
    if (!cards.length) return openSummon();
    let chosen = null;
    openSheet(
      `<h3>Duyên trời</h3><p class="hint">${esc(G.D4_TEXT.fateIntro)}</p>
       <div class="tray tray-3">${cards.map((c) => tablet(c, true)).join("")}</div>
       <p class="ev-text" id="fate-msg" hidden></p>
       <div class="choices" id="fate-act" hidden><button class="btn btn-primary" id="fate-go">Triệu nàng</button><button class="btn btn-ghost" id="fate-skip">Để sau</button></div>`,
      (el) => {
        on(el, "[data-tablet]", "click", (b) => {
          if (chosen) return;
          chosen = G.findConsort(b.dataset.tablet);
          G.chooseFate(chosen.id);
          G.save();
          b.classList.remove("down");
          b.classList.add("picked");
          const rest = [...el.querySelectorAll("[data-tablet]")].filter((x) => x !== b);
          const done = () => {
            for (const x of rest) x.classList.remove("down"), x.classList.add("dim");
            const m = $(el, "#fate-msg");
            m.innerHTML = formatText(`Thẻ lật lên: ${chosen.name}. Triệu nàng đêm nay được Tình cảm +${G.FATE_BONUS}. Ưu đãi giữ đến hết tháng.`);
            m.hidden = false;
            $(el, "#fate-act").hidden = false;
          };
          if (reduceMotion()) done();
          else setTimeout(done, FLIP_MS + 250);
        });
        $(el, "#fate-go").addEventListener("click", () => openNight(chosen));
        $(el, "#fate-skip").addEventListener("click", closeSheet);
      },
      { locked: true }
    );
  }

  /** Nàng xin dời một đêm: an ủi, hoặc để nàng nghỉ. Không có lựa chọn ép nàng. */
  function showMood(c, mood) {
    openSheet(
      `<div class="ev-head">${portrait(c, "lg")}<div class="t"><span class="eyebrow">${esc(mood.label)} · ${esc(G.displayTitle(c))}</span><h3>Đêm không như ý</h3></div></div>
       <p class="ev-text">${formatText(mood.text)}</p>
       <div class="choices">
         <button class="btn" data-mood="comfort">Ở lại an ủi nàng<span class="cost">Tình cảm +6, không thị tẩm</span></button>
         <button class="btn" data-mood="other">Để nàng nghỉ, triệu người khác<span class="cost">Tình cảm +2</span></button>
         <button class="btn btn-ghost" data-mood="rest">Để nàng nghỉ</button>
       </div>`,
      (el) =>
        on(el, "[data-mood]", "click", (b) => {
          const k = b.dataset.mood;
          const r = k === "comfort" ? G.moodComfort(c, mood.kind) : G.moodRest(c);
          G.save();
          if (k === "other") queue.push(openSummon);
          showMessage(c.name, r.text, r.notes);
        }),
      { locked: true }
    );
  }

  function showJealous(j) {
    openSheet(
      `<div class="ev-head">${portrait(j.c, "lg")}<div class="t"><span class="eyebrow">${esc(j.c.name)} · ${esc(G.displayTitle(j.c))}</span><h3>Ghen tuông</h3></div></div>
       <p class="ev-text">${formatText(j.text)}</p>${notesHtml(j.notes)}<button class="btn btn-primary" id="s-ok">Tiếp</button>`,
      (el) => $(el, "#s-ok").addEventListener("click", closeSheet)
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
    recruitPicker("Tuyển tú", "Bốn tú nữ vào vòng cuối, tất cả từ 18 tuổi trở lên. Chọn người được lưu bài tử.", recruits, G.selectionCost());
  }

  function openHanhCung() {
    const H = G.hanhCungNow();
    if (!H || H.why) return showMessage("Ngự giá hành cung", (H && H.why) || "Chưa đến mùa đi hành cung.");
    const list = G.state.consorts.filter((c) => c.pregnantDue == null).sort((a, b) => b.favor - a.favor);
    const picked = new Set();
    openSheet(
      `<h3>${esc(H.name)}</h3><p class="hint">${esc(H.desc)} Chọn tối đa ${H.take} phi. ${H.cost} lượng.</p>
       <div class="check-list">${list.map((c) => `<label class="check"><input type="checkbox" data-hc="${esc(c.id)}"> <span>${esc(c.name)} <span class="hint">· ${esc(G.displayTitle(c))} · Sủng ái ${c.favor}${G.factionOf && G.factionOf(c.id) ? " · phe " + esc((G.findConsort(G.factionOf(c.id)) || {}).name || "") : ""}</span></span></label>`).join("")}</div>
       <p class="hint" id="hc-n">Chưa chọn ai.</p>
       <div class="choices"><button class="btn btn-primary" id="hc-go" disabled>Ngự giá</button><button class="btn btn-ghost" id="hc-close">Thôi</button></div>`,
      (el) => {
        $(el, "#hc-close").addEventListener("click", closeSheet);
        el.querySelector(".sheet-card").addEventListener("change", (e) => {
          const id = e.target.dataset && e.target.dataset.hc;
          if (!id) return;
          if (e.target.checked) {
            if (picked.size >= H.take) {
              e.target.checked = false;
              return;
            }
            picked.add(id);
          } else picked.delete(id);
          $(el, "#hc-n").textContent = picked.size ? `Đã chọn ${picked.size}/${H.take}.` : "Chưa chọn ai.";
          $(el, "#hc-go").disabled = !picked.size;
        });
        $(el, "#hc-go").addEventListener("click", () => {
          const scene = G.goHanhCung([...picked]);
          G.save();
          if (scene) showScene(scene);
          else closeSheet();
        });
      }
    );
  }

  function openTravel() {
    if (!G.canTravel()) return showMessage("Tuần du", "Năm nay đã tuần du rồi.");
    const regions = Object.values(R.regions);
    openSheet(
      `<h3>Tuần du</h3><p class="hint">Mỗi năm một chuyến. Long thể −3, Trụy lạc +4. Mỗi vùng có mỹ nhân và sự kiện riêng.</p>
       <div class="cards">${regions.map((r) => `<div class="row-card"><div><b>${esc(r.name)}</b><br><span class="hint">${esc(r.desc || "")}</span></div><button class="btn btn-sm" data-region="${esc(r.id)}">${fmtMoney(G.regionCost ? G.regionCost(r) : r.cost)}</button></div>`).join("")}</div>
       <button class="btn btn-ghost" id="tr-close">Thôi</button>`,
      (el) => {
        $(el, "#tr-close").addEventListener("click", closeSheet);
        on(el, "[data-region]", "click", (b) => {
          const r = G.travel(b.dataset.region);
          if (!r) return;
          if (!r.ok) return showMessage("Tuần du", r.text);
          G.save();
          recruitPicker("Tuần du " + r.region.name, r.region.arrive || `Đoàn thuyền rồng cập bến ${r.region.name}. Địa phương dâng mỹ nhân.`, r.recruits, G.regionCost ? G.regionCost(r.region) : r.region.cost);
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
