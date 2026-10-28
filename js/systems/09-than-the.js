/*
 * Đợt 8: Thân thể (long căn, vòng một, nơi kín, lông, độ nhạy, lượng tinh).
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
  /* ĐỢT 8 · Thân thể: long căn của bệ hạ, vòng một, nơi kín             */
  /* ================================================================== */
  G.BODY = {
    size: ["Vừa vặn", "To", "Rất to", "Quá khổ"], // long căn của bệ hạ
    nguc: ["Nhỏ nhắn", "Vừa", "Đầy đặn", "Rất đầy"], // vòng một của nàng
    kin: ["Rất khít", "Khít", "Vừa"], // nơi kín của nàng
  };
  // Câu chèn vào đoạn mở của đêm (nháp, chờ Grok viết lại). {name} = tên nàng.
  G.D8_TEXT = {
    size: { 2: ["Long căn của bệ hạ to hơn hẳn thường nhân, {name} nhìn mà nuốt khan."], 3: ["Long căn quá khổ của bệ hạ khiến {name} vừa sợ vừa mong, tay khẽ run khi chạm vào."] },
    nguc: { 0: ["Bầu ngực nhỏ nhắn của {name} nằm gọn trong lòng bàn tay bệ hạ."], 2: ["Vòng một đầy đặn của {name} căng tràn dưới lớp yếm mỏng."], 3: ["Bầu ngực rất đầy của {name} nặng trĩu, chỉ khẽ cử động đã rung lên."] },
    kin: { 0: ["Nơi kín của {name} rất khít, nàng phải thở thật sâu mới đón được bệ hạ."] },
    combo: { "3_0": ["Long căn quá khổ và nơi kín rất khít của {name} khiến mỗi lần bệ hạ tiến vào đều chậm và căng."] },
    roundTight: ["{name} vẫn còn căng chật sau hiệp trước, nhưng lại kéo bệ hạ vào lần nữa."],
  };
  G.BREAST_FX = ["canh-viet.breast", "canh-viet.milking", "canh-viet.groping_and_sucking_titties", "canh-viet.titties_clit_massage"];
  const d8 = (s) => {
    s = s || G.state;
    if (!s.d8) s.d8 = { size: 1, body: {} };
    if (!s.d8.body) s.d8.body = {};
    return s.d8;
  };
  G.emperorSize = () => (G.state ? d8().size : 1);
  G.setEmperorSize = (v) => {
    d8().size = clamp(Number(v) || 0, 0, G.BODY.size.length - 1);
  };
  /** Thân thể của nàng: lúc đầu gán ngẫu nhiên cố định theo id, bệ hạ đổi tùy ý. */
  G.bodyOf = function (c) {
    const b = d8().body;
    if (!b[c.id]) {
      let h = 11;
      for (const ch of String(c.id)) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
      b[c.id] = { nguc: h % 4, kin: (h >>> 5) % 3 };
    }
    return b[c.id];
  };
  G.setBody = (cid, key, v) => {
    const c = G.findConsort(cid);
    if (!c || !G.BODY[key]) return;
    G.bodyOf(c)[key] = clamp(Number(v) || 0, 0, G.BODY[key].length - 1);
  };
  /** Một hai câu tả thân thể chèn vào đêm nay. */
  G.bodyLines = function (c) {
    const T = G.D8_TEXT;
    const sz = G.emperorSize();
    const b = G.bodyOf(c);
    const out = [];
    const pickT = (x) => (x ? G.fill(G.d3one(x), { speaker: c }) : null);
    const combo = pickT(T.combo[`${sz}_${b.kin}`]);
    if (combo) out.push(combo);
    else {
      const a = pickT(T.size[sz]);
      if (a) out.push(a);
      const k = pickT(T.kin[b.kin]);
      if (k) out.push(k);
    }
    const n = pickT(T.nguc[b.nguc]);
    if (n && out.length < 2) out.push(n);
    return out.slice(0, 2);
  };
  const withBody = (scene, c) => {
    if (!scene || scene.blocked || !c) return scene;
    const lines = G.bodyLines(c);
    if (!lines.length) return scene;
    const pages = scene.pages && scene.pages.length ? scene.pages.slice() : [scene.text || ""];
    const parts = pages[0].split("\n");
    // chèn sau câu dẫn đầu tiên của đoạn mở (trước lời thoại)
    const at = Math.max(1, parts.findIndex((l) => l.startsWith("> ")));
    parts.splice(at < 0 ? parts.length : at, 0, lines.join(" "));
    pages[0] = parts.join("\n");
    return Object.assign(scene, { pages, text: pages.join("\n\n") });
  };
  // long căn quá khổ: sở thích "Chênh lệch kích cỡ" mở sẵn với mọi phi
  const unlockD8 = G.fetishUnlocked;
  G.fetishUnlocked = (fid) => (fid === "canh-viet.chenh_lech" && G.state && G.emperorSize() >= 3 ? !!R.fetishes[fid] : unlockD8(fid));
  const consentD8 = G.consentOf;
  G.consentOf = function (p, fid) {
    const lvl = consentD8(p, fid);
    return lvl === "persuade" && fid === "canh-viet.chenh_lech" && G.state && G.emperorSize() >= 3 && G.findConsort(p.id) ? "willing" : lvl;
  };
  // vòng một rất đầy: thích các sở thích về vú hơn
  const summonD8 = G.summon;
  G.summon = function (id, fetishIds) {
    const scene = summonD8(id, fetishIds);
    const c = G.findConsort(id);
    if (!scene || scene.blocked || !c) return scene;
    if (G.bodyOf(c).nguc >= 3 && (fetishIds || []).some((f) => G.BREAST_FX.includes(f))) {
      G.changeFavor(c, 3);
      scene.notes = (scene.notes || []).concat(["Vòng một rất đầy: nàng thích, Sủng ái +3"]);
    }
    return withBody(scene, c);
  };
  const roundD8 = G.extraRound;
  G.extraRound = function (cid, fid) {
    const scene = roundD8(cid, fid);
    const c = G.findConsort(cid);
    if (!scene || scene.blocked || !c || G.bodyOf(c).kin !== 0) return scene;
    const pages = scene.pages.slice();
    pages[0] = G.fill(G.d3one(G.D8_TEXT.roundTight), { speaker: c }) + " " + pages[0];
    return Object.assign(scene, { pages, text: pages.join("\n\n") });
  };

  /* ---------------- Thân thể (bổ sung): lông, độ nhạy, lượng tinh, thay đổi theo thời gian ---------------- */
  G.BODY.long = ["Cạo sạch", "Tỉa gọn", "Tự nhiên"];
  G.BODY.nhay = ["Dễ lên đỉnh", "Bình thường", "Khó lên đỉnh"];
  G.BODY.tinh = ["Bình thường", "Nhiều", "Rất nhiều"]; // của bệ hạ
  Object.assign(G.D8_TEXT, {
    long: { 0: ["Nơi kín của {name} cạo sạch, trơn láng dưới ánh đèn."], 2: ["Lông nơi kín của {name} để tự nhiên, mềm và rậm."] },
    nhay: { 0: ["{name} nhạy đến mức chỉ cần bệ hạ chạm khẽ đã run lên."], 2: ["{name} khó lên đỉnh, bệ hạ phải kiên nhẫn thật lâu nàng mới buông được."] },
    tinh: { 1: ["Bệ hạ xuất tinh nhiều, tràn đầy trong nàng."], 2: ["Tinh của bệ hạ ra rất nhiều, {name} không giữ hết, trào cả ra ngoài."] },
    changeNguc: ["Từ ngày hoài thai, vòng một của {name} căng đầy hẳn lên."],
    changeKin: ["Sau nhiều đêm hầu long căn quá khổ, {name} đã quen dần, không còn chật như trước."],
  });
  // Bản Grok (ghép 2026-10-27). Khóa không có ở đây thì dùng câu nháp phía trên.
  Object.assign(G.D8_TEXT.size, {"2": ["{name} nhìn thấy long căn trẫm to lớn dựng đứng cứng ngắc, mắt nàng trợn tròn nuốt nước bọt đầy thèm khát.", "{name} đưa tay chạm vào long căn trẫm rất to nóng hổi, ngón tay nàng run run không dám buông.", "Long căn trẫm to khủng hiện ra trước mặt {name}, nàng không kìm được mà nhìn chằm chằm.", "{name} sờ thấy long căn trẫm cứng to bất thường, mặt nàng đỏ bừng môi hé mở."], "3": ["Long căn trẫm quá khổ khiến {name} vừa sợ hãi vừa thèm thuồng không thể dứt mắt.", "{name} nhìn long căn trẫm khổng lồ dựng đứng, môi nàng run run đầy khao khát muốn được nuốt.", "Kích thước long căn trẫm làm {name} sợ mà lại muốn được lấp đầy đến nghẹt thở.", "{name} chạm vào long căn trẫm to bất thường, nàng vừa run vừa thèm không kìm nổi."]});
  Object.assign(G.D8_TEXT.nguc, {"0": ["Vòng một {name} nhỏ nhắn run rẩy cứng lại dưới bàn tay trẫm mơn trớn.", "Ngực {name} bé xíu phập phồng khi bị trẫm vuốt ve, hai đầu ti cứng ngắc.", "Hai bầu ngực nhỏ của {name} nảy nhẹ trong lòng bàn tay trẫm."], "2": ["Ngực {name} đầy đặn căng mềm nảy nở trong lòng bàn tay trẫm bóp mạnh.", "Vòng một {name} đầy đặn rung rinh theo từng cái chạm của trẫm.", "Hai bầu ngực đầy của {name} nặng nhẹ vừa tay khiến trẫm muốn vắt hết."], "3": ["Ngực {name} rất đầy nặng nề rung lắc mạnh khi bị trẫm vắt và bóp.", "Vòng một {name} to lớn nặng trĩu nảy nở không ngừng dưới sự đè ép.", "Hai bầu ngực {name} nặng đầy rung rinh mạnh mẽ khi bị trẫm nắm chặt.", "Ngực {name} căng mọng nặng nề nảy lên từng nhịp theo sự mơn trớn của trẫm."]});
  Object.assign(G.D8_TEXT.kin, {"0": ["Nơi kín {name} rất khít bóp chặt lấy long căn trẫm không chút khe hở.", "Hạ thân {name} cực kỳ khít khiến trẫm khó lòng tiến sâu từng chút một.", "Cái lỗ nhỏ của {name} khít đến mức nuốt không hết long căn trẫm.", "Nơi kín {name} siết chặt cứng ngắc từng nhịp khiến trẫm nghẹn thở."], "1": ["Nơi kín {name} khít khao ôm lấy long căn trẫm từng phân.", "Hạ thân {name} còn khít khiến mỗi nhịp đều căng chật khó chịu.", "Cái lỗ {name} khít vừa đủ nuốt lấy long căn trẫm đến tận gốc."]});
  Object.assign(G.D8_TEXT.combo, {"2_0": ["Long căn trẫm rất to đâm vào nơi kín rất khít của {name} khiến nàng nghẹn thở run bần bật.", "Nơi kín {name} cực khít khó lòng chứa hết long căn to lớn của trẫm từng nhịp.", "Long căn trẫm to cứng xuyên vào lỗ rất khít của {name} làm nàng thở dốc không thành tiếng."], "3_0": ["Long căn trẫm quá khổ ép vào nơi kín rất khít của {name} khiến nàng vừa căng vừa thèm.", "Nơi kín {name} cực khít suýt không chứa nổi long căn khổng lồ của trẫm.", "Long căn trẫm to bất thường bị nơi kín khít của {name} siết chặt đến nghẹt thở.", "{name} bị long căn quá khổ của trẫm nhét vào lỗ rất khít khiến nàng run rẩy thở dốc."], "3_1": ["Long căn trẫm quá khổ đâm sâu vào nơi kín khít của {name} từng nhịp mạnh.", "Nơi kín {name} khít khao khó lòng nuốt hết long căn khổng lồ của trẫm.", "Long căn trẫm to lớn bị lỗ khít của {name} bóp chặt đến mức nghẹn."]});
  G.D8_TEXT.roundTight = ["Nơi kín {name} vẫn còn căng chật sau hiệp trước mà nàng lại muốn được trẫm tiếp tục.", "Hạ thân {name} còn sưng khít căng nhưng nàng đã sẵn sàng cho nhịp tiếp theo.", "Lỗ {name} vẫn rất khít căng mà nàng lại thèm được trẫm đâm sâu tiếp."];
  Object.assign(G.D8_TEXT.nhay, {"0": ["Nơi kín {name} cực kỳ nhạy cảm, nàng run bần bật chỉ vì một cái chạm của trẫm.", "{name} thở dốc không thành tiếng khi trẫm mơn trớn hạ thân nhạy cảm của nàng.", "Hạ thân {name} nhạy đến mức nàng nghẹn thở ngay khi long căn trẫm vừa chạm vào."], "2": ["Nơi kín {name} không quá nhạy cảm, nàng chỉ nhẹ run khi bị trẫm chạm vào.", "{name} phản ứng chậm chạp khi trẫm mơn trớn hạ thân, nàng vẫn giữ vẻ bình thản.", "Hạ thân {name} ít nhạy, nàng chỉ thở nhẹ khi long căn trẫm cọ sát.", "{name} không run rẩy nhiều dù trẫm vuốt ve nơi kín, nàng chỉ đỏ mặt nhẹ."]});
  Object.assign(G.D8_TEXT.tinh, {"2": ["Trẫm bắn tinh rất nhiều vào nơi kín {name}, tinh dịch tràn ra ngoài từng giọt nóng.", "{name} cảm nhận tinh dịch trẫm dồi dào tràn đầy hạ thân, nàng nghẹn thở vì sung sướng.", "Tinh của trẫm bắn ra ồ ạt vào lỗ {name}, nàng cảm thấy bụng dưới nóng rực.", "{name} bị tinh dịch trẫm quá nhiều làm tràn ra, nàng run rẩy đầy thỏa mãn."]});
  G.D8_TEXT.changeNguc = ["Hôm nay vòng một {name} có vẻ đầy hơn sau những lần bị trẫm vắt ve, nàng cảm nhận rõ sự nặng nề.", "Ngực {name} dần căng đầy hơn sau nhiều đêm hầu hạ, nàng tự sờ mà thấy khác lạ."];
  Object.assign(G.D8_TEXT.long, {"0": ["Nơi kín {name} cạo trọc lốc không một sợi lông, lỗ mịn trơn bóng để trẫm liếm và đút vào dễ dàng.", "{name} để cái lồn trơn láng không lông, da thịt mịn màng ướt át khi trẫm mút mạnh.", "Hạ thân {name} cạo sạch bóng, cái lỗ nhỏ trơn tuột khiến trẫm muốn nhét long căn vào ngay."], "1": ["Lông lồn {name} tỉa ngắn mỏng mềm, vừa đủ để trẫm kéo nhẹ khi liếm cái lỗ ướt của nàng.", "{name} để lông mu tỉa gọn mỏng, trẫm dùng tay vén ra rồi mút mạnh cái lồn mềm của nàng."], "2": ["Lông lồn {name} để tự nhiên rậm rạp mềm, phủ kín cái lỗ khiến trẫm phải vén ra mới đút được.", "{name} để lông mu rậm dày tự nhiên, trẫm kéo lông nhẹ rồi cắm lưỡi sâu vào cái lồn ướt của nàng.", "Hạ thân {name} đầy lông rậm mềm, trẫm vén lông ra và liếm cái lỗ khít ướt át của nàng đến nghẹt thở."]});
  Object.assign(G.D8_TEXT.tinh, {"1": ["Trẫm bắn tinh đặc sệt rất nhiều vào cái lồn {name}, tinh nóng tràn đầy bụng dưới mà vẫn chứa được.", "{name} cảm nhận tinh dịch trẫm dồi dào đặc quánh lấp đầy cái lỗ, nhiều đến mức bụng nàng phồng nhẹ.", "Tinh của trẫm bắn ồ ạt vào lồn {name}, đặc nóng đầy ắp khiến nàng cảm thấy bụng dưới căng cứng."]});
  G.D8_TEXT.changeKin = ["Sau nhiều đêm bị long căn quá khổ của trẫm đâm xuyên, cái lồn vốn cực khít của {name} đã quen và giãn ra, không còn siết chặt như trước.", "Nơi kín {name} từng khít đến nghẹt nay đã quen dần với kích thước trẫm, dần nới lỏng mềm mại hơn sau những hiệp sâu."];
  G.ORGASM_FX = ["canh-viet.women_having_orgasms", "canh-viet.multiple_continuous_long_orgasms", "canh-viet.forced_orgasms", "canh-viet.force_squirt", "canh-viet.squirting_mess_fuck", "canh-viet.overstimulation"];
  G.SLOW_FX = ["canh-viet.slow_tease_long", "canh-viet.cham_cham", "canh-viet.edging_tap_the", "canh-viet.one_bar", "khung-nong-bong.kiem_che"];
  G.SEED_FX = ["canh-viet.breeding", "canh-viet.bon_chua_tinh", "canh-viet.creampie_marathon", "canh-viet.cumflation", "canh-viet.du_xong_bat_giu_tinh", "khung-nong-bong.long_chung"];
  G.SHAVE_FX = ["canh-viet.shaving_pussy", "canh-viet.du_cao_long"];
  G.KIN_ADAPT_NIGHTS = 10; // số đêm với long căn quá khổ để nơi kín rất khít quen dần
  G.SHAVE_MONTHS = 3; // cạo xong giữ sạch mấy tháng
  const bodyD9 = G.bodyOf;
  G.bodyOf = function (c) {
    const b = bodyD9(c);
    if (b.long == null) {
      let h = 5;
      for (const ch of String(c.id)) h = (h * 37 + ch.charCodeAt(0)) >>> 0;
      b.long = h % 3;
      b.nhay = (h >>> 6) % 3;
    }
    return b;
  };
  G.emperorTinh = () => (G.state ? d8().tinh || 0 : 0);
  G.setEmperorTinh = (v) => {
    d8().tinh = clamp(Number(v) || 0, 0, 2);
  };
  /** Lông nơi kín đang thế nào: vừa cạo hoặc theo lệ cạo thì sạch. */
  G.longNow = function (c) {
    const b = G.bodyOf(c);
    if (b.shaved != null && G.state.turn - b.shaved < G.SHAVE_MONTHS) return 0;
    if (G.ruleEnabled && R.rules["canh-viet.quy_cao_long_lon"] && G.ruleEnabled("canh-viet.quy_cao_long_lon") && G.ruleFollowers(R.rules["canh-viet.quy_cao_long_lon"]).some((x) => x.id === c.id)) return 0;
    return b.long;
  };
  const linesD9 = G.bodyLines;
  G.bodyLines = function (c) {
    const out = linesD9(c);
    const T = G.D8_TEXT;
    const pickT = (x) => (x ? G.fill(G.d3one(x), { speaker: c }) : null);
    const b = G.bodyOf(c);
    for (const extra of [pickT(T.nhay[b.nhay]), pickT(T.long[G.longNow(c)])]) if (extra && out.length < 3) out.push(extra);
    return out;
  };
  // lượng tinh: thụ thai dễ hơn
  const queD9 = G.queMult;
  G.queMult = (k) => queD9(k) * (k === "conceive" ? [1, 1.3, 1.6][G.emperorTinh()] : 1);
  // sau mỗi đêm một người: câu tinh ở đoạn cuối, độ nhạy và lượng tinh hợp sở thích, cạo lông, quen dần
  const summonD9 = G.summon;
  G.summon = function (id, fetishIds) {
    const scene = summonD9(id, fetishIds);
    const c = G.findConsort(id);
    if (!scene || scene.blocked || !c) return scene;
    const fx = fetishIds || [];
    const b = G.bodyOf(c);
    const notes = scene.notes || (scene.notes = []);
    const like = (b.nhay === 0 && fx.some((f) => G.ORGASM_FX.includes(f))) || (b.nhay === 2 && fx.some((f) => G.SLOW_FX.includes(f)));
    if (like) {
      G.changeFavor(c, 3);
      notes.push(`${G.BODY.nhay[b.nhay]}: nàng thích, Sủng ái +3`);
    }
    if (G.emperorTinh() >= 1 && fx.some((f) => G.SEED_FX.includes(f))) {
      c.affection = clamp(c.affection + 2, 0, 100);
      notes.push(`Lượng tinh ${G.BODY.tinh[G.emperorTinh()].toLowerCase()}: Tình cảm +2`);
    }
    if (fx.some((f) => G.SHAVE_FX.includes(f))) {
      b.shaved = G.state.turn;
      notes.push("Nàng được cạo sạch");
    }
    const t = G.emperorTinh() ? G.fill(G.d3one(G.D8_TEXT.tinh[G.emperorTinh()]), { speaker: c }) : "";
    if (t && scene.pages && scene.pages.length) {
      const pages = scene.pages.slice();
      const last = pages.length - 1;
      const parts = pages[last].split("\n");
      parts.splice(1, 0, t);
      pages[last] = parts.join("\n");
      Object.assign(scene, { pages, text: pages.join("\n\n") });
    }
    G.checkPregBody();
    // nơi kín rất khít quen dần với long căn quá khổ
    if (G.emperorSize() >= 3 && b.kin === 0) {
      b.bigNights = (b.bigNights || 0) + 1;
      if (b.bigNights >= G.KIN_ADAPT_NIGHTS) {
        b.kin = 1;
        log(G.fill(G.d3one(G.D8_TEXT.changeKin), { speaker: c }) + " Nơi kín: Rất khít → Khít.", "harem");
        notes.push("Nơi kín: Rất khít → Khít");
      }
    }
    return scene;
  };
  // hoài thai: vòng một lên một bậc (mỗi lần mang thai một lần)
  G.checkPregBody = function () {
    const s = G.state;
    for (const c of s.consorts) {
      if (c.pregnantDue == null) continue;
      const b = G.bodyOf(c);
      if (b.pregBump === c.pregnantDue) continue;
      b.pregBump = c.pregnantDue;
      if (b.nguc < 3) {
        b.nguc++;
        log(G.fill(G.d3one(G.D8_TEXT.changeNguc), { speaker: c }) + ` Vòng một: ${G.BODY.nguc[b.nguc]}.`, "harem");
      }
    }
  };
  monthly(() => G.checkPregBody());
  // quà theo thân hình: bodyLikes { nguc: [3] } trong gifts.json
  G.giftFitsBody = (g, c) => !!(g && g.bodyLikes && Object.entries(g.bodyLikes).some(([k, vals]) => vals.includes(k === "long" ? G.longNow(c) : G.bodyOf(c)[k])));
  const giftD9 = G.buyGift;
  G.buyGift = function (cid, gid) {
    const c = G.findConsort(cid);
    const g = R.gifts[gid];
    const r = giftD9(cid, gid);
    if (r && r.ok && c && G.giftFitsBody(g, c)) {
      G.changeFavor(c, 6);
      c.affection = clamp(c.affection + 3, 0, 100);
      r.text += " Món này vừa vặn thân hình nàng.";
      r.notes.push("Hợp thân hình: Sủng ái +6, Tình cảm +3");
    }
    return r;
  };

  /* ---------------- Danh hiệu phòng the của bệ hạ ---------------- */
  const bookAll = () => Object.values((G.state.d7 && G.state.d7.book) || {});
  G.BED_TITLES = [
    { id: "dem_dau", name: "Lần đầu long sàng", desc: "Thị tẩm đêm đầu tiên", goal: 1, val: (s) => s.nightsTotal },
    { id: "tram_dem", name: "Trăm đêm xuân", desc: "Tổng 100 đêm thị tẩm", goal: 100, val: (s) => s.nightsTotal },
    { id: "nghin_dem", name: "Nghìn đêm hoan lạc", desc: "Tổng 1000 đêm thị tẩm", goal: 1000, val: (s) => s.nightsTotal },
    { id: "bat_bai", name: "Long thể bất bại", desc: "4 hiệp trong một đêm", goal: 4, val: () => Math.max(0, ...bookAll().map((b) => b.maxRounds || 0)) },
    { id: "van_hoa", name: "Vạn hoa trong tay", desc: "Thị tẩm 20 phi khác nhau", goal: 20, val: () => bookAll().filter((b) => b.first != null).length },
    { id: "long_chung", name: "Long chủng khắp hậu cung", desc: "5 phi sinh con cho bệ hạ", goal: 5, val: (s) => s.consorts.filter((c) => c.kids > 0).length },
    { id: "phong_luu", name: "Bậc thầy phong lưu", desc: "Thử 30 sở thích khác nhau", goal: 30, val: (s) => Object.keys(s.fetishLast || {}).length },
    { id: "chinh_phuc", name: "Kẻ chinh phục", desc: "5 phi ở cấp Buông thả", goal: 5, val: (s) => s.consorts.filter((c) => G.levelOf(c) >= 2).length },
    { id: "mot_long", name: "Một lòng một dạ", desc: "Một phi được thị tẩm 30 đêm", goal: 30, val: (s) => Math.max(0, ...s.consorts.map((c) => c.nights || 0)) },
    { id: "suu_tap", name: "Sưu tập gia", desc: "Mở 100 cảnh trong album", goal: 100, val: (s) => Object.keys(s.sceneAlbum || {}).length },
  ];
  G.bedTitles = function () {
    const s = G.state;
    const got = (s.bedTitles = s.bedTitles || {});
    return G.BED_TITLES.map((t) => {
      const v = t.val(s);
      return Object.assign({}, t, { v: Math.min(v, t.goal), done: got[t.id] != null, when: got[t.id] });
    });
  };
  /** Trao danh hiệu mới đạt (gọi sau mỗi đêm và mỗi tháng). */
  G.checkBedTitles = function () {
    const s = G.state;
    if (!s) return;
    const got = (s.bedTitles = s.bedTitles || {});
    for (const t of G.BED_TITLES) {
      if (got[t.id] != null || t.val(s) < t.goal) continue;
      got[t.id] = s.turn;
      log(`Danh hiệu phòng the: ${t.name} (${t.desc}).`, "milestone");
      G.pushFx && G.pushFx({ type: "stamp", text: t.name, sub: "Danh hiệu phòng the" });
    }
  };
  monthly(() => G.checkBedTitles());
  const spendD10 = G.spendNight;
  G.spendNight = function (list, opts) {
    spendD10(list, opts);
    G.checkBedTitles();
  };
  const roundD10 = G.extraRound;
  G.extraRound = function (cid, fid) {
    const r = roundD10(cid, fid);
    G.checkBedTitles();
    return r;
  };
})();
