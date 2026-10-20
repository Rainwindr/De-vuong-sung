/*
 * Tửu Sắc Đế Vương — engine lõi 0.2
 *
 * Lõi lo: chỉ số, vòng lặp tháng, điều kiện, hệ quả, sự kiện, gói nội dung, HOOK.
 * Các hệ thống (con cái, đối thực, sở thích, cuộc thi, cửa hàng, tuần du, kế vị, thành tựu,
 * huyết mạch, God Mode) nằm ở js/systems.js.
 * Lõi KHÔNG chứa cảnh chi tiết; cảnh do các gói đăng ký qua Game.hooks.register().
 *
 * Quy tắc lõi (gói và God Mode không ghi đè được):
 *   1. Mọi nhân vật trưởng thành trong game phải >= 18 tuổi. Nhân vật thiếu tuổi hoặc dưới 18
 *      bị từ chối khi nạp gói và không thể tạo trong God Mode. Con cái của hoàng đế không bao giờ
 *      được đưa vào HOOK.
 *   2. Trước khi gọi HOOK, mọi người tham gia phải ở mức "willing" (Sẵn lòng) với mọi sở thích
 *      của cảnh. Nếu không, lựa chọn bị ẩn và HOOK không chạy.
 */
(function () {
  "use strict";

  const G = (window.Game = window.Game || {});
  G.VERSION = "0.3.0";
  G.MIN_AGE = 18;

  G.RANKS = ["Đáp ứng", "Thường tại", "Quý nhân", "Tần", "Phi", "Quý phi", "Hoàng quý phi", "Hoàng hậu"];
  G.RANK_SHORT = ["Đáp ứng", "Thường tại", "Quý nhân", "Tần", "Phi", "Quý phi", "Hoàng quý phi", "Hoàng hậu"];
  G.PROMOTE = [
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
    quocKho: { label: "Quốc khố", min: 0, max: 9999999 },
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
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  G.util = { clamp, pick, shuffle, rand };

  /* ------------------------------------------------------------------ */
  /* Registry                                                            */
  /* ------------------------------------------------------------------ */
  const R = (G.registry = {
    packs: [],
    characters: {},
    events: {},
    fetishes: {},
    contests: {},
    gifts: {},
    buildings: {},
    regions: {},
    namePool: { female: [], child_m: [], child_f: [], spouse_m: [], spouse_f: [] },
    errors: [],
    warnings: [],
  });

  const err = (pack, msg) => R.errors.push(`[${pack}] ${msg}`);
  const warn = (pack, msg) => R.warnings.push(`[${pack}] ${msg}`);

  /** Các loại dữ liệu gói có thể cung cấp, cùng giá trị mặc định. */
  const KINDS = {
    fetishes: { label: "sở thích", defaults: { tier: 1, unlock: {}, default_consent: "persuade", combos: [] } },
    contests: { label: "cuộc thi", defaults: { unlock: {}, fetish: [], count: 4, prize: { favor: 20 } } },
    gifts: { label: "quà", defaults: { cost: 200, favor: 5, likes: [] } },
    buildings: { label: "công trình", defaults: { cost: 2000, effects: {} } },
    regions: { label: "vùng tuần du", defaults: { cost: 2000, recruit: 2 } },
  };

  /**
   * Nạp một gói đã đọc sẵn.
   * data = { manifest, characters?, events?, fetishes?, contests?, gifts?, buildings?, regions?, names? }
   * Mỗi trường có thể là một mảng (từ một file) — bộ nạp đã gộp nhiều file thành một mảng.
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
    for (const dep of m.requires || []) if (!R.packs.find((p) => p.id === dep)) err(pid, `thiếu gói phụ thuộc "${dep}" (phải nạp trước)`);

    const prefix = pid + ".";
    const checkId = (kind, id) => {
      if (typeof id !== "string" || !id) {
        err(pid, `${kind} thiếu id`);
        return false;
      }
      if (!id.startsWith(prefix)) warn(pid, `${kind} "${id}" nên có tiền tố "${prefix}"`);
      return true;
    };

    for (const [kind, spec] of Object.entries(KINDS)) {
      for (const item of data[kind] || []) {
        if (!checkId(spec.label, item.id)) continue;
        R[kind][item.id] = Object.assign({}, JSON.parse(JSON.stringify(spec.defaults)), item, { pack: pid });
      }
    }

    for (const c of data.characters || []) {
      if (!checkId("nhân vật", c.id)) continue;
      if (typeof c.age !== "number" || !(c.age >= G.MIN_AGE)) {
        err(pid, `nhân vật "${c.id}" bị từ chối: thiếu tuổi hoặc dưới ${G.MIN_AGE}`);
        continue;
      }
      for (const [fid, lvl] of Object.entries(c.consent || {})) if (!G.CONSENT.includes(lvl)) warn(pid, `nhân vật "${c.id}": mức đồng thuận "${lvl}" cho "${fid}" không hợp lệ`);
      R.characters[c.id] = Object.assign(
        { rank: 0, favor: 10, affection: 10, traits: [], likes: [], consent: {}, lines: {}, start: false, portrait: {}, affinity: {} },
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
      if (e.speaker === "child" && e.choices.some((c) => c.hook)) {
        err(pid, `sự kiện "${e.id}": sự kiện của con cái không được gọi HOOK`);
        continue;
      }
      R.events[e.id] = Object.assign({ weight: 1, once: false, when: {} }, e, { pack: pid });
    }

    if (data.names) for (const k of Object.keys(R.namePool)) R.namePool[k].push(...(data.names[k] || []));

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
      for (const k of Object.keys(hookTable)) if (k.endsWith("*") && id.startsWith(k.slice(0, -1)) && (!best || k.length > best.length)) best = k;
      return best ? hookTable[best] : null;
    },
    list() {
      return Object.keys(hookTable).map((k) => ({ id: k, pack: hookTable[k].pack }));
    },
  };
  G.hookLog = [];

  G.packBases = {};
  /** Đường dẫn tới file trong thư mục của một gói: Game.asset("ten-goi", "assets/a.webp"). */
  G.asset = function (packId, rel) {
    if (/^(https?:|data:|\/)/.test(rel)) return rel;
    return (G.packBases[packId] || "") + rel;
  };

  /** Mức đồng thuận của một người với một sở thích. */
  G.consentOf = function (p, fid) {
    const f = R.fetishes[fid];
    if ((p.consent || {})[fid]) return p.consent[fid];
    if (f) {
      // Sở thích có thể tự khai mức cho từng nhân vật, hoặc theo trait (cho tú nữ ngẫu nhiên)
      if (f.consent && f.consent[p.id]) return f.consent[p.id];
      if (f.consentByTrait) for (const t of p.traits || []) if (f.consentByTrait[t]) return f.consentByTrait[t];
      if (f.default_consent) return f.default_consent;
    }
    return "persuade";
  };

  /** QUY TẮC LÕI: kiểm tra trước khi gọi HOOK. */
  G.checkGuards = function (participants, fetish) {
    for (const p of participants) {
      if (!p || p.isChild || !(p.age >= G.MIN_AGE)) return { ok: false, reason: "Có người tham gia chưa đủ " + G.MIN_AGE + " tuổi." };
      for (const f of fetish || []) {
        if (G.consentOf(p, f) !== "willing") {
          const fname = R.fetishes[f] ? R.fetishes[f].name : f;
          return { ok: false, reason: `${p.name} chưa sẵn lòng với "${fname}".` };
        }
      }
    }
    return { ok: true };
  };

  /** Gọi HOOK. Trả về cảnh { title, text, image? }; cảnh bị chặn có blocked: true. */
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
        Object.freeze({
          id: p.id,
          name: p.name,
          title: G.displayTitle(p),
          age: p.age,
          rank: G.RANKS[p.rank],
          favor: p.favor,
          affection: p.affection,
          nights: p.nights || 0,
          traits: [...(p.traits || [])],
          consent: Object.assign({}, p.consent),
        })
      ),
      fetish: [...fetish],
      fetishLevels: Object.freeze(Object.assign({}, s.fetish)),
      tier: fetish.reduce((t, f) => Math.max(t, (R.fetishes[f] && R.fetishes[f].tier) || 1), 0),
      combo: ctxIn.combo || null,
      truyLac: s.stats.truyLac,
      emperor: Object.freeze({ name: s.emperorName, age: s.age }),
      place: ctxIn.place || null,
      extra: Object.freeze(Object.assign({}, ctxIn.extra || {})),
      count: (s.hooksFired[id] || 0) + 1,
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
    s.hooksFired[id] = (s.hooksFired[id] || 0) + 1;
    G.hookLog.unshift({ id, ok: true, pack: h ? h.pack : "mặc định" });
    if (G.hookLog.length > 60) G.hookLog.length = 60;
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
      scenario: opts.scenario || "tu_do",
      generation: opts.generation || 1,
      emperorName: opts.name || "Hạ Huyền Đế",
      age: Math.max(18, opts.age || 18),
      startAge: Math.max(18, opts.age || 18),
      month: 1,
      year: 1,
      turn: 0,
      stats: { truyLac: 0, longThe: 100, quocKho: 3000, danTam: 70, hoaKhi: 70 },
      consorts: [],
      former: [], // phi tần đã rời cung
      met: [],
      children: [],
      grandchildren: [],
      fetish: {},
      fetishLast: {},
      fetishStreak: { key: "", count: 0 },
      flags: {},
      seen: {},
      log: [],
      album: [],
      godMode: !!opts.godMode,
      godFlags: { infiniteMoney: false, lockStats: {}, unlockAllFetish: false, alwaysConceive: false },
      ended: null,
      visitedThisMonth: {},
      nightsTotal: 0,
      summonStreak: { id: null, count: 0 },
      pairs: {},
      attitude: 1,
      buildings: {},
      contest: { year: 0, scores: {}, held: {} },
      championTitle: null,
      successor: null,
      retirePlace: null,
      hooksFired: {},
      counters: { xeDe: 0, rewinds: 0, godCreated: 0, maxGroup: 0, spent: 0 },
      legacies: opts.legacies || [],
      lastTravelYear: 0,
      lastSelectionYear: 0,
      pendingTitles: [],
      snapshots: [],
      runAchievements: [],
    };
    G.state = s;
    for (const f of Object.values(R.fetishes)) s.fetish[f.id] = 0;
    if (s.legacies.includes("cuong_trang")) s.stats.longThe = 100;
    if (s.generation === 1) for (const c of Object.values(R.characters)) if (c.start) addConsort(c.id, true);
    if (G.applyScenario) G.applyScenario(s.scenario);
    if (s.generation > 1) {
      log(`${s.emperorName} kế vị năm ${s.age} tuổi, đời thứ ${s.generation} của vương triều.`, "milestone");
      const n = s.legacies.includes("my_mao") ? 4 : 3;
      for (let i = 0; i < n; i++) addConsort(G.makeRecruit().id, true);
    } else log(`${s.emperorName} đăng cơ năm ${s.age} tuổi. Hậu cung còn nhiều cung điện trống.`, "milestone");
    if (s.godMode) log("Thiên Đạo đã mở: lượt chơi này không tính thành tựu thường.", "milestone");
    return s;
  };

  function log(text, kind) {
    const s = G.state;
    s.log.unshift({ t: s.turn, age: s.age, month: s.month, text, kind: kind || "info" });
    if (s.log.length > 300) s.log.length = 300;
  }
  G.log = log;

  G.addAlbum = function (title, line) {
    const s = G.state;
    s.album.push({ title, line, age: s.age, year: s.year });
    if (s.album.length > 24) s.album.shift();
  };

  /** Tên kèm phong hiệu, ví dụ "Thục Phi". */
  G.displayTitle = function (c) {
    if (!c || c.rank == null) return "";
    if (c.title && c.rank >= 4 && c.rank <= 6) return c.title + " " + G.RANKS[c.rank];
    return G.RANKS[c.rank];
  };

  function makeConsortFromDef(def) {
    return {
      id: def.id,
      name: def.name,
      age: def.age,
      origin: def.origin || "",
      rank: clamp(def.rank || 0, 0, 7),
      title: def.title || null,
      favor: def.favor != null ? def.favor : 10,
      affection: def.affection != null ? def.affection : 10,
      traits: [...(def.traits || [])],
      likes: [...(def.likes || [])],
      consent: Object.assign({}, def.consent || {}),
      lines: Object.assign({}, def.lines || {}),
      portrait: Object.assign({}, def.portrait || {}),
      affinity: Object.assign({}, def.affinity || {}),
      pregnantDue: null,
      kids: 0,
      nights: 0,
      palace: 0,
      school: null,
      schoolMonths: 0,
      gifts: {},
      at100: 0,
      contestWins: 0,
      joinedTurn: G.state ? G.state.turn : 0,
      pack: def.pack,
    };
  }
  G.makeConsortFromDef = makeConsortFromDef;

  function addConsort(id, silent) {
    const s = G.state;
    if (s.consorts.find((c) => c.id === id)) return null;
    const def = R.characters[id];
    if (!def || !(def.age >= G.MIN_AGE)) return null;
    const c = makeConsortFromDef(def);
    if (c.rank === 7 && s.consorts.some((x) => x.rank === 7)) c.rank = 6;
    c.joinedTurn = s.turn;
    s.consorts.push(c);
    s.met = s.met.filter((m) => m !== id);
    if (c.rank >= 4 && !c.title) s.pendingTitles.push(c.id);
    if (!silent) log(`${c.name} nhập cung, phong ${G.RANKS[c.rank]}.`, "harem");
    return c;
  }
  G.addConsort = addConsort;

  G.removeConsort = function (id, reason) {
    const s = G.state;
    const c = s.consorts.find((x) => x.id === id);
    if (!c) return;
    s.consorts = s.consorts.filter((x) => x.id !== id);
    s.former.push({ id: c.id, name: c.name, reason: reason || "xuất cung" });
  };

  G.TRAIT_POOL = ["Giọng hát ngọt", "Eo thon", "Hay ngượng", "Táo bạo", "Mùi hương lạ", "Biết múa", "Khéo tay", "Phúc tướng", "Tinh nghịch", "Ôn nhu", "Thích chưng diện", "Lãng mạn", "Kiêu kỳ", "Đa sầu"];

  /** Tú nữ ngẫu nhiên. Luôn từ 18 đến 23 tuổi. */
  G.makeRecruit = function (origin) {
    const s = G.state;
    const pool = R.namePool.female.length ? R.namePool.female : ["Lâm Nhược Thủy", "Giang Ánh Tuyết", "Diệp Tri Thu"];
    const used = new Set(s.consorts.map((c) => c.name).concat(s.former.map((c) => c.name)));
    let name = pick(pool);
    for (let i = 0; i < 12 && used.has(name); i++) name = pick(pool);
    const traits = shuffle(G.TRAIT_POOL).slice(0, 3);
    const consent = {};
    for (const f of Object.values(R.fetishes)) {
      const byTrait = f.consentByTrait && traits.map((t) => f.consentByTrait[t]).find(Boolean);
      if (byTrait) {
        consent[f.id] = byTrait;
        continue;
      }
      const r = rand();
      const bold = traits.includes("Táo bạo") ? 0.15 : traits.includes("Hay ngượng") ? -0.15 : 0;
      const tierPenalty = (f.tier - 1) * 0.1;
      consent[f.id] = r < 0.3 + bold - tierPenalty ? "willing" : r < 0.85 ? "persuade" : "refuse";
    }
    const likes = shuffle(Object.keys(R.fetishes).filter((f) => R.fetishes[f].tier === 1)).slice(0, 1);
    const id = "gen." + Date.now().toString(36) + Math.floor(rand() * 1e6).toString(36);
    const def = {
      id,
      name,
      age: 18 + Math.floor(rand() * 6),
      origin: origin || pick(["Tú nữ Giang Nam", "Tú nữ Sơn Đông", "Tú nữ Thục", "Tú nữ kinh thành", "Tú nữ Lĩnh Nam"]),
      rank: 0,
      favor: 15 + Math.floor(rand() * 10) + (s.legacies.includes("my_mao") ? 10 : 0),
      affection: 10,
      traits,
      likes,
      consent,
      portrait: { glyph: name.split(" ").pop()[0], hue: Math.floor(rand() * 360) },
      pack: "generated",
    };
    R.characters[id] = def;
    return def;
  };

  /* ------------------------------------------------------------------ */
  /* Chỉ số, Sủng ái, thăng phẩm                                         */
  /* ------------------------------------------------------------------ */
  function addStat(k, d) {
    const s = G.state;
    if (!G.STATS[k] || !d) return;
    if (s.godFlags.lockStats[k]) return;
    if (k === "quocKho") {
      if (s.godFlags.infiniteMoney && d < 0) return;
      if (d < 0) s.counters.spent -= d;
    }
    // Trụy lạc càng cao càng khó tăng thêm: còn chỗ để leo đến tận cuối đời
    if (k === "truyLac" && d > 0) d *= Math.max(0.3, 1 - s.stats.truyLac / 130);
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
      const need = G.PROMOTE[r];
      if (c.favor >= need.favor && c.kids >= need.kids) target = r;
      else break;
    }
    if (target > c.rank) promote(c, target);
  }
  G.checkPromotion = checkPromotion;

  function promote(c, target) {
    const s = G.state;
    const before = c.rank;
    c.rank = clamp(target, 0, 6);
    if (c.rank === before) return;
    log(`${c.name} được thăng lên ${G.RANKS[c.rank]}.`, "harem");
    if (c.rank >= 4 && !c.title && !s.pendingTitles.includes(c.id)) s.pendingTitles.push(c.id);
  }
  G.promote = promote;

  G.findConsort = (id) => G.state.consorts.find((c) => c.id === id);

  /* ------------------------------------------------------------------ */
  /* Điều kiện                                                           */
  /* ------------------------------------------------------------------ */
  function cmp(v, rule) {
    if (rule == null) return true;
    if (typeof rule === "number" || typeof rule === "string" || typeof rule === "boolean") return v === rule;
    if (rule.gte != null && !(v >= rule.gte)) return false;
    if (rule.lte != null && !(v <= rule.lte)) return false;
    if (rule.gt != null && !(v > rule.gt)) return false;
    if (rule.lt != null && !(v < rule.lt)) return false;
    if (rule.in && !rule.in.includes(v)) return false;
    return true;
  }
  G.cmp = cmp;

  /** Kiểm tra điều kiện. speaker: người nói (có thể null), ev: sự kiện (để biết loại speaker). */
  G.checkWhen = function (when, speaker, ev) {
    const s = G.state;
    when = when || {};
    if (!cmp(s.age, when.age)) return false;
    if (!cmp(s.month, when.month)) return false;
    if (when.yearEvery && (s.year - 1) % when.yearEvery !== 0) return false;
    for (const k of Object.keys(G.STATS)) if (!cmp(s.stats[k], when[k])) return false;
    if (!cmp(s.consorts.length, when.harem)) return false;
    if (!cmp(s.children.length, when.children)) return false;
    if (!cmp(s.grandchildren.length, when.grandchildren)) return false;
    if (!cmp(s.attitude, when.attitude)) return false;
    if (!cmp(s.generation, when.generation)) return false;
    if (when.scenario && s.scenario !== when.scenario) return false;
    if (when.godMode != null && !!s.godMode !== when.godMode) return false;
    for (const f of [].concat(when.flag || [])) if (!s.flags[f]) return false;
    for (const f of [].concat(when.notFlag || [])) if (s.flags[f]) return false;
    for (const b of [].concat(when.building || [])) if (!s.buildings[b]) return false;
    for (const b of [].concat(when.notBuilding || [])) if (s.buildings[b]) return false;
    if (when.hasConsort && ![].concat(when.hasConsort).every((id) => s.consorts.find((c) => c.id === id))) return false;
    if (when.notConsort && [].concat(when.notConsort).some((id) => s.consorts.find((c) => c.id === id))) return false;
    if (when.fetishLevel) for (const [f, r] of Object.entries(when.fetishLevel)) if (!cmp(s.fetish[f] || 0, r)) return false;
    if (when.fetishUnlocked) for (const f of [].concat(when.fetishUnlocked)) if (!G.fetishUnlocked(f)) return false;
    if (when.pairsAt && G.countPairs && !cmp(G.countPairs(when.pairsAt.tinhY || 61), when.pairsAt.count || { gte: 1 })) return false;
    if (when.successor != null && !!s.successor !== when.successor) return false;
    if (when.hasEmpress != null && s.consorts.some((c) => c.rank === 7) !== when.hasEmpress) return false;
    if (ev && ev.speaker) {
      if (!speaker) return false;
      if (speaker.isChild) {
        if (!cmp(speaker.age, when.childAge)) return false;
      } else {
        const inHarem = !!s.consorts.find((c) => c.id === speaker.id);
        if (when.speakerInHarem === true && !inHarem) return false;
        if (when.speakerInHarem === false && inHarem) return false;
        if (inHarem && !cmp(speaker.favor, when.favor)) return false;
        if (inHarem && !cmp(speaker.affection, when.affection)) return false;
        if (!cmp(speaker.age, when.speakerAge)) return false;
        if (inHarem && !cmp(speaker.rank, when.speakerRank)) return false;
        if (when.speakerTrait && !(speaker.traits || []).includes(when.speakerTrait)) return false;
        if (when.speakerGenerated != null && (speaker.pack === "generated") !== when.speakerGenerated) return false;
        if (when.speakerPregnant != null && (speaker.pregnantDue != null) !== when.speakerPregnant) return false;
      }
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
  /* Người nói                                                           */
  /* ------------------------------------------------------------------ */
  /**
   * Trả về { speaker, speaker2 } cho một sự kiện, hoặc null nếu không ai phù hợp.
   * speaker: id nhân vật | "random" | "child" | "pair"
   */
  G.resolveSpeaker = function (ev) {
    const s = G.state;
    const w = ev.when || {};
    if (!ev.speaker) return { speaker: null };
    if (ev.speaker === "random") {
      const list = s.consorts.filter((c) => G.checkWhen(w, c, ev) && !(ev.perConsort && s.seen[ev.id + ":" + c.id] != null));
      return list.length ? { speaker: pick(list) } : null;
    }
    if (ev.speaker === "child") {
      const list = s.children
        .map((ch) => G.childSpeaker(ch))
        .filter((ch) => cmp(ch.age, w.childAge) && (!w.childSex || ch.sex === w.childSex) && (w.childMarried == null || !!ch.ref.spouse === w.childMarried) && !(ev.perChild && s.seen[ev.id + ":" + ch.id] != null));
      return list.length ? { speaker: pick(list) } : null;
    }
    if (ev.speaker === "pair") {
      const pairs = G.listPairs ? G.listPairs().filter((p) => cmp(p.tinhY, w.pairTinhY) && (!w.pairFavorBelow || (p.a.favor < w.pairFavorBelow && p.b.favor < w.pairFavorBelow))) : [];
      if (!pairs.length) return null;
      const p = pick(pairs);
      return { speaker: p.a, speaker2: p.b, pair: p };
    }
    const inHarem = s.consorts.find((c) => c.id === ev.speaker);
    if (inHarem) return { speaker: inHarem };
    const def = R.characters[ev.speaker];
    if (!def) return null;
    if (s.former.find((f) => f.id === def.id)) return null;
    return { speaker: makeConsortFromDef(def) };
  };

  /* ------------------------------------------------------------------ */
  /* Hệ quả                                                              */
  /* ------------------------------------------------------------------ */
  /** Áp dụng hệ quả. sp = { speaker, speaker2, pair }. Trả về danh sách ghi chú cho UI. */
  G.applyEffects = function (fx, sp) {
    const s = G.state;
    const notes = [];
    fx = fx || {};
    sp = sp || {};
    const speaker = sp.speaker;
    const live = speaker && !speaker.isChild ? s.consorts.find((c) => c.id === speaker.id) : null;
    const live2 = sp.speaker2 ? s.consorts.find((c) => c.id === sp.speaker2.id) : null;
    const sign = (n) => (n > 0 ? "+" : "") + n;

    for (const k of Object.keys(G.STATS)) {
      if (fx[k]) {
        addStat(k, fx[k]);
        notes.push(`${G.STATS[k].label} ${sign(fx[k])}`);
      }
    }
    if (fx.favor && live) {
      changeFavor(live, fx.favor);
      notes.push(`Sủng ái ${live.name} ${sign(fx.favor)}`);
    }
    if (fx.favor2 && live2) {
      changeFavor(live2, fx.favor2);
      notes.push(`Sủng ái ${live2.name} ${sign(fx.favor2)}`);
    }
    if (fx.affection && live) {
      live.affection = clamp(live.affection + fx.affection, 0, 100);
      notes.push(`Tình cảm ${live.name} ${sign(fx.affection)}`);
    }
    if (fx.favorAll) {
      for (const c of s.consorts) if (!live || c.id !== live.id) changeFavor(c, fx.favorAll);
      notes.push(`Sủng ái cả hậu cung ${sign(fx.favorAll)}`);
    }
    if (fx.favorConsort) {
      for (const [id, d] of Object.entries(fx.favorConsort)) {
        const c = G.findConsort(id);
        if (c) {
          changeFavor(c, d);
          notes.push(`Sủng ái ${c.name} ${sign(d)}`);
        }
      }
    }
    if (fx.addConsort) {
      for (const id of [].concat(fx.addConsort)) {
        const c = addConsort(id);
        if (c) notes.push(`${c.name} nhập cung`);
      }
    }
    if (fx.addConsortSpeaker && speaker && !speaker.isChild) {
      const c = addConsort(speaker.id);
      if (c) notes.push(`${c.name} nhập cung`);
    }
    if (fx.removeSpeaker && live) {
      G.removeConsort(live.id, fx.removeSpeaker === true ? "xuất cung" : fx.removeSpeaker);
      notes.push(`${live.name} rời cung`);
    }
    if (fx.removePair && live && live2) {
      G.removeConsort(live.id, "cùng người thương xuất cung");
      G.removeConsort(live2.id, "cùng người thương xuất cung");
      notes.push(`${live.name} và ${live2.name} rời cung`);
    }
    if (fx.meet && speaker && !speaker.isChild && !s.met.includes(speaker.id)) s.met.push(speaker.id);
    if (fx.recruit) {
      const names = [];
      for (let i = 0; i < fx.recruit; i++) {
        const c = addConsort(G.makeRecruit(fx.recruitOrigin).id, true);
        if (c) names.push(c.name);
      }
      if (names.length) {
        log(`Nạp thêm: ${names.join(", ")}.`, "harem");
        notes.push(`Nạp ${names.length} mỹ nhân`);
      }
    }
    if (fx.promote && live) {
      promote(live, live.rank + fx.promote);
      notes.push(`${live.name} thăng phẩm`);
    }
    if (fx.trait && live) for (const t of [].concat(fx.trait)) if (!live.traits.includes(t)) live.traits.push(t);
    if (fx.removeTrait && live) live.traits = live.traits.filter((t) => ![].concat(fx.removeTrait).includes(t));
    if (fx.fetish) {
      for (const [f, d] of Object.entries(fx.fetish)) {
        s.fetish[f] = clamp((s.fetish[f] || 0) + d, 0, 100);
        s.fetishLast[f] = s.turn;
        if (R.fetishes[f]) notes.push(`${R.fetishes[f].name} ${sign(d)}`);
      }
    }
    if (fx.flag) for (const f of [].concat(fx.flag)) s.flags[f] = true;
    if (fx.unflag) for (const f of [].concat(fx.unflag)) delete s.flags[f];
    if (fx.consent && live) {
      for (const [f, lvl] of Object.entries(fx.consent)) {
        // Không thể đổi một mục đang là "refuse" bằng sự kiện
        if (G.consentOf(live, f) !== "refuse" && G.CONSENT.includes(lvl)) live.consent[f] = lvl;
      }
    }
    if (fx.night && live) G.spendNight([live], { silentLog: true });
    if (fx.building) {
      for (const b of [].concat(fx.building)) s.buildings[b] = true;
    }
    if (fx.attitude != null) {
      s.attitude = clamp(fx.attitude, 0, 3);
      notes.push(`Thái độ với đối thực: ${G.ATTITUDE_LABEL[s.attitude]}`);
    }
    if (fx.tinhY && sp.pair && G.addTinhY) {
      G.addTinhY(sp.pair.a.id, sp.pair.b.id, fx.tinhY);
      notes.push(`Tình Ý ${sign(fx.tinhY)}`);
    }
    if (fx.closeness && speaker && speaker.isChild) {
      speaker.ref.closeness = clamp(speaker.ref.closeness + fx.closeness, 0, 100);
      notes.push(`Thân thiết với ${speaker.name} ${sign(fx.closeness)}`);
    }
    if (fx.childTrait && speaker && speaker.isChild) speaker.ref.trait2 = fx.childTrait;
    if (fx.teacher && speaker && speaker.isChild) {
      speaker.ref.teacher = fx.teacher;
      notes.push(`Thầy dạy: ${G.TEACHERS[fx.teacher] ? G.TEACHERS[fx.teacher].name : fx.teacher}`);
    }
    if (fx.educate && speaker && speaker.isChild && G.educateChild) notes.push(G.educateChild(speaker.ref));
    if (fx.marry && speaker && speaker.isChild && G.marryChild) notes.push(G.marryChild(speaker.ref));
    if (fx.motherFavor && speaker && speaker.isChild) {
      const m = G.findConsort(speaker.ref.mother);
      if (m) {
        changeFavor(m, fx.motherFavor);
        notes.push(`Sủng ái ${m.name} ${sign(fx.motherFavor)}`);
      }
    }
    if (fx.album) G.addAlbum(fx.album.title || "Khoảnh khắc", G.fill(fx.album.line || fx.album, sp));
    if (fx.closeSelection) s.flags.selectionClosed = true;
    if (fx.abdicate) {
      s.retirePlace = fx.abdicate;
      G.abdicate();
    }
    if (fx.log) log(G.fill(fx.log, sp), "story");
    return notes;
  };

  /* ------------------------------------------------------------------ */
  /* Thị tẩm, mang thai, sinh con                                        */
  /* ------------------------------------------------------------------ */
  G.spendNight = function (list, opts) {
    const s = G.state;
    opts = opts || {};
    s.nightsTotal++;
    s.flags.firstNight = true;
    s.counters.maxGroup = Math.max(s.counters.maxGroup, list.length);
    for (const c of list) {
      c.nights++;
      s.visitedThisMonth[c.id] = true;
      changeFavor(c, list.length > 1 ? 5 : 8);
      c.affection = clamp(c.affection + 3, 0, 100);
      tryConceive(c);
    }
    addStat("longThe", -1 * Math.min(list.length, 6));
    addStat("truyLac", list.length > 1 ? 3 : 1);
    if (!opts.silentLog) log(`Thị tẩm: ${list.map((c) => c.name).join(", ")}.`, "night");
  };

  function tryConceive(c) {
    const s = G.state;
    if (c.pregnantDue != null) return;
    let p = 0.08;
    if (c.favor >= 70) p += 0.02;
    if (c.traits.includes("Phúc tướng")) p += 0.03;
    if (s.legacies.includes("phuc_tuong")) p += 0.03;
    if (s.stats.longThe < 40) p *= 0.5;
    if (s.godFlags.alwaysConceive) p = 1;
    if (rand() < p) {
      c.pregnantDue = s.turn + 9;
      log(`Thái y báo hỷ: ${c.name} hoài thai.`, "child");
      changeFavor(c, 5);
    }
  }
  G.tryConceive = tryConceive;

  /* ------------------------------------------------------------------ */
  /* Sự kiện                                                             */
  /* ------------------------------------------------------------------ */
  G.eligibleEvents = function () {
    const s = G.state;
    const out = [];
    for (const ev of Object.values(R.events)) {
      if (ev.manual) continue;
      if (ev.once && s.seen[ev.id] != null) continue;
      if (ev.cooldown && s.seen[ev.id] != null && s.turn - s.seen[ev.id] < ev.cooldown) continue;
      const sp = G.resolveSpeaker(ev);
      if (!sp) continue;
      if (!G.checkWhen(ev.when, sp.speaker, ev)) continue;
      const prepared = G.prepareEvent(ev, sp);
      if (!prepared.choices.length) continue;
      out.push(prepared);
    }
    return out;
  };

  /** Ai tham gia cảnh của một lựa chọn. */
  function participantsFor(ch, sp) {
    const s = G.state;
    const speaker = sp.speaker;
    const p = ch.participants;
    const self = speaker && !speaker.isChild ? [s.consorts.find((c) => c.id === speaker.id) || speaker] : [];
    if (!p || p === "speaker") return self;
    if (p === "pair") return [sp.speaker, sp.speaker2].filter(Boolean).map((x) => s.consorts.find((c) => c.id === x.id) || x);
    if (p.select === "top_favor" || p.select === "random") {
      const need = p.require_willing || ch.fetish || [];
      let list = s.consorts.filter((c) => c.pregnantDue == null && G.checkGuards([c], need).ok);
      if (p.includeSpeaker && self.length) list = list.filter((c) => c.id !== self[0].id);
      list = p.select === "random" ? shuffle(list) : list.sort((a, b) => b.favor - a.favor);
      let out = list.slice(0, (p.count || 3) - (p.includeSpeaker ? 1 : 0));
      if (p.includeSpeaker && self.length) out = self.concat(out);
      return out;
    }
    if (Array.isArray(p)) return p.map((id) => s.consorts.find((c) => c.id === id)).filter(Boolean);
    return [];
  }
  G.participantsFor = participantsFor;

  /** Dựng sự kiện sẵn sàng cho UI: lọc lựa chọn theo điều kiện và quy tắc lõi. force: bỏ qua requires/cost. */
  G.prepareEvent = function (ev, sp, force) {
    const s = G.state;
    sp = sp || G.resolveSpeaker(ev) || { speaker: null };
    const choices = [];
    ev.choices.forEach((ch, i) => {
      if (!force && ch.requires && !G.checkWhen(ch.requires, sp.speaker, null)) return;
      if (!force && ch.cost && s.stats.quocKho < ch.cost && !s.godFlags.infiniteMoney) return;
      const fetish = ch.fetish || [];
      if (!force && fetish.some((f) => !G.fetishUnlocked(f))) return;
      if (ch.hook || ch.participants) {
        const parts = participantsFor(ch, sp);
        if (ch.participants && ch.participants !== "speaker" && parts.length < (ch.minParticipants || 1)) return;
        if (ch.hook && !G.checkGuards(parts, fetish).ok) return;
      }
      choices.push({ index: i, label: G.fill(ch.label, sp), cost: ch.cost || 0 });
    });
    return Object.assign({ ev, choices, text: G.fill(ev.text, sp), title: G.fill(ev.title, sp) }, sp);
  };

  /** Thay {name}, {name2}, {emperor}, {rank}, {mother}, {title} trong chuỗi. */
  G.fill = function (t, sp) {
    if (!t) return "";
    const s = G.state;
    sp = sp && sp.speaker !== undefined ? sp : { speaker: sp };
    const a = sp.speaker;
    const b = sp.speaker2;
    return String(t)
      .replace(/\{name\}/g, a ? a.name : "nàng")
      .replace(/\{name2\}/g, b ? b.name : "")
      .replace(/\{emperor\}/g, s.emperorName)
      .replace(/\{rank\}/g, a && !a.isChild ? G.RANKS[a.rank] : "")
      .replace(/\{title\}/g, a && !a.isChild ? G.displayTitle(a) : "")
      .replace(/\{mother\}/g, a && a.isChild ? a.ref.motherName : "")
      .replace(/\{child\}/g, a && a.isChild ? (a.sex === "m" ? "hoàng tử" : "công chúa") : "")
      .replace(/\{trait\}/g, a && a.isChild ? [a.ref.trait, a.ref.trait2].filter(Boolean).join(", ").toLowerCase() : a && a.traits ? a.traits.join(", ").toLowerCase() : "");
  };

  /** Người chơi chọn một lựa chọn. Trả về { notes, scene?, after? }. */
  G.choose = function (prepared, choiceIndex) {
    const s = G.state;
    const ev = prepared.ev;
    const ch = ev.choices[choiceIndex];
    const sp = { speaker: prepared.speaker, speaker2: prepared.speaker2, pair: prepared.pair };
    s.seen[ev.id] = s.turn;
    if (ev.perChild && sp.speaker && sp.speaker.isChild) s.seen[ev.id + ":" + sp.speaker.id] = s.turn;
    if (ev.perConsort && sp.speaker) s.seen[ev.id + ":" + sp.speaker.id] = s.turn;
    if (ch.cost) addStat("quocKho", -ch.cost);

    // Tính người tham gia TRƯỚC hệ quả (để hệ quả như addConsortSpeaker không đổi danh sách)
    let parts = ch.hook ? participantsFor(ch, sp) : [];
    const notes = G.applyEffects(ch.effects, sp);
    if (ch.cost) notes.unshift(`Quốc khố −${ch.cost}`);
    if (typeof ev.onChoose === "function") ev.onChoose(ch, sp, notes);

    let scene = null;
    if (ch.hook) {
      parts = parts.map((p) => s.consorts.find((c) => c.id === p.id) || p);
      const extra = Object.assign({}, ch.extra || {}, ch._extra || {});
      scene = G.runHook(ch.hook, { participants: parts, fetish: ch.fetish || [], place: ch.place, extra });
      if (!scene.blocked) {
        const inHarem = parts.filter((p) => s.consorts.includes(p));
        if (inHarem.length) G.spendNight(inHarem, { silentLog: true });
        for (const f of ch.fetish || []) {
          s.fetish[f] = clamp((s.fetish[f] || 0) + 5, 0, 100);
          s.fetishLast[f] = s.turn;
        }
      }
    }
    const after = ch.result ? G.fill(ch.result, sp) : null;
    log((after || `${G.fill(ev.title, sp)}: ${G.fill(ch.label, sp)}.`).replace(/^> /gm, "").replace(/\n+/g, " "), "story");
    return { notes, scene, after };
  };

  /* ------------------------------------------------------------------ */
  /* Qua tháng                                                           */
  /* ------------------------------------------------------------------ */
  G.monthlyHooks = []; // các hệ thống đăng ký hàm chạy mỗi tháng: fn(state, report)

  /** Thu nhập mỗi tháng phụ thuộc Dân tâm: 70 → 260 lượng, 20 → 160 lượng. */
  G.monthlyIncome = function () {
    return Math.round(120 + G.state.stats.danTam * 2);
  };

  /**
   * Tua đến khi có chuyện: sự kiện, sinh nở, phong hiệu chờ ban, hoặc hết tối đa 24 tháng.
   * Trả về { months, births, event, ended, notes }.
   */
  G.advanceUntilEvent = function (max) {
    const s = G.state;
    const out = { months: 0, births: [], event: null, ended: null };
    const goalsBefore = (s.goals && s.goals.list.filter((g) => g.done).length) || 0;
    for (let i = 0; i < (max || 24); i++) {
      const r = G.advanceMonth();
      out.months++;
      out.births.push(...r.births);
      if (r.ended || s.ended) {
        out.ended = s.ended;
        break;
      }
      if (r.event) {
        out.event = r.event;
        break;
      }
      if (r.births.length || s.pendingTitles.length) break;
      const goalsNow = (s.goals && s.goals.list.filter((g) => g.done).length) || 0;
      if (goalsNow !== goalsBefore || (s.month === 1 && out.months > 1)) break; // dừng ở đầu năm mới để xem mục tiêu
    }
    return out;
  };

  G.advanceMonth = function (opts) {
    opts = opts || {};
    const s = G.state;
    const report = { births: [], event: null, system: [] };
    if (s.ended) return report;

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
      if (G.snapshot) G.snapshot();
    }
    addStat("quocKho", G.monthlyIncome());
    const regen = s.legacies.includes("cuong_trang") ? 0.5 : 0;
    if (s.age < 40) addStat("longThe", 2 + regen);
    else if (s.age < 55) addStat("longThe", 1 + regen);
    else addStat("longThe", -0.3 + regen);
    if (s.stats.truyLac >= 80) addStat("longThe", -0.5);
    addStat("truyLac", -0.3); // tự nguội dần nếu không tiếp tục ăn chơi
    if (s.stats.truyLac >= 60) addStat("danTam", -0.5);
    else addStat("danTam", 0.2);

    // sinh nở
    for (const c of s.consorts) if (c.pregnantDue != null && s.turn >= c.pregnantDue) report.births.push({ mother: c, kids: G.birth(c) });

    // các hệ thống khác (con cái lớn lên, đối thực, học phường, nghiện, ...)
    for (const fn of G.monthlyHooks) {
      try {
        fn(s, report, opts);
      } catch (e) {
        console.error(e);
        R.errors.push("[hệ thống] " + e.message);
      }
    }
    if (s.ended) return Object.assign(report, { ended: s.ended });

    if (opts.skipEvents) return report;

    // sự kiện hệ thống (cuộc thi, kế vị...) được ưu tiên
    if (report.systemEvent) {
      report.event = report.systemEvent;
      return report;
    }
    const pool = G.eligibleEvents();
    if (pool.length && rand() < 0.8) {
      const total = pool.reduce((t, p) => t + (p.ev.weight || 1), 0);
      let r = rand() * total;
      for (const p of pool) {
        r -= p.ev.weight || 1;
        if (r <= 0) {
          report.event = p;
          break;
        }
      }
    }
    return report;
  };

  /* ------------------------------------------------------------------ */
  /* Hành động trực tiếp                                                 */
  /* ------------------------------------------------------------------ */
  G.visit = function (id) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c) return null;
    s.visitedThisMonth[c.id] = true;
    changeFavor(c, 3);
    c.affection = clamp(c.affection + 2, 0, 100);
    const line = c.favor >= 60 ? c.lines.high : c.lines.low;
    return line || (c.favor >= 60 ? "Bệ hạ đến rồi! Thiếp chờ mãi." : "Thần thiếp tham kiến bệ hạ.");
  };

  G.crownEmpress = function (id) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c || s.consorts.some((x) => x.rank === 7)) return false;
    c.rank = 7;
    changeFavor(c, 10);
    log(`Đại lễ sách phong: ${c.name} được lập làm Hoàng hậu.`, "milestone");
    G.addAlbum("Đại lễ sách phong", `${c.name} đội mũ phượng, chính thức trở thành Hoàng hậu.`);
    return true;
  };

  G.setTitle = function (id, title) {
    const c = G.findConsort(id);
    if (!c) return;
    c.title = String(title || "").trim().slice(0, 12) || null;
    G.state.pendingTitles = G.state.pendingTitles.filter((x) => x !== id);
    if (c.title) log(`${c.name} được ban phong hiệu ${G.displayTitle(c)}.`, "harem");
  };

  /* ------------------------------------------------------------------ */
  /* Lưu / tải                                                           */
  /* ------------------------------------------------------------------ */
  const SAVE_KEY = "tsdv-save-v2";
  G.save = function () {
    try {
      const s = G.state;
      if (!s) return;
      const snap = s.snapshots;
      s.snapshots = []; // không lưu ảnh chụp lịch sử để tiết kiệm bộ nhớ
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state: s, generated: Object.values(R.characters).filter((c) => c.pack === "generated" || c.pack === "god") }));
      s.snapshots = snap;
    } catch (e) {
      /* bộ nhớ trình duyệt không dùng được */
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
      if (!data.state || !data.state.v || data.state.v.split(".")[1] !== G.VERSION.split(".")[1]) return false;
      for (const c of data.generated || []) if (c.age >= G.MIN_AGE) R.characters[c.id] = c;
      G.state = data.state;
      G.state.snapshots = [];
      return true;
    } catch (e) {
      return false;
    }
  };
  /* Ô lưu thủ công (1..3) và xuất/nhập mã lưu */
  const slotKey = (n) => "tsdv-slot-" + n;
  function packSave() {
    const s = G.state;
    const snap = s.snapshots;
    s.snapshots = [];
    const data = JSON.stringify({ state: s, generated: Object.values(R.characters).filter((c) => c.pack === "generated" || c.pack === "god") });
    s.snapshots = snap;
    return data;
  }
  function unpackSave(raw) {
    const data = JSON.parse(raw);
    if (!data.state || !data.state.v || data.state.v.split(".")[1] !== G.VERSION.split(".")[1]) return false;
    for (const c of data.generated || []) if (c.age >= G.MIN_AGE) R.characters[c.id] = c;
    G.state = data.state;
    G.state.snapshots = [];
    return true;
  }
  G.saveSlot = function (n) {
    try {
      localStorage.setItem(slotKey(n), packSave());
      return true;
    } catch (e) {
      return false;
    }
  };
  G.loadSlot = function (n) {
    try {
      const raw = localStorage.getItem(slotKey(n));
      return raw ? unpackSave(raw) : false;
    } catch (e) {
      return false;
    }
  };
  G.slotInfo = function (n) {
    try {
      const raw = localStorage.getItem(slotKey(n));
      if (!raw) return null;
      const st = JSON.parse(raw).state;
      return { name: st.emperorName, age: st.age, year: st.year, harem: st.consorts.length, kids: st.children.length, ended: !!st.ended };
    } catch (e) {
      return null;
    }
  };
  G.deleteSlot = function (n) {
    try {
      localStorage.removeItem(slotKey(n));
    } catch (e) {}
  };
  /** Mã lưu dạng chữ để chép sang máy khác. */
  G.exportSave = function () {
    return btoa(unescape(encodeURIComponent(packSave())));
  };
  G.importSave = function (code) {
    try {
      return unpackSave(decodeURIComponent(escape(atob(String(code).trim()))));
    } catch (e) {
      return false;
    }
  };

  G.clearSave = function () {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
  };
  G.storage = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
  };
})();
