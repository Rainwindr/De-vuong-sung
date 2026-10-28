/*
 * Đợt 7: Cấp thân mật, Lời thì thầm, Sổ tay phòng the, Nhiều hiệp, Danh hiệu phòng the.
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
  /* ĐỢT 7 · Cấp thân mật · Lời thì thầm · Sổ tay phòng the · Nhiều hiệp */
  /* ================================================================== */
  // Câu chữ nháp: chuỗi hoặc danh sách nhiều bản. {name} = tên nàng.
  G.D7_TEXT = {
    level: ["E thẹn", "Nồng nàn", "Buông thả"],
    levelUp: {"1": ["{name} không còn e thẹn, chủ động áp sát bệ hạ, mắt đầy dục vọng nồng nàn.", "Từ nay {name} bắt đầu chủ động gợi tình, muốn bệ hạ chiều nàng đêm nào cũng được.", "{name} hết ngượng ngùng, thì thầm những lời nồng nàn, chỉ mong thuộc về bệ hạ."], "2": ["{name} buông thả hoàn toàn, chỉ muốn bệ hạ đụ nàng đến cùng, thuộc trọn về bệ hạ.", "Từ nay {name} không còn kiêng dè, sẵn sàng mở rộng để bệ hạ chơi thỏa thích.", "{name} trở thành của riêng bệ hạ, muốn được đụ mọi lúc, không còn e ngại gì."]},
    whisper: {"0": ["Bệ hạ đưa tay chạm nhẹ lên eo {name}, nàng giật mình khẽ run, mặt đỏ bừng.\n> Thần thiếp… không dám nghĩ đến việc ấy lúc ban ngày, bệ hạ tha cho thiếp.", "{name} cúi đầu, bàn tay run run nắm chặt vạt áo khi bệ hạ vuốt má nàng.\n> Thiếp chỉ mong bệ hạ thương thiếp đêm nay thôi, ban ngày… thiếp xấu hổ lắm.", "Lòng bàn tay bệ hạ áp lên ngực {name}, nàng thở gấp, mắt liếc tránh.\n> Thần thiếp không dám nói ra, nhưng… nơi ấy của thiếp đang nóng lên rồi.", "{name} đứng nép vào cột, bệ hạ hôn lên tai nàng khiến nàng khẽ kêu.\n> Thiếp xin bệ hạ đừng chạm nữa, kẻo… kẻo thần thiếp không chịu nổi.", "Bệ hạ kéo {name} sát vào người, nàng run rẩy, môi mím chặt.\n> Thần thiếp e thẹn quá, chỉ dám mơ đến bệ hạ trong màn đêm thôi.", "{name} đỏ mặt tía tai khi bệ hạ sờ xuống dưới, nàng chỉ dám thì thầm.\n> Thiếp… thiếp muốn bệ hạ, nhưng ban ngày như thế này, thần thiếp chết mất."], "1": ["Bệ hạ xoa nắn mông {name}, nàng chủ động áp sát, hơi thở nóng.\n> Đêm qua bệ hạ làm thiếp sướng quá, thần thiếp còn muốn nữa.", "{name} nắm tay bệ hạ đặt lên ngực mình, mắt lim dim.\n> Thiếp nhớ cảm giác bệ hạ vào trong đêm qua, hôm nay cũng muốn.", "Bệ hạ hôn cổ {name}, nàng thì thầm gợi tình, tay lần vào trong áo.\n> Đêm nay bệ hạ đừng thương thiếp, hãy mạnh hơn đêm qua.", "{name} cọ người vào bệ hạ, thì thầm đầy dục vọng.\n> Thần thiếp đã ướt hết rồi, chỉ chờ bệ hạ chiều thiếp đêm nay.", "Tay bệ hạ luồn vào váy {name}, nàng rên khẽ, chủ động mở rộng.\n> Thiếp muốn bệ hạ chơi thiếp như đêm qua, sâu hơn nữa.", "{name} hôn lên cổ bệ hạ, thì thầm nồng nàn.\n> Đêm nay thần thiếp muốn bệ hạ làm thiếp đến không còn sức."], "2": ["Bệ hạ nắm ngực {name}, nàng thẳng thắn đòi hỏi, mắt đầy dục.\n> Thiếp muốn bệ hạ nhét cặc vào lồn thiếp ngay bây giờ.", "{name} quỳ xuống, tay lần vào quần bệ hạ, nói thẳng.\n> Thần thiếp muốn bú cặc bệ hạ, rồi để bệ hạ đụ thiếp đến cùng.", "Bệ hạ xoa chỗ ấy của {name}, nàng rên lớn, đòi hỏi rõ ràng.\n> Thiếp muốn bệ hạ đụ mạnh vào lồn thiếp, đừng dừng lại.", "{name} ngồi lên đùi bệ hạ, cọ xát, thì thầm tục tĩu.\n> Đêm nay bệ hạ phải bắn vào trong lồn thiếp, thiếp muốn đầy tinh.", "Bệ hạ luồn tay vào trong {name}, nàng mở chân rộng, nói thẳng.\n> Thiếp muốn bệ hạ chơi cả lỗ đít thiếp, làm thiếp nát ra.", "{name} nắm cặc bệ hạ, thì thầm đòi hỏi không ngại ngùng.\n> Thần thiếp muốn bệ hạ đụ thiếp đến khi thiếp không còn biết gì."]},
    askNight: ["{name} sai người dâng một chiếc khăn lụa đỏ thẫm, kèm lời mời nồng nhiệt.\n> Đêm nay thần thiếp muốn bệ hạ dùng chiếc khăn này che mắt thiếp rồi đụ mạnh.", "{name} dâng một lọ dầu thơm, mắt lim dim đầy dục vọng.\n> Thiếp muốn bệ hạ thoa dầu khắp người thiếp rồi chơi cả đêm không nghỉ.", "{name} sai người mang đến một chiếc gối mềm, thì thầm gợi tình.\n> Đêm nay bệ hạ hãy để thiếp nằm sấp, đụ vào lỗ đít thiếp đến cùng.", "{name} dâng một sợi dây lụa, chủ động mời gọi không ngại.\n> Thần thiếp muốn bệ hạ trói tay thiếp lại rồi đụ thiếp đến khi thiếp rên không thành tiếng."],
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

  /* ---------------- Trùng tu cung ---------------- */
  G.PALACE_UP_COST = [800, 1500, 2500]; // lên cấp 1, 2, 3
  G.palaceLevel = (pid) => (G.state.d6 && G.state.d6.up && G.state.d6.up[pid]) || 0;
  G.upgradePalace = function (pid) {
    const s = G.state;
    if (!s.d6) s.d6 = {};
    if (!s.d6.up) s.d6.up = {};
    const lv = G.palaceLevel(pid);
    const cost = G.PALACE_UP_COST[lv];
    const M = G.palaceMap();
    const p = M.all.find((x) => x.id === pid);
    if (!p || cost == null) return { ok: false, text: "Cung đã trùng tu đến mức cao nhất." };
    if (s.stats.quocKho < cost && !s.godFlags.infiniteMoney) return { ok: false, text: "Quốc khố không đủ." };
    G.addStat("quocKho", -cost);
    s.d6.up[pid] = lv + 1;
    for (const c of M.residents[pid] || []) c.affection = clamp(c.affection + 5, 0, 100);
    log(`Trùng tu ${p.name} lên bậc ${lv + 1}.`, "milestone");
    G.pushFx && G.pushFx({ type: "stamp", text: "Trùng tu", sub: p.name });
    return { ok: true, text: `${p.name} được trùng tu: mái lợp ngói lưu ly, vườn trồng thêm hoa, nội thất thay mới. Người ở trong cung vui mừng khôn xiết.`, notes: [`Quốc khố −${cost}`, `Bậc ${lv + 1}/3`, "Người ở Tình cảm +5", `Mỗi tháng Tình cảm +${lv + 1}`] };
  };
  monthly((s) => {
    if (!s.d6 || !s.d6.up) return;
    const M = G.palaceMap();
    for (const [pid, lv] of Object.entries(s.d6.up)) for (const c of M.residents[pid] || []) c.affection = clamp(c.affection + lv, 0, 100);
  });
})();
