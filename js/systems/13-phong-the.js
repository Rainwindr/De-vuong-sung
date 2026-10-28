/*
 * Phòng the: Khát khao, Đồ dùng phòng the, Tủ y phục, Xoa bóp, Cờ cởi áo.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const { clamp, pick, rand } = G.util;
  const log = (t, k) => G.log(t, k);
  const monthly = (fn) => G.monthlyHooks.push(fn);
  const one = (arr) => G.d3one(arr);

  // Câu do Claude viết (mức gợi tình). Grok có thể viết lại theo PROMPT-GROK-PHONG-THE. Biến: {name}.
  G.D13_TEXT = {
    // phi khát khao cao tự tìm đến thư phòng (câu dẫn + thoại)
    khatTim: [
      "Đêm đã khuya, {name} khoác áo mỏng tự tìm đến thư phòng, đứng tựa cửa nhìn bệ hạ không chớp.\n> Bệ hạ… mấy tháng rồi bệ hạ không triệu thiếp. Đêm nay thiếp không về đâu.",
      "Lý công công khẽ bẩm có {name} chờ ngoài hành lang. Nàng bước vào, má ửng hồng, tay mân mê dải yếm.\n> Thiếp nhớ bệ hạ đến mất ngủ… bệ hạ giữ thiếp lại một đêm thôi, được không?",
      "{name} mang trà đêm vào thư phòng, đặt chén xuống rồi ngồi luôn lên đùi bệ hạ.\n> Trà nguội rồi, nhưng thiếp thì vẫn nóng lắm… bệ hạ có muốn thử không?",
    ],
    // chèn đầu cảnh khi nàng đã khát khao lâu
    khatThoa: [
      "{name} đã chờ đêm này quá lâu, vừa thấy bệ hạ đã sà vào lòng, hơi thở gấp gáp.",
      "Bao đêm mong ngóng dồn lại, {name} ôm chặt bệ hạ như sợ bệ hạ lại biến mất.",
      "{name} không đợi bệ hạ nói hết câu đã kéo bệ hạ về phía giường, mắt long lanh khát khao.",
    ],
    // đồ dùng phòng the: câu chèn đoạn mở
    item: {
      dau_thom: ["Bệ hạ xoa dầu thơm hoa nhài lên khắp người {name}, da nàng bóng mịn và thơm ngát.", "Mùi dầu nhài lan khắp phòng khi bệ hạ vuốt dọc lưng {name}, nàng khẽ rùng mình."],
      chuong_bac: ["Chuông bạc buộc nơi cổ chân {name} rung khẽ theo từng cử động, leng keng cả đêm.", "{name} cố nằm yên mà chuông bạc nơi cổ chân cứ reo lên, tố cáo nàng đang run."],
      dai_lua: ["Bệ hạ dùng dải lụa đỏ che mắt {name}, nàng chỉ còn biết đến hơi ấm và bàn tay bệ hạ.", "Dải lụa đỏ quấn nhẹ cổ tay {name}, nàng ngửa người ra, phó mặc hết cho bệ hạ."],
      huong_tram: ["Hương trầm tỏa khói mỏng quanh giường, {name} lim dim trong làn hương ấm.", "Khói trầm vờn quanh màn the, làm da {name} như ửng hồng dưới ánh nến."],
    },
    // y phục đêm nay: câu chèn đoạn mở
    outfit: {
      yem_do: ["{name} chỉ mặc chiếc yếm đỏ thêu uyên ương, dây yếm buộc hờ sau gáy chờ bệ hạ tháo.", "Chiếc yếm đỏ ôm sát người {name}, đôi uyên ương thêu chỉ vàng nằm ngay trước ngực."],
      lua_mong: ["{name} khoác áo lụa mỏng xuyên thấu, dưới ánh nến thấy rõ từng đường cong.", "Lớp lụa mỏng trên người {name} chẳng che được gì, chỉ khiến bệ hạ muốn xé đi cho nhanh."],
      xe_ta: ["Váy lụa của {name} xẻ tà cao tận hông, mỗi bước đi lộ trọn bắp đùi trắng ngần.", "{name} ngồi vắt chân, tà váy xẻ trượt xuống, để lộ cả một bên đùi."],
      hong_y: ["{name} mặc hồng y tân nương, khăn đỏ che mặt, ngồi bên nến đỏ như đêm động phòng.", "Bệ hạ vén khăn đỏ của {name}, nàng trong bộ hồng y cúi đầu e lệ như tân nương."],
      khong_mac: ["{name} chẳng mặc gì cả, chỉ quấn hờ tấm chăn gấm, đợi bệ hạ đến là buông.", "Bệ hạ bước vào đã thấy {name} nằm sẵn trên giường, không một mảnh vải."],
    },
    // xoa bóp
    massageWin: ["Bàn tay bệ hạ tìm đúng chỗ, {name} rên khẽ rồi mềm nhũn cả người. Xong nàng xoay lại xoa bóp cho bệ hạ.", "{name} lim dim vì sướng, xong lại nhất quyết đòi xoa bóp trả bệ hạ cho bằng được."],
    massageDraw: ["{name} thấy dễ chịu, gục đầu vào gối thở đều.", "Nàng khen tay bệ hạ ấm, nhưng vẫn chưa chạm hết chỗ nàng thích."],
    massageLose: ["{name} cười khúc khích vì nhột, chẳng thư giãn được chút nào.", "Bệ hạ xoa mãi mà {name} chỉ cười, bảo lần sau để nàng chỉ chỗ."],
    // cờ cởi áo: bệ hạ thua ván thì cởi
    meLayer: [
      ["Bệ hạ thua ván, tự tháo đai ngọc, {name} vỗ tay cười đắc ý.", "{name} thắng, đòi bệ hạ tháo đai ngọc ngay tại chỗ."],
      ["Lại thua, bệ hạ cởi long bào, {name} nhìn không chớp mắt.", "{name} thắng tiếp, tự tay giúp bệ hạ cởi long bào ra."],
      ["Ván cuối bệ hạ thua, áo trong cũng phải cởi, {name} đỏ mặt mà vẫn nhìn.", "{name} thắng trọn, kéo áo trong của bệ hạ xuống, hơi thở nàng gấp lại."],
    ],
    coWin: ["{name} thua trọn ba ván, ngồi trước bàn cờ không còn mảnh áo nào, ngượng mà vẫn cười.\n> Thiếp thua rồi… vậy đêm nay thiếp xin chịu phạt theo ý bệ hạ.", "Quân cuối của {name} bị ăn mất, nàng đã trần trụi trước mặt bệ hạ.\n> Bệ hạ thắng, thiếp là của bệ hạ đêm nay."],
    coLose: ["{name} thắng trọn, bệ hạ đã cởi hết, nàng chống cằm ngắm mãi.\n> Thiếp thắng nên đêm nay thiếp được chọn… thiếp chọn bệ hạ.", "Bệ hạ thua sạch, {name} đứng dậy, chậm rãi cởi áo mình theo.\n> Thua thì phải chịu phạt, mà phạt của thiếp là đêm nay bệ hạ ở lại."],
  };

  /* ---------------- trạng thái ---------------- */
  const d13 = (s) => {
    s = s || G.state;
    if (!s.d13) s.d13 = {};
    const d = s.d13;
    for (const [k, v] of Object.entries({ khat: {}, lastNights: {}, khatAsk: {}, stock: {}, wardrobe: {}, worn: {}, useNext: null })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d13 = d13;
  const hash = (str) => {
    let h = 0;
    for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };

  /* ================================================================== */
  /* Khát khao                                                           */
  /* ================================================================== */
  G.KHAT_RISE = [6, 9, 12]; // mỗi tháng không được triệu, theo cấp thân mật
  G.KHAT_ASK_AT = 70;
  G.khatOf = (c) => (c && G.state ? Math.round(d13().khat[c.id] || 0) : 0);
  const resetKhat = (c) => {
    const d = d13();
    d.khat[c.id] = 0;
    d.lastNights[c.id] = c.nights;
  };
  monthly((s, report) => {
    if (s.ended) return;
    const d = d13(s);
    for (const c of s.consorts) {
      if (d.lastNights[c.id] === undefined) d.lastNights[c.id] = c.nights;
      if (c.nights > d.lastNights[c.id]) {
        d.khat[c.id] = 0;
        d.lastNights[c.id] = c.nights;
        continue;
      }
      if (G.cannotSummon(c)) continue; // hoài thai, đang nghỉ: không tăng
      const lv = G.levelOf ? G.levelOf(c) : 0;
      d.khat[c.id] = clamp((d.khat[c.id] || 0) + G.KHAT_RISE[lv] + (c.favor >= 60 ? 2 : 0), 0, 100);
    }
    const c = s.consorts
      .filter((x) => (d.khat[x.id] || 0) >= G.KHAT_ASK_AT && !G.cannotSummon(x) && !(d.khatAsk[x.id] != null && s.turn - d.khatAsk[x.id] < 2))
      .sort((a, b) => d.khat[b.id] - d.khat[a.id])[0];
    if (!c) return;
    // hết chỗ thì nhường chỗ của một chuyện thường (không đụng lễ sắc phong)
    const list = report.sideEvents;
    if (list.length >= G.SIDE_MAX) {
      let i = list.length - 1;
      while (i >= 0 && list[i].ev && list[i].ev.id === "sys.sac_phong") i--;
      if (i < 0) return;
      list.splice(i, 1);
    }
    d.khatAsk[c.id] = s.turn;
    const p = G.prepareEvent(
      {
        id: "sys.khat_tim",
        title: "Nàng tìm đến thư phòng",
        text: one(G.D13_TEXT.khatTim),
        choices: [
          { label: "Giữ nàng lại đêm nay", hook: "core.thi_tam", participants: "speaker", effects: { night: true, affection: 4 } },
          { label: "Dỗ nàng về, hẹn đêm khác", effects: { affection: 1 } },
        ],
        onChoose: (ch) => {
          if (ch.hook) {
            const live = G.findConsort(c.id);
            if (live) resetKhat(live);
          }
        },
      },
      { speaker: c }
    );
    if (p.choices.length) report.sideEvents.push(p);
  });

  /* ================================================================== */
  /* Đồ dùng phòng the                                                   */
  /* ================================================================== */
  G.BED_ITEMS = {
    dau_thom: { name: "Dầu thơm hoa nhài", cost: 120, desc: "Tình cảm +2", fx: { affection: 2 } },
    chuong_bac: { name: "Chuông bạc cổ chân", cost: 150, desc: "Sủng ái +3", fx: { favor: 3 } },
    dai_lua: { name: "Dải lụa đỏ", cost: 180, desc: "Che mắt hoặc quấn tay. Tình cảm +2, Trụy lạc +1", fx: { affection: 2, truyLac: 1 } },
    huong_tram: { name: "Hương trầm", cost: 200, desc: "Long thể +3", fx: { longThe: 3 } },
  };
  G.BED_ITEM_MAX = 2; // mỗi đêm dùng tối đa
  G.bedStock = (id) => d13().stock[id] || 0;
  /** Món nàng thích nhất (♥), cố định theo từng phi. */
  G.likedItem = (c) => Object.keys(G.BED_ITEMS)[hash(c.id + "item") % Object.keys(G.BED_ITEMS).length];
  G.buyBedItem = function (id, n) {
    const it = G.BED_ITEMS[id];
    const s = G.state;
    n = n || 1;
    if (!it) return { ok: false, text: "Không có món này." };
    const cost = it.cost * n;
    if (s.stats.quocKho < cost && !(s.godFlags && s.godFlags.infiniteMoney)) return { ok: false, text: `Ngân khố không đủ (cần ${cost} lượng).` };
    G.addStat("quocKho", -cost);
    d13().stock[id] = G.bedStock(id) + n;
    return { ok: true, text: `Nội vụ phủ dâng ${n} ${it.name}. Trong kho còn ${G.bedStock(id)}.`, notes: [`Quốc khố −${cost}`] };
  };

  /* ================================================================== */
  /* Tủ y phục                                                           */
  /* ================================================================== */
  G.OUTFITS = {
    yem_do: { name: "Yếm đỏ thêu uyên ương", cost: 300 },
    xe_ta: { name: "Váy lụa xẻ tà", cost: 400 },
    lua_mong: { name: "Áo lụa mỏng xuyên thấu", cost: 500 },
    hong_y: { name: "Hồng y tân nương", cost: 800 },
    khong_mac: { name: "Không mặc gì", cost: 0 },
  };
  G.OUTFIT_FIRST_FAVOR = 3;
  G.likedOutfit = (c) => {
    const keys = Object.keys(G.OUTFITS).filter((k) => k !== "khong_mac");
    return keys[hash(c.id + "outfit") % keys.length];
  };
  G.ownsOutfit = (c, id) => id === "khong_mac" || (d13().wardrobe[c.id] || []).includes(id);
  G.outfitsOf = (c) => Object.keys(G.OUTFITS).filter((k) => G.ownsOutfit(c, k));
  G.buyOutfit = function (cid, id) {
    const s = G.state;
    const c = G.findConsort(cid);
    const o = G.OUTFITS[id];
    if (!c || !o) return { ok: false, text: "Không có y phục này." };
    if (G.ownsOutfit(c, id)) return { ok: false, text: "Nàng đã có bộ này." };
    if (s.stats.quocKho < o.cost && !(s.godFlags && s.godFlags.infiniteMoney)) return { ok: false, text: `Ngân khố không đủ (cần ${o.cost} lượng).` };
    G.addStat("quocKho", -o.cost);
    const w = d13().wardrobe;
    (w[c.id] = w[c.id] || []).push(id);
    const liked = G.likedOutfit(c) === id;
    c.affection = clamp(c.affection + (liked ? 4 : 2), 0, 100);
    log(`Bệ hạ ban cho ${c.name} bộ ${o.name}.`, "harem");
    return { ok: true, text: `${c.name} nhận bộ ${o.name}${liked ? ", đúng bộ nàng ao ước" : ""}. Lần tới lật thẻ nàng, bệ hạ chọn được bộ này cho đêm nay.`, notes: [`Quốc khố −${o.cost}`, `Tình cảm +${liked ? 4 : 2}`] };
  };
  G.wornCount = (c, id) => ((d13().worn[c.id] || {})[id] || 0);

  /* ---------------- áp dụng đồ dùng và y phục khi thị tẩm ---------------- */
  /** Giao diện gọi trước G.summon: đồ dùng và y phục cho đêm nay của nàng. */
  G.setNightExtras = function (cid, items, outfit) {
    d13().useNext = { id: cid, items: (items || []).filter((x) => G.BED_ITEMS[x]).slice(0, G.BED_ITEM_MAX), outfit: outfit && G.OUTFITS[outfit] ? outfit : null };
  };
  function applyExtras(c, scene) {
    const d = d13();
    const u = d.useNext;
    d.useNext = null;
    const lines = [];
    const notes = scene.notes || (scene.notes = []);
    const k = d.khat[c.id] || 0;
    if (k >= 70) lines.push(G.fill(one(G.D13_TEXT.khatThoa), { speaker: c }));
    if (k >= 40) {
      const bonus = Math.round(k / 20);
      c.affection = clamp(c.affection + bonus, 0, 100);
      notes.push(`Khát khao được thỏa: Tình cảm +${bonus}`);
    }
    resetKhat(c);
    if (u && u.id === c.id) {
      if (u.outfit) {
        const o = G.OUTFITS[u.outfit];
        lines.push(G.fill(one(G.D13_TEXT.outfit[u.outfit]), { speaker: c }));
        const worn = (d.worn[c.id] = d.worn[c.id] || {});
        const first = !worn[u.outfit];
        worn[u.outfit] = (worn[u.outfit] || 0) + 1;
        const liked = G.likedOutfit(c) === u.outfit;
        c.affection = clamp(c.affection + 1 + (liked ? 2 : 0), 0, 100);
        if (first) G.changeFavor(c, G.OUTFIT_FIRST_FAVOR);
        notes.push(`${o.name}: Tình cảm +${1 + (liked ? 2 : 0)}${liked ? " (nàng thích)" : ""}${first ? `, lần đầu mặc Sủng ái +${G.OUTFIT_FIRST_FAVOR}` : ""}`);
      }
      for (const id of u.items) {
        if (G.bedStock(id) <= 0) continue;
        const it = G.BED_ITEMS[id];
        d.stock[id] = G.bedStock(id) - 1;
        lines.push(G.fill(one(G.D13_TEXT.item[id]), { speaker: c }));
        const fx = it.fx;
        const liked = G.likedItem(c) === id;
        if (fx.affection || liked) c.affection = clamp(c.affection + (fx.affection || 0) + (liked ? 2 : 0), 0, 100);
        if (fx.favor) G.changeFavor(c, fx.favor);
        if (fx.truyLac) G.addStat("truyLac", fx.truyLac);
        if (fx.longThe) G.addStat("longThe", fx.longThe);
        notes.push(`${it.name}: ${it.desc.replace(/^Che mắt hoặc quấn tay\. /, "")}${liked ? ", nàng thích: Tình cảm +2" : ""}`);
      }
    }
    if (lines.length && scene.pages && scene.pages.length) {
      const pages = scene.pages.slice();
      pages[0] = lines.join(" ") + "\n\n" + pages[0];
      Object.assign(scene, { pages, text: pages.join("\n\n") });
    }
    return scene;
  }
  const summonD13 = G.summon;
  G.summon = function (id, fetishIds) {
    const scene = summonD13(id, fetishIds);
    const c = G.findConsort(id);
    if (!scene || scene.blocked || !c) {
      d13().useNext = null;
      return scene;
    }
    return applyExtras(c, scene);
  };

  /* ================================================================== */
  /* Mini game mới: Xoa bóp, Cờ cởi áo                                    */
  /* ================================================================== */
  Object.assign(G.MINI_GAMES, {
    xoa_bop: { name: "Xoa bóp", desc: "Năm lần chạm, tìm ra hai chỗ nàng thích được xoa nhất. Thắng thì nàng xoa lại cho bệ hạ: Long thể +3.", likes: ["Dịu dàng", "Ôn nhu", "Đa sầu", "Lãng mạn", "Si tình", "Tinh tế"] },
    co_coi_ao: { name: "Cờ cởi áo", desc: "Xe, Pháo, Mã khắc nhau. Thua ván nào cởi một lớp áo, ai cởi hết ba lớp trước là thua.", likes: ["Tinh nghịch", "Phóng khoáng", "Hoang dã", "Lanh lợi", "Kiêu kỳ", "Mạnh mẽ"] },
  });
  G.MASSAGE_ZONES = ["Gáy", "Vai", "Lưng", "Eo", "Hông", "Đùi", "Bắp chân", "Bàn chân"];
  /** Hai chỗ nàng thích được xoa nhất (cố định theo từng phi). */
  G.massageFavs = (c) => {
    const n = G.MASSAGE_ZONES.length;
    const a = hash(c.id + "xb") % n;
    let b = hash(c.id + "xb2") % n;
    if (b === a) b = (a + 3) % n;
    return [a, b];
  };
  G.MASSAGE_TRIES = 5;
  G.MASSAGE_LONGTHE = 3;
  /** Kết thúc ván xoa bóp: found = số chỗ tìm ra (0–2). */
  G.massageEnd = function (c, found) {
    const outcome = found >= 2 ? "win" : found === 1 ? "draw" : "lose";
    const r = G.miniGameResult(c, "xoa_bop", outcome);
    const key = { win: "massageWin", draw: "massageDraw", lose: "massageLose" }[outcome];
    const line = G.fill(one(G.D13_TEXT[key]), { speaker: c });
    if (outcome === "win") {
      G.addStat("longThe", G.MASSAGE_LONGTHE);
      r.notes.push(`Nàng xoa lại cho bệ hạ: Long thể +${G.MASSAGE_LONGTHE}`);
    }
    return { outcome, line, text: r.text, notes: r.notes };
  };

  G.CO_MOVES = ["Xe", "Pháo", "Mã"]; // Xe ăn Pháo, Pháo ăn Mã, Mã ăn Xe
  G.CO_LAYERS = 3;
  /** Một nước cờ: trả về "win" | "lose" | "draw" cho bệ hạ, kèm nước của nàng. */
  G.coMove = function (c, mine) {
    const hers = Math.floor(rand() * 3);
    return { hers, res: G.coBeats(mine, hers) };
  };
  G.coBeats = (a, b) => (a === b ? "draw" : (a + 1) % 3 === b ? "win" : "lose"); // Xe→Pháo→Mã→Xe
  /** Câu khi nàng hoặc bệ hạ cởi lớp thứ i (0–2). */
  G.coLayerLine = (c, who, i) => G.fill(one(who === "her" ? G.D11_TEXT.undress[i] : G.D13_TEXT.meLayer[i]), { speaker: c });
  G.coEnd = function (c, won) {
    const r = G.miniGameResult(c, "co_coi_ao", won ? "win" : "lose");
    const line = G.fill(one(won ? G.D13_TEXT.coWin : G.D13_TEXT.coLose), { speaker: c });
    G.addStat("truyLac", 1);
    r.notes.push("Trụy lạc +1");
    return { line, text: r.text, notes: r.notes };
  };
})();
