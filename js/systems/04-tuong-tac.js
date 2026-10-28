/*
 * Tương tác (0.5.1): Ghé thăm có hội thoại, Lời hẹn, Nhắc việc.
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
})();
