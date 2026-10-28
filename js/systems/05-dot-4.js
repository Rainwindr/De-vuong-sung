/*
 * Đợt 4: Thẻ úp duyên trời, Ghen tuông, Đêm không như ý; sở thích có điều kiện.
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
})();
