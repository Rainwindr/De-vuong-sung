/*
 * Đợt 1 (0.4.1): Bảng vàng, Đêm nàng chọn, Phi xin ban lệ, Quẻ đầu năm.
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
})();
