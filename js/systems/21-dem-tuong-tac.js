/*
 * Đêm tương tác: nơi thị tẩm, đổi tư thế giữa cảnh (đổi ảnh), ra lệnh bằng lời tục, chọn chỗ xuất, sau khi xuất;
 * thư kèm tranh tự họa, cược thân, Phòng tranh xuân cung; tiểu sử phi; Thiên Đạo sáng tạo (tạo phi, dựng đêm).
 * Câu chữ do Claude viết (tạm), Grok có thể viết lại: xem G.D21_TEXT.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const R = G.registry;
  const { clamp, pick, rand } = G.util;
  const log = (t, k) => G.log(t, k);
  const monthly = (fn) => G.monthlyHooks.push(fn);
  const one = (a) => (Array.isArray(a) ? pick(a) : a);
  const fillC = (t, c) => G.fill(t, { speaker: c });

  const d21 = (s) => {
    s = s || G.state;
    if (!s.d21) s.d21 = {};
    const d = s.d21;
    for (const [k, v] of Object.entries({ place: null, bet: null, stake: {}, paintTurn: -99, conceived: null })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d21 = d21;
  const addPage = (scene, page, atStart) => {
    if (!scene || scene.blocked || !page) return scene;
    const pages = scene.pages && scene.pages.length ? scene.pages.slice() : [scene.text || ""];
    if (atStart) pages.unshift(page);
    else pages.push(page);
    scene.pages = pages;
    scene.text = pages.join("\n\n");
    return scene;
  };
  const lvl = (c) => (G.levelOf ? G.levelOf(c) : 0);
  const sinceLevel = (c) => ["Phi E thẹn", "Phi Nồng nàn", "Phi Buông thả"][lvl(c)];

  G.D21_TEXT = {
    shy: ["{name} đỏ bừng mặt, run run làm theo, mắt nhắm chặt không dám nhìn.", "{name} cắn môi, ngập ngừng một lúc lâu rồi mới chịu làm, cả người nóng ran."],
    bold: ["{name} cười khúc khích, làm ngay không cần bệ hạ nói lần hai.", "{name} liếm môi nhìn bệ hạ, làm theo một cách chậm rãi đầy cố ý."],
  };

  /* ================================================================== */
  /* Nơi thị tẩm                                                          */
  /* ================================================================== */
  G.NIGHT_PLACES = {
    "core.hoa_vien": { name: "Hoa viên riêng", fx: { affection: 2 }, intro: "Đêm nay bệ hạ đưa {name} ra hoa viên riêng. Đèn lồng treo thấp trên cành, cỏ mềm dưới lưng, hương hoa quyện vào mùi da thịt nàng." },
    "core.ho_sen": { name: "Thuyền hoa Hồ sen", fx: { favor: 2 }, intro: "Thuyền hoa trôi ra giữa hồ sen, rèm buông kín. Mỗi lần thuyền chòng chành, {name} lại bám chặt lấy bệ hạ hơn." },
    "core.phong_huong": { name: "Phòng hương", fx: { affection: 2 }, intro: "Phòng hương ngào ngạt trầm và xạ. {name} hít một hơi đã thấy người nóng lên, má ửng, mắt lúng liếng." },
    "core.san_khau": { name: "Sân khấu nhỏ", fx: { favor: 2 }, intro: "Sân khấu đêm vắng tanh, chỉ còn một ngọn đèn. Bệ hạ bảo {name} múa riêng cho mình xem, từng lớp áo rơi xuống sàn gỗ." },
    "core.me_lau": { name: "Mê Lâu", fx: { affection: 2, truyLac: 1 }, intro: "Trong Mê Lâu nghìn phòng, rèm lụa nối rèm lụa. {name} chạy trước, cười khúc khích, để bệ hạ đuổi theo tới căn phòng sâu nhất." },
    "core.ho_duc_tri": { name: "Dục Trì Thiên Hương", fx: { longThe: 2 }, intro: "Hơi nước suối nóng bốc mờ mịt trên bể ngọc. {name} trần mình trượt xuống nước, quàng tay qua cổ bệ hạ, da trơn mịn dưới tay người." },
    "core.lac_thu_dien": { name: "Phòng gương Lạc Thú điện", fx: { favor: 2, truyLac: 2 }, intro: "Bốn bức tường đều là gương. {name} nhìn đâu cũng thấy chính mình trần trụi trong vòng tay bệ hạ, xấu hổ đến mức không biết giấu mặt vào đâu." },
    "core.phong_tranh_xuan": { name: "Phòng tranh xuân cung", fx: { truyLac: 1, affection: 1 }, intro: "Bệ hạ dắt {name} đi dọc phòng tranh xuân cung. Nàng dừng lại trước một bức, nhìn rất lâu, rồi khẽ kéo tay áo bệ hạ: muốn thử giống như trong tranh." },
  };
  G.placesFor = () => Object.keys(G.NIGHT_PLACES).filter((id) => G.state && G.state.buildings && G.state.buildings[id]);
  G.setNightPlace = (cid, pid) => (d21().place = pid && G.NIGHT_PLACES[pid] ? { id: cid, place: pid } : null);
  const fxNote = (fx) => [fx.favor ? `Sủng ái +${fx.favor}` : "", fx.affection ? `Tình cảm +${fx.affection}` : "", fx.truyLac ? `Trụy lạc +${fx.truyLac}` : "", fx.longThe ? `Long thể +${fx.longThe}` : ""].filter(Boolean).join(", ");
  const applyFx = (c, fx) => {
    if (fx.favor) G.changeFavor(c, fx.favor);
    if (fx.affection) c.affection = clamp(c.affection + fx.affection, 0, 100);
    if (fx.truyLac) G.addStat("truyLac", fx.truyLac);
    if (fx.longThe) G.addStat("longThe", fx.longThe);
  };

  /* ================================================================== */
  /* Cược thân: món cược nàng phải thi hành                              */
  /* ================================================================== */
  G.STAKES = {
    khong_yem: { name: "Không mặc yếm suốt tháng tới", months: 2, line: "Dưới lớp áo mỏng, {name} không mặc yếm, đúng như món cược đã thua. Mỗi bước đi đầu ngực lại cọ vào lụa, nàng đỏ mặt suốt cả buổi." },
    coi_ao: { name: "Tự cởi áo trước khi bước vào tẩm cung", once: true, line: "Đúng như món cược, {name} đứng ngoài cửa tẩm cung tự tay cởi từng lớp áo, bước vào chỉ còn da thịt trần trụi." },
    chu_nhan: { name: "Gọi bệ hạ là chủ nhân một tháng", months: 2, line: "{name} quỳ xuống bên giường, cúi đầu thật thấp:\n> Chủ nhân, nô tỳ đến hầu người." },
    hau_tam: { name: "Hầu bệ hạ tắm, kỳ lưng bằng chính thân mình", once: true, line: "Trước khi lên giường, {name} hầu bệ hạ tắm. Nàng thoa xà phòng lên ngực mình rồi áp sát vào lưng bệ hạ mà kỳ, đúng như món cược." },
    chuong: { name: "Đeo chuông bạc cổ chân cả tháng", months: 2, line: "Tiếng chuông bạc nơi cổ chân {name} leng keng theo từng bước, ai nghe cũng biết nàng đang thua cược bệ hạ." },
  };
  G.LOSE_WISH = ["{name} thắng, đòi bệ hạ ngủ lại cả đêm ôm nàng đến sáng.", "{name} thắng, đòi bệ hạ tự tay chải tóc cho nàng.", "{name} thắng, đòi bệ hạ đút nàng ăn hết đĩa bánh hạnh nhân.", "{name} thắng, đòi bệ hạ hôn nàng một trăm cái, nàng tự đếm."];
  G.setBet = (cid, stake) => (d21().bet = stake && G.STAKES[stake] ? { id: cid, stake, turn: G.state.turn } : null);
  G.stakeOf = (c) => {
    const st = c && d21().stake[c.id];
    return st && st.until >= G.state.turn ? Object.assign({ def: G.STAKES[st.stake] }, st) : null;
  };
  const resD21 = G.miniGameResult;
  G.miniGameResult = function (c, id, outcome) {
    const r = resD21(c, id, outcome);
    const d = d21();
    const b = d.bet;
    d.bet = null;
    if (!r || !b || b.id !== c.id || b.turn !== G.state.turn) return r;
    const st = G.STAKES[b.stake];
    if (outcome === "win") {
      d.stake[c.id] = { stake: b.stake, until: G.state.turn + (st.once ? 6 : st.months || 1) };
      G.addStat("truyLac", 1);
      log(`${c.name} thua cược: ${st.name.toLowerCase()}.`, "harem");
      r.text += `\n\nNàng thua cược. Từ giờ ${c.name} phải: ${st.name.toLowerCase()}.`;
      r.notes = (r.notes || []).concat([`Cược: ${st.name}`, "Trụy lạc +1"]);
    } else if (outcome === "lose") {
      c.affection = clamp(c.affection + 4, 0, 100);
      G.changeFavor(c, 2);
      r.text += "\n\n" + fillC(one(G.LOSE_WISH), c);
      r.notes = (r.notes || []).concat(["Bệ hạ thua cược, chiều nàng: Tình cảm +4, Sủng ái +2"]);
    } else r.text += "\n\nHòa, món cược bỏ qua.";
    return r;
  };

  /* ================================================================== */
  /* Gói vào đêm: nơi thị tẩm, món cược, ghi lại thụ thai                */
  /* ================================================================== */
  const summonD21 = G.summon;
  G.summon = function (id, fetishIds) {
    const c0 = G.findConsort(id);
    const before = c0 ? c0.pregnantDue : null;
    const scene = summonD21(id, fetishIds);
    const d = d21();
    const pl = d.place;
    d.place = null;
    const c = G.findConsort(id);
    if (!scene || scene.blocked || !c) return scene;
    d.conceived = before == null && c.pregnantDue != null ? { id: c.id, turn: G.state.turn } : null;
    const notes = scene.notes || (scene.notes = []);
    const st = G.stakeOf(c);
    if (st) {
      addPage(scene, fillC(st.def.line, c), true);
      G.addStat("truyLac", 1);
      notes.push(`Thi hành cược: ${st.def.name}`);
      if (st.def.once) delete d.stake[c.id];
    }
    if (pl && pl.id === c.id) {
      const P = G.NIGHT_PLACES[pl.place];
      addPage(scene, fillC(P.intro, c), true);
      applyFx(c, P.fx);
      notes.push(`${P.name}: ${fxNote(P.fx)}`);
      scene.place = pl.place;
      if (pl.place === "core.phong_tranh_xuan") tranhInspire(c, notes);
    }
    return scene;
  };

  /* ================================================================== */
  /* Phòng tranh xuân cung                                               */
  /* ================================================================== */
  G.TRANH_ID = "core.phong_tranh_xuan";
  function tranhInspire(c, notes) {
    const list = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f) && G.consentOf(c, f) === "persuade");
    if (!list.length) return;
    const f = pick(list);
    c.consent[f] = "willing";
    notes.push(`Xem tranh xong, ${c.name} muốn thử: ${R.fetishes[f].name} (nay sẵn lòng)`);
  }
  if (G.persuadeNeed) {
    const pnD21 = G.persuadeNeed;
    G.persuadeNeed = (fid) => pnD21(fid) - (G.state && G.state.buildings[G.TRANH_ID] ? 5 : 0);
  }
  monthly((s) => {
    if (s.ended || !s.buildings[G.TRANH_ID] || rand() >= 0.2 || !s.consorts.length) return;
    const c = pick(s.consorts);
    const n = [];
    tranhInspire(c, n);
    if (n.length) log(n[0] + ".", "harem");
  });

  /* ================================================================== */
  /* Thư kèm tranh tự họa                                                */
  /* ================================================================== */
  G.PAINT_CHANCE = 0.12;
  G.PAINT_GAP = 4;
  monthly((s, report) => {
    if (s.ended || !s.consorts.length || report.sideEvents.length > (G.SIDE_MAX || 2)) return;
    const d = d21(s);
    if (s.turn - d.paintTurn < G.PAINT_GAP || rand() >= G.PAINT_CHANCE) return;
    const list = s.consorts.filter((c) => c.pregnantDue == null && !G.cannotSummon(c) && lvl(c) >= 1);
    if (!list.length) return;
    const c = pick(list);
    const art = G.sceneArtFor ? G.sceneArtFor([]) : null;
    d.paintTurn = s.turn;
    const p = G.prepareEvent(
      {
        id: "sys.thu_tranh",
        title: "Thư kèm tranh tự họa",
        text: "Cung nữ dâng lên một ống tre bọc lụa. Bên trong là một bức tranh và mảnh giấy thơm:\n> Thần thiếp tự vẽ mình cho bệ hạ xem. Trong tranh thần thiếp không mặc gì cả. Bệ hạ muốn xem thật thì đêm nay đến, thần thiếp sẽ nằm đúng như thế này chờ người.",
        choices: [
          { label: "Triệu nàng đêm nay, diễn lại bức tranh", hook: "core.thi_tam", participants: "speaker", effects: { affection: 4, favor: 4, truyLac: 1 }, _go: true },
          { label: "Cất tranh vào phòng tranh", effects: { affection: 2 } },
        ],
        onChoose: (ch) => {
          if (art && G.markArtSeen) G.markArtSeen(art.src);
          if (ch._go) d21()._paint = { art: art && art.src, intro: G.fill("Đúng như lời hẹn, {name} nằm chờ sẵn trên giường, không một mảnh vải, bày đúng tư thế trong bức tranh. Nàng không nhúc nhích, chỉ có mắt nhìn theo bệ hạ, chờ người tự tay phá vỡ bức tranh sống ấy.", { speaker: c }) };
        },
      },
      { speaker: c }
    );
    if (art) p.image = art.src;
    if (p.choices.length) report.sideEvents.push(p);
  });
  const hookD21 = G.runHook;
  G.runHook = function (id, ctxIn) {
    const scene = hookD21(id, ctxIn);
    if (!G.state) return scene;
    const d = d21();
    const pt = d._paint;
    delete d._paint;
    if (pt && scene && !scene.blocked) {
      addPage(scene, pt.intro, true);
      if (pt.art) scene.image = pt.art;
    }
    return scene;
  };

  /* ================================================================== */
  /* Trong cảnh: đổi tư thế, ra lệnh, chỗ xuất, sau khi xuất              */
  /* ================================================================== */
  G.POSES = {
    cuoi_ngua: { name: "Cưỡi ngựa", need: 0, line: ["Bệ hạ nằm ngửa, kéo {name} ngồi lên trên. Nàng chống tay lên ngực bệ hạ, tự nhấp từng nhịp, vú nảy theo mỗi lần nàng hạ người xuống.", "{name} cưỡi lên người bệ hạ, ban đầu còn ngượng, chẳng mấy chốc đã tự lắc hông như quên mất mình là ai."] },
    truyen_giao: { name: "Nằm ngửa ôm chặt", need: 0, line: ["Bệ hạ đè {name} xuống nệm, nàng vòng chân ôm lấy hông bệ hạ, kéo sâu hơn từng nhịp.", "{name} nằm ngửa, hai tay bám chặt lưng bệ hạ, mắt nhìn thẳng vào mắt người mà rên khẽ."] },
    cho_cai: { name: "Quỳ chổng mông", need: 1, line: ["Bệ hạ lật {name} lại, bắt nàng quỳ chống tay, mông chổng cao. Mỗi cú thúc từ phía sau làm nàng dúi mặt vào gối.", "{name} tự quỳ xuống, ưỡn lưng chổng mông về phía bệ hạ, ngoái lại cười mời."] },
    gac_vai: { name: "Gác chân lên vai", need: 1, line: ["Bệ hạ nhấc hai chân {name} gác lên vai, người nàng gập lại, mỗi nhịp vào sâu đến tận cùng làm nàng kêu thành tiếng.", "Hai cổ chân {name} vắt trên vai bệ hạ, nàng không còn chỗ trốn, chỉ biết nắm chặt ga giường."] },
    be_dung: { name: "Bế đứng", need: 1, line: ["Bệ hạ bế bổng {name} lên, nàng quặp chân quanh hông người. Bệ hạ cứ thế đứng mà đụ, nàng ôm cổ bệ hạ rên rỉ bên tai.", "{name} bị bế lên giữa phòng, người treo trên bệ hạ, mỗi bước đi lại thêm một cú thúc."] },
    up_thia: { name: "Nằm nghiêng úp thìa", need: 0, line: ["Hai người nằm nghiêng, bệ hạ ôm {name} từ sau lưng, vào thật chậm, tay vân vê đầu vú nàng.", "{name} nằm nghiêng gối đầu lên tay bệ hạ, chân hơi co, để bệ hạ ra vào từ phía sau, chậm mà sâu."] },
    ep_tuong: { name: "Ép vào tường", need: 2, line: ["Bệ hạ đẩy {name} áp mặt vào cột giường, kéo hông nàng ra sau mà đụ. Nàng bám cột, chân run lẩy bẩy.", "{name} bị ép sát vào tường, một chân bị nhấc cao, nàng cắn môi nén tiếng mà vẫn bật rên."] },
    cui_ban: { name: "Cúi người trên án", need: 2, line: ["Bệ hạ gạt hết tấu chương, đè {name} úp người xuống án thư, vén váy lên mà làm. Nghiên mực đổ, nàng chẳng màng.", "{name} nằm úp trên mặt bàn, mông nhô ra mép bàn, bệ hạ giữ eo nàng mà thúc từng nhịp nặng."] },
  };
  G.POSE_MAX = 3;
  G.COMMANDS = {
    banh: { label: "Banh lồn ra cho trẫm xem", need: 1, fx: { truyLac: 1 }, line: "{name} ngả người, hai tay tự banh rộng cho bệ hạ nhìn cho rõ, chỗ đó ướt đẫm, co giật theo từng hơi thở." },
    bop_vu: { label: "Tự bóp vú đi", need: 0, fx: { truyLac: 1 }, line: "{name} nâng hai bầu vú, tự bóp, tự se đầu ti cho bệ hạ xem, mỗi lần se lại rên một tiếng." },
    quay_dit: { label: "Quay đít lại", need: 0, fx: { truyLac: 1 }, line: "{name} quay người lại, chổng mông về phía bệ hạ, ngoái đầu nhìn qua vai chờ lệnh tiếp." },
    liem: { label: "Liếm sạch đi", need: 1, fx: { truyLac: 1, affection: 1 }, line: "{name} cúi xuống, thè lưỡi liếm từ gốc lên đầu, chậm rãi, mắt ngước nhìn bệ hạ không chớp." },
    ngam: { label: "Ngậm vào", need: 1, fx: { truyLac: 1 }, line: "{name} há miệng ngậm lấy, má hõm vào, mút từng nhịp, nước dãi chảy xuống cằm." },
    tu_suong: { label: "Tự sướng cho trẫm xem", need: 2, fx: { truyLac: 2 }, line: "{name} nằm ngửa, banh chân, tự đưa ngón tay vào trong mà móc, mắt không rời bệ hạ, đến khi người co giật lên đỉnh ngay trước mặt người." },
    xin: { label: "Xin trẫm đụ ngươi", need: 1, fx: { truyLac: 1, favor: 1 }, line: "{name} ôm lấy cổ bệ hạ, thở dốc:\n> Bệ hạ… xin người đụ thần thiếp. Thần thiếp chịu hết nổi rồi." },
    keu_to: { label: "Rên to lên", need: 0, fx: { affection: 1 }, line: "{name} thôi không nén nữa, rên thật to, tiếng rên vang cả tẩm cung, mỗi nhịp một tiếng." },
  };
  G.COMMAND_MAX = 3;
  G.FINISHES = {
    trong: { name: "Bắn vào trong", need: 0, line: "Bệ hạ ghì chặt hông {name}, bắn hết vào sâu bên trong. Nàng run lên, hai chân quặp chặt như không muốn để mất một giọt." },
    bung: { name: "Bắn lên bụng", need: 0, line: "Bệ hạ rút ra, bắn từng dòng nóng hổi lên bụng {name}. Nàng nhìn xuống, ngón tay vô thức vẽ vòng trên da." },
    nguc: { name: "Bắn lên vú", need: 1, line: "{name} nâng hai bầu vú đón lấy, để bệ hạ bắn đầy lên ngực mình, rồi tự xoa đều, cười ngượng." },
    lung: { name: "Bắn lên lưng", need: 1, line: "Bệ hạ bắn dọc lưng {name}, xuống tận khe mông. Nàng nằm úp, thở dốc, không dám cựa." },
    mieng: { name: "Bắn vào miệng", need: 2, line: "{name} quỳ xuống há miệng chờ. Bệ hạ bắn đầy miệng nàng, nàng nuốt ực, rồi há miệng cho bệ hạ xem đã sạch." },
    mat: { name: "Bắn lên mặt", need: 2, line: "{name} ngửa mặt nhắm mắt, để bệ hạ bắn lên má, lên môi. Nàng thè lưỡi liếm phần dính trên môi, cười mãn nguyện." },
  };
  G.AFTERS = {
    giu: { name: "Bắt nàng giữ trong, không cho chảy", need: 1, only: "trong", fx: { affection: 2 }, line: "Bệ hạ bắt {name} nằm kê mông lên gối, khép chặt đùi, không cho chảy ra giọt nào. Nàng ngoan ngoãn nằm yên, tay xoa bụng dưới.\n> Thần thiếp giữ hết cho bệ hạ." },
    liem_sach: { name: "Bắt nàng liếm sạch", need: 1, fx: { truyLac: 1, favor: 1 }, line: "{name} bò tới, liếm sạch từng chỗ còn dính, liếm cả ngón tay mình, rồi ngẩng lên:\n> Sạch rồi, bệ hạ." },
    ngam: { name: "Để nàng nằm đó cho trẫm ngắm", need: 0, fx: { affection: 1 }, line: "Bệ hạ không cho {name} lau, để nàng nằm dang tay chân giữa giường, người còn vương đầy dấu vết, mà ngắm thật lâu. Nàng đỏ mặt quay đi, nhưng không che." },
  };
  const ok = (c, it) => lvl(c) >= (it.need || 0);
  G.posesFor = (c) => Object.entries(G.POSES).filter(([, p]) => ok(c, p));
  G.commandsFor = (c) => Object.entries(G.COMMANDS).filter(([, p]) => ok(c, p));
  G.finishesFor = (c) => Object.entries(G.FINISHES).filter(([, p]) => ok(c, p));
  G.aftersFor = (c, fin) => Object.entries(G.AFTERS).filter(([, p]) => ok(c, p) && (!p.only || p.only === fin));
  G.needLabel = (n) => ["", "Cần Nồng nàn", "Cần Buông thả"][n || 0];

  /** Đổi tư thế: trả về { line, image? }. */
  G.scenePose = function (scene, poseId) {
    const c = G.findConsort(scene.roundOf);
    const P = G.POSES[poseId];
    if (!c || !P) return null;
    scene._poses = (scene._poses || 0) + 1;
    c.affection = clamp(c.affection + 1, 0, 100);
    return { line: fillC(one(P.line), c), image: G.poseArt(poseId) };
  };
  G.sceneCommand = function (scene, cmdId) {
    const c = G.findConsort(scene.roundOf);
    const K = G.COMMANDS[cmdId];
    if (!c || !K) return null;
    scene._cmds = (scene._cmds || 0) + 1;
    applyFx(c, K.fx);
    const react = fillC(one(lvl(c) >= 2 ? G.D21_TEXT.bold : G.D21_TEXT.shy), c);
    return { line: `> ${K.label}!\n` + fillC(K.line, c) + " " + react, note: `${K.label}: ${fxNote(K.fx)}` };
  };
  G.sceneFinish = function (scene, finId) {
    const c = G.findConsort(scene.roundOf);
    const F = G.FINISHES[finId];
    if (!c || !F) return null;
    scene._finish = finId;
    const notes = [];
    const d = d21();
    const conceived = d.conceived && d.conceived.id === c.id && d.conceived.turn === G.state.turn;
    if (finId !== "trong" && conceived) {
      // không bắn vào trong thì đêm nay không thụ thai
      c.pregnantDue = null;
      d.conceived = null;
    } else if (finId === "trong" && !conceived && c.pregnantDue == null && (!G.canConceive || G.canConceive(c)) && rand() < 0.04 * (G.conceiveRate ? G.conceiveRate() : 1)) {
      c.pregnantDue = G.state.turn + 9;
      log(`Thái y báo hỷ: ${c.name} hoài thai.`, "child");
      notes.push("Nàng hoài thai");
    }
    G.changeFavor(c, 1);
    return { line: fillC(F.line, c), notes };
  };
  G.sceneAfter = function (scene, aftId) {
    const c = G.findConsort(scene.roundOf);
    const A = G.AFTERS[aftId];
    if (!c || !A) return null;
    scene._after = aftId;
    applyFx(c, A.fx);
    return { line: fillC(A.line, c), note: `${A.name}: ${fxNote(A.fx)}` };
  };

  /* Ảnh theo tư thế: tu-the-<mã>.webp, tu-the-<mã>-2.webp…; thiếu thì lấy ngẫu nhiên trong kho */
  const poseCache = {};
  G.poseArt = function (poseId) {
    const base = G.SCENE_ART_REMOTE;
    const out = [];
    if (base) {
      const known = poseCache[poseId];
      if (known && known.length) out.push(pick(known));
      else if (!known) out.push(`${base}tu-the-${poseId.replace(/_/g, "-")}.webp`);
    }
    const fb = G.sceneArtFor ? G.sceneArtFor([]) : null;
    return { list: out.filter((u) => !(G.imgMissing && G.imgMissing(u))), fallback: fb && fb.src };
  };
  G.probePoses = async function () {
    const base = G.SCENE_ART_REMOTE;
    if (!base || G._posesProbed) return;
    G._posesProbed = true;
    try {
      const c = JSON.parse(sessionStorage.getItem("dvs.probe.poses") || "null");
      if (c) return Object.assign(poseCache, c);
    } catch (e) {}
    const exists = (url) =>
      new Promise((res) => {
        if (G.imgMissing && G.imgMissing(url)) return res(false);
        const im = new Image();
        const t = setTimeout(() => res(false), 8000);
        im.onload = () => (clearTimeout(t), res(true));
        im.onerror = () => (clearTimeout(t), G.markImgMissing && G.markImgMissing(url), res(false));
        im.src = url;
      });
    try {
    await Promise.all(
      Object.keys(G.POSES).map(async (id) => {
        const slug = id.replace(/_/g, "-");
        const list = [];
        for (let v = 1; v < 30; v++) {
          const u = `${base}tu-the-${slug}${v > 1 ? "-" + v : ""}.webp`;
          if (!(await exists(u))) break;
          list.push(u);
        }
        poseCache[id] = list;
      })
    );
    } catch (e) {
      return;
    }
    try {
      sessionStorage.setItem("dvs.probe.poses", JSON.stringify(poseCache));
    } catch (e) {}
  };

  if (G.sceneArtReady && typeof Image !== "undefined") G.sceneArtReady.then(() => setTimeout(() => G.probePoses().catch(() => {}), 1500)).catch(() => {});

  /* ================================================================== */
  /* Tiểu sử phi (3 dòng)                                                */
  /* ================================================================== */
  G.BIOS = {
    "core.uyen_nghi": ["Thái tử phi cũ, con gái Thừa tướng, theo bệ hạ từ thuở Đông cung.", "Đoan trang trước mặt người, sau rèm lại có một bộ mặt khác.", "Giữ một cuốn sổ ghi từng đêm bệ hạ ghé cung các phi khác."],
    "core.moc_can": ["Cung nữ thân cận từ thuở Đông cung, được bệ hạ nạp làm phi.", "Si tình, hay ngượng, khéo tay may vá.", "Vẫn giữ chiếc khăn tay bệ hạ đánh rơi năm mười tám tuổi."],
    "core.tuyet": ["Công chúa phiên bang gả sang hòa thân.", "Táo bạo, hoang dã, nói thẳng không kiêng nể.", "Thích cưỡi ngựa không yên, và cưỡi bệ hạ cũng y như thế."],
    "core.nhu_yen": ["Vũ cơ đệ nhất kinh thành.", "Mê hoặc, tham vọng, mỗi bước đi đều như đang múa.", "Từng múa một đêm cho ba vị vương gia mà không để ai chạm vào."],
    "core.tu_lan": ["Đệ nhất kỹ nữ Giang Nam, được bệ hạ chuộc thân.", "Tinh tế, từng trải, diễn đạt đến mức không ai biết nàng thật lòng lúc nào.", "Biết hơn trăm cách làm đàn ông mất hồn, chưa từng dùng hết với ai."],
    "core.mi_nuong": ["Chủ tiệm hương phấn nổi tiếng kinh thành.", "Tinh nghịch, khéo nói, người lúc nào cũng thoảng một mùi hương lạ.", "Tự pha một loại hương riêng, chỉ dùng những đêm được triệu."],
    "core.thanh_ca": ["Cầm nữ Giang Nam.", "Ôn nhu, giọng hát ngọt, hay buồn vô cớ.", "Đêm nào không được triệu thì ôm đàn hát đến khuya bên cửa sổ."],
    "core.song_nguyet": ["Chị trong cặp song sinh.", "Gắn bó với em gái, tinh nghịch, hay bày trò.", "Thích đổi chỗ với em để xem bệ hạ có nhận ra không."],
    "core.song_nhat": ["Em trong cặp song sinh.", "Táo bạo hơn chị, đồng tâm với chị trong mọi chuyện.", "Lúc nào cũng muốn hai chị em cùng hầu một đêm."],
    "core.hong_tieu": ["Ca nữ được tiến cử, sủng phi định mệnh.", "Mê hoặc, giọng hát ngọt, thích chưng diện.", "Có cả một rương y phục chưa từng mặc, chờ dịp mặc riêng cho bệ hạ."],
    "canh-viet.cc_a_y_na": ["Công chúa Lâu Lan, vũ nữ sa mạc Tây Vực.", "Giỏi múa, nồng nàn, táo bạo.", "Múa điệu bụng đến khi chuông bạc trên eo rơi hết mới chịu dừng."],
    "canh-viet.cc_o_lan": ["Công chúa bộ Khiết Liệt, lớn lên trên lưng ngựa.", "Phóng khoáng, mạnh mẽ.", "Nhớ thảo nguyên đến mức ngủ trần trên thảm lông giữa tẩm cung."],
    "canh-viet.cc_bach_ngoc": ["Công chúa Nam Chiếu, đất giáp Thục.", "Dịu dàng, hay ngượng, hát hay.", "Mỗi lần đỏ mặt, chuông bạc trên mũ hoa lại khẽ rung."],
    "canh-viet.cc_hai_lam": ["Công chúa Lưu Cầu, con gái biển Đông.", "Tinh nghịch, lanh lợi, mê biển.", "Bơi giỏi hơn cả thị vệ, thích kéo bệ hạ xuống hồ lúc đêm khuya."],
    "canh-viet.cc_thuc_hy": ["Công chúa Cao Ly.", "Đoan trang bên ngoài, bên trong lại khác hẳn.", "Viết nhật ký bằng chữ nước mình, không ai đọc được, trừ những trang về bệ hạ."],
  };
  const SECRETS = ["Lén đọc xuân cung đồ dưới gối mỗi đêm.", "Thích bị cắn nhẹ vào vai.", "Mơ thấy bệ hạ gần như mỗi đêm.", "Giấu một dải lụa đỏ chờ ngày dùng tới.", "Tự tập múa trước gương, không cho ai xem.", "Giữ lại một sợi tóc của bệ hạ trong túi thơm.", "Hay ngủ không mặc gì.", "Đếm từng đêm bệ hạ chưa ghé.", "Ghen với cả tỷ muội thân nhất của mình.", "Từng viết một bức thư tình chưa dám gửi.", "Thích được khen đôi chân.", "Lén thử y phục của phi khác."];
  const hash = (str) => {
    let h = 0;
    for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };
  G.bioOf = function (c) {
    if (!c || c.isChild) return null;
    if (c.bio && c.bio.length) return c.bio;
    if (G.BIOS[c.id]) return G.BIOS[c.id];
    const tr = (c.traits || []).slice(0, 3).join(", ").toLowerCase();
    return [`${c.origin || "Tú nữ"}.`, tr ? tr.charAt(0).toUpperCase() + tr.slice(1) + "." : "Tính tình còn khó đoán.", SECRETS[hash(c.id) % SECRETS.length]];
  };

  /* ================================================================== */
  /* Thiên Đạo sáng tạo                                                  */
  /* ================================================================== */
  G.godCreate = function (o) {
    o = o || {};
    const name = String(o.name || "").trim();
    if (!name) return { ok: false, text: "Cần đặt tên cho nàng." };
    const age = Math.max(18, Math.min(45, Number(o.age) || 20));
    const def = G.makeRecruit(String(o.origin || "").trim() || "Thiên Đạo ban xuống");
    def.name = name;
    def.age = age;
    if (o.traits && o.traits.length) def.traits = o.traits.slice(0, 3);
    def.consent = Object.assign({}, def.consent);
    for (const f of o.willing || []) if (R.fetishes[f]) def.consent[f] = "willing";
    if (o.likes && o.likes.length) def.likes = o.likes.filter((f) => R.fetishes[f]).slice(0, 3);
    def.special = true;
    const c = G.addConsort(def.id, true);
    if (!c) return { ok: false, text: "Không thêm được." };
    c.favor = Math.max(c.favor, 40);
    c.affection = Math.max(c.affection, 40);
    if (o.bio) c.bio = o.bio.filter(Boolean).slice(0, 3);
    if (G.setBody && o.body) for (const [k, v] of Object.entries(o.body)) if (v !== "" && v != null) G.setBody(c.id, k, v);
    log(`Thiên Đạo ban xuống một mỹ nhân: ${c.name}.`, "harem");
    return { ok: true, c, text: `${c.name}, ${c.age} tuổi, nhập cung.` };
  };
  /** Dựng đêm không cần điều kiện: không tốn Long thể, đồ dùng và y phục có sẵn. */
  G.godNight = function (o) {
    const s = G.state;
    const c = G.findConsort(o.cid);
    if (!c) return { title: "Không có ai", text: "Chưa chọn phi.", blocked: true };
    if (c.pregnantDue != null) return { title: "Không thể", text: `${c.name} đang hoài thai.`, blocked: true };
    const fx = (o.fx || []).filter((f) => R.fetishes[f]);
    if (o.makeWilling) for (const f of fx) if (G.consentOf(c, f) !== "willing") c.consent[f] = "willing";
    const lt = s.stats.longThe;
    const items = (o.items || []).filter((x) => G.BED_ITEMS && G.BED_ITEMS[x]);
    const st13 = G.d13 ? G.d13().stock : null;
    if (st13) for (const x of items) st13[x] = (st13[x] || 0) + 1;
    const csD = G.cannotSummon;
    G.cannotSummon = () => null;
    let scene;
    try {
      if (G.setNightExtras) G.setNightExtras(c.id, items, o.outfit || "", [], o.furn || "");
      G.setNightPlace(c.id, o.place || null);
      scene = G.summon(c.id, fx.filter((f) => G.consentOf(c, f) === "willing"));
    } finally {
      G.cannotSummon = csD;
      s.stats.longThe = lt;
    }
    if (scene && !scene.blocked) scene.notes = (scene.notes || []).concat(["Thiên Đạo dựng đêm: không tốn Long thể"]);
    return scene;
  };
})();
