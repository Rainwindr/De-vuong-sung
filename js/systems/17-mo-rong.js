/*
 * Mở rộng: Bệ hạ lên cấp phòng the, Dạo cung, Vi hành, Tú nữ mỗi mùa, Đêm kết hợp, Triệu đôi, Phòng tranh.
 * Câu chữ do Claude viết (mức gợi tình). Grok có thể viết lại.
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

  const d17 = (s) => {
    s = s || G.state;
    if (!s.d17) s.d17 = {};
    const d = s.d17;
    for (const [k, v] of Object.entries({ xp: 0, level: 1, perks: [], perkPending: 0, perkOffer: null, walkTurn: -1, walks: 0, viTurn: -99, seasonKey: null, art: [], mixNext: false })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d17 = d17;

  /* ================================================================== */
  /* Bệ hạ lên cấp phòng the                                              */
  /* ================================================================== */
  G.LV_XP = [0, 0, 40, 100, 180, 280, 400, 550, 720, 920, 1150]; // mốc kinh nghiệm để đạt cấp i
  G.LV_MAX = 10;
  G.LV_TITLES = ["", "Tân quân", "Thiếu niên thiên tử", "Đa tình quân vương", "Phong nhã quân vương", "Hoa gian quân chủ", "Ôn nhu thánh thượng", "Long uy chấn hậu cung", "Vạn hoa chi chủ", "Phong lưu thiên tử", "Thiên cổ đa tình đế"];
  G.PERKS = {
    them_hiep: { name: "Long tinh hổ mãnh", desc: "Mỗi đêm thêm 1 hiệp." },
    canh_re: { name: "Ngự thiện thông thạo", desc: "Canh bổ rẻ hơn 40%." },
    sung_ai: { name: "Miệng ngọt như mật", desc: "Mỗi đêm thị tẩm, nàng được Sủng ái +2." },
    tinh_cam: { name: "Ôn nhu săn sóc", desc: "Mỗi đêm thị tẩm, nàng được Tình cảm +2." },
    long_the: { name: "Bổ thận cố tinh", desc: "Mỗi tháng Long thể +2." },
    thuyet_phuc: { name: "Khéo dỗ dành", desc: "Thuyết phục sở thích cần ít hơn 5 điểm." },
    long_chung: { name: "Long chủng dồi dào", desc: "Dễ có long thai hơn 20%." },
  };
  G.XP = { night: 10, extra: 5, round: 6, game: 4 };
  G.hasPerk = (k) => !!G.state && d17().perks.includes(k);
  G.emperorLevel = () => (G.state ? d17().level : 1);
  G.emperorTitle = () => G.LV_TITLES[G.emperorLevel()] || "";
  G.levelInfo = function () {
    const d = d17();
    const lv = d.level;
    const cur = G.LV_XP[lv] || 0;
    const next = lv >= G.LV_MAX ? null : G.LV_XP[lv + 1];
    return { level: lv, title: G.LV_TITLES[lv], xp: d.xp, cur, next, pct: next ? Math.round(((d.xp - cur) / (next - cur)) * 100) : 100, pending: d.perkPending, offer: d.perkOffer, perks: d.perks };
  };
  function offerPerks(d) {
    const left = Object.keys(G.PERKS).filter((k) => !d.perks.includes(k));
    d.perkOffer = left.length ? shuffle(left).slice(0, 3) : null;
    if (!d.perkOffer) d.perkPending = 0;
  }
  G.gainXp = function (n) {
    const d = d17();
    if (!n) return null;
    d.xp += n;
    let up = null;
    while (d.level < G.LV_MAX && d.xp >= G.LV_XP[d.level + 1]) {
      d.level++;
      d.perkPending++;
      up = d.level;
      log(`Bệ hạ lên cấp phòng the ${d.level}: ${G.LV_TITLES[d.level]}.`, "milestone");
      if (G.pushFx) G.pushFx({ type: "stamp", text: "Lên cấp", sub: `Cấp ${d.level} · ${G.LV_TITLES[d.level]}` });
    }
    if (d.perkPending && !d.perkOffer) offerPerks(d);
    return up;
  };
  G.choosePerk = function (k) {
    const d = d17();
    if (!d.perkPending || !d.perkOffer || !d.perkOffer.includes(k) || !G.PERKS[k]) return false;
    d.perks.push(k);
    d.perkPending--;
    d.perkOffer = null;
    if (d.perkPending) offerPerks(d);
    log(`Bệ hạ lĩnh hội: ${G.PERKS[k].name}.`, "milestone");
    return true;
  };
  // tác dụng đặc quyền
  const baseCanh = G.CANH_BO_COST;
  Object.defineProperty(G, "CANH_BO_COST", { configurable: true, get: () => Math.round(baseCanh * (G.hasPerk("canh_re") ? 0.6 : 1)) });
  const roundD17 = G.roundState;
  G.roundState = function (c) {
    const r = roundD17(c);
    if (r && G.hasPerk("them_hiep")) {
      r.max++;
      r.left++;
      if (r.left > 0 && r.why === "Bệ hạ đã hết sức đêm nay.") r.why = null;
    }
    return r;
  };
  if (G.persuadeNeedFor) {
    const pnD17 = G.persuadeNeedFor;
    G.persuadeNeedFor = (c, fid) => pnD17(c, fid) - (G.hasPerk("thuyet_phuc") ? 5 : 0);
  }
  const pnBase = G.persuadeNeed;
  G.persuadeNeed = (fid) => pnBase(fid) - (G.hasPerk("thuyet_phuc") ? 5 : 0);
  const queD17 = G.queMult;
  G.queMult = (k) => queD17(k) * (k === "conceive" && G.hasPerk("long_chung") ? 1.2 : 1);
  monthly((s) => {
    if (!s.ended && G.hasPerk("long_the")) G.addStat("longThe", 2);
  });
  // kinh nghiệm
  const spendD17 = G.spendNight;
  G.spendNight = function (list, opts) {
    const r = spendD17(list, opts);
    const arr = (list || []).filter(Boolean);
    if (arr.length && G.state && !G.state.ended) {
      G.gainXp(G.XP.night + G.XP.extra * (arr.length - 1));
      for (const c of arr) {
        const live = G.findConsort(c.id);
        if (!live) continue;
        if (G.hasPerk("sung_ai")) G.changeFavor(live, 2);
        if (G.hasPerk("tinh_cam")) live.affection = clamp(live.affection + 2, 0, 100);
      }
    }
    return r;
  };
  const extraD17 = G.extraRound;
  G.extraRound = function (cid, fid) {
    const sc = extraD17(cid, fid);
    if (sc && !sc.blocked) G.gainXp(G.XP.round);
    return sc;
  };
  if (G.nightGameResult) {
    const ngD17 = G.nightGameResult;
    G.nightGameResult = function (c, id, outcome) {
      G.gainXp(G.XP.game);
      return ngD17(c, id, outcome);
    };
  }

  /* ================================================================== */
  /* Dạo cung: ghé một cung bất chợt                                      */
  /* ================================================================== */
  G.WALK_PER_MONTH = 2;
  G.D17_TEXT = {
    walk: [
      "Bệ hạ bước vào {palace} không cho người báo trước. Sau bình phong, {name} đang ngâm mình trong thùng gỗ, hơi nước mờ mịt, tóc ướt xõa trên vai trần.\n> Bệ hạ… sao không báo trước, thiếp còn chưa kịp mặc gì.",
      "Trong {palace}, {name} ngồi bên cửa sổ gảy đàn, áo mỏng trễ một bên vai. Thấy bệ hạ, tiếng đàn lạc mất một nhịp.\n> Bệ hạ nghe trộm thiếp từ bao giờ vậy?",
      "{name} đang ngồi trước gương đồng trong {palace}, tay cầm son, áo choàng buộc hờ. Nàng nhìn bệ hạ qua gương, khẽ cười.\n> Thiếp vừa định tô son đợi bệ hạ, ai ngờ bệ hạ đến sớm thế.",
      "{palace} yên ắng giữa trưa. {name} đang ngủ, chăn mỏng tuột xuống ngang hông. Nàng mở mắt khi bệ hạ ngồi xuống mép giường.\n> Bệ hạ… thiếp vừa mơ thấy bệ hạ, mở mắt ra đã thấy thật.",
      "Một mình giữa sân trong {palace}, {name} đang tập múa, dải lụa xoay tròn, mồ hôi lấm tấm trên cổ. Nàng dừng lại, thở gấp.\n> Bệ hạ xem được bao lâu rồi? Thiếp múa riêng cho bệ hạ một khúc nhé.",
      "{name} đang thêu dở chiếc yếm đỏ trong {palace}, thấy bệ hạ thì vội giấu ra sau lưng, mặt đỏ bừng.\n> Cái này… thiếp định đêm nào đó mặc cho bệ hạ xem.",
      "Bệ hạ bắt gặp {name} vừa thay y phục trong {palace}, áo lót còn chưa cài, nàng quay lại nhìn, không vội che.\n> Bệ hạ đến đúng lúc thiếp chưa biết mặc bộ nào. Bệ hạ chọn giúp thiếp đi.",
    ],
  };
  G.canWalk = () => {
    const d = d17();
    if (d.walkTurn !== G.state.turn) return true;
    return d.walks < G.WALK_PER_MONTH;
  };
  /** Dạo cung: trả về sự kiện đã chuẩn bị, hoặc { why }. */
  G.walkPalace = function (pid) {
    const s = G.state;
    const d = d17();
    if (!G.canWalk()) return { why: `Tháng này bệ hạ đã dạo cung ${G.WALK_PER_MONTH} lần rồi.` };
    const M = G.palaceMap();
    const p = M.all.find((x) => x.id === pid);
    const res = (M.residents[pid] || []).filter((c) => c.pregnantDue == null || (G.pregnantSummonOk && G.pregnantSummonOk(c)));
    if (!p || !res.length) return { why: "Cung này không có ai để ghé." };
    if (d.walkTurn !== s.turn) {
      d.walkTurn = s.turn;
      d.walks = 0;
    }
    d.walks++;
    const c = pick(res);
    const text = pick(G.D17_TEXT.walk).replace(/\{palace\}/g, p.name);
    const can = !G.cannotSummon(c);
    return G.prepareEvent(
      {
        id: "sys.dao_cung",
        title: "Dạo cung · " + p.name,
        text,
        choices: [
          can ? { label: "Ở lại cùng nàng", hook: "core.thi_tam", participants: "speaker", effects: { night: true, affection: 3 } } : null,
          { label: "Ngồi trò chuyện một lúc", effects: { affection: 3, favor: 2 } },
          { label: "Mỉm cười rồi rời đi", effects: { affection: 1 } },
        ].filter(Boolean),
      },
      { speaker: c }
    );
  };

  /* ================================================================== */
  /* Vi hành                                                             */
  /* ================================================================== */
  G.VI_HANH_COST = 300;
  G.VI_HANH_GAP = 3; // tháng
  G.VI_HANH_PLACES = {
    cho_dem: { name: "Chợ đêm kinh thành", intro: "Bệ hạ khoác áo thường dân, len giữa chợ đêm đông vui, đèn lồng đỏ treo kín hai bên phố." },
    hoa_dang: { name: "Hội hoa đăng bên sông", intro: "Bờ sông lấp lánh đèn hoa đăng, bệ hạ đứng lẫn giữa dòng người xem thả đèn." },
    tra_lau: { name: "Trà lâu Vọng Giang", intro: "Bệ hạ ngồi một góc trên lầu Vọng Giang, nghe tiếng tỳ bà vọng từ gian bên." },
    chua_nui: { name: "Chùa núi ngoại thành", intro: "Bệ hạ lên chùa núi lúc sương sớm, chuông chùa ngân xa, hương trầm thoảng trong gió." },
  };
  G.canViHanh = () => G.state.turn - d17().viTurn >= G.VI_HANH_GAP;
  G.viHanh = function (placeId) {
    const s = G.state;
    const d = d17();
    const pl = G.VI_HANH_PLACES[placeId];
    if (!pl) return { ok: false, text: "Không có nơi này." };
    if (!G.canViHanh()) return { ok: false, text: `Mỗi ${G.VI_HANH_GAP} tháng mới vi hành được một lần.` };
    if (s.stats.quocKho < G.VI_HANH_COST && !(s.godFlags && s.godFlags.infiniteMoney)) return { ok: false, text: `Ngân khố không đủ (cần ${G.VI_HANH_COST} lượng).` };
    G.addStat("quocKho", -G.VI_HANH_COST);
    d.viTurn = s.turn;
    const notes = [`Quốc khố −${G.VI_HANH_COST}`];
    const r = rand();
    if (r < 0.45) {
      const def = G.makeRecruit(`Gặp khi vi hành · ${pl.name}`);
      def.age = Math.max(def.age, 20);
      log(`Bệ hạ vi hành ${pl.name}, gặp một giai nhân.`, "story");
      return { ok: true, kind: "beauty", recruit: def, text: `${pl.intro} Giữa đám đông, bệ hạ chạm mắt một giai nhân dung mạo khác thường. Nàng không biết người trước mặt là thiên tử, chỉ mỉm cười đáp lễ. Hỏi ra mới biết nàng tên ${def.name}, ${def.age} tuổi, chưa hứa hôn nhà nào.`, notes };
    }
    if (r < 0.8) {
      const items = shuffle(Object.keys(G.BED_ITEMS)).slice(0, 2);
      for (const id of items) G.d13().stock[id] = G.bedStock(id) + 2;
      notes.push(...items.map((id) => `${G.BED_ITEMS[id].name} ×2 vào Kho phòng the`));
      log(`Bệ hạ vi hành ${pl.name}, mua được đồ lạ mang về cung.`, "story");
      return { ok: true, kind: "shop", text: `${pl.intro} Một gian hàng nhỏ bày toàn thứ trong cung chưa từng thấy. Ông chủ hạ giọng giới thiệu từng món, bệ hạ cười, sai người gói hết mang về.`, notes };
    }
    G.addStat("longThe", 3);
    G.addStat("truyLac", 1);
    notes.push("Long thể +3", "Trụy lạc +1");
    log(`Bệ hạ vi hành ${pl.name}, vui chơi đến khuya.`, "story");
    return { ok: true, kind: "fun", text: `${pl.intro} Không ai nhận ra thiên tử. Bệ hạ uống trà, nghe hát, xem múa đến tận khuya rồi mới hồi cung, lòng nhẹ hẳn.`, notes };
  };

  /* ================================================================== */
  /* Tú nữ mỗi mùa: một giai nhân tuyệt sắc mỗi đầu mùa                   */
  /* ================================================================== */
  G.SEASON_BEAUTY_COST = 500;
  const SEASON_NAME = { 1: "Xuân", 4: "Hạ", 7: "Thu", 10: "Đông" };
  monthly((s, report) => {
    if (s.ended || !SEASON_NAME[s.month]) return;
    const d = d17(s);
    const key = s.year + "-" + s.month;
    if (d.seasonKey === key) return;
    d.seasonKey = key;
    const def = G.makeRecruit(`Tú nữ mùa ${SEASON_NAME[s.month]} · tuyệt sắc`);
    def.age = Math.max(def.age, 20);
    def.traits = ["Tuyệt sắc"].concat(def.traits.slice(0, 2));
    def.special = true;
    const rare = shuffle(Object.values(R.fetishes).filter((f) => f.tier >= 2).map((f) => f.id)).slice(0, 3);
    def.consent = Object.assign({}, def.consent);
    for (const f of rare) def.consent[f] = "willing";
    def.likes = [...new Set((def.likes || []).concat(rare.slice(0, 1)))];
    const names = rare.map((f) => (R.fetishes[f] || {}).name).filter(Boolean).join(", ");
    const ev = G.prepareEvent(
      {
        id: "sys.tu_nu_mua",
        title: `Tú nữ mùa ${SEASON_NAME[s.month]}`,
        text: `Nội vụ phủ dâng lên một bức họa: ${def.name}, ${def.age} tuổi, ${def.origin.split(" · ")[0].toLowerCase()}. Người trong tranh dung nhan hiếm có, nghe nói tính tình phóng khoáng, sẵn lòng với ${names || "nhiều trò phòng the"} ngay từ đầu.\n> Thần nữ ${def.name} xin được hầu hạ bệ hạ.`,
        choices: [
          { label: "Lưu bài tử, cho nhập cung", cost: G.SEASON_BEAUTY_COST, _take: true },
          { label: "Ban hoa cho về", effects: {} },
        ],
        onChoose: (ch, sp, notes) => {
          if (!ch._take) return;
          const c = G.addConsort(def.id, true);
          if (!c) return;
          c.favor = Math.max(c.favor, 30);
          c.affection = Math.max(c.affection, 30);
          log(`${c.name}, tú nữ tuyệt sắc mùa ${SEASON_NAME[s.month]}, nhập cung.`, "harem");
          notes.push(`${c.name} nhập cung`, "Sẵn lòng: " + (names || "—"));
        },
      },
      { speaker: def }
    );
    if (ev.choices.length) report.sideEvents.unshift(ev);
    if (G.SIDE_MAX && report.sideEvents.length > G.SIDE_MAX + 1) report.sideEvents.pop();
  });

  /* ================================================================== */
  /* Đêm kết hợp: ghép đoạn từ 2–3 sở thích                               */
  /* ================================================================== */
  G.setMixNext = (on) => (d17().mixNext = !!on);
  const hookD17 = G.runHook;
  G.runHook = function (id, ctxIn) {
    const d = G.state ? d17() : null;
    const mix = d && d.mixNext && id !== "core.thi_tam";
    if (d) d.mixNext = false;
    const scene = hookD17(id, ctxIn);
    const fx = (ctxIn && ctxIn.fetish) || [];
    if (!mix || !scene || scene.blocked || fx.length < 2 || !G.textPagesFor) return scene;
    const s = G.state;
    const ps = (ctxIn.participants || []).map((p) => ({ id: p.id, name: p.name, title: G.displayTitle(p), rank: G.RANKS[p.rank], nights: p.nights || 0 }));
    const ctx = { participants: ps, fetish: fx, emperor: { name: s.emperorName }, extra: {} };
    const parts = fx.slice(0, 3).map((f) => ({ f, pages: G.textPagesFor("core.thi_tam_so_thich", f, ctx) })).filter((x) => x.pages && x.pages.length >= 2);
    if (parts.length < 2) return scene;
    const A = parts[0].pages, B = parts[1].pages, C = (parts[2] || parts[0]).pages;
    const pages = [A[0], A[1] || A[0], B[Math.floor(B.length / 2)], B[Math.min(B.length - 2, Math.floor(B.length / 2) + 1)] || B[B.length - 1], C[C.length - 1]].filter((x, i, arr) => x && arr.indexOf(x) === i);
    const names = parts.map((x) => (R.fetishes[x.f] || {}).name).join(" · ");
    return Object.assign({}, scene, { title: `Đêm kết hợp · ${ps[0] ? ps[0].name : ""}`, pages, text: pages.join("\n\n"), mixNames: names });
  };

  /* ================================================================== */
  /* Triệu đôi: hai phi thân thiết hầu cùng đêm                           */
  /* ================================================================== */
  G.PAIR_MIN = 61;
  G.PAIR_FX = "canh-viet.hai_nguoi";
  // cả hai phải sẵn lòng với "Hai người cùng hầu" thì cảnh mới có đủ hai người (cặp thân thiết tự mở sở thích này, không cần chờ mở tầng)
  const pairWilling = (a, b) => !!R.fetishes[G.PAIR_FX] && G.consentOf(a, G.PAIR_FX) === "willing" && G.consentOf(b, G.PAIR_FX) === "willing";
  G.pairsForNight = function () {
    return G.listPairs()
      .filter((p) => p.tinhY >= G.PAIR_MIN && !G.cannotSummon(p.a) && !G.cannotSummon(p.b) && pairWilling(p.a, p.b))
      .slice(0, 6);
  };
  G.summonPair = function (aId, bId) {
    const a = G.findConsort(aId);
    const b = G.findConsort(bId);
    if (!a || !b) return null;
    const why = G.cannotSummon(a) || G.cannotSummon(b);
    if (why) return { title: "Không thể triệu", text: why, blocked: true };
    const useFx = pairWilling(a, b);
    const scene = G.runHook(useFx ? "core.thi_tam_so_thich" : "core.thi_tam", { participants: [a, b], fetish: useFx ? [G.PAIR_FX] : [], place: "duong_tam_dien" });
    if (scene.blocked) return scene;
    G.spendNight([a, b]);
    for (const c of [a, b]) {
      G.changeFavor(c, 6);
      c.affection = clamp(c.affection + 3, 0, 100);
    }
    log(`Đêm nay ${a.name} và ${b.name} cùng hầu bệ hạ.`, "night");
    scene.notes = (scene.notes || []).concat([`${a.name}, ${b.name}: Sủng ái +6, Tình cảm +3`, "Long thể −1"]);
    return scene;
  };

  /* ================================================================== */
  /* Phòng tranh: ghi lại ảnh đã hiện                                     */
  /* ================================================================== */
  G.ART_KEEP = 400;
  G.markArtSeen = function (src) {
    if (!G.state || !src) return;
    const d = d17();
    if (d.art.includes(src)) return;
    d.art.push(src);
    if (d.art.length > G.ART_KEEP) d.art.splice(0, d.art.length - G.ART_KEEP);
  };
  G.artSeen = () => (G.state ? d17().art.slice() : []);

  /* ================================================================== */
  /* Khát khao: tăng chậm hơn, nhãn chỉ ở 3 người khát nhất               */
  /* ================================================================== */
  if (G.KHAT_RISE) G.KHAT_RISE = [3, 5, 7];
  G.KHAT_BADGE_MAX = 3;
  G.khatBadge = function (c) {
    if (!G.khatOf || !c || G.khatOf(c) < G.KHAT_ASK_AT) return false;
    const top = G.state.consorts.filter((x) => G.khatOf(x) >= G.KHAT_ASK_AT).sort((a, b) => G.khatOf(b) - G.khatOf(a)).slice(0, G.KHAT_BADGE_MAX);
    return top.some((x) => x.id === c.id);
  };
})();
