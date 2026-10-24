/*
 * Các hệ thống của game, xây trên engine.js.
 * Mỗi phần có thể đọc độc lập: con cái · đối thực · học phường · sở thích · thị tẩm · cuộc thi ·
 * cửa hàng · tuần du · tuyển tú · kế vị và kết thúc · thành tựu · huyết mạch · kịch bản ·
 * nhật ký hậu cung · God Mode.
 */
(function () {
  "use strict";
  const G = window.Game;
  const R = G.registry;
  const { clamp, pick, shuffle, rand } = G.util;
  const log = (t, k) => G.log(t, k);
  const monthly = (fn) => G.monthlyHooks.push(fn);

  /* ================================================================== */
  /* CON CÁI                                                             */
  /* ================================================================== */
  G.CHILD_TRAITS = ["Thông minh", "Võ dũng", "Hiếu thảo", "Nghịch ngợm", "Nghệ thuật", "Nhút nhát"];
  G.TEACHERS = {
    dai_hoc_si: { name: "Đại học sĩ", fits: ["Thông minh", "Hiếu thảo"] },
    vo_tuong: { name: "Võ tướng", fits: ["Võ dũng", "Nghịch ngợm"] },
    cam_su: { name: "Cầm sư", fits: ["Nghệ thuật", "Nhút nhát"] },
  };
  G.EDUCATION = ["Bình thường", "Khá", "Giỏi", "Xuất chúng"];

  G.childAge = (ch) => Math.floor((G.state.turn - ch.bornTurn) / 12);
  /** Đối tượng "người nói" cho một đứa trẻ. isChild = true để lõi không bao giờ đưa vào HOOK. */
  G.childSpeaker = (ch) => ({ id: ch.id, name: ch.name, age: G.childAge(ch), sex: ch.sex, isChild: true, ref: ch, portrait: { glyph: ch.name[0], hue: ch.sex === "m" ? 40 : 340 } });

  G.birth = function (c) {
    const s = G.state;
    const n = rand() < 0.15 * G.queMult("twins") ? (rand() < 0.13 ? 3 : 2) : 1;
    const born = [];
    const usedNames = new Set(s.children.map((x) => x.name));
    for (let i = 0; i < n; i++) {
      const sex = rand() < 0.5 ? "m" : "f";
      const pool = (sex === "m" ? R.namePool.child_m : R.namePool.child_f).filter((x) => !usedNames.has(x));
      const name = pool.length ? pick(pool) : (sex === "m" ? "Hoằng " : "Tĩnh ") + "Thứ" + (s.children.length + 1);
      usedNames.add(name);
      let quality = c.rank >= 5 && c.favor >= 85 ? 2 : c.rank >= 3 ? 1 : 0;
      if (s.legacies.includes("thong_tue")) quality = Math.min(2, quality + 1);
      const ch = {
        id: "child." + s.generation + "." + s.children.length,
        name,
        sex,
        mother: c.id,
        motherName: c.name,
        bornTurn: s.turn,
        order: s.children.filter((x) => x.sex === sex).length + 1,
        trait: rand() < 0.5 && c.traits.length ? inheritTrait(c) : pick(G.CHILD_TRAITS),
        quality: ["Thường", "Ưu", "Tuyệt"][quality],
        closeness: 30,
        teacher: null,
        education: null,
        spouse: null,
        title: null,
      };
      s.children.push(ch);
      born.push(ch);
    }
    c.pregnantDue = null;
    c.kids += born.length;
    G.changeFavor(c, 5);
    G.checkPromotion(c);
    const label = born.map((b) => (b.sex === "m" ? "hoàng tử " : "công chúa ") + b.name).join(" và ");
    log(`${c.name} hạ sinh ${label}.`, "child");
    if (born.length > 1) G.addAlbum(born.length === 2 ? "Song thai" : "Tam thai", `${c.name} hạ sinh ${label}.`);
    return born;
  };

  function inheritTrait(c) {
    const map = { "Biết múa": "Nghệ thuật", "Giọng hát ngọt": "Nghệ thuật", "Táo bạo": "Võ dũng", "Hoang dã": "Võ dũng", "Đoan trang": "Hiếu thảo", "Si tình": "Hiếu thảo", "Tinh nghịch": "Nghịch ngợm", "Hay ngượng": "Nhút nhát", "Tinh tế": "Thông minh", "Khéo nói": "Thông minh" };
    for (const t of c.traits) if (map[t]) return map[t];
    return pick(G.CHILD_TRAITS);
  }

  /** Gọi lúc con 16 tuổi: kết quả học vấn từ thầy dạy, độ thân thiết và phẩm chất. */
  G.educateChild = function (ch) {
    let score = 0;
    const t = G.TEACHERS[ch.teacher];
    if (t && (t.fits.includes(ch.trait) || t.fits.includes(ch.trait2))) score += 2;
    else if (t) score += 1;
    if (ch.closeness >= 70) score += 1;
    score += { Thường: 0, Ưu: 1, Tuyệt: 2 }[ch.quality] || 0;
    ch.education = G.EDUCATION[clamp(Math.floor(score / 1.5), 0, 3)];
    if (ch.sex === "m" && !ch.title) ch.title = ch.education === "Xuất chúng" ? "Thân vương" : ch.education === "Giỏi" ? "Quận vương" : "Bối lặc";
    if (ch.sex === "f" && !ch.title) ch.title = ch.closeness >= 70 ? "Cố Luân công chúa" : "Hòa Thạc công chúa";
    log(`${ch.name} học thành, học vấn ${ch.education}, phong ${ch.title}.`, "child");
    return `Học vấn: ${ch.education}`;
  };

  G.marryChild = function (ch) {
    const pool = ch.sex === "m" ? R.namePool.spouse_f : R.namePool.spouse_m;
    ch.spouse = pool.length ? pick(pool) : ch.sex === "m" ? "tiểu thư họ Phú Sát" : "công tử họ Nạp Lan";
    log(`${ch.name} thành thân với ${ch.spouse}.`, "child");
    G.addAlbum("Hỷ sự", `${ch.sex === "m" ? "Hoàng tử" : "Công chúa"} ${ch.name} thành thân với ${ch.spouse}.`);
    return `${ch.name} thành thân`;
  };

  monthly((s) => {
    // tự động: học thành lúc 16 nếu chưa có sự kiện nào làm việc đó; cháu chắt cho con đã thành thân
    for (const ch of s.children) {
      const age = G.childAge(ch);
      if (age >= 16 && !ch.education && s.month === 12) G.educateChild(ch);
      if (ch.spouse && age >= 19 && rand() < 0.02) {
        const pool = rand() < 0.5 ? R.namePool.child_m : R.namePool.child_f;
        const gname = (pool.length ? pick(pool) : "Tiểu " + ch.name) + (s.grandchildren.length ? "" : "");
        s.grandchildren.push({ name: gname, parent: ch.id, parentName: ch.name, bornTurn: s.turn });
        log(`${ch.name} có con: ${gname}. Bệ hạ lên chức ông.`, "child");
        s.flags.hasGrandchild = true;
      }
    }
  });

  /* ================================================================== */
  /* ĐỐI THỰC                                                            */
  /* ================================================================== */
  G.ATTITUDE_LABEL = ["Cấm", "Làm ngơ", "Dung túng", "Khuyến khích"];
  G.PAIR_STATUS = [
    { min: 86, label: "Đồng tâm" },
    { min: 61, label: "Đối thực" },
    { min: 31, label: "Tri kỷ" },
    { min: 0, label: "Tỷ muội" },
  ];
  const pairKey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
  G.pairKey = pairKey;
  G.getTinhY = (a, b) => G.state.pairs[pairKey(a, b)] || 0;
  G.addTinhY = function (a, b, d) {
    if (a === b) return;
    const s = G.state;
    const k = pairKey(a, b);
    const before = s.pairs[k] || 0;
    const after = clamp(before + d, 0, 100);
    s.pairs[k] = after;
    for (const st of [86, 61]) {
      if (before < st && after >= st) {
        const A = G.findConsort(a);
        const B = G.findConsort(b);
        if (A && B) log(`${A.name} và ${B.name} trở thành ${G.pairStatus(after)}.`, "pair");
      }
    }
  };
  G.pairStatus = (v) => G.PAIR_STATUS.find((p) => v >= p.min).label;
  G.listPairs = function () {
    const s = G.state;
    const out = [];
    for (const [k, v] of Object.entries(s.pairs)) {
      if (v <= 0) continue;
      const [ia, ib] = k.split("|");
      const a = G.findConsort(ia);
      const b = G.findConsort(ib);
      if (a && b) out.push({ a, b, tinhY: v, status: G.pairStatus(v) });
    }
    return out.sort((x, y) => y.tinhY - x.tinhY);
  };
  G.countPairs = (min) => G.listPairs().filter((p) => p.tinhY >= min).length;
  G.partnerOf = (id) => {
    const p = G.listPairs().find((x) => x.a.id === id || x.b.id === id);
    return p ? { other: p.a.id === id ? p.b : p.a, tinhY: p.tinhY, status: p.status } : null;
  };

  monthly((s) => {
    const list = s.consorts;
    const mult = [0.4, 1, 1.3, 1.6][s.attitude];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        let d = 0;
        d += ((a.affinity || {})[b.id] || 0) * 0.35 + ((b.affinity || {})[a.id] || 0) * 0.35;
        if (a.school && a.school === b.school) d += 0.25;
        const cur = G.getTinhY(a.id, b.id);
        if (d > 0 && a.favor < 35 && b.favor < 35) d += 0.15;
        if (d > 0) G.addTinhY(a.id, b.id, d * mult);
        else if (cur > 0 && cur < 61) s.pairs[G.pairKey(a.id, b.id)] = Math.max(0, cur - 0.1); // phai nhạt nếu không còn gì gắn kết
      }
    }
  });

  /* ================================================================== */
  /* HỌC PHƯỜNG                                                          */
  /* ================================================================== */
  G.SUBJECTS = { cam: "Cầm", ky: "Kỳ", thi: "Thi", hoa: "Họa" };
  G.setSchool = function (id, subj) {
    const c = G.findConsort(id);
    if (!c) return;
    c.school = G.SUBJECTS[subj] ? subj : null;
    c.schoolMonths = 0;
  };
  monthly((s) => {
    for (const c of s.consorts) {
      if (!c.school) continue;
      c.schoolMonths += G.queMult("school");
      if (c.schoolMonths >= 12) {
        const t = "Tinh thông " + G.SUBJECTS[c.school].toLowerCase();
        if (!c.traits.includes(t)) c.traits.push(t);
        G.changeFavor(c, 5);
        log(`${c.name} học xong lớp ${G.SUBJECTS[c.school]}, được khen tinh thông.`, "harem");
        c.school = null; // mãn khóa
        c.schoolMonths = 0;
      }
    }
  });

  /* ================================================================== */
  /* CUNG ĐIỆN: thưởng thụ động, Sủng ái 100                             */
  /* ================================================================== */
  monthly((s) => {
    for (const c of s.consorts) {
      if (c.palace && rand() < c.palace * 0.25) G.changeFavor(c, 1);
      if (c.favor >= 100) c.at100++;
    }
    // các nguồn thu do sự kiện mở ra, ví dụ { "income.tiem_huong": 150 } trong flags
    if (s.flags.tiem_huong_hoang_gia) G.addStat("quocKho", 150);
  });

  /* ================================================================== */
  /* SỞ THÍCH: nghiện, nhạt dần, thuyết phục, cai                        */
  /* ================================================================== */
  monthly((s) => {
    let craving = false;
    for (const [f, lv] of Object.entries(s.fetish)) {
      if (lv >= 80 && s.turn - (s.fetishLast[f] || 0) >= 12) craving = true;
    }
    if (craving) {
      G.addStat("longThe", -5);
      if (s.month === 1) log("Bệ hạ bứt rứt, mất ngủ vì những thú vui lâu không được thỏa mãn.", "info");
    }
  });

  /** Thuyết phục một phi với một sở thích đang ở mức "Cần thuyết phục". */
  G.persuade = function (id, fid) {
    const c = G.findConsort(id);
    const f = R.fetishes[fid];
    if (!c || !f) return null;
    const lvl = G.consentOf(c, fid);
    if (lvl === "refuse") return { ok: false, text: `${c.name} đã từ chối "${f.name}". Bệ hạ không ép.` };
    if (lvl === "willing") return { ok: true, text: `${c.name} vốn đã sẵn lòng.` };
    const need = 50 + f.tier * 10;
    if (c.favor >= need && c.affection >= need) {
      c.consent[fid] = "willing";
      G.state.flags.persuadedThisYear = true;
      log(`${c.name} gật đầu với "${f.name}".`, "harem");
      return { ok: true, text: `${c.name} đỏ mặt, khẽ gật đầu. Từ nay nàng sẵn lòng với "${f.name}".` };
    }
    return { ok: false, text: `${c.name} cúi đầu: "Thiếp… cần thêm thời gian." Cần Sủng ái và Tình cảm từ ${need} trở lên.` };
  };

  /** Mức Sủng ái và Tình cảm cần để thuyết phục được một sở thích. */
  G.persuadeNeed = (fid) => 50 + ((R.fetishes[fid] && R.fetishes[fid].tier) || 1) * 10;

  /** Thuyết phục cả hậu cung với một sở thích: thử lần lượt từng phi đang "Cần thuyết phục". */
  G.persuadeAll = function (fid) {
    const s = G.state;
    const f = R.fetishes[fid];
    if (!f || !G.fetishUnlocked(fid)) return null;
    const out = { name: f.name, need: G.persuadeNeed(fid), ok: [], wait: [], refuse: 0, already: 0 };
    for (const c of s.consorts) {
      const lvl = G.consentOf(c, fid);
      if (lvl === "refuse") out.refuse++;
      else if (lvl === "willing") out.already++;
      else (G.persuade(c.id, fid).ok ? out.ok : out.wait).push(c.name);
    }
    const parts = [];
    parts.push(out.ok.length ? `${out.ok.length} phi gật đầu: ${out.ok.join(", ")}.` : "Chưa phi nào gật đầu thêm.");
    if (out.wait.length) parts.push(`${out.wait.length} phi cần Sủng ái và Tình cảm từ ${out.need}: ${out.wait.join(", ")}.`);
    if (out.already) parts.push(`${out.already} phi vốn đã sẵn lòng.`);
    if (out.refuse) parts.push(`${out.refuse} phi từ chối, bệ hạ không ép.`);
    out.text = `"${f.name}": ` + parts.join(" ");
    return out;
  };

  /** Tu ở hành cung một năm: mọi độ nghiện về 30, Trụy lạc −20. */
  G.detox = function () {
    const s = G.state;
    for (let i = 0; i < 12 && !s.ended; i++) G.advanceMonth({ skipEvents: true });
    for (const f of Object.keys(s.fetish)) s.fetish[f] = Math.min(s.fetish[f], 30);
    G.addStat("truyLac", -20);
    s.flags.detoxed = true;
    log("Bệ hạ tu một năm ở hành cung, tâm thần thanh tịnh hơn.", "milestone");
  };

  /* ================================================================== */
  /* THỊ TẨM (Lật thẻ bài)                                               */
  /* ================================================================== */
  G.findCombo = function (fids) {
    for (const f of fids) {
      const def = R.fetishes[f];
      for (const cb of (def && def.combos) || []) if (fids.includes(cb.with)) return Object.assign({ from: f }, cb);
    }
    return null;
  };

  /** Lý do một phi không thể thị tẩm lúc này (hoặc null). */
  G.cannotSummon = function (c) {
    if (c.pregnantDue != null) return `${c.name} đang mang long thai, thái y dặn tĩnh dưỡng.`;
    const p = G.partnerOf(c.id);
    if (p && p.tinhY >= 100 && c.favor < 40) return `${c.name} sai cung nữ thưa: thân thể không khỏe. Nghe nói nàng đang đánh cờ cùng ${p.other.name}.`;
    return null;
  };

  G.summon = function (id, fetishIds) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c) return null;
    const why = G.cannotSummon(c);
    if (why) return { title: "Không thể thị tẩm", text: why, blocked: true };
    const fx = (fetishIds || []).filter((f) => G.fetishUnlocked(f));
    const combo = G.findCombo(fx);
    const hookId = combo ? combo.hook : fx.length ? "core.thi_tam_so_thich" : "core.thi_tam";
    const scene = G.runHook(hookId, { participants: [c], fetish: fx, place: "duong_tam_dien", combo: combo ? combo.name : null });
    if (scene.blocked) return scene;
    G.spendNight([c]);
    const notes = ["Sủng ái +8", "Long thể −1"];

    // nhạt dần khi lặp lại đúng một bộ sở thích
    const key = fx.slice().sort().join(",");
    if (key && key === s.fetishStreak.key) s.fetishStreak.count++;
    else s.fetishStreak = { key, count: 1 };
    const fade = key && s.fetishStreak.count > 5;
    for (const f of fx) {
      s.fetish[f] = clamp((s.fetish[f] || 0) + (fade ? 2 : 5), 0, 100);
      s.fetishLast[f] = s.turn;
      if (c.likes.includes(f)) {
        G.changeFavor(c, fade ? 3 : 8);
        notes.push(`Đúng gu ${c.name}`);
      }
    }
    if (fade) notes.push("Nhạt dần: thử sở thích khác");
    if (combo) {
      G.addStat("truyLac", 2);
      notes.push(`Combo: ${combo.name}`);
      s.flags["combo." + combo.hook] = true;
    }
    // ghen tuông
    if (s.summonStreak.id === c.id) s.summonStreak.count++;
    else s.summonStreak = { id: c.id, count: 1 };
    if (s.summonStreak.count === 3) {
      G.addStat("hoaKhi", -5);
      for (const o of s.consorts) if (o.id !== c.id) G.changeFavor(o, -1);
      log(`Ba đêm liền ${c.name} được triệu. Hậu cung xì xào ghen tị.`, "harem");
      notes.push("Hậu cung ghen: Hòa khí −5");
    }
    scene.notes = notes;
    return scene;
  };

  /* ================================================================== */
  /* CUỘC THI HẬU CUNG                                                   */
  /* ================================================================== */
  function contestUnlocked(ct) {
    return G.checkWhen(ct.unlock || {}, null, null) && (ct.fetish || []).every((f) => G.fetishUnlocked(f));
  }

  function contestParticipants(ct) {
    return G.participantsFor({ participants: { select: "top_favor", count: ct.count || 4 }, fetish: ct.fetish || [] }, { speaker: null });
  }

  G.CONTEST_MONTHS = [4, 9]; // hai mùa thi mỗi năm
  G.CONTEST_COST = 800; // tự mở cuộc thi
  G.CONTEST_COOLDOWN = 3; // tháng

  function contestChoices() {
    return shuffle(Object.values(R.contests).filter((ct) => contestUnlocked(ct) && contestParticipants(ct).length >= 2)).slice(0, 4);
  }

  function buildContestEvent(list, manual) {
    const ev = {
      id: "sys.contest",
      title: manual ? "Mở cuộc thi" : "Mùa thi hậu cung",
      text: manual
        ? "Lý công công dâng danh sách những cuộc thi có thể tổ chức ngay. Phi tần chỉ ghi tên vào cuộc thi mình sẵn lòng.\n> Bệ hạ muốn xem cuộc thi nào?"
        : "Lý công công dâng danh sách các cuộc thi mùa này. Phi tần chỉ ghi tên vào cuộc thi mình sẵn lòng.\n> Bệ hạ muốn xem cuộc thi nào?",
      choices: list
        .map((ct) => ({ label: `${ct.name}${ct.desc ? " · " + ct.desc : ""}`, hook: ct.hook, fetish: ct.fetish || [], participants: { select: "top_favor", count: ct.count || 4 }, minParticipants: 2, cost: manual ? G.CONTEST_COST : 0, effects: { truyLac: 3 + (ct.tier || 1) * 2 }, _contest: ct.id, _manual: !!manual }))
        .concat([manual ? { label: "Để dịp khác" } : { label: "Mùa này không thi", effects: { danTam: 2 } }]),
      onChoose: contestResolve,
    };
    return G.prepareEvent(ev, { speaker: null });
  }

  /** Lý do chưa tự mở cuộc thi được, hoặc null nếu mở được. */
  G.contestStatus = function () {
    const s = G.state;
    if (s.consorts.length < 3) return "Cần ít nhất ba phi tần.";
    const last = s.contest.manualTurn;
    if (last != null && s.turn - last < G.CONTEST_COOLDOWN) {
      const n = G.CONTEST_COOLDOWN - (s.turn - last);
      return `Vừa thi xong, ${n} tháng nữa mới mở lại được.`;
    }
    if (s.stats.quocKho < G.CONTEST_COST && !s.godFlags.infiniteMoney) return `Quốc khố không đủ ${G.CONTEST_COST} lượng.`;
    if (!contestChoices().length) return "Chưa có cuộc thi nào đủ người sẵn lòng tham gia.";
    return null;
  };
  /** Tự mở một cuộc thi (tốn quốc khố khi thật sự tổ chức). */
  G.openContest = function () {
    if (G.contestStatus()) return null;
    const ev = buildContestEvent(contestChoices(), true);
    return ev && ev.choices.length > 1 ? ev : null;
  };

  /* ================================================================== */
  /* CUNG QUY: lệ hậu cung do bệ hạ đặt, chỉ phi sẵn lòng mới theo       */
  /* ================================================================== */
  G.RULE_HOAKHI_PER_REFUSER = 0.25; // mỗi phi không theo làm Hòa khí giảm mỗi tháng
  G.RULE_HOAKHI_CAP = 1.5; // tối đa mỗi quy định mỗi tháng
  G.RULE_HOAKHI_TOTAL_CAP = 3; // tối đa cộng dồn của mọi quy định mỗi tháng
  const rulesOn = () => (G.state.rules = G.state.rules || {});

  G.ruleUnlocked = function (r) {
    return G.checkWhen(r.unlock || {}, null, null) && (r.fetish || []).every((f) => G.fetishUnlocked(f));
  };
  /** Phi theo lệ: đang ở trong cung và sẵn lòng với mọi sở thích của quy định. */
  G.ruleFollowers = function (r) {
    return G.state.consorts.filter((c) => (r.fetish || []).every((f) => G.consentOf(c, f) === "willing"));
  };
  G.ruleEnabled = (id) => Object.prototype.hasOwnProperty.call(rulesOn(), id);
  G.toggleRule = function (id) {
    const r = R.rules[id];
    if (!r) return false;
    const on = rulesOn();
    if (G.ruleEnabled(id)) {
      delete on[id];
      log(`Bãi bỏ ${r.name}.`, "harem");
    } else {
      if (!G.ruleUnlocked(r)) return false;
      on[id] = G.state.turn;
      const f = G.ruleFollowers(r).length;
      log(`Ban ${r.name}: ${f}/${G.state.consorts.length} phi tần theo lệ.`, "harem");
    }
    return true;
  };

  /** Dựng sự kiện "lệ hôm nay": nhìn các phi theo lệ, có thể dẫn vào cảnh của quy định. */
  function ruleEvent(r, followers, lead) {
    const ev = {
      id: "sys.rule",
      title: r.name,
      text: r.eventText || `Theo ${r.name}, ${followers.length} phi tần trong hậu cung vẫn giữ lệ.\n> Bệ hạ có muốn ghé xem không?`,
      choices: [
        { label: r.eventLabel || "Ghé xem", hook: r.hook, fetish: r.fetish || [], participants: lead ? [lead.id, ...shuffle(followers.filter((c) => c.id !== lead.id)).slice(0, (r.count || 3) - 1).map((c) => c.id)] : { select: "random", count: r.count || 3 }, minParticipants: 1, effects: { truyLac: 2 } },
        { label: "Để các nàng tự nhiên", effects: {} },
      ],
    };
    if (!r.hook) ev.choices.shift();
    return G.prepareEvent(ev, { speaker: null });
  }

  monthly((s, report) => {
    if (s.ended) return;
    const on = rulesOn();
    const active = [];
    let penalty = 0;
    for (const id of Object.keys(on)) {
      const r = R.rules[id];
      if (!r) {
        delete on[id]; // quy định của gói đã gỡ
        continue;
      }
      const fol = G.ruleFollowers(r);
      const refusers = s.consorts.length - fol.length;
      const m = r.monthly || {};
      for (const k of ["truyLac", "danTam", "longThe", "quocKho", "hoaKhi"]) if (m[k]) G.addStat(k, m[k]);
      for (const c of fol) {
        if (m.favor) G.changeFavor(c, m.favor);
        if (m.affection) c.affection = Math.max(0, Math.min(100, c.affection + m.affection));
      }
      if (refusers > 0) penalty += Math.min(G.RULE_HOAKHI_CAP, refusers * G.RULE_HOAKHI_PER_REFUSER);
      // "lead": "pregnant": người chính của cảnh phải là phi theo lệ đang mang thai
      let lead = r.lead === "pregnant" ? fol.find((c) => c.pregnantDue != null) : null;
      // phi đã dâng tấu xin ban lệ được làm người chính ở lần nổ cảnh đầu tiên
      const asked = s.ruleLead && s.ruleLead[id] ? fol.find((c) => c.id === s.ruleLead[id]) : null;
      if (asked && !lead && (r.lead !== "pregnant" || asked.pregnantDue != null)) lead = asked;
      if (r.lead === "pregnant" && !lead) continue;
      if (fol.length && r.hook && rand() < (r.chance == null ? 0.3 : r.chance) * G.queMult("rule")) active.push([r, fol, lead]);
    }
    if (penalty > 0) G.addStat("hoaKhi", -Math.min(G.RULE_HOAKHI_TOTAL_CAP, penalty));
    if (active.length && !report.ruleEvent) {
      const [r, fol, lead] = active[Math.floor(rand() * active.length)];
      const ev = ruleEvent(r, fol, lead);
      if (ev && ev.choices.length) {
        report.ruleEvent = ev;
        if (s.ruleLead) delete s.ruleLead[r.id];
      }
    }
  });

  /** Cuộc thi nổ ra sau một đêm thị tẩm: miễn phí, mỗi 3 tháng tối đa một lần, không trùng tháng mùa thi. */
  G.nightContest = function () {
    const s = G.state;
    if (s.consorts.length < 3 || G.CONTEST_MONTHS.includes(s.month)) return null;
    const last = s.contest.nightTurn;
    if (last != null && s.turn - last < G.CONTEST_COOLDOWN) return null;
    const list = contestChoices();
    if (!list.length) return null;
    const ev = buildContestEvent(list, false);
    if (!ev || ev.choices.length < 2) return null;
    ev.title = "Cuộc thi bất chợt";
    ev.text = "Sáng hôm sau, các phi rủ nhau bày một cuộc thi ngay trong hậu cung. Ai sẵn lòng thì ghi tên.\n> Bệ hạ muốn xem cuộc thi nào?";
    s.contest.nightTurn = s.turn;
    return ev;
  };

  /** Dựng sự kiện mùa thi (tháng 4 và 9) và Đại Điển (tháng 12). */
  monthly((s, report) => {
    if (s.ended || report.systemEvent) return;
    if (G.CONTEST_MONTHS.includes(s.month) && s.consorts.length >= 3) {
      const list = contestChoices();
      if (!list.length) return;
      report.systemEvent = buildContestEvent(list, false);
    }
    if (s.month === 12) {
      const scored = Object.entries(s.contest.scores)
        .map(([id, sc]) => ({ c: G.findConsort(id), sc }))
        .filter((x) => x.c && x.c.pregnantDue == null)
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 3);
      if (scored.length >= 3 && s.stats.truyLac >= 40 && s.year % 3 === 0) {
        const ids = scored.map((x) => x.c.id);
        const ev = {
          id: "sys.dai_dien",
          title: "Phong Nguyệt Đại Điển",
          text: `Ba người điểm cao nhất mùa thi: ${scored.map((x) => x.c.name).join(", ")}. Đại điển kéo dài ba đêm.\n> Người thắng được thăng một phẩm và chọn sở thích cho bệ hạ suốt tháng sau.`,
          choices: [
            { label: "Tổ chức Đại Điển", hook: "core.dai_dien", participants: ids, effects: { truyLac: 15, longThe: -8 }, _final: true },
            { label: "Chỉ trao giải, không tổ chức", effects: { hoaKhi: 3 }, _final: true },
          ],
          onChoose: finalResolve,
        };
        report.systemEvent = G.prepareEvent(ev, { speaker: null });
      }
      if (s.year % 3 === 0) s.contest.scores = {};
    }
  });

  function contestResolve(ch, sp, notes) {
    const s = G.state;
    if (!ch._contest) return;
    const ct = R.contests[ch._contest];
    const parts = G.participantsFor(ch, sp);
    if (!parts.length) return;
    // Tài năng quan trọng hơn Sủng ái; người thắng nhiều lần bị giám khảo khắt khe hơn
    const ranked = parts
      .map((c) => ({ c, v: c.favor * 0.35 + rand() * 55 + (c.traits.some((t) => (ct.traitsBonus || []).includes(t)) ? 22 : 0) - Math.min(30, c.contestWins * 6) }))
      .sort((a, b) => b.v - a.v);
    ranked.forEach((r, i) => (s.contest.scores[r.c.id] = (s.contest.scores[r.c.id] || 0) + (i === 0 ? 3 : 1)));
    const win = ranked[0].c;
    win.contestWins++;
    G.changeFavor(win, (ct.prize && ct.prize.favor) || 20);
    if (ct.prize && ct.prize.trait && !win.traits.includes(ct.prize.trait)) win.traits.push(ct.prize.trait);
    s.contest.held[ct.id] = (s.contest.held[ct.id] || 0) + 1;
    if (ch._manual) s.contest.manualTurn = s.turn;
    s.flags["contest." + ct.id] = true;
    ch._extra = { contest: ct.id, contestName: ct.name, winner: win.name, ranking: ranked.map((r) => r.c.name) };
    notes.push(`${win.name} thắng ${ct.name}`);
    log(`${ct.name}: ${win.name} đoạt giải nhất.`, "harem");
    G.addAlbum(ct.name, `${win.name} đoạt giải nhất trước ${ranked.length - 1} đối thủ.`);
  }

  function finalResolve(ch, sp, notes) {
    const s = G.state;
    const ids = Array.isArray(ch.participants) ? ch.participants : null;
    const list = (ids || [])
      .map((id) => G.findConsort(id))
      .filter(Boolean)
      .map((c) => ({ c, v: c.favor + rand() * 40 }))
      .sort((a, b) => b.v - a.v);
    if (!list.length) return;
    const win = list[0].c;
    G.promote(win, win.rank + 1);
    G.changeFavor(win, 15);
    s.championTitle = win.id;
    s.flags.daiDien = true;
    ch._extra = { winner: win.name, ranking: list.map((x) => x.c.name), contestName: "Phong Nguyệt Đại Điển" };
    notes.push(`${win.name}: Phong Nguyệt Đệ Nhất`);
    log(`${win.name} đoạt danh hiệu Phong Nguyệt Đệ Nhất.`, "milestone");
    G.addAlbum("Phong Nguyệt Đại Điển", `${win.name} đoạt danh hiệu Phong Nguyệt Đệ Nhất.`);
  }

  /* ================================================================== */
  /* CỬA HÀNG: quà, công trình, nâng cung                                */
  /* ================================================================== */
  G.buyGift = function (cid, gid) {
    const s = G.state;
    const c = G.findConsort(cid);
    const g = R.gifts[gid];
    if (!c || !g) return null;
    if (s.stats.quocKho < g.cost && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ." };
    G.addStat("quocKho", -g.cost);
    const times = c.gifts[gid] || 0;
    c.gifts[gid] = times + 1;
    let fav = g.favor;
    const match = (g.likes || []).some((l) => c.likes.includes(l) || c.traits.includes(l) || l === c.id);
    if (match) fav *= 2;
    fav = Math.max(1, Math.round(fav / (1 + times * 0.5)));
    G.changeFavor(c, fav);
    c.affection = clamp(c.affection + Math.ceil(fav / 3), 0, 100);
    if (g.pair) {
      const p = G.partnerOf(c.id);
      if (p) G.addTinhY(c.id, p.other.id, 10);
    }
    if (g.album) G.addAlbum(g.name, `${c.name} nhận ${g.name}.`);
    log(`Ban ${g.name} cho ${c.name}.`, "harem");
    return { ok: true, text: `${c.name} nhận ${g.name}${match ? ", đúng thứ nàng thích" : ""}.`, notes: [`Quốc khố −${g.cost}`, `Sủng ái +${fav}`] };
  };

  G.build = function (bid) {
    const s = G.state;
    const b = R.buildings[bid];
    if (!b || s.buildings[bid]) return null;
    if (b.requires && !G.checkWhen(b.requires, null, null)) return { ok: false, text: "Chưa đủ điều kiện xây." };
    if (s.stats.quocKho < b.cost && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ." };
    G.addStat("quocKho", -b.cost);
    s.buildings[bid] = true;
    const notes = G.applyEffects(b.effects || {}, {});
    log(`Khánh thành ${b.name}.`, "milestone");
    G.addAlbum("Khánh thành", `${b.name} hoàn thành.`);
    return { ok: true, text: b.done || `${b.name} đã hoàn thành.`, notes: [`Quốc khố −${b.cost}`].concat(notes) };
  };

  G.PALACE_COST = [1000, 2000, 3000];
  G.upgradePalace = function (cid) {
    const s = G.state;
    const c = G.findConsort(cid);
    if (!c || c.rank < 3 || c.palace >= 3) return null;
    const cost = G.PALACE_COST[c.palace];
    if (s.stats.quocKho < cost && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ." };
    G.addStat("quocKho", -cost);
    c.palace++;
    G.changeFavor(c, 5 * c.palace);
    log(`Cung của ${c.name} được nâng lên cấp ${c.palace}.`, "harem");
    return { ok: true, text: `Cung của ${c.name} lộng lẫy hơn (cấp ${c.palace}).`, notes: [`Quốc khố −${cost}`] };
  };

  /* ================================================================== */
  /* TUẦN DU                                                             */
  /* ================================================================== */
  G.canTravel = () => G.state.lastTravelYear !== G.state.year;
  G.travel = function (rid) {
    const s = G.state;
    const r = R.regions[rid];
    if (!r || !G.canTravel()) return null;
    if (s.stats.quocKho < r.cost && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ cho chuyến tuần du." };
    G.addStat("quocKho", -r.cost);
    G.addStat("longThe", -3);
    G.addStat("truyLac", 4);
    s.lastTravelYear = s.year;
    s.flags["travel." + rid] = true;
    const recruits = [];
    for (let i = 0; i < (r.recruit || 2); i++) recruits.push(G.makeRecruit(r.origin || "Mỹ nhân " + r.name));
    log(`Tuần du ${r.name}.`, "milestone");
    G.addAlbum("Tuần du " + r.name, r.album || `Đoàn thuyền rồng ghé ${r.name}.`);
    return { ok: true, region: r, recruits };
  };

  /* ================================================================== */
  /* TUYỂN TÚ                                                            */
  /* ================================================================== */
  G.SELECTION_COST = 1500;
  G.selectionCost = () => Math.round(G.SELECTION_COST * G.queMult("selection"));
  G.selectionStatus = function () {
    const s = G.state;
    if (s.flags.selectionClosed) return "Bệ hạ đã ngừng tuyển tú vĩnh viễn.";
    if (s.lastSelectionYear === s.year) return "Năm nay đã tuyển tú rồi. Đợi sang năm.";
    if (s.stats.quocKho < G.selectionCost() && !s.godFlags.infiniteMoney) return `Quốc khố không đủ ${G.selectionCost()} lượng để mở tuyển tú.`;
    return null;
  };
  G.holdSelection = function () {
    const s = G.state;
    if (G.selectionStatus()) return null;
    G.addStat("quocKho", -G.selectionCost());
    s.lastSelectionYear = s.year;
    return [G.makeRecruit(), G.makeRecruit(), G.makeRecruit(), G.makeRecruit()];
  };

  /* ================================================================== */
  /* KẾ VỊ VÀ KẾT THÚC (không có kết cục tệ)                             */
  /* ================================================================== */
  G.successorCandidates = function () {
    const adults = G.state.children.filter((c) => G.childAge(c) >= 18);
    const sons = adults.filter((c) => c.sex === "m");
    return (sons.length ? sons : adults).sort((a, b) => b.closeness - a.closeness);
  };

  monthly((s, report) => {
    if (s.ended || s.successor || report.systemEvent) return;
    const due = s.age >= 50 || s.stats.longThe <= 20;
    if (!due) return;
    const cands = G.successorCandidates();
    // Bắt buộc thoái vị ở 65 tuổi hoặc Long thể cạn
    if (s.age >= 65 || s.stats.longThe <= 0) {
      if (cands.length) s.successor = cands[0].id;
      s.retirePlace = s.retirePlace || "cam_cung";
      G.abdicate();
      return;
    }
    if (s.month !== 1 && s.stats.longThe > 20) return; // mỗi năm hỏi một lần
    if (s.flags.successionAsked === s.year) return;
    s.flags.successionAsked = s.year;
    const ev = {
      id: "sys.ke_vi",
      title: "Chọn người kế vị",
      text: cands.length
        ? "Thái y khuyên bệ hạ nghĩ đến chuyện truyền ngôi. Các con đều kính trọng nhau, không ai tranh giành.\n> Phụ hoàng chọn ai, chúng con cũng phục."
        : "Thái y khuyên bệ hạ nghĩ đến chuyện truyền ngôi, nhưng chưa có hoàng tử, công chúa nào đủ 18 tuổi.",
      choices: cands
        .slice(0, 4)
        .map((ch) => ({ label: `${ch.sex === "m" ? "Hoàng tử" : "Công chúa"} ${ch.name} · ${G.childAge(ch)} tuổi · ${ch.education || ch.trait} · thân thiết ${ch.closeness}`, _successor: ch.id, effects: { flag: "successorChosen" } }))
        .concat([{ label: "Để năm sau tính", effects: {} }]),
      onChoose: (ch, sp, notes) => {
        if (ch._successor) {
          s.successor = ch._successor;
          const c = s.children.find((x) => x.id === ch._successor);
          ch.result = `${c.name} được lập làm người kế vị.`;
          log(ch.result, "milestone");
          notes.push("Đã chọn người kế vị");
        }
      },
    };
    report.systemEvent = G.prepareEvent(ev, { speaker: null });
  });

  G.RETIRE = {
    cam_cung: "ở lại cấm cung cùng những người thân thiết nhất",
    hanh_cung: "lui về hành cung ôn tuyền",
    giang_nam: "ngao du Giang Nam trên thuyền rồng",
  };

  G.ENDINGS = [
    { id: "bach_hoa_vuong", title: "Bách Hoa Chi Vương", line: "Đế một đời phong lưu, trăm hoa đều nở trong tay.", test: (s) => ["core.bach_hoa", "core.me_lau", "core.dai_dien", "core.dem_ty_muoi"].every((h) => s.hooksFired[h]) },
    { id: "da_phuc", title: "Thiên Tử Đa Phúc", line: "Con cháu đầy điện, phúc lớn không ai sánh.", test: (s) => s.children.length + s.grandchildren.length >= 30 },
    { id: "vien_man", title: "Hậu Cung Viên Mãn", line: "Hậu cung không một tiếng thở dài.", test: (s) => s.consorts.length >= 5 && s.consorts.every((c) => c.favor >= 70) },
    { id: "thanh_toan", title: "Đế Vương Thành Toàn", line: "Đế hiểu lòng người, để tình nào cũng có chỗ.", test: (s) => G.countPairs(86) >= 3 && s.attitude >= 2 },
    { id: "nhat_sinh", title: "Nhất Sinh Nhất Thế", line: "Ba nghìn giai lệ, chỉ một người trong tim.", test: (s) => s.consorts.some((c) => c.at100 >= 240) },
    { id: "phong_luu", title: "Phong Lưu Thiên Cổ", line: "Đế tửu sắc cả đời, hậu thế kể mãi không chán.", test: (s) => s.stats.truyLac >= 90 },
    { id: "tieu_dao", title: "Thái Thượng Hoàng Tiêu Dao", line: "Buông ngai vàng sớm, rong chơi sơn thủy.", test: (s) => s.age < 45 },
    { id: "binh_an", title: "Bình An Một Đời", line: "Một đời êm ấm, không gì phải hối tiếc.", test: () => true },
  ];

  G.computeEnding = function () {
    const s = G.state;
    const hit = G.ENDINGS.filter((e) => e.test(s));
    return { main: hit[0], extras: hit.slice(1).filter((e) => e.id !== "binh_an"), godMode: s.godMode };
  };

  /** Đoạn sử quan ghi chép, sinh từ những gì đã xảy ra. */
  G.chronicle = function () {
    const s = G.state;
    const out = [];
    const reign = s.age - s.startAge;
    out.push(`${s.emperorName} trị vì ${reign || 1} năm, nạp ${s.consorts.length + s.former.length} phi tần, có ${s.children.length} con${s.grandchildren.length ? ` và ${s.grandchildren.length} cháu` : ""}.`);
    const fav = [...s.consorts].sort((a, b) => b.nights - a.nights)[0];
    if (fav) out.push(`Người được sủng nhất là ${fav.name}, ${fav.nights} đêm thị tẩm.`);
    const emp = s.consorts.find((c) => c.rank === 7);
    if (emp) out.push(`Hoàng hậu ${emp.name} quản hậu cung, mẫu nghi thiên hạ.`);
    if (s.stats.truyLac >= 80) out.push("Cung điện sáng đèn suốt đêm, chuyện phong lưu của đế còn được kể ở các quán trà.");
    else if (s.stats.truyLac <= 30) out.push("Đế biết tiết chế, triều chính yên ổn.");
    if (s.championTitle) {
      const c = G.findConsort(s.championTitle);
      if (c) out.push(`${c.name} từng đoạt danh hiệu Phong Nguyệt Đệ Nhất.`);
    }
    if (G.countPairs(61)) out.push(`Trong hậu cung có ${G.countPairs(61)} cặp đối thực, đế ${["cấm đoán", "làm ngơ", "dung túng", "khuyến khích"][s.attitude]}.`);
    const succ = s.children.find((c) => c.id === s.successor);
    if (succ) out.push(`Truyền ngôi cho ${succ.sex === "m" ? "hoàng tử" : "công chúa"} ${succ.name}.`);
    out.push(`Thoái vị năm ${s.age} tuổi, ${G.RETIRE[s.retirePlace] || G.RETIRE.cam_cung}.`);
    return out;
  };

  G.abdicate = function () {
    const s = G.state;
    if (s.ended) return s.ended;
    s.ended = G.computeEnding();
    s.ended.chronicle = G.chronicle();
    log(`${s.emperorName} truyền ngôi, làm Thái thượng hoàng.`, "milestone");
    G.checkAchievements(true);
    G.endRunDynasty();
    return s.ended;
  };

  /* ================================================================== */
  /* THÀNH TỰU                                                           */
  /* ================================================================== */
  const ACH_KEY = "tsdv-ach-v1";
  const kidsAll = (s) => s.children.length + s.grandchildren.length;
  G.ACHIEVEMENTS = [
    { id: "tan_de", name: "Tân Đế", desc: "Hoàn thành năm đầu tiên", test: (s) => s.turn >= 12 },
    { id: "phu_hoang", name: "Phụ Hoàng", desc: "Có người con đầu tiên", test: (s) => s.children.length >= 1 },
    { id: "thap_tu", name: "Thập Tử", desc: "10 người con", test: (s) => s.children.length >= 10 },
    { id: "da_tu", name: "Đa Tử Thiên Tử", desc: "30 con cháu", test: (s) => kidsAll(s) >= 30 },
    { id: "to_phu", name: "Tổ Phụ", desc: "Có cháu đầu tiên", test: (s) => s.grandchildren.length >= 1 },
    { id: "tam_thien", name: "Tam Thiên Giai Lệ", desc: "Hậu cung 50 người", test: (s) => s.consorts.length >= 50 },
    { id: "du_pham", name: "Đầy Đủ Phẩm Cấp", desc: "Mỗi phẩm có ít nhất một người", test: (s) => G.RANKS.every((_, i) => s.consorts.some((c) => c.rank === i)) },
    { id: "song_hy", name: "Song Hỷ Lâm Môn", desc: "Hai phi cùng báo hỷ trong một tháng", test: (s) => s.flags.doubleNews },
    { id: "long_phuong", name: "Long Phượng Song Thai", desc: "Sinh đôi một trai một gái", test: (s) => s.flags.longPhuong },
    { id: "chan_de", name: "Người Chăn Dê", desc: "Dùng xe dê 20 lần", test: (s) => (s.hooksFired["core.xe_de"] || 0) >= 20 },
    { id: "tri_am", name: "Tri Âm", desc: "Một sở thích đạt 100", test: (s) => Object.values(s.fetish).some((v) => v >= 100) },
    { id: "cuu_ngu", name: "Cửu Ngũ Chí Tôn", desc: "Một đêm với 6 người trở lên", test: (s) => s.counters.maxGroup >= 6 },
    { id: "phong_nguyet", name: "Phong Nguyệt Đại Điển", desc: "Tổ chức Đại Điển cuối năm", test: (s) => s.flags.daiDien },
    { id: "ngu_lang", name: "Ngưu Lang Tham Lam", desc: "Đi qua mọi cung đêm Thất tịch", hidden: true, test: (s) => s.flags.nguu_lang_tham_lam },
    { id: "ke_dung_ngoai", name: "Kẻ Đứng Ngoài", desc: "Bị một cặp đồng tâm gạt ra", hidden: true, test: (s) => s.flags.keDungNgoai },
    { id: "nguyet_lao", name: "Nguyệt Lão", desc: "5 cặp đối thực Đồng tâm", hidden: true, test: (s) => G.countPairs(86) >= 5 },
    { id: "su_quan", name: "Sử Quan Cũng Sa Ngã", desc: "Mời sử quan dự yến", hidden: true, test: (s) => s.flags.su_quan_sa_nga },
    { id: "bo_mau_muc", name: "Ông Bố Mẫu Mực", desc: "Mọi người con (từ 3 con) thân thiết từ 80", hidden: true, test: (s) => s.children.length >= 3 && s.children.every((c) => c.closeness >= 80) },
    { id: "hoi_dau", name: "Hồi Đầu Thị Ngạn", desc: "Tu ở hành cung sau khi Trụy lạc chạm 90", hidden: true, test: (s) => s.flags.detoxed && s.flags.reached100 },
    { id: "doi_doi", name: "Đời Đời Phong Lưu", desc: "Chơi đến đời thứ ba", hidden: true, test: (s) => s.generation >= 3 },
    { id: "thien_dao", name: "Thiên Đạo Vô Thường", desc: "Bật Thiên Đạo lần đầu", god: true, test: (s) => s.godMode },
    { id: "tao_hoa", name: "Tạo Hóa", desc: "Tạo 10 phi tần bằng Thiên Đạo", god: true, test: (s) => s.counters.godCreated >= 10 },
    { id: "nghich_thien", name: "Nghịch Thiên", desc: "Quay ngược thời gian 50 lần", god: true, test: (s) => s.counters.rewinds >= 50 },
  ];
  G.achievementsUnlocked = () => G.storage.get(ACH_KEY, {});
  G.checkAchievements = function () {
    const s = G.state;
    if (!s) return [];
    if (s.stats.truyLac >= 90) s.flags.reached100 = true;
    const got = G.achievementsUnlocked();
    const fresh = [];
    for (const a of G.ACHIEVEMENTS) {
      if (got[a.id]) continue;
      if (s.godMode && !a.god) continue;
      if (!s.godMode && a.god) continue;
      let ok = false;
      try {
        ok = !!a.test(s);
      } catch (e) {}
      if (ok) {
        got[a.id] = { at: Date.now(), name: s.emperorName };
        s.runAchievements.push(a.id);
        fresh.push(a);
        log(`Thành tựu: ${a.name}.`, "ach");
      }
    }
    if (fresh.length) G.storage.set(ACH_KEY, got);
    return fresh;
  };
  monthly((s) => {
    // song hỷ / long phượng
    const due = s.consorts.filter((c) => c.pregnantDue === s.turn + 9);
    if (due.length >= 2) s.flags.doubleNews = true;
    const recent = s.children.filter((c) => c.bornTurn === s.turn);
    const byMother = {};
    for (const c of recent) (byMother[c.mother] = byMother[c.mother] || []).push(c.sex);
    for (const sx of Object.values(byMother)) if (sx.includes("m") && sx.includes("f")) s.flags.longPhuong = true;
    G.checkAchievements();
  });

  /* ================================================================== */
  /* HUYẾT MẠCH (truyền đời)                                             */
  /* ================================================================== */
  const DYN_KEY = "tsdv-dynasty-v1";
  G.LEGACIES = {
    phuc_tuong: { name: "Phúc tướng", desc: "Tỉ lệ thụ thai +3%", cost: 40 },
    my_mao: { name: "Mỹ mạo", desc: "Tú nữ vào cung với Sủng ái +10; đời sau có thêm một phi", cost: 50 },
    thong_tue: { name: "Thông tuệ", desc: "Con sinh ra phẩm chất cao hơn một bậc", cost: 60 },
    cuong_trang: { name: "Cường tráng", desc: "Long thể hồi thêm mỗi tháng", cost: 80 },
  };
  G.dynasty = () => G.storage.get(DYN_KEY, { points: 0, owned: [], last: null });
  G.buyLegacy = function (id) {
    const d = G.dynasty();
    const L = G.LEGACIES[id];
    if (!L || d.owned.includes(id) || d.points < L.cost) return false;
    d.points -= L.cost;
    d.owned.push(id);
    G.storage.set(DYN_KEY, d);
    return true;
  };
  G.endRunDynasty = function () {
    const s = G.state;
    if (s.godMode) return;
    const d = G.dynasty();
    const earned = s.children.length + s.grandchildren.length * 2 + s.runAchievements.length * 5;
    d.points += earned;
    const succ = s.children.find((c) => c.id === s.successor);
    d.last = succ ? { name: succ.name, age: G.childAge(succ), generation: s.generation + 1, title: s.emperorName } : null;
    G.storage.set(DYN_KEY, d);
    s.ended.dynastyEarned = earned;
  };

  /* ================================================================== */
  /* KỊCH BẢN                                                            */
  /* ================================================================== */
  G.SCENARIOS = {
    tu_do: { name: "Tự do", desc: "Hậu cung có ba người, mọi thứ bắt đầu từ đầu." },
    xe_de: { name: "Xe dê", desc: "Lấy cảm hứng từ Tấn Vũ Đế: bắt đầu với hậu cung mười hai người, xe dê có ngay từ đầu." },
    me_lau: { name: "Mê Lâu", desc: "Lấy cảm hứng từ Tùy Dạng Đế: quốc khố đầy, Mê Lâu đã xây xong, Trụy lạc khởi điểm 30." },
    hoa_thanh: { name: "Hoa Thanh Trì", desc: "Lấy cảm hứng từ Đường Huyền Tông: bắt đầu cùng một sủng phi định mệnh và bể tắm ôn tuyền." },
  };
  G.applyScenario = function (id) {
    const s = G.state;
    s.flags["scenario." + id] = true;
    if (id === "xe_de") for (let i = 0; i < 9; i++) G.addConsort(G.makeRecruit().id, true);
    if (id === "me_lau") {
      s.stats.quocKho = 25000;
      s.stats.truyLac = 30;
      s.buildings["core.me_lau"] = true;
      s.flags.me_lau = true;
    }
    if (id === "hoa_thanh") {
      s.buildings["core.ho_duc_tri"] = true;
      const c = G.addConsort("core.hong_tieu", true);
      if (c) {
        c.favor = 70;
        c.affection = 60;
      }
    }
  };

  /* ================================================================== */
  /* NHẬT KÝ HẬU CUNG                                                    */
  /* ================================================================== */
  const DIARY = [
    "{a} tập múa cả buổi chiều trong ngự uyển.",
    "{a} và {b} ngồi đánh cờ đến tận khuya.",
    "{a} thêu một chiếc túi thơm, không nói tặng ai.",
    "{a} ra hồ sen cho cá ăn, cười một mình.",
    "{a} sai cung nữ đi hỏi hôm nay bệ hạ ở cung nào.",
    "{a} và {b} cãi nhau vì một cây trâm, rồi làm hòa.",
    "{a} chép kinh cầu con.",
    "{a} thử một mùi hương mới của tiệm Hồ thị.",
    "{a} hát khe khẽ bên cửa sổ, cung nữ đứng nghe.",
    "{a} đọc lại những bài thơ bệ hạ từng tặng.",
  ];
  monthly((s) => {
    if (s.consorts.length < 2 || rand() > 0.45) return;
    const [a, b] = shuffle(s.consorts);
    const p = G.partnerOf(a.id);
    const other = p && rand() < 0.6 ? p.other : b;
    log(pick(DIARY).replace("{a}", a.name).replace("{b}", other.name), "diary");
  });

  /* ================================================================== */
  /* MỤC TIÊU NĂM                                                        */
  /* ================================================================== */
  /*
   * Mỗi đầu năm chọn 3 mục tiêu còn làm được. Hoàn thành trong năm thì nhận thưởng ngay.
   * start(s) chụp số liệu lúc đặt mục tiêu; test(s, base) kiểm tra đã xong chưa.
   */
  const snapCount = (s) => ({ kids: s.children.length, nights: s.nightsTotal, harem: s.consorts.length, b: Object.keys(s.buildings).length, contests: Object.values(s.contest.held).reduce((a, b) => a + b, 0), gifts: s.consorts.reduce((t, c) => t + Object.values(c.gifts).reduce((a, b) => a + b, 0), 0), album: s.album.length });
  G.GOALS = [
    { id: "con_moi", text: "Có thêm một hoàng tử hoặc công chúa", ok: (s) => s.consorts.length >= 2, test: (s, b) => s.children.length > b.kids, reward: { hoaKhi: 5, quocKho: 500 } },
    { id: "hoang_hau", text: "Lập Hoàng hậu", ok: (s) => !s.consorts.some((c) => c.rank === 7) && s.consorts.some((c) => c.favor >= 50), test: (s) => s.consorts.some((c) => c.rank === 7), reward: { danTam: 10, hoaKhi: 10 } },
    { id: "nap_phi", text: "Nạp thêm hai phi tần", ok: (s) => !s.flags.selectionClosed, test: (s, b) => s.consorts.length >= b.harem + 2, reward: { quocKho: 400 } },
    { id: "xay", text: "Xây một công trình mới", ok: (s) => Object.keys(R.buildings).some((id) => !s.buildings[id]), test: (s, b) => Object.keys(s.buildings).length > b.b, reward: { truyLac: 3, hoaKhi: 5 } },
    { id: "thi", text: "Tổ chức một cuộc thi hậu cung", ok: (s) => s.consorts.length >= 3, test: (s, b) => Object.values(s.contest.held).reduce((a, x) => a + x, 0) > b.contests, reward: { favorAll: 3 } },
    { id: "qua", text: "Tặng quà ba lần", ok: (s) => s.consorts.length >= 1, test: (s, b) => s.consorts.reduce((t, c) => t + Object.values(c.gifts).reduce((a, x) => a + x, 0), 0) >= b.gifts + 3, reward: { hoaKhi: 5 } },
    { id: "hoa_khi", text: "Giữ Hòa khí từ 70 đến cuối năm", ok: (s) => s.stats.hoaKhi >= 50, test: (s) => s.month === 12 && s.stats.hoaKhi >= 70, reward: { quocKho: 600 } },
    { id: "dan_tam", text: "Đưa Dân tâm lên 70", ok: (s) => s.stats.danTam < 70, test: (s) => s.stats.danTam >= 70, reward: { quocKho: 800 } },
    { id: "tiet_che", text: "Giảm Trụy lạc 10 điểm", ok: (s) => s.stats.truyLac >= 40, test: (s, b) => s.stats.truyLac <= b.truyLac - 10, reward: { longThe: 10, danTam: 5 } },
    { id: "sung_100", text: "Có một phi đạt Sủng ái 100", ok: (s) => s.consorts.some((c) => c.favor >= 70 && c.favor < 100), test: (s) => s.consorts.some((c) => c.favor >= 100), reward: { album: true } },
    { id: "tri_ky", text: "Có một cặp tỷ muội thành Tri kỷ", ok: (s) => s.consorts.length >= 4 && G.countPairs(31) === 0, test: () => G.countPairs(31) > 0, reward: { hoaKhi: 5 } },
    { id: "than_thiet", text: "Có một người con thân thiết từ 80", ok: (s) => s.children.some((c) => c.closeness < 80), test: (s) => s.children.some((c) => c.closeness >= 80), reward: { hoaKhi: 5 } },
    { id: "tuan_du", text: "Đi tuần du một chuyến", ok: () => G.canTravel(), test: (s) => s.lastTravelYear === s.year, reward: { danTam: 5 } },
    { id: "thuyet_phuc", text: "Thuyết phục thành công một phi", ok: (s) => s.consorts.length >= 1 && G.fetishUnlocked && Object.keys(R.fetishes).some((f) => G.fetishUnlocked(f)), test: (s) => s.flags.persuadedThisYear, reward: { truyLac: 3 } },
  ];
  G.newGoals = function () {
    const s = G.state;
    const pool = shuffle(G.GOALS.filter((g) => g.ok(s)));
    const base = Object.assign(snapCount(s), { truyLac: s.stats.truyLac });
    s.goals = { year: s.year, base, list: pool.slice(0, 3).map((g) => ({ id: g.id, done: false })) };
    delete s.flags.persuadedThisYear;
  };
  G.goalDef = (id) => G.GOALS.find((g) => g.id === id);
  G.checkGoals = function () {
    const s = G.state;
    if (!s.goals) return [];
    const fresh = [];
    for (const g of s.goals.list) {
      if (g.done) continue;
      const def = G.goalDef(g.id);
      let ok = false;
      try {
        ok = def && def.test(s, s.goals.base);
      } catch (e) {}
      if (!ok) continue;
      g.done = true;
      const rw = Object.assign({}, def.reward);
      if (rw.album) {
        delete rw.album;
        G.addAlbum("Mục tiêu", def.text);
      }
      const notes = G.applyEffects(rw, {});
      log(`Hoàn thành mục tiêu năm: ${def.text}. ${notes.join(", ")}`, "goal");
      fresh.push(def);
    }
    if (s.goals.list.length && s.goals.list.every((g) => g.done) && !s.goals.bonus) {
      s.goals.bonus = true;
      G.addStat("quocKho", 1000);
      log("Hoàn thành cả ba mục tiêu năm: thưởng 1000 lượng.", "goal");
    }
    return fresh;
  };
  monthly((s) => {
    if (!s.goals || (s.month === 1 && s.goals.year !== s.year)) G.newGoals();
    G.checkGoals();
  });

  /* ================================================================== */
  /* HẬU QUẢ CỦA CHỈ SỐ                                                  */
  /* ================================================================== */
  monthly((s) => {
    // Hòa khí thấp: hậu cung cãi vã, Sủng ái rơi ngẫu nhiên
    if (s.stats.hoaKhi < 30 && s.consorts.length >= 2 && rand() < 0.35) {
      const c = pick(s.consorts);
      G.changeFavor(c, -3);
    }
    // Hậu cung quá đông thì khó giữ hòa khí
    if (s.consorts.length > 30) G.addStat("hoaKhi", -0.05 * (s.consorts.length - 30));
    // Hòa khí tự hồi chậm khi hậu cung vừa phải
    else if (s.stats.hoaKhi < 60) G.addStat("hoaKhi", 0.3);
  });

  /** Ban ân cho một phi xuất cung, kèm hồi môn. */
  G.RELEASE_COST = 300;
  G.releaseConsort = function (id) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c) return null;
    if (c.rank === 7) return { ok: false, text: "Không thể cho Hoàng hậu xuất cung." };
    if (c.pregnantDue != null) return { ok: false, text: `${c.name} đang mang long thai.` };
    if (s.children.some((ch) => ch.mother === c.id && G.childAge(ch) < 16)) return { ok: false, text: `${c.name} còn con nhỏ, không nỡ rời cung.` };
    G.addStat("quocKho", -G.RELEASE_COST);
    G.removeConsort(c.id, "được ban ân xuất cung");
    G.addStat("danTam", 2);
    G.addStat("hoaKhi", 1);
    log(`${c.name} được ban ân xuất cung, mang theo hồi môn.`, "harem");
    return { ok: true, text: `${c.name} quỳ tạ ân, rời cung về quê với hồi môn ${G.RELEASE_COST} lượng.`, notes: [`Quốc khố −${G.RELEASE_COST}`, "Dân tâm +2"] };
  };

  /* ================================================================== */
  /* THOẠI CHO TÚ NỮ NGẪU NHIÊN                                           */
  /* ================================================================== */
  G.TRAIT_LINES = {
    "Táo bạo": ["Bệ hạ nhìn gì thế? Thiếp đâu có ngại.", "Đêm nay bệ hạ còn định để thiếp đợi sao?"],
    "Hay ngượng": ["Thần… thần thiếp tham kiến bệ hạ.", "Bệ hạ đừng nhìn thiếp như vậy… thiếp ngượng."],
    "Biết múa": ["Thiếp vừa tập xong điệu múa mới.", "Điệu này thiếp chỉ múa khi có bệ hạ."],
    "Giọng hát ngọt": ["Thiếp hát cho bệ hạ nghe một bài nhé?", "Khúc này thiếp hát mãi mà vẫn nhớ bệ hạ."],
    "Khéo tay": ["Thiếp thêu chiếc khăn này, mong bệ hạ đừng chê.", "Túi thơm này thiếp làm cả tuần đấy."],
    "Mùi hương lạ": ["Bệ hạ ngửi thử xem, hương này thiếp tự chế.", "Hôm nay thiếp xức hương bệ hạ thích nhất."],
    "Tinh nghịch": ["Bệ hạ đoán xem thiếp giấu gì sau lưng?", "Hôm nay thiếp lại trốn học múa, bệ hạ đừng mách ai."],
    "Ôn nhu": ["Bệ hạ mệt rồi, để thiếp xoa vai cho.", "Ngồi đây với thiếp một lát thôi."],
    "Kiêu kỳ": ["Bệ hạ cuối cùng cũng nhớ ra thiếp sao?", "Thiếp không đợi đâu. Chỉ là tình cờ chưa ngủ."],
    "Đa sầu": ["Mưa mãi không dứt, lòng thiếp cũng thế.", "Có bệ hạ ở đây, mưa cũng thôi buồn."],
    "Lãng mạn": ["Trăng đêm nay đẹp quá, bệ hạ có thấy không?", "Thiếp mơ thấy bệ hạ dưới hoa đào."],
    "Thích chưng diện": ["Trâm mới của thiếp có đẹp không?", "Bộ áo này thiếp chỉ mặc cho bệ hạ xem."],
    "Phúc tướng": ["Thầy tướng nói thiếp có phúc lắm.", "Thiếp cầu cho bệ hạ bình an mỗi ngày."],
    "Eo thon": ["Thiếp đang tập múa lụa, bệ hạ xem không?", "Áo này hơi chật, bệ hạ thấy sao?"],
  };
  const baseRecruit = G.makeRecruit;
  G.makeRecruit = function (origin) {
    const def = baseRecruit(origin);
    const t = def.traits.find((x) => G.TRAIT_LINES[x]);
    if (t) def.lines = { low: G.TRAIT_LINES[t][0], high: G.TRAIT_LINES[t][1] };
    return def;
  };

  /* ================================================================== */
  /* ĐỢT 1 (0.4.1): Bảng vàng · Đêm nàng chọn · Phi xin ban lệ · Quẻ    */
  /* ================================================================== */
  /*
   * Câu chữ của bốn tính năng nằm trong G.D1_TEXT để dễ thay bằng bản Grok viết.
   * Biến: {name} tên phi, {bang} tên bảng, {hang} thứ hạng, {fetish} tên sở thích, {rule} tên lệ,
   * {cosign} những phi cùng ký tấu, {que} tên quẻ.
   */
  G.D1_TEXT = {
    bangTop: [
      "Cuối tháng, Kính Sự phòng dâng Bảng vàng hậu cung. Bảng {bang} tháng này, {name} đứng {hang}.\n> Thần thiếp không dám nhận lời khen, chỉ mong bệ hạ vui lòng.",
      "Lý công công trải tờ Bảng vàng lên án. Tên {name} viết đầu bảng {bang}, mực son còn chưa khô.\n> Bệ hạ, các phi đều đang chờ xem người ban thưởng thế nào.",
    ],
    bangBottom: {
      sung_phi: "{name} đứng cuối bảng Sủng phi tháng này. Chiều tối, cung nữ của nàng mang đến một ấm trà còn nóng.\n> Nương nương nhà nô tì pha trà đợi bệ hạ. Nương nương nói, nếu bệ hạ rảnh thì ghé cung một lát.",
      tri_ky: "Bảng Tri kỷ tháng này, tên {name} ở cuối. Sáng hôm sau trên án có một phong thư nhỏ, nét chữ của nàng.\n> Bệ hạ còn nhớ thiếp không? Thiếp vẫn nhớ đêm đầu bệ hạ đến cung thiếp.",
      bi_lang_quen: "Đã lâu bệ hạ chưa triệu {name}. Đêm nay nàng tự đến trước cửa Dưỡng Tâm điện, tay ôm chiếc áo choàng mỏng.\n> Thiếp biết mình không nên tự đến… nhưng thiếp nhớ bệ hạ quá.",
      tai_nghe: "{name} đứng cuối bảng Tài nghệ. Nàng ôm cây đàn cũ đến xin bệ hạ.\n> Thiếp muốn học thêm cho bằng các tỷ muội. Bệ hạ cho thiếp vào học phường được không?",
      hoa_nha: "Bảng Hòa nhã tháng này, {name} đứng cuối. Nghe nói mấy hôm nay các tỷ muội ngồi uống trà mà không ai gọi nàng.\n> Thiếp không sao đâu. Thiếp quen ngồi một mình rồi.",
    },
    choiceIntro: [
      "{name} quỳ trước long sàng, má hồng lên.\n> Bệ hạ… đêm nay cho thiếp được tự chọn một lần. Thiếp muốn \"{fetish}\".",
      "{name} đến sớm hơn mọi khi, tay cầm một tấm thẻ nhỏ tự viết.\n> Đêm nay để thiếp chọn nhé. Thiếp đã nghĩ cả ngày rồi: \"{fetish}\".",
      "Đèn vừa thắp, {name} đã kéo tay áo bệ hạ.\n> Bệ hạ hay chọn cho thiếp. Hôm nay thiếp xin được chọn \"{fetish}\", người chịu không?",
    ],
    ruleRequest: "{name} dâng một bản tấu chép tay ngay ngắn, xin bệ hạ ban {rule}.\n> Thần thiếp và các tỷ muội đã bàn kỹ, ai cũng sẵn lòng giữ lệ này. Xin bệ hạ chuẩn tấu.",
    ruleCosign: "Cùng ký tấu: {cosign}.",
    queIntro: "Đầu xuân, Khâm thiên giám dâng quẻ cho năm mới: quẻ {que}.",
    que: {
      dao_hoa: "Hoa đào nở sớm trong cung, năm nay tình duyên vượng. Đêm dài nhiều chuyện, mỹ nhân hay tự tìm đến.",
      tu_ton: "Sao Tử tôn sáng rõ ở phương đông. Năm nay hậu cung dễ có tin vui.",
      song_hy: "Hai sao cùng mọc một chỗ, điềm song hỷ. Nếu có tin vui, dễ là long phượng song thai.",
      phong_thu: "Mưa thuận gió hòa, lúa được mùa. Thuế về kho đầy hơn mọi năm.",
      han_han: "Mây thưa, trời khô. Năm nay e có hạn, dân đói thì lòng dân dễ dao động. Bệ hạ nên tiết kiệm.",
      tuyen_tu: "Sao Hồng loan chiếu vào cung. Năm nay tú nữ khắp nơi đổ về, tuyển tú tốn ít mà được người đẹp.",
      van_xuong: "Sao Văn xương sáng. Năm nay người trong cung học gì cũng mau thành.",
      phong_nguyet: "Gió trăng đầy trời. Năm nay lệ trong cung được giữ nghiêm, chuyện phong nguyệt cũng nhiều hơn.",
      binh_an: "Quẻ bình. Không điềm lạ, không tai ương. Các nước chư hầu gửi lễ vật mừng năm mới.",
    },
  };

  const d1 = (s) => {
    s = s || G.state;
    if (!s.d1) s.d1 = {};
    const d = s.d1;
    for (const [k, v] of Object.entries({ queId: null, queYear: 0, queLast: null, rerolled: 0, choiceTurn: -99, reqTurn: -99, bangTurn: -99, monthBase: {}, contestBase: {}, fetishUse: {}, lastNight: {}, badge: null, forceChoice: null, reqPriority: null, boards: {} }))
      if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    s.ruleLead = s.ruleLead || {};
    return d;
  };
  G.d1 = d1;
  const tpl = (t, vars) => String(t).replace(/\{(bang|hang|fetish|rule|cosign|que)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

  /* ---------------- Ghi nhận đêm thị tẩm và sở thích đã dùng ---------------- */
  const baseSpendNight = G.spendNight;
  G.spendNight = function (list, opts) {
    baseSpendNight(list, opts);
    const d = d1();
    for (const c of list) d.lastNight[c.id] = G.state.turn;
  };
  const baseRunHook = G.runHook;
  G.runHook = function (id, ctxIn) {
    const scene = baseRunHook(id, ctxIn);
    if (scene && !scene.blocked && G.state) {
      const d = d1();
      for (const f of ctxIn.fetish || []) d.fetishUse[f] = (d.fetishUse[f] || 0) + 1;
    }
    return scene;
  };

  /* ---------------- 31 · Quẻ đầu năm ---------------- */
  G.QUE = [
    { id: "dao_hoa", name: "Đào hoa", desc: "Chuyện trong đêm nhiều hơn một nửa, phi hay xin tự chọn đêm.", mult: { night: 1.5, choice: 2 } },
    { id: "tu_ton", name: "Tử tôn", desc: "Tỉ lệ mang thai +30%.", mult: { conceive: 1.3 } },
    { id: "song_hy", name: "Song hỷ", desc: "Sinh đôi dễ gấp đôi.", mult: { twins: 2 } },
    { id: "phong_thu", name: "Phong thu", desc: "Thu nhập mỗi tháng +10%.", mult: { income: 1.1 } },
    { id: "han_han", name: "Hạn hán", bad: true, desc: "Thu nhập −10%, Dân tâm dễ giảm.", mult: { income: 0.9 } },
    { id: "tuyen_tu", name: "Tuyển tú", desc: "Tuyển tú rẻ một nửa, tú nữ vào cung được sủng hơn.", mult: { selection: 0.5 } },
    { id: "van_xuong", name: "Văn xương", desc: "Học phường học nhanh gấp đôi.", mult: { school: 2 } },
    { id: "phong_nguyet", name: "Phong nguyệt", desc: "Trụy lạc tăng nhanh hơn, cảnh cung quy nổ dày hơn một nửa.", mult: { truyLac: 1.2, rule: 1.5 } },
    { id: "binh_an", name: "Bình an", desc: "Không đổi gì, nhận 500 lượng lễ vật.", mult: {} },
  ];
  G.QUE_BAD_WEIGHT = 0.06;
  G.QUE_REROLL_COST = 300;
  G.currentQue = function () {
    const s = G.state;
    if (!s || !s.d1 || s.d1.queYear !== s.year) return null;
    return G.QUE.find((q) => q.id === s.d1.queId) || null;
  };
  G.queMult = function (k) {
    const q = G.currentQue();
    return (q && q.mult[k]) || 1;
  };
  function rollQue(exclude) {
    const list = G.QUE.filter((q) => !exclude.includes(q.id));
    const bad = list.filter((q) => q.bad);
    const good = list.filter((q) => !q.bad);
    const goodW = good.length ? (1 - G.QUE_BAD_WEIGHT * bad.length) / good.length : 0;
    let r = rand();
    for (const q of list) {
      r -= q.bad ? G.QUE_BAD_WEIGHT : goodW;
      if (r <= 0) return q;
    }
    return list[list.length - 1];
  }
  function setQue(q) {
    const s = G.state;
    const d = d1();
    d.queId = q.id;
    d.queYear = s.year;
    if (q.id === "binh_an") G.addStat("quocKho", 500);
    log(`Khâm thiên giám dâng quẻ: năm ${q.name}. ${q.desc}`, "milestone");
  }
  const queText = (q) => `${tpl(G.D1_TEXT.queIntro, { que: q.name })}\n> ${G.D1_TEXT.que[q.id] || q.desc}\nCả năm: ${q.desc}`;
  monthly((s, report) => {
    if (s.ended || s.month !== 1) return;
    const d = d1(s);
    if (d.queYear === s.year) return;
    d.queLast = d.queId;
    d.rerolled = 0;
    const q = rollQue([d.queLast].filter(Boolean));
    setQue(q);
    const ev = {
      id: "sys.que",
      title: "Quẻ đầu năm",
      text: queText(q),
      choices: [
        { label: "Nhận quẻ" },
        { label: "Gieo lại một lần", cost: G.QUE_REROLL_COST, _reroll: true },
      ],
      onChoose: (ch) => {
        if (!ch._reroll) return;
        const dd = d1();
        if (dd.rerolled) return;
        dd.rerolled = 1;
        if (dd.queId === "binh_an") G.addStat("quocKho", -500);
        const nq = rollQue([dd.queLast, dd.queId].filter(Boolean));
        setQue(nq);
        ch.result = queText(nq);
      },
    };
    report.sideEvents.push(G.prepareEvent(ev, { speaker: null }));
  });
  monthly((s) => {
    const q = G.currentQue();
    if (q && q.id === "han_han") G.addStat("danTam", -0.3);
  });
  const recruitD1 = G.makeRecruit;
  G.makeRecruit = function (origin) {
    const def = recruitD1(origin);
    const q = G.currentQue();
    if (q && q.id === "tuyen_tu") def.favor = Math.min(100, def.favor + 5);
    return def;
  };

  /* ---------------- 22 · Bảng vàng ---------------- */
  let unlockedCache = null; // danh sách sở thích đã mở, tính một lần mỗi lượt chấm bảng
  const unlockedNow = () => unlockedCache || Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f));
  const willingCount = (c) => unlockedNow().filter((f) => G.consentOf(c, f) === "willing").length;
  const sumTinhY = (c) => G.state.consorts.reduce((t, o) => (o.id === c.id ? t : t + G.getTinhY(c.id, o.id)), 0);
  const ruleCount = (c) => Object.keys(G.state.rules || {}).filter((id) => R.rules[id] && (R.rules[id].fetish || []).every((f) => G.consentOf(c, f) === "willing")).length;
  G.BOARDS = [
    { id: "sung_phi", name: "Sủng phi", unit: "Sủng ái", score: (c) => c.favor, top: { affection: 3 }, topNote: "Danh hiệu Đệ nhất sủng một tháng", bottom: true },
    { id: "tri_ky", name: "Tri kỷ", unit: "Tình cảm", score: (c) => c.affection, top: { affection: 5 }, bottom: true },
    { id: "phong_nguyet", name: "Phong nguyệt", unit: "đêm trong tháng", score: (c, d) => c.nights - (d.monthBase[c.id] != null ? d.monthBase[c.id] : c.nights), top: { truyLac: 1, favor: 3 } },
    { id: "bi_lang_quen", name: "Bị lãng quên", unit: "tháng chưa được triệu", score: (c, d) => G.state.turn - (d.lastNight[c.id] != null ? d.lastNight[c.id] : c.joinedTurn || 0), noTop: true, bottom: true, bottomIsFirst: true },
    { id: "tai_nghe", name: "Tài nghệ", unit: "điểm học phường", score: (c) => c.traits.filter((t) => t.startsWith("Tinh thông")).length * 12 + (c.school ? c.schoolMonths : 0), top: { danTam: 1, favor: 2 }, bottom: true },
    { id: "mau_nghi", name: "Mẫu nghi", unit: "con", score: (c) => c.kids + (c.pregnantDue != null ? 0.5 : 0), top: { favor: 3 } },
    { id: "hoa_nha", name: "Hòa nhã", unit: "Tình Ý với tỷ muội", score: sumTinhY, top: { hoaKhi: 2 }, bottom: true },
    { id: "phong_tinh", name: "Phong tình", unit: "sở thích sẵn lòng", score: willingCount, top: { affection: 2 }, topNote: "Tháng sau được tự chọn một đêm" },
    { id: "quan_quan", name: "Quán quân", unit: "lần thắng trong năm", score: (c, d) => c.contestWins - (d.contestBase[c.id] || 0), top: { favor: 3 }, topNote: "Cộng 3 điểm mùa thi, dễ vào Đại Điển" },
    { id: "tan_tu", name: "Tân tú", unit: "Sủng ái", filter: (c) => G.state.turn - (c.joinedTurn || 0) < 12, score: (c) => c.favor, top: { favor: 5, hoaKhi: -1 } },
    { id: "guong_mau", name: "Gương mẫu theo lệ", unit: "lệ đang theo", score: ruleCount, top: { favor: 2 }, topNote: "Được ưu tiên dâng tấu xin ban lệ" },
  ];
  G.BANG_MIN = 3;
  G.SIDE_MAX = 2; // tối đa số chuyện phụ (quẻ, bảng vàng, đêm nàng chọn, xin ban lệ) mỗi tháng
  G.BANG_CHANCE = 0.35;
  const HANG = ["đệ nhất", "đệ nhị", "đệ tam"];

  function scoreBoards(s) {
    const d = d1(s);
    const out = {};
    unlockedCache = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f));
    for (const b of G.BOARDS) {
      const list = s.consorts.filter((c) => !b.filter || b.filter(c));
      if (list.length < G.BANG_MIN) continue;
      const ranked = list.map((c) => ({ id: c.id, name: c.name, v: Math.round(b.score(c, d) * 10) / 10 })).sort((a, b2) => b2.v - a.v);
      if (!ranked[0] || ranked[0].v <= 0) continue;
      out[b.id] = { top: ranked.slice(0, 3), last: ranked[ranked.length - 1] };
    }
    unlockedCache = null;
    return out;
  }
  G.scoreBoards = () => scoreBoards(G.state);

  function bangTopEvent(b, c) {
    const text = tpl(pick(G.D1_TEXT.bangTop), { bang: b.name, hang: HANG[0] });
    const ev = {
      id: "sys.bang_vang",
      title: "Bảng vàng · " + b.name,
      text: text + (b.topNote ? `\nThưởng đứng nhất: ${b.topNote}.` : ""),
      choices: [
        { label: "Ban thưởng theo bảng", effects: b.top, _bang: b.id },
        { label: "Khen nàng một câu", effects: { affection: 2 } },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._bang) return;
        const s = G.state;
        const d = d1();
        if (b.id === "sung_phi") {
          d.badge = { id: c.id, label: "Đệ nhất sủng", until: s.turn + 1 };
          notes.push("Danh hiệu Đệ nhất sủng");
        }
        if (b.id === "phong_tinh") {
          d.forceChoice = c.id;
          notes.push("Tháng sau nàng được tự chọn một đêm");
        }
        if (b.id === "quan_quan") {
          s.contest.scores[c.id] = (s.contest.scores[c.id] || 0) + 3;
          notes.push("Điểm mùa thi +3");
        }
        if (b.id === "guong_mau") d.reqPriority = c.id;
        log(`Bảng vàng ${b.name}: ${c.name} đứng đầu.`, "harem");
      },
    };
    return G.prepareEvent(ev, { speaker: c });
  }

  function bangBottomEvent(b, c) {
    const T = G.D1_TEXT.bangBottom[b.id];
    if (!T) return null;
    const base = { id: "sys.bang_vang_chot", title: "Bảng vàng · " + b.name, text: tpl(T, { bang: b.name }) };
    const C = {
      sung_phi: [
        { label: "Ghé cung nàng uống trà", effects: { favor: 5, affection: 3 } },
        { label: "Bận chính sự, để hôm khác", effects: { affection: -1 } },
      ],
      tri_ky: [
        { label: "Viết thư hồi âm", effects: { affection: 6 } },
        { label: "Cất thư đi", effects: { affection: -1 } },
      ],
      bi_lang_quen: [
        { label: "Giữ nàng lại đêm nay", hook: "core.thi_tam", effects: { affection: 10 } },
        { label: "Cho nàng về, hẹn hôm khác", effects: { affection: 2 } },
      ],
      tai_nghe: [
        { label: "Cho nàng vào học phường", cost: 200, effects: { affection: 3 }, _school: true },
        { label: "Chưa cần", effects: {} },
      ],
      hoa_nha: [
        { label: "Bày tiệc trà cho các tỷ muội", cost: 100, effects: { hoaKhi: 2, affection: 3 }, _hoaGiai: true },
        { label: "Để các nàng tự nhiên", effects: { hoaKhi: -1 } },
      ],
    }[b.id];
    const ev = Object.assign(base, {
      choices: C,
      onChoose: (ch, sp, notes) => {
        const s = G.state;
        if (ch._school && !c.school) {
          G.setSchool(c.id, pick(Object.keys(G.SUBJECTS)));
          notes.push(`${c.name} vào lớp ${G.SUBJECTS[c.school]}`);
        }
        if (ch._hoaGiai) {
          const others = shuffle(s.consorts.filter((o) => o.id !== c.id)).slice(0, 2);
          for (const o of others) G.addTinhY(c.id, o.id, 5);
          if (others.length) notes.push(`Tình Ý với ${others.map((o) => o.name).join(", ")} +5`);
        }
      },
    });
    return G.prepareEvent(ev, { speaker: c });
  }

  monthly((s, report) => {
    if (s.ended) return;
    const d = d1(s);
    if (s.month === 1) for (const c of s.consorts) d.contestBase[c.id] = c.contestWins;
    d.boards = scoreBoards(s);
    for (const c of s.consorts) d.monthBase[c.id] = c.nights;
    if (d.badge && s.turn > d.badge.until) d.badge = null;
    if (report.sideEvents.length >= G.SIDE_MAX || s.turn - d.bangTurn < 2 || rand() >= G.BANG_CHANCE) return;
    const avail = G.BOARDS.filter((b) => d.boards[b.id]);
    if (!avail.length) return;
    const b = pick(avail);
    const res = d.boards[b.id];
    let ev = null;
    const wantBottom = b.noTop || (b.bottom && rand() < 0.4);
    if (wantBottom) {
      const e = b.bottomIsFirst ? res.top[0] : res.last;
      const c = e && G.findConsort(e.id);
      // nàng đang mang thai hoặc không thể thị tẩm thì không bày cảnh "giữ lại đêm nay"
      if (c && !(b.id === "bi_lang_quen" && (c.pregnantDue != null || G.cannotSummon(c)))) ev = bangBottomEvent(b, c);
    } else {
      const c = G.findConsort(res.top[0].id);
      if (c) ev = bangTopEvent(b, c);
    }
    if (ev && ev.choices.length) {
      d.bangTurn = s.turn;
      report.sideEvents.push(ev);
    }
  });

  /* ---------------- 23 · Đêm nàng chọn ---------------- */
  G.CHOICE_AFFECTION = 60;
  G.CHOICE_COOLDOWN = 3;
  G.CHOICE_CHANCE = 0.3;
  monthly((s, report) => {
    if (s.ended || !s.consorts.length || report.sideEvents.length >= G.SIDE_MAX) return;
    const d = d1(s);
    const forced = d.forceChoice ? G.findConsort(d.forceChoice) : null;
    if (!forced && (s.turn - d.choiceTurn < G.CHOICE_COOLDOWN || rand() >= G.CHOICE_CHANCE * G.queMult("choice"))) return;
    const unlocked = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f));
    const options = (c) => unlocked.filter((f) => G.consentOf(c, f) === "willing");
    const ok = (c) => c.pregnantDue == null && !G.cannotSummon(c) && options(c).length;
    let c = forced && ok(forced) ? forced : null;
    if (!c) {
      const list = s.consorts.filter((x) => x.affection >= G.CHOICE_AFFECTION && ok(x));
      if (!list.length) return;
      c = pick(list);
    }
    d.forceChoice = null;
    const opts = options(c);
    const minUse = Math.min(...opts.map((f) => d.fetishUse[f] || 0));
    const f = pick(opts.filter((x) => (d.fetishUse[x] || 0) === minUse));
    const ev = {
      id: "sys.dem_nang_chon",
      title: "Đêm nàng chọn",
      text: tpl(pick(G.D1_TEXT.choiceIntro), { fetish: R.fetishes[f].name }),
      choices: [
        { label: `Chiều ý nàng: ${R.fetishes[f].name}`, hook: "core.thi_tam_so_thich", fetish: [f], effects: { affection: 5 } },
        { label: "Để hôm khác", effects: { affection: -2 } },
      ],
    };
    const prepared = G.prepareEvent(ev, { speaker: c });
    if (prepared.choices.length < 2) return;
    d.choiceTurn = s.turn;
    report.sideEvents.push(prepared);
  });

  /* ---------------- 24 · Phi xin ban lệ ---------------- */
  G.REQUEST_COOLDOWN = 6;
  G.REQUEST_CHANCE = 0.25;
  monthly((s, report) => {
    if (s.ended || s.consorts.length < 2 || report.sideEvents.length >= G.SIDE_MAX) return;
    const d = d1(s);
    if (s.turn - d.reqTurn < G.REQUEST_COOLDOWN || rand() >= G.REQUEST_CHANCE) return;
    const half = Math.ceil(s.consorts.length / 2);
    const cands = Object.values(R.rules).filter((r) => G.ruleUnlocked(r) && !G.ruleEnabled(r.id) && G.ruleFollowers(r).length >= half);
    if (!cands.length) return;
    const r = pick(cands);
    const fol = G.ruleFollowers(r).sort((a, b) => b.affection - a.affection);
    const lead = fol.find((c) => c.id === d.reqPriority) || fol[0];
    const cosign = fol.filter((c) => c.id !== lead.id).slice(0, 4).map((c) => c.name);
    const body = r.requestText ? `{name} dâng tấu xin bệ hạ ban ${r.name}.\n> ${r.requestText}` : tpl(G.D1_TEXT.ruleRequest, { rule: r.name });
    const ev = {
      id: "sys.xin_ban_le",
      title: "Tấu xin ban lệ",
      text: body + (r.desc ? `\n${r.name}: ${r.desc}` : "") + (cosign.length ? "\n" + tpl(G.D1_TEXT.ruleCosign, { cosign: cosign.join(", ") }) : ""),
      choices: [
        { label: `Chuẩn tấu, ban ${r.name}`, effects: { affection: 8 }, _rule: r.id },
        { label: "Không chuẩn", effects: { affection: -2 } },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._rule || G.ruleEnabled(ch._rule)) return;
        if (G.toggleRule(ch._rule)) {
          G.state.ruleLead = G.state.ruleLead || {};
          G.state.ruleLead[ch._rule] = lead.id;
          notes.push(`Ban ${r.name}`);
        }
      },
    };
    d.reqTurn = s.turn;
    if (d.reqPriority === lead.id) d.reqPriority = null;
    report.sideEvents.push(G.prepareEvent(ev, { speaker: lead }));
  });

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
