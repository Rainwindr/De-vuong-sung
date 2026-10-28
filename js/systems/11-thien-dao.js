/*
 * God Mode (Thiên Đạo).
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
  /* GOD MODE (Thiên Đạo)                                                */
  /* ================================================================== */
  G.snapshot = function () {
    const s = G.state;
    const copy = JSON.parse(JSON.stringify(Object.assign({}, s, { snapshots: [] })));
    s.snapshots.push(copy);
    if (s.snapshots.length > 10) s.snapshots.shift();
  };

  G.god = {
    setStat(k, v) {
      if (G.STATS[k]) G.state.stats[k] = clamp(Number(v), G.STATS[k].min, G.STATS[k].max);
    },
    setFavor(id, v) {
      const c = G.findConsort(id);
      if (c) {
        c.favor = clamp(Number(v), 0, 100);
        G.checkPromotion(c);
      }
    },
    setAffection(id, v) {
      const c = G.findConsort(id);
      if (c) c.affection = clamp(Number(v), 0, 100);
    },
    setConsent(id, fid, lvl) {
      const c = G.findConsort(id);
      if (c && G.CONSENT.includes(lvl)) c.consent[fid] = lvl;
    },
    setRank(id, r) {
      const c = G.findConsort(id);
      if (!c) return;
      r = clamp(Number(r), 0, 7);
      if (r === 7) for (const x of G.state.consorts) if (x.rank === 7) x.rank = 6;
      c.rank = r;
      if (r >= 4 && r <= 6 && !c.title && !G.state.pendingTitles.includes(c.id)) G.state.pendingTitles.push(c.id);
    },
    setAttitude(v) {
      G.state.attitude = clamp(Number(v), 0, 3);
    },
    setTinhY(a, b, v) {
      if (a && b && a !== b) G.state.pairs[G.pairKey(a, b)] = clamp(Number(v), 0, 100);
    },
    skipMonths(n) {
      for (let i = 0; i < n && !G.state.ended; i++) G.advanceMonth({ skipEvents: true });
    },
    rewindYear() {
      const s = G.state;
      const snap = s.snapshots.pop();
      if (!snap) return false;
      const keep = s.snapshots;
      const rewinds = s.counters.rewinds + 1;
      G.state = snap;
      G.state.snapshots = keep;
      G.state.counters.rewinds = rewinds;
      G.state.godMode = true;
      G.log("Thiên Đạo đảo ngược một năm.", "milestone");
      return true;
    },
    /** Tạo phi tần. Tuổi luôn bị ép tối thiểu 18 (quy tắc lõi). */
    createConsort(data) {
      const age = Math.max(G.MIN_AGE, Math.floor(Number(data.age) || G.MIN_AGE));
      const id = "god." + Date.now().toString(36) + Math.floor(rand() * 1e5).toString(36);
      const consent = {};
      for (const f of Object.values(R.fetishes)) consent[f.id] = (data.consent && data.consent[f.id]) || "persuade";
      const name = String(data.name || "Vô Danh").trim().slice(0, 40) || "Vô Danh";
      R.characters[id] = {
        id,
        name,
        age,
        origin: data.origin || "Do Thiên Đạo tạo ra",
        rank: clamp(Number(data.rank) || 0, 0, 6),
        favor: clamp(Number(data.favor) || 30, 0, 100),
        affection: 30,
        traits: data.traits || shuffle(G.TRAIT_POOL).slice(0, 3),
        consent,
        portrait: { glyph: name.split(" ").pop()[0] || "V", hue: Math.floor(rand() * 360) },
        pack: "god",
      };
      G.state.counters.godCreated++;
      return G.addConsort(id);
    },
    forceEvent(id) {
      const ev = R.events[id];
      if (!ev) return null;
      let sp = G.resolveSpeaker(ev);
      if (!sp) {
        const s = G.state;
        if (ev.speaker === "child") sp = s.children.length ? { speaker: G.childSpeaker(pick(s.children)) } : null;
        else if (ev.speaker === "pair") sp = s.consorts.length >= 2 ? (() => { const [a, b] = shuffle(s.consorts); return { speaker: a, speaker2: b, pair: { a, b, tinhY: G.getTinhY(a.id, b.id) } }; })() : null;
        else if (ev.speaker === "random") sp = s.consorts.length ? { speaker: pick(s.consorts) } : null;
        else if (R.characters[ev.speaker]) sp = { speaker: G.findConsort(ev.speaker) || G.makeConsortFromDef(R.characters[ev.speaker]) };
      }
      if (!sp && ev.speaker) return null;
      return G.prepareEvent(ev, sp || { speaker: null }, true);
    },
    forceBirth(id) {
      const c = G.findConsort(id);
      return c ? G.birth(c) : null;
    },
    setEmperorAge(age) {
      const s = G.state;
      const a = clamp(Math.floor(Number(age) || 18), 18, 80);
      const d = a - s.age;
      s.age = a;
      for (const c of s.consorts) c.age = Math.max(G.MIN_AGE, c.age + d);
    },
    lockStat(k, on) {
      G.state.godFlags.lockStats[k] = !!on;
    },
    setAll(field, v) {
      for (const c of G.state.consorts) {
        c[field] = clamp(Number(v), 0, 100);
        if (field === "favor") G.checkPromotion(c);
      }
    },
    setAllConsent(lvl) {
      if (!G.CONSENT.includes(lvl)) return;
      for (const c of G.state.consorts) for (const f of Object.keys(R.fetishes)) c.consent[f] = lvl;
    },
    setFetish(fid, v) {
      if (R.fetishes[fid]) G.state.fetish[fid] = clamp(Number(v), 0, 100);
    },
    setAllCloseness(v) {
      for (const ch of G.state.children) ch.closeness = clamp(Number(v), 0, 100);
    },
    addDynasty(n) {
      const d = G.dynasty();
      d.points = Math.max(0, d.points + Math.floor(Number(n) || 0));
      G.storage.set("tsdv-dynasty-v1", d);
      return d.points;
    },
    resetSeen() {
      G.state.seen = {};
    },
    endPregnancies() {
      for (const c of G.state.consorts) if (c.pregnantDue != null) c.pregnantDue = G.state.turn + 1;
    },
    setChildAge(cid, age) {
      const ch = G.state.children.find((x) => x.id === cid);
      if (ch) ch.bornTurn = G.state.turn - clamp(Number(age), 0, 60) * 12;
    },
  };
})();
