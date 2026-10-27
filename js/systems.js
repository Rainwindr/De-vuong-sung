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
    if (Math.round(c.favor) >= need && Math.round(c.affection) >= need) {
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
    if (G.pushFx) G.pushFx({ type: "fireworks", id: win.id, text: `${win.name} đoạt giải nhất` });
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
    const cost = G.regionCost ? G.regionCost(r) : r.cost;
    if (s.stats.quocKho < cost && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ cho chuyến tuần du." };
    G.addStat("quocKho", -cost);
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
    bangTop: ["Kính Sự phòng vừa xướng danh, {name} đứng đầu bảng {bang}, nàng khẽ cúi đầu, môi đỏ hé cười dâm đãng.\n> Thần thiếp cảm tạ bệ hạ, lồn thiếp ướt nhẹp vì được {hang} này.", "{name} nghe tên mình vang lên đệ nhất trên {bang}, tay nàng khẽ vuốt ngực căng, ánh mắt long lanh.\n> Bệ hạ… thiếp xin dâng cả thân xác này để bệ hạ đụ cho đã.", "Trước bàn Kính Sự, {name} nhận tin đứng đầu {bang}, nàng nhún người, váy lụa tuột lộ đùi trắng.\n> Lý công công, hãy tâu với bệ hạ, thần thiếp sẵn sàng để bệ hạ chơi suốt đêm.", "{name} đứng nhất bảng {bang}, nàng cười khẽ, ngón tay chạm nhẹ vào chỗ kín dưới váy.\n> Thần thiếp vui mừng quá, cái lồn này chỉ muốn bị bệ hạ đụ đến chảy nước.", "Khi bảng {bang} được dâng, {name} đứng đệ nhất, nàng quay người, mông cong đưa về phía cửa.\n> Bệ hạ mau đến đi, thiếp muốn bị đụ đến mông đỏ cả lên.", "{name} được xướng đệ nhất {bang}, nàng ngồi xuống, váy xòe lộ chỗ ướt át giữa hai chân.\n> Lý công công, tâu với bệ hạ rằng thần thiếp đã sẵn sàng cho bệ hạ chơi."],
    bangBottom: {"sung_phi": "{name} ngồi buồn trong cung, sai cung nữ bưng khay trà đến trước cửa mời bệ hạ ghé.\n> Bệ hạ… thiếp nhớ cái cặc của bệ hạ quá, xin bệ hạ ghé đụ thiếp một chút.", "tri_ky": "{name} lặng lẽ để một phong thư nhỏ trên án thư, nét chữ run run viết những lời nhớ nhung.\n> Bệ hạ, thiếp chỉ muốn được bệ hạ đụ cho thật nhiều, như những lần trước.", "bi_lang_quen": "Đêm nay {name} tự bước đến trước cửa Dưỡng Tâm điện, áo mỏng ướt sương, mắt long lanh.\n> Bệ hạ… thiếp đã chờ lâu quá, xin bệ hạ cho thiếp vào để được đụ.", "tai_nghe": "{name} cúi đầu thấp, xin được vào học phường vì kém nhất về cầm kỳ thi họa.\n> Thần thiếp xin được học, để sau này có thể phục vụ bệ hạ bằng cả thân xác.", "hoa_nha": "{name} ngồi một mình trong góc vườn, các tỷ muội chẳng ai đến chơi cùng.\n> Thiếp chỉ muốn được bệ hạ chơi một mình thôi, dù không ai để ý đến thiếp."},
    choiceIntro: ["{name} khẽ kéo tay áo bệ hạ, má đỏ hồng, mắt liếc nhìn rồi thì thầm.\n> Bệ hạ… đêm nay thiếp muốn được chơi theo kiểu \"{fetish}\" được không?", "{name} ngồi sát lại, váy lụa trễ nải, tay khẽ vuốt đùi mình rồi cười tinh nghịch.\n> Thiếp muốn đêm nay bệ hạ đụ thiếp theo kiểu \"{fetish}\", được chứ?", "{name} cúi đầu thấp, giọng run nhẹ, ngón tay siết chặt vạt áo.\n> Thần thiếp xin bệ hạ… cho thiếp được hầu theo \"{fetish}\" đêm nay.", "{name} bước đến gần, môi hé cười dâm, tay chỉ nhẹ vào chỗ kín dưới váy.\n> Bệ hạ chọn \"{fetish}\" đi, thiếp muốn bị đụ đúng kiểu đó.", "{name} ngồi lên đùi bệ hạ, mông cọ nhẹ, thì thầm vào tai.\n> Đêm nay thiếp muốn \"{fetish}\"… bệ hạ đụ thiếp theo đó nhé.", "{name} ngẩng mặt, mắt long lanh, giọng vừa ngượng vừa dám.\n> Thần thiếp tự chọn \"{fetish}\", xin bệ hạ chiều cho.", "{name} kéo bệ hạ lại gần giường, váy tuột lộ đùi trắng, cười khẽ.\n> Bệ hạ… thiếp muốn chơi \"{fetish}\" tối nay, được không?", "{name} quỳ xuống, tay đặt lên đùi bệ hạ, giọng nũng nịu.\n> Thiếp xin được hầu theo kiểu \"{fetish}\", bệ hạ đụ thiếp đi."],
    ruleRequest: "{name} quỳ xuống dâng tấu, giọng khẽ nũng nịu.\n> Bệ hạ, thần thiếp xin ban lệ {rule}, các tỷ muội đều tự nguyện theo.",
    ruleCosign: "Cùng ký tấu: {cosign}.",
    queIntro: "Đầu xuân, Khâm thiên giám dâng quẻ cho năm mới: quẻ {que}.",
    que: Object.assign({"dao_hoa": "Sao Đào Hoa đỏ rực, hoa đào nở đầy cung. Tình duyên vượng, các phi đêm đêm tự tìm đến, lồn ướt nhẹp chờ bệ hạ đụ.", "tu_ton": "Tử Tôn tinh sáng, đất trời thuận. Dễ có tin vui, các phi dễ mang thai, lồn đầy tinh chờ sinh.", "song_hy": "Song Hỷ song song, mây lành vần. Dễ sinh đôi, một lần đụ ra hai đứa, phúc lộc đôi phần.", "phong_thu": "Phong Thu khí vượng, ngũ cốc xanh. Được mùa, thuế nhiều, quốc khố đầy như lồn phi đầy tinh.", "han_han": "Hạn Hán nóng khô, sao hạn chiếu. Mất mùa, lòng dân dao động, nên tiết kiệm, đừng đụ lung tung.", "van_xuong": "Văn Xương tinh chiếu, thư hương lan. Học gì cũng mau thành, cầm kỳ thi họa giỏi, biết rên đúng lúc.", "phong_nguyet": "Phong Nguyệt khí thịnh, trăng tròn. Lệ cung giữ nghiêm, chuyện đụ nhau nhiều, đêm đêm rên to.", "binh_an": "Bình An khí hòa, trời trong. Không điềm lạ, chư hầu gửi lễ, bốn phương yên, đụ thoải mái."}, { tuyen_tu: "Tuyển Tú tinh sáng, hoa đẹp đua nở. Tú nữ đổ về, tuyển rẻ, người đẹp nhiều, lồn chờ đụ." }),
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
  /* ĐỢT 2 + 3 (0.5.0): Tâm nguyện · Lịch lễ · Hành cung · Sắc phong ·   */
  /*                    Phe phái · Tin đồn · Hòa thân                     */
  /* ================================================================== */
  /*
   * Câu chữ nháp nằm trong G.D2_TEXT để thay bằng bản Grok viết.
   * Biến: {name} người chính, {name2} người thứ hai, {rank} phẩm, {gift} tên quà, {fetish} tên sở thích,
   * {region} tên nước/vùng, {cost} số lượng.
   */
  G.D2_TEXT = {
    wish: {
      len_pham: "Muốn được thăng phẩm",
      co_con: "Muốn có con với bệ hạ",
      hoc_nghe: "Muốn học thành một môn ở học phường",
      di_cung: "Muốn được đi cùng bệ hạ một chuyến (hành cung hoặc lễ Thất tịch)",
      mon_qua: "Muốn được tặng {gift}",
      duoc_trieu: "Muốn được triệu ba đêm",
      thu_so_thich: "Muốn được thử \"{fetish}\" cùng bệ hạ",
    },
    wishDone: {
      len_pham: "{name} mặc bộ áo phẩm mới, đứng trước gương mãi không thôi.\n> Thiếp cứ tưởng phải đợi lâu lắm. Bệ hạ cho thiếp được đứng gần người hơn rồi.",
      co_con: "{name} đặt tay bệ hạ lên bụng mình, mắt rưng rưng.\n> Thiếp ước điều này từ lâu. Đứa bé này là của chúng ta.",
      hoc_nghe: "{name} ôm bằng khen của học phường chạy đến, quên cả lễ nghi.\n> Bệ hạ xem này! Thiếp học thành rồi, đêm nay thiếp trình cho người xem.",
      di_cung: "Trên đường về, {name} tựa vai bệ hạ trong kiệu.\n> Chuyến này thiếp sẽ nhớ mãi. Cảm ơn bệ hạ đã chọn thiếp.",
      mon_qua: "{name} cầm món quà trên tay, cười tươi như hoa.\n> Sao bệ hạ biết thiếp mong món này? Thiếp chưa từng nói với ai.",
      duoc_trieu: "Đêm thứ ba liền, {name} vẫn còn đỏ mặt khi thấy thẻ tên mình được lật.\n> Thiếp chỉ ước được gần bệ hạ thôi, mà bệ hạ cho thiếp nhiều thế này.",
      thu_so_thich: "Sáng hôm sau, {name} còn ngượng ngùng kéo chăn lên tận mũi.\n> Thiếp nghĩ mãi mới dám nói ra… may mà bệ hạ chiều thiếp.",
    },
    hoaTrieu: "Ngày Hoa triêu, sinh nhật trăm hoa. Ngự hoa viên mở cửa, các phi cài hoa đợi bệ hạ dạo vườn.\n> Bệ hạ cài hoa cho ai, năm ấy người đó gặp may.",
    doanNgoWin: "Cung của {name} thắng đua thuyền rồng.",
    hanhCung: {
      he: { name: "Tiểu thử sơn trang", desc: "Nghỉ mát trên núi tháng 6. Mỗi phi đi cùng +6 Tình cảm." },
      dong: { name: "Suối nước nóng", desc: "Tránh rét bên suối nước nóng tháng 11. Mỗi phi đi cùng +6 Sủng ái." },
    },
    sacPhong: "Lễ bộ dâng tấu xin sắc phong {name} lên phẩm {rank}. Đại lễ hao {cost} ngân khố, các phi tần rục rịch chuẩn bị lễ phục.\n> Thần thiếp {name} vui mừng được lên {rank}, cái lồn thiếp đã ướt át chờ được bệ hạ địt cho sướng.",
    lapHau: "Hôm nay cử hành đại lễ lập {name} làm Hoàng hậu. Lễ bộ trình {cost} ngân sách cho nghi thức long trọng bậc nhất.\n> Thần thiếp {name} xin quỳ nhận sắc chỉ, nguyện dùng miệng bú cặc và cái lồn hầu hạ bệ hạ suốt đời.",
    phe: [{"text": "Trong yến tiệc đêm Trung thu, chỗ ngồi bên trái bệ hạ còn trống. {name} và {name2} cùng bước tới, {name} khẽ nói: Bệ hạ, thần thiếp xin được ngồi cạnh người, đã chuẩn bị sẵn bánh hoa quế theo khẩu vị của bệ hạ. {name2} liền đáp: Bệ hạ, chỗ này thần thiếp đã được ban từ sớm, xin người phân xử công bằng."}, {"text": "Sau buổi chầu, {name} và {name2} cùng mời bệ hạ về cung. {name} nhẹ nhàng: Bệ hạ, cung của thần thiếp vừa nấu trà Long Tỉnh mới, xin người ghé qua nghỉ chân. {name2} mỉm cười: Bệ hạ, thần thiếp đã soạn sẵn bàn cờ và đèn dầu, mong được hầu người một canh giờ."}, {"text": "Lụa tơ tằm mới từ cung dệt vừa về, chỉ đủ may hai bộ. {name} và {name2} cùng xin. {name} thưa: Bệ hạ, thần thiếp muốn may áo cho người mặc trong lễ tế, xin người ban cho. {name2} nói: Bệ hạ, lụa này hợp màu cung của thần thiếp, xin người phân cho công bằng."}, {"text": "Phường học mở thêm suất học thư pháp cho phi tần. {name} và {name2} tranh suất cuối. {name} nói: Bệ hạ, thần thiếp muốn học để viết thư cho người, xin ban suất này. {name2} thưa: Bệ hạ, thần thiếp đã luyện lâu, xin người cho cơ hội hoàn thiện."}, {"text": "Trong buổi lễ dâng hương, vị trí đứng gần bệ hạ chỉ còn một. {name} và {name2} cùng xin. {name} khẽ: Bệ hạ, thần thiếp xin đứng cạnh để hầu người thắp hương. {name2} đáp: Bệ hạ, thần thiếp đã chuẩn bị trầm hương thơm, xin được hầu gần."}, {"text": "Vườn ngự nở mẫu đơn hiếm, chỉ đủ cắt một cành. {name} và {name2} cùng xin. {name} nói: Bệ hạ, thần thiếp muốn cắm trong cung để người ngắm khi ghé thăm. {name2} thưa: Bệ hạ, thần thiếp đã chăm hoa từ sớm, xin người ban cành này."}, {"text": "Buổi tối nghe nhạc, quyền chọn nhạc công còn trống. {name} và {name2} tranh. {name} nói: Bệ hạ, thần thiếp muốn mời đội đàn tranh, hợp tai người. {name2} mỉm cười: Bệ hạ, thần thiếp đã chọn sẵn bài ca mới, xin được trình diễn."}, {"text": "Khi đi dạo thuyền trên hồ, chỗ ngồi đối diện bệ hạ chỉ một. {name} và {name2} cùng xin. {name} thưa: Bệ hạ, thần thiếp xin ngồi đối diện để hầu trà. {name2} nói: Bệ hạ, thần thiếp mang theo bánh ngọt, xin được hầu người trên thuyền."}],
    pheMerge: "Phe của {name2} thế lực yếu dần, {name2} xin bệ hạ cho phép hợp vào phe của {name} để được che chở và cùng hầu người.",
    rumors: [{"intro": "Trong hậu cung đồn rằng {name} thường tự sướng trong phòng khi đêm khuya, {name2} là người kể đầu tiên sau khi tình cờ nghe tiếng từ cửa sổ.", "yes": "Điều tra cho thấy {name} quả thật có thói quen tự sướng mỗi đêm, thói quen này kéo dài đã nhiều tháng.", "no": "Điều tra xác nhận {name} bị oan, tiếng động chỉ là gió thổi rèm cửa, {name} không hề làm chuyện ấy."}, {"intro": "Tin đồn lan ra rằng {name} thường lén lút đụ phi tần khác trong hậu cung, {name2} kể lại sau khi thấy hai người ra vào cùng lúc.", "yes": "Kết quả điều tra cho thấy {name} thật sự có quan hệ thân mật với một phi tần khác, chuyện xảy ra nhiều lần.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ cùng trò chuyện và uống trà, không có chuyện đụ nhau."}, {"intro": "Cung nhân đồn {name} hay thủ dâm bằng đồ chơi trong tủ, {name2} là người phát hiện và kể lại đầu tiên.", "yes": "Điều tra xác nhận {name} có giữ đồ chơi và thường dùng để tự sướng khi ở một mình.", "no": "Điều tra cho thấy {name} bị oan, đồ trong tủ chỉ là đồ trang sức và khăn thêu, không có chuyện thủ dâm."}, {"intro": "Có tin {name} thường nằm chung giường với phi tần khác và đụ nhau ban đêm, {name2} kể sau khi thấy chăn gối lộn xộn.", "yes": "Điều tra cho thấy {name} thật sự thường nằm chung và có quan hệ xác thịt với phi tần kia nhiều đêm.", "no": "Điều tra xác nhận {name} bị oan, hai người chỉ ngủ chung vì lạnh và không có chuyện đụ."}, {"intro": "Đồn rằng {name} hay tự sướng khi tắm, tiếng nước và tiếng thở bị {name2} nghe thấy và kể ra.", "yes": "Kết quả cho thấy {name} quả thật có thói quen tự sướng trong lúc tắm, chuyện xảy ra thường xuyên.", "no": "Điều tra cho thấy {name} bị oan, tiếng động chỉ do nước chảy và {name} chỉ tắm bình thường."}, {"intro": "Tin lan truyền {name} lén đụ một phi tần trong vườn hoa đêm khuya, {name2} là người nhìn thấy bóng người và kể đầu tiên.", "yes": "Điều tra xác nhận {name} thật sự có quan hệ với phi tần đó trong vườn nhiều lần.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ đi dạo và trò chuyện, không có chuyện đụ."}, {"intro": "Cung nhân nói {name} thường dùng ngón tay tự sướng khi nằm một mình, {name2} kể lại sau khi tình cờ thấy từ khe cửa.", "yes": "Điều tra cho thấy {name} quả thật có thói quen dùng tay tự sướng mỗi tối trước khi ngủ.", "no": "Điều tra xác nhận {name} bị oan, {name} chỉ đang thoa dầu dưỡng da và không làm chuyện ấy."}, {"intro": "Đồn rằng {name} hay nằm chung với hai phi tần khác và đụ nhau luân phiên, {name2} là người kể sau khi nghe tiếng từ phòng.", "yes": "Kết quả điều tra cho thấy {name} thật sự có quan hệ xác thịt với hai phi tần kia nhiều đêm.", "no": "Điều tra cho thấy {name} bị oan, ba người chỉ ngồi chơi bài và nói chuyện, không có chuyện đụ."}, {"intro": "Tin đồn {name} tự sướng bằng gối trong phòng, {name2} nhìn thấy gối ướt và kể ra đầu tiên.", "yes": "Điều tra xác nhận {name} có thói quen dùng gối để tự sướng khi ở một mình.", "no": "Điều tra cho thấy {name} bị oan, gối ướt chỉ do đổ nước trà, {name} không làm chuyện ấy."}, {"intro": "Cung nhân đồn {name} thường đụ phi tần khác trong nhà tắm khi không có ai, {name2} kể lại sau khi thấy hai người ra cùng lúc.", "yes": "Điều tra cho thấy {name} thật sự có quan hệ với phi tần đó trong nhà tắm nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, hai người chỉ tắm riêng và tình cờ ra cùng lúc, không có chuyện đụ."}, {"intro": "Cung nhân đồn {name} thường nuốt hết nước dâm của phi tần khác đến không còn một giọt, {name2} thấy miệng ướt nhẹp và kể đầu tiên.", "yes": "Điều tra cho thấy {name} quả thật thường bú đến cùng và nuốt sạch nước của phi tần kia nhiều đêm.", "no": "Điều tra xác nhận {name} bị oan, miệng ướt chỉ do uống trà, không có chuyện nuốt nước dâm."}, {"intro": "Tin lan ra {name} hay ngồi lên mặt phi tần khác rồi vừa xoa vừa bắt liếm đến sưng mép, {name2} nghe tiếng rên và kể.", "yes": "Kết quả điều tra cho thấy {name} thật sự thường cưỡi mặt phi tần kia đến chảy nước đầy miệng.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ ngồi chơi cờ, không có chuyện cưỡi mặt."}, {"intro": "Đồn rằng {name} thường móc lưỡi sâu vào lồn phi tần khác rồi liếm đến sưng tấy, {name2} thấy dấu đỏ và kể ra.", "yes": "Điều tra xác nhận {name} có thói quen dùng lưỡi đâm sâu và liếm lồn phi tần kia đến ướt át.", "no": "Điều tra cho thấy {name} bị oan, dấu đỏ chỉ do thoa dầu, {name} không làm chuyện ấy."}, {"intro": "Cung nhân nói {name} hay bắt phi tần khác mút ngón chân rồi nhổ nước bọt lên đùi, {name2} nhìn thấy và kể đầu tiên.", "yes": "Điều tra cho thấy {name} quả thật thường bắt phi tần kia mút chân và nhổ nước bọt lên người nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, hai người chỉ massage chân bình thường, không có chuyện mút và nhổ."}, {"intro": "Tin đồn {name} thường nằm xem phi tần khác tự sướng rồi bắt họ liếm tay mình, {name2} thấy từ khe cửa và kể.", "yes": "Kết quả cho thấy {name} thật sự ngồi xem và bắt phi tần kia liếm tay đầy nước dâm nhiều đêm.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ cùng đọc sách, không có chuyện xem và liếm."}, {"intro": "Đồn rằng {name} hay dùng lưỡi liếm háng và hậu môn phi tần khác đến chảy nước miếng, {name2} nghe tiếng và kể ra.", "yes": "Điều tra xác nhận {name} thường liếm từ lồn xuống lỗ đít phi tần kia đến ướt nhẹp.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ thoa dầu dưỡng, không có chuyện liếm háng."}, {"intro": "Cung nhân đồn {name} thường bắt hai phi tần cùng mút vú mình rồi nhổ nước vào miệng nhau, {name2} kể sau khi thấy.", "yes": "Điều tra cho thấy {name} quả thật bắt hai phi tần mút vú và chơi nước bọt với nhau nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, ba người chỉ ngồi may vá, không có chuyện mút vú."}, {"intro": "Đồn rằng {name} thường móc hai ngón vào miệng phi tần khác rồi bắt họ mút đến chảy dãi, {name2} thấy và kể.", "yes": "Điều tra xác nhận {name} có thói quen đút ngón vào miệng phi tần kia bắt mút đến ướt át.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ đùa giỡn bình thường, không có chuyện đút ngón."}, {"intro": "Cung nhân nói {name} hay liếm sạch nước dâm trên đùi phi tần khác rồi nhổ lại vào lồn, {name2} nhìn thấy dấu và kể ra.", "yes": "Điều tra cho thấy {name} quả thật thường liếm sạch rồi nhổ nước bọt vào lồn phi tần kia nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, dấu ướt chỉ do đổ nước, {name} không làm chuyện ấy."}, {"intro": "Tin lan truyền {name} hay nằm dưới để phi tần khác phun nước dâm vào miệng rồi nuốt, {name2} nghe tiếng và kể đầu tiên.", "yes": "Kết quả điều tra cho thấy {name} thật sự để phi tần kia phun nước dâm vào miệng và nuốt nhiều đêm.", "no": "Điều tra cho thấy {name} bị oan, tiếng nước chỉ do đổ trà, {name} không làm chuyện ấy."}],
    rumorAct: "Xử ngay theo tin: {name} bị quở trách, cắt bổng một tháng.",
    rumorFalse: "{name} bị oan, nàng khóc cả đêm. {name2} lại được tiếng là người thẳng thắn.",
    rumorIgnoreTrue: "Bệ hạ bỏ qua, nhưng chuyện cứ âm ỉ trong hậu cung.",
    rumorIgnoreFalse: "Bệ hạ bỏ qua. Vài hôm sau tin đồn tự tắt.",
    hoaThan: "Sứ thần nước {region} kính dâng {n} cuộn tranh niêm phong, mỗi cuộn là chân dung công chúa do chính nàng vẽ hoặc đồng ý cho vẽ, tự tay gửi sang. Các nàng đều tự nguyện hòa thân, chỉ bệ hạ được mở xem.\nTranh còn giữ nguyên dấu sáp, chưa ai dám phá.",
    hoaThanCond: {
      thue: "Điều kiện của sứ: giảm thuế buôn bán với {region} trong hai năm (Quốc khố −100 mỗi tháng).",
      cung: "Điều kiện của sứ: xây cho nàng một cung riêng theo kiểu quê nhà (Quốc khố −1000, cung nàng lên một bậc).",
    },
  };

  const d2 = (s) => {
    s = s || G.state;
    if (!s.d2) s.d2 = {};
    const d = s.d2;
    const init = { wishes: {}, went: {}, usedWith: {}, hanhCung: {}, sacQueue: [], sacAsked: {}, phe: { leaders: [], members: {}, strength: {} }, queenLeader: null, sulkUntil: -1, sulkLeader: null, pheTurn: -99, rumorTurn: -99, rumorPending: null, hoaThanYear: 0, taxCutUntil: -1, travelPenalty: {}, princessUsed: [], festivalDone: {} };
    for (const [k, v] of Object.entries(init)) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d2 = d2;
  const sideRoom = (report) => report.sideEvents.length < G.SIDE_MAX;
  const fillVars = (t, vars) => String(t).replace(/\{(gift|fetish|region|cost|n|rank)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

  /* Cảnh cho các HOOK mới: chưa có chữ thì mượn cảnh thị tẩm của người chính. */
  G.D2_HOOKS = {
    "canh-viet.tam_nguyen_len_pham": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_co_con": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_hoc_nghe": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_di_cung": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_mon_qua": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_duoc_trieu": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_thu_so_thich": "Tâm nguyện thành",
    "canh-viet.le_hoa_trieu": "Hoa triêu",
    "canh-viet.le_doan_ngo": "Đêm Đoan ngọ",
    "canh-viet.hanh_cung_he": "Tiểu thử sơn trang",
    "canh-viet.hanh_cung_dong": "Suối nước nóng",
    "canh-viet.sac_phong_phi": "Đêm sắc phong",
    "canh-viet.sac_phong_quy_phi": "Đêm sắc phong",
    "canh-viet.sac_phong_hoang_quy_phi": "Đêm sắc phong",
    "canh-viet.sac_phong_hoang_hau": "Đêm lập hậu",
  };
  for (const [hid, title] of Object.entries(G.D2_HOOKS))
    G.hooks.register(
      hid,
      (ctx) => {
        const h = G.hooks.resolve("core.thi_tam");
        const sc = h ? h.fn(ctx) : null;
        if (!sc) return null;
        const names = ctx.participants.map((p) => p.name).join(", ");
        return Object.assign({}, sc, { title: `${title} · ${names}` });
      },
      "dot-2"
    );

  /* Ghi nhận sở thích đã dùng với từng phi (cho tâm nguyện "thử sở thích") */
  const runHookD2 = G.runHook;
  G.runHook = function (id, ctxIn) {
    const scene = runHookD2(id, ctxIn);
    if (scene && !scene.blocked && G.state) {
      const d = d2();
      for (const p of ctxIn.participants || []) {
        if (!p || p.isChild) continue;
        const u = (d.usedWith[p.id] = d.usedWith[p.id] || {});
        for (const f of ctxIn.fetish || []) u[f] = G.state.turn;
      }
    }
    return scene;
  };

  /* ---------------- 4 · Tâm nguyện ---------------- */
  const tinhThong = (c) => c.traits.filter((t) => t.startsWith("Tinh thông")).length;
  G.WISH_MONTHS = 12;
  G.WISH_AFFECTION = 15;
  G.WISHES = {
    len_pham: { ok: (c) => c.rank < 6, base: (c) => ({ rank: c.rank }), done: (c, w) => c.rank > w.base.rank },
    co_con: { ok: (c) => c.pregnantDue == null, base: (c) => ({ kids: c.kids }), done: (c, w) => c.pregnantDue != null || c.kids > w.base.kids },
    hoc_nghe: { ok: () => true, base: (c) => ({ t: tinhThong(c) }), done: (c, w) => tinhThong(c) > w.base.t },
    di_cung: { ok: () => true, base: () => ({}), done: (c, w) => (d2().went[c.id] || -1) >= w.since },
    mon_qua: {
      ok: () => Object.keys(R.gifts).length > 0,
      target: (c) => {
        const liked = Object.values(R.gifts).filter((g) => (g.likes || []).some((l) => c.likes.includes(l) || c.traits.includes(l) || l === c.id));
        return pick(liked.length ? liked : Object.values(R.gifts)).id;
      },
      base: (c, t) => ({ n: c.gifts[t] || 0 }),
      done: (c, w) => (c.gifts[w.target] || 0) > w.base.n,
    },
    duoc_trieu: { ok: () => true, base: (c) => ({ n: c.nights }), done: (c, w) => c.nights >= w.base.n + 3 },
    thu_so_thich: {
      ok: (c) => !!wishFetish(c),
      target: (c) => wishFetish(c),
      base: () => ({}),
      done: (c, w) => ((d2().usedWith[c.id] || {})[w.target] || -1) >= w.since,
    },
  };
  function wishFetish(c) {
    const used = d2().usedWith[c.id] || {};
    const list = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f) && G.consentOf(c, f) === "willing" && used[f] == null);
    return list.length ? pick(list) : null;
  }
  // phi cốt truyện có tâm nguyện đầu tiên theo truyện của nàng
  G.WISH_STORY = {
    "core.uyen_nghi": "len_pham",
    "core.moc_can": "duoc_trieu",
    "core.tuyet": "di_cung",
    "core.nhu_yen": "len_pham",
    "core.tu_lan": "thu_so_thich",
    "core.mi_nuong": "mon_qua",
    "core.thanh_ca": "hoc_nghe",
    "core.song_nguyet": "di_cung",
    "core.song_nhat": "thu_so_thich",
    "core.hong_tieu": "co_con",
  };
  const WISH_BY_TRAIT = { "Kiêu kỳ": "len_pham", "Thích chưng diện": "mon_qua", "Phúc tướng": "co_con", "Giọng hát ngọt": "hoc_nghe", "Biết múa": "hoc_nghe", "Lãng mạn": "di_cung", "Táo bạo": "thu_so_thich", "Si tình": "duoc_trieu", "Ôn nhu": "co_con" };
  function newWish(c, first) {
    const s = G.state;
    const d = d2();
    let type = first && G.WISH_STORY[c.id];
    if (!type || !G.WISHES[type].ok(c)) {
      const byTrait = c.traits.map((t) => WISH_BY_TRAIT[t]).filter((t) => t && G.WISHES[t].ok(c));
      const all = Object.keys(G.WISHES).filter((t) => G.WISHES[t].ok(c));
      type = byTrait.length && rand() < 0.6 ? pick(byTrait) : pick(all);
    }
    const W = G.WISHES[type];
    const target = W.target ? W.target(c) : null;
    d.wishes[c.id] = { type, target, since: s.turn, due: s.turn + G.WISH_MONTHS, base: W.base(c, target) };
  }
  G.wishText = function (c) {
    const s = G.state;
    const w = s && s.d2 && s.d2.wishes[c.id];
    if (!w) return null;
    const t = fillVars(G.D2_TEXT.wish[w.type] || w.type, { gift: w.target && R.gifts[w.target] ? R.gifts[w.target].name : "", fetish: w.target && R.fetishes[w.target] ? R.fetishes[w.target].name : "" });
    return { text: t, left: Math.max(0, w.due - s.turn) };
  };
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    for (const c of s.consorts) {
      const w = d.wishes[c.id];
      if (!w) {
        newWish(c, !d.wishes["_done_" + c.id]);
        continue;
      }
      const W = G.WISHES[w.type];
      let done = false;
      try {
        done = W && W.done(c, w);
      } catch (e) {}
      if (done) {
        c.affection = clamp(c.affection + G.WISH_AFFECTION, 0, 100);
        d.wishes["_done_" + c.id] = (d.wishes["_done_" + c.id] || 0) + 1;
        log(`${c.name} toại tâm nguyện: ${G.wishText(c).text.toLowerCase()}.`, "harem");
        const type = w.type;
        newWish(c, false);
        if (sideRoom(report)) {
          const ev = {
            id: "sys.tam_nguyen",
            title: "Tâm nguyện thành",
            text: G.D2_TEXT.wishDone[type] || "{name} vui mừng khôn xiết.",
            choices: [
              { label: "Ở lại với nàng đêm nay", hook: "canh-viet.tam_nguyen_" + type },
              { label: "Mừng cho nàng", effects: { favor: 2 } },
            ],
          };
          const p = G.prepareEvent(ev, { speaker: c });
          if (p.choices.length) report.sideEvents.push(p);
        }
        notesTam(c);
      } else if (s.turn >= w.due) {
        newWish(c, false); // quá hạn: bốc tâm nguyện mới, không phạt
      }
    }
    for (const id of Object.keys(d.wishes)) if (!id.startsWith("_done_") && !s.consorts.find((c) => c.id === id)) delete d.wishes[id];
  });
  function notesTam(c) {
    G.addAlbum("Tâm nguyện", `${c.name} toại một tâm nguyện.`);
  }

  /* ---------------- 7 · Lịch lễ ---------------- */
  G.FESTIVALS = [
    { id: "core.tet", month: 1 },
    { id: "core.nguyen_tieu", month: 1 },
    { id: "sys.hoa_trieu", month: 2 },
    { id: "core.doan_ngo", month: 5 },
    { id: "core.that_tich", month: 7 },
    { id: "core.trung_thu", month: 8 },
    { id: "core.dong_chi", month: 11 },
  ];
  G.isFestivalMonth = () => !!G.state && G.FESTIVALS.some((f) => f.month === G.state.month);
  const festivalIds = new Set(G.FESTIVALS.map((f) => f.id));
  const eligibleD2 = G.eligibleEvents;
  G.eligibleEvents = function () {
    return eligibleD2().filter((p) => !festivalIds.has(p.ev.id)); // lễ được bảo đảm nổ riêng, không bốc ngẫu nhiên nữa
  };
  // tháng lễ: cảnh cung quy dễ nổ gấp đôi
  const queMultD2 = G.queMult;
  G.queMult = function (k) {
    let m = queMultD2(k);
    if (k === "rule" && G.isFestivalMonth()) m *= 2;
    return m;
  };
  function hoaTrieuEvent(s) {
    const top = [...s.consorts].filter((c) => c.pregnantDue == null).sort((a, b) => b.favor - a.favor).slice(0, 3);
    if (!top.length) return null;
    const ev = {
      id: "sys.hoa_trieu",
      title: "Hoa triêu",
      text: G.D2_TEXT.hoaTrieu,
      choices: top
        .map((c) => ({ label: `Cài hoa cho ${c.name}`, hook: "canh-viet.le_hoa_trieu", participants: [c.id], effects: { favorConsort: { [c.id]: 5 } }, _aff: c.id }))
        .concat([{ label: "Dạo vườn cùng cả hậu cung", effects: { hoaKhi: 3, favorAll: 1 } }]),
      onChoose: (ch, sp, notes) => {
        const c = ch._aff && G.findConsort(ch._aff);
        if (c) {
          c.affection = clamp(c.affection + 8, 0, 100);
          notes.push(`Tình cảm ${c.name} +8`);
        }
      },
    };
    return G.prepareEvent(ev, { speaker: null });
  }
  function festivalBonus(ev) {
    if (ev._d2Bonus) return;
    ev._d2Bonus = true;
    const prev = ev.onChoose;
    ev.onChoose = function (ch, sp, notes) {
      if (prev) prev(ch, sp, notes);
      const s = G.state;
      if (ev.id === "core.doan_ngo" && s.consorts.length) {
        const total = s.consorts.reduce((t, c) => t + c.favor + 10, 0);
        let r = rand() * total;
        let win = s.consorts[0];
        for (const c of s.consorts) {
          r -= c.favor + 10;
          if (r <= 0) {
            win = c;
            break;
          }
        }
        G.changeFavor(win, 5);
        G.addStat("danTam", 2);
        notes.push(G.D2_TEXT.doanNgoWin.replace("{name}", win.name), `Sủng ái ${win.name} +5`, "Dân tâm +2");
      }
      if (ev.id === "core.that_tich" && ch.hook) for (const c of G.participantsFor(ch, sp)) d2().went[c.id] = s.turn;
      if (ev.id === "core.trung_thu") {
        const kheo = s.consorts.filter((c) => c.traits.includes("Khéo tay"));
        for (const c of kheo) G.changeFavor(c, 3);
        if (kheo.length) notes.push(`Bánh của ${kheo.map((c) => c.name).join(", ")} được khen: Sủng ái +3`);
      }
    };
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    for (const f of G.FESTIVALS) {
      if (f.month !== s.month) continue;
      const key = f.id + ":" + s.year;
      if (d.festivalDone[key]) continue;
      d.festivalDone[key] = true;
      let p = null;
      if (f.id === "sys.hoa_trieu") p = s.consorts.length >= 2 ? hoaTrieuEvent(s) : null;
      else {
        let ev = R.events[f.id];
        if (!ev) continue;
        if (f.id === "core.doan_ngo" && !ev.choices.some((c) => c.hook)) {
          ev = Object.assign({}, ev, { choices: ev.choices.concat([{ label: "Đêm nay ở lại cung thắng cuộc", hook: "canh-viet.le_doan_ngo", participants: { select: "top_favor", count: 1 }, effects: { truyLac: 2 } }]) });
          R.events[f.id] = ev;
        }
        const sp = G.resolveSpeaker(ev);
        if (!sp || !G.checkWhen(ev.when, sp.speaker, ev)) continue;
        festivalBonus(ev);
        p = G.prepareEvent(ev, sp);
      }
      if (p && p.choices.length) report.sideEvents.push(p); // lễ không tính vào giới hạn chuyện phụ
    }
  });

  /* ---------------- 18 · Hành cung theo mùa ---------------- */
  G.HANH_CUNG = {
    he: { month: 6, cost: 600, take: 3, stat: "affection", hook: "canh-viet.hanh_cung_he" },
    dong: { month: 11, cost: 800, take: 3, stat: "favor", hook: "canh-viet.hanh_cung_dong" },
  };
  G.hanhCungNow = function () {
    const s = G.state;
    const id = Object.keys(G.HANH_CUNG).find((k) => G.HANH_CUNG[k].month === s.month);
    if (!id) return null;
    const H = Object.assign({ id }, G.HANH_CUNG[id], G.D2_TEXT.hanhCung[id]);
    const done = d2().hanhCung[id + ":" + s.year];
    let why = null;
    if (done) why = "Năm nay đã ngự giá rồi.";
    else if (s.stats.quocKho < H.cost && !s.godFlags.infiniteMoney) why = `Quốc khố không đủ ${H.cost} lượng.`;
    else if (s.consorts.filter((c) => c.pregnantDue == null).length < 1) why = "Không có phi nào đi được.";
    return Object.assign(H, { why });
  };
  G.goHanhCung = function (ids) {
    const s = G.state;
    const H = G.hanhCungNow();
    if (!H || H.why) return null;
    const list = ids.map((id) => G.findConsort(id)).filter((c) => c && c.pregnantDue == null).slice(0, H.take);
    if (!list.length) return null;
    G.addStat("quocKho", -H.cost);
    const d = d2();
    d.hanhCung[H.id + ":" + s.year] = true;
    const notes = [`Quốc khố −${H.cost}`];
    for (const c of list) {
      if (H.stat === "favor") G.changeFavor(c, 6);
      else c.affection = clamp(c.affection + 6, 0, 100);
      d.went[c.id] = s.turn;
    }
    notes.push(`${list.map((c) => c.name).join(", ")}: ${H.stat === "favor" ? "Sủng ái" : "Tình cảm"} +6`);
    const left = s.consorts.filter((c) => !list.includes(c));
    for (const c of left) c.affection = clamp(c.affection - 2, 0, 100);
    if (left.length) notes.push("Phi ở lại: Tình cảm −2");
    // ba người cùng một phe: các phe khác dỗi
    const fac = list.map((c) => factionOf(c.id));
    if (list.length >= 2 && fac[0] && fac.every((f) => f === fac[0])) {
      for (const c of left) if (factionOf(c.id) && factionOf(c.id) !== fac[0]) c.affection = clamp(c.affection - 2, 0, 100);
      notes.push("Các phe khác dỗi: Tình cảm −2");
    }
    log(`Ngự giá ${H.name} cùng ${list.map((c) => c.name).join(", ")}.`, "milestone");
    G.addAlbum(H.name, `Bệ hạ ngự giá ${H.name} cùng ${list.map((c) => c.name).join(", ")}.`);
    const scene = G.runHook(H.hook, { participants: list, fetish: [], place: H.id });
    if (!scene.blocked) G.spendNight(list, { silentLog: true });
    scene.notes = notes;
    return scene;
  };

  /* ---------------- 28 · Lễ sắc phong ---------------- */
  G.SAC_PHONG_COST = { 4: 300, 5: 600, 6: 1000, 7: 2000 };
  const SAC_HOOK = { 4: "canh-viet.sac_phong_phi", 5: "canh-viet.sac_phong_quy_phi", 6: "canh-viet.sac_phong_hoang_quy_phi", 7: "canh-viet.sac_phong_hoang_hau" };
  let sacBypass = false;
  G.promoteGate = function (c, target) {
    const s = G.state;
    if (sacBypass || !s || target < 4 || target <= c.rank) return target;
    const next = Math.max(4, c.rank + 1);
    const d = d2(s);
    if (!d.sacQueue.some((q) => q.id === c.id)) d.sacQueue.push({ id: c.id, rank: next });
    return Math.max(c.rank, Math.min(target, 3));
  };
  function sacEvent(c, rank) {
    const cost = G.SAC_PHONG_COST[rank];
    const ev = {
      id: "sys.sac_phong",
      title: "Lễ sắc phong · " + G.RANKS[rank],
      text: fillVars(G.D2_TEXT.sacPhong, { rank: G.RANKS[rank], cost }),
      choices: [
        { label: "Cử hành đại lễ", cost, hook: SAC_HOOK[rank], effects: { favor: 5, danTam: 1, hoaKhi: 1 }, _sac: rank },
        { label: "Lễ giản dị", cost: Math.round(cost / 2), hook: SAC_HOOK[rank], effects: { favor: 2 }, _sac: rank },
        { label: "Hoãn lại", effects: {} },
      ],
      onChoose: (ch) => {
        if (!ch._sac) return;
        const live = G.findConsort(c.id);
        if (!live) return;
        sacBypass = true;
        try {
          G.promote(live, ch._sac);
        } finally {
          sacBypass = false;
        }
        const d = d2();
        d.sacQueue = d.sacQueue.filter((q) => q.id !== c.id);
        G.addAlbum("Lễ sắc phong", `${live.name} nhận kim sách, lên ${G.RANKS[live.rank]}.`);
        G.checkPromotion(live); // đủ điều kiện phẩm cao hơn thì xếp lễ tiếp theo
      },
    };
    return G.prepareEvent(ev, { speaker: c });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    d.sacQueue = d.sacQueue.filter((q) => {
      const c = G.findConsort(q.id);
      return c && c.rank < q.rank;
    });
    for (const q of d.sacQueue) {
      if (!sideRoom(report)) break;
      if (d.sacAsked[q.id] != null && s.turn - d.sacAsked[q.id] < 6) continue;
      const c = G.findConsort(q.id);
      d.sacAsked[q.id] = s.turn;
      const p = sacEvent(c, q.rank);
      if (p.choices.length) report.sideEvents.push(p);
    }
  });
  /** Lý do chưa lập được Hoàng hậu, hoặc null. */
  G.crownBlock = function (c) {
    const s = G.state;
    if (s.consorts.some((x) => x.rank === 7)) return "Đã có Hoàng hậu.";
    if (c.favor < 70) return "Cần Sủng ái từ 70.";
    const mine = factionOf(c.id);
    const st = d2().phe.strength;
    const mineSt = mine ? st[mine] || 0 : c.favor;
    const rival = Object.entries(st).find(([lid, v]) => lid !== mine && v > mineSt);
    if (rival) {
      const L = G.findConsort(rival[0]);
      return `Phe ${L ? L.name : ""} đang mạnh hơn, lập hậu lúc này hậu cung không phục.`;
    }
    return null;
  };
  G.crownEvent = function (id) {
    const c = G.findConsort(id);
    if (!c || G.crownBlock(c)) return null;
    const cost = G.SAC_PHONG_COST[7];
    const ev = {
      id: "sys.lap_hau",
      title: "Lễ lập hậu",
      text: fillVars(G.D2_TEXT.lapHau, { cost }),
      choices: [
        { label: "Cử hành lễ lập hậu", cost, hook: SAC_HOOK[7], effects: { danTam: 5 }, _crown: true },
        { label: "Để sau", effects: {} },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._crown) return;
        const live = G.findConsort(c.id);
        if (!live || !G.crownEmpress(live.id)) return;
        const d = d2();
        const lead = factionOf(live.id);
        if (lead) {
          d.queenLeader = lead;
          d.sulkUntil = G.state.turn + 12;
          d.sulkLeader = lead;
          for (const o of G.state.consorts) if (factionOf(o.id) && factionOf(o.id) !== lead) o.affection = clamp(o.affection - 3, 0, 100);
          notes.push("Phe của tân Hoàng hậu mạnh thêm 10%; các phe khác dỗi một năm");
        }
      },
    };
    return G.prepareEvent(ev, { speaker: c });
  };

  /* ---------------- 3 · Phe phái ---------------- */
  G.PHE_MAX = 3;
  G.PHE_MIN_RANK = 3; // Tần trở lên
  G.PHE_MIN_TINHY = 10;
  function factionOf(id) {
    const s = G.state;
    if (!s || !s.d2) return null;
    const p = s.d2.phe;
    if (p.leaders.includes(id)) return id;
    return p.members[id] || null;
  }
  G.factionOf = factionOf;
  function computeFactions(s) {
    const d = d2(s);
    const p = d.phe;
    const ok = (c) => c && c.rank >= G.PHE_MIN_RANK;
    let leaders = p.leaders.filter((id) => ok(G.findConsort(id)));
    const cand = s.consorts.filter((c) => ok(c) && !leaders.includes(c.id)).sort((a, b) => b.favor - a.favor);
    while (leaders.length < G.PHE_MAX && cand.length) leaders.push(cand.shift().id);
    if (leaders.length < 2) leaders = []; // một người thì chưa thành phe
    const members = {};
    for (const c of s.consorts) {
      if (leaders.includes(c.id)) continue;
      let best = null;
      let bv = G.PHE_MIN_TINHY - 0.01;
      for (const l of leaders) {
        const v = G.getTinhY(c.id, l);
        if (v > bv) {
          bv = v;
          best = l;
        }
      }
      if (best) members[c.id] = best;
    }
    const strength = {};
    for (const l of leaders) {
      const L = G.findConsort(l);
      let v = L.favor + s.consorts.filter((c) => members[c.id] === l).reduce((t, c) => t + c.favor, 0);
      if (d.queenLeader === l) v *= 1.1;
      strength[l] = Math.round(v);
    }
    d.phe = { leaders, members, strength };
    return d.phe;
  }
  G.computeFactions = () => computeFactions(G.state);
  G.factionList = function () {
    const s = G.state;
    const p = (s.d2 && s.d2.phe) || { leaders: [] };
    return p.leaders
      .map((l) => ({ leader: G.findConsort(l), members: s.consorts.filter((c) => p.members[c.id] === l), strength: p.strength[l] || 0 }))
      .filter((f) => f.leader)
      .sort((a, b) => b.strength - a.strength);
  };
  const pheMembers = (l) => G.state.consorts.filter((c) => c.id === l || d2().phe.members[c.id] === l);
  function pheEvent(s, imbalanced) {
    const list = G.factionList();
    if (list.length < 2) return null;
    const [A, B] = shuffle(list).slice(0, 2);
    const weak = list[list.length - 1];
    const strong = list[0];
    // phe yếu xin sáp nhập
    if (imbalanced && rand() < 0.35 && weak.leader.id !== strong.leader.id) {
      const ev = {
        id: "sys.phe_sap_nhap",
        title: "Phe yếu xin hợp lại",
        text: G.D2_TEXT.pheMerge,
        choices: [
          { label: "Chấp thuận cho hai phe hợp lại", effects: { hoaKhi: 3 }, _merge: true },
          { label: "Giữ nguyên như cũ", effects: {} },
        ],
        onChoose: (ch, sp, notes) => {
          if (!ch._merge) return;
          for (const c of pheMembers(weak.leader.id)) G.addTinhY(c.id, strong.leader.id, 25);
          const d = d2();
          d.phe.leaders = d.phe.leaders.filter((l) => l !== weak.leader.id);
          computeFactions(G.state);
          notes.push(`Phe ${weak.leader.name} nhập vào phe ${strong.leader.name}`);
        },
      };
      return G.prepareEvent(ev, { speaker: strong.leader, speaker2: weak.leader });
    }
    const T = pick(G.D2_TEXT.phe);
    const ev = {
      id: "sys.phe",
      title: "Chuyện hai phe",
      text: T.text.replace(/\{phe1\}/g, "{name}").replace(/\{phe2\}/g, "{name2}"),
      choices: [
        { label: `Đứng về phía ${A.leader.name}`, _side: [A.leader.id, B.leader.id] },
        { label: `Đứng về phía ${B.leader.name}`, _side: [B.leader.id, A.leader.id] },
        { label: "Phân xử công bằng, ban thưởng cả hai bên", cost: 200, effects: { hoaKhi: 3 } },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._side) return;
        const [win, lose] = ch._side;
        for (const c of pheMembers(win)) G.changeFavor(c, 3);
        for (const c of pheMembers(lose)) c.affection = clamp(c.affection - 2, 0, 100);
        notes.push(`Phe ${G.findConsort(win).name}: Sủng ái +3`, `Phe ${G.findConsort(lose).name}: Tình cảm −2`);
      },
    };
    return G.prepareEvent(ev, { speaker: A.leader, speaker2: B.leader });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    computeFactions(s);
    const list = G.factionList();
    let imbalanced = false;
    if (list.length >= 2 && list[0].strength > 2 * list[list.length - 1].strength) {
      imbalanced = true;
      G.addStat("hoaKhi", -1);
    }
    // dỗi: mỗi 4 tháng Tình cảm −1 (giữ số nguyên để khớp với số hiện trên thanh)
    if (d.sulkUntil >= s.turn && s.turn % 4 === 0) for (const c of s.consorts) if (factionOf(c.id) && factionOf(c.id) !== d.sulkLeader) c.affection = clamp(c.affection - 1, 0, 100);
    for (const c of s.consorts) if (c.affection !== Math.round(c.affection)) c.affection = Math.round(c.affection); // sửa bản lưu đã có số lẻ
    if (list.length < 2 || !sideRoom(report) || s.turn - d.pheTurn < 3) return;
    if (rand() >= 0.25 * (imbalanced ? 1.5 : 1) * (d.sulkUntil >= s.turn ? 1.5 : 1)) return;
    const p = pheEvent(s, imbalanced);
    if (p && p.choices.length) {
      d.pheTurn = s.turn;
      report.sideEvents.push(p);
    }
  });

  /* ---------------- 15 · Tin đồn trong cung ---------------- */
  G.RUMOR_CHANCE = 0.35;
  G.RUMOR_COST = 100;
  function rumorEvent(s) {
    if (s.consorts.length < 3) return null;
    const a = pick(s.consorts);
    const fa = factionOf(a.id);
    let pool = s.consorts.filter((c) => c.id !== a.id);
    const rivals = fa ? pool.filter((c) => factionOf(c.id) && factionOf(c.id) !== fa) : [];
    const b = pick(rivals.length && rand() < 0.7 ? rivals : pool);
    const tIdx = Math.floor(rand() * G.D2_TEXT.rumors.length);
    const truth = rand() < 0.5 + (b.traits.includes("Kiêu kỳ") ? 0.15 : 0);
    const T = G.D2_TEXT.rumors[tIdx];
    const ev = {
      id: "sys.tin_don",
      title: "Tin đồn trong cung",
      text: T.intro,
      choices: [
        { label: "Cho người điều tra, một tháng sau rõ", cost: G.RUMOR_COST, _act: "check" },
        { label: "Bỏ qua", _act: "ignore" },
        { label: "Xử ngay theo tin (quở trách, cắt bổng)", _act: "act" },
      ],
      onChoose: (ch, sp, notes) => {
        const A = G.findConsort(a.id);
        const B = G.findConsort(b.id);
        if (ch._act === "check") {
          d2().rumorPending = { a: a.id, b: b.id, truth, t: tIdx, turn: G.state.turn };
          ch.result = "Kính Sự phòng nhận lệnh điều tra. Tháng sau sẽ có kết quả.";
        } else if (ch._act === "ignore") {
          if (truth) {
            G.addStat("hoaKhi", -2);
            notes.push("Hòa khí −2");
          }
          ch.result = G.fill(truth ? G.D2_TEXT.rumorIgnoreTrue : G.D2_TEXT.rumorIgnoreFalse, sp);
        } else {
          if (truth) {
            G.addStat("hoaKhi", 2);
            notes.push("Hòa khí +2");
            ch.result = G.fill(T.yes + "\n" + G.D2_TEXT.rumorAct, sp);
          } else {
            if (A) A.affection = clamp(A.affection - 10, 0, 100);
            if (B) G.changeFavor(B, 3);
            notes.push(`Tình cảm ${a.name} −10`, `Sủng ái ${b.name} +3`);
            ch.result = G.fill(T.no + "\n" + G.D2_TEXT.rumorFalse, sp);
          }
        }
      },
    };
    return G.prepareEvent(ev, { speaker: a, speaker2: b });
  }
  function rumorResult(s, r) {
    const a = G.findConsort(r.a);
    const b = G.findConsort(r.b);
    if (!a || !b) return null;
    const T = G.D2_TEXT.rumors[r.t] || G.D2_TEXT.rumors[0];
    const ev = {
      id: "sys.tin_don_ket_qua",
      title: "Kết quả điều tra",
      text: T[r.truth ? "yes" : "no"],
      choices: r.truth ? [{ label: "Xử đúng người, khuyên nàng xin lỗi các tỷ muội", effects: { hoaKhi: 3 } }] : [{ label: "Minh oan cho nàng", effects: { affection: 5 } }],
    };
    return G.prepareEvent(ev, { speaker: a, speaker2: b });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    if (d.rumorPending && s.turn > d.rumorPending.turn) {
      const p = rumorResult(s, d.rumorPending);
      d.rumorPending = null;
      if (p) report.sideEvents.push(p); // kết quả điều tra luôn báo
    }
    if (!sideRoom(report) || s.turn - d.rumorTurn < 2 || d.rumorPending) return;
    if (rand() >= G.RUMOR_CHANCE * G.queMult("rumor")) return;
    const p = rumorEvent(s);
    if (p && p.choices.length) {
      d.rumorTurn = s.turn;
      report.sideEvents.push(p);
    }
  });

  /* ---------------- 17 · Hòa thân ---------------- */
  G.HOA_THAN_EVERY = 2; // năm
  G.HOA_THAN_MONTH = 10;
  G.HOA_THAN_REFUSE_COST = 800;
  G.HOA_THAN_DOWRY = 1500;
  G.regionCost = function (r) {
    const s = G.state;
    const pen = s && s.d2 && s.d2.travelPenalty[r.id];
    return pen && s.year <= pen ? r.cost * 2 : r.cost;
  };
  function princessPool(s) {
    const d = d2(s);
    const inHarem = new Set(s.consorts.map((c) => c.id).concat(s.former.map((c) => c.id)));
    return Object.values(R.characters).filter((c) => c.princess && !inHarem.has(c.id) && !d.princessUsed.includes(c.id) && c.age >= G.MIN_AGE);
  }
  function hoaThanEvent(s) {
    const pool = shuffle(princessPool(s));
    let picks = pool.slice(0, rand() < 0.4 ? 3 : 2);
    if (picks.length < 2) {
      // hết công chúa viết sẵn: tạo ngẫu nhiên
      while (picks.length < 2) {
        const def = G.makeRecruit("Công chúa nước láng giềng");
        def.princess = true;
        def.rank = 2;
        def.portraitText = "Tranh vẽ nàng đứng dưới gốc mai, áo lụa buông lơi.";
        picks.push(def);
      }
    }
    const region = (picks[0].princessFrom && R.regions[picks[0].princessFrom]) || pick(Object.values(R.regions));
    const regionName = picks[0].princessLand || (region ? region.name : "nước láng giềng");
    const list = picks.map((p, i) => `Tranh ${i + 1}: ${p.name}, ${p.age} tuổi. ${p.portraitText || ""}`).join("\n");
    const cond = rand() < 0.5 ? "thue" : "cung";
    const condText = fillVars(G.D2_TEXT.hoaThanCond[cond], { region: regionName });
    const choices = [];
    for (const p of picks) {
      choices.push({ label: `Chọn ${p.name}, phong Quý nhân`, _pick: p.id, _rank: 2 });
      choices.push({ label: `Chọn ${p.name}, phong Tần`, _pick: p.id, _rank: 3 });
    }
    choices.push({ label: "Từ chối khéo, tặng lễ vật", cost: G.HOA_THAN_REFUSE_COST, _refuse: "soft" });
    choices.push({ label: "Từ chối thẳng", _refuse: "hard" });
    const ev = {
      id: "sys.hoa_than",
      title: "Sứ xin hòa thân",
      text: fillVars(G.D2_TEXT.hoaThan, { region: regionName, n: picks.length }) + "\n" + list + "\n" + condText,
      choices,
      onChoose: (ch, sp, notes) => {
        const st = G.state;
        const d = d2();
        for (const p of picks) d.princessUsed.push(p.id);
        if (ch._refuse === "hard") {
          G.addStat("danTam", -5);
          if (region) d.travelPenalty[region.id] = st.year + 2;
          notes.push("Dân tâm −5", region ? `Hai năm tới tuần du ${region.name} đắt gấp đôi` : "");
          return;
        }
        if (ch._refuse) return;
        const c = G.addConsort(ch._pick, true);
        if (!c) return;
        c.rank = ch._rank;
        G.addStat("quocKho", G.HOA_THAN_DOWRY);
        G.addStat("danTam", ch._rank >= 3 ? 5 : 3);
        notes.push(`${c.name} nhập cung, phong ${G.RANKS[c.rank]}`, `Hồi môn +${G.HOA_THAN_DOWRY}`, `Dân tâm +${ch._rank >= 3 ? 5 : 3}`);
        if (ch._rank >= 3) {
          G.addStat("hoaKhi", -5);
          notes.push("Phi cũ bất bình: Hòa khí −5");
        }
        if (cond === "thue") {
          d.taxCutUntil = st.turn + 24;
          notes.push("Giảm thuế hai năm: Quốc khố −100/tháng");
        } else {
          G.addStat("quocKho", -1000);
          c.palace = Math.min(3, (c.palace || 0) + 1);
          notes.push("Xây cung riêng: Quốc khố −1000");
        }
        log(`Hòa thân: ${c.name} nhập cung, phong ${G.RANKS[c.rank]}.`, "milestone");
        G.addAlbum("Hòa thân", `${c.name} từ ${regionName} sang, nhập cung.`);
      },
    };
    return G.prepareEvent(ev, { speaker: null });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    if (d.taxCutUntil >= s.turn) G.addStat("quocKho", -100);
    const q = G.currentQue && G.currentQue();
    const due = s.year % G.HOA_THAN_EVERY === 0 || (q && q.id === "vien_khach");
    if (!due || s.month !== G.HOA_THAN_MONTH || d.hoaThanYear === s.year || s.year < 2) return;
    d.hoaThanYear = s.year;
    const p = hoaThanEvent(s);
    if (p && p.choices.length) report.sideEvents.push(p); // sứ thần luôn được tiếp
  });

  /* ---------------- Quẻ mới (đợt 3) ---------------- */
  G.QUE.push(
    { id: "vien_khach", name: "Viễn khách", desc: "Năm nay chắc chắn có sứ xin hòa thân.", mult: {} },
    { id: "ghen_tuong", name: "Ghen tuông", bad: true, desc: "Tin đồn nhiều gấp đôi, Hòa khí −1 mỗi quý.", mult: { rumor: 2 } },
    { id: "hoa_hop", name: "Hòa hợp", desc: "Tin đồn ít đi một nửa, Hòa khí +1 mỗi quý.", mult: { rumor: 0.5 } }
  );
  Object.assign(G.D1_TEXT.que, {
    vien_khach: "Sao Bắc Đẩu chiếu thẳng xuống phương Nam, sứ giả phương xa mang theo công chúa còn nguyên vẹn xin hòa thân. Năm nay sẽ có lồn ngoại quốc đến cung, để hoàng thượng phá trinh và đụ no cặc.",
    ghen_tuong: "Mây đen che khuất trăng, gió lạnh thổi qua hậu cung khiến các phi ghen tuông điên đảo. Tin đồn về ai được đụ nhiều hơn lan truyền, lồn các nàng ngứa ngáy vì hiềm khích.",
    hoa_hop: "Trăng rằm soi sáng, gió xuân hòa dịu thổi qua cung. Hậu cung êm ấm, các phi vui vẻ cùng hầu hạ, ít cãi vã vì đêm nào cũng được bệ hạ bú liếm và xuất tinh no nê.",
  });
  monthly((s) => {
    const q = G.currentQue();
    if (!q || s.month % 3 !== 0) return;
    if (q.id === "ghen_tuong") G.addStat("hoaKhi", -1);
    if (q.id === "hoa_hop") G.addStat("hoaKhi", 1);
  });

  /* ================================================================== */
  /* TƯƠNG TÁC (0.5.1): Ghé thăm có hội thoại · Lời hẹn · Nhắc việc      */
  /* ================================================================== */
  /*
   * Câu chữ nháp nằm trong G.D3_TEXT để thay bằng bản Grok viết. Biến: {name}.
   */
  G.D3_TEXT = {
    talk: {
      hoi: { label: "Hỏi chuyện nàng", good: "{name} kể cả buổi chuyện trong cung, mắt sáng lên vì có người chịu nghe.\n> Bệ hạ hỏi thiếp thật sao? Lâu lắm rồi mới có người hỏi thiếp như vậy.", ok: "{name} trả lời từng câu, lễ phép nhưng hơi dè dặt.\n> Thiếp vẫn khỏe, đa tạ bệ hạ quan tâm.", bad: "{name} cười gượng, mắt nhìn ra cửa sổ.\n> Bệ hạ đến chỉ để hỏi chuyện thôi sao?" },
      treu: { label: "Trêu nàng", good: "{name} bật cười, đấm nhẹ vào ngực bệ hạ rồi trêu lại ngay.\n> Bệ hạ hư quá! Lần sau thiếp không tha đâu.", ok: "{name} đỏ mặt cười khúc khích, không biết đáp thế nào.\n> Bệ hạ lại đùa thiếp rồi.", bad: "{name} cúi đầu, hai tay vò vạt áo, mặt đỏ bừng.\n> Bệ hạ đừng trêu thiếp nữa… thiếp ngượng lắm." },
      khen: { label: "Khen nàng", good: "{name} xoay một vòng cho bệ hạ ngắm, nụ cười rạng rỡ.\n> Thật sao? Vậy hôm nay thiếp trang điểm không uổng công rồi.", ok: "{name} mỉm cười, khẽ cúi đầu tạ ơn.\n> Bệ hạ quá khen, thiếp không dám nhận.", bad: "{name} nhướng mày, giọng hơi lạnh.\n> Bệ hạ nói câu này với bao nhiêu người rồi?" },
    },
    promiseAsk: "{name} tiễn bệ hạ ra tận cửa, kéo nhẹ tay áo người.\n> Tháng sau bệ hạ ghé cung thiếp nhé? Thiếp sẽ chuẩn bị một món bất ngờ.",
    promiseKept: "{name} giữ đúng lời hẹn với bệ hạ, vui suốt mấy ngày.",
    promiseBroken: "{name} đợi cả tháng mà bệ hạ không đến. Nàng dỗi, không ra đón khi bệ hạ đi ngang.",
    sulkLine: "{name} quay mặt đi, giọng nhỏ mà giận.\n> Bệ hạ còn nhớ đường đến cung thiếp sao?",
  };

  const one = (x) => (Array.isArray(x) ? pick(x) : x); // câu chữ có thể là một chuỗi hoặc danh sách nhiều bản
  G.d3one = one;
  const d3 = (s) => {
    s = s || G.state;
    if (!s.d3) s.d3 = {};
    const d = s.d3;
    for (const [k, v] of Object.entries({ seen: {}, talkMonth: {}, talkKnown: {}, promise: null, promiseTurn: -99, sulk: {}, persuadeBonus: {} })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d3 = d3;

  // Ghi nhận bệ hạ đã gặp nàng trong tháng (ghé thăm hoặc thị tẩm), dùng cho lời hẹn
  const visitD3 = G.visit;
  G.visit = function (id) {
    const r = visitD3(id);
    if (r != null) d3().seen[id] = G.state.turn;
    return r;
  };
  const spendD3 = G.spendNight;
  G.spendNight = function (list, opts) {
    spendD3(list, opts);
    const d = d3();
    for (const c of list) d.seen[c.id] = G.state.turn;
  };

  /* ---------------- 3 · Ghé thăm có hội thoại ---------------- */
  // Tính cách thích / ghét kiểu nói chuyện nào
  G.TALK_LIKE = {
    hoi: ["Ôn nhu", "Đa sầu", "Lãng mạn", "Si tình", "Đoan trang", "Tinh tế", "Sâu sắc", "Dịu dàng", "Hai mặt", "Khéo tay"],
    treu: ["Tinh nghịch", "Táo bạo", "Hoang dã", "Phóng khoáng", "Lanh lợi", "Mạnh mẽ", "Khéo nói", "Yêu biển"],
    khen: ["Thích chưng diện", "Kiêu kỳ", "Biết múa", "Giỏi múa", "Giọng hát ngọt", "Hát hay", "Eo thon", "Nồng nàn", "Mùi hương lạ", "Cưỡi ngựa giỏi"],
  };
  G.TALK_DISLIKE = {
    hoi: ["Táo bạo", "Hoang dã"],
    treu: ["Hay ngượng", "Kiêu kỳ", "Đoan trang"],
    khen: ["Đa sầu", "Sâu sắc"],
  };
  G.TALK_BONUS = 5; // nói đúng ý: tháng này thuyết phục dễ hơn 5 điểm
  G.talkAvailable = (c) => d3().talkMonth[c.id] !== G.state.turn;
  G.talkReaction = function (c, opt) {
    const t = c.traits || [];
    const like = t.some((x) => G.TALK_LIKE[opt].includes(x));
    const dis = t.some((x) => G.TALK_DISLIKE[opt].includes(x));
    return like && !dis ? "good" : dis && !like ? "bad" : "ok";
  };
  /** Ghé thăm và nói chuyện. Trả về { text, notes }. */
  G.talk = function (id, opt) {
    const s = G.state;
    const c = G.findConsort(id);
    if (!c || !G.D3_TEXT.talk[opt]) return null;
    const d = d3();
    G.visit(id); // Sủng ái +3, Tình cảm +2 như ghé thăm thường
    const notes = ["Sủng ái +3", "Tình cảm +2"];
    if (!G.talkAvailable(c)) return { text: G.fill(one(G.D3_TEXT.talk[opt].ok), { speaker: c }), notes: notes.concat(["Tháng này đã trò chuyện rồi"]) };
    d.talkMonth[c.id] = s.turn;
    let r = G.talkReaction(c, opt);
    const sulking = d.sulk[c.id] != null && d.sulk[c.id] >= s.turn;
    if (sulking && r === "good") r = "ok";
    (d.talkKnown[c.id] = d.talkKnown[c.id] || {})[opt] = r;
    if (r === "good") {
      c.affection = clamp(c.affection + 4, 0, 100);
      G.changeFavor(c, 2);
      d.persuadeBonus[c.id] = s.turn;
      notes.push("Đúng ý nàng: Tình cảm +4, Sủng ái +2", `Tháng này thuyết phục dễ hơn ${G.TALK_BONUS} điểm`);
      if (sulking) delete d.sulk[c.id];
    } else if (r === "bad") {
      c.affection = clamp(c.affection - 2, 0, 100);
      notes.push("Không hợp ý: Tình cảm −2");
    }
    const text = one(sulking && r !== "good" ? G.D3_TEXT.sulkLine : G.D3_TEXT.talk[opt][r]);
    return { text: G.fill(text, { speaker: c }), notes, reaction: r };
  };
  // nói đúng ý thì mức cần để thuyết phục giảm trong tháng đó
  const needD3 = G.persuadeNeed;
  G.persuadeNeedFor = function (c, fid) {
    const s = G.state;
    const n = needD3(fid);
    return s && s.d3 && s.d3.persuadeBonus[c.id] === s.turn ? n - G.TALK_BONUS : n;
  };
  const persuadeD3 = G.persuade;
  G.persuade = function (id, fid) {
    const c = G.findConsort(id);
    const s = G.state;
    if (!c || !(s.d3 && s.d3.persuadeBonus[id] === s.turn)) return persuadeD3(id, fid);
    // tạm nâng chỉ số để dùng mức cần thấp hơn, rồi trả lại như cũ
    const f0 = c.favor;
    const a0 = c.affection;
    c.favor += G.TALK_BONUS;
    c.affection += G.TALK_BONUS;
    let r;
    try {
      r = persuadeD3(id, fid);
    } finally {
      c.favor = f0;
      c.affection = a0;
    }
    return r;
  };

  /* ---------------- 5 · Lời hẹn ---------------- */
  G.PROMISE_CHANCE = 0.2;
  G.PROMISE_COOLDOWN = 4;
  monthly((s, report) => {
    if (s.ended) return;
    const d = d3(s);
    for (const [id, until] of Object.entries(d.sulk)) if (until < s.turn || !G.findConsort(id)) delete d.sulk[id];
    // xét lời hẹn đã đến hạn: hạn là tháng ngay sau tháng hẹn
    const p = d.promise;
    if (p && s.turn > p.due) {
      const c = G.findConsort(p.id);
      d.promise = null;
      if (c) {
        if ((d.seen[c.id] || -1) >= p.due) {
          c.affection = clamp(c.affection + 8, 0, 100);
          G.changeFavor(c, 4);
          log(G.fill(one(G.D3_TEXT.promiseKept), { speaker: c }) + " Tình cảm +8, Sủng ái +4.", "harem");
        } else {
          c.affection = clamp(c.affection - 6, 0, 100);
          G.changeFavor(c, -3);
          d.sulk[c.id] = s.turn + 2;
          log(G.fill(one(G.D3_TEXT.promiseBroken), { speaker: c }) + " Tình cảm −6, Sủng ái −3.", "harem");
        }
      }
    }
    if (d.promise || s.turn - d.promiseTurn < G.PROMISE_COOLDOWN || report.sideEvents.length >= G.SIDE_MAX || rand() >= G.PROMISE_CHANCE) return;
    const list = s.consorts.filter((c) => c.affection >= 40 && c.pregnantDue == null && !d.sulk[c.id]);
    if (!list.length) return;
    const c = pick(list);
    const ev = {
      id: "sys.loi_hen",
      title: "Lời hẹn",
      text: one(G.D3_TEXT.promiseAsk),
      choices: [
        { label: "Hứa với nàng", _promise: true, effects: { affection: 2 } },
        { label: "Trẫm bận, để dịp khác", effects: { affection: -1 } },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._promise) return;
        const dd = d3();
        dd.promise = { id: c.id, due: G.state.turn + 1 };
        notes.push("Tháng sau ghé thăm hoặc triệu nàng: Tình cảm +8. Quên thì nàng dỗi.");
      },
    };
    d.promiseTurn = s.turn;
    report.sideEvents.push(G.prepareEvent(ev, { speaker: c }));
  });
  /** Lời hẹn đang có: { c, thisMonth } hoặc null. */
  G.promiseNow = function () {
    const s = G.state;
    const p = s && s.d3 && s.d3.promise;
    if (!p) return null;
    const c = G.findConsort(p.id);
    return c ? { c, thisMonth: s.turn === p.due, done: (s.d3.seen[c.id] || -1) >= p.due } : null;
  };
  G.isSulking = (c) => !!(G.state.d3 && G.state.d3.sulk[c.id] != null && G.state.d3.sulk[c.id] >= G.state.turn);

  /* ---------------- 10 · Nhắc việc ---------------- */
  /** Danh sách việc cần để ý: [{ text, consort? }] */
  G.reminders = function () {
    const s = G.state;
    const out = [];
    if (!s) return out;
    const pr = G.promiseNow();
    if (pr && !pr.done) out.push({ text: pr.thisMonth ? `Tháng này đã hẹn ghé ${pr.c.name}. Chưa đến thì nàng dỗi.` : `Đã hẹn ${pr.c.name}: tháng sau ghé cung nàng.`, consort: pr.c.id, hot: pr.thisMonth });
    for (const c of s.consorts) {
      if (c.pregnantDue != null && c.pregnantDue - s.turn <= 1) out.push({ text: `${c.name} sắp lâm bồn.`, consort: c.id });
      const w = G.wishText && G.wishText(c);
      if (w && w.left <= 2) out.push({ text: `${c.name}: tâm nguyện "${w.text}" còn ${w.left} tháng.`, consort: c.id, hot: w.left <= 1 });
    }
    // phi đủ điều kiện thuyết phục
    const unlocked = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f));
    const ready = [];
    for (const c of s.consorts) {
      const n = unlocked.filter((f) => G.consentOf(c, f) === "persuade" && Math.round(c.favor) >= G.persuadeNeedFor(c, f) && Math.round(c.affection) >= G.persuadeNeedFor(c, f)).length;
      if (n) ready.push(`${c.name} (${n})`);
    }
    if (ready.length) out.push({ text: `Đủ điều kiện thuyết phục: ${ready.slice(0, 4).join(", ")}${ready.length > 4 ? "…" : ""}. Vào hồ sơ phi, lọc "Chỉ Cần thuyết phục".` });
    const q = s.d2 && s.d2.sacQueue && s.d2.sacQueue.map((x) => G.findConsort(x.id)).filter(Boolean);
    if (q && q.length) out.push({ text: `Chờ lễ sắc phong: ${q.map((c) => c.name).join(", ")}.` });
    const next = (s.month % 12) + 1;
    const fest = (G.FESTIVALS || []).filter((f) => f.month === next).map((f) => (f.id === "sys.hoa_trieu" ? "Hoa triêu" : (R.events[f.id] || {}).title)).filter(Boolean);
    if (fest.length) out.push({ text: `Tháng sau: ${fest.join(", ")}.` });
    const H = G.hanhCungNow && G.hanhCungNow();
    if (H && !H.why) out.push({ text: `Tháng này có thể ngự giá ${H.name} (Ý chỉ).` , hot: true });
    else if (G.HANH_CUNG && Object.values(G.HANH_CUNG).some((h) => h.month === next)) out.push({ text: "Tháng sau mở hành cung, nhớ để dành lượng." });
    if (G.HOA_THAN_MONTH && next === G.HOA_THAN_MONTH && (s.year % (G.HOA_THAN_EVERY || 2) === 0 || (G.currentQue && G.currentQue() && G.currentQue().id === "vien_khach"))) out.push({ text: "Tháng sau sứ thần đến xin hòa thân." });
    return out;
  };

  /* ================================================================== */
  /* ĐỢT 4 · Thẻ úp duyên trời · Ghen tuông · Đêm không như ý            */
  /* ================================================================== */
  // Câu chữ: chuỗi hoặc danh sách nhiều bản (chọn ngẫu nhiên). {name} = người chính, {name2} = người kia.
  G.D4_TEXT = {
    fateIntro: "Lý công công úp ba thẻ tên lên khay ngọc. Bệ hạ nhắm mắt chọn một thẻ: ai được lật lên, đêm nay là duyên trời định.",
    jealous: [
      "Tin bệ hạ mấy đêm liền ở cung {name2} truyền khắp hậu cung. {name} đóng cửa cung, không ra ngắm hoa cùng các tỷ muội nữa.\n> Trong mắt bệ hạ giờ chỉ còn mỗi {name2} thôi sao?",
    ],
    mood: {
      met: ["{name} ra đón muộn, mắt hơi trũng vì cả ngày tập đàn cho yến tiệc. Nàng khẽ cúi đầu.\n> Bệ hạ thứ lỗi… đêm nay thiếp mệt quá, sợ hầu không chu đáo. Người cho thiếp hẹn hôm khác được không?"],
      buon: ["{name} ngồi bên cửa sổ, tay cầm lá thư nhà vừa tới. Thấy bệ hạ, nàng vội lau mắt.\n> Thiếp nhớ nhà… đêm nay lòng thiếp không yên. Bệ hạ đừng giận thiếp nhé."],
      doi: ["{name} không ra đón, chỉ đứng sau rèm, giọng nhỏ mà hờn.\n> Giờ bệ hạ mới nhớ đến thiếp sao? Đêm nay thiếp không muốn hầu."],
    },
    comfort: {
      met: ["Bệ hạ bảo nàng nằm xuống, tự tay xoa vai cho nàng đến khi nàng thiếp đi trong lòng người. Sáng ra, {name} cứ ngượng mãi.\n> Lần sau thiếp nhất định bù cho bệ hạ."],
      buon: ["Bệ hạ ngồi nghe {name} kể chuyện quê nhà đến khuya, rồi ôm nàng ngủ, không làm gì thêm. Nàng nắm chặt tay người cả đêm.\n> Có bệ hạ ở đây, thiếp thấy đỡ nhớ nhà rồi."],
      doi: ["Bệ hạ không ép, chỉ ngồi ngoài rèm trò chuyện với nàng. Đến khuya, {name} tự vén rèm bước ra, tựa đầu vào vai người.\n> Thôi… thiếp hết giận rồi. Nhưng bệ hạ phải nhớ đến thiếp đấy."],
    },
    rest: ["{name} thở phào, cúi đầu tạ ơn.\n> Đa tạ bệ hạ thương thiếp. Lần sau thiếp nhất định hầu người chu đáo."],
  };
  G.MOOD_LABEL = { met: "Nàng mệt", buon: "Nàng buồn", doi: "Nàng đang dỗi" };
  G.FATE_BONUS = 3; // Tình cảm khi triệu người bốc được từ thẻ úp
  G.MOOD_CHANCE = 0.08; // khả năng nàng xin dời một đêm
  G.MOOD_SULK_CHANCE = 0.5; // khi nàng đang dỗi
  G.MOOD_COOLDOWN = 3; // tháng
  G.JEALOUS_AT = 3; // từ đêm liền thứ mấy thì có người ghen

  const d4 = (s) => {
    s = s || G.state;
    if (!s.d4) s.d4 = {};
    const d = s.d4;
    for (const [k, v] of Object.entries({ fate: null, fateTurn: -1, moodTurn: {}, rest: {} })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d4 = d4;

  /* ---------------- Nàng xin nghỉ tháng này ---------------- */
  G.isResting = (c) => !!(G.state.d4 && G.state.d4.rest[c.id] === G.state.turn);
  const cannotD4 = G.cannotSummon;
  G.cannotSummon = function (c) {
    const why = cannotD4(c);
    if (why) return why;
    if (G.isResting(c)) return `${c.name} đang nghỉ ngơi, tháng sau hẵng triệu.`;
    return null;
  };

  /* ---------------- 2 · Thẻ úp duyên trời ---------------- */
  const summonable = () => G.state.consorts.filter((c) => !G.cannotSummon(c));
  G.canDrawFate = () => d4().fateTurn !== G.state.turn && summonable().length >= 2;
  /** Bốc 3 thẻ úp (người được sủng nhiều dễ ra hơn). Mỗi tháng một lần. */
  G.drawFate = function () {
    if (!G.canDrawFate()) return [];
    const pool = summonable();
    const out = [];
    while (out.length < 3 && pool.length) {
      const total = pool.reduce((t, c) => t + c.favor + 10, 0);
      let r = rand() * total;
      let i = 0;
      for (; i < pool.length - 1; i++) {
        r -= pool[i].favor + 10;
        if (r <= 0) break;
      }
      out.push(pool.splice(i, 1)[0]);
    }
    d4().fateTurn = G.state.turn;
    return out;
  };
  G.chooseFate = function (id) {
    d4().fate = { id, turn: G.state.turn };
  };
  G.fateNow = (c) => {
    const f = G.state.d4 && G.state.d4.fate;
    return !!(f && f.id === c.id && f.turn === G.state.turn);
  };

  /* ---------------- 5 · Ghen tuông ---------------- */
  function jealousOf(c) {
    const mine = G.factionOf(c.id);
    const list = G.state.consorts.filter((o) => o.id !== c.id && o.pregnantDue == null && o.affection >= 25 && !(G.isSulking && G.isSulking(o)));
    if (!list.length) return null;
    const score = (o) => {
      const f = G.factionOf(o.id);
      return o.favor + o.rank * 5 + (f && f !== mine ? 40 : 0);
    };
    list.sort((a, b) => score(b) - score(a));
    return pick(list.slice(0, 3));
  }
  G.jealousOf = jealousOf;

  const summonD4 = G.summon;
  G.summon = function (id, fetishIds) {
    const s = G.state;
    const scene = summonD4(id, fetishIds);
    if (!scene || scene.blocked) return scene;
    const c = G.findConsort(id);
    const d = d4();
    scene.notes = scene.notes || [];
    if (c && G.fateNow(c)) {
      c.affection = clamp(c.affection + G.FATE_BONUS, 0, 100);
      scene.notes.push(`Duyên trời: Tình cảm +${G.FATE_BONUS}`);
      d.fate = null;
    }
    if (c && s.summonStreak.id === id && s.summonStreak.count >= G.JEALOUS_AT) {
      const j = jealousOf(c);
      if (j) {
        G.d3().sulk[j.id] = s.turn + 2;
        j.affection = clamp(j.affection - 4, 0, 100);
        G.changeFavor(j, -2);
        const text = G.fill(G.d3one(G.D4_TEXT.jealous), { speaker: j, speaker2: c });
        log(`${j.name} ghen vì bệ hạ ${s.summonStreak.count} đêm liền ở cung ${c.name}.`, "harem");
        scene.notes.push(`${j.name} ghen`);
        scene.jealous = { c: j, text, notes: [`${j.name} dỗi 2 tháng`, "Tình cảm −4, Sủng ái −2", "Ghé thăm và nói đúng ý nàng để làm lành"] };
      }
    }
    return scene;
  };

  /* ---------------- 6 · Đêm không như ý ---------------- */
  /** Gọi trước khi truyền chỉ. Trả về { kind, label, text } nếu nàng xin dời, hoặc null. */
  G.nightMood = function (c) {
    const s = G.state;
    if (!c || s.godMode) return null;
    const d = d4();
    if (d.moodTurn[c.id] != null && s.turn - d.moodTurn[c.id] < G.MOOD_COOLDOWN) return null;
    const sulk = G.isSulking && G.isSulking(c);
    if (!sulk && !c.nights) return null; // đêm đầu tiên thì không xin dời
    const p = sulk ? G.MOOD_SULK_CHANCE : G.MOOD_CHANCE + (c.affection < 30 ? 0.06 : 0);
    if (rand() >= p) return null;
    const kind = sulk ? "doi" : pick(["met", "buon"]);
    d.moodTurn[c.id] = s.turn;
    return { kind, label: G.MOOD_LABEL[kind], text: G.fill(G.d3one(G.D4_TEXT.mood[kind]), { speaker: c }) };
  };
  /** Ở lại an ủi nàng: không thị tẩm, Tình cảm tăng, hết dỗi. */
  G.moodComfort = function (c, kind) {
    const s = G.state;
    c.affection = clamp(c.affection + 6, 0, 100);
    G.changeFavor(c, 2);
    s.visitedThisMonth[c.id] = true;
    const d3s = G.d3();
    d3s.seen[c.id] = s.turn;
    const notes = ["Tình cảm +6", "Sủng ái +2"];
    if (kind === "doi" && d3s.sulk[c.id] != null) {
      delete d3s.sulk[c.id];
      notes.push("Nàng hết dỗi");
    }
    log(`Bệ hạ ở lại an ủi ${c.name} suốt đêm.`, "harem");
    return { text: G.fill(G.d3one(G.D4_TEXT.comfort[kind] || G.D4_TEXT.comfort.met), { speaker: c }), notes };
  };
  /** Để nàng nghỉ: tháng này không triệu được nàng nữa. */
  G.moodRest = function (c) {
    c.affection = clamp(c.affection + 2, 0, 100);
    d4().rest[c.id] = G.state.turn;
    return { text: G.fill(G.d3one(G.D4_TEXT.rest), { speaker: c }), notes: ["Tình cảm +2", "Tháng này nàng nghỉ"] };
  };

  // nhắc việc: sắp có người ghen
  const remD4 = G.reminders;
  G.reminders = function () {
    const out = remD4();
    const s = G.state;
    if (!s) return out;
    const st = s.summonStreak;
    const c = st && st.id && G.findConsort(st.id);
    if (c && st.count >= G.JEALOUS_AT - 1) out.unshift({ text: `Đã triệu ${c.name} ${st.count} đêm liền. Triệu tiếp nàng thì sẽ có phi ghen.`, consort: c.id, hot: true });
    return out;
  };
  monthly((s) => {
    const d = d4(s);
    for (const [id, t] of Object.entries(d.rest)) if (t < s.turn) delete d.rest[id];
    for (const [id, t] of Object.entries(d.moodTurn)) if (s.turn - t >= G.MOOD_COOLDOWN) delete d.moodTurn[id];
  });

  /* ================================================================== */
  /* Sở thích có điều kiện ("needs" trong fetishes.json)                  */
  /*   "virgin"   : chỉ khi nàng chưa từng thị tẩm (Phá trinh)             */
  /*   "pregnant" : chỉ khi nàng đang hoài thai (Mang thai)                */
  /* ================================================================== */
  G.NEEDS_LABEL = { virgin: "Chỉ ở đêm đầu của nàng", pregnant: "Chỉ khi nàng hoài thai" };
  G.CONSENT_LABEL.na = "Chưa hợp lúc này";
  /** Sở thích có hợp với tình trạng của nàng lúc này không. */
  G.fetishFits = function (c, fid) {
    const f = R.fetishes[fid];
    if (!f || !f.needs || !c || c.isChild) return true;
    if (f.needs === "virgin") return !c.nights;
    if (f.needs === "pregnant") return c.pregnantDue != null;
    return true;
  };
  const consentD5 = G.consentOf;
  G.consentOf = function (p, fid) {
    const lvl = consentD5(p, fid);
    return lvl !== "refuse" && G.state && G.state.consorts && G.findConsort(p.id) && !G.fetishFits(p, fid) ? "na" : lvl;
  };
  // phi đang hoài thai: chỉ triệu được khi nàng sẵn lòng với sở thích "pregnant" đã mở
  const pregFetishes = () => Object.values(R.fetishes).filter((f) => f.needs === "pregnant" || f.allowPregnant).map((f) => f.id);
  const pregOk = (c) => c.pregnantDue != null && pregFetishes().some((f) => G.fetishUnlocked(f) && G.consentOf(c, f) === "willing");
  G.pregnantSummonOk = pregOk;
  const cannotD5 = G.cannotSummon;
  G.cannotSummon = function (c) {
    if (pregOk(c)) return cannotD5(Object.assign({}, c, { pregnantDue: null }));
    return cannotD5(c);
  };
  const summonD5 = G.summon;
  G.summon = function (id, fetishIds) {
    const c = G.findConsort(id);
    const fx = fetishIds || [];
    if (c && c.pregnantDue != null && !fx.some((f) => R.fetishes[f] && (R.fetishes[f].needs === "pregnant" || R.fetishes[f].allowPregnant)))
      return { title: "Không thể thị tẩm", text: `${c.name} đang mang long thai. Muốn gần gũi nàng, hãy chọn sở thích "${(R.fetishes[pregFetishes()[0]] || {}).name || "Mang thai"}".`, blocked: true };
    return summonD5(id, fetishIds);
  };

  /* ================================================================== */
  /* ĐỢT 5 · Hậu cung tự sống · Mini game · Mùa và thời tiết            */
  /* ================================================================== */
  // Câu chữ: chuỗi hoặc danh sách nhiều bản. {name} = phi chính, {name2} = phi thứ hai.
  G.D5_TEXT = {
    life: {"dang_canh": ["Cung nữ của {name} bưng tô canh gà nóng hổi đến ngự thư phòng, kèm theo một tờ giấy nhỏ viết tay.\nTrên giấy ghi vài chữ mong bệ hạ dùng xong thì nhớ nghỉ ngơi.", "{name} sai thị nữ mang điểm tâm và trà thơm đến thư phòng lúc trưa.\nCô ấy dặn dò nhẹ rằng bệ hạ đừng để bụng đói khi xem tấu.", "Buổi chiều, {name} nhờ cung nữ mang khay trà sen đến nơi bệ hạ đang phê duyệt.\nLời nhắn kèm theo chỉ xin bệ hạ nếm thử một chén cho mát lòng."], "ket_be": ["{name} và {name2} cùng ngồi thêu một bức tranh hoa mẫu đơn trong nội điện.\nHai nàng vừa thêu vừa trò chuyện vui vẻ, tiếng cười khẽ vang lên.", "{name} cùng {name2} bày bàn cờ dưới bóng cây trong vườn.\nHai người đánh từng nước chậm rãi, thỉnh thoảng nhìn nhau mỉm cười.", "{name} và {name2} hái hoa sen bên hồ, tay giỏ đầy những bông tươi.\nHai nàng vừa hái vừa kể chuyện cũ, thân thiết hơn trước nhiều."], "tap_nghe": ["{name} ngồi một mình trong phòng, tay khảy từng nốt đàn tỳ bà.\nTiếng đàn vang nhẹ, nàng luyện đến khi mặt trời nghiêng bóng.", "Buổi sáng, {name} đứng giữa sân tập những động tác múa chậm rãi.\nVạt áo bay theo gió, nàng tự mình chỉnh từng nhịp cho đúng.", "{name} trải giấy trước án, cầm bút luyện nét chữ thư pháp.\nNàng viết đi viết lại một chữ đẹp, ánh mắt chăm chú không rời."], "gianh_nhau": ["{name} và {name2} cùng với tay lấy tấm vải lụa hồng trên bàn.\nCả hai không ai chịu buông, cứ giữ chặt một góc, nhìn nhau không nhường.", "{name} với {name2} tranh nhau chậu hoa trà mới được mang vào.\nHai nàng mỗi người nắm một bên, không ai chịu để cho người kia.", "{name} và {name2} cùng muốn ngồi chỗ gần sân khấu xem kịch.\nCả hai đứng cạnh chiếc ghế, không ai chịu ngồi xuống trước."]},
    hanhLang: ["Tan triều, {name} đứng chờ ở hành lang dài, tay cầm khăn nhẹ.\nThấy bóng bệ hạ, nàng bước tới cúi đầu.\n> Thần thiếp xin bệ hạ cho gặp một lát, có chuyện nhỏ muốn thưa.", "Hành lang vắng người sau buổi chầu, {name} đứng dựa cột chờ.\nKhi bệ hạ đi ngang, nàng khẽ gọi.\n> Thiếp xin bệ hạ dừng chân chốc lát, thần thiếp có lời muốn nói.", "{name} đứng ngoài hành lang, mắt dõi về phía cửa triều.\nThấy bệ hạ bước ra, nàng mỉm cười nhẹ.\n> Thần thiếp xin được hầu bệ hạ một chút, có chuyện vui muốn kể."],
    tienCu: ["{name} quỳ xuống trước bệ hạ, giọng nhẹ nhàng thưa chuyện.\nNàng nhắc đến biểu muội ở quê đã lớn.\n> Biểu muội của thần thiếp tính tình dịu dàng, chữ nghĩa cũng khá, xin bệ hạ cho vào cung.", "{name} hầu bên cạnh, khẽ nói về người thân ở quê.\nNàng kể biểu muội đã đến tuổi xuất giá.\n> Thiếp thấy biểu muội thông minh lại chịu khó, xin bệ hạ xét cho vào cung.", "{name} cúi đầu thưa, tay cầm phong thư từ quê gửi đến.\nNàng khen biểu muội một hồi.\n> Biểu muội thần thiếp múa đẹp, giọng hát cũng hay, xin bệ hạ nhận vào cung."],
    tranhSung: ["{name} và {name2} cùng bưng khay điểm tâm đến trước bệ hạ.\nMột bên là bánh hoa sen, một bên là cháo hạt sen, cả hai đều nhìn bệ hạ chờ chọn.", "{name} dâng đĩa bánh ngọt, {name2} dâng tô canh nóng.\nHai nàng đứng cạnh nhau, khay trên tay, để bệ hạ tự quyết định dùng món nào trước.", "{name} và {name2} cùng mang trà và điểm tâm sáng đến ngự án.\nHai khay đặt song song, cả hai nàng đều mỉm cười chờ bệ hạ chọn."],
    game: {"win": ["Bệ hạ thắng ván chơi, {name} nhìn bệ hạ rồi cúi đầu.\nNàng mỉm cười nhẹ, giọng dịu dàng.\n> Bệ hạ chơi hay quá, thần thiếp xin được gỡ lại ván khác.", "Ván chơi kết thúc, bệ hạ thắng, {name} thu dọn đồ chơi.\nNàng nhìn bệ hạ, mắt sáng.\n> Thiếp phục rồi, xin bệ hạ cho thiếp được đánh lại.", "{name} thua ván chơi, tay thu dọn đồ chơi.\nNàng khẽ cười, giọng vui.\n> Bệ hạ thắng đẹp, thần thiếp hẹn lần sau sẽ gỡ."], "draw": ["Ván chơi hòa, {name} nhìn bệ hạ rồi mỉm cười.\nNàng thu dọn đồ chơi, giọng nhẹ.\n> Hòa rồi, thiếp và bệ hạ ngang tài nhau.", "Kết thúc hòa, {name} thu dọn đồ chơi, mắt nhìn bệ hạ.\nNàng cười khẽ.\n> Hòa thế này cũng vui, thần thiếp xin được chơi tiếp.", "{name} và bệ hạ hòa ván, nàng đặt đồ chơi xuống.\nGiọng nàng dịu dàng.\n> Hòa rồi, thiếp thấy vui lắm."], "lose": ["{name} thắng ván cuối, nàng cười vui, vỗ tay khe khẽ.\nNàng nhìn bệ hạ, giọng trêu nhẹ.\n> Lần này thiếp thắng, bệ hạ phải nhận thua đó.", "{name} thắng, nàng thu dọn đồ chơi, mắt sáng rỡ.\nNàng cười khẽ, nói.\n> Thiếp thắng rồi, bệ hạ phải chịu thua lần này nhé.", "Ván chơi kết thúc, {name} thắng, nàng mỉm cười nhìn bệ hạ.\nGiọng nàng vui vẻ.\n> Thiếp thắng, xin bệ hạ cho thiếp được vui một chút."]},
    weather: {
      mua_xuan: { title: "Mưa xuân", text: ["Mưa xuân rơi lất phất ngoài hiên, {name} đứng chờ bệ hạ dưới mái hành lang.\nNàng nhìn những hạt mưa nhỏ, tay cầm ô nhẹ.", "Mưa xuân nhẹ trên sân, {name} mời bệ hạ ra hiên uống trà.\nNàng đã chuẩn bị sẵn ấm trà nóng."], label: "Đến cung {name} nghe mưa" },
      hoa_dao: { title: "Hoa đào nở", text: ["Hoa đào nở rộ trong vườn, {name} đứng dưới gốc cây chờ bệ hạ.\nNhững cánh hoa hồng rơi nhẹ quanh chân nàng.", "{name} mời bệ hạ ra vườn xem hoa đào đang nở.\nNàng đã trải chiếu dưới gốc, sẵn trà và bánh."], label: "Dạo vườn đào cùng {name}" },
      dom_dom: { title: "Đêm hè đom đóm", text: ["Đêm hè, đom đóm bay lấp lánh bên hồ sen, {name} đứng chờ bệ hạ trên cầu gỗ.\nNàng nhìn những ánh sáng nhỏ trên mặt nước.", "{name} mời bệ hạ ra hồ sen xem đom đóm đêm hè.\nNàng đã chuẩn bị ghế ngồi và trà mát."], label: "Ra hồ sen cùng {name}" },
      la_phong: { title: "Lá phong đỏ", text: ["Lá phong đỏ rơi đầy sân, {name} đứng chờ bệ hạ dưới hàng cây.\nNhững chiếc lá đỏ bay theo gió quanh váy nàng.", "{name} mời bệ hạ ra sân xem lá phong đang rơi.\nNàng cầm sẵn một chiếc lá đẹp trên tay."], label: "Ngắm lá phong cùng {name}" },
      tuyet: { title: "Tuyết đầu mùa", text: ["Tuyết đầu mùa rơi nhẹ trên mái, {name} đứng chờ bệ hạ ngoài hành lang.\nNhững bông tuyết trắng bám trên tóc nàng.", "{name} mời bệ hạ ra hiên xem tuyết đầu mùa.\nNàng đã chuẩn bị trà nóng và áo choàng."], label: "Ngắm tuyết cùng {name}" },
    },
  };
  const d5 = (s) => {
    s = s || G.state;
    if (!s.d5) s.d5 = {};
    const d = s.d5;
    for (const [k, v] of Object.entries({ lastAct: {}, gameTurn: {}, weatherYear: {} })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d5 = d5;
  const one5 = (x) => G.d3one(x);

  /* ---------------- 6 · Hậu cung tự sống ---------------- */
  G.LIFE_CHANCE = 0.6; // khả năng mỗi tháng có chuyện tự diễn ra
  G.LIFE_EVENT_CHANCE = 0.35; // khả năng chuyện đó cần bệ hạ quyết
  G.LIFE_COOLDOWN = 3; // tháng, mỗi phi
  G.TIEN_CU_COST = 300;
  const free5 = (s, c) => s.turn - (d5(s).lastAct[c.id] ?? -99) >= G.LIFE_COOLDOWN;
  const mark5 = (s, ...cs) => cs.forEach((c) => (d5(s).lastAct[c.id] = s.turn));
  monthly((s, report) => {
    if (s.ended || s.consorts.length < 2 || rand() >= G.LIFE_CHANCE) return;
    const pool = s.consorts.filter((c) => free5(s, c) && c.pregnantDue == null);
    if (!pool.length) return;
    const two = () => {
      const a = pick(pool);
      const rest = pool.filter((c) => c.id !== a.id);
      return rest.length ? [a, pick(rest)] : null;
    };
    const canAsk = report.sideEvents.length < G.SIDE_MAX && rand() < G.LIFE_EVENT_CHANCE;
    if (canAsk) {
      const kind = pick(["hanhLang", "hanhLang", "tranhSung", "tienCu"]);
      if (kind === "hanhLang") {
        const c = pick(pool.filter((x) => x.affection >= 25).concat(pool).slice(0, 6));
        mark5(s, c);
        report.sideEvents.push(G.prepareEvent({
          id: "sys.hanh_lang", title: "Chờ ở hành lang", text: one5(G.D5_TEXT.hanhLang),
          choices: [
            { label: "Dừng lại trò chuyện với nàng", effects: { affection: 4, favor: 2 } },
            { label: "Đêm nay triệu nàng thị tẩm", hook: "core.thi_tam", participants: "speaker", effects: { night: true, affection: 2 } },
            { label: "Gật đầu rồi đi tiếp", effects: { affection: -1 } },
          ],
        }, { speaker: c }));
        return;
      }
      if (kind === "tranhSung") {
        const p = two();
        if (!p) return;
        mark5(s, ...p);
        const [a, b] = p;
        report.sideEvents.push(G.prepareEvent({
          id: "sys.tranh_sung", title: "Tranh sủng", text: one5(G.D5_TEXT.tranhSung),
          choices: [
            { label: "Ăn bánh của {name}", _win: a.id, _lose: b.id },
            { label: "Ăn bánh của {name2}", _win: b.id, _lose: a.id },
            { label: "Ăn cả hai, khen cả hai", effects: { favor: 1, favor2: 1, hoaKhi: 1 } },
          ],
          onChoose: (ch, sp, notes) => {
            if (!ch._win) return;
            const w = G.findConsort(ch._win);
            const l = G.findConsort(ch._lose);
            if (w) G.changeFavor(w, 3), notes.push(`Sủng ái ${w.name} +3`);
            if (l) (l.affection = clamp(l.affection - 2, 0, 100)), notes.push(`Tình cảm ${l.name} −2`);
          },
        }, { speaker: a, speaker2: b }));
        return;
      }
      if (kind === "tienCu" && s.consorts.length < 40) {
        const c = pick(pool);
        mark5(s, c);
        report.sideEvents.push(G.prepareEvent({
          id: "sys.tien_cu", title: "Xin tiến cử", text: one5(G.D5_TEXT.tienCu),
          choices: [
            { label: "Chuẩn tấu, cho nàng ấy nhập cung", cost: G.TIEN_CU_COST, effects: { recruit: 1, recruitOrigin: `Biểu muội của ${c.name}`, favor: 3, affection: 3 } },
            { label: "Hậu cung đã đủ người", effects: { affection: -1 } },
          ],
        }, { speaker: c }));
        return;
      }
    }
    // chuyện nhỏ tự diễn ra, chỉ ghi vào nhật ký
    const kind = pick(["dang_canh", "dang_canh", "ket_be", "tap_nghe", "gianh_nhau"]);
    if (kind === "ket_be" || kind === "gianh_nhau") {
      const p = two();
      if (!p) return;
      mark5(s, ...p);
      const text = G.fill(one5(G.D5_TEXT.life[kind]), { speaker: p[0], speaker2: p[1] });
      if (kind === "ket_be") G.addTinhY(p[0].id, p[1].id, 6);
      else {
        G.addStat("hoaKhi", -1);
        for (const c of p) c.affection = clamp(c.affection - 1, 0, 100);
      }
      log(text + (kind === "ket_be" ? " Tình ý hai người +6." : " Hòa khí −1."), "harem");
      return;
    }
    const c = pick(pool);
    mark5(s, c);
    if (kind === "dang_canh") {
      G.addStat("longThe", 1);
      G.changeFavor(c, 1);
    } else G.changeFavor(c, 1);
    log(G.fill(one5(G.D5_TEXT.life[kind]), { speaker: c }) + (kind === "dang_canh" ? " Long thể +1." : ""), "harem");
  });

  /* ---------------- 10 · Mini game ---------------- */
  G.MINI_GAMES = {
    dau_ho: { name: "Ném thẻ vào bình", desc: "Năm lần ném, trúng ba lần là thắng.", likes: ["Tinh nghịch", "Lanh lợi", "Hoang dã", "Phóng khoáng", "Mạnh mẽ", "Cưỡi ngựa giỏi"] },
    hoa_dang: { name: "Thả đèn hoa đăng", desc: "Chạm thật nhanh vào đèn nổi lên mặt hồ, đủ bảy chiếc là thắng.", likes: ["Lãng mạn", "Đa sầu", "Si tình", "Dịu dàng", "Ôn nhu", "Yêu biển"] },
    doi_tho: { name: "Đối thơ", desc: "Nàng ra vế trên, bệ hạ chọn vế dưới. Đối đúng hai trên ba câu là thắng.", likes: ["Đoan trang", "Sâu sắc", "Tinh tế", "Khéo nói", "Hát hay", "Giọng hát ngọt"] },
    danh_co: { name: "Đánh cờ", desc: "Cờ ba quân trên bàn chín ô. Xếp được ba quân thẳng hàng là thắng.", likes: ["Kiêu kỳ", "Hai mặt", "Lanh lợi", "Sâu sắc", "Thông minh"] },
  };
  // vế trên / vế dưới (thơ tự đặt cho game)
  G.COUPLETS = [
    ["Gió xuân lay liễu biếc", "Mưa hạ thấm sen hồng"],
    ["Trăng soi thềm ngọc lạnh", "Gió lướt rèm châu thơm"],
    ["Hoa nở bên song cửa", "Chim hót dưới mái hiên"],
    ["Đèn hồng soi bóng nguyệt", "Sáo trúc gọi hồn mây"],
    ["Non xanh in bóng nước", "Sóng biếc vỗ chân mây"],
    ["Lụa đỏ thêu đôi phượng", "Gấm vàng dệt cặp rồng"],
    ["Tuyết rơi phủ mái ngói", "Nắng chiếu ửng tường son"],
    ["Ngón tay lướt phím đàn", "Gót sen in thềm đá"],
    ["Hương lan bay khắp viện", "Bóng trúc ngả đầy sân"],
    ["Sớm mai sương đọng lá", "Chiều tà khói vờn mây"],
    ["Thiếp ngồi thêu túi gấm", "Chàng đứng ngắm trăng thanh"],
    ["Một chén trà xuân ấm", "Nửa vầng nguyệt thu trong"],
  ];
  G.canPlayGame = (c) => d5().gameTurn[c.id] !== G.state.turn;
  /** Kết quả ván chơi: outcome = "win" | "draw" | "lose" (bệ hạ thắng / hòa / nàng thắng). */
  G.miniGameResult = function (c, gameId, outcome) {
    const g = G.MINI_GAMES[gameId];
    if (!c || !g) return null;
    d5().gameTurn[c.id] = G.state.turn;
    const liked = g.likes.some((t) => c.traits.includes(t));
    const aff = { win: 5, draw: 3, lose: 3 }[outcome] + (liked ? 2 : 0);
    const fav = outcome === "win" ? 2 : 1;
    c.affection = clamp(c.affection + aff, 0, 100);
    G.changeFavor(c, fav);
    G.state.visitedThisMonth[c.id] = true;
    if (G.d3) G.d3().seen[c.id] = G.state.turn;
    log(`Bệ hạ chơi ${g.name} cùng ${c.name}.`, "harem");
    const notes = [`Tình cảm +${aff}`, `Sủng ái +${fav}`];
    if (liked) notes.push("Trò nàng thích");
    return { text: G.fill(one5(G.D5_TEXT.game[outcome]), { speaker: c }), notes };
  };

  /* ---------------- 12 · Mùa và thời tiết ---------------- */
  G.SEASONS = { xuan: "Xuân", ha: "Hạ", thu: "Thu", dong: "Đông" };
  G.seasonOf = (month) => (month <= 3 ? "xuan" : month <= 6 ? "ha" : month <= 9 ? "thu" : "dong");
  G.WEATHER = [
    { id: "mua_xuan", months: [2, 3], hook: "canh-viet.mua_xuan_mua" },
    { id: "hoa_dao", months: [3, 4], hook: "canh-viet.mua_hoa_dao" },
    { id: "dom_dom", months: [6, 7], hook: "canh-viet.mua_dom_dom" },
    { id: "la_phong", months: [9, 10], hook: "canh-viet.mua_la_phong" },
    { id: "tuyet", months: [11, 12], hook: "canh-viet.mua_tuyet" },
  ];
  G.WEATHER_CHANCE = 0.5;
  G.WEATHER_GIFT_COST = 500;
  monthly((s, report) => {
    if (s.ended || !s.consorts.length || report.sideEvents.length >= G.SIDE_MAX) return;
    const d = d5(s);
    const w = G.WEATHER.find((x) => x.months.includes(s.month) && d.weatherYear[x.id] !== s.year);
    if (!w || rand() >= G.WEATHER_CHANCE) return;
    const top = s.consorts.filter((c) => c.pregnantDue == null).sort((a, b) => b.favor - a.favor).slice(0, 4);
    if (!top.length) return;
    const c = pick(top);
    const T = G.D5_TEXT.weather[w.id];
    d.weatherYear[w.id] = s.year;
    report.sideEvents.push(G.prepareEvent({
      id: "sys.thoi_tiet", title: T.title, text: one5(T.text),
      choices: [
        { label: T.label, hook: w.hook, participants: "speaker", effects: { night: true, affection: 3 } },
        { label: "Ban thưởng cả hậu cung cùng thưởng cảnh", cost: G.WEATHER_GIFT_COST, effects: { hoaKhi: 4, favorAll: 1 } },
        { label: "Để các phi tự thưởng cảnh", effects: { danTam: 1 } },
      ],
    }, { speaker: c }));
  });

  /* ================================================================== */
  /* ĐỢT 6 · Hoạt cảnh mốc lớn                                           */
  /* ================================================================== */
  // Hàng đợi hoạt cảnh cho giao diện (không lưu vào bản lưu). UI lấy ra bằng G.takeFx().
  G.fxQueue = [];
  G.pushFx = (fx) => {
    if (G.fxQueue.length < 6) G.fxQueue.push(fx);
  };
  G.takeFx = () => G.fxQueue.splice(0);
  const birthD6 = G.birth;
  G.birth = function (c) {
    const kids = birthD6(c);
    if (kids && kids.length) G.pushFx({ type: "petals", text: `${c.name} hạ sinh ${kids.length > 1 ? kids.length + " con" : kids[0].sex === "m" ? "hoàng tử" : "công chúa"}` });
    return kids;
  };
  const buildD6 = G.build;
  G.build = function (bid) {
    const r = buildD6(bid);
    if (r && r.ok) G.pushFx({ type: "stamp", text: "Khánh thành", sub: (R.buildings[bid] || {}).name });
    return r;
  };
  const ruleD6 = G.toggleRule;
  G.toggleRule = function (id) {
    const ok = ruleD6(id);
    if (ok && G.ruleEnabled(id)) G.pushFx({ type: "stamp", text: "Ban lệ", sub: (R.rules[id] || {}).name });
    return ok;
  };

  /* ---------------- Bản đồ hậu cung ---------------- */
  G.PALACES = {
    east: ["Ngưng Hương cung", "Thính Vũ cung", "Tê Phượng cung", "Lâm Nguyệt cung", "Vọng Xuân cung", "Hàm Yên cung"],
    west: ["Lưu Vân cung", "Bích Đào cung", "Tuyết Mai cung", "Thu Thủy cung", "Cẩm Tú cung", "Lan Chi cung"],
  };
  /** Mỗi phi ở một cung cố định (lưu lại), Hoàng hậu ở Khôn Ninh cung. */
  G.palaceMap = function () {
    const s = G.state;
    if (!s.d6) s.d6 = {};
    if (!s.d6.home) s.d6.home = {};
    const home = s.d6.home;
    const east = G.PALACES.east.map((name, i) => ({ id: "e" + i, name }));
    const west = G.PALACES.west.map((name, i) => ({ id: "w" + i, name }));
    const queen = { id: "kn", name: "Khôn Ninh cung", kind: "queen" };
    const all = east.concat(west, [queen]);
    const six = east.concat(west);
    const residents = {};
    for (const p of all) residents[p.id] = [];
    const ids = new Set(s.consorts.map((c) => c.id));
    for (const k of Object.keys(home)) if (!ids.has(k)) delete home[k];
    const sorted = [...s.consorts].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    for (const c of sorted) {
      if (c.rank === 7) {
        residents.kn.push(c);
        continue;
      }
      let h = home[c.id];
      if (!h || h === "kn" || !residents[h]) {
        // chọn cung ít người nhất, xen kẽ đông tây
        h = six.slice().sort((a, b) => residents[a.id].length - residents[b.id].length)[0].id;
        home[c.id] = h;
      }
      residents[h].push(c);
    }
    for (const k of Object.keys(residents)) residents[k].sort((a, b) => b.rank - a.rank || b.favor - a.favor);
    return { east, west, queen, all, residents };
  };

  /* ================================================================== */
  /* ĐỢT 7 · Cấp thân mật · Lời thì thầm · Sổ tay phòng the · Nhiều hiệp */
  /* ================================================================== */
  // Câu chữ nháp: chuỗi hoặc danh sách nhiều bản. {name} = tên nàng.
  G.D7_TEXT = {
    level: ["E thẹn", "Nồng nàn", "Buông thả"],
    levelUp: {"1": ["{name} không còn e thẹn, chủ động áp sát bệ hạ, mắt đầy dục vọng nồng nàn.", "Từ nay {name} bắt đầu chủ động gợi tình, muốn bệ hạ chiều nàng đêm nào cũng được.", "{name} hết ngượng ngùng, thì thầm những lời nồng nàn, chỉ mong thuộc về bệ hạ."], "2": ["{name} buông thả hoàn toàn, chỉ muốn bệ hạ đụ nàng đến cùng, thuộc trọn về bệ hạ.", "Từ nay {name} không còn kiêng dè, sẵn sàng mở rộng để bệ hạ chơi thỏa thích.", "{name} trở thành của riêng bệ hạ, muốn được đụ mọi lúc, không còn e ngại gì."]},
    whisper: {"0": ["Bệ hạ đưa tay chạm nhẹ lên eo {name}, nàng giật mình khẽ run, mặt đỏ bừng.\n> Thần thiếp… không dám nghĩ đến việc ấy lúc ban ngày, bệ hạ tha cho thiếp.", "{name} cúi đầu, bàn tay run run nắm chặt vạt áo khi bệ hạ vuốt má nàng.\n> Thiếp chỉ mong bệ hạ thương thiếp đêm nay thôi, ban ngày… thiếp xấu hổ lắm.", "Lòng bàn tay bệ hạ áp lên ngực {name}, nàng thở gấp, mắt liếc tránh.\n> Thần thiếp không dám nói ra, nhưng… nơi ấy của thiếp đang nóng lên rồi.", "{name} đứng nép vào cột, bệ hạ hôn lên tai nàng khiến nàng khẽ kêu.\n> Thiếp xin bệ hạ đừng chạm nữa, kẻo… kẻo thần thiếp không chịu nổi.", "Bệ hạ kéo {name} sát vào người, nàng run rẩy, môi mím chặt.\n> Thần thiếp e thẹn quá, chỉ dám mơ đến bệ hạ trong màn đêm thôi.", "{name} đỏ mặt tía tai khi bệ hạ sờ xuống dưới, nàng chỉ dám thì thầm.\n> Thiếp… thiếp muốn bệ hạ, nhưng ban ngày như thế này, thần thiếp chết mất."], "1": ["Bệ hạ xoa nắn mông {name}, nàng chủ động áp sát, hơi thở nóng.\n> Đêm qua bệ hạ làm thiếp sướng quá, thần thiếp còn muốn nữa.", "{name} nắm tay bệ hạ đặt lên ngực mình, mắt lim dim.\n> Thiếp nhớ cảm giác bệ hạ vào trong đêm qua, hôm nay cũng muốn.", "Bệ hạ hôn cổ {name}, nàng thì thầm gợi tình, tay lần vào trong áo.\n> Đêm nay bệ hạ đừng thương thiếp, hãy mạnh hơn đêm qua.", "{name} cọ người vào bệ hạ, thì thầm đầy dục vọng.\n> Thần thiếp đã ướt hết rồi, chỉ chờ bệ hạ chiều thiếp đêm nay.", "Tay bệ hạ luồn vào váy {name}, nàng rên khẽ, chủ động mở rộng.\n> Thiếp muốn bệ hạ chơi thiếp như đêm qua, sâu hơn nữa.", "{name} hôn lên cổ bệ hạ, thì thầm nồng nàn.\n> Đêm nay thần thiếp muốn bệ hạ làm thiếp đến không còn sức."], "2": ["Bệ hạ nắm ngực {name}, nàng thẳng thắn đòi hỏi, mắt đầy dục.\n> Thiếp muốn bệ hạ nhét cặc vào lồn thiếp ngay bây giờ.", "{name} quỳ xuống, tay lần vào quần bệ hạ, nói thẳng.\n> Thần thiếp muốn bú cặc bệ hạ, rồi để bệ hạ đụ thiếp đến cùng.", "Bệ hạ xoa chỗ ấy của {name}, nàng rên lớn, đòi hỏi rõ ràng.\n> Thiếp muốn bệ hạ đụ mạnh vào lồn thiếp, đừng dừng lại.", "{name} ngồi lên đùi bệ hạ, cọ xát, thì thầm tục tĩu.\n> Đêm nay bệ hạ phải bắn vào trong lồn thiếp, thiếp muốn đầy tinh.", "Bệ hạ luồn tay vào trong {name}, nàng mở chân rộng, nói thẳng.\n> Thiếp muốn bệ hạ chơi cả lỗ đít thiếp, làm thiếp nát ra.", "{name} nắm cặc bệ hạ, thì thầm đòi hỏi không ngại ngùng.\n> Thần thiếp muốn bệ hạ đụ thiếp đến khi thiếp không còn biết gì."]},
    askNight: ["{name} dâng một lọ dầu thơm, mắt lim dim đầy dục vọng.\n> Thiếp muốn bệ hạ thoa dầu khắp người thiếp rồi chơi cả đêm không nghỉ.", "{name} sai người mang đến một chiếc gối mềm, thì thầm gợi tình.\n> Đêm nay bệ hạ hãy để thiếp nằm sấp, đụ vào lỗ đít thiếp đến cùng.", "{name} dâng một sợi dây lụa, chủ động mời gọi không ngại.\n> Thần thiếp muốn bệ hạ trói tay thiếp lại rồi đụ thiếp đến khi thiếp rên không thành tiếng."],
    roundIntro: ["{name} còn thở dốc, lồn vẫn ướt nhẹp, đã lại muốn bệ hạ đụ tiếp.", "{name} nằm đó, ngực phập phồng, chủ động mở chân chờ bệ hạ vào nữa.", "{name} vừa ra, tinh vẫn chảy, nhưng đã lại cọ vào bệ hạ đòi tiếp.", "{name} thở gấp, lỗ đít còn co thắt, mắt đầy dục muốn được chơi tiếp.", "{name} chưa kịp nghỉ, đã nắm cặc bệ hạ, muốn được đụ mạnh hơn nữa.", "{name} còn run rẩy vì khoái cảm, đã lại thì thầm đòi bệ hạ vào sâu hơn."],
    canhBo: ["Lý công công dâng canh bổ, bệ hạ uống xong, cặc lại cứng ngắc sẵn sàng.", "Bệ hạ uống canh bổ xong, sức lực tràn đầy, muốn đụ {name} tiếp ngay.", "Canh bổ vào người, bệ hạ sung sức trở lại, sẵn sàng chơi {name} đến cùng."],
  };
  G.LEVEL_NEED = [null, { nights: 5, affection: 40 }, { nights: 15, affection: 60 }];
  G.LEVEL_TIER = [0, 2, 3]; // cấp này tự mở (sẵn lòng) các sở thích "cần thuyết phục" đến tầng mấy
  G.levelOf = (c) => {
    if (!c || c.isChild) return 0;
    let lv = 0;
    for (let i = 1; i < G.LEVEL_NEED.length; i++) if ((c.nights || 0) >= G.LEVEL_NEED[i].nights && c.affection >= G.LEVEL_NEED[i].affection) lv = i;
    return lv;
  };
  G.levelName = (c) => G.D7_TEXT.level[G.levelOf(c)];
  /** Còn thiếu gì để lên cấp sau: { nights, affection } hoặc null nếu đã cao nhất. */
  G.levelNext = (c) => {
    const lv = G.levelOf(c);
    const need = G.LEVEL_NEED[lv + 1];
    if (!need) return null;
    return { name: G.D7_TEXT.level[lv + 1], nights: Math.max(0, need.nights - (c.nights || 0)), affection: Math.max(0, need.affection - Math.round(c.affection)) };
  };
  const consentD7 = G.consentOf;
  G.consentOf = function (p, fid) {
    const lvl = consentD7(p, fid);
    if (lvl !== "persuade" || !G.state || !G.findConsort(p.id)) return lvl;
    const f = R.fetishes[fid];
    return f && f.tier <= G.LEVEL_TIER[G.levelOf(p)] ? "willing" : lvl;
  };

  /* ---------------- Sổ tay phòng the ---------------- */
  G.SPOTS = ["Vành tai", "Gáy", "Bầu ngực", "Eo", "Đùi trong", "Sống lưng", "Bàn chân", "Đôi môi", "Hõm cổ", "Mông"];
  G.POSES = ["Nằm ngửa ôm chặt bệ hạ", "Ngồi trên bệ hạ", "Quỳ từ phía sau", "Nằm nghiêng áp lưng", "Ngồi trong lòng đối mặt", "Đứng tựa cột", "Gác chân lên vai"];
  G.SPOT_AFTER = 3; // số đêm để biết nơi nhạy cảm
  G.POSE_AFTER = 8; // số đêm để biết tư thế nàng thích
  const hashId = (s) => {
    let h = 7;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };
  const d7 = (s) => {
    s = s || G.state;
    if (!s.d7) s.d7 = {};
    const d = s.d7;
    for (const [k, v] of Object.entries({ book: {}, night: null, askTurn: -99 })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d7 = d7;
  const bookOf = (c) => {
    const b = d7().book;
    if (!b[c.id]) b[c.id] = { first: null, last: null, firsts: {}, fx: {}, rounds: 0, maxRounds: 0 };
    return b[c.id];
  };
  /** Ghi một đêm (hoặc một hiệp) vào sổ tay. */
  function bookNight(c, fx, isRound) {
    const s = G.state;
    const b = bookOf(c);
    if (b.first == null) b.first = s.turn;
    b.last = s.turn;
    for (const f of fx || []) {
      if (b.firsts[f] == null) b.firsts[f] = s.turn;
      b.fx[f] = (b.fx[f] || 0) + 1;
    }
    if (isRound) b.rounds++;
  }
  G.bookNight = bookNight;
  /** Dữ liệu sổ tay để hiện ra. */
  G.bookView = function (c) {
    const b = bookOf(c);
    const h = hashId(c.id);
    const top = Object.entries(b.fx).sort((a, x) => x[1] - a[1]).slice(0, 3).map(([f, n]) => ({ name: (R.fetishes[f] || {}).name || f, n }));
    const firsts = Object.entries(b.firsts).sort((a, x) => x[1] - a[1]).slice(0, 8).map(([f, t]) => ({ name: (R.fetishes[f] || {}).name || f, when: G.turnLabel ? G.turnLabel(t) : t }));
    return {
      nights: c.nights || 0,
      first: b.first,
      last: b.last,
      rounds: b.rounds,
      maxRounds: b.maxRounds,
      spot: (c.nights || 0) >= G.SPOT_AFTER ? G.SPOTS[h % G.SPOTS.length] : null,
      spotLeft: Math.max(0, G.SPOT_AFTER - (c.nights || 0)),
      pose: (c.nights || 0) >= G.POSE_AFTER ? G.POSES[(h >>> 4) % G.POSES.length] : null,
      poseLeft: Math.max(0, G.POSE_AFTER - (c.nights || 0)),
      top,
      firsts,
      tried: Object.keys(b.fx).length,
    };
  };
  G.turnLabel = (t) => {
    if (t == null) return "";
    const s = G.state;
    const y = Math.floor(t / 12) + 1;
    const m = (t % 12) + 1;
    return `năm ${y} th.${m}`;
  };

  // lên cấp: báo khi vượt mốc sau mỗi đêm
  const spendD7 = G.spendNight;
  G.spendNight = function (list, opts) {
    const before = list.map((c) => G.levelOf(c));
    spendD7(list, opts);
    list.forEach((c, i) => {
      const lv = G.levelOf(c);
      if (lv > before[i]) {
        log(G.fill(G.d3one(G.D7_TEXT.levelUp[lv]), { speaker: c }) + ` ${c.name} lên cấp ${G.D7_TEXT.level[lv]}.`, "harem");
        G.pushFx && G.pushFx({ type: "stamp", text: G.D7_TEXT.level[lv], sub: c.name });
      }
    });
  };
  // đêm thị tẩm một người: ghi sổ tay và mở lượt "thêm hiệp"
  const summonD7 = G.summon;
  G.summon = function (id, fetishIds) {
    const scene = summonD7(id, fetishIds);
    if (!scene || scene.blocked) return scene;
    const c = G.findConsort(id);
    if (c) {
      const fx = (fetishIds || []).filter((f) => G.fetishUnlocked(f));
      bookNight(c, fx, false);
      d7().night = { id: c.id, turn: G.state.turn, n: G.state.nightsTotal, rounds: 0, bonus: 0 };
      scene.roundOf = c.id;
    }
    return scene;
  };

  /* ---------------- 2 · Nhiều hiệp trong một đêm ---------------- */
  G.ROUND_COST = 3; // Long thể mỗi hiệp thêm
  G.ROUND_MIN_LONGTHE = 20;
  G.CANH_BO_COST = 300;
  /** Tình trạng hiệp thêm của đêm vừa rồi với nàng. */
  G.roundState = function (c) {
    const s = G.state;
    const n = d7().night;
    if (!c || !n || n.id !== c.id || n.turn !== s.turn || n.n !== s.nightsTotal) return null;
    const max = (s.stats.longThe >= 70 ? 2 : 1) + n.bonus;
    const left = max - n.rounds;
    const why = c.pregnantDue != null && !(G.pregnantSummonOk && G.pregnantSummonOk(c)) ? "Nàng đang mang long thai." : s.stats.longThe < G.ROUND_MIN_LONGTHE ? "Long thể đã cạn, bệ hạ cần nghỉ." : left <= 0 ? "Bệ hạ đã hết sức đêm nay." : null;
    return { rounds: n.rounds, max, left, why, canBuy: !n.bonus && s.stats.longThe >= G.ROUND_MIN_LONGTHE, cost: G.CANH_BO_COST };
  };
  /** Uống canh bổ: thêm một hiệp (mỗi đêm một lần). */
  G.drinkCanhBo = function () {
    const s = G.state;
    const n = d7().night;
    if (!n || n.bonus) return null;
    if (s.stats.quocKho < G.CANH_BO_COST && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ." };
    G.addStat("quocKho", -G.CANH_BO_COST);
    G.addStat("longThe", 3);
    n.bonus = 1;
    return { ok: true, text: G.fill(G.d3one(G.D7_TEXT.canhBo), { speaker: G.findConsort(n.id) }), notes: [`Quốc khố −${G.CANH_BO_COST}`, "Long thể +3", "Thêm 1 hiệp đêm nay"] };
  };
  /** Thêm một hiệp với nàng, theo sở thích fid (hoặc đêm thường nếu fid rỗng). */
  G.extraRound = function (cid, fid) {
    const s = G.state;
    const c = G.findConsort(cid);
    const st = G.roundState(c);
    if (!st || st.why) return { title: "Không thể tiếp tục", text: (st && st.why) || "Đêm đã qua.", blocked: true };
    const fx = fid && G.fetishUnlocked(fid) && G.consentOf(c, fid) === "willing" ? [fid] : [];
    const scene = G.runHook(fx.length ? "core.thi_tam_so_thich" : "core.thi_tam", { participants: [c], fetish: fx, place: "duong_tam_dien" });
    if (scene.blocked) return scene;
    const n = d7().night;
    n.rounds++;
    const b = bookOf(c);
    b.maxRounds = Math.max(b.maxRounds, n.rounds + 1);
    bookNight(c, fx, true);
    G.addStat("longThe", -G.ROUND_COST);
    G.changeFavor(c, 3);
    c.affection = clamp(c.affection + 2, 0, 100);
    G.addStat("truyLac", 1);
    for (const f of fx) s.fetish[f] = clamp((s.fetish[f] || 0) + 3, 0, 100);
    G.tryConceive(c);
    const intro = G.fill(G.d3one(G.D7_TEXT.roundIntro), { speaker: c });
    const pages = scene.pages && scene.pages.length ? scene.pages.slice() : [scene.text || ""];
    pages[0] = intro + "\n\n" + pages[0];
    log(`Bệ hạ cùng ${c.name} thêm hiệp thứ ${n.rounds + 1}.`, "night");
    return Object.assign({}, scene, { title: `Hiệp ${n.rounds + 1} · ${c.name}`, pages, text: pages.join("\n\n"), roundOf: c.id, notes: [`Long thể −${G.ROUND_COST}`, "Sủng ái +3", "Tình cảm +2", "Trụy lạc +1"] });
  };

  // phi Buông thả tự xin thị tẩm
  G.ASK_NIGHT_CHANCE = 0.3;
  monthly((s, report) => {
    if (s.ended || report.sideEvents.length >= G.SIDE_MAX) return;
    const d = d7(s);
    if (s.turn - d.askTurn < 2 || rand() >= G.ASK_NIGHT_CHANCE) return;
    const list = s.consorts.filter((c) => G.levelOf(c) >= 2 && c.pregnantDue == null && !(G.isSulking && G.isSulking(c)));
    if (!list.length) return;
    const c = pick(list);
    const willing = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f) && G.consentOf(c, f) === "willing");
    const f = c.likes.find((x) => willing.includes(x)) || pick(willing);
    d.askTurn = s.turn;
    report.sideEvents.push(G.prepareEvent({
      id: "sys.nang_xin", title: "Nàng xin thị tẩm", text: G.d3one(G.D7_TEXT.askNight),
      choices: [
        f ? { label: `Chiều nàng: ${(R.fetishes[f] || {}).name}`, hook: "core.thi_tam_so_thich", fetish: [f], participants: "speaker", effects: { night: true, affection: 3 } } : { label: "Chiều nàng", hook: "core.thi_tam", participants: "speaker", effects: { night: true, affection: 3 } },
        { label: "Đêm nay để nàng chờ", effects: { affection: -1 } },
      ],
    }, { speaker: c }));
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
