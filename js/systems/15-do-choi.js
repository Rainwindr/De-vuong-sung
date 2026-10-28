/*
 * Đồ phòng the 18+: Đồ riêng của nàng (quà giữ lại, trang sức), Đồ dùng một lần (Kho phòng the),
 * Y phục mới, Bày biện tẩm cung, Tố Nữ Kinh (lớp Phòng the ở Học phường).
 * Câu tả: món Claude đề xuất do Claude viết; các món còn lại lấy câu mẫu Grok viết (ghép 2026-10-28).
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const { clamp } = G.util;
  const log = (t, k) => G.log(t, k);

  const d15 = (s) => {
    s = s || G.state;
    if (!s.d15) s.d15 = {};
    const d = s.d15;
    for (const [k, v] of Object.entries({ keeps: {}, furn: [], kinh: false, useNext: null, keepUsed: {} })) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d15 = d15;
  const hash = (str) => {
    let h = 0;
    for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };

  /* Phi thích món nào: theo thân thể, cấp thân mật; không ghi thì 1/4 số phi thích (cố định theo phi). */
  const LIKE = {
    nguc: (c) => G.bodyOf && G.bodyOf(c).nguc >= 2,
    nhay: (c) => G.bodyOf && G.bodyOf(c).nhay === 0,
    buong: (c) => G.levelOf && G.levelOf(c) === 2,
    the: (c) => G.levelOf && G.levelOf(c) === 0,
  };
  G.likesThing = (c, id, key) => (key && LIKE[key] ? LIKE[key](c) : hash(c.id + id) % 4 === 0);

  /* ================================================================== */
  /* Đồ riêng của nàng: mua cho từng phi, dùng lại mỗi đêm                */
  /* ================================================================== */
  // kind: keep (quà giữ lại) | jewel (trang sức). fx: cộng mỗi lần dùng trong đêm. buy: cộng khi tặng.
  G.KEEPSAKES = {
    // ---- Claude đề xuất ----
    ngoc_hanh_bach: { name: "Ngọc hành bạch ngọc", cost: 1200, kind: "keep", like: "buong", fx: { favor: 3 }, lines: ["{name} mở hộp gấm, lấy ngọc hành bạch ngọc ra áp lên má, nhìn bệ hạ đầy ý tứ."] },
    ngoc_hanh_te: { name: "Ngọc hành sừng tê chạm rồng", cost: 2500, kind: "keep", like: "buong", fx: { favor: 3, affection: 3 }, buy: { affection: 6 }, lines: ["{name} nâng ngọc hành sừng tê chạm rồng bằng hai tay, như dâng một báu vật lên bệ hạ."] },
    man_linh: { name: "Mạn linh", cost: 900, kind: "keep", like: "nhay", desc: "Hai quả cầu bạc nhỏ reo bên trong", fx: { affection: 2, longThe: 1 }, lines: ["Hai quả mạn linh trong người {name} reo khẽ theo từng bước nàng đến gần, nàng cắn môi cười."] },
    cau_ngoc_doi: { name: "Cầu ngọc đôi", cost: 800, kind: "keep", like: "nhay", fx: { favor: 2 }, lines: ["{name} lăn cầu ngọc đôi trong lòng bàn tay, sợi lụa nối hai viên ngọc đong đưa trước mắt bệ hạ."] },
    kep_vu_vang: { name: "Kẹp vú vàng tua ngọc", cost: 1000, kind: "jewel", like: "nguc", fx: { favor: 3 }, lines: ["Tua ngọc từ đôi kẹp vàng trên ngực {name} rung rinh theo từng hơi thở của nàng."] },
    vong_chan_chuong: { name: "Vòng chân chuông bạc", cost: 600, kind: "jewel", fx: { affection: 2 }, lines: ["Vòng chân chuông bạc của {name} reo leng keng khi nàng bước lên giường."] },
    day_lua_kim: { name: "Dây lụa đỏ kim tuyến", cost: 500, kind: "keep", like: "buong", desc: "Che mắt hoặc quấn nhẹ cổ tay", fx: { affection: 2, truyLac: 1 }, lines: ["{name} đưa bệ hạ dây lụa đỏ dệt kim tuyến, chìa hai cổ tay ra, mắt lấp lánh."] },
    roi_long_cong: { name: "Roi lông công", cost: 700, kind: "keep", like: "buong", desc: "Vuốt và phát nhẹ, nàng tự xin", fx: { favor: 2, truyLac: 1 }, lines: ["{name} đặt roi lông công vào tay bệ hạ rồi tự nằm sấp xuống gối chờ."] },
    long_vu_hac: { name: "Lông vũ hạc trắng", cost: 300, kind: "keep", like: "the", fx: { affection: 2 }, lines: ["Bệ hạ cầm lông vũ hạc trắng lướt dọc sống lưng {name}, nàng run lên khúc khích."] },
    dao_cao: { name: "Bộ dao bạc và chổi cạo", cost: 600, kind: "keep", desc: "Dùng thì nàng được cạo sạch, khỏi chọn sở thích", fx: { affection: 1 }, shave: true, lines: ["Bệ hạ tự tay cạo sạch cho {name} bằng bộ dao bạc, nàng nằm yên, mắt khép hờ tin cậy."] },
    xuan_cung_do: { name: "Xuân cung đồ", cost: 1500, kind: "keep", desc: "Mười hai bức tranh phòng the. Phi E thẹn nhận được thì Tình cảm +8", fx: { affection: 2 }, buy: { affection: 3 }, buyShy: 8, lines: ["{name} mở cuộn xuân cung đồ, ngón tay dừng ở một bức, má đỏ lên mà vẫn chỉ cho bệ hạ xem."] },
    // ---- Grok lượt 1 ----
    ngoc_boi_ho_diep: { name: "Ngọc bội hồ điệp", cost: 1800, kind: "keep", like: "nguc", fx: { favor: 4 }, lines: ["{name} khẽ nâng yếm, để mặt ngọc hồ điệp lạnh áp sát da, thì thầm với bệ hạ “thiếp giữ mãi món này”."] },
    khuyen_bac_tua: { name: "Khuyên bạc tua chuông", cost: 900, kind: "jewel", fx: { affection: 2, longThe: 1 }, lines: ["{name} nghiêng đầu sát tai bệ hạ, tua chuông bạc khẽ reo, thiếp khẽ nói “bệ hạ nghe thấy chưa”."] },
    luoc_nga_phuong: { name: "Lược ngà chạm phượng", cost: 1200, kind: "keep", fx: { affection: 3 }, lines: ["{name} xoay lưng, để bệ hạ cầm lược ngà chải chậm từ đỉnh đầu xuống, thiếp khẽ rùng mình."] },
    vong_bac_dui: { name: "Vòng bạc đeo đùi", cost: 1500, kind: "jewel", fx: { favor: 3 }, lines: ["{name} từ từ mở váy, để vòng bạc trên đùi lộ ra, thì thầm “bệ hạ muốn thiếp giữ vòng này cả đêm không”."] },
    goi_uyen_uong: { name: "Gối lụa thêu uyên ương", cost: 700, kind: "keep", fx: { affection: 2, longThe: 1 }, lines: ["{name} ôm gối uyên ương vào lòng, ngả người sang, thiếp nói nhỏ “đêm nay để gối này kê dưới hông thiếp”."] },
    // ---- Grok lượt 2 ----
    ngoc_hanh_doi_vang: { name: "Ngọc hành đôi khảm vàng", cost: 2100, kind: "keep", like: "buong", fx: { favor: 5 }, lines: ["{name} kéo yếm lên, để cặp ngọc hành khảm vàng lộ ra, thì thầm “thiếp đeo cả ngày chờ bệ hạ sờ”."] },
    kep_vu_bac_tua: { name: "Kẹp vú bạc tua lụa", cost: 1300, kind: "jewel", like: "nguc", fx: { longThe: 2, favor: 1 }, lines: ["{name} tự kẹp bạc lên đầu vú, tua lụa đỏ rủ xuống bụng, thiếp nói “bệ hạ kéo tua xem thiếp rên thế nào”."] },
    vong_ngoc_kin: { name: "Vòng ngọc đeo nơi kín", cost: 1700, kind: "jewel", like: "nhay", fx: { favor: 3 }, lines: ["{name} mở váy cho bệ hạ thấy vòng ngọc, thì thầm “thiếp đeo cả buổi tối, giờ ướt hết rồi”."] },
    lua_buoc_nguc: { name: "Dải lụa buộc ngực", cost: 550, kind: "keep", like: "nguc", fx: { affection: 2 }, lines: ["{name} để bệ hạ buộc dải lụa qua ngực, thiếp thở gấp “siết thêm một chút nữa đi bệ hạ”."] },
    long_vu_chuong: { name: "Lông vũ gắn chuông bạc", cost: 850, kind: "keep", fx: { favor: 3 }, lines: ["{name} nằm ngửa, để lông vũ có chuông trượt qua bụng dưới, thiếp rên nhỏ theo từng tiếng reo."] },
    // ---- Grok lượt 3 ----
    ngoc_cau_hang: { name: "Ngọc cầu nhỏ đeo háng", cost: 1950, kind: "jewel", like: "nhay", fx: { favor: 5 }, lines: ["{name} bước chậm lại gần, viên ngọc cầu cọ nhẹ, thiếp thì thầm “thiếp ướt từ lúc đeo, bệ hạ sờ thử xem”."] },
    kep_moi_bac: { name: "Kẹp môi dưới bạc", cost: 1250, kind: "jewel", like: "buong", fx: { longThe: 2, favor: 1 }, lines: ["{name} tự kẹp bạc lên môi dưới, tua lụa rủ, thiếp nói “kéo nhẹ thôi bệ hạ, thiếp sẽ rên to”."] },
    vong_bac_siet: { name: "Vòng bạc siết gốc", cost: 1600, kind: "jewel", fx: { favor: 3 }, lines: ["{name} nằm dạng, để bệ hạ đeo vòng bạc siết nhẹ, thiếp thở gấp “siết thêm một nhịp nữa đi”."] },
    luoc_nga_quet: { name: "Lược ngà quét nơi kín", cost: 1100, kind: "keep", fx: { affection: 3 }, lines: ["{name} nằm ngửa sau khi được chải tóc, thiếp thì thầm “dùng lược đó quét xuống dưới cho thiếp”."] },
    chuoi_ngoc_dui: { name: "Chuỗi ngọc dài quấn đùi", cost: 2300, kind: "jewel", fx: { favor: 4 }, lines: ["{name} để bệ hạ quấn chuỗi ngọc quanh đùi, thiếp rên nhỏ “kéo đầu chuỗi đi, thiếp muốn nó cọ mạnh”."] },
    // ---- trang sức trong nhóm y phục của Grok ----
    day_chuyen_bung: { name: "Dây chuyền bụng ngọc", cost: 1600, kind: "jewel", fx: { favor: 3 }, lines: ["{name} nằm ngửa, dây chuyền ngọc trượt trên bụng, thiếp thì thầm “bệ hạ kéo nhẹ dây này xem”."] },
    day_buoc_hang: { name: "Dây buộc háng ngọc", cost: 1400, kind: "jewel", like: "nhay", fx: { favor: 4 }, lines: ["{name} để bệ hạ buộc dây ngọc qua háng, thiếp thở dốc “siết thêm đi, thiếp muốn hạt ngọc cọ mạnh hơn”."] },
    day_chuyen_hang: { name: "Dây chuyền háng dài", cost: 1750, kind: "jewel", like: "nhay", fx: { favor: 5 }, lines: ["{name} đeo dây chuyền háng, bước từng bước chậm, thiếp thì thầm “hạt ngọc cọ mạnh lắm, bệ hạ sờ xem ướt chưa”."] },
    vong_dui_moc: { name: "Vòng đùi có móc treo", cost: 1350, kind: "jewel", fx: { favor: 3 }, lines: ["{name} đeo vòng đùi có móc, để bệ hạ treo lông vũ vào, thiếp thì thầm “mở chân ra cho nó đung đưa cọ”."] },
  };
  G.KEEP_MAX = 2; // mỗi đêm dùng tối đa
  G.ownsKeep = (c, id) => !!c && (d15().keeps[c.id] || []).includes(id);
  G.keepsOf = (c) => Object.keys(G.KEEPSAKES).filter((k) => G.ownsKeep(c, k));
  G.buyKeep = function (cid, id) {
    const s = G.state;
    const c = G.findConsort(cid);
    const k = G.KEEPSAKES[id];
    if (!c || !k) return { ok: false, text: "Không có món này." };
    if (G.ownsKeep(c, id)) return { ok: false, text: "Nàng đã có món này." };
    if (s.stats.quocKho < k.cost && !(s.godFlags && s.godFlags.infiniteMoney)) return { ok: false, text: `Ngân khố không đủ (cần ${k.cost} lượng).` };
    G.addStat("quocKho", -k.cost);
    const own = d15().keeps;
    (own[c.id] = own[c.id] || []).push(id);
    const liked = G.likesThing(c, id, k.like);
    const shy = k.buyShy && G.levelOf && G.levelOf(c) === 0;
    const aff = shy ? k.buyShy : ((k.buy && k.buy.affection) || 3) + (liked ? 3 : 0);
    c.affection = clamp(c.affection + aff, 0, 100);
    log(`Bệ hạ ban cho ${c.name} ${k.name}.`, "harem");
    return { ok: true, text: `${c.name} nhận ${k.name}${liked ? ", đúng món nàng thích" : ""}. Lần tới lật thẻ nàng, bệ hạ chọn dùng được trong đêm.`, notes: [`Quốc khố −${k.cost}`, `Tình cảm +${aff}`] };
  };

  /* ================================================================== */
  /* Đồ dùng một lần: thêm vào Kho phòng the (G.BED_ITEMS của file 13)    */
  /* ================================================================== */
  const NEW_ITEMS = {
    // Claude đề xuất
    dau_hoa_hong: { name: "Dầu hoa hồng ấm", cost: 150, desc: "Tình cảm +2", fx: { affection: 2 }, lines: ["Dầu hoa hồng ấm lăn trên da {name}, mùi hương ngọt lịm lan khắp tẩm cung."] },
    nen_sap_do: { name: "Nến sáp đỏ nhỏ giọt", cost: 450, desc: "Sủng ái +2", fx: { favor: 2 }, lines: ["{name} ưỡn ngực, để giọt sáp đỏ rơi lên đầu vú, thiếp rên “thổi đi bệ hạ, rồi hôn chỗ đó”."] },
    bat_da: { name: "Bát đá lạnh", cost: 120, desc: "Sủng ái +2", fx: { favor: 2 }, lines: ["Bệ hạ lấy một viên đá lạnh trong bát, lướt dọc cổ {name}, nàng rùng mình hít một hơi thật sâu."] },
    phan_hoa_dao: { name: "Phấn hoa đào thoa người", cost: 150, desc: "Sủng ái +2", fx: { favor: 2 }, lines: ["{name} thoa phấn hoa đào lên vai và ngực, da ửng một màu hồng nhạt thơm ngát."] },
    sua_tam_de: { name: "Sữa tắm dê và cánh hoa", cost: 250, desc: "Tình cảm +3", fx: { affection: 3 }, lines: ["{name} vừa tắm sữa dê với cánh hoa, da mịn như lụa, còn thơm mùi sữa ấm."] },
    // Grok lượt 1
    canh_dao_kho: { name: "Cánh hoa đào khô", cost: 300, desc: "Tình cảm +2", fx: { affection: 2 }, lines: ["{name} nằm ngửa, để bệ hạ rắc cánh hoa đào lên ngực, thiếp khẽ cười khi hoa trượt xuống bụng."] },
    dau_tram: { name: "Dầu trầm ấm một lần", cost: 500, desc: "Sủng ái +4", fx: { favor: 4 }, lines: ["{name} đưa lọ dầu trầm cho bệ hạ, thì thầm “xoa hết cho thiếp đêm nay, mai thiếp không còn nữa”."] },
    nen_sap_trang: { name: "Nến sáp trắng nhỏ", cost: 400, desc: "Long thể +2", fx: { longThe: 2 }, lines: ["{name} nằm yên, để giọt sáp trắng ấm rơi xuống bụng dưới, thiếp khẽ thở ra khi bệ hạ thổi nguội."] },
    huong_bot_nhai: { name: "Hương bột hoa nhài", cost: 250, desc: "Tình cảm +2", fx: { affection: 2 }, lines: ["{name} rắc bột hoa nhài lên ngực, kéo bệ hạ lại gần, thiếp nói “bệ hạ ngửi thử xem thiếp thơm không”."] },
    la_trau: { name: "Lá trầu không tươi", cost: 200, desc: "Sủng ái +1", fx: { favor: 1 }, lines: ["{name} đặt lá trầu lên đùi trong, thì thầm với bệ hạ “lấy ra rồi hôn chỗ thiếp vừa để”."] },
    // Grok lượt 2
    dau_dac: { name: "Dầu ấm đặc sệt", cost: 650, desc: "Long thể +3", fx: { longThe: 3 }, lines: ["{name} nằm dạng chân, để bệ hạ đổ dầu ấm đặc lên nơi kín, thiếp thì thầm “bôi hết đi, thiếp muốn trơn cả đêm”."] },
    bot_phan: { name: "Bột phấn thơm dính da", cost: 350, desc: "Tình cảm +2", fx: { affection: 2 }, lines: ["{name} nằm yên để bệ hạ rắc phấn lên ngực, thiếp cười khẽ “xoa mạnh vào đi, cho dính hết vào tay bệ hạ”."] },
    canh_hoa_uot: { name: "Cánh hoa tươi ướt", cost: 280, desc: "Long thể +2", fx: { longThe: 2 }, lines: ["{name} mở chân, để cánh hoa ướt dán lên nơi kín, thiếp thì thầm “lấy ra bằng lưỡi đi bệ hạ”."] },
    lua_mong_1lan: { name: "Dải lụa mỏng một lần", cost: 400, desc: "Sủng ái +3", fx: { favor: 3 }, lines: ["{name} dạng chân để bệ hạ luồn dải lụa qua, thiếp rên “kéo chậm thôi, thiếp sắp không chịu nổi”."] },
    // Grok lượt 3
    mat_ong: { name: "Mật ong đặc ấm", cost: 480, desc: "Long thể +3", fx: { longThe: 3 }, lines: ["{name} ưỡn người, để mật ong đặc nhỏ lên nơi kín, thiếp thì thầm “liếm sạch đi bệ hạ, đừng để sót”."] },
    sap_ong: { name: "Sáp ong mềm", cost: 390, desc: "Sủng ái +2", fx: { favor: 2 }, lines: ["{name} nằm yên, để viên sáp ong lăn qua nơi kín, thiếp rên “lăn chậm hơn, thiếp muốn nó tan trên người”."] },
    nuoc_hoa_dao: { name: "Nước hoa đào lạnh", cost: 320, desc: "Tình cảm +2", fx: { affection: 2 }, lines: ["{name} nằm ngửa, để bệ hạ lau nước hoa đào lạnh lên bụng dưới, thiếp run nhẹ “hôn chỗ vừa lau đi”."] },
    bot_tram: { name: "Bột trầm mịn dính", cost: 410, desc: "Long thể +2", fx: { longThe: 2 }, lines: ["{name} mở chân rộng, để bột trầm rắc đầy nơi kín, thiếp nói “xoa mạnh vào đi, cho dính cả tay bệ hạ”."] },
    lua_uot: { name: "Dải lụa ướt một lần", cost: 360, desc: "Sủng ái +3", fx: { favor: 3 }, lines: ["{name} dạng chân, để dải lụa ướt luồn qua, thiếp rên to “kéo nhanh hơn đi, thiếp muốn nó cọ mạnh”."] },
  };
  for (const [id, it] of Object.entries(NEW_ITEMS)) {
    G.BED_ITEMS[id] = { name: it.name, cost: it.cost, desc: it.desc, fx: it.fx };
    G.D13_TEXT.item[id] = it.lines;
  }

  /* ================================================================== */
  /* Y phục mới (thêm vào tủ y phục của file 13)                          */
  /* ================================================================== */
  const NEW_OUTFITS = {
    ao_ho_lung: { name: "Áo choàng lụa hở lưng", cost: 1100, lines: ["{name} buộc nút áo choàng, quay lưng về phía bệ hạ, thiếp nói nhỏ “bệ hạ muốn cởi nút này không”."] },
    quan_xe_cao: { name: "Quần lụa xẻ cao", cost: 950, lines: ["{name} ngồi xuống, quần lụa xẻ cao trượt sang hai bên, thiếp nhìn bệ hạ rồi khẽ mỉm cười."] },
    khan_che_nguc: { name: "Khăn lụa che ngực", cost: 600, lines: ["{name} đứng trước bệ hạ, khăn lụa chỉ che ngực, thiếp nói “bệ hạ muốn kéo nút sau lưng thiếp không”."] },
    tat_lua: { name: "Tất lụa dài đến đùi", cost: 800, lines: ["{name} từ từ kéo tất lụa lên đùi, nhìn bệ hạ rồi thì thầm “thiếp giữ tất này cả đêm được không”."] },
    yem_ho: { name: "Yếm hở", cost: 750, lines: ["{name} chỉ mặc yếm hở, ngồi dạng chân trước bệ hạ, thiếp nói “kéo xuống nữa đi, thiếp muốn lộ hết”."] },
    vay_khong_day: { name: "Váy không đáy", cost: 900, lines: ["{name} ngồi lên đùi bệ hạ, váy không đáy trượt sang, thiếp thì thầm “không cần cởi, thiếp sẵn sàng rồi”."] },
    ao_khong_cuc: { name: "Áo choàng không cúc", cost: 680, lines: ["{name} khoác áo không cúc, cúi xuống nhặt khăn, thiếp cười “áo tuột rồi, bệ hạ nhìn thỏa chưa”."] },
    tat_luoi: { name: "Tất lưới lụa đến hông", cost: 820, lines: ["{name} kéo tất lưới lên tận hông, mở chân trước gương, thiếp nói “bệ hạ thích thiếp mặc thế này không”."] },
    yem_tua: { name: "Yếm chỉ có tua", cost: 620, lines: ["{name} chỉ mặc yếm tua, thở mạnh cho tua động, thiếp nói “thổi vào đi bệ hạ, cho tua quét đầu vú thiếp”."] },
    quan_lot_khe: { name: "Quần lọt khe ngọc", cost: 1050, lines: ["{name} ngồi xổm trước bệ hạ, quần lọt khe ngọc ấn sâu, thiếp rên “hạt ngọc cọ mạnh quá, thiếp không ngồi lâu được”."] },
    khan_trong_suot: { name: "Khăn che háng trong suốt", cost: 540, lines: ["{name} buộc khăn trong suốt qua háng, ngồi dạng, thiếp nói “nhìn xuyên đi bệ hạ, thiếp ướt hết rồi vẫn chưa cởi”."] },
  };
  // giữ "Không mặc gì" ở cuối danh sách
  const none = G.OUTFITS.khong_mac;
  delete G.OUTFITS.khong_mac;
  for (const [id, o] of Object.entries(NEW_OUTFITS)) {
    G.OUTFITS[id] = { name: o.name, cost: o.cost };
    G.D13_TEXT.outfit[id] = o.lines;
  }
  G.OUTFITS.khong_mac = none;

  /* ================================================================== */
  /* Bày biện tẩm cung: mua một lần, chọn một món mỗi đêm                 */
  /* ================================================================== */
  G.FURNISH = {
    guong_dong_lon: { name: "Gương đồng lớn khảm ngọc", cost: 2000, fx: { favor: 2 }, lines: ["Gương đồng lớn khảm ngọc soi trọn {name} từ đầu đến chân, nàng nhìn bệ hạ qua gương mà mỉm cười."] },
    ngua_go: { name: "Ngựa gỗ bập bênh sơn son", cost: 3000, fx: { affection: 3 }, lines: ["{name} ngồi lên ngựa gỗ sơn son, nhún nhẹ một cái, tà áo tung lên, nàng cười khúc khích nhìn bệ hạ."] },
    binh_phong_xuan: { name: "Bình phong lụa thêu xuân", cost: 2200, fx: { favor: 3 }, lines: ["{name} đứng sau bình phong lụa, chỉ để bóng hiện lên, thiếp gọi nhỏ “bệ hạ sang đây với thiếp”."] },
    ghe_tram: { name: "Ghế thấp gỗ trầm", cost: 1400, fx: { longThe: 2 }, lines: ["{name} ngồi xuống ghế gỗ trầm, mở váy sang hai bên, thiếp nhìn lên bệ hạ chờ."] },
    giuong_man: { name: "Giường có màn lụa dày", cost: 2800, fx: { favor: 4 }, lines: ["{name} kéo màn lụa kín lại, chỉ còn ánh nến le lói, thiếp thì thầm “trong này chỉ có bệ hạ và thiếp”."] },
    bon_go: { name: "Bồn gỗ tắm nhỏ", cost: 1900, fx: { affection: 3 }, lines: ["{name} ngồi trong bồn gỗ, nước chỉ đến eo, thiếp vẫy tay gọi “bệ hạ vào với thiếp”."] },
    den_dau: { name: "Đèn dầu thấp đặt sàn", cost: 650, fx: { favor: 2 }, lines: ["{name} nằm nghiêng cạnh đèn dầu thấp, ánh sáng hắt lên thân, thiếp nói nhỏ “bệ hạ nhìn thiếp từ đây đi”."] },
    ghe_lo: { name: "Ghế có lỗ ngồi", cost: 1600, fx: { longThe: 3 }, lines: ["{name} ngồi lên ghế có lỗ, nơi kín lộ xuống dưới, thiếp thì thầm “bệ hạ sờ từ dưới đi, thiếp không nhúc nhích”."] },
    guong_san: { name: "Gương đồng đặt sàn", cost: 1900, fx: { favor: 3 }, lines: ["{name} đứng trên gương đồng, mở chân nhìn xuống, thiếp nói “bệ hạ xem thiếp từ dưới đẹp không”."] },
    xich_lua: { name: "Xích lụa treo nhẹ", cost: 1100, fx: { favor: 3 }, lines: ["{name} nắm dải lụa treo, để bệ hạ quấn nhẹ cổ tay, thiếp thì thầm “giữ thiếp thế này rồi làm đi”."] },
    dem_ke: { name: "Đệm lụa dày kê hông", cost: 720, fx: { longThe: 2 }, lines: ["{name} nằm ngửa, để bệ hạ kê đệm dưới hông, thiếp rên “cao hơn nữa đi, thiếp muốn bệ hạ vào sâu”."] },
    binh_phong_thap: { name: "Bình phong thấp che nửa người", cost: 980, fx: { affection: 2 }, lines: ["{name} đứng sau bình phong thấp, chỉ để ngực lộ trên, thiếp nói “bệ hạ đoán xem dưới này thiếp đang làm gì”."] },
    ghe_thanh: { name: "Ghế có thanh ngang", cost: 1550, fx: { longThe: 3 }, lines: ["{name} ngồi dạng lên ghế, thanh ngang cọ nơi kín, thiếp rên “bệ hạ đẩy ghế đi, cho nó cọ mạnh hơn”."] },
    guong_treo: { name: "Gương đồng treo thấp", cost: 2100, fx: { favor: 3 }, lines: ["{name} quỳ trước gương treo thấp, mở chân nhìn phản chiếu, thiếp nói “bệ hạ làm đi, thiếp muốn xem trong gương”."] },
    xa_moc: { name: "Xà nhà có nhiều móc lụa", cost: 1250, fx: { favor: 3 }, lines: ["{name} nắm hai dải lụa treo, để bệ hạ quấn thêm cổ tay, thiếp thì thầm “giữ thiếp thế này rồi vào đi”."] },
    buc_go: { name: "Bục gỗ thấp kê người", cost: 880, fx: { longThe: 2 }, lines: ["{name} nằm sấp, để bệ hạ kê bục dưới bụng, thiếp rên “nâng cao hơn nữa, thiếp muốn bệ hạ vào hết”."] },
    man_nua: { name: "Màn che nửa giường", cost: 1450, fx: { affection: 2 }, lines: ["{name} nằm nửa người trong màn, nửa dưới lộ ra, thiếp nói “bệ hạ làm phía ngoài đi, thiếp không kéo màn”."] },
  };
  G.ownsFurn = (id) => d15().furn.includes(id);
  G.buyFurn = function (id) {
    const s = G.state;
    const f = G.FURNISH[id];
    if (!f) return { ok: false, text: "Không có món này." };
    if (G.ownsFurn(id)) return { ok: false, text: "Tẩm cung đã có món này." };
    if (s.stats.quocKho < f.cost && !(s.godFlags && s.godFlags.infiniteMoney)) return { ok: false, text: `Ngân khố không đủ (cần ${f.cost} lượng).` };
    G.addStat("quocKho", -f.cost);
    d15().furn.push(id);
    log(`Tẩm cung bày thêm ${f.name}.`, "harem");
    return { ok: true, text: `Nội vụ phủ đã bày ${f.name} trong tẩm cung. Khi lật thẻ, chọn món này ở mục Bày biện.`, notes: [`Quốc khố −${f.cost}`] };
  };

  /* ================================================================== */
  /* Tố Nữ Kinh: mở lớp Phòng the ở Học phường                            */
  /* ================================================================== */
  G.KINH_COST = 1200;
  G.SUBJECTS.phong_the = "Phòng the";
  G.hasKinh = () => !!(G.state && d15().kinh);
  G.buyKinh = function () {
    const s = G.state;
    if (G.hasKinh()) return { ok: false, text: "Học phường đã có Tố Nữ Kinh." };
    if (s.stats.quocKho < G.KINH_COST && !(s.godFlags && s.godFlags.infiniteMoney)) return { ok: false, text: `Ngân khố không đủ (cần ${G.KINH_COST} lượng).` };
    G.addStat("quocKho", -G.KINH_COST);
    d15().kinh = true;
    log("Học phường nhận bộ Tố Nữ Kinh chép tay, mở lớp Phòng the.", "harem");
    return { ok: true, text: "Bộ Tố Nữ Kinh chép tay được đưa vào Học phường. Từ nay các phi học được lớp Phòng the (hồ sơ phi › Học phường). Học đủ 12 tháng thì nàng tinh thông phòng the.", notes: [`Quốc khố −${G.KINH_COST}`] };
  };
  const setSchoolD15 = G.setSchool;
  G.setSchool = function (id, subj) {
    if (subj === "phong_the" && !G.hasKinh()) return;
    return setSchoolD15(id, subj);
  };

  /* ================================================================== */
  /* Áp dụng đồ riêng và bày biện khi thị tẩm                             */
  /* ================================================================== */
  const setExtrasD15 = G.setNightExtras;
  G.setNightExtras = function (cid, items, outfit, keeps, furn) {
    setExtrasD15(cid, items, outfit);
    d15().useNext = { id: cid, keeps: (keeps || []).filter((k) => G.KEEPSAKES[k]).slice(0, G.KEEP_MAX), furn: furn && G.FURNISH[furn] && G.ownsFurn(furn) ? furn : null };
  };
  const applyFx = (c, fx, mult) => {
    if (fx.affection) c.affection = clamp(c.affection + fx.affection * mult, 0, 100);
    if (fx.favor) G.changeFavor(c, fx.favor * mult);
    if (fx.longThe) G.addStat("longThe", fx.longThe * mult);
    if (fx.truyLac) G.addStat("truyLac", fx.truyLac * mult);
  };
  const fxText = (fx) =>
    [fx.favor ? `Sủng ái +${fx.favor}` : "", fx.affection ? `Tình cảm +${fx.affection}` : "", fx.longThe ? `Long thể +${fx.longThe}` : "", fx.truyLac ? `Trụy lạc +${fx.truyLac}` : ""].filter(Boolean).join(", ");
  const summonD15 = G.summon;
  G.summon = function (id, fetishIds) {
    const scene = summonD15(id, fetishIds);
    const d = d15();
    const u = d.useNext;
    d.useNext = null;
    const c = G.findConsort(id);
    if (!scene || scene.blocked || !c || !u || u.id !== c.id) return scene;
    const lines = [];
    const notes = scene.notes || (scene.notes = []);
    if (u.furn) {
      const f = G.FURNISH[u.furn];
      lines.push(G.fill(G.d3one(f.lines), { speaker: c }));
      applyFx(c, f.fx, 1);
      notes.push(`${f.name}: ${fxText(f.fx)}`);
    }
    for (const k of u.keeps) {
      if (!G.ownsKeep(c, k)) continue;
      const it = G.KEEPSAKES[k];
      lines.push(G.fill(G.d3one(it.lines), { speaker: c }));
      applyFx(c, it.fx, 1);
      const liked = G.likesThing(c, k, it.like);
      if (liked) c.affection = clamp(c.affection + 2, 0, 100);
      if (it.shave && G.bodyOf) G.bodyOf(c).shaved = G.state.turn;
      notes.push(`${it.name}: ${fxText(it.fx)}${liked ? ", nàng thích: Tình cảm +2" : ""}${it.shave ? ", nàng được cạo sạch" : ""}`);
      const used = (d.keepUsed[c.id] = d.keepUsed[c.id] || {});
      used[k] = (used[k] || 0) + 1;
    }
    if (lines.length && scene.pages && scene.pages.length) {
      const pages = scene.pages.slice();
      pages[0] = lines.join(" ") + "\n\n" + pages[0];
      Object.assign(scene, { pages, text: pages.join("\n\n") });
    }
    return scene;
  };
})();
