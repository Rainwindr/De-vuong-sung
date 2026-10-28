/*
 * Đợt 5: Hậu cung tự sống, Mini game, Mùa và thời tiết.
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
})();
