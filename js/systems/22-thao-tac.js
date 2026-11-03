/*
 * Thao tác chạm giữa cảnh: chạm để nhấp, kéo độ sâu, hai ngón, canh lúc ra, bú vú luân phiên, liếm theo đường,
 * nàng ngậm bệ hạ kìm, cấm rên, núm đồ chơi (nhịp tim nàng hiện trong mọi trò), gõ lệnh bằng chữ.
 * Phần chơi nằm trong ui.js (openTouch); file này giữ luật, câu chữ và kết quả.
 * Câu chữ do Claude viết (tạm), Grok có thể viết lại: G.TOUCH[*].win / draw / lose.
 */
(function () {
  "use strict";
  const G = window.Game;
  const { clamp, pick } = G.util;
  const fillC = (t, c) => G.fill(t, { speaker: c });
  const hash = (str) => {
    let h = 7;
    for (const ch of String(str)) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
    return h;
  };

  G.TOUCH_MAX = 2; // số trò chạm mỗi cảnh
  G.TOUCH_TOYS = ["ngoc_hanh_bach", "ngoc_hanh_te", "ngoc_hanh_doi_vang", "man_linh", "cau_ngoc_doi"];
  G.TOUCH = {
    nhap: {
      name: "Chạm để nhấp",
      rule: "Mỗi lần chạm là một nhịp. Chạm đều và nhanh dần để đẩy nàng lên đỉnh trong 20 giây.",
      win: "Trẫm dập liên hồi theo nhịp tay, {name} không kịp thở, người cong lên rồi ra lần đầu, lồn co thắt siết chặt lấy cặc.\n> Bệ hạ… thần thiếp ra rồi…",
      draw: "Nhịp lúc nhanh lúc chậm, {name} rên rỉ, sắp tới mà chưa tới, ôm chặt trẫm đòi thêm.",
      lose: "Nhịp đứt quãng, {name} hụt hơi, cười khúc khích kéo trẫm lại làm lại từ đầu.",
    },
    sau: {
      name: "Kéo độ sâu",
      rule: "Kéo thanh lên xuống để vào nông hay sâu. Mỗi phi thích một độ sâu riêng: dò ra rồi giữ quanh đó mà kéo đều.",
      win: "Trẫm tìm đúng chỗ nàng thích nhất, cứ thế mà đâm vào đúng một điểm. {name} trợn mắt, rên không ra tiếng, ra ướt đẫm cả ga.",
      draw: "Lúc trúng lúc trượt, {name} vặn hông tự tìm cho đúng chỗ, thở dốc.",
      lose: "Trẫm vào chưa đúng chỗ, {name} cắn môi, khẽ kéo hông trẫm sâu thêm một chút.",
    },
    hai_ngon: {
      name: "Hai ngón cùng lúc",
      rule: "Một ngón chạm nhịp ở dưới, ngón kia vuốt vú nàng ở trên. Làm cùng lúc thì nàng sướng gấp đôi.",
      win: "Trẫm vừa dập vừa vê đầu ti, {name} không chịu nổi cả hai cùng lúc, người giật nảy, ra trong tiếng kêu đứt quãng.",
      draw: "Tay trẫm vê vú, hông trẫm dập đều, {name} lắc đầu nguầy nguậy, sắp ra mà vẫn cố níu.",
      lose: "Tay và hông không cùng nhịp, {name} bật cười, tự cầm tay trẫm đặt lại lên ngực mình.",
    },
    canh: {
      name: "Canh lúc nàng ra",
      rule: "Vòng tròn co lại. Chạm đúng lúc vòng chạm viền vàng. Trúng 3 trên 4 lần thì nàng ra cùng bệ hạ.",
      win: "Đúng khoảnh khắc {name} co giật lên đỉnh, trẫm cũng bắn. Hai người cùng run lên, nàng ôm chặt không buông, nước và tinh trào ra một lượt.\n> Cùng lúc… bệ hạ… cùng lúc…",
      draw: "Trẫm ra trước nàng một nhịp, {name} vẫn tự nhún thêm vài cái rồi mới tới, mặt đỏ bừng.",
      lose: "Lệch nhịp, {name} ra trước trẫm một hồi lâu, nằm rũ ra để trẫm làm tiếp.",
    },
    bu_vu: {
      name: "Bú vú luân phiên",
      rule: "Chạm Trái, Phải theo đúng thứ tự nàng thích (hiện dưới nút). Đúng thì đầu ti nàng cứng dần, sai thì nàng nhăn mặt.",
      win: "Trẫm bú bên này, vê bên kia, đổi qua đổi lại đúng nhịp. Hai đầu ti {name} cứng như hạt đậu, nàng ưỡn ngực đẩy vào miệng trẫm mà ra chỉ vì bị bú.",
      draw: "{name} rên khẽ theo từng lần trẫm mút, đầu ti ướt bóng, tay luồn tóc trẫm.",
      lose: "Trẫm mút vụng, {name} cười, tự nâng vú đưa vào miệng trẫm dạy lại.",
    },
    liem: {
      name: "Liếm theo đường",
      rule: "Vẽ ngón tay theo đường vàng từ cổ xuống đùi trong. Bám sát đường thì nàng run càng mạnh.",
      win: "Lưỡi trẫm đi một đường từ cổ, qua ngực, xuống bụng, dừng lại giữa hai đùi. {name} banh chân ra, ấn đầu trẫm xuống, ra ngay trên lưỡi trẫm.",
      draw: "Lưỡi trẫm đi lệch vài chỗ, {name} vẫn run lên từng chặp, da nổi gai.",
      lose: "Trẫm liếm lung tung, {name} nhột quá cười sặc sụa, ôm gối che người.",
    },
    ngam_kim: {
      name: "Nàng ngậm, bệ hạ kìm",
      rule: "Nàng ngậm, thanh \"Sắp bắn\" tự dâng lên. Giữ ngón tay để kìm, nhưng sức kìm có hạn. Chịu đủ 20 giây mà chưa bắn thì thắng.",
      win: "Trẫm kìm được lâu đến mức {name} mỏi cả miệng, ngước lên đầy khâm phục. Khi trẫm cho phép mình bắn, nàng nuốt sạch, liếm môi.\n> Bệ hạ bền quá…",
      draw: "Trẫm cố kìm mà không nổi, bắn đầy miệng {name} ngay lúc nàng vừa ngậm sâu. Nàng nuốt vội, cười đắc ý.",
      lose: "Trẫm chưa kịp kìm đã bắn, {name} giật mình, che miệng cười trêu bệ hạ.",
    },
    cam_ren: {
      name: "Cấm rên",
      rule: "Nàng phải nín tiếng. Chạm các chỗ trên người nàng để trêu, chỗ nhạy làm nàng khó nín hơn. Làm nàng bật rên trong 15 giây là thắng.",
      win: "{name} cắn chặt gối mà vẫn bật ra một tiếng rên dài, rồi không giữ được nữa, rên liên hồi. Nàng thua, ngoan ngoãn chờ trẫm ra lệnh.",
      draw: "{name} rên khẽ trong cổ họng, cố giả vờ chưa thua, nhưng mắt đã lờ đờ.",
      lose: "{name} nín được đến cùng, ngẩng lên cười đắc thắng, rồi tự kéo trẫm xuống thưởng cho mình.",
    },
    num: {
      name: "Núm đồ chơi",
      rule: "Đẩy thanh để chỉnh độ mạnh của đồ chơi trong người nàng. Nàng ra mỗi khi thanh hưng phấn đầy. Làm nàng ra từ 2 lần trong 15 giây là thắng.",
      win: "Trẫm đẩy đồ chơi mạnh hết mức, {name} ra hết lần này đến lần khác, chân run không khép lại được, nước chảy ướt cả đệm.\n> Đủ rồi… bệ hạ… thần thiếp ra nữa rồi…",
      draw: "{name} ra một lần, người mềm nhũn, vẫn nhăn mặt chịu đồ chơi trong người.",
      lose: "Đồ chơi chưa đủ mạnh, {name} sốt ruột tự cầm lấy ấn sâu thêm.",
    },
  };
  G.touchOk = function (c, kind) {
    if (kind === "num") return G.TOUCH_TOYS.some((k) => G.ownsKeep && G.ownsKeep(c, k)) ? null : "Cần nàng có ngọc hành, mạn linh hoặc cầu ngọc";
    return null;
  };
  /** Độ sâu nàng thích (0–100), thứ tự bú vú nàng thích, chỗ nhạy để trêu. */
  G.touchPrefs = (c) => {
    const h = hash(c.id);
    const pats = [["T", "P"], ["T", "T", "P"], ["P", "P", "T"], ["T", "P", "P"]];
    return { depth: 25 + (h % 60), pattern: pats[(h >>> 4) % pats.length], spots: [(h >>> 8) % 9, (h >>> 12) % 9] };
  };
  /** Kết thúc một trò chạm: trả về { line, notes }. */
  G.touchResult = function (scene, kind, outcome, extra) {
    const c = G.findConsort(scene.roundOf);
    const T = G.TOUCH[kind];
    if (!c || !T) return null;
    scene._touch = (scene._touch || 0) + 1;
    const fx = { win: [3, 3, 1], draw: [1, 2, 0], lose: [0, 1, 0] }[outcome] || [0, 0, 0];
    if (fx[0]) G.changeFavor(c, fx[0]);
    c.affection = clamp(c.affection + fx[1], 0, 100);
    if (fx[2]) G.addStat("truyLac", fx[2]);
    if (G.gainXp) G.gainXp(4);
    const notes = [`${T.name} · ${{ win: "thắng", draw: "hòa", lose: "thua" }[outcome]}: ${[fx[0] ? `Sủng ái +${fx[0]}` : "", `Tình cảm +${fx[1]}`, fx[2] ? `Trụy lạc +${fx[2]}` : ""].filter(Boolean).join(", ")}`];
    if (extra && extra.orgasms) notes.push(`Nàng ra ${extra.orgasms} lần`);
    return { line: fillC(T[outcome], c), notes };
  };

  /* Gõ lệnh bằng chữ: nhận từ khóa trong câu, chạy lệnh hoặc đổi tư thế */
  const fold = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  G.TYPE_KEYS = [
    ["cmd", "banh", ["banh", "mo rong", "dang chan"]],
    ["cmd", "bop_vu", ["bop vu", "bop nguc", "se dau ti", "vu"]],
    ["cmd", "quay_dit", ["quay dit", "quay lung", "chong mong", "chong dit"]],
    ["cmd", "liem", ["liem"]],
    ["cmd", "ngam", ["ngam", "bu cac", "mut"]],
    ["cmd", "tu_suong", ["tu suong", "tu so", "tu moc"]],
    ["cmd", "xin", ["xin", "van xin", "cau xin"]],
    ["cmd", "keu_to", ["ren", "keu to", "het to"]],
    ["pose", "cuoi_ngua", ["cuoi", "ngoi len"]],
    ["pose", "cho_cai", ["quy", "cho cai", "tu sau"]],
    ["pose", "gac_vai", ["gac", "len vai"]],
    ["pose", "be_dung", ["be len", "bong len", "be dung"]],
    ["pose", "up_thia", ["nam nghieng", "up thia", "om sau"]],
    ["pose", "ep_tuong", ["tuong", "cot"]],
    ["pose", "cui_ban", ["an thu", "cui xuong", "cui nguoi"]],
    ["pose", "truyen_giao", ["nam ngua", "nam xuong"]],
  ];
  /** Tìm lệnh trong câu bệ hạ gõ: { type, id } hoặc null. Ưu tiên khớp dài nhất. */
  G.parseTyped = function (text) {
    const t = " " + fold(text).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ") + " ";
    let best = null;
    for (const [type, id, keys] of G.TYPE_KEYS)
      for (const k of keys) {
        if (t.includes(" " + k + " ") && (!best || k.length > best.len)) best = { type, id, len: k.length };
      }
    return best ? { type: best.type, id: best.id } : null;
  };
})();
