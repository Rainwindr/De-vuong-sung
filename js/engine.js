/*
 * Tửu Sắc Đế Vương — engine lõi
 * Lõi lo: chỉ số, vòng lặp tháng, điều kiện, hệ quả, gói nội dung, HOOK, God Mode.
 * Lõi KHÔNG chứa cảnh chi tiết; cảnh do các gói đăng ký qua Game.hooks.register().
 *
 * Quy tắc lõi (gói không ghi đè được):
 *   1. Mọi nhân vật phải có tuổi >= 18. Nhân vật thiếu tuổi hoặc dưới 18 bị từ chối khi nạp gói
 *      và không thể tạo trong God Mode.
 *   2. Trước khi gọi HOOK, mọi người tham gia phải ở mức "willing" (Sẵn lòng) với mọi sở thích
 *      của cảnh. Nếu không, lựa chọn bị ẩn và HOOK không chạy.
 */
(function () {
  "use strict";

  const G = (window.Game = window.Game || {});
  G.VERSION = "0.1.0";
  G.MIN_AGE = 18;

  G.RANKS = ["Đáp ứng", "Thường tại", "Quý nhân", "Tần", "Phi", "Quý phi", "Hoàng quý phi", "Hoàng hậu"];
  // Sủng ái và số con tối thiểu để tự thăng lên phẩm tương ứng (Hoàng hậu do người chơi lập)
  const PROMOTE = [
    { favor: 0, kids: 0 },
    { favor: 25, kids: 0 },
    { favor: 40, kids: 0 },
    { favor: 55, kids: 1 },
    { favor: 70, kids: 1 },
    { favor: 85, kids: 2 },
    { favor: 95, kids: 2 },
  ];
  G.STATS = {
    truyLac: { label: "Trụy lạc", min: 0, max: 100 },
    longThe: { label: "Long thể", min: 0, max: 100 },
    quocKho: { label: "Quốc khố", min: 0, max: 999999 },
    danTam: { label: "Dân tâm", min: 0, max: 100 },
    hoaKhi: { label: "Hòa khí", min: 0, max: 100 },
  };
  G.CONSENT = ["willing", "persuade", "refuse"];
  G.CONSENT_LABEL = { willing: "Sẵn lòng", persuade: "Cần thuyết phục", refuse: "Từ chối" };

  /* ------------------------------------------------------------------ */
  /* Tiện ích                                                            */
  /* ------------------------------------------------------------------ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = () => Math.random();
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  G.util = { clamp, pick };

  /* ------------------------------------------------------------------ */
  /* Registry: dữ liệu từ các gói                                        */
  /* ------------------------------------------------------------------ */
  const R = (G.registry = {
    packs: [],
    characters: {},
    events: {},
    fetishes: {},
    namePool: { female: [], child_m: [], child_f: [] },
    errors: [],
    warnings: [],
  });

  function err(pack, msg) {
    R.errors.push(`[${pack}] ${msg}`);
  }
  function warn(pack, msg) {
    R.warnings.push(`[${pack}] ${msg}`);
  }

  /**
   * Nạp một gói đã đọc sẵn.
   * data = { manifest, characters?, events?, fetishes?, names? }
   */
  G.loadPack = function (data) {
    const m = data.manifest || {};
    const pid = m.id;
    if (!pid || !/^[a-z0-9-]+$/.test(pid)) {
      err(pid || "?", "manifest.id thiếu hoặc sai định dạng (chỉ a-z, 0-9, dấu gạch ngang)");
      return false;
    }
    if (R.packs.find((p) => p.id === pid)) {
      err(pid, "gói bị nạp hai lần");
      return false;
    }
    for (const dep of m.requires || []) {
      if (!R.packs.find((p) => p.id === dep)) err(pid, `thiếu gói phụ thuộc "${dep}" (phải nạp trước)`);
    }
    const prefix = pid + ".";
    const checkId = (kind, id) => {
      if (typeof id !== "string" || !id) {
        err(pid, `${kind} thiếu id`);
        return false;
      }
      if (!id.startsWith(prefix)) warn(pid, `${kind} "${id}" nên có tiền tố "${prefix}"`);
      return true;
    };

    for (const f of data.fetishes || []) {
      if (!checkId("sở thích", f.id)) continue;
      R.fetishes[f.id] = Object.assign({ tier: 1, unlock: {}, default_consent: "persuade" }, f, { pack: pid });
    }

    for (const c of data.characters || []) {
      if (!checkId("nhân vật", c.id)) continue;
      // QUY TẮC LÕI 1: tuổi tối thiểu
      if (typeof c.age !== "number" || !(c.age >= G.MIN_AGE)) {
        err(pid, `nhân vật "${c.id}" bị từ chối: thiếu tuổi hoặc dưới ${G.MIN_AGE}`);
        continue;
      }
      for (const [fid, lvl] of Object.entries(c.consent || {})) {
        if (!G.CONSENT.includes(lvl)) warn(pid, `nhân vật "${c.id}": mức đồng thuận "${lvl}" cho "${fid}" không hợp lệ`);
      }
      R.characters[c.id] = Object.assign(
        { rank: 0, favor: 10, affection: 10, traits: [], likes: [], consent: {}, lines: {}, start: false, portrait: {} },
        c,
        { pack: pid }
      );
    }

    for (const e of data.events || []) {
      if (!checkId("sự kiện", e.id)) continue;
      if (!Array.isArray(e.choices) || !e.choices.length) {
        err(pid, `sự kiện "${e.id}" không có lựa chọn`);
        continue;
      }
      R.events[e.id] = Object.assign({ weight: 1, once: false, when: {} }, e, { pack: pid });
    }

    if (data.names) {
      for (const k of Object.keys(R.namePool)) R.namePool[k].push(...(data.names[k] || []));
    }

    R.packs.push({ id: pid, name: m.name || pid, version: m.version || "0", author: m.author || "", rating: m.rating || "", manifest: m });
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* HOOK                                                                */
  /* ------------------------------------------------------------------ */
  const hookTable = {};
  G.hooks = {
    /** Đăng ký cảnh cho một HOOK. id có thể kết thúc bằng "*" để bắt nhiều HOOK. Đăng ký sau ghi đè đăng ký trước. */
    register(id, fn, packId) {
      if (typeof fn !== "function") throw new Error("Game.hooks.register cần một hàm");
      hookTable[id] = { fn, pack: packId || "?" };
    },
    resolve(id) {
      if (hookTable[id]) return hookTable[id];
      let best = null;
      for (const k of Object.keys(hookTable)) {
        if (k.endsWith("*") && id.startsWith(k.slice(0, -1)) && (!best || k.length > best.length)) best = k;
      }
      return best ? hookTable[best] : null;
    },
    list() {
      return Object.keys(hookTable).map((k) => ({ id: k, pack: hookTable[k].pack }));
    },
  };
  G.hookLog = [];

  /** Đường dẫn tới file trong thư mục của một gói: Game.asset("ten-goi", "assets/a.webp"). */
  G.packBases = {};
  G.asset = function (packId, rel) {
    if (/^(https?:|data:|\/)/.test(rel)) return rel;
    return (G.packBases[packId] || "") + rel;
  };

  /**
   * QUY TẮC LÕI 2: kiểm tra trước khi gọi HOOK.
   * Trả về { ok: true } hoặc { ok: false, reason }.
   */
  G.checkGuards = function (participants, fetish) {
    for (const p of participants) {
      if (!p || !(p.age >= G.MIN_AGE)) return { ok: false, reason: "Có người tham gia chưa đủ " + G.MIN_AGE + " tuổi." };
      for (const f of fetish || []) {
        const lvl = (p.consent || {})[f] || (R.fetishes[f] && R.fetishes[f].default_consent) || "persuade";
        if (lvl !== "willing") {
          const fname = R.fetishes[f] ? R.fetishes[f].name : f;
          return { ok: false, reason: `${p.name} chưa sẵn lòng với "${fname}".` };
        }
      }
    }
    return { ok: true };
  };

  /** Gọi HOOK. Trả về cảnh { title, text, image? } để UI hiển thị, hoặc null nếu bị chặn. */
  G.runHook = function (id, ctxIn) {
    const s = G.state;
    const participants = ctxIn.participants || [];
    const fetish = ctxIn.fetish || [];
    const guard = G.checkGuards(participants, fetish);
    if (!guard.ok) {
      G.hookLog.unshift({ id, ok: false, reason: guard.reason });
      return { title: "Không thể tiếp tục", text: guard.reason, blocked: true };
    }
    const ctx = Object.freeze({
      hook: id,
      participants: participants.map((p) =>
        Object.freeze({ id: p.id, name: p.name, age: p.age, rank: G.RANKS[p.rank], favor: p.favor, affection: p.affection, traits: [...(p.traits || [])], consent: Object.assign({}, p.consent) })
      ),
      fetish: [...fetish],
      fetishLevels: Object.freeze(Object.assign({}, s.fetish)),
      tier: fetish.reduce((t, f) => Math.max(t, (R.fetishes[f] && R.fetishes[f].tier) || 1), 0),
      truyLac: s.stats.truyLac,
      emperor: Object.freeze({ name: s.emperorName, age: s.age }),
      place: ctxIn.place || null,
      extra: Object.freeze(Object.assign({}, ctxIn.extra || {})),
    });
    const h = G.hooks.resolve(id);
    let scene = null;
    try {
      scene = h ? h.fn(ctx) : null;
    } catch (e) {
      console.error("HOOK lỗi", id, e);
      R.errors.push(`[hook ${id}] ${e.message}`);
    }
    if (!scene) scene = G.defaultScene(ctx);
    G.hookLog.unshift({ id, ok: true, pack: h ? h.pack : "mặc định" });
    if (G.hookLog.length > 50) G.hookLog.length = 50;
    return scene;
  };

  G.defaultScene = function (ctx) {
    const names = ctx.participants.map((p) => p.name).join(", ");
    return {
      title: "Đêm ở hậu cung",
      text: `Rèm lụa buông xuống. Nến đỏ lay lắt, tiếng cười khẽ của ${names || "mỹ nhân"} lẫn vào gió đêm. Sáng hôm sau, thái giám ghi vào sổ: thị tẩm.`,
    };
  };

  /* ------------------------------------------------------------------ */
  /* Trạng thái                                                          */
  /* ------------------------------------------------------------------ */
  G.newState = function (opts) {
    opts = opts || {};
    const s = {
      v: G.VERSION,
      emperorName: opts.name || "Hạ Huyền Đế",
      age: 18,
      month: 1,
      year: 1,
      turn: 0,
      stats: { truyLac: 0, longThe: 100, quocKho: 3000, danTam: 70, hoaKhi: 70 },
      consorts: [], // phi tần trong hậu cung
      met: [], // id nhân vật đã gặp nhưng chưa nạp phi
      children: [],
      fetish: {}, // id -> độ nghiện 0..100
      flags: {},
      seen: {}, // event id -> lượt cuối
      log: [],
      godMode: !!opts.godMode,
      godFlags: { infiniteMoney: false, lockStats: {} },
      ended: null,
      visitedThisMonth: {},
      nightsTotal: 0,
    };
    G.state = s;
    for (const c of Object.values(R.characters)) if (c.start) addConsort(c.id, true);
    for (const f of Object.values(R.fetishes)) s.fetish[f.id] = 0;
    log(`${s.emperorName} đăng cơ năm 18 tuổi. Hậu cung còn nhiều cung điện trống.`, "milestone");
    return s;
  };

  function log(text, kind) {
    const s = G.state;
    s.log.unshift({ t: s.turn, age: s.age, month: s.month, text, kind: kind || "info" });
    if (s.log.length > 200) s.log.length = 200;
  }
  G.log = log;

  function makeConsortFromDef(def) {
    return {
      id: def.id,
      name: def.name,
      age: def.age,
      origin: def.origin || "",
      rank: clamp(def.rank || 0, 0, 6),
      favor: def.favor != null ? def.favor : 10,
      affection: def.affection != null ? def.affection : 10,
      traits: [...(def.traits || [])],
      likes: [...(def.likes || [])],
      consent: Object.assign({}, def.consent || {}),
      lines: Object.assign({}, def.lines || {}),
      portrait: Object.assign({}, def.portrait || {}),
      pregnantDue: null,
      kids: 0,
      nights: 0,
      pack: def.pack,
    };
  }

  function addConsort(id, silent) {
    const s = G.state;
    if (s.consorts.find((c) => c.id === id)) return null;
    const def = R.characters[id];
    if (!def) return null;
    if (!(def.age >= G.MIN_AGE)) return null;
    const c = makeConsortFromDef(def);
    if (c.rank === 7 && s.consorts.some((x) => x.rank === 7)) c.rank = 6;
    s.consorts.push(c);
    s.met = s.met.filter((m) => m !== id);
    if (!silent) log(`${c.name} nhập cung, phong ${G.RANKS[c.rank]}.`, "harem");
    return c;
  }
  G.addConsort = addConsort;

  /** Tú nữ ngẫu nhiên khi tuyển tú. Luôn từ 18 đến 23 tuổi. */
  G.makeRecruit = function () {
    const s = G.state;
    const pool = R.namePool.female.length ? R.namePool.female : ["Lâm Nhược Thủy", "Giang Ánh Tuyết", "Diệp Tri Thu"];
    const used = new Set(s.consorts.map((c) => c.name));
    let name = pick(pool);
    for (let i = 0; i < 8 && used.has(name); i++) name = pick(pool);
    const traitsPool = ["Giọng hát ngọt", "Eo thon", "Hay ngượng", "Táo bạo", "Mùi hương lạ", "Biết múa", "Khéo tay", "Phúc tướng", "Tinh nghịch", "Ôn nhu"];
    const traits = [];
    while (traits.length < 3) {
      const t = pick(traitsPool);
      if (!traits.includes(t)) traits.push(t);
    }
    const consent = {};
    for (const f of Object.values(R.fetishes)) {
      const r = rand();
      consent[f.id] = r < 0.3 ? "willing" : r < 0.8 ? "persuade" : "refuse";
    }
    const id = "gen." + Date.now().toString(36) + Math.floor(rand() * 1e4).toString(36);
    const def = {
      id,
      name,
      age: 18 + Math.floor(rand() * 6),
      origin: pick(["Tú nữ Giang Nam", "Tú nữ Sơn Đông", "Tú nữ Thục", "Tú nữ kinh thành", "Tú nữ Lĩnh Nam"]),
      rank: 0,
      favor: 15 + Math.floor(rand() * 10),
      affection: 10,
      traits,
      consent,
      portrait: { glyph: name.split(" ").pop()[0], hue: Math.floor(rand() * 360) },
      pack: "generated",
    };
    R.characters[id] = def;
    return def;
  };

  /* ------------------------------------------------------------------ */
  /* Điều kiện                                                           */
  /* ------------------------------------------------------------------ */
  function cmp(v, rule) {
    if (rule == null) return true;
    if (typeof rule === "number") return v === rule;
    if (rule.gte != null && !(v >= rule.gte)) return false;
    if (rule.lte != null && !(v <= rule.lte)) return false;
    if (rule.gt != null && !(v > rule.gt)) return false;
    if (rule.lt != null && !(v < rule.lt)) return false;
    if (rule.in && !rule.in.includes(v)) return false;
    return true;
  }

  function resolveSpeaker(ev) {
    const s = G.state;
    if (!ev.speaker) return null;
    if (ev.speaker === "random") {
      const list = s.consorts.filter((c) => cmp(c.favor, (ev.when || {}).favor));
      return list.length ? pick(list) : null;
    }
    const inHarem = s.consorts.find((c) => c.id === ev.speaker);
    if (inHarem) return inHarem;
    const def = R.characters[ev.speaker];
    return def ? makeConsortFromDef(def) : null; // người chưa nhập cung (gặp lần đầu)
  }

  G.checkWhen = function (when, speaker, ev) {
    const s = G.state;
    when = when || {};
    if (!cmp(s.age, when.age)) return false;
    if (!cmp(s.month, when.month)) return false;
    if (when.yearEvery && (s.year - 1) % when.yearEvery !== 0) return false;
    for (const k of Object.keys(G.STATS)) if (!cmp(s.stats[k], when[k])) return false;
    if (!cmp(s.consorts.length, when.harem)) return false;
    if (!cmp(s.children.length, when.children)) return false;
    if (when.flag && !s.flags[when.flag]) return false;
    if (when.notFlag && s.flags[when.notFlag]) return false;
    if (when.hasConsort && !s.consorts.find((c) => c.id === when.hasConsort)) return false;
    if (when.notConsort && s.consorts.find((c) => c.id === when.notConsort)) return false;
    if (when.fetishLevel) for (const [f, r] of Object.entries(when.fetishLevel)) if (!cmp(s.fetish[f] || 0, r)) return false;
    if (ev && ev.speaker) {
      if (!speaker) return false;
      const inHarem = !!s.consorts.find((c) => c.id === speaker.id);
      if (when.speakerInHarem === true && !inHarem) return false;
      if (when.speakerInHarem === false && inHarem) return false;
      if (inHarem && !cmp(speaker.favor, when.favor)) return false;
    }
    return true;
  };

  /** Sở thích đã mở khóa chưa (theo điều kiện unlock của sở thích). */
  G.fetishUnlocked = function (fid) {
    const f = R.fetishes[fid];
    if (!f) return false;
    if (G.state.godFlags.unlockAllFetish) return true;
    return G.checkWhen(f.unlock || {}, null, null);
  };

  /* ------------------------------------------------------------------ */
  /* Hệ quả                                                              */
  /* ------------------------------------------------------------------ */
  function addStat(k, d) {
    const s = G.state;
    if (!G.STATS[k]) return;
    if (s.godFlags.lockStats[k]) return;
    if (k === "quocKho" && s.godFlags.infiniteMoney && d < 0) return;
    s.stats[k] = clamp(Math.round((s.stats[k] + d) * 100) / 100, G.STATS[k].min, G.STATS[k].max);
  }
  G.addStat = addStat;

  function changeFavor(c, d) {
    if (!c) return;
    c.favor = clamp(Math.round(c.favor + d), 0, 100);
    checkPromotion(c);
  }
  G.changeFavor = changeFavor;

  function checkPromotion(c) {
    if (c.rank >= 6) return;
    let target = c.rank;
    for (let r = c.rank + 1; r <= 6; r++) {
      const need = PROMOTE[r];
      if (c.favor >= need.favor && c.kids >= need.kids) target = r;
      else break;
    }
    if (target > c.rank) {
      c.rank = target;
      log(`${c.name} được thăng lên ${G.RANKS[c.rank]}.`, "harem");
    }
  }

  /** Áp dụng hệ quả của một lựa chọn. Trả về danh sách dòng mô tả để UI hiển thị. */
  G.applyEffects = function (fx, speaker) {
    const s = G.state;
    const notes = [];
    fx = fx || {};
    for (const k of Object.keys(G.STATS)) {
      if (fx[k]) {
        addStat(k, fx[k]);
        notes.push(`${G.STATS[k].label} ${fx[k] > 0 ? "+" : ""}${fx[k]}`);
      }
    }
    if (fx.favor && speaker) {
      const live = s.consorts.find((c) => c.id === speaker.id);
      if (live) {
        changeFavor(live, fx.favor);
        notes.push(`Sủng ái ${live.name} ${fx.favor > 0 ? "+" : ""}${fx.favor}`);
      }
    }
    if (fx.affection && speaker) {
      const live = s.consorts.find((c) => c.id === speaker.id);
      if (live) live.affection = clamp(live.affection + fx.affection, 0, 100);
    }
    if (fx.favorAll) {
      for (const c of s.consorts) if (!speaker || c.id !== speaker.id) changeFavor(c, fx.favorAll);
      notes.push(`Sủng ái cả hậu cung ${fx.favorAll > 0 ? "+" : ""}${fx.favorAll}`);
    }
    if (fx.addConsort) {
      for (const id of [].concat(fx.addConsort)) {
        const c = addConsort(id);
        if (c) notes.push(`${c.name} nhập cung`);
      }
    }
    if (fx.addConsortSpeaker && speaker) {
      const c = addConsort(speaker.id);
      if (c) notes.push(`${c.name} nhập cung`);
    }
    if (fx.meet && speaker && !s.met.includes(speaker.id)) s.met.push(speaker.id);
    if (fx.recruit) {
      const n = fx.recruit;
      const names = [];
      for (let i = 0; i < n; i++) {
        const def = G.makeRecruit();
        const c = addConsort(def.id, true);
        if (c) names.push(c.name);
      }
      if (names.length) {
        log(`Tuyển tú: giữ lại ${names.join(", ")}.`, "harem");
        notes.push(`Nạp ${names.length} tú nữ`);
      }
    }
    if (fx.fetish) {
      for (const [f, d] of Object.entries(fx.fetish)) {
        s.fetish[f] = clamp((s.fetish[f] || 0) + d, 0, 100);
        if (R.fetishes[f]) notes.push(`${R.fetishes[f].name} +${d}`);
      }
    }
    if (fx.flag) for (const f of [].concat(fx.flag)) s.flags[f] = true;
    if (fx.unflag) for (const f of [].concat(fx.unflag)) delete s.flags[f];
    if (fx.consent && speaker) {
      const live = s.consorts.find((c) => c.id === speaker.id);
      if (live) for (const [f, lvl] of Object.entries(fx.consent)) if (live.consent[f] !== "refuse" && G.CONSENT.includes(lvl)) live.consent[f] = lvl;
    }
    if (fx.night && speaker) {
      const live = s.consorts.find((c) => c.id === speaker.id);
      if (live) spendNight([live], { silentLog: true });
    }
    if (fx.log) log(fx.log, "story");
    return notes;
  };

  /* ------------------------------------------------------------------ */
  /* Thị tẩm, mang thai, sinh con                                        */
  /* ------------------------------------------------------------------ */
  function spendNight(list, opts) {
    const s = G.state;
    opts = opts || {};
    s.nightsTotal++;
    s.flags.firstNight = true;
    for (const c of list) {
      c.nights++;
      s.visitedThisMonth[c.id] = true;
      changeFavor(c, list.length > 1 ? 5 : 8);
      c.affection = clamp(c.affection + 3, 0, 100);
      tryConceive(c);
    }
    addStat("longThe", -1 * list.length);
    addStat("truyLac", list.length > 1 ? 3 : 1);
    if (!opts.silentLog) log(`Thị tẩm: ${list.map((c) => c.name).join(", ")}.`, "night");
  }
  G.spendNight = spendNight;

  function tryConceive(c) {
    const s = G.state;
    if (c.pregnantDue != null) return;
    let p = 0.08;
    if (c.favor >= 70) p += 0.02;
    if (c.traits.includes("Phúc tướng")) p += 0.03;
    if (s.stats.longThe < 40) p *= 0.5;
    if (s.godFlags.alwaysConceive) p = 1;
    if (rand() < p) {
      c.pregnantDue = s.turn + 9;
      log(`Thái y báo hỷ: ${c.name} hoài thai.`, "child");
      changeFavor(c, 5);
    }
  }

  function birth(c) {
    const s = G.state;
    const twins = rand() < 0.15 ? (rand() < 0.13 ? 3 : 2) : 1;
    const born = [];
    for (let i = 0; i < twins; i++) {
      const sex = rand() < 0.5 ? "m" : "f";
      const pool = sex === "m" ? R.namePool.child_m : R.namePool.child_f;
      const name = (pool.length ? pick(pool) : sex === "m" ? "Hoằng An" : "Tĩnh Nghi") + (s.children.length ? "" : "");
      const traitsPool = ["Thông minh", "Võ dũng", "Hiếu thảo", "Nghịch ngợm", "Nghệ thuật", "Nhút nhát"];
      const child = {
        id: "child." + s.children.length,
        name,
        sex,
        mother: c.id,
        motherName: c.name,
        bornTurn: s.turn,
        trait: pick(traitsPool),
        closeness: 30,
        quality: c.rank >= 5 && c.favor >= 85 ? "Tuyệt" : c.rank >= 3 ? "Ưu" : "Thường",
      };
      s.children.push(child);
      born.push(child);
    }
    c.pregnantDue = null;
    c.kids += born.length;
    changeFavor(c, 5);
    checkPromotion(c);
    const label = born.map((b) => (b.sex === "m" ? "hoàng tử " : "công chúa ") + b.name).join(" và ");
    log(`${c.name} hạ sinh ${label}.`, "child");
    return born;
  }

  G.childAge = function (ch) {
    return Math.floor((G.state.turn - ch.bornTurn) / 12);
  };

  /* ------------------------------------------------------------------ */
  /* Chọn sự kiện                                                        */
  /* ------------------------------------------------------------------ */
  G.eligibleEvents = function () {
    const s = G.state;
    const out = [];
    for (const ev of Object.values(R.events)) {
      if (ev.once && s.seen[ev.id] != null) continue;
      if (ev.cooldown && s.seen[ev.id] != null && s.turn - s.seen[ev.id] < ev.cooldown) continue;
      const speaker = resolveSpeaker(ev);
      if (!G.checkWhen(ev.when, speaker, ev)) continue;
      out.push({ ev, speaker });
    }
    return out;
  };

  /** Dựng sự kiện sẵn sàng cho UI: lọc lựa chọn theo điều kiện và quy tắc đồng thuận. */
  G.prepareEvent = function (ev, speaker) {
    const s = G.state;
    speaker = speaker || resolveSpeaker(ev);
    const choices = [];
    ev.choices.forEach((ch, i) => {
      if (ch.requires && !G.checkWhen(ch.requires, speaker, null)) return;
      if (ch.cost && s.stats.quocKho < ch.cost && !s.godFlags.infiniteMoney) return;
      const parts = participantsFor(ch, speaker);
      const fetish = ch.fetish || [];
      if (fetish.some((f) => !G.fetishUnlocked(f))) return;
      if (ch.participants && ch.participants !== "speaker" && !parts.length) return; // không ai đủ điều kiện
      if (ch.hook && !G.checkGuards(parts, fetish).ok) return; // ẩn lựa chọn vi phạm quy tắc lõi
      choices.push({ index: i, label: ch.label, cost: ch.cost || 0 });
    });
    return { ev, speaker, choices, text: fill(ev.text, speaker), title: fill(ev.title, speaker) };
  };

  function participantsFor(ch, speaker) {
    const s = G.state;
    const p = ch.participants;
    if (!p) return speaker ? [speaker] : [];
    if (p === "speaker") return speaker ? [speaker] : [];
    if (p.select === "top_favor") {
      const need = p.require_willing || ch.fetish || [];
      return s.consorts
        .filter((c) => c.pregnantDue == null && G.checkGuards([c], need).ok)
        .sort((a, b) => b.favor - a.favor)
        .slice(0, p.count || 3);
    }
    if (Array.isArray(p)) return p.map((id) => s.consorts.find((c) => c.id === id)).filter(Boolean);
    return [];
  }

  function fill(t, speaker) {
    if (!t) return "";
    const s = G.state;
    return t.replace(/\{name\}/g, speaker ? speaker.name : "nàng").replace(/\{emperor\}/g, s.emperorName).replace(/\{rank\}/g, speaker ? G.RANKS[speaker.rank] : "");
  }
  G.fill = fill;

  /** Người chơi chọn một lựa chọn. Trả về { notes, scene? }. */
  G.choose = function (prepared, choiceIndex) {
    const s = G.state;
    const ev = prepared.ev;
    const ch = ev.choices[choiceIndex];
    const speaker = prepared.speaker;
    s.seen[ev.id] = s.turn;
    if (ch.cost) addStat("quocKho", -ch.cost);
    const notes = G.applyEffects(ch.effects, speaker);
    if (ch.cost) notes.unshift(`Quốc khố -${ch.cost}`);
    let scene = null;
    if (ch.hook) {
      const parts = participantsFor(ch, speaker);
      const live = parts.map((p) => s.consorts.find((c) => c.id === p.id) || p);
      scene = G.runHook(ch.hook, { participants: live, fetish: ch.fetish || [], place: ch.place, extra: ch.extra });
      if (!scene.blocked) {
        const inHarem = live.filter((p) => s.consorts.includes(p));
        if (inHarem.length) spendNight(inHarem, { silentLog: true });
        for (const f of ch.fetish || []) s.fetish[f] = clamp((s.fetish[f] || 0) + 5, 0, 100);
      }
    }
    if (ch.result) log(fill(ch.result, speaker), "story");
    else log(`${fill(ev.title, speaker)}: ${ch.label}.`, "story");
    return { notes, scene, after: ch.result ? fill(ch.result, speaker) : null };
  };

  /* ------------------------------------------------------------------ */
  /* Qua tháng                                                           */
  /* ------------------------------------------------------------------ */
  G.advanceMonth = function () {
    const s = G.state;
    if (s.ended) return { births: [], event: null };
    // phai Sủng ái nếu tháng này không gặp
    for (const c of s.consorts) if (!s.visitedThisMonth[c.id] && rand() < 0.5) c.favor = clamp(c.favor - 1, 0, 100);
    s.visitedThisMonth = {};

    s.turn++;
    s.month++;
    if (s.month > 12) {
      s.month = 1;
      s.year++;
      s.age++;
      for (const c of s.consorts) c.age++;
      log(`Năm thứ ${s.year}. ${s.emperorName} ${s.age} tuổi.`, "milestone");
    }
    addStat("quocKho", 250);
    // Long thể hồi dần khi còn trẻ, suy dần khi về già
    if (s.age < 40) addStat("longThe", 1.5);
    else if (s.age < 55) addStat("longThe", 0.5);
    else addStat("longThe", -0.5);
    if (s.stats.truyLac >= 80) addStat("longThe", -0.5);
    if (s.stats.truyLac >= 60) addStat("danTam", -0.5);

    // sinh nở
    const births = [];
    for (const c of s.consorts) if (c.pregnantDue != null && s.turn >= c.pregnantDue) births.push({ mother: c, kids: birth(c) });

    // kết thúc: Long thể cạn hoặc 65 tuổi thì thoái vị
    if (s.stats.longThe <= 0 || s.age >= 65) {
      s.ended = G.computeEnding();
      log(`${s.emperorName} thoái vị, làm Thái thượng hoàng.`, "milestone");
      return { births, event: null, ended: s.ended };
    }

    // bốc một sự kiện
    let event = null;
    const pool = G.eligibleEvents();
    if (pool.length && rand() < 0.8) {
      const total = pool.reduce((t, p) => t + (p.ev.weight || 1), 0);
      let r = rand() * total;
      for (const p of pool) {
        r -= p.ev.weight || 1;
        if (r <= 0) {
          event = G.prepareEvent(p.ev, p.speaker);
          break;
        }
      }
      if (event && !event.choices.length) event = null;
    }
    return { births, event };
  };

  /* ------------------------------------------------------------------ */
  /* Kết thúc (không có kết cục tệ)                                      */
  /* ------------------------------------------------------------------ */
  G.ENDINGS = [
    { id: "da_phuc", title: "Thiên Tử Đa Phúc", line: "Con cháu đầy điện, phúc lớn không ai sánh.", test: (s) => s.children.length >= 30 },
    { id: "vien_man", title: "Hậu Cung Viên Mãn", line: "Hậu cung không một tiếng thở dài.", test: (s) => s.consorts.length >= 5 && s.consorts.every((c) => c.favor >= 70) },
    { id: "nhat_sinh", title: "Nhất Sinh Nhất Thế", line: "Ba nghìn giai lệ, chỉ một người trong tim.", test: (s) => s.consorts.some((c) => c.favor >= 100 && c.nights >= 60) },
    { id: "phong_luu", title: "Phong Lưu Thiên Cổ", line: "Đế tửu sắc cả đời, hậu thế kể mãi không chán.", test: (s) => s.stats.truyLac >= 100 },
    { id: "tieu_dao", title: "Thái Thượng Hoàng Tiêu Dao", line: "Buông ngai vàng sớm, rong chơi sơn thủy.", test: (s) => s.age < 45 },
    { id: "binh_an", title: "Bình An Một Đời", line: "Một đời êm ấm, không gì phải hối tiếc.", test: () => true },
  ];
  G.computeEnding = function () {
    const s = G.state;
    const hit = G.ENDINGS.filter((e) => e.test(s));
    return { main: hit[0], extras: hit.slice(1).filter((e) => e.id !== "binh_an"), godMode: s.godMode };
  };

  G.abdicate = function () {
    const s = G.state;
    s.ended = G.computeEnding();
    log(`${s.emperorName} truyền ngôi, làm Thái thượng hoàng.`, "milestone");
    return s.ended;
  };

  /* ------------------------------------------------------------------ */
  /* Hành động trực tiếp của người chơi                                  */
  /* ------------------------------------------------------------------ */
  G.visit = function (id) {
    const s = G.state;
    const c = s.consorts.find((x) => x.id === id);
    if (!c) return null;
    s.visitedThisMonth[c.id] = true;
    changeFavor(c, 3);
    c.affection = clamp(c.affection + 2, 0, 100);
    const line = c.favor >= 60 ? c.lines.high : c.lines.low;
    return line || (c.favor >= 60 ? "Bệ hạ đến rồi! Thiếp chờ mãi." : "Thần thiếp tham kiến bệ hạ.");
  };

  /** Lật thẻ bài: thị tẩm một người, có thể kèm sở thích. */
  G.summon = function (id, fetishIds) {
    const s = G.state;
    const c = s.consorts.find((x) => x.id === id);
    if (!c) return null;
    if (c.pregnantDue != null) return { title: "Không thể thị tẩm", text: `${c.name} đang mang long thai, thái y dặn tĩnh dưỡng.`, blocked: true };
    const fx = (fetishIds || []).filter((f) => G.fetishUnlocked(f));
    const hookId = fx.length ? "core.thi_tam_so_thich" : "core.thi_tam";
    const scene = G.runHook(hookId, { participants: [c], fetish: fx, place: "duong_tam_dien" });
    if (!scene.blocked) {
      spendNight([c]);
      for (const f of fx) {
        s.fetish[f] = clamp((s.fetish[f] || 0) + 5, 0, 100);
        if (c.likes.includes(f)) changeFavor(c, 8);
      }
    }
    return scene;
  };

  G.crownEmpress = function (id) {
    const s = G.state;
    const c = s.consorts.find((x) => x.id === id);
    if (!c || s.consorts.some((x) => x.rank === 7)) return false;
    c.rank = 7;
    changeFavor(c, 10);
    log(`Đại lễ sách phong: ${c.name} được lập làm Hoàng hậu.`, "milestone");
    return true;
  };

  G.holdSelection = function () {
    const s = G.state;
    const cost = 1500;
    if (s.stats.quocKho < cost && !s.godFlags.infiniteMoney) return null;
    addStat("quocKho", -cost);
    s.flags.lastSelectionYear = s.year;
    return [G.makeRecruit(), G.makeRecruit(), G.makeRecruit(), G.makeRecruit()];
  };

  /* ------------------------------------------------------------------ */
  /* God Mode (Thiên Đạo)                                                */
  /* ------------------------------------------------------------------ */
  G.god = {
    enable() {
      G.state.godMode = true;
      log("Thiên Đạo đã mở: lượt chơi này không tính thành tựu.", "milestone");
    },
    setStat(k, v) {
      if (!G.STATS[k]) return;
      G.state.stats[k] = clamp(Number(v), G.STATS[k].min, G.STATS[k].max);
    },
    setFavor(id, v) {
      const c = G.state.consorts.find((x) => x.id === id);
      if (c) {
        c.favor = clamp(Number(v), 0, 100);
        checkPromotion(c);
      }
    },
    setConsent(id, fid, lvl) {
      const c = G.state.consorts.find((x) => x.id === id);
      if (c && G.CONSENT.includes(lvl)) c.consent[fid] = lvl;
    },
    setRank(id, r) {
      const c = G.state.consorts.find((x) => x.id === id);
      if (!c) return;
      r = clamp(Number(r), 0, 7);
      if (r === 7) for (const x of G.state.consorts) if (x.rank === 7) x.rank = 6;
      c.rank = r;
    },
    skipMonths(n) {
      const out = [];
      for (let i = 0; i < n && !G.state.ended; i++) {
        const r = G.advanceMonth();
        if (r.ended) out.push(r);
      }
      return out;
    },
    /** Tạo phi tần mới. Tuổi luôn bị ép tối thiểu 18 (quy tắc lõi). */
    createConsort(data) {
      const age = Math.max(G.MIN_AGE, Math.floor(Number(data.age) || G.MIN_AGE));
      const id = "god." + Date.now().toString(36);
      const consent = {};
      for (const f of Object.values(R.fetishes)) consent[f.id] = (data.consent && data.consent[f.id]) || "persuade";
      R.characters[id] = {
        id,
        name: (data.name || "Vô Danh").slice(0, 40),
        age,
        origin: data.origin || "Do Thiên Đạo tạo ra",
        rank: clamp(Number(data.rank) || 0, 0, 6),
        favor: clamp(Number(data.favor) || 30, 0, 100),
        traits: data.traits || [],
        consent,
        portrait: { glyph: (data.name || "V").trim().split(" ").pop()[0] || "V", hue: Math.floor(rand() * 360) },
        pack: "god",
      };
      return addConsort(id);
    },
    forceEvent(id) {
      const ev = R.events[id];
      if (!ev) return null;
      return G.prepareEventForce(ev);
    },
    forceBirth(id) {
      const c = G.state.consorts.find((x) => x.id === id);
      return c ? birth(c) : null;
    },
  };

  /** God Mode: bỏ qua điều kiện của sự kiện (vẫn giữ quy tắc lõi khi gọi HOOK). */
  G.prepareEventForce = function (ev) {
    const s = G.state;
    let speaker = null;
    if (ev.speaker === "random") speaker = s.consorts.length ? pick(s.consorts) : null;
    else if (ev.speaker) speaker = s.consorts.find((c) => c.id === ev.speaker) || (R.characters[ev.speaker] ? makeConsortFromDef(R.characters[ev.speaker]) : null);
    const choices = [];
    ev.choices.forEach((ch, i) => {
      const parts = participantsFor(ch, speaker);
      if (ch.hook && !G.checkGuards(parts, ch.fetish || []).ok) return;
      choices.push({ index: i, label: ch.label, cost: ch.cost || 0 });
    });
    return { ev, speaker, choices, text: fill(ev.text, speaker), title: fill(ev.title, speaker) };
  };

  /* ------------------------------------------------------------------ */
  /* Lưu / tải                                                           */
  /* ------------------------------------------------------------------ */
  const SAVE_KEY = "tsdv-save-v1";
  G.save = function () {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state: G.state, generated: Object.values(R.characters).filter((c) => c.pack === "generated" || c.pack === "god") }));
    } catch (e) {
      /* bộ nhớ trình duyệt không dùng được: bỏ qua */
    }
  };
  G.hasSave = function () {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  };
  G.loadSave = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      for (const c of data.generated || []) if (c.age >= G.MIN_AGE) R.characters[c.id] = c;
      G.state = data.state;
      return true;
    } catch (e) {
      return false;
    }
  };
  G.clearSave = function () {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
  };
})();
