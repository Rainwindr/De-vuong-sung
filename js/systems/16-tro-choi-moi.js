/*
 * Trò chơi mới (ghép 2026-10-28): ý tưởng từ Grok + 3 trò bệ hạ chọn (Ghép tranh, Hôn từ trên xuống, Giữ chuông im).
 * slot: day (khi ghé thăm), night (giữa cảnh thị tẩm), group (cả hậu cung thi ở khay lật thẻ).
 * mech: kiểu thao tác, giao diện chạy chung một bộ máy (ui.js · runTapGame).
 *   stroke  vuốt n đường, nghỉ quá gap giây là đứt
 *   hold    giữ ngón tay sec giây
 *   rhythm  chạm đúng nhịp n lần
 *   seq     chạm các chỗ theo thứ tự (hidden: nàng không nói trước)
 *   drag    kéo chậm từ trên xuống, kéo nhanh quá thì nàng che lại
 *   spots   chạm đúng chỗ nàng chỉ trong lúc chỗ đó sáng
 *   still   kéo hạt châu chậm qua thanh, nhanh quá thì chuông reo
 *   puzzle  ghép 9 mảnh tranh
 * need: đồ cần có. keep: đồ riêng của nàng; stock: trong Kho phòng the; outfit: nàng có bộ này; furn: tẩm cung có.
 * Trò cả hậu cung: keep nghĩa là ít nhất một phi trong cung có món đó.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const { clamp } = G.util;
  const log = (t, k) => G.log(t, k);

  const BODY = ["Môi", "Cổ", "Vai", "Ngực", "Eo", "Bụng", "Đùi", "Bàn chân"];
  const LOW = ["Bụng dưới", "Đùi trong trái", "Đùi trong phải", "Hông", "Eo", "Gối"];

  // lead: câu kết dẫn vào đêm (Claude chuyển từ mục "Dẫn vào đêm" của Grok). outfit: thắng thì đêm nay nàng mặc bộ này.
  G.NEW_GAMES = {
    /* ---------- ban ngày ---------- */
    long_vu_treu: { slot: "day", name: "Lông vũ trêu ghẹo", mech: "stroke", n: 8, gap: 2.2, need: { keep: "long_vu_hac" }, rule: "Vuốt lông vũ chậm dọc người nàng 8 đường, đừng nghỉ quá 2 giây.", likes: ["Tinh nghịch", "Dịu dàng"], lead: "{name} cầm lông vũ theo vào giường, bảo bệ hạ tiếp tục vuốt thật chậm." },
    guong_soi: { slot: "day", name: "Gương đồng soi mình", mech: "seq", zones: ["Quay trái", "Quay phải", "Ngoảnh lại", "Cúi xuống", "Ngửa ra"], n: 3, need: { furn: "guong_dong_lon" }, rule: "Nàng nói tư thế, bệ hạ chạm đúng để nàng xoay theo gương. Đủ 3 tư thế là thắng.", outfit: "lua_mong", likes: ["Kiêu kỳ", "Phóng khoáng"], lead: "{name} kéo bệ hạ đứng sau lưng mình, cùng nhìn vào gương." },
    dau_xoa_co: { slot: "day", name: "Dầu thơm xoa cổ", mech: "hold", sec: 12, need: { stock: "dau_thom" }, rule: "Giữ ngón tay xoa đều trên cổ nàng 12 giây, đừng buông.", likes: ["Ôn nhu", "Lãng mạn"], lead: "{name} nằm sấp xuống, bảo bệ hạ xoa tiếp từ cổ xuống lưng." },
    vong_chan_reo: { slot: "day", name: "Vòng chân reo nhẹ", mech: "rhythm", n: 10, period: 1.1, need: { keep: "vong_chan_chuong" }, rule: "Chạm nhẹ mắt cá chân nàng đúng nhịp cho chuông reo đều.", likes: ["Tinh nghịch", "Hát hay"], lead: "{name} không tháo vòng chân, bước lên giường cho chuông reo theo từng nhịp." },
    ngua_go_bap: { slot: "day", name: "Ngựa gỗ bập bênh", mech: "rhythm", n: 10, period: 0.95, need: { furn: "ngua_go" }, rule: "Đẩy ngựa gỗ đúng nhịp nàng nhún, 10 lần.", outfit: "xe_ta", likes: ["Hoang dã", "Cưỡi ngựa giỏi", "Mạnh mẽ"], lead: "{name} cưỡi ngựa gỗ vào phòng the, bảo bệ hạ đẩy tiếp." },
    liem_ngon: { slot: "day", name: "Lưỡi liếm ngón", mech: "rhythm", n: 4, period: 1.4, rule: "Đưa ngón tay lại gần môi nàng, dừng đúng lúc nàng liếm. Đủ 4 lần.", likes: ["Tinh nghịch", "Phóng khoáng"], lead: "{name} kéo tay bệ hạ lên môi, ngậm lấy ngón tay rồi kéo xuống ngực mình." },
    yem_keo: { slot: "day", name: "Kéo yếm đỏ", mech: "drag", need: { outfit: "yem_do" }, rule: "Kéo yếm xuống thật chậm theo hơi thở nàng. Kéo nhanh quá nàng sẽ che lại.", outfit: "yem_do", likes: ["E lệ", "Đoan trang"], lead: "{name} không kéo yếm lên nữa, nằm xuống bảo bệ hạ kéo tiếp." },
    vay_xe: { slot: "day", name: "Vuốt váy xẻ tà", mech: "spots", zones: ["Gối", "Bắp đùi", "Đùi giữa", "Đùi trên", "Hông"], n: 5, need: { outfit: "xe_ta" }, rule: "Vuốt theo đường xẻ váy, dừng đúng chỗ nàng chỉ khi chỗ đó sáng lên.", outfit: "xe_ta", likes: ["Phóng khoáng", "Kiêu kỳ"], lead: "{name} ngồi xuống, kéo đường xẻ váy rộng ra, bảo bệ hạ vuốt tiếp từ dưới lên." },
    dau_nguc: { slot: "day", name: "Dầu thơm nhỏ ngực", mech: "stroke", n: 10, gap: 2.4, need: { stock: "dau_thom" }, rule: "Nhỏ dầu lên ngực nàng rồi vuốt tròn đều 10 vòng, đừng ngừng tay.", likes: ["Dịu dàng", "Si tình"], lead: "{name} nằm ngửa, ngực còn bóng dầu, bảo bệ hạ vuốt tiếp." },
    dau_dui: { slot: "day", name: "Dầu nhỏ giữa đùi", mech: "stroke", n: 12, gap: 2.4, need: { stock: "dau_thom" }, rule: "Nhỏ dầu giữa đùi nàng, vuốt tròn đều 12 vòng.", likes: ["Hoang dã", "Phóng khoáng"], lead: "{name} nằm ngửa, đùi còn bóng dầu, kéo tay bệ hạ đặt lại chỗ cũ." },
    long_vu_duoi: { slot: "day", name: "Lông vũ quét dưới", mech: "stroke", n: 10, gap: 2, need: { keep: "long_vu_hac" }, rule: "Quét lông vũ từ bụng dưới xuống giữa đùi 10 đường liên tục.", likes: ["Tinh nghịch", "Hoang dã"], lead: "{name} đặt lông vũ giữa hai đùi, bảo bệ hạ quét chậm hơn nữa." },
    ghep_tranh: { slot: "day", name: "Ghép tranh xuân cung đồ", mech: "puzzle", sec: 45, need: { keep: "xuan_cung_do" }, rule: "Chạm hai mảnh để đổi chỗ. Ghép xong bức tranh trong 45 giây.", likes: ["Sâu sắc", "Tinh tế", "Thông minh"], lead: "{name} trải bức xuân cung đồ ra, chỉ vào một tư thế, thì thầm đêm nay muốn thử đúng như thế." },
    /* ---------- giữa đêm ---------- */
    lua_che_mat: { slot: "night", name: "Lụa đỏ che mắt", mech: "seq", zones: BODY, n: 5, need: { stock: "dai_lua" }, rule: "Nàng bị che mắt, khẽ nói chỗ muốn được chạm. Chạm đúng 5 chỗ liên tiếp.", lead: "{name} vẫn để dải lụa che mắt, nằm xuống bảo bệ hạ tìm tiếp." },
    hon_tu_tren: { slot: "night", name: "Hôn từ trên xuống", mech: "seq", zones: BODY, n: 6, hidden: true, rule: "Hôn lần lượt từng chỗ theo đúng thứ tự nàng thích. Sai thì chỗ đúng sẽ sáng lên.", lead: "{name} kéo bệ hạ trở lại môi mình, rồi tự dẫn xuống thêm lần nữa." },
    giu_chuong: { slot: "night", name: "Giữ chuông im", mech: "still", need: { keep: "vong_chan_chuong" }, rule: "Nàng đeo vòng chuông bạc. Kéo hạt châu chậm qua hết thanh, chuông reo không quá 3 lần.", lead: "{name} nín thở cho chuông khỏi reo, nhưng chỉ được một lúc thì cả hai đều phá lên cười." },
    cau_ngoc_nhip: { slot: "night", name: "Cầu ngọc theo nhịp thở", mech: "rhythm", n: 12, period: 1.5, need: { keep: "cau_ngoc_doi" }, rule: "Di chuyển cầu ngọc theo nhịp thở chậm của nàng, 12 nhịp.", lead: "{name} nằm ngửa, cầu ngọc vẫn còn trong người, bảo bệ hạ tiếp tục." },
    roi_long: { slot: "night", name: "Roi lông công quét", mech: "stroke", n: 10, gap: 1.6, need: { keep: "roi_long_cong" }, rule: "Quét đầu roi lông công từ ngực xuống giữa đùi 10 đường liên tục.", lead: "{name} nằm xòe đùi, đặt roi lông công lên ngực, bảo bệ hạ quét chậm hơn." },
    ngoc_hanh_vong: { slot: "night", name: "Ngọc hành đặt nhẹ", mech: "hold", sec: 14, need: { keep: "ngoc_hanh_bach" }, rule: "Giữ ngọc hành bạch ngọc trên bụng dưới nàng, di chuyển chậm 14 giây không rời.", lead: "{name} đặt ngọc hành vào tay bệ hạ, bảo tiếp tục vòng tròn." },
    bat_da_lanh: { slot: "night", name: "Bát đá lạnh", mech: "spots", zones: LOW, n: 5, need: { stock: "bat_da" }, rule: "Đặt đá lạnh đúng chỗ nàng chỉ khi chỗ đó sáng lên, 5 lần.", lead: "{name} giữ bát đá lạnh bên gối, bảo bệ hạ đặt lại khi nàng ra hiệu." },
    lua_co_tay: { slot: "night", name: "Lụa đỏ quấn cổ tay", mech: "hold", sec: 18, need: { stock: "dai_lua" }, rule: "Giữ hai cổ tay nàng quấn lụa đỏ, kéo nhẹ ra sau lưng 18 giây.", lead: "{name} nằm sấp, cổ tay vẫn quấn lụa đỏ, bảo bệ hạ tiếp tục." },
    cau_ngoc_day: { slot: "night", name: "Cầu ngọc đẩy vào", mech: "drag", need: { keep: "cau_ngoc_doi" }, rule: "Đẩy cầu ngọc vào thật chậm theo chỗ nàng chỉ. Nhanh quá nàng sẽ rên to và nó trượt ra.", lead: "{name} nằm ngửa, cầu ngọc đã nằm gọn trong người, bảo bệ hạ đẩy nhẹ thêm." },
    ngoc_hanh_co: { slot: "night", name: "Ngọc hành cọ giữa", mech: "rhythm", n: 15, period: 0.85, need: { keep: "ngoc_hanh_bach" }, rule: "Cọ ngọc hành lên xuống giữa đùi nàng đúng nhịp, 15 lần.", lead: "{name} cầm ngọc hành đặt lại vào tay bệ hạ, bảo cọ tiếp." },
    /* ---------- cả hậu cung ---------- */
    chuong_im: { slot: "group", name: "Chuông bạc im", need: { keep: "man_linh" }, rule: "Các phi đeo mạn linh, ai giữ chuông im lâu nhất thì thắng.", outfit: "yem_do", lead: "{name} đeo mạn linh vào giường, cố không để chuông reo." },
    lua_troi_nhe: { slot: "group", name: "Lụa đỏ trói nhẹ", need: { stock: "dai_lua" }, rule: "Các phi quấn lụa đỏ cổ tay, ai giữ tư thế lâu nhất thì thắng.", lead: "{name} nằm xuống, cổ tay vẫn quấn lụa đỏ, chờ bệ hạ." },
    guong_so_dang: { slot: "group", name: "Gương đồng so dáng", need: { furn: "guong_dong_lon" }, rule: "Các phi lần lượt xoay một vòng trước gương, ai mượt nhất thì thắng.", outfit: "lua_mong", lead: "{name} đứng trước gương đồng trong phòng the, xoay thêm một vòng cho bệ hạ ngắm." },
    dau_thi_xoa: { slot: "group", name: "Dầu thơm thi xoa", need: { stock: "dau_thom" }, rule: "Các phi xoa dầu thơm lên người mình, ai xoa đều và lâu nhất thì thắng.", lead: "{name} mang dầu thơm vào giường, xoa từ tay bệ hạ lên ngực." },
    xcd_chi_cho: { slot: "group", name: "Xuân cung đồ chỉ chỗ", need: { keep: "xuan_cung_do" }, rule: "Các phi xem xuân cung đồ, ai chỉ đúng chỗ nhạy nhất trên tranh nhanh nhất thì thắng.", lead: "{name} mang bức xuân cung đồ vào phòng, chỉ lại đúng chỗ vừa chọn." },
    yem_tre: { slot: "group", name: "Yếm đỏ trễ ngực", rule: "Các phi kéo yếm đỏ xuống chậm nhất có thể mà không che, ai kéo thấp nhất thì thắng.", outfit: "yem_do", lead: "{name} nằm xuống, yếm vẫn trễ, chờ bệ hạ kéo nốt." },
    vay_xe_thi: { slot: "group", name: "Váy xẻ thi dáng", rule: "Các phi vuốt theo đường xẻ váy, ai dừng đúng chỗ và lâu nhất thì thắng.", outfit: "xe_ta", lead: "{name} ngồi trên giường, kéo đường xẻ váy rộng ra, bảo bệ hạ vuốt tiếp." },
    long_vu_dui: { slot: "group", name: "Lông vũ quét đùi", need: { keep: "long_vu_hac" }, rule: "Các phi lần lượt quét lông vũ từ bụng dưới xuống đùi, ai mượt và lâu nhất thì thắng.", lead: "{name} nằm xòe, đặt lông vũ giữa đùi, bảo bệ hạ quét tiếp." },
    ngoc_hanh_bung: { slot: "group", name: "Ngọc hành đặt bụng", need: { keep: "ngoc_hanh_bach" }, rule: "Các phi đặt ngọc hành trên bụng dưới, xoay chậm, ai giữ lâu nhất không rơi thì thắng.", lead: "{name} nằm ngửa, ngọc hành đặt trên bụng, bảo bệ hạ xoay tiếp." },
  };

  /* Đăng ký vào danh sách mini game chung (để tính lượt mỗi tháng và kết quả) */
  for (const [id, g] of Object.entries(G.NEW_GAMES)) {
    G.MINI_GAMES[id] = { name: g.name, desc: g.rule, likes: g.likes || [], slot: g.slot, isNew: true };
    if (g.slot === "group") G.THI_GAMES.push(id);
  }

  /** Thiếu đồ gì để chơi, hoặc null nếu chơi được. c: phi (trò ban ngày, ban đêm); bỏ trống với trò cả hậu cung. */
  G.gameNeedWhy = function (id, c) {
    const g = G.NEW_GAMES[id];
    if (!g || !g.need) return null;
    const n = g.need;
    if (n.stock && G.bedStock(n.stock) <= 0) return `Cần ${G.BED_ITEMS[n.stock].name} trong kho`;
    if (n.furn && !G.ownsFurn(n.furn)) return `Cần bày ${G.FURNISH[n.furn].name}`;
    if (n.outfit && c && !G.ownsOutfit(c, n.outfit)) return `Nàng cần có ${G.OUTFITS[n.outfit].name}`;
    if (n.keep) {
      const ok = c ? G.ownsKeep(c, n.keep) : G.state.consorts.some((x) => G.ownsKeep(x, n.keep));
      if (!ok) return c ? `Nàng cần có ${G.KEEPSAKES[n.keep].name}` : `Cần một phi có ${G.KEEPSAKES[n.keep].name}`;
    }
    return null;
  };

  /** Thứ tự chỗ nàng thích (trò Hôn từ trên xuống): đi từ trên xuống, đổi chỗ hai điểm theo từng phi. */
  G.kissOrder = function (c, zones, n) {
    let h = 0;
    for (const ch of String(c.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = zones.slice(0, Math.max(n, 2));
    const i = h % (order.length - 1);
    [order[i], order[i + 1]] = [order[i + 1], order[i]];
    return order.slice(0, n);
  };

  /** Câu dẫn vào đêm sau khi chơi. */
  G.gameLead = (id, c) => G.fill(G.NEW_GAMES[id].lead, { speaker: c });

  /** Trò giữa đêm: mỗi đêm một lần. Thắng: Sủng ái +4, Tình cảm +3; hòa +2/+2; thua: Tình cảm +1. */
  G.nightGameUsed = (c) => {
    const n = G.d7 && G.d7().night;
    return !n || n.id !== c.id || n.turn !== G.state.turn || !!n.game;
  };
  G.nightGameResult = function (c, id, outcome) {
    const n = G.d7 && G.d7().night;
    if (n) n.game = id;
    const fv = { win: 4, draw: 2, lose: 0 }[outcome];
    const af = { win: 3, draw: 2, lose: 1 }[outcome];
    if (fv) G.changeFavor(c, fv);
    c.affection = clamp(c.affection + af, 0, 100);
    log(`Đêm nay bệ hạ chơi ${G.NEW_GAMES[id].name} cùng ${c.name}.`, "night");
    return [fv ? `Sủng ái +${fv}` : "", `Tình cảm +${af}`].filter(Boolean);
  };

  /* Trò cả hậu cung: dùng cơ chế "Các phi thi tài"; phi thua mỗi người Tình cảm +2 */
  const thiD16 = G.thiTai;
  G.thiTai = function (gameId) {
    const r = thiD16(gameId);
    if (r && G.NEW_GAMES[gameId]) {
      for (const x of r.ranked.slice(1)) x.c.affection = clamp(x.c.affection + 2, 0, 100);
      r.loserBonus = 2;
    }
    return r;
  };
})();
