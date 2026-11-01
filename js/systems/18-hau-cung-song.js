/*
 * Hậu cung sống động: Thư mời của phi, Tranh sủng, Tỷ muội, Thử thách đêm, Tấu chương đêm khuya, Mỹ nhân ngoại bang.
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
  const one = (a) => (Array.isArray(a) ? pick(a) : a);
  const hash = (str) => {
    let h = 2166136261;
    for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return h;
  };

  const d18 = (s) => {
    s = s || G.state;
    if (!s.d18) s.d18 = {};
    const d = s.d18;
    for (const [k, v] of Object.entries({ letterTurn: -99, rivalTurn: -99, memoTurn: -99, envoyTurn: -99, nlog: [], chal: {} })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d18 = d18;
  const sideRoom = (report) => report.sideEvents.length < (G.SIDE_MAX || 2) + 1;
  const free = (c) => c && c.pregnantDue == null && !G.cannotSummon(c) && !(G.isSulking && G.isSulking(c));
  const sulk = (c, months) => {
    if (G.d3) G.d3().sulk[c.id] = G.state.turn + months;
  };
  const addPage = (scene, page, atStart) => {
    if (!scene || scene.blocked || !page) return scene;
    const pages = scene.pages && scene.pages.length ? scene.pages.slice() : [scene.text || ""];
    if (atStart) pages.unshift(page);
    else pages.push(page);
    scene.pages = pages;
    scene.text = pages.join("\n\n");
    return scene;
  };
  const fillC = (t, a, b) => G.fill(t, { speaker: a, speaker2: b });

  G.D18_TEXT = {
    letterPlaces: [
      { id: "dinh_sen", name: "đình sen", intro: "Gió đêm đưa hương sen thoảng tới. Trong đình, {name} ngồi bên chiếc bàn đá, áo lụa mỏng vén hờ, chén rượu hoa quế đã rót sẵn hai chén.\n> Thần thiếp chờ bệ hạ từ lúc trăng còn thấp. Bệ hạ đến rồi, sen nở cũng không còn đẹp bằng." },
      { id: "lau_trang", name: "lầu ngắm trăng", intro: "Lầu cao lộng gió, rèm trắng bay phần phật. {name} tựa lan can, tóc xõa, chỉ khoác một tấm áo choàng mỏng, quay lại cười khi nghe tiếng bước chân bệ hạ.\n> Trên này chỉ có trăng nhìn thấy chúng ta thôi, bệ hạ." },
      { id: "suoi_nong", name: "suối nước nóng sau núi", intro: "Hơi nước bốc mờ mịt dưới ánh đèn lồng. {name} đã ngâm mình trong làn nước ấm, cánh hoa nổi quanh bờ vai trần, đưa tay về phía bệ hạ.\n> Nước vừa ấm, bệ hạ xuống cùng thần thiếp đi." },
      { id: "thu_cac", name: "thư các phía tây", intro: "Giữa những giá sách cao, một ngọn nến nhỏ. {name} ngồi trên án thư, tà váy buông xuống, tay cầm cuốn sách mở dở mà mắt chỉ nhìn bệ hạ.\n> Thần thiếp đọc mãi không vào chữ nào. Bệ hạ dạy thần thiếp đọc đi." },
      { id: "vuon_mai", name: "vườn mai", intro: "Hoa mai trắng rụng đầy lối. {name} đứng dưới gốc mai già, khăn choàng trễ xuống vai, má lạnh mà mắt thì nóng.\n> Thần thiếp lạnh lắm, bệ hạ ôm thần thiếp một chút được không?" },
      { id: "thuyen_hoa", name: "thuyền hoa trên hồ", intro: "Chiếc thuyền hoa trôi giữa hồ, rèm buông kín. Bên trong, {name} nằm nghiêng trên nệm gấm, đèn lồng đỏ hắt lên làn da mịn.\n> Thuyền trôi ra giữa hồ rồi, không ai nghe thấy gì đâu, bệ hạ." },
    ],
    letter: "Một cung nữ rụt rè dâng lên phong thư dán sáp hồng, thoảng mùi hương quen. Nét chữ mềm mại:\n> {name} kính dâng bệ hạ. Đêm nay thần thiếp chờ ở {place}. Bệ hạ không đến, thần thiếp sẽ chờ đến sáng.",
    letterNo: ["{name} nghe tin bệ hạ không đến, lặng lẽ thổi tắt nến. Sáng hôm sau nàng không ra đón, chỉ sai cung nữ trả lại chiếc trâm bệ hạ ban.", "Cung nữ về báo {name} chờ đến canh ba mới về cung, mắt đỏ hoe, không nói lời nào."],
    rival: {
      gift: "Bệ hạ vừa định sang cung {name2} thì thái giám dâng lên một hộp bánh hạnh nhân còn ấm, kèm mảnh giấy thơm của {name}:\n> Thần thiếp tự tay làm. Bánh ngọt, nhưng không ngọt bằng thần thiếp. Bệ hạ có muốn nếm thử cả hai không?",
      dress: "Trên hành lang dẫn sang cung {name2}, {name} đứng đợi sẵn trong bộ váy lụa mỏng tang, đèn lồng sau lưng làm lộ rõ đường cong. Nàng khẽ nghiêng đầu.\n> Bệ hạ đi vội thế, không nhìn thần thiếp lấy một lần sao?",
      block: "Giữa ngự hoa viên, {name} ngồi chắn ngay lối đi, gảy một khúc tì bà triền miên. Tiếng đàn dừng khi bệ hạ đến gần.\n> Đường sang cung tỷ tỷ {name2} xa lắm. Cung thần thiếp ở ngay đây thôi.",
      bath: "Cung nữ của {name} chạy tới thưa nhỏ: chủ tử vừa tắm sữa và cánh hoa xong, da còn thơm, xin bệ hạ ghé qua ngửi thử. Nghe nói nàng còn chưa kịp mặc áo.",
      dance: "Ngay trước cửa Dưỡng Tâm điện, {name} múa dưới trăng, dải lụa trắng vờn quanh thân, mỗi vòng xoay lại hé thêm một chút da thịt. Khúc múa kết thúc khi nàng ngã vào lòng bệ hạ.\n> Thần thiếp tập cả tháng, chỉ để múa cho bệ hạ xem một lần.",
    },
    rivalWin: "{name2} nghe tin bệ hạ theo {name} về cung, bẻ gãy cây trâm trong tay.",
    friendPage: "{name} và {name2} vốn là tỷ muội thân thiết. Hai nàng nhìn nhau cười, phối hợp ăn ý như đã bàn trước: người cởi áo cho bệ hạ, người rót rượu, thay nhau trêu chọc đến khi bệ hạ không nhịn được nữa.",
    foePage: [
      "{name} liếc {name2} từ đầu đến chân.\n> Muội muội mặc thế này, định làm bệ hạ lạnh chết sao?\n{name2} cười nhạt, cố ý ngồi sát vào lòng bệ hạ hơn.\n> Tỷ tỷ lo cho mình đi, bệ hạ thích ai thì bệ hạ tự biết.",
      "Hai nàng tranh nhau chỗ bên phải bệ hạ, không ai chịu nhường.\n> Thần thiếp đến trước.\n> Thần thiếp được bệ hạ gọi tên trước.\nBệ hạ phải kéo cả hai vào lòng mới yên. Từ đó, hai nàng càng ra sức tranh nhau làm bệ hạ vui.",
      "{name} nói khẽ vào tai bệ hạ, đủ để {name2} nghe thấy:\n> Bệ hạ xem, muội ấy run như lá, sao hầu nổi bệ hạ.\n{name2} đỏ mặt, cắn môi, rồi chẳng nói chẳng rằng mà chủ động trước, như để chứng minh.",
    ],
    chal: {
      no_items: { ask: "Đêm nay bệ hạ không được dùng món đồ nào cả. Chỉ có bệ hạ và thần thiếp thôi.", rule: "Không dùng đồ dùng hay đồ riêng nào", end: "Không dầu thơm, không lụa, không chuông, chỉ có hơi ấm của hai người. Gần sáng, {name} gối đầu lên ngực bệ hạ, thì thầm:\n> Thần thiếp biết mà. Bệ hạ chỉ cần thần thiếp là đủ." },
      outfit: { ask: "Thần thiếp muốn mặc {outfit} cho bệ hạ xem. Bệ hạ nhớ chọn đúng bộ đó nhé.", rule: "Chọn y phục: {outfit}", end: "Bệ hạ cởi {outfit} trên người {name} chậm đến mức nàng phải bật cười.\n> Bệ hạ nhớ thật. Thần thiếp mặc bộ này chỉ để chờ đôi tay bệ hạ thôi." },
      nude: { ask: "Đêm nay thần thiếp không muốn mặc gì cả. Bệ hạ đừng bắt thần thiếp mặc áo nhé.", rule: "Chọn y phục: Không mặc gì", end: "{name} không mặc gì suốt đêm, đi lại trong tẩm cung như thể đó là chuyện tự nhiên nhất. Khi rót trà cho bệ hạ, nàng cố tình cúi thật thấp.\n> Thần thiếp thích bệ hạ nhìn thần thiếp như thế này." },
      like: { ask: "Đêm nay bệ hạ chọn điều thần thiếp thích nhất đi. Bệ hạ có biết là gì không?", rule: "Chọn một sở thích nàng thích (♥)", end: "{name} mở to mắt khi biết bệ hạ chọn đúng điều nàng mong.\n> Bệ hạ để ý đến thần thiếp thật. Đêm nay thần thiếp sẽ không để bệ hạ ngủ đâu." },
      plain: { ask: "Đêm nay bệ hạ đừng bày trò gì cả, chỉ ôm thần thiếp như đêm đầu tiên thôi.", rule: "Không chọn sở thích nào (đêm thường)", end: "Không trò gì, chỉ những nụ hôn chậm và vòng tay siết chặt. {name} khóc khẽ lúc nào không hay.\n> Giống hệt đêm đầu. Thần thiếp nhớ mãi đêm ấy." },
      game: { ask: "Muốn có thần thiếp đêm nay, bệ hạ phải thắng thần thiếp một ván trò trong đêm đã.", rule: "Thắng một ván ở \"Trò trong đêm\"", end: "{name} thua cuộc, giả vờ phụng phịu rồi tự tay tháo dải lưng.\n> Thần thiếp chịu thua. Bệ hạ muốn đòi thưởng gì cũng được." },
    },
    chalFail: "Bệ hạ không giữ điều kiện nàng đặt ra. {name} vẫn hầu bệ hạ, nhưng môi hơi bĩu.",
    memo: [
      { title: "Giang Nam lũ lớn", text: "Đê sông vỡ ba chỗ, dân Giang Nam phải lên mái nhà tránh nước. Bộ Công xin chỉ dụ mở kho cứu tế." },
      { title: "Biên ải báo động", text: "Ngoài ải bắc có bóng kỵ binh lạ. Tướng trấn thủ xin lệnh điều thêm quân." },
      { title: "Tri phủ tham ô", text: "Ngự sử đài dâng chứng cứ tri phủ Lâm An bòn rút tiền cứu đói. Xin bệ hạ định tội ngay để giữ lòng dân." },
      { title: "Hạn hán miền tây", text: "Ba tháng không mưa, ruộng nứt nẻ. Bộ Hộ xin miễn thuế và mở đàn cầu mưa." },
      { title: "Sứ thần đến sớm", text: "Đoàn sứ thần phương nam đến kinh thành sớm hai ngày. Lễ bộ cuống cuồng xin chỉ dụ tiếp đón." },
    ],
    memoAsk: "{name} vừa cởi áo khoác cho bệ hạ thì ngoài cửa có tiếng thái giám hớt hải:\n> Bệ hạ, có tấu khẩn!\n{memo}. {memoText}\n{name} níu tay áo bệ hạ, mắt van nài.",
    memoGo: "Bệ hạ khoác lại long bào, sang thư phòng phê tấu đến gần sáng. Triều thần tâu bệ hạ anh minh. Còn {name} ngồi một mình bên ngọn nến đã tàn.",
    memoStay: "Bệ hạ phẩy tay: \"Để đến sáng.\" Thái giám lui ra. {name} cười rạng rỡ, kéo bệ hạ ngã xuống giường. Sáng hôm sau, nghe nói vài vị đại thần than thở ngoài điện.",
  };

  /* ================================================================== */
  /* Ghi lại các đêm gần đây (cho Tranh sủng)                             */
  /* ================================================================== */
  const spendD18 = G.spendNight;
  G.spendNight = function (list, opts) {
    const r = spendD18(list, opts);
    if (G.state && !G.state.ended) {
      const d = d18();
      for (const c of (list || []).filter(Boolean)) d.nlog.push([c.id, G.state.turn]);
      if (d.nlog.length > 40) d.nlog.splice(0, d.nlog.length - 40);
    }
    return r;
  };
  G.recentNights = function (months) {
    const s = G.state;
    const out = {};
    for (const [id, t] of d18().nlog) if (s.turn - t < months) out[id] = (out[id] || 0) + 1;
    return out;
  };

  /* ================================================================== */
  /* 13. Phi tự tìm đến: thư mời                                          */
  /* ================================================================== */
  G.LETTER_CHANCE = 0.14;
  G.LETTER_GAP = 3;
  monthly((s, report) => {
    if (s.ended || !s.consorts.length || !sideRoom(report)) return;
    const d = d18(s);
    if (s.turn - d.letterTurn < G.LETTER_GAP || rand() >= G.LETTER_CHANCE) return;
    const list = s.consorts.filter((c) => free(c) && c.affection >= 40 && c.favor >= 20);
    if (!list.length) return;
    const c = pick(list);
    const place = pick(G.D18_TEXT.letterPlaces);
    d.letterTurn = s.turn;
    const p = G.prepareEvent(
      {
        id: "sys.thu_moi",
        title: "Thư mời giữa đêm",
        text: G.D18_TEXT.letter.replace("{place}", place.name),
        choices: [
          { label: `Đến ${place.name}`, hook: "core.thi_tam", participants: "speaker", effects: { affection: 5, favor: 4 }, _place: place.id },
          { label: "Gửi lời hẹn khác", effects: { affection: -3 }, _no: true },
        ],
        onChoose: (ch, sp) => {
          const live = G.findConsort(c.id);
          if (!live) return;
          if (ch._no) {
            sulk(live, 1);
            log(fillC(one(G.D18_TEXT.letterNo), live), "harem");
          } else d18()._letterIntro = fillC(place.intro, live);
        },
      },
      { speaker: c }
    );
    if (p.choices.length) report.sideEvents.push(p);
  });

  /* ================================================================== */
  /* 14. Phi ghen và tranh sủng                                           */
  /* ================================================================== */
  G.RIVAL_CHANCE = 0.35;
  G.RIVAL_GAP = 4;
  G.RIVAL_NIGHTS = 3; // số đêm trong 3 tháng của một phi để phi khác ghen
  monthly((s, report) => {
    if (s.ended || s.consorts.length < 3 || !sideRoom(report)) return;
    const d = d18(s);
    if (s.turn - d.rivalTurn < G.RIVAL_GAP) return;
    const recent = G.recentNights(3);
    const total = Object.values(recent).reduce((a, b) => a + b, 0);
    const top = Object.entries(recent).sort((a, b) => b[1] - a[1])[0];
    if (!top || top[1] < G.RIVAL_NIGHTS || top[1] < total * 0.5) return;
    const fav = G.findConsort(top[0]);
    if (!free(fav) || rand() >= G.RIVAL_CHANCE) return;
    const rivals = s.consorts.filter((c) => c.id !== fav.id && free(c) && c.favor >= 25 && c.affection >= 30);
    if (!rivals.length) return;
    const r = rivals.sort((a, b) => b.favor - a.favor)[Math.floor(rand() * Math.min(3, rivals.length))];
    const kind = pick(Object.keys(G.D18_TEXT.rival));
    d.rivalTurn = s.turn;
    const p = G.prepareEvent(
      {
        id: "sys.tranh_sung",
        title: "Tranh sủng",
        text: G.D18_TEXT.rival[kind],
        choices: [
          { label: "Theo {name} về cung nàng", hook: "core.thi_tam", participants: "speaker", effects: { favor: 6, affection: 3 }, _rival: true },
          { label: "Vẫn sang cung {name2}", hook: "core.thi_tam", participants: [fav.id], effects: { favor2: 3 }, _fav: true },
          { label: "Khen nàng khéo, ban thưởng rồi về nghỉ", effects: { affection: 2 } },
        ],
        onChoose: (ch) => {
          const a = G.findConsort(r.id);
          const b = G.findConsort(fav.id);
          if (ch._rival && b) {
            G.changeFavor(b, -3);
            sulk(b, 1);
            log(fillC(G.D18_TEXT.rivalWin, a || r, b), "harem");
          }
          if (ch._fav && a) a.affection = clamp(a.affection - 2, 0, 100);
        },
      },
      { speaker: r, speaker2: fav }
    );
    if (p.choices.length) report.sideEvents.push(p);
  });

  /* ================================================================== */
  /* 15. Tỷ muội thân và đôi không ưa nhau                                */
  /* ================================================================== */
  const pairH = (a, b) => hash([a, b].sort().join("~")) % 100;
  G.FRIEND_P = 18; // % cặp thân
  G.FOE_P = 7; // % cặp không ưa
  G.friendsOf = function (c) {
    if (!c || !G.state) return [];
    const others = G.state.consorts.filter((o) => o.id !== c.id);
    if (!others.length) return [];
    const sorted = others.map((o) => [o, pairH(c.id, o.id)]).sort((x, y) => x[1] - y[1]);
    let fr = sorted.filter(([, h]) => h < G.FRIEND_P).slice(0, 2).map(([o]) => o);
    if (!fr.length) fr = [sorted[0][0]];
    return fr;
  };
  G.isFriend = (a, b) => !!a && !!b && a.id !== b.id && (G.friendsOf(a).some((o) => o.id === b.id) || G.friendsOf(b).some((o) => o.id === a.id));
  G.isFoe = (a, b) => !!a && !!b && a.id !== b.id && pairH(a.id, b.id) >= 100 - G.FOE_P && !G.isFriend(a, b);
  G.foesOf = (c) => (c && G.state ? G.state.consorts.filter((o) => G.isFoe(c, o)) : []);
  G.bondLabel = (a, b) => (G.isFriend(a, b) ? "Tỷ muội thân" : G.isFoe(a, b) ? "Không ưa nhau" : "");

  /* ================================================================== */
  /* Gói các hiệu ứng vào cảnh: thư mời, tỷ muội                          */
  /* ================================================================== */
  const hookD18 = G.runHook;
  G.runHook = function (id, ctxIn) {
    const scene = hookD18(id, ctxIn);
    if (!G.state) return scene;
    const d = d18();
    const intro = d._letterIntro;
    delete d._letterIntro;
    if (!scene || scene.blocked) return scene;
    if (intro) addPage(scene, intro, true);
    const parts = ((ctxIn && ctxIn.participants) || []).map((p) => G.findConsort(p.id)).filter(Boolean);
    if (parts.length >= 2) {
      const notes = [];
      for (let i = 0; i < parts.length; i++)
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          if (G.isFriend(a, b)) {
            for (const c of [a, b]) {
              G.changeFavor(c, 3);
              c.affection = clamp(c.affection + 2, 0, 100);
            }
            addPage(scene, fillC(G.D18_TEXT.friendPage, a, b), true);
            notes.push(`Tỷ muội thân ${a.name} & ${b.name}: mỗi người Sủng ái +3, Tình cảm +2`);
          } else if (G.isFoe(a, b)) {
            for (const c of [a, b]) G.changeFavor(c, 1);
            const pages = scene.pages && scene.pages.length ? scene.pages.slice() : [scene.text || ""];
            pages.splice(Math.min(1, pages.length), 0, fillC(one(G.D18_TEXT.foePage), a, b));
            scene.pages = pages;
            scene.text = pages.join("\n\n");
            notes.push(`${a.name} & ${b.name} không ưa nhau: đấu khẩu cả đêm, mỗi người Sủng ái +1`);
          }
        }
      if (notes.length) scene.notes = (scene.notes || []).concat(notes);
    }
    return scene;
  };

  /* ================================================================== */
  /* 19. Thử thách đêm: phi ra điều kiện trước đêm                        */
  /* ================================================================== */
  G.CHAL_CHANCE = 0.3;
  G.CHAL_REWARD = { favor: 5, affection: 4, xp: 8 };
  /** Điều kiện đêm nay của nàng (cố định trong tháng), hoặc null. */
  G.nightChallenge = function (c) {
    if (!c || !G.state) return null;
    const s = G.state;
    const d = d18();
    let ch = d.chal[c.id];
    if (!ch || ch.turn !== s.turn) {
      ch = { turn: s.turn, type: null };
      if (c.affection >= 30 && rand() < G.CHAL_CHANCE) {
        const T = G.D18_TEXT.chal;
        const opts = ["no_items", "nude", "plain", "game"];
        const owned = G.outfitsOf ? G.outfitsOf(c).filter((o) => o !== "khong_mac") : [];
        if (owned.length) opts.push("outfit", "outfit");
        const likes = (c.likes || []).filter((f) => R.fetishes[f] && G.fetishUnlocked(f) && G.consentOf(c, f) === "willing");
        if (likes.length) opts.push("like", "like");
        if (!G.NEW_GAMES) opts.splice(opts.indexOf("game"), 1);
        ch.type = pick(opts);
        if (ch.type === "outfit") ch.arg = pick(owned);
        if (!T[ch.type]) ch.type = null;
      }
      d.chal[c.id] = ch;
      for (const [k, v] of Object.entries(d.chal)) if (v.turn !== s.turn) delete d.chal[k];
    }
    if (!ch.type || ch.done) return null;
    const T = G.D18_TEXT.chal[ch.type];
    const on = ch.arg && G.OUTFITS && G.OUTFITS[ch.arg] ? G.OUTFITS[ch.arg].name : "";
    return { type: ch.type, arg: ch.arg, ask: T.ask.replace("{outfit}", on), rule: T.rule.replace("{outfit}", on), pending: !!ch.pending };
  };
  /** Đêm nay có giữ điều kiện không. pick = { items, keeps, outfit, fx }. */
  G.challengeMet = function (c, ch, p) {
    if (!ch) return false;
    p = p || {};
    const items = p.items || [], keeps = p.keeps || [], fx = p.fx || [];
    switch (ch.type) {
      case "no_items": return !items.length && !keeps.length;
      case "outfit": return p.outfit === ch.arg;
      case "nude": return p.outfit === "khong_mac";
      case "like": return fx.some((f) => (c.likes || []).includes(f));
      case "plain": return !fx.length;
      default: return false;
    }
  };
  const chalReward = (c, type) => {
    const rw = G.CHAL_REWARD;
    G.changeFavor(c, rw.favor);
    c.affection = clamp(c.affection + rw.affection, 0, 100);
    if (G.gainXp) G.gainXp(rw.xp);
    log(`${c.name} ra điều kiện đêm nay, bệ hạ giữ đúng.`, "night");
    return [`Giữ đúng điều kiện của nàng: Sủng ái +${rw.favor}, Tình cảm +${rw.affection}`];
  };
  /** Gọi sau khi triệu: thêm đoạn kết đặc biệt hoặc phạt nhẹ. */
  G.challengeResolve = function (c, scene, p) {
    const ch = G.nightChallenge(c);
    if (!ch || !scene || scene.blocked) return scene;
    const raw = d18().chal[c.id];
    const live = G.findConsort(c.id) || c;
    if (ch.type === "game") {
      raw.pending = true; // chờ thắng ở Trò trong đêm
      scene.notes = (scene.notes || []).concat([`Điều kiện của nàng: ${ch.rule}`]);
      scene.chalGame = c.id;
      return scene;
    }
    raw.done = true;
    if (G.challengeMet(c, ch, p)) {
      const on = ch.arg && G.OUTFITS[ch.arg] ? G.OUTFITS[ch.arg].name : "";
      addPage(scene, fillC(G.D18_TEXT.chal[ch.type].end.replace(/\{outfit\}/g, on.toLowerCase()), live));
      scene.notes = (scene.notes || []).concat(chalReward(live, ch.type));
      scene.chalWin = true;
    } else {
      live.affection = clamp(live.affection - 2, 0, 100);
      scene.notes = (scene.notes || []).concat([fillC(G.D18_TEXT.chalFail, live), "Tình cảm −2"]);
    }
    return scene;
  };
  if (G.nightGameResult) {
    const ngD18 = G.nightGameResult;
    G.nightGameResult = function (c, id, outcome) {
      const notes = ngD18(c, id, outcome);
      const raw = G.state && d18().chal[c.id];
      if (raw && raw.pending && !raw.done && raw.turn === G.state.turn) {
        raw.done = true;
        raw.pending = false;
        if (outcome === "win") {
          G.lastChallengeEnd = fillC(G.D18_TEXT.chal.game.end, c);
          return notes.concat(chalReward(c, "game"), [G.lastChallengeEnd]);
        }
        c.affection = clamp(c.affection - 2, 0, 100);
        return notes.concat([`Bệ hạ không thắng được nàng. ${c.name} cười đắc ý.`, "Tình cảm −2"]);
      }
      return notes;
    };
  }

  /* ================================================================== */
  /* 25. Tấu chương đêm khuya                                             */
  /* ================================================================== */
  G.MEMO_CHANCE = 0.08;
  G.MEMO_GAP = 3;
  /** Lúc truyền chỉ thị tẩm: có tấu khẩn không. */
  G.rollMemorial = function (c) {
    const s = G.state;
    if (!c || !s || s.ended) return null;
    const d = d18();
    if (s.turn - d.memoTurn < G.MEMO_GAP || rand() >= G.MEMO_CHANCE) return null;
    const ch = G.nightChallenge(c);
    if (ch) return null;
    d.memoTurn = s.turn;
    const m = pick(G.D18_TEXT.memo);
    return { title: m.title, text: G.D18_TEXT.memoAsk.replace("{memo}", m.title).replace("{memoText}", m.text).replace(/\{name\}/g, c.name) };
  };
  /** go = true: phê ngay (đêm không thành). */
  G.memorialDecide = function (c, go) {
    const live = G.findConsort(c.id) || c;
    if (go) {
      G.addStat("danTam", 4);
      G.changeFavor(live, -2);
      live.affection = clamp(live.affection - 4, 0, 100);
      sulk(live, 1);
      log(`Bệ hạ bỏ dở đêm với ${live.name} để phê tấu khẩn.`, "story");
      return { text: fillC(G.D18_TEXT.memoGo, live), notes: ["Dân tâm +4", `${live.name}: Sủng ái −2, Tình cảm −4, đang dỗi`] };
    }
    G.addStat("danTam", -3);
    live.affection = clamp(live.affection + 3, 0, 100);
    log(`Bệ hạ gác tấu khẩn lại, ở bên ${live.name}.`, "story");
    return { text: fillC(G.D18_TEXT.memoStay, live), notes: ["Dân tâm −3", `${live.name}: Tình cảm +3`] };
  };

  /* ================================================================== */
  /* 27. Sứ thần dâng mỹ nhân ngoại bang                                  */
  /* ================================================================== */
  G.ENVOY_CHANCE = 0.1;
  G.ENVOY_GAP = 15;
  G.ENVOY_GIFT = 400;
  G.FOREIGN = {
    kim_sa: { land: "Kim Sa quốc", where: "vương quốc giữa sa mạc phía tây", look: "da màu mật ong, mắt sẫm kẻ chì, cổ tay đeo vòng vàng leng keng", outfit: { id: "ngoai_kim_sa", name: "Váy múa Kim Sa đính chuông vàng", cost: 600 } },
    bich_hai: { land: "Bích Hải quốc", where: "đảo quốc ngoài biển nam", look: "tóc đen dài đến gối, da rám nắng, cài hoa đại sau tai", outfit: { id: "ngoai_bich_hai", name: "Xiêm vải Bích Hải quấn ngang ngực", cost: 600 } },
    tuyet_linh: { land: "Tuyết Lĩnh quốc", where: "xứ núi tuyết phương bắc", look: "da trắng như tuyết, mắt nâu nhạt, đội mũ lông cáo trắng", outfit: { id: "ngoai_tuyet_linh", name: "Áo lông cáo Tuyết Lĩnh không mặc yếm", cost: 600 } },
    huong_lam: { land: "Hương Lâm quốc", where: "xứ rừng hương phía tây nam", look: "thân hình mảnh như liễu, xăm hoa văn mảnh nơi thắt lưng, người thoảng mùi trầm", outfit: { id: "ngoai_huong_lam", name: "Váy lụa Hương Lâm xẻ cao hai bên", cost: 600 } },
  };
  // y phục ngoại bang: không bán ở tủ, chỉ có khi nhận mỹ nhân; không làm đổi bộ ♥ của các phi cũ
  if (G.OUTFITS) {
    const none = G.OUTFITS.khong_mac;
    delete G.OUTFITS.khong_mac;
    for (const f of Object.values(G.FOREIGN)) G.OUTFITS[f.outfit.id] = { name: f.outfit.name, cost: f.outfit.cost, foreign: true };
    if (none) G.OUTFITS.khong_mac = none;
    const likedD18 = G.likedOutfit;
    G.likedOutfit = function (c) {
      const stash = {};
      for (const [k, v] of Object.entries(G.OUTFITS)) if (v.foreign) (stash[k] = v), delete G.OUTFITS[k];
      const none2 = G.OUTFITS.khong_mac;
      delete G.OUTFITS.khong_mac;
      try {
        return likedD18(c);
      } finally {
        Object.assign(G.OUTFITS, stash);
        if (none2) G.OUTFITS.khong_mac = none2;
      }
    };
  }
  monthly((s, report) => {
    if (s.ended || s.turn < 12 || !sideRoom(report)) return;
    const d = d18(s);
    if (s.turn - d.envoyTurn < G.ENVOY_GAP || rand() >= G.ENVOY_CHANCE) return;
    d.envoyTurn = s.turn;
    const key = pick(Object.keys(G.FOREIGN));
    const F = G.FOREIGN[key];
    const def = G.makeRecruit(`Mỹ nhân ${F.land} · ${F.where}`);
    def.age = Math.max(def.age, 20);
    def.traits = ["Dị vực"].concat(def.traits.slice(0, 2));
    def.special = true;
    const rare = shuffle(Object.values(R.fetishes).filter((f) => f.tier >= 2).map((f) => f.id)).slice(0, 3);
    def.consent = Object.assign({}, def.consent);
    for (const f of rare) def.consent[f] = "willing";
    def.likes = [...new Set((def.likes || []).concat(rare.slice(0, 1)))];
    const names = rare.map((f) => (R.fetishes[f] || {}).name).filter(Boolean).join(", ");
    const ev = G.prepareEvent(
      {
        id: "sys.my_nhan_ngoai",
        title: `Sứ thần ${F.land}`,
        text: `Sứ thần ${F.land}, ${F.where}, quỳ giữa điện dâng quốc thư và ${G.ENVOY_GIFT} lượng cống phẩm. Theo sau là một mỹ nhân che mạng: ${def.name}, ${def.age} tuổi, ${F.look}. Nàng vén mạng, cúi chào theo lễ nước mình, mắt không hề cụp xuống.\nNghe nói ở quê nàng, những chuyện như ${names || "phòng the"} là lẽ thường.\n> Quốc vương nước thần dâng viên ngọc quý nhất cho thiên tử.\nPhía sau rèm, các phi tần xì xào không ngớt.`,
        choices: [
          { label: "Nhận mỹ nhân, nhận cống phẩm", _take: true },
          { label: "Khéo léo từ chối, chỉ nhận quốc thư", effects: { danTam: -2 } },
        ],
        onChoose: (ch, sp, notes) => {
          if (!ch._take) return;
          const c = G.addConsort(def.id, true);
          if (!c) return;
          c.favor = Math.max(c.favor, 30);
          c.affection = Math.max(c.affection, 25);
          if (G.d13) {
            const w = G.d13().wardrobe;
            (w[c.id] = w[c.id] || []).push(F.outfit.id);
          }
          G.addStat("quocKho", G.ENVOY_GIFT);
          G.addStat("danTam", 2);
          G.addStat("hoaKhi", -4);
          for (const o of G.state.consorts) if (o.id !== c.id) G.changeFavor(o, -1);
          log(`${c.name}, mỹ nhân ${F.land}, nhập cung. Cả hậu cung xì xào.`, "harem");
          notes.push(`${c.name} nhập cung, mang theo ${F.outfit.name}`, `Quốc khố +${G.ENVOY_GIFT}`, "Dân tâm +2", "Hòa khí −4", "Sủng ái các phi khác −1", "Sẵn lòng: " + (names || "—"));
        },
      },
      { speaker: def }
    );
    if (ev.choices.length) report.sideEvents.push(ev);
  });
})();
