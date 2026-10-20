/* Giao diện. Chỉ đọc/ghi qua API của Game; không chứa luật chơi. */
(function () {
  "use strict";
  const G = window.Game;
  const R = G.registry;
  const UI = (G.ui = {});
  const $app = () => document.getElementById("app");
  const $sheet = () => document.getElementById("sheet");
  let tab = "log";
  const queue = [];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  UI.esc = esc;

  /* ---------------- Chân dung ---------------- */
  function portrait(c, size) {
    const p = c.portrait || {};
    const hue = p.hue != null ? p.hue : hashHue(c.id || c.name);
    const glyph = p.glyph || (c.name || "?").trim().split(" ").pop()[0];
    const mood = c.favor >= 70 ? " mood-high" : "";
    const img = p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : "";
    return `<span class="portrait${size === "lg" ? " lg" : ""}${mood}" style="--h:${hue}" aria-hidden="true">${esc(glyph)}${img}</span>`;
  }
  function hashHue(s) {
    let h = 0;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  /* ---------------- Màn mở đầu ---------------- */
  UI.renderGate = function () {
    const rating = (R.packs.map((p) => p.rating).find((r) => r) || "25+").replace(/\+$/, "");
    const canContinue = G.hasSave();
    $app().innerHTML = `
      <section class="gate">
        <div class="seal">帝</div>
        <h1><small>Mô phỏng hậu cung · ${esc(rating)}+</small>Tửu Sắc Đế Vương</h1>
        <p>Mười tám tuổi, bạn đăng cơ. Thiên hạ thái bình, chỉ có hậu cung còn trống. Lấp đầy nó, chinh phục từng mỹ nhân, để lại con cháu đầy nhà.</p>
        <div class="notice"><strong>Nội dung dành cho người từ ${esc(rating)} tuổi.</strong> Mọi nhân vật trong game đều từ 18 tuổi trở lên. Cảnh thân mật do các gói nội dung cung cấp và chỉ chạy khi nhân vật sẵn lòng.</div>
        <label class="check"><input type="checkbox" id="age-ok"> <span>Tôi xác nhận mình đủ ${esc(rating)} tuổi.</span></label>
        <div class="field"><label for="emp-name">Niên hiệu</label><input id="emp-name" value="Hạ Huyền Đế" maxlength="30" autocomplete="off"></div>
        <label class="check"><input type="checkbox" id="god-on"> <span>Bật Thiên Đạo (God Mode). Lượt chơi sẽ không tính thành tựu.</span></label>
        <div class="actions">
          <button class="btn btn-primary" id="btn-new" disabled>Đăng cơ</button>
          ${canContinue ? `<button class="btn" id="btn-cont" disabled>Tiếp tục lượt cũ</button>` : ""}
        </div>
        ${packSummary()}
      </section>`;
    const ok = document.getElementById("age-ok");
    const bNew = document.getElementById("btn-new");
    const bCont = document.getElementById("btn-cont");
    ok.addEventListener("change", () => {
      bNew.disabled = !ok.checked;
      if (bCont) bCont.disabled = !ok.checked;
    });
    bNew.addEventListener("click", () => {
      G.newState({ name: document.getElementById("emp-name").value.trim() || "Hạ Huyền Đế", godMode: document.getElementById("god-on").checked });
      G.save();
      tab = "log";
      UI.render();
    });
    if (bCont)
      bCont.addEventListener("click", () => {
        if (G.loadSave()) UI.render();
      });
  };

  function packSummary() {
    const errs = R.errors.length ? `<div class="err">${R.errors.length} lỗi khi nạp gói. Xem tab Gói sau khi vào game.</div>` : "";
    return `<p style="font-size:12.5px">Đã nạp ${R.packs.length} gói: ${R.packs.map((p) => esc(p.name)).join(", ")}.</p>${errs}`;
  }

  /* ---------------- Màn chính ---------------- */
  UI.render = function () {
    const s = G.state;
    if (!s) return UI.renderGate();
    if (s.ended) return renderEnding();
    const tabs = [
      ["log", "Nhật ký"],
      ["harem", `Hậu cung · ${s.consorts.length}`],
      ["kids", `Con cái · ${s.children.length}`],
      ["fetish", "Sở thích"],
      ["packs", "Gói"],
    ];
    if (s.godMode) tabs.push(["god", "Thiên Đạo"]);
    $app().innerHTML = `
      <header class="topbar">
        <div class="who">
          <h2>${esc(s.emperorName)}</h2>
          <span class="date">${s.godMode ? '<span class="god-badge">Thiên Đạo · </span>' : ""}${s.age} tuổi · năm ${s.year}, tháng ${s.month}</span>
        </div>
        <div class="stats">${Object.entries(G.STATS)
          .map(([k, d]) => {
            const v = s.stats[k];
            const pct = k === "quocKho" ? Math.min(100, v / 100) : v;
            return `<div class="stat ${k}"><span class="k">${d.label}</span><span class="v">${k === "quocKho" ? fmtMoney(v) : Math.round(v)}</span><span class="bar"><i style="width:${pct}%"></i></span></div>`;
          })
          .join("")}</div>
        <nav class="tabs" role="tablist">${tabs.map(([id, l]) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${tab === id}">${l}</button>`).join("")}</nav>
      </header>
      <main id="view">${renderTab()}</main>
      <div class="dock"><div class="dock-inner">
        <button class="btn" id="b-summon">Lật thẻ</button>
        <button class="btn" id="b-select">Tuyển tú</button>
        <button class="btn btn-primary" id="b-next">Qua tháng</button>
      </div></div>`;
    $app().querySelectorAll(".tab").forEach((b) =>
      b.addEventListener("click", () => {
        tab = b.dataset.tab;
        UI.render();
      })
    );
    document.getElementById("b-next").addEventListener("click", nextMonth);
    document.getElementById("b-summon").addEventListener("click", openSummon);
    document.getElementById("b-select").addEventListener("click", openSelection);
    bindTab();
  };

  function fmtMoney(v) {
    return v >= 10000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + "k" : String(Math.round(v));
  }

  function renderTab() {
    switch (tab) {
      case "harem":
        return renderHarem();
      case "kids":
        return renderKids();
      case "fetish":
        return renderFetish();
      case "packs":
        return renderPacks();
      case "god":
        return renderGod();
      default:
        return renderLog();
    }
  }

  function renderLog() {
    const s = G.state;
    if (!s.log.length) return `<p class="empty">Chưa có gì xảy ra.</p>`;
    return `<section class="section"><ul class="log">${s.log
      .slice(0, 80)
      .map((l) => `<li class="${esc(l.kind)}"><span class="when">${l.age}t · T${l.month}</span><span class="txt">${esc(l.text)}</span></li>`)
      .join("")}</ul></section>`;
  }

  function consortCard(c) {
    return `<button class="consort" data-consort="${esc(c.id)}">
      ${portrait(c)}
      <span class="body">
        <span class="name">${esc(c.name)}</span>
        <span class="meta"><span class="pill rank">${G.RANKS[c.rank]}</span> ${c.age} tuổi${c.kids ? ` · ${c.kids} con` : ""} ${c.pregnantDue != null ? '<span class="pill preg">Hoài thai</span>' : ""}</span>
        <span class="favor"><span class="bar"><i style="width:${c.favor}%"></i></span><span>Sủng ái ${c.favor}</span></span>
      </span>
    </button>`;
  }

  function renderHarem() {
    const s = G.state;
    const list = [...s.consorts].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    return `<section class="section">
      <div class="section-head"><h3>Hậu cung</h3><span class="hint">Chạm để ghé thăm hoặc xem chi tiết</span></div>
      ${list.length ? `<div class="cards">${list.map(consortCard).join("")}</div>` : `<p class="empty">Hậu cung trống. Mở tuyển tú để nạp phi.</p>`}
    </section>`;
  }

  function renderKids() {
    const s = G.state;
    if (!s.children.length) return `<section class="section"><p class="empty">Chưa có con. Hoàng tử, công chúa sẽ hiện ở đây cùng mẫu phi.</p></section>`;
    return `<section class="section"><div class="section-head"><h3>Gia phả</h3><span class="hint">${s.children.filter((c) => c.sex === "m").length} hoàng tử · ${s.children.filter((c) => c.sex === "f").length} công chúa</span></div>
      <div>${s.children
        .map(
          (ch) => `<div class="kid"><span class="dot ${ch.sex}">${esc(ch.name[0])}</span><span><b>${ch.sex === "m" ? "Hoàng tử" : "Công chúa"} ${esc(ch.name)}</b><br><span class="meta" style="font-size:12.5px;color:var(--muted)">${G.childAge(ch)} tuổi · mẹ ${esc(ch.motherName)} · ${esc(ch.trait)} · phẩm chất ${esc(ch.quality)}</span></span></div>`
        )
        .join("")}</div></section>`;
  }

  function renderFetish() {
    const s = G.state;
    const list = Object.values(R.fetishes).sort((a, b) => a.tier - b.tier);
    if (!list.length) return `<p class="empty">Chưa có gói nào thêm sở thích.</p>`;
    return `<section class="section"><div class="section-head"><h3>Sở thích của bệ hạ</h3><span class="hint">Mở khóa theo Trụy lạc</span></div>
      ${list
        .map((f) => {
          const un = G.fetishUnlocked(f.id);
          const lv = Math.round(s.fetish[f.id] || 0);
          return `<div class="fetish${un ? "" : " locked"}"><div class="row"><b>${esc(f.name)}</b><span class="tier">TẦNG ${f.tier}</span></div>
            <div class="favor"><span class="bar"><i style="width:${lv}%"></i></span><span>${un ? "Nghiện " + lv : "Chưa mở"}</span></div>
            ${f.desc ? `<span style="font-size:12.5px;color:var(--muted)">${esc(f.desc)}</span>` : ""}</div>`;
        })
        .join("")}</section>`;
  }

  function renderPacks() {
    const hooks = G.hooks.list();
    return `<section class="section">
      <div class="section-head"><h3>Gói nội dung</h3><span class="hint">Thêm gói trong thư mục packs/</span></div>
      <div class="scroll-x"><table class="mini-table"><tr><th>Gói</th><th>Phiên bản</th><th>Tác giả</th></tr>
      ${R.packs.map((p) => `<tr><td>${esc(p.name)}<br><span class="mono">${esc(p.id)}</span></td><td>${esc(p.version)}</td><td>${esc(p.author)}</td></tr>`).join("")}</table></div>
      <h3 style="font-size:15px">HOOK đã đăng ký (${hooks.length})</h3>
      <div class="scroll-x"><table class="mini-table">${hooks.map((h) => `<tr><td class="mono">${esc(h.id)}</td><td>${esc(h.pack)}</td></tr>`).join("") || "<tr><td>Chưa có</td></tr>"}</table></div>
      <h3 style="font-size:15px">Lỗi và cảnh báo khi nạp</h3>
      ${R.errors.length ? R.errors.map((e) => `<div class="err mono">${esc(e)}</div>`).join("") : '<div class="ok">Không có lỗi.</div>'}
      ${R.warnings.map((e) => `<div class="mono" style="color:var(--muted)">${esc(e)}</div>`).join("")}
      <button class="btn btn-sm btn-ghost" id="b-reset">Bỏ lượt này, về màn đầu</button>
    </section>`;
  }

  /* ---------------- Thiên Đạo ---------------- */
  function renderGod() {
    const s = G.state;
    const evs = Object.values(R.events).sort((a, b) => a.id.localeCompare(b.id));
    return `<section class="section god">
      <fieldset><legend>Chỉ số</legend>
        ${Object.entries(G.STATS)
          .map(([k, d]) => {
            const max = k === "quocKho" ? 50000 : 100;
            return `<div class="slider"><label for="g-${k}">${d.label}</label><input type="range" id="g-${k}" data-stat="${k}" min="0" max="${max}" step="${k === "quocKho" ? 100 : 1}" value="${Math.round(s.stats[k])}"><output>${Math.round(s.stats[k])}</output></div>`;
          })
          .join("")}
        <div class="row-wrap">
          <label class="check"><input type="checkbox" id="g-money" ${s.godFlags.infiniteMoney ? "checked" : ""}> Ngân lượng vô hạn</label>
          <label class="check"><input type="checkbox" id="g-unlock" ${s.godFlags.unlockAllFetish ? "checked" : ""}> Mở mọi sở thích</label>
          <label class="check"><input type="checkbox" id="g-conceive" ${s.godFlags.alwaysConceive ? "checked" : ""}> Lần nào cũng thụ thai</label>
        </div>
      </fieldset>
      <fieldset><legend>Thời gian</legend>
        <div class="row-wrap"><button class="btn btn-sm" data-skip="1">+1 tháng</button><button class="btn btn-sm" data-skip="12">+1 năm</button><button class="btn btn-sm" data-skip="60">+5 năm</button><button class="btn btn-sm" id="g-abdicate">Thoái vị ngay</button></div>
      </fieldset>
      <fieldset><legend>Tạo phi tần</legend>
        <div class="field"><label for="g-name">Tên</label><input id="g-name" maxlength="40" placeholder="Ví dụ: Bạch Linh Lung"></div>
        <div class="field"><label for="g-age">Tuổi (tối thiểu 18)</label><input id="g-age" type="number" min="18" max="60" value="20"></div>
        <div class="field"><label for="g-rank">Phẩm</label><select id="g-rank">${G.RANKS.slice(0, 7).map((r, i) => `<option value="${i}">${r}</option>`).join("")}</select></div>
        <div class="field"><label for="g-consent">Mức đồng thuận mặc định</label><select id="g-consent">${G.CONSENT.map((c) => `<option value="${c}">${G.CONSENT_LABEL[c]}</option>`).join("")}</select></div>
        <button class="btn btn-sm btn-primary" id="g-create">Tạo</button>
      </fieldset>
      <fieldset><legend>Gọi sự kiện (bỏ qua điều kiện)</legend>
        <div class="field"><label for="g-ev">Sự kiện</label><select id="g-ev">${evs.map((e) => `<option value="${esc(e.id)}">${esc(e.id)}</option>`).join("")}</select></div>
        <button class="btn btn-sm" id="g-fire">Gọi</button>
      </fieldset>
      <fieldset><legend>Nhật ký HOOK</legend>
        ${G.hookLog.length ? G.hookLog.slice(0, 12).map((h) => `<div class="mono ${h.ok ? "ok" : "err"}">${esc(h.id)} · ${h.ok ? esc(h.pack) : esc(h.reason)}</div>`).join("") : '<div class="mono">Chưa gọi HOOK nào.</div>'}
      </fieldset>
      <p style="font-size:12.5px;color:var(--muted)">Thiên Đạo bỏ qua điều kiện cốt truyện, nhưng không bỏ qua quy tắc lõi: tuổi tối thiểu 18 và mức đồng thuận vẫn được kiểm tra trước mọi HOOK. Muốn một phi chịu một sở thích, chỉnh mức đồng thuận của nàng trong chi tiết phi tần.</p>
    </section>`;
  }

  function bindTab() {
    const s = G.state;
    document.querySelectorAll("[data-consort]").forEach((b) => b.addEventListener("click", () => openConsort(b.dataset.consort)));
    const reset = document.getElementById("b-reset");
    if (reset)
      reset.addEventListener("click", () => {
        G.clearSave();
        G.state = null;
        UI.renderGate();
      });
    if (tab !== "god") return;
    document.querySelectorAll("[data-stat]").forEach((inp) =>
      inp.addEventListener("input", () => {
        G.god.setStat(inp.dataset.stat, inp.value);
        inp.nextElementSibling.textContent = inp.value;
      })
    );
    document.querySelectorAll("[data-stat]").forEach((inp) => inp.addEventListener("change", () => (G.save(), UI.render())));
    const flag = (id, key) =>
      document.getElementById(id).addEventListener("change", (e) => {
        s.godFlags[key] = e.target.checked;
        G.save();
      });
    flag("g-money", "infiniteMoney");
    flag("g-unlock", "unlockAllFetish");
    flag("g-conceive", "alwaysConceive");
    document.querySelectorAll("[data-skip]").forEach((b) =>
      b.addEventListener("click", () => {
        G.god.skipMonths(Number(b.dataset.skip));
        G.save();
        UI.render();
      })
    );
    document.getElementById("g-abdicate").addEventListener("click", () => {
      G.abdicate();
      G.save();
      UI.render();
    });
    document.getElementById("g-create").addEventListener("click", () => {
      const lvl = document.getElementById("g-consent").value;
      const consent = {};
      for (const f of Object.keys(R.fetishes)) consent[f] = lvl;
      const c = G.god.createConsort({ name: document.getElementById("g-name").value, age: document.getElementById("g-age").value, rank: document.getElementById("g-rank").value, consent });
      G.save();
      if (c) showMessage("Thiên Đạo", `${c.name}, ${c.age} tuổi, đã nhập cung với phẩm ${G.RANKS[c.rank]}.`);
    });
    document.getElementById("g-fire").addEventListener("click", () => {
      const ev = G.god.forceEvent(document.getElementById("g-ev").value);
      if (ev) showEvent(ev);
    });
  }

  /* ---------------- Bảng trượt ---------------- */
  function openSheet(html, onBind) {
    const el = $sheet();
    el.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true">${html}</div>`;
    el.hidden = false;
    el.onclick = (e) => {
      if (e.target === el && el.dataset.dismiss !== "no") closeSheet();
    };
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
    if (queue.length) {
      const next = queue.shift();
      next();
    } else UI.render();
  }
  UI.closeSheet = closeSheet;

  function showMessage(title, text, notes) {
    openSheet(
      `<h3>${esc(title)}</h3><p class="ev-text">${esc(text)}</p>${notesHtml(notes)}<button class="btn btn-primary" id="s-ok">Tiếp</button>`,
      (el) => el.querySelector("#s-ok").addEventListener("click", closeSheet)
    );
  }

  function notesHtml(notes) {
    return notes && notes.length ? `<div class="notes">${notes.map((n) => `<span>${esc(n)}</span>`).join("")}</div>` : "";
  }

  function formatText(t) {
    // Dòng bắt đầu bằng ">" là lời thoại, hiển thị như trích dẫn
    return esc(t)
      .split("\n")
      .map((line) => (line.startsWith("&gt; ") ? `<span class="q">${line.slice(5)}</span>` : line))
      .join("\n");
  }

  function showScene(scene, notes) {
    const img = scene.image ? `<img class="scene-img" src="${esc(scene.image)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'scene-veil',textContent:'· · ·'}))">` : `<div class="scene-veil">· · ·</div>`;
    openSheet(
      `${img}<h3>${esc(scene.title || "")}</h3><p class="ev-text">${formatText(scene.text || "")}</p>${notesHtml(notes)}<button class="btn btn-primary" id="s-ok">${scene.blocked ? "Đóng" : "Sáng hôm sau"}</button>`,
      (el) => el.querySelector("#s-ok").addEventListener("click", closeSheet)
    );
  }

  function showEvent(prepared) {
    const sp = prepared.speaker;
    const head = sp
      ? `<div class="ev-head">${portrait(sp, "lg")}<div class="t"><span class="eyebrow">${esc(sp.name)}${G.state.consorts.find((c) => c.id === sp.id) ? " · " + G.RANKS[sp.rank] : ""}</span><h3>${esc(prepared.title)}</h3></div></div>`
      : `<div class="ev-head"><div class="t"><span class="eyebrow">Sự kiện</span><h3>${esc(prepared.title)}</h3></div></div>`;
    $sheet().dataset.dismiss = "no";
    openSheet(
      `${head}<p class="ev-text">${formatText(prepared.text)}</p>
       <div class="choices">${prepared.choices
         .map((c) => `<button class="btn" data-choice="${c.index}">${esc(c.label)}${c.cost ? `<span class="cost">−${c.cost} lượng</span>` : ""}</button>`)
         .join("")}</div>`,
      (el) =>
        el.querySelectorAll("[data-choice]").forEach((b) =>
          b.addEventListener("click", () => {
            const res = G.choose(prepared, Number(b.dataset.choice));
            $sheet().dataset.dismiss = "";
            if (res.scene) {
              showScene(res.scene, res.notes);
            } else if (res.after || res.notes.length) {
              showMessage(prepared.title, res.after || "Ý chỉ đã ban.", res.notes);
            } else closeSheet();
          })
        )
    );
  }
  UI.showEvent = showEvent;

  /* ---------------- Qua tháng ---------------- */
  function nextMonth() {
    const r = G.advanceMonth();
    G.save();
    for (const b of r.births) {
      const label = b.kids.map((k) => (k.sex === "m" ? "hoàng tử " : "công chúa ") + k.name).join(" và ");
      queue.push(() => showMessage("Tin vui", `${b.mother.name} hạ sinh ${label}. Toàn cung chúc mừng.`, [`Sủng ái ${b.mother.name} +5`]));
    }
    if (r.event) queue.push(() => showEvent(r.event));
    if (queue.length) queue.shift()();
    else UI.render();
  }

  /* ---------------- Phi tần ---------------- */
  function openConsort(id) {
    const s = G.state;
    const c = s.consorts.find((x) => x.id === id);
    if (!c) return;
    const fets = Object.values(R.fetishes);
    const canCrown = !s.consorts.some((x) => x.rank === 7) && c.favor >= 70;
    openSheet(
      `<div class="ev-head">${portrait(c, "lg")}<div class="t"><span class="eyebrow">${G.RANKS[c.rank]} · ${c.age} tuổi</span><h3>${esc(c.name)}</h3><span style="font-size:13px;color:var(--muted)">${esc(c.origin)}</span></div></div>
       <div class="favor"><span class="bar"><i style="width:${c.favor}%"></i></span><span>Sủng ái ${c.favor}</span></div>
       <div class="favor"><span class="bar"><i style="width:${c.affection}%;background:var(--gold)"></i></span><span>Tình cảm ${c.affection}</span></div>
       <div class="row-wrap">${c.traits.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
       ${
         fets.length
           ? `<div class="scroll-x"><table class="mini-table"><tr><th>Sở thích</th><th>Mức sẵn lòng</th></tr>${fets
               .map((f) => {
                 const lvl = c.consent[f.id] || f.default_consent;
                 const cell = s.godMode
                   ? `<select data-consent="${esc(f.id)}">${G.CONSENT.map((x) => `<option value="${x}" ${x === lvl ? "selected" : ""}>${G.CONSENT_LABEL[x]}</option>`).join("")}</select>`
                   : esc(G.CONSENT_LABEL[lvl]);
                 return `<tr><td>${esc(f.name)}${c.likes.includes(f.id) ? " ♥" : ""}</td><td>${cell}</td></tr>`;
               })
               .join("")}</table></div>`
           : ""
       }
       ${s.godMode ? `<div class="slider"><label for="g-fav">Sủng ái</label><input type="range" id="g-fav" min="0" max="100" value="${c.favor}"><output>${c.favor}</output></div>` : ""}
       <div class="choices">
         <button class="btn" id="c-visit">Ghé thăm</button>
         <button class="btn" id="c-night" ${c.pregnantDue != null ? "disabled" : ""}>Triệu thị tẩm${c.pregnantDue != null ? " (đang hoài thai)" : ""}</button>
         ${canCrown ? `<button class="btn" id="c-crown">Lập làm Hoàng hậu</button>` : ""}
         <button class="btn btn-ghost" id="c-close">Đóng</button>
       </div>`,
      (el) => {
        el.querySelector("#c-close").addEventListener("click", closeSheet);
        el.querySelector("#c-visit").addEventListener("click", () => {
          const line = G.visit(c.id);
          showMessage(c.name, line, ["Sủng ái +3"]);
        });
        el.querySelector("#c-night").addEventListener("click", () => openNight(c));
        const crown = el.querySelector("#c-crown");
        if (crown)
          crown.addEventListener("click", () => {
            G.crownEmpress(c.id);
            showMessage("Đại lễ sách phong", `${c.name} đội mũ phượng, chính thức trở thành Hoàng hậu.`, ["Sủng ái +10"]);
          });
        el.querySelectorAll("[data-consent]").forEach((sel) => sel.addEventListener("change", () => G.god.setConsent(c.id, sel.dataset.consent, sel.value)));
        const fav = el.querySelector("#g-fav");
        if (fav)
          fav.addEventListener("input", () => {
            G.god.setFavor(c.id, fav.value);
            fav.nextElementSibling.textContent = fav.value;
          });
      }
    );
  }

  /** Chọn sở thích cho đêm thị tẩm. Sở thích nàng chưa sẵn lòng sẽ bị khóa. */
  function openNight(c) {
    const fets = Object.values(R.fetishes).filter((f) => G.fetishUnlocked(f.id));
    const rows = fets
      .map((f) => {
        const lvl = c.consent[f.id] || f.default_consent;
        const ok = lvl === "willing";
        return `<label class="check"><input type="checkbox" value="${esc(f.id)}" ${ok ? "" : "disabled"}> <span>${esc(f.name)}${c.likes.includes(f.id) ? " ♥" : ""} <span style="color:var(--muted);font-size:12px">· ${esc(G.CONSENT_LABEL[lvl])}</span></span></label>`;
      })
      .join("");
    openSheet(
      `<div class="ev-head">${portrait(c)}<div class="t"><span class="eyebrow">Lật thẻ bài</span><h3>${esc(c.name)}</h3></div></div>
       ${fets.length ? `<p style="margin:0;color:var(--muted);font-size:13.5px">Chọn sở thích cho đêm nay (tùy chọn). Chỉ chọn được những gì nàng sẵn lòng.</p><div style="display:grid;gap:8px">${rows}</div>` : ""}
       <div class="choices"><button class="btn btn-primary" id="n-go">Truyền chỉ</button><button class="btn btn-ghost" id="n-back">Thôi</button></div>`,
      (el) => {
        el.querySelector("#n-back").addEventListener("click", closeSheet);
        el.querySelector("#n-go").addEventListener("click", () => {
          const picked = [...el.querySelectorAll("input[type=checkbox]:checked")].map((i) => i.value);
          const scene = G.summon(c.id, picked);
          showScene(scene, scene.blocked ? [] : ["Sủng ái +8", "Long thể −1"]);
        });
      }
    );
  }

  function openSummon() {
    const s = G.state;
    const list = s.consorts.filter((c) => c.pregnantDue == null).sort((a, b) => b.favor - a.favor);
    openSheet(
      `<h3>Lật thẻ bài</h3><p style="margin:0;color:var(--muted);font-size:13.5px">Lý công công dâng khay thẻ tên. Đêm nay bệ hạ chọn ai?</p>
       ${list.length ? `<div class="cards">${list.map(consortCard).join("")}</div>` : `<p class="empty">Không có phi tần nào có thể thị tẩm.</p>`}
       <button class="btn btn-ghost" id="sm-close">Đóng</button>`,
      (el) => {
        el.querySelector("#sm-close").addEventListener("click", closeSheet);
        el.querySelectorAll("[data-consort]").forEach((b) => b.addEventListener("click", () => openNight(s.consorts.find((c) => c.id === b.dataset.consort))));
      }
    );
  }

  function openSelection() {
    const s = G.state;
    if (s.flags.lastSelectionYear === s.year) return showMessage("Tuyển tú", "Năm nay đã tuyển tú rồi. Đợi sang năm.");
    const recruits = G.holdSelection();
    if (!recruits) return showMessage("Tuyển tú", "Quốc khố không đủ 1500 lượng để mở tuyển tú.");
    G.save();
    openSheet(
      `<h3>Điện Trữ Tú</h3><p style="margin:0;color:var(--muted);font-size:13.5px">Bốn tú nữ vào vòng cuối. Chọn người được lưu bài tử.</p>
       <div style="display:grid;gap:10px">${recruits
         .map(
           (r) => `<label class="consort" style="cursor:pointer">${portrait(r)}<span class="body"><span class="name">${esc(r.name)}</span><span class="meta">${r.age} tuổi · ${esc(r.origin)}</span><span class="row-wrap">${r.traits.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</span><span class="check"><input type="checkbox" value="${esc(r.id)}" checked> Lưu bài tử</span></span></label>`
         )
         .join("")}</div>
       <button class="btn btn-primary" id="sel-ok">Xác nhận</button>`,
      (el) => {
        el.querySelector("#sel-ok").addEventListener("click", () => {
          const ids = [...el.querySelectorAll("input:checked")].map((i) => i.value);
          const names = ids.map((id) => G.addConsort(id, true)).filter(Boolean).map((c) => c.name);
          if (names.length) G.log(`Tuyển tú: giữ lại ${names.join(", ")}.`, "harem");
          G.addStat("truyLac", names.length * 2);
          showMessage("Tuyển tú", names.length ? `${names.join(", ")} nhập cung với phẩm Đáp ứng.` : "Bệ hạ ban hoa cho tất cả về nhà.", ["Quốc khố −1500"]);
        });
      }
    );
  }

  /* ---------------- Kết thúc ---------------- */
  function renderEnding() {
    const s = G.state;
    const e = s.ended;
    $app().innerHTML = `<section class="ending">
      <span class="god-badge">${s.godMode ? "Lượt chơi Thiên Đạo" : "Sử quan ghi chép"}</span>
      <h1>${esc(e.main.title)}</h1>
      <blockquote>${esc(e.main.line)}</blockquote>
      <p style="margin:0;color:var(--muted)">${esc(s.emperorName)} trị vì ${s.year} năm, thoái vị năm ${s.age} tuổi, làm Thái thượng hoàng an hưởng tuổi già.</p>
      <div class="tally">
        <div><b>${s.consorts.length}</b><span>phi tần</span></div>
        <div><b>${s.children.length}</b><span>hoàng tử, công chúa</span></div>
        <div><b>${s.nightsTotal}</b><span>đêm thị tẩm</span></div>
        <div><b>${Math.round(s.stats.truyLac)}</b><span>Trụy lạc</span></div>
      </div>
      ${e.extras.length ? `<p style="margin:0">Danh hiệu phụ: ${e.extras.map((x) => esc(x.title)).join(", ")}</p>` : ""}
      <button class="btn btn-primary" id="e-new">Bắt đầu đời mới</button>
    </section>`;
    document.getElementById("e-new").addEventListener("click", () => {
      G.clearSave();
      G.state = null;
      UI.renderGate();
    });
  }
})();
