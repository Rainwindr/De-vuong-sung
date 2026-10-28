/*
 * Đợt 2 + 3 (0.5.0): Tâm nguyện, Lịch lễ, Hành cung, Sắc phong, Phe phái, Tin đồn, Hòa thân.
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
  /* ĐỢT 2 + 3 (0.5.0): Tâm nguyện · Lịch lễ · Hành cung · Sắc phong ·   */
  /*                    Phe phái · Tin đồn · Hòa thân                     */
  /* ================================================================== */
  /*
   * Câu chữ nháp nằm trong G.D2_TEXT để thay bằng bản Grok viết.
   * Biến: {name} người chính, {name2} người thứ hai, {rank} phẩm, {gift} tên quà, {fetish} tên sở thích,
   * {region} tên nước/vùng, {cost} số lượng.
   */
  G.D2_TEXT = {
    wish: {
      len_pham: "Muốn được thăng phẩm",
      co_con: "Muốn có con với bệ hạ",
      hoc_nghe: "Muốn học thành một môn ở học phường",
      di_cung: "Muốn được đi cùng bệ hạ một chuyến (hành cung hoặc lễ Thất tịch)",
      mon_qua: "Muốn được tặng {gift}",
      duoc_trieu: "Muốn được triệu ba đêm",
      thu_so_thich: "Muốn được thử \"{fetish}\" cùng bệ hạ",
    },
    wishDone: {
      len_pham: "{name} mặc bộ áo phẩm mới, đứng trước gương mãi không thôi.\n> Thiếp cứ tưởng phải đợi lâu lắm. Bệ hạ cho thiếp được đứng gần người hơn rồi.",
      co_con: "{name} đặt tay bệ hạ lên bụng mình, mắt rưng rưng.\n> Thiếp ước điều này từ lâu. Đứa bé này là của chúng ta.",
      hoc_nghe: "{name} ôm bằng khen của học phường chạy đến, quên cả lễ nghi.\n> Bệ hạ xem này! Thiếp học thành rồi, đêm nay thiếp trình cho người xem.",
      di_cung: "Trên đường về, {name} tựa vai bệ hạ trong kiệu.\n> Chuyến này thiếp sẽ nhớ mãi. Cảm ơn bệ hạ đã chọn thiếp.",
      mon_qua: "{name} cầm món quà trên tay, cười tươi như hoa.\n> Sao bệ hạ biết thiếp mong món này? Thiếp chưa từng nói với ai.",
      duoc_trieu: "Đêm thứ ba liền, {name} vẫn còn đỏ mặt khi thấy thẻ tên mình được lật.\n> Thiếp chỉ ước được gần bệ hạ thôi, mà bệ hạ cho thiếp nhiều thế này.",
      thu_so_thich: "Sáng hôm sau, {name} còn ngượng ngùng kéo chăn lên tận mũi.\n> Thiếp nghĩ mãi mới dám nói ra… may mà bệ hạ chiều thiếp.",
    },
    hoaTrieu: "Ngày Hoa triêu, sinh nhật trăm hoa. Ngự hoa viên mở cửa, các phi cài hoa đợi bệ hạ dạo vườn.\n> Bệ hạ cài hoa cho ai, năm ấy người đó gặp may.",
    doanNgoWin: "Cung của {name} thắng đua thuyền rồng.",
    hanhCung: {
      he: { name: "Tiểu thử sơn trang", desc: "Nghỉ mát trên núi tháng 6. Mỗi phi đi cùng +6 Tình cảm." },
      dong: { name: "Suối nước nóng", desc: "Tránh rét bên suối nước nóng tháng 11. Mỗi phi đi cùng +6 Sủng ái." },
    },
    sacPhong: "Lễ bộ dâng tấu xin sắc phong {name} lên phẩm {rank}. Đại lễ hao {cost} ngân khố, các phi tần rục rịch chuẩn bị lễ phục.\n> Thần thiếp {name} vui mừng được lên {rank}, cái lồn thiếp đã ướt át chờ được bệ hạ địt cho sướng.",
    lapHau: "Hôm nay cử hành đại lễ lập {name} làm Hoàng hậu. Lễ bộ trình {cost} ngân sách cho nghi thức long trọng bậc nhất.\n> Thần thiếp {name} xin quỳ nhận sắc chỉ, nguyện dùng miệng bú cặc và cái lồn hầu hạ bệ hạ suốt đời.",
    phe: [{"text": "Trong yến tiệc đêm Trung thu, chỗ ngồi bên trái bệ hạ còn trống. {name} và {name2} cùng bước tới, {name} khẽ nói: Bệ hạ, thần thiếp xin được ngồi cạnh người, đã chuẩn bị sẵn bánh hoa quế theo khẩu vị của bệ hạ. {name2} liền đáp: Bệ hạ, chỗ này thần thiếp đã được ban từ sớm, xin người phân xử công bằng."}, {"text": "Sau buổi chầu, {name} và {name2} cùng mời bệ hạ về cung. {name} nhẹ nhàng: Bệ hạ, cung của thần thiếp vừa nấu trà Long Tỉnh mới, xin người ghé qua nghỉ chân. {name2} mỉm cười: Bệ hạ, thần thiếp đã soạn sẵn bàn cờ và đèn dầu, mong được hầu người một canh giờ."}, {"text": "Lụa tơ tằm mới từ cung dệt vừa về, chỉ đủ may hai bộ. {name} và {name2} cùng xin. {name} thưa: Bệ hạ, thần thiếp muốn may áo cho người mặc trong lễ tế, xin người ban cho. {name2} nói: Bệ hạ, lụa này hợp màu cung của thần thiếp, xin người phân cho công bằng."}, {"text": "Phường học mở thêm suất học thư pháp cho phi tần. {name} và {name2} tranh suất cuối. {name} nói: Bệ hạ, thần thiếp muốn học để viết thư cho người, xin ban suất này. {name2} thưa: Bệ hạ, thần thiếp đã luyện lâu, xin người cho cơ hội hoàn thiện."}, {"text": "Trong buổi lễ dâng hương, vị trí đứng gần bệ hạ chỉ còn một. {name} và {name2} cùng xin. {name} khẽ: Bệ hạ, thần thiếp xin đứng cạnh để hầu người thắp hương. {name2} đáp: Bệ hạ, thần thiếp đã chuẩn bị trầm hương thơm, xin được hầu gần."}, {"text": "Vườn ngự nở mẫu đơn hiếm, chỉ đủ cắt một cành. {name} và {name2} cùng xin. {name} nói: Bệ hạ, thần thiếp muốn cắm trong cung để người ngắm khi ghé thăm. {name2} thưa: Bệ hạ, thần thiếp đã chăm hoa từ sớm, xin người ban cành này."}, {"text": "Buổi tối nghe nhạc, quyền chọn nhạc công còn trống. {name} và {name2} tranh. {name} nói: Bệ hạ, thần thiếp muốn mời đội đàn tranh, hợp tai người. {name2} mỉm cười: Bệ hạ, thần thiếp đã chọn sẵn bài ca mới, xin được trình diễn."}, {"text": "Khi đi dạo thuyền trên hồ, chỗ ngồi đối diện bệ hạ chỉ một. {name} và {name2} cùng xin. {name} thưa: Bệ hạ, thần thiếp xin ngồi đối diện để hầu trà. {name2} nói: Bệ hạ, thần thiếp mang theo bánh ngọt, xin được hầu người trên thuyền."}],
    pheMerge: "Phe của {name2} thế lực yếu dần, {name2} xin bệ hạ cho phép hợp vào phe của {name} để được che chở và cùng hầu người.",
    rumors: [{"intro": "Trong hậu cung đồn rằng {name} thường tự sướng trong phòng khi đêm khuya, {name2} là người kể đầu tiên sau khi tình cờ nghe tiếng từ cửa sổ.", "yes": "Điều tra cho thấy {name} quả thật có thói quen tự sướng mỗi đêm, thói quen này kéo dài đã nhiều tháng.", "no": "Điều tra xác nhận {name} bị oan, tiếng động chỉ là gió thổi rèm cửa, {name} không hề làm chuyện ấy."}, {"intro": "Tin đồn lan ra rằng {name} thường lén lút đụ phi tần khác trong hậu cung, {name2} kể lại sau khi thấy hai người ra vào cùng lúc.", "yes": "Kết quả điều tra cho thấy {name} thật sự có quan hệ thân mật với một phi tần khác, chuyện xảy ra nhiều lần.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ cùng trò chuyện và uống trà, không có chuyện đụ nhau."}, {"intro": "Cung nhân đồn {name} hay thủ dâm bằng đồ chơi trong tủ, {name2} là người phát hiện và kể lại đầu tiên.", "yes": "Điều tra xác nhận {name} có giữ đồ chơi và thường dùng để tự sướng khi ở một mình.", "no": "Điều tra cho thấy {name} bị oan, đồ trong tủ chỉ là đồ trang sức và khăn thêu, không có chuyện thủ dâm."}, {"intro": "Có tin {name} thường nằm chung giường với phi tần khác và đụ nhau ban đêm, {name2} kể sau khi thấy chăn gối lộn xộn.", "yes": "Điều tra cho thấy {name} thật sự thường nằm chung và có quan hệ xác thịt với phi tần kia nhiều đêm.", "no": "Điều tra xác nhận {name} bị oan, hai người chỉ ngủ chung vì lạnh và không có chuyện đụ."}, {"intro": "Đồn rằng {name} hay tự sướng khi tắm, tiếng nước và tiếng thở bị {name2} nghe thấy và kể ra.", "yes": "Kết quả cho thấy {name} quả thật có thói quen tự sướng trong lúc tắm, chuyện xảy ra thường xuyên.", "no": "Điều tra cho thấy {name} bị oan, tiếng động chỉ do nước chảy và {name} chỉ tắm bình thường."}, {"intro": "Tin lan truyền {name} lén đụ một phi tần trong vườn hoa đêm khuya, {name2} là người nhìn thấy bóng người và kể đầu tiên.", "yes": "Điều tra xác nhận {name} thật sự có quan hệ với phi tần đó trong vườn nhiều lần.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ đi dạo và trò chuyện, không có chuyện đụ."}, {"intro": "Cung nhân nói {name} thường dùng ngón tay tự sướng khi nằm một mình, {name2} kể lại sau khi tình cờ thấy từ khe cửa.", "yes": "Điều tra cho thấy {name} quả thật có thói quen dùng tay tự sướng mỗi tối trước khi ngủ.", "no": "Điều tra xác nhận {name} bị oan, {name} chỉ đang thoa dầu dưỡng da và không làm chuyện ấy."}, {"intro": "Đồn rằng {name} hay nằm chung với hai phi tần khác và đụ nhau luân phiên, {name2} là người kể sau khi nghe tiếng từ phòng.", "yes": "Kết quả điều tra cho thấy {name} thật sự có quan hệ xác thịt với hai phi tần kia nhiều đêm.", "no": "Điều tra cho thấy {name} bị oan, ba người chỉ ngồi chơi bài và nói chuyện, không có chuyện đụ."}, {"intro": "Tin đồn {name} tự sướng bằng gối trong phòng, {name2} nhìn thấy gối ướt và kể ra đầu tiên.", "yes": "Điều tra xác nhận {name} có thói quen dùng gối để tự sướng khi ở một mình.", "no": "Điều tra cho thấy {name} bị oan, gối ướt chỉ do đổ nước trà, {name} không làm chuyện ấy."}, {"intro": "Cung nhân đồn {name} thường đụ phi tần khác trong nhà tắm khi không có ai, {name2} kể lại sau khi thấy hai người ra cùng lúc.", "yes": "Điều tra cho thấy {name} thật sự có quan hệ với phi tần đó trong nhà tắm nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, hai người chỉ tắm riêng và tình cờ ra cùng lúc, không có chuyện đụ."}, {"intro": "Cung nhân đồn {name} thường nuốt hết nước dâm của phi tần khác đến không còn một giọt, {name2} thấy miệng ướt nhẹp và kể đầu tiên.", "yes": "Điều tra cho thấy {name} quả thật thường bú đến cùng và nuốt sạch nước của phi tần kia nhiều đêm.", "no": "Điều tra xác nhận {name} bị oan, miệng ướt chỉ do uống trà, không có chuyện nuốt nước dâm."}, {"intro": "Tin lan ra {name} hay ngồi lên mặt phi tần khác rồi vừa xoa vừa bắt liếm đến sưng mép, {name2} nghe tiếng rên và kể.", "yes": "Kết quả điều tra cho thấy {name} thật sự thường cưỡi mặt phi tần kia đến chảy nước đầy miệng.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ ngồi chơi cờ, không có chuyện cưỡi mặt."}, {"intro": "Đồn rằng {name} thường móc lưỡi sâu vào lồn phi tần khác rồi liếm đến sưng tấy, {name2} thấy dấu đỏ và kể ra.", "yes": "Điều tra xác nhận {name} có thói quen dùng lưỡi đâm sâu và liếm lồn phi tần kia đến ướt át.", "no": "Điều tra cho thấy {name} bị oan, dấu đỏ chỉ do thoa dầu, {name} không làm chuyện ấy."}, {"intro": "Cung nhân nói {name} hay bắt phi tần khác mút ngón chân rồi nhổ nước bọt lên đùi, {name2} nhìn thấy và kể đầu tiên.", "yes": "Điều tra cho thấy {name} quả thật thường bắt phi tần kia mút chân và nhổ nước bọt lên người nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, hai người chỉ massage chân bình thường, không có chuyện mút và nhổ."}, {"intro": "Tin đồn {name} thường nằm xem phi tần khác tự sướng rồi bắt họ liếm tay mình, {name2} thấy từ khe cửa và kể.", "yes": "Kết quả cho thấy {name} thật sự ngồi xem và bắt phi tần kia liếm tay đầy nước dâm nhiều đêm.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ cùng đọc sách, không có chuyện xem và liếm."}, {"intro": "Đồn rằng {name} hay dùng lưỡi liếm háng và hậu môn phi tần khác đến chảy nước miếng, {name2} nghe tiếng và kể ra.", "yes": "Điều tra xác nhận {name} thường liếm từ lồn xuống lỗ đít phi tần kia đến ướt nhẹp.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ thoa dầu dưỡng, không có chuyện liếm háng."}, {"intro": "Cung nhân đồn {name} thường bắt hai phi tần cùng mút vú mình rồi nhổ nước vào miệng nhau, {name2} kể sau khi thấy.", "yes": "Điều tra cho thấy {name} quả thật bắt hai phi tần mút vú và chơi nước bọt với nhau nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, ba người chỉ ngồi may vá, không có chuyện mút vú."}, {"intro": "Đồn rằng {name} thường móc hai ngón vào miệng phi tần khác rồi bắt họ mút đến chảy dãi, {name2} thấy và kể.", "yes": "Điều tra xác nhận {name} có thói quen đút ngón vào miệng phi tần kia bắt mút đến ướt át.", "no": "Điều tra cho thấy {name} bị oan, hai người chỉ đùa giỡn bình thường, không có chuyện đút ngón."}, {"intro": "Cung nhân nói {name} hay liếm sạch nước dâm trên đùi phi tần khác rồi nhổ lại vào lồn, {name2} nhìn thấy dấu và kể ra.", "yes": "Điều tra cho thấy {name} quả thật thường liếm sạch rồi nhổ nước bọt vào lồn phi tần kia nhiều lần.", "no": "Điều tra xác nhận {name} bị oan, dấu ướt chỉ do đổ nước, {name} không làm chuyện ấy."}, {"intro": "Tin lan truyền {name} hay nằm dưới để phi tần khác phun nước dâm vào miệng rồi nuốt, {name2} nghe tiếng và kể đầu tiên.", "yes": "Kết quả điều tra cho thấy {name} thật sự để phi tần kia phun nước dâm vào miệng và nuốt nhiều đêm.", "no": "Điều tra cho thấy {name} bị oan, tiếng nước chỉ do đổ trà, {name} không làm chuyện ấy."}],
    rumorAct: "Xử ngay theo tin: {name} bị quở trách, cắt bổng một tháng.",
    rumorFalse: "{name} bị oan, nàng khóc cả đêm. {name2} lại được tiếng là người thẳng thắn.",
    rumorIgnoreTrue: "Bệ hạ bỏ qua, nhưng chuyện cứ âm ỉ trong hậu cung.",
    rumorIgnoreFalse: "Bệ hạ bỏ qua. Vài hôm sau tin đồn tự tắt.",
    hoaThan: "Sứ thần nước {region} kính dâng {n} cuộn tranh niêm phong, mỗi cuộn là chân dung công chúa do chính nàng vẽ hoặc đồng ý cho vẽ, tự tay gửi sang. Các nàng đều tự nguyện hòa thân, chỉ bệ hạ được mở xem.\nTranh còn giữ nguyên dấu sáp, chưa ai dám phá.",
    hoaThanCond: {
      thue: "Điều kiện của sứ: giảm thuế buôn bán với {region} trong hai năm (Quốc khố −100 mỗi tháng).",
      cung: "Điều kiện của sứ: xây cho nàng một cung riêng theo kiểu quê nhà (Quốc khố −1000, cung nàng lên một bậc).",
    },
  };

  const d2 = (s) => {
    s = s || G.state;
    if (!s.d2) s.d2 = {};
    const d = s.d2;
    const init = { wishes: {}, went: {}, usedWith: {}, hanhCung: {}, sacQueue: [], sacAsked: {}, phe: { leaders: [], members: {}, strength: {} }, queenLeader: null, sulkUntil: -1, sulkLeader: null, pheTurn: -99, rumorTurn: -99, rumorPending: null, hoaThanYear: 0, taxCutUntil: -1, travelPenalty: {}, princessUsed: [], festivalDone: {} };
    for (const [k, v] of Object.entries(init)) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(v));
    return d;
  };
  G.d2 = d2;
  const sideRoom = (report) => report.sideEvents.length < G.SIDE_MAX;
  const fillVars = (t, vars) => String(t).replace(/\{(gift|fetish|region|cost|n|rank)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

  /* Cảnh cho các HOOK mới: chưa có chữ thì mượn cảnh thị tẩm của người chính. */
  G.D2_HOOKS = {
    "canh-viet.tam_nguyen_len_pham": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_co_con": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_hoc_nghe": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_di_cung": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_mon_qua": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_duoc_trieu": "Tâm nguyện thành",
    "canh-viet.tam_nguyen_thu_so_thich": "Tâm nguyện thành",
    "canh-viet.le_hoa_trieu": "Hoa triêu",
    "canh-viet.le_doan_ngo": "Đêm Đoan ngọ",
    "canh-viet.hanh_cung_he": "Tiểu thử sơn trang",
    "canh-viet.hanh_cung_dong": "Suối nước nóng",
    "canh-viet.sac_phong_phi": "Đêm sắc phong",
    "canh-viet.sac_phong_quy_phi": "Đêm sắc phong",
    "canh-viet.sac_phong_hoang_quy_phi": "Đêm sắc phong",
    "canh-viet.sac_phong_hoang_hau": "Đêm lập hậu",
  };
  for (const [hid, title] of Object.entries(G.D2_HOOKS))
    G.hooks.register(
      hid,
      (ctx) => {
        const h = G.hooks.resolve("core.thi_tam");
        const sc = h ? h.fn(ctx) : null;
        if (!sc) return null;
        const names = ctx.participants.map((p) => p.name).join(", ");
        return Object.assign({}, sc, { title: `${title} · ${names}` });
      },
      "dot-2"
    );

  /* Ghi nhận sở thích đã dùng với từng phi (cho tâm nguyện "thử sở thích") */
  const runHookD2 = G.runHook;
  G.runHook = function (id, ctxIn) {
    const scene = runHookD2(id, ctxIn);
    if (scene && !scene.blocked && G.state) {
      const d = d2();
      for (const p of ctxIn.participants || []) {
        if (!p || p.isChild) continue;
        const u = (d.usedWith[p.id] = d.usedWith[p.id] || {});
        for (const f of ctxIn.fetish || []) u[f] = G.state.turn;
      }
    }
    return scene;
  };

  /* ---------------- 4 · Tâm nguyện ---------------- */
  const tinhThong = (c) => c.traits.filter((t) => t.startsWith("Tinh thông")).length;
  G.WISH_MONTHS = 12;
  G.WISH_AFFECTION = 15;
  G.WISHES = {
    len_pham: { ok: (c) => c.rank < 6, base: (c) => ({ rank: c.rank }), done: (c, w) => c.rank > w.base.rank },
    co_con: { ok: (c) => c.pregnantDue == null, base: (c) => ({ kids: c.kids }), done: (c, w) => c.pregnantDue != null || c.kids > w.base.kids },
    hoc_nghe: { ok: () => true, base: (c) => ({ t: tinhThong(c) }), done: (c, w) => tinhThong(c) > w.base.t },
    di_cung: { ok: () => true, base: () => ({}), done: (c, w) => (d2().went[c.id] || -1) >= w.since },
    mon_qua: {
      ok: () => Object.keys(R.gifts).length > 0,
      target: (c) => {
        const liked = Object.values(R.gifts).filter((g) => (g.likes || []).some((l) => c.likes.includes(l) || c.traits.includes(l) || l === c.id));
        return pick(liked.length ? liked : Object.values(R.gifts)).id;
      },
      base: (c, t) => ({ n: c.gifts[t] || 0 }),
      done: (c, w) => (c.gifts[w.target] || 0) > w.base.n,
    },
    duoc_trieu: { ok: () => true, base: (c) => ({ n: c.nights }), done: (c, w) => c.nights >= w.base.n + 3 },
    thu_so_thich: {
      ok: (c) => !!wishFetish(c),
      target: (c) => wishFetish(c),
      base: () => ({}),
      done: (c, w) => ((d2().usedWith[c.id] || {})[w.target] || -1) >= w.since,
    },
  };
  function wishFetish(c) {
    const used = d2().usedWith[c.id] || {};
    const list = Object.keys(R.fetishes).filter((f) => G.fetishUnlocked(f) && G.consentOf(c, f) === "willing" && used[f] == null);
    return list.length ? pick(list) : null;
  }
  // phi cốt truyện có tâm nguyện đầu tiên theo truyện của nàng
  G.WISH_STORY = {
    "core.uyen_nghi": "len_pham",
    "core.moc_can": "duoc_trieu",
    "core.tuyet": "di_cung",
    "core.nhu_yen": "len_pham",
    "core.tu_lan": "thu_so_thich",
    "core.mi_nuong": "mon_qua",
    "core.thanh_ca": "hoc_nghe",
    "core.song_nguyet": "di_cung",
    "core.song_nhat": "thu_so_thich",
    "core.hong_tieu": "co_con",
  };
  const WISH_BY_TRAIT = { "Kiêu kỳ": "len_pham", "Thích chưng diện": "mon_qua", "Phúc tướng": "co_con", "Giọng hát ngọt": "hoc_nghe", "Biết múa": "hoc_nghe", "Lãng mạn": "di_cung", "Táo bạo": "thu_so_thich", "Si tình": "duoc_trieu", "Ôn nhu": "co_con" };
  function newWish(c, first) {
    const s = G.state;
    const d = d2();
    let type = first && G.WISH_STORY[c.id];
    if (!type || !G.WISHES[type].ok(c)) {
      const byTrait = c.traits.map((t) => WISH_BY_TRAIT[t]).filter((t) => t && G.WISHES[t].ok(c));
      const all = Object.keys(G.WISHES).filter((t) => G.WISHES[t].ok(c));
      type = byTrait.length && rand() < 0.6 ? pick(byTrait) : pick(all);
    }
    const W = G.WISHES[type];
    const target = W.target ? W.target(c) : null;
    d.wishes[c.id] = { type, target, since: s.turn, due: s.turn + G.WISH_MONTHS, base: W.base(c, target) };
  }
  G.wishText = function (c) {
    const s = G.state;
    const w = s && s.d2 && s.d2.wishes[c.id];
    if (!w) return null;
    const t = fillVars(G.D2_TEXT.wish[w.type] || w.type, { gift: w.target && R.gifts[w.target] ? R.gifts[w.target].name : "", fetish: w.target && R.fetishes[w.target] ? R.fetishes[w.target].name : "" });
    return { text: t, left: Math.max(0, w.due - s.turn) };
  };
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    for (const c of s.consorts) {
      const w = d.wishes[c.id];
      if (!w) {
        newWish(c, !d.wishes["_done_" + c.id]);
        continue;
      }
      const W = G.WISHES[w.type];
      let done = false;
      try {
        done = W && W.done(c, w);
      } catch (e) {}
      if (done) {
        c.affection = clamp(c.affection + G.WISH_AFFECTION, 0, 100);
        d.wishes["_done_" + c.id] = (d.wishes["_done_" + c.id] || 0) + 1;
        log(`${c.name} toại tâm nguyện: ${G.wishText(c).text.toLowerCase()}.`, "harem");
        const type = w.type;
        newWish(c, false);
        if (sideRoom(report)) {
          const ev = {
            id: "sys.tam_nguyen",
            title: "Tâm nguyện thành",
            text: G.D2_TEXT.wishDone[type] || "{name} vui mừng khôn xiết.",
            choices: [
              { label: "Ở lại với nàng đêm nay", hook: "canh-viet.tam_nguyen_" + type },
              { label: "Mừng cho nàng", effects: { favor: 2 } },
            ],
          };
          const p = G.prepareEvent(ev, { speaker: c });
          if (p.choices.length) report.sideEvents.push(p);
        }
        notesTam(c);
      } else if (s.turn >= w.due) {
        newWish(c, false); // quá hạn: bốc tâm nguyện mới, không phạt
      }
    }
    for (const id of Object.keys(d.wishes)) if (!id.startsWith("_done_") && !s.consorts.find((c) => c.id === id)) delete d.wishes[id];
  });
  function notesTam(c) {
    G.addAlbum("Tâm nguyện", `${c.name} toại một tâm nguyện.`);
  }

  /* ---------------- 7 · Lịch lễ ---------------- */
  G.FESTIVALS = [
    { id: "core.tet", month: 1 },
    { id: "core.nguyen_tieu", month: 1 },
    { id: "sys.hoa_trieu", month: 2 },
    { id: "core.doan_ngo", month: 5 },
    { id: "core.that_tich", month: 7 },
    { id: "core.trung_thu", month: 8 },
    { id: "core.dong_chi", month: 11 },
  ];
  G.isFestivalMonth = () => !!G.state && G.FESTIVALS.some((f) => f.month === G.state.month);
  const festivalIds = new Set(G.FESTIVALS.map((f) => f.id));
  const eligibleD2 = G.eligibleEvents;
  G.eligibleEvents = function () {
    return eligibleD2().filter((p) => !festivalIds.has(p.ev.id)); // lễ được bảo đảm nổ riêng, không bốc ngẫu nhiên nữa
  };
  // tháng lễ: cảnh cung quy dễ nổ gấp đôi
  const queMultD2 = G.queMult;
  G.queMult = function (k) {
    let m = queMultD2(k);
    if (k === "rule" && G.isFestivalMonth()) m *= 2;
    return m;
  };
  function hoaTrieuEvent(s) {
    const top = [...s.consorts].filter((c) => c.pregnantDue == null).sort((a, b) => b.favor - a.favor).slice(0, 3);
    if (!top.length) return null;
    const ev = {
      id: "sys.hoa_trieu",
      title: "Hoa triêu",
      text: G.D2_TEXT.hoaTrieu,
      choices: top
        .map((c) => ({ label: `Cài hoa cho ${c.name}`, hook: "canh-viet.le_hoa_trieu", participants: [c.id], effects: { favorConsort: { [c.id]: 5 } }, _aff: c.id }))
        .concat([{ label: "Dạo vườn cùng cả hậu cung", effects: { hoaKhi: 3, favorAll: 1 } }]),
      onChoose: (ch, sp, notes) => {
        const c = ch._aff && G.findConsort(ch._aff);
        if (c) {
          c.affection = clamp(c.affection + 8, 0, 100);
          notes.push(`Tình cảm ${c.name} +8`);
        }
      },
    };
    return G.prepareEvent(ev, { speaker: null });
  }
  function festivalBonus(ev) {
    if (ev._d2Bonus) return;
    ev._d2Bonus = true;
    const prev = ev.onChoose;
    ev.onChoose = function (ch, sp, notes) {
      if (prev) prev(ch, sp, notes);
      const s = G.state;
      if (ev.id === "core.doan_ngo" && s.consorts.length) {
        const total = s.consorts.reduce((t, c) => t + c.favor + 10, 0);
        let r = rand() * total;
        let win = s.consorts[0];
        for (const c of s.consorts) {
          r -= c.favor + 10;
          if (r <= 0) {
            win = c;
            break;
          }
        }
        G.changeFavor(win, 5);
        G.addStat("danTam", 2);
        notes.push(G.D2_TEXT.doanNgoWin.replace("{name}", win.name), `Sủng ái ${win.name} +5`, "Dân tâm +2");
      }
      if (ev.id === "core.that_tich" && ch.hook) for (const c of G.participantsFor(ch, sp)) d2().went[c.id] = s.turn;
      if (ev.id === "core.trung_thu") {
        const kheo = s.consorts.filter((c) => c.traits.includes("Khéo tay"));
        for (const c of kheo) G.changeFavor(c, 3);
        if (kheo.length) notes.push(`Bánh của ${kheo.map((c) => c.name).join(", ")} được khen: Sủng ái +3`);
      }
    };
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    for (const f of G.FESTIVALS) {
      if (f.month !== s.month) continue;
      const key = f.id + ":" + s.year;
      if (d.festivalDone[key]) continue;
      d.festivalDone[key] = true;
      let p = null;
      if (f.id === "sys.hoa_trieu") p = s.consorts.length >= 2 ? hoaTrieuEvent(s) : null;
      else {
        let ev = R.events[f.id];
        if (!ev) continue;
        if (f.id === "core.doan_ngo" && !ev.choices.some((c) => c.hook)) {
          ev = Object.assign({}, ev, { choices: ev.choices.concat([{ label: "Đêm nay ở lại cung thắng cuộc", hook: "canh-viet.le_doan_ngo", participants: { select: "top_favor", count: 1 }, effects: { truyLac: 2 } }]) });
          R.events[f.id] = ev;
        }
        const sp = G.resolveSpeaker(ev);
        if (!sp || !G.checkWhen(ev.when, sp.speaker, ev)) continue;
        festivalBonus(ev);
        p = G.prepareEvent(ev, sp);
      }
      if (p && p.choices.length) report.sideEvents.push(p); // lễ không tính vào giới hạn chuyện phụ
    }
  });

  /* ---------------- 18 · Hành cung theo mùa ---------------- */
  G.HANH_CUNG = {
    he: { month: 6, cost: 600, take: 3, stat: "affection", hook: "canh-viet.hanh_cung_he" },
    dong: { month: 11, cost: 800, take: 3, stat: "favor", hook: "canh-viet.hanh_cung_dong" },
  };
  G.hanhCungNow = function () {
    const s = G.state;
    const id = Object.keys(G.HANH_CUNG).find((k) => G.HANH_CUNG[k].month === s.month);
    if (!id) return null;
    const H = Object.assign({ id }, G.HANH_CUNG[id], G.D2_TEXT.hanhCung[id]);
    const done = d2().hanhCung[id + ":" + s.year];
    let why = null;
    if (done) why = "Năm nay đã ngự giá rồi.";
    else if (s.stats.quocKho < H.cost && !s.godFlags.infiniteMoney) why = `Quốc khố không đủ ${H.cost} lượng.`;
    else if (s.consorts.filter((c) => c.pregnantDue == null).length < 1) why = "Không có phi nào đi được.";
    return Object.assign(H, { why });
  };
  G.goHanhCung = function (ids) {
    const s = G.state;
    const H = G.hanhCungNow();
    if (!H || H.why) return null;
    const list = ids.map((id) => G.findConsort(id)).filter((c) => c && c.pregnantDue == null).slice(0, H.take);
    if (!list.length) return null;
    G.addStat("quocKho", -H.cost);
    const d = d2();
    d.hanhCung[H.id + ":" + s.year] = true;
    const notes = [`Quốc khố −${H.cost}`];
    for (const c of list) {
      if (H.stat === "favor") G.changeFavor(c, 6);
      else c.affection = clamp(c.affection + 6, 0, 100);
      d.went[c.id] = s.turn;
    }
    notes.push(`${list.map((c) => c.name).join(", ")}: ${H.stat === "favor" ? "Sủng ái" : "Tình cảm"} +6`);
    const left = s.consorts.filter((c) => !list.includes(c));
    for (const c of left) c.affection = clamp(c.affection - 2, 0, 100);
    if (left.length) notes.push("Phi ở lại: Tình cảm −2");
    // ba người cùng một phe: các phe khác dỗi
    const fac = list.map((c) => factionOf(c.id));
    if (list.length >= 2 && fac[0] && fac.every((f) => f === fac[0])) {
      for (const c of left) if (factionOf(c.id) && factionOf(c.id) !== fac[0]) c.affection = clamp(c.affection - 2, 0, 100);
      notes.push("Các phe khác dỗi: Tình cảm −2");
    }
    log(`Ngự giá ${H.name} cùng ${list.map((c) => c.name).join(", ")}.`, "milestone");
    G.addAlbum(H.name, `Bệ hạ ngự giá ${H.name} cùng ${list.map((c) => c.name).join(", ")}.`);
    const scene = G.runHook(H.hook, { participants: list, fetish: [], place: H.id });
    if (!scene.blocked) G.spendNight(list, { silentLog: true });
    scene.notes = notes;
    return scene;
  };

  /* ---------------- 28 · Lễ sắc phong ---------------- */
  G.SAC_PHONG_COST = { 4: 300, 5: 600, 6: 1000, 7: 2000 };
  const SAC_HOOK = { 4: "canh-viet.sac_phong_phi", 5: "canh-viet.sac_phong_quy_phi", 6: "canh-viet.sac_phong_hoang_quy_phi", 7: "canh-viet.sac_phong_hoang_hau" };
  let sacBypass = false;
  G.promoteGate = function (c, target) {
    const s = G.state;
    if (sacBypass || !s || target < 4 || target <= c.rank) return target;
    const next = Math.max(4, c.rank + 1);
    const d = d2(s);
    if (!d.sacQueue.some((q) => q.id === c.id)) d.sacQueue.push({ id: c.id, rank: next });
    return Math.max(c.rank, Math.min(target, 3));
  };
  function sacEvent(c, rank) {
    const cost = G.SAC_PHONG_COST[rank];
    const ev = {
      id: "sys.sac_phong",
      title: "Lễ sắc phong · " + G.RANKS[rank],
      text: fillVars(G.D2_TEXT.sacPhong, { rank: G.RANKS[rank], cost }),
      choices: [
        { label: "Cử hành đại lễ", cost, hook: SAC_HOOK[rank], effects: { favor: 5, danTam: 1, hoaKhi: 1 }, _sac: rank },
        { label: "Lễ giản dị", cost: Math.round(cost / 2), hook: SAC_HOOK[rank], effects: { favor: 2 }, _sac: rank },
        { label: "Hoãn lại", effects: {} },
      ],
      onChoose: (ch) => {
        if (!ch._sac) return;
        const live = G.findConsort(c.id);
        if (!live) return;
        sacBypass = true;
        try {
          G.promote(live, ch._sac);
        } finally {
          sacBypass = false;
        }
        const d = d2();
        d.sacQueue = d.sacQueue.filter((q) => q.id !== c.id);
        G.addAlbum("Lễ sắc phong", `${live.name} nhận kim sách, lên ${G.RANKS[live.rank]}.`);
        G.checkPromotion(live); // đủ điều kiện phẩm cao hơn thì xếp lễ tiếp theo
      },
    };
    return G.prepareEvent(ev, { speaker: c });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    d.sacQueue = d.sacQueue.filter((q) => {
      const c = G.findConsort(q.id);
      return c && c.rank < q.rank;
    });
    for (const q of d.sacQueue) {
      if (!sideRoom(report)) break;
      if (d.sacAsked[q.id] != null && s.turn - d.sacAsked[q.id] < 6) continue;
      const c = G.findConsort(q.id);
      d.sacAsked[q.id] = s.turn;
      const p = sacEvent(c, q.rank);
      if (p.choices.length) report.sideEvents.push(p);
    }
  });
  /** Lý do chưa lập được Hoàng hậu, hoặc null. */
  G.crownBlock = function (c) {
    const s = G.state;
    if (s.consorts.some((x) => x.rank === 7)) return "Đã có Hoàng hậu.";
    if (c.favor < 70) return "Cần Sủng ái từ 70.";
    const mine = factionOf(c.id);
    const st = d2().phe.strength;
    const mineSt = mine ? st[mine] || 0 : c.favor;
    const rival = Object.entries(st).find(([lid, v]) => lid !== mine && v > mineSt);
    if (rival) {
      const L = G.findConsort(rival[0]);
      return `Phe ${L ? L.name : ""} đang mạnh hơn, lập hậu lúc này hậu cung không phục.`;
    }
    return null;
  };
  G.crownEvent = function (id) {
    const c = G.findConsort(id);
    if (!c || G.crownBlock(c)) return null;
    const cost = G.SAC_PHONG_COST[7];
    const ev = {
      id: "sys.lap_hau",
      title: "Lễ lập hậu",
      text: fillVars(G.D2_TEXT.lapHau, { cost }),
      choices: [
        { label: "Cử hành lễ lập hậu", cost, hook: SAC_HOOK[7], effects: { danTam: 5 }, _crown: true },
        { label: "Để sau", effects: {} },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._crown) return;
        const live = G.findConsort(c.id);
        if (!live || !G.crownEmpress(live.id)) return;
        const d = d2();
        const lead = factionOf(live.id);
        if (lead) {
          d.queenLeader = lead;
          d.sulkUntil = G.state.turn + 12;
          d.sulkLeader = lead;
          for (const o of G.state.consorts) if (factionOf(o.id) && factionOf(o.id) !== lead) o.affection = clamp(o.affection - 3, 0, 100);
          notes.push("Phe của tân Hoàng hậu mạnh thêm 10%; các phe khác dỗi một năm");
        }
      },
    };
    return G.prepareEvent(ev, { speaker: c });
  };

  /* ---------------- 3 · Phe phái ---------------- */
  G.PHE_MAX = 3;
  G.PHE_MIN_RANK = 3; // Tần trở lên
  G.PHE_MIN_TINHY = 10;
  function factionOf(id) {
    const s = G.state;
    if (!s || !s.d2) return null;
    const p = s.d2.phe;
    if (p.leaders.includes(id)) return id;
    return p.members[id] || null;
  }
  G.factionOf = factionOf;
  function computeFactions(s) {
    const d = d2(s);
    const p = d.phe;
    const ok = (c) => c && c.rank >= G.PHE_MIN_RANK;
    let leaders = p.leaders.filter((id) => ok(G.findConsort(id)));
    const cand = s.consorts.filter((c) => ok(c) && !leaders.includes(c.id)).sort((a, b) => b.favor - a.favor);
    while (leaders.length < G.PHE_MAX && cand.length) leaders.push(cand.shift().id);
    if (leaders.length < 2) leaders = []; // một người thì chưa thành phe
    const members = {};
    for (const c of s.consorts) {
      if (leaders.includes(c.id)) continue;
      let best = null;
      let bv = G.PHE_MIN_TINHY - 0.01;
      for (const l of leaders) {
        const v = G.getTinhY(c.id, l);
        if (v > bv) {
          bv = v;
          best = l;
        }
      }
      if (best) members[c.id] = best;
    }
    const strength = {};
    for (const l of leaders) {
      const L = G.findConsort(l);
      let v = L.favor + s.consorts.filter((c) => members[c.id] === l).reduce((t, c) => t + c.favor, 0);
      if (d.queenLeader === l) v *= 1.1;
      strength[l] = Math.round(v);
    }
    d.phe = { leaders, members, strength };
    return d.phe;
  }
  G.computeFactions = () => computeFactions(G.state);
  G.factionList = function () {
    const s = G.state;
    const p = (s.d2 && s.d2.phe) || { leaders: [] };
    return p.leaders
      .map((l) => ({ leader: G.findConsort(l), members: s.consorts.filter((c) => p.members[c.id] === l), strength: p.strength[l] || 0 }))
      .filter((f) => f.leader)
      .sort((a, b) => b.strength - a.strength);
  };
  const pheMembers = (l) => G.state.consorts.filter((c) => c.id === l || d2().phe.members[c.id] === l);
  function pheEvent(s, imbalanced) {
    const list = G.factionList();
    if (list.length < 2) return null;
    const [A, B] = shuffle(list).slice(0, 2);
    const weak = list[list.length - 1];
    const strong = list[0];
    // phe yếu xin sáp nhập
    if (imbalanced && rand() < 0.35 && weak.leader.id !== strong.leader.id) {
      const ev = {
        id: "sys.phe_sap_nhap",
        title: "Phe yếu xin hợp lại",
        text: G.D2_TEXT.pheMerge,
        choices: [
          { label: "Chấp thuận cho hai phe hợp lại", effects: { hoaKhi: 3 }, _merge: true },
          { label: "Giữ nguyên như cũ", effects: {} },
        ],
        onChoose: (ch, sp, notes) => {
          if (!ch._merge) return;
          for (const c of pheMembers(weak.leader.id)) G.addTinhY(c.id, strong.leader.id, 25);
          const d = d2();
          d.phe.leaders = d.phe.leaders.filter((l) => l !== weak.leader.id);
          computeFactions(G.state);
          notes.push(`Phe ${weak.leader.name} nhập vào phe ${strong.leader.name}`);
        },
      };
      return G.prepareEvent(ev, { speaker: strong.leader, speaker2: weak.leader });
    }
    const T = pick(G.D2_TEXT.phe);
    const ev = {
      id: "sys.phe",
      title: "Chuyện hai phe",
      text: T.text.replace(/\{phe1\}/g, "{name}").replace(/\{phe2\}/g, "{name2}"),
      choices: [
        { label: `Đứng về phía ${A.leader.name}`, _side: [A.leader.id, B.leader.id] },
        { label: `Đứng về phía ${B.leader.name}`, _side: [B.leader.id, A.leader.id] },
        { label: "Phân xử công bằng, ban thưởng cả hai bên", cost: 200, effects: { hoaKhi: 3 } },
      ],
      onChoose: (ch, sp, notes) => {
        if (!ch._side) return;
        const [win, lose] = ch._side;
        for (const c of pheMembers(win)) G.changeFavor(c, 3);
        for (const c of pheMembers(lose)) c.affection = clamp(c.affection - 2, 0, 100);
        notes.push(`Phe ${G.findConsort(win).name}: Sủng ái +3`, `Phe ${G.findConsort(lose).name}: Tình cảm −2`);
      },
    };
    return G.prepareEvent(ev, { speaker: A.leader, speaker2: B.leader });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    computeFactions(s);
    const list = G.factionList();
    let imbalanced = false;
    if (list.length >= 2 && list[0].strength > 2 * list[list.length - 1].strength) {
      imbalanced = true;
      G.addStat("hoaKhi", -1);
    }
    // dỗi: mỗi 4 tháng Tình cảm −1 (giữ số nguyên để khớp với số hiện trên thanh)
    if (d.sulkUntil >= s.turn && s.turn % 4 === 0) for (const c of s.consorts) if (factionOf(c.id) && factionOf(c.id) !== d.sulkLeader) c.affection = clamp(c.affection - 1, 0, 100);
    for (const c of s.consorts) if (c.affection !== Math.round(c.affection)) c.affection = Math.round(c.affection); // sửa bản lưu đã có số lẻ
    if (list.length < 2 || !sideRoom(report) || s.turn - d.pheTurn < 3) return;
    if (rand() >= 0.25 * (imbalanced ? 1.5 : 1) * (d.sulkUntil >= s.turn ? 1.5 : 1)) return;
    const p = pheEvent(s, imbalanced);
    if (p && p.choices.length) {
      d.pheTurn = s.turn;
      report.sideEvents.push(p);
    }
  });

  /* ---------------- 15 · Tin đồn trong cung ---------------- */
  G.RUMOR_CHANCE = 0.35;
  G.RUMOR_COST = 100;
  function rumorEvent(s) {
    if (s.consorts.length < 3) return null;
    const a = pick(s.consorts);
    const fa = factionOf(a.id);
    let pool = s.consorts.filter((c) => c.id !== a.id);
    const rivals = fa ? pool.filter((c) => factionOf(c.id) && factionOf(c.id) !== fa) : [];
    const b = pick(rivals.length && rand() < 0.7 ? rivals : pool);
    const tIdx = Math.floor(rand() * G.D2_TEXT.rumors.length);
    const truth = rand() < 0.5 + (b.traits.includes("Kiêu kỳ") ? 0.15 : 0);
    const T = G.D2_TEXT.rumors[tIdx];
    const ev = {
      id: "sys.tin_don",
      title: "Tin đồn trong cung",
      text: T.intro,
      choices: [
        { label: "Cho người điều tra, một tháng sau rõ", cost: G.RUMOR_COST, _act: "check" },
        { label: "Bỏ qua", _act: "ignore" },
        { label: "Xử ngay theo tin (quở trách, cắt bổng)", _act: "act" },
      ],
      onChoose: (ch, sp, notes) => {
        const A = G.findConsort(a.id);
        const B = G.findConsort(b.id);
        if (ch._act === "check") {
          d2().rumorPending = { a: a.id, b: b.id, truth, t: tIdx, turn: G.state.turn };
          ch.result = "Kính Sự phòng nhận lệnh điều tra. Tháng sau sẽ có kết quả.";
        } else if (ch._act === "ignore") {
          if (truth) {
            G.addStat("hoaKhi", -2);
            notes.push("Hòa khí −2");
          }
          ch.result = G.fill(truth ? G.D2_TEXT.rumorIgnoreTrue : G.D2_TEXT.rumorIgnoreFalse, sp);
        } else {
          if (truth) {
            G.addStat("hoaKhi", 2);
            notes.push("Hòa khí +2");
            ch.result = G.fill(T.yes + "\n" + G.D2_TEXT.rumorAct, sp);
          } else {
            if (A) A.affection = clamp(A.affection - 10, 0, 100);
            if (B) G.changeFavor(B, 3);
            notes.push(`Tình cảm ${a.name} −10`, `Sủng ái ${b.name} +3`);
            ch.result = G.fill(T.no + "\n" + G.D2_TEXT.rumorFalse, sp);
          }
        }
      },
    };
    return G.prepareEvent(ev, { speaker: a, speaker2: b });
  }
  function rumorResult(s, r) {
    const a = G.findConsort(r.a);
    const b = G.findConsort(r.b);
    if (!a || !b) return null;
    const T = G.D2_TEXT.rumors[r.t] || G.D2_TEXT.rumors[0];
    const ev = {
      id: "sys.tin_don_ket_qua",
      title: "Kết quả điều tra",
      text: T[r.truth ? "yes" : "no"],
      choices: r.truth ? [{ label: "Xử đúng người, khuyên nàng xin lỗi các tỷ muội", effects: { hoaKhi: 3 } }] : [{ label: "Minh oan cho nàng", effects: { affection: 5 } }],
    };
    return G.prepareEvent(ev, { speaker: a, speaker2: b });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    if (d.rumorPending && s.turn > d.rumorPending.turn) {
      const p = rumorResult(s, d.rumorPending);
      d.rumorPending = null;
      if (p) report.sideEvents.push(p); // kết quả điều tra luôn báo
    }
    if (!sideRoom(report) || s.turn - d.rumorTurn < 2 || d.rumorPending) return;
    if (rand() >= G.RUMOR_CHANCE * G.queMult("rumor")) return;
    const p = rumorEvent(s);
    if (p && p.choices.length) {
      d.rumorTurn = s.turn;
      report.sideEvents.push(p);
    }
  });

  /* ---------------- 17 · Hòa thân ---------------- */
  G.HOA_THAN_EVERY = 2; // năm
  G.HOA_THAN_MONTH = 10;
  G.HOA_THAN_REFUSE_COST = 800;
  G.HOA_THAN_DOWRY = 1500;
  G.regionCost = function (r) {
    const s = G.state;
    const pen = s && s.d2 && s.d2.travelPenalty[r.id];
    return pen && s.year <= pen ? r.cost * 2 : r.cost;
  };
  function princessPool(s) {
    const d = d2(s);
    const inHarem = new Set(s.consorts.map((c) => c.id).concat(s.former.map((c) => c.id)));
    return Object.values(R.characters).filter((c) => c.princess && !inHarem.has(c.id) && !d.princessUsed.includes(c.id) && c.age >= G.MIN_AGE);
  }
  function hoaThanEvent(s) {
    const pool = shuffle(princessPool(s));
    let picks = pool.slice(0, rand() < 0.4 ? 3 : 2);
    if (picks.length < 2) {
      // hết công chúa viết sẵn: tạo ngẫu nhiên
      while (picks.length < 2) {
        const def = G.makeRecruit("Công chúa nước láng giềng");
        def.princess = true;
        def.rank = 2;
        def.portraitText = "Tranh vẽ nàng đứng dưới gốc mai, áo lụa buông lơi.";
        picks.push(def);
      }
    }
    const region = (picks[0].princessFrom && R.regions[picks[0].princessFrom]) || pick(Object.values(R.regions));
    const regionName = picks[0].princessLand || (region ? region.name : "nước láng giềng");
    const list = picks.map((p, i) => `Tranh ${i + 1}: ${p.name}, ${p.age} tuổi. ${p.portraitText || ""}`).join("\n");
    const cond = rand() < 0.5 ? "thue" : "cung";
    const condText = fillVars(G.D2_TEXT.hoaThanCond[cond], { region: regionName });
    const choices = [];
    for (const p of picks) {
      choices.push({ label: `Chọn ${p.name}, phong Quý nhân`, _pick: p.id, _rank: 2 });
      choices.push({ label: `Chọn ${p.name}, phong Tần`, _pick: p.id, _rank: 3 });
    }
    choices.push({ label: "Từ chối khéo, tặng lễ vật", cost: G.HOA_THAN_REFUSE_COST, _refuse: "soft" });
    choices.push({ label: "Từ chối thẳng", _refuse: "hard" });
    const ev = {
      id: "sys.hoa_than",
      title: "Sứ xin hòa thân",
      text: fillVars(G.D2_TEXT.hoaThan, { region: regionName, n: picks.length }) + "\n" + list + "\n" + condText,
      choices,
      onChoose: (ch, sp, notes) => {
        const st = G.state;
        const d = d2();
        for (const p of picks) d.princessUsed.push(p.id);
        if (ch._refuse === "hard") {
          G.addStat("danTam", -5);
          if (region) d.travelPenalty[region.id] = st.year + 2;
          notes.push("Dân tâm −5", region ? `Hai năm tới tuần du ${region.name} đắt gấp đôi` : "");
          return;
        }
        if (ch._refuse) return;
        const c = G.addConsort(ch._pick, true);
        if (!c) return;
        c.rank = ch._rank;
        G.addStat("quocKho", G.HOA_THAN_DOWRY);
        G.addStat("danTam", ch._rank >= 3 ? 5 : 3);
        notes.push(`${c.name} nhập cung, phong ${G.RANKS[c.rank]}`, `Hồi môn +${G.HOA_THAN_DOWRY}`, `Dân tâm +${ch._rank >= 3 ? 5 : 3}`);
        if (ch._rank >= 3) {
          G.addStat("hoaKhi", -5);
          notes.push("Phi cũ bất bình: Hòa khí −5");
        }
        if (cond === "thue") {
          d.taxCutUntil = st.turn + 24;
          notes.push("Giảm thuế hai năm: Quốc khố −100/tháng");
        } else {
          G.addStat("quocKho", -1000);
          c.palace = Math.min(3, (c.palace || 0) + 1);
          notes.push("Xây cung riêng: Quốc khố −1000");
        }
        log(`Hòa thân: ${c.name} nhập cung, phong ${G.RANKS[c.rank]}.`, "milestone");
        G.addAlbum("Hòa thân", `${c.name} từ ${regionName} sang, nhập cung.`);
      },
    };
    return G.prepareEvent(ev, { speaker: null });
  }
  monthly((s, report) => {
    if (s.ended) return;
    const d = d2(s);
    if (d.taxCutUntil >= s.turn) G.addStat("quocKho", -100);
    const q = G.currentQue && G.currentQue();
    const due = s.year % G.HOA_THAN_EVERY === 0 || (q && q.id === "vien_khach");
    if (!due || s.month !== G.HOA_THAN_MONTH || d.hoaThanYear === s.year || s.year < 2) return;
    d.hoaThanYear = s.year;
    const p = hoaThanEvent(s);
    if (p && p.choices.length) report.sideEvents.push(p); // sứ thần luôn được tiếp
  });

  /* ---------------- Quẻ mới (đợt 3) ---------------- */
  G.QUE.push(
    { id: "vien_khach", name: "Viễn khách", desc: "Năm nay chắc chắn có sứ xin hòa thân.", mult: {} },
    { id: "ghen_tuong", name: "Ghen tuông", bad: true, desc: "Tin đồn nhiều gấp đôi, Hòa khí −1 mỗi quý.", mult: { rumor: 2 } },
    { id: "hoa_hop", name: "Hòa hợp", desc: "Tin đồn ít đi một nửa, Hòa khí +1 mỗi quý.", mult: { rumor: 0.5 } }
  );
  Object.assign(G.D1_TEXT.que, {
    vien_khach: "Sao Bắc Đẩu chiếu thẳng xuống phương Nam, sứ giả phương xa mang theo công chúa còn nguyên vẹn xin hòa thân. Năm nay sẽ có lồn ngoại quốc đến cung, để hoàng thượng phá trinh và đụ no cặc.",
    ghen_tuong: "Mây đen che khuất trăng, gió lạnh thổi qua hậu cung khiến các phi ghen tuông điên đảo. Tin đồn về ai được đụ nhiều hơn lan truyền, lồn các nàng ngứa ngáy vì hiềm khích.",
    hoa_hop: "Trăng rằm soi sáng, gió xuân hòa dịu thổi qua cung. Hậu cung êm ấm, các phi vui vẻ cùng hầu hạ, ít cãi vã vì đêm nào cũng được bệ hạ bú liếm và xuất tinh no nê.",
  });
  monthly((s) => {
    const q = G.currentQue();
    if (!q || s.month % 3 !== 0) return;
    if (q.id === "ghen_tuong") G.addStat("hoaKhi", -1);
    if (q.id === "hoa_hop") G.addStat("hoaKhi", 1);
  });
})();
