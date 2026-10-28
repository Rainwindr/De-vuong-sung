/*
 * Đợt 11: Trò chơi thêm (xúc xắc, bắn cung, trò trong cảnh, thi tài, vòng quay, kỷ lục).
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
  /* ĐỢT 11 · Trò chơi thêm: xúc xắc, bắn cung, trò trong cảnh, thi tài  */
  /* ================================================================== */
  G.MINI_GAMES.xuc_xac = { name: "Xúc xắc thưởng phạt", desc: "Gieo ba lần, mỗi mặt là một việc nàng phải làm cho bệ hạ.", likes: ["Táo bạo", "Tinh nghịch", "Phóng khoáng", "Nồng nàn", "Hoang dã"] };
  G.MINI_GAMES.ban_cung = { name: "Bắn cung", desc: "Năm mũi tên, bắn khi tâm bia trùng ống ngắm. Trúng ba là thắng.", likes: ["Mạnh mẽ", "Cưỡi ngựa giỏi", "Hoang dã", "Phóng khoáng", "Lanh lợi"] };
  // Câu chữ nháp, chờ Grok. {name} = tên nàng.
  G.D11_TEXT = {
    dice: {
      1: ["{name} đỏ mặt, nhón chân hôn lên môi bệ hạ một cái thật lâu."],
      2: ["{name} đứng dậy múa một điệu ngắn, tà áo xoay tung."],
      3: ["{name} cắn môi, tự tay cởi một lớp áo ngoài đặt sang bên."],
      4: ["{name} ngồi hẳn lên đùi bệ hạ, vòng tay qua cổ người."],
      5: ["{name} ghé tai bệ hạ thì thầm một câu khiến người bật cười."],
      6: ["{name} kéo tay bệ hạ đặt lên eo mình, mắt long lanh chờ đợi."],
    },
    undress: [
      ["{name} để bệ hạ cởi áo khoác ngoài, vai trần lộ ra dưới ánh đèn."],
      ["Lớp áo trong mỏng tang tuột xuống, {name} khẽ rùng mình."],
      ["Chiếc yếm cuối cùng rơi xuống, {name} đỏ mặt nhưng không che lại."],
    ],
    undressFail: ["{name} thẹn, kéo vạt áo lại, cười khúc khích."],
    undressDone: ["{name} trần trụi trước mặt bệ hạ, hơi thở đã gấp."],
    rhythmWin: ["Theo đúng nhịp thở của nàng, {name} lên đỉnh dữ dội, cả người run lên trong vòng tay bệ hạ."],
    edgeWin: ["Bệ hạ giữ {name} ở sát mép cực điểm thật lâu, rồi mới buông, nàng lên đỉnh mạnh đến lả người."],
    edgeFail: ["{name} không chịu nổi nữa, lên đỉnh sớm hơn bệ hạ muốn."],
    spotHot: ["{name} rên khẽ, cả người co lại.\n> Chỗ ấy… bệ hạ tìm ra rồi."],
    giftBack: {
      canh: ["{name} vui quá, tặng lại bệ hạ một bát canh bổ tự tay nấu."],
      tui: ["{name} tặng bệ hạ một túi thơm tự thêu, hương thơm làm người khoan khoái."],
    },
    contestWin: ["{name} thắng cuộc, các tỷ muội vừa ghen vừa phục. Đêm nay nàng được hầu bệ hạ."],
  };
  // Bản Grok (ghép 2026-10-27)
  G.D11_TEXT.dice = {"1": ["{name} hôn môi bệ hạ, lưỡi nàng liếm nhẹ nuốt tiếng thở của trẫm.", "{name} áp môi mềm hôn sâu, tay vuốt ve cổ trẫm đầy dục.", "{name} hôn trẫm nồng nàn, lưỡi quấn lấy lưỡi bệ hạ."], "2": ["{name} múa eo uốn lượn, váy xẻ lộ đùi trắng mịn trước mặt trẫm.", "{name} xoay người khêu gợi, mắt nhìn bệ hạ đầy ham muốn.", "{name} múa chậm rãi, tay vuốt từ ngực xuống bụng khiến trẫm cứng."], "3": ["{name} tự cởi áo ngoài, để lộ yếm mỏng che vú.", "{name} từ từ trút lớp áo, da thịt nóng hiện ra trước trẫm.", "{name} cởi một lớp, cười duyên nhìn bệ hạ."], "4": ["{name} ngồi lên đùi trẫm, cọ xát háng ướt vào chỗ cứng.", "{name} áp mông lên đùi bệ hạ, ma sát khiến thiếp rên nhẹ.", "{name} ngồi cọ xát, cảm nhận dương vật trẫm nung nóng."], "5": ["{name} ghé tai thì thầm: thiếp muốn bị đụ đến chảy nước hết.", "{name} thì thầm tục: lồn thiếp đang ngứa, mong trẫm liếm.", "{name} rên bên tai: cho thiếp bú cặc bệ hạ đi."], "6": ["{name} dẫn tay trẫm đặt lên vú mềm, núm đã cứng.", "{name} kéo tay bệ hạ xuống nơi kín, ướt nhẹp dâm thủy.", "{name} đặt tay trẫm lên ngực nắn nhẹ, thiếp thở gấp."]};
  G.D11_TEXT.undress = [["Bệ hạ cởi áo khoác ngoài của {name}, lộ da vai trắng.", "Trẫm trút lớp áo ngoài {name}, nàng thở gấp nhìn trẫm.", "Bệ hạ cởi áo ngoài, {name} cười khêu gợi."], ["Trẫm cởi áo trong mỏng của {name}, thấy yếm che vú.", "Bệ hạ kéo áo trong, da thịt {name} nóng hổi run lên.", "Trẫm cởi lớp trong, {name} đỏ mặt nhưng không che."], ["Bệ hạ cởi chiếc yếm cuối, vú {name} lộ ra đầy đủ.", "Trẫm tháo yếm, núm vú {name} cứng ngắc chờ chạm.", "Bệ hạ cởi yếm, {name} trần nửa thân trên nhìn trẫm."]];
  G.D11_TEXT.undressFail = ["{name} thẹn thùng kéo áo che lại, cười e lệ nhìn trẫm.", "{name} đỏ mặt che ngực, mắt liếc bệ hạ đầy ngượng.", "{name} kéo vải che lại, cười khúc khích không dám nhìn."];
  G.D11_TEXT.undressDone = ["{name} trần truồng trước mặt trẫm, lồn đã ướt chờ đụ.", "{name} khỏa thân, nước dâm chảy dài, mắt cầu xin bệ hạ.", "{name} trần hết, vú và háng lộ, thiếp chờ trẫm vào."];
  G.D11_TEXT.rhythmWin = ["Bệ hạ đụ đúng nhịp thở {name}, nàng lên đỉnh dữ dội co giật.", "Trẫm thúc theo hơi thở, {name} rên la đạt cực khoái mạnh.", "Đụ nhịp nhàng, {name} lên đỉnh, nước bắn ướt hết.", "Trẫm vào ra đúng nhịp, {name} sảng khoái lên đỉnh lả người."];
  G.D11_TEXT.edgeWin = ["Bệ hạ giữ {name} sát mép lâu rồi cho lên, nàng lả đi.", "Trẫm kìm sát cực điểm, {name} cuối cùng lên đỉnh tan chảy.", "Giữ mép thật lâu, {name} lên đỉnh kiệt sức rên nhỏ.", "Bệ hạ không cho lên sớm, {name} đạt đỉnh lả người."];
  G.D11_TEXT.edgeFail = ["{name} không kìm được, lên đỉnh sớm hơn trẫm muốn.", "{name} đạt đỉnh trước, rên lớn nước ướt hết đùi.", "{name} lên đỉnh sớm, co giật không kịp kìm."];
  G.D11_TEXT.spotHot = ["Bệ hạ vừa chạm đúng chỗ nhạy nhất của {name}.\n> A… thần thiếp lên đỉnh rồi!", "Ngón tay trẫm chạm đúng hạt của {name}.\n> Ôi… thiếp chịu không nổi nữa!", "Bệ hạ vuốt đúng điểm nhạy của {name}.\n> Bệ hạ ơi… thiếp muốn bị đụ ngay!"];
  G.D11_TEXT.giftBack = {"canh": ["{name} vui tặng bát canh bổ tự nấu để đêm nay trẫm sung sức.", "{name} dâng canh bổ, mong bệ hạ đụ thiếp mạnh hơn đêm nay."], "tui": ["{name} tặng túi thơm tự thêu cho bệ hạ.", "{name} trao túi thơm, hương của thiếp dành cho trẫm."]};
  G.D11_TEXT.contestWin = ["{name} thắng cuộc thi, được hầu trẫm đêm nay, các phi ghen tị.", "{name} thắng, được hầu bệ hạ, phi khác đỏ mắt nhìn.", "{name} thắng thi giữa các phi, đêm nay thiếp hầu bệ hạ."];
  const d11 = (s) => {
    s = s || G.state;
    if (!s.d11) s.d11 = {};
    const d = s.d11;
    for (const [k, v] of Object.entries({ best: {}, canhFree: 0, spotTurn: {}, thiTurn: -1 })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d11 = d11;
  G.diceText = (face, c) => G.fill(G.d3one(G.D11_TEXT.dice[face]), { speaker: c });

  /* ---- 11 · kỷ lục và danh hiệu trò chơi ---- */
  G.GAME_TITLES = [
    { id: "than_xa", name: "Thần xạ", desc: "Bắn cung hoặc Ném thẻ trúng 5/5", test: (b) => (b.ban_cung || 0) >= 5 || (b.dau_ho || 0) >= 5 },
    { id: "den_hoa", name: "Đèn hoa vạn chiếc", desc: "Thả đèn hoa đăng 12 chiếc", test: (b) => (b.hoa_dang || 0) >= 12 },
    { id: "thi_nhan", name: "Thi nhân", desc: "Đối thơ đúng 3/3", test: (b) => (b.doi_tho || 0) >= 3 },
    { id: "ky_vuong", name: "Kỳ vương", desc: "Thắng 5 ván cờ", test: (b) => (b.danh_co_win || 0) >= 5 },
    { id: "nhip_dieu", name: "Nhịp điệu phòng the", desc: "Nhịp phòng the thành công 5 lần", test: (b) => (b.rhythm_win || 0) >= 5 },
    { id: "kim_con", name: "Bậc thầy kìm cơn", desc: "Kìm cơn thành công 5 lần", test: (b) => (b.edge_win || 0) >= 5 },
  ];
  /** Ghi điểm một ván: với trò đếm số thì giữ số cao nhất, với trò đếm lần thắng thì cộng dồn. */
  G.recordGame = function (key, val, mode) {
    const b = d11().best;
    if (mode === "add") b[key] = (b[key] || 0) + (val || 1);
    else if (val > (b[key] || 0)) b[key] = val;
    const got = (G.state.gameTitles = G.state.gameTitles || {});
    for (const t of G.GAME_TITLES)
      if (got[t.id] == null && t.test(b)) {
        got[t.id] = G.state.turn;
        log(`Danh hiệu trò chơi: ${t.name} (${t.desc}).`, "milestone");
        G.pushFx && G.pushFx({ type: "stamp", text: t.name, sub: "Danh hiệu trò chơi" });
      }
  };
  G.gameTitles = () => G.GAME_TITLES.map((t) => Object.assign({}, t, { done: (G.state.gameTitles || {})[t.id] != null }));

  /* ---- 12 · thắng thì nàng tặng lại ---- */
  G.GIFT_BACK_CHANCE = 0.35;
  const mgD11 = G.miniGameResult;
  G.miniGameResult = function (c, gameId, outcome) {
    const r = mgD11(c, gameId, outcome);
    if (!r) return r;
    if (gameId === "danh_co" && outcome === "win") G.recordGame("danh_co_win", 1, "add");
    if (outcome === "win" && rand() < G.GIFT_BACK_CHANCE) {
      if (rand() < 0.5) {
        d11().canhFree++;
        r.text += "\n\n" + G.fill(G.d3one(G.D11_TEXT.giftBack.canh), { speaker: c });
        r.notes.push("Được 1 bát canh bổ (dùng miễn phí khi thêm hiệp)");
      } else {
        G.addStat("longThe", 3);
        r.text += "\n\n" + G.fill(G.d3one(G.D11_TEXT.giftBack.tui), { speaker: c });
        r.notes.push("Túi thơm: Long thể +3");
      }
    }
    return r;
  };
  // canh bổ được tặng: uống miễn phí
  const drinkD11 = G.drinkCanhBo;
  G.drinkCanhBo = function () {
    const d = d11();
    if (d.canhFree > 0 && G.state.d7 && G.state.d7.night && !G.state.d7.night.bonus) {
      const qk = G.state.stats.quocKho;
      G.state.stats.quocKho += G.CANH_BO_COST; // bù lại tiền, vì canh được tặng
      const r = drinkD11();
      if (r && r.ok) {
        d.canhFree--;
        r.notes = r.notes.filter((x) => !x.startsWith("Quốc khố")).concat([`Canh được tặng (còn ${d.canhFree})`]);
      } else G.state.stats.quocKho = qk;
      return r;
    }
    return drinkD11();
  };

  /* ---- 5, 6, 8 · trò trong cảnh ---- */
  /** Kết quả trò trong cảnh: trả về câu chèn vào trang sau và ghi chú. */
  G.sceneGame = function (cid, kind, ok) {
    const c = G.findConsort(cid);
    if (!c) return null;
    const T = G.D11_TEXT;
    const notes = [];
    let line = "";
    if (kind === "rhythm" && ok) {
      G.changeFavor(c, 4);
      c.affection = clamp(c.affection + 2, 0, 100);
      line = T.rhythmWin;
      notes.push("Đúng nhịp: Sủng ái +4, Tình cảm +2");
      G.recordGame("rhythm_win", 1, "add");
    } else if (kind === "edge") {
      if (ok) {
        G.changeFavor(c, 5);
        G.addStat("truyLac", 1);
        line = T.edgeWin;
        notes.push("Kìm cơn: Sủng ái +5, Trụy lạc +1");
        G.recordGame("edge_win", 1, "add");
      } else line = T.edgeFail;
    } else if (kind === "undress" && ok) {
      c.affection = clamp(c.affection + 2, 0, 100);
      line = T.undressDone;
      notes.push("Cởi hết: Tình cảm +2");
    }
    return { line: line ? G.fill(G.d3one(line), { speaker: c }) : "", notes };
  };

  /* ---- 7 · tìm nơi nhạy cảm ---- */
  G.canSearchSpot = (c) => d11().spotTurn[c.id] !== G.state.turn;
  G.spotIndex = (c) => {
    let h = 7;
    for (const ch of String(c.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h % G.SPOTS.length; // trùng với Sổ tay
  };
  G.spotFound = function (c, ok) {
    d11().spotTurn[c.id] = G.state.turn;
    if (!ok) return { notes: ["Chưa tìm ra, tháng sau thử lại"] };
    const b = G.state.d7 && G.state.d7.book && G.state.d7.book[c.id];
    if (b) b.spotFound = true;
    else {
      G.bookNight && G.bookNight(c, [], false);
      G.state.d7.book[c.id].spotFound = true;
    }
    c.affection = clamp(c.affection + 3, 0, 100);
    return { text: G.fill(G.d3one(G.D11_TEXT.spotHot), { speaker: c }), notes: [`Nơi nhạy cảm: ${G.SPOTS[G.spotIndex(c)]}`, "Tình cảm +3", "Đã ghi vào Sổ tay"] };
  };
  const bookViewD11 = G.bookView;
  G.bookView = function (c) {
    const v = bookViewD11(c);
    const b = G.state.d7 && G.state.d7.book && G.state.d7.book[c.id];
    if (b && b.spotFound && !v.spot) Object.assign(v, { spot: G.SPOTS[G.spotIndex(c)], spotLeft: 0 });
    return v;
  };

  /* ---- 9 · các phi thi tài ---- */
  G.THI_GAMES = ["dau_ho", "hoa_dang", "ban_cung", "doi_tho"];
  G.canThiTai = () => d11().thiTurn !== G.state.turn && G.state.consorts.filter((c) => !G.cannotSummon(c)).length >= 2;
  /** Các phi thi một trò, trả về bảng xếp hạng [{ c, score }] (người đầu là người thắng). */
  G.thiTai = function (gameId) {
    const g = G.MINI_GAMES[gameId];
    const list = G.state.consorts.filter((c) => !G.cannotSummon(c)).sort((a, b) => b.favor - a.favor).slice(0, 4);
    if (!g || list.length < 2) return null;
    d11().thiTurn = G.state.turn;
    const max = { dau_ho: 5, ban_cung: 5, hoa_dang: 12, doi_tho: 3 }[gameId] || 5;
    const ranked = list
      .map((c) => {
        const bonus = g.likes.some((t) => c.traits.includes(t)) ? 0.25 : 0;
        const score = Math.min(max, Math.round(max * clamp(0.25 + rand() * 0.6 + bonus, 0, 1)));
        return { c, score };
      })
      .sort((a, b) => b.score - a.score || b.c.favor - a.c.favor);
    const win = ranked[0].c;
    G.changeFavor(win, 5);
    win.affection = clamp(win.affection + 3, 0, 100);
    for (const r of ranked.slice(1)) r.c.affection = clamp(r.c.affection + 1, 0, 100);
    log(`Hậu cung thi ${g.name}: ${win.name} đứng nhất.`, "harem");
    G.pushFx && G.pushFx({ type: "fireworks", id: win.id, text: `${win.name} thắng ${g.name}` });
    return { game: g, max, ranked, text: G.fill(G.d3one(G.D11_TEXT.contestWin), { speaker: win }), notes: [`${win.name}: Sủng ái +5, Tình cảm +3`, "Các phi khác: Tình cảm +1"] };
  };

  /* ---- 10 · vòng quay hậu cung ---- */
  G.spinPool = () => G.state.consorts.filter((c) => !G.cannotSummon(c)).sort((a, b) => b.favor - a.favor).slice(0, 8);
  /** Quay ra một phi và một sở thích nàng sẵn lòng (có thể rỗng = đêm thường). */
  G.spinWheel = function () {
    const pool = G.spinPool();
    if (!pool.length) return null;
    const i = Math.floor(rand() * pool.length);
    const c = pool[i];
    const willing = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f) && G.consentOf(c, f) === "willing");
    const f = willing.length && rand() < 0.85 ? pick(willing) : null;
    return { pool, index: i, c, fetish: f };
  };
})();
