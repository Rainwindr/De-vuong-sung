/*
 * Cảnh mặc định của gói lõi. Chỉ ở mức gợi, rồi chuyển cảnh.
 * Gói bên thứ ba muốn thay cảnh nào thì đăng ký lại đúng id đó (gói nạp sau ghi đè gói nạp trước),
 * hoặc đăng ký id có dấu * để bắt cả nhóm, ví dụ "core.thi_*" cho mọi cuộc thi.
 */
(function (Game) {
  "use strict";
  const PACK = "core";
  const reg = (id, fn) => Game.hooks.register(id, fn, PACK);
  const names = (ctx) => ctx.participants.map((p) => p.name);
  const list = (arr) => (arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " và " + arr[arr.length - 1]);
  const first = (ctx) => (ctx.participants[0] || { name: "mỹ nhân" }).name;
  const fname = (id) => (Game.registry.fetishes[id] || {}).name || id;
  const pickOne = (arr, seed) => arr[seed != null ? Math.abs(seed) % arr.length : Math.floor(Math.random() * arr.length)];
  // Câu chuyển cảnh, đổi ngẫu nhiên để không lặp
  const VEILS = [
    "Rèm lụa buông xuống.",
    "Nến đỏ được thổi tắt từng ngọn.",
    "Thái giám khép cửa, lui ra thật xa.",
    "Gió đêm lùa qua rèm, rồi cũng thôi.",
    "Trăng trốn sau mái ngói lưu ly.",
    "Tiếng trống canh ba vọng lại từ xa.",
    "Hương trầm cháy hết một nén, rồi một nén nữa.",
    "Bên ngoài, tuyết rơi lặng lẽ trên thềm ngọc.",
  ];
  const V = () => "\n" + pickOne(VEILS);

  /* ---- Bắt cả nhóm: mọi HOOK "core.*" chưa có cảnh riêng ---- */
  reg("core.*", (ctx) => {
    const many = ctx.participants.length > 1;
    const opens = many
      ? [`Đèn được vặn nhỏ. ${list(names(ctx))} cùng ở lại bên bệ hạ đêm nay.`, `${list(names(ctx))} nhìn nhau cười rồi cùng bước vào.`, `Đêm nay không chỉ một người: ${list(names(ctx))}.`]
      : [`Đèn được vặn nhỏ. ${first(ctx)} ở lại bên bệ hạ đêm nay.`, `${first(ctx)} khẽ khàng khép cửa.`, `Chỉ còn bệ hạ và ${first(ctx)}.`];
    return {
      title: many ? `Đêm ở hậu cung · ${ctx.participants.length} người` : `Đêm ở hậu cung · ${first(ctx)}`,
      text: `${pickOne(opens)}${ctx.fetish.length ? ` Theo ý bệ hạ: ${ctx.fetish.map(fname).join(", ")}.` : ""}${ctx.count > 3 ? " Không phải lần đầu, nhưng vẫn như lần đầu." : ""}${V()}`,
    };
  });

  /* ---- Lật thẻ ---- */
  const MO_DAU = [
    (n) => `Thái giám lật thẻ bài khắc tên ${n}. Đèn ở Dưỡng Tâm điện được vặn nhỏ.`,
    (n) => `Kiệu phượng đưa ${n} đến Dưỡng Tâm điện khi trống vừa điểm canh một.`,
    (n) => `Bệ hạ không đợi kiệu, tự đi bộ sang cung của ${n}.`,
    (n) => `${n} đã tắm gội hương hoa từ chiều, ngồi đợi bên ngọn đèn duy nhất còn sáng.`,
  ];
  const THOAI = {
    dau: ["Thiếp… thiếp chưa biết phải làm gì.", "Bệ hạ, xin người dịu dàng với thiếp.", "Đêm nay thiếp sẽ nhớ cả đời."],
    quen: ["Bệ hạ… đêm nay là của thiếp.", "Thiếp đã nhớ bệ hạ cả tuần.", "Người đến rồi, thiếp không đợi uổng."],
    lau: ["Bao nhiêu năm rồi mà thiếp vẫn hồi hộp.", "Bệ hạ vẫn nhớ thiếp thích gì.", "Ở bên người, thiếp chẳng cần gì khác."],
  };
  reg("core.thi_tam", (ctx) => {
    const p = ctx.participants[0];
    const bucket = p.nights === 0 ? "dau" : p.nights > 20 ? "lau" : "quen";
    return { title: `Thị tẩm · ${p.name}`, text: `${pickOne(MO_DAU)(p.name)}\n> ${pickOne(THOAI[bucket])}${V()}` };
  });
  reg("core.thi_tam_so_thich", (ctx) => {
    const p = ctx.participants[0];
    const fs = ctx.fetish.map(fname).join(", ");
    const lines = [
      `Đêm nay theo ý bệ hạ: ${fs}. ${p.name} đã chuẩn bị từ chiều, mặt ửng hồng khi thái giám lui ra.`,
      `${p.name} nghe ý chỉ, chỉ khẽ cười: ${fs}, thiếp nhớ rồi.`,
      `${p.name} sai cung nữ bày biện suốt buổi chiều cho đúng ý bệ hạ: ${fs}.`,
    ];
    const lvl = Math.max(0, ...ctx.fetish.map((f) => ctx.fetishLevels[f] || 0));
    const extra = lvl >= 80 ? "\nBệ hạ đã quen thú vui này đến mức không đợi được nữa." : lvl <= 10 ? "\nLần đầu thử, cả hai đều hơi ngượng." : "";
    return { title: `Thị tẩm · ${p.name}`, text: `${pickOne(lines)}${extra}${V()}` };
  });

  /* ---- Combo ---- */
  const combo = (title, line) => (ctx) => ({ title: `${title} · ${first(ctx)}`, text: `${line.replace("{n}", first(ctx))}${V()}` });
  reg("core.combo_ho_ruou", combo("Đêm Hồ Rượu", "Hồ tắm được đổ đầy rượu ấm thay nước. {n} rót từng chén, uống từng ngụm."));
  reg("core.combo_kich", combo("Kịch Vương Triều", "{n} thay hết bộ y phục này đến bộ khác, mỗi bộ một vai, mỗi vai một câu chuyện."));
  reg("core.combo_huong_toi", combo("Hương Trong Bóng Tối", "Đèn tắt hết. Chỉ còn mùi hương của {n} và tiếng nàng thì thầm bên tai."));
  reg("core.combo_lua_do", combo("Lụa Đỏ Quyền Uy", "Dải lụa đỏ và một ám hiệu dừng đã thỏa thuận trước. Đêm nay {n} nắm quyền."));
  reg("core.combo_tram_mau", combo("Hội Trăm Màu", "{n} đeo đầy châu ngọc, bước ra giữa vòng các phi tần đang ngồi xem."));

  /* ---- Chương 1 ---- */
  reg("core.da_yen_thi_tam", (ctx) => ({ title: "Chén rượu đầu tiên", text: `${first(ctx)} dìu bệ hạ rời yến tiệc, tà áo đỏ quét qua bậc thềm ngọc.\n> Thiếp đã nói rồi, đêm nay là đêm của người.\nCửa điện khép lại.` }));
  reg("core.tiem_huong", () => ({ title: "Tiệm hương Hồ thị", text: "Hồ Mị Nương đóng cửa tiệm, mở từng lọ hương cho bệ hạ ngửi. Đến lọ thứ mười, bệ hạ không còn nhớ mình đến đây làm gì.\n> Lọ cuối cùng, thiếp xức lên người." }));
  reg("core.den_long_dem", () => ({ title: "Đêm hội đèn lồng", text: "Mặt nạ hồ ly rơi xuống. Hồ Mị Nương kéo bệ hạ vào con hẻm sau tiệm hương, nơi mùi trầm và mùi hoa quyện vào nhau.\n> Công tử thắng rồi. Phần thưởng là ta." }));
  reg("core.tu_lan_dem_dau", () => ({ title: "Thuyền hoa Tần Hoài", text: "Tiếng đàn ngừng giữa chừng. Tử Lan vén rèm, mắt cười.\n> Đoạn cuối câu chuyện, thiếp kể bằng cách khác.\nĐèn thuyền hoa tắt dần trên mặt sông." }));
  reg("core.uyen_nghi_sa_nga", () => ({ title: "Phượng hoàng sa ngã", text: "Lục Uyển Nghi nhìn bệ hạ rất lâu, rồi tự tay tháo mũ phượng đặt xuống.\n> Nếu bệ hạ đã chọn đường này, thiếp đi cùng.\nĐêm ấy, nàng không còn là người của ngày hôm qua." }));
  reg("core.me_lau", (ctx) => ({ title: "Lạc trong Mê Lâu", text: `Hành lang nối hành lang, rèm nối rèm. Tiếng cười của ${list(names(ctx))} lúc gần lúc xa.\n> Bệ hạ cứ lạc đường đi. Chúng thiếp sẽ tìm thấy người.\nBa ngày sau, bệ hạ mới bước ra.` }));

  /* ---- Chương 2 ---- */
  reg("core.song_phi", () => ({ title: "Hai mà một", text: "Hai chị em giống nhau như hai giọt nước, chỉ khác nhau ở nụ cười.\n> Bệ hạ đoán đi, ai là chị?" + V() }));
  reg("core.song_phi_rieng", (ctx) => ({ title: `Riêng ${first(ctx)}`, text: `Lần đầu tiên chỉ có một mình ${first(ctx)}. Nàng ngập ngừng, rồi cười.\n> Không có chị, thiếp hơi lạ.${V()}` }));
  reg("core.xe_de", (ctx) => ({ title: "Dê dừng trước cửa", text: `Con dê đi một vòng, rồi dừng trước cửa cung của ${first(ctx)}. Bên thềm còn mấy hạt muối trắng.\n> Thiếp không biết gì đâu nhé.` }));
  reg("core.bach_hoa", (ctx) => ({ title: `Đêm Bách Hoa · ${ctx.participants.length} người`, text: `Vườn hoa trong điện thắp ${ctx.participants.length * 3} ngọn nến. ${list(names(ctx))}, mỗi người một màu lụa, xếp thành vòng.\n> Đêm nay vườn hoa nở cùng lúc.${V()}` }));
  reg("core.duc_tri", (ctx) => ({ title: "Dục Trì Thiên Hương", text: `Hơi nước nghi ngút, cánh hoa trôi trên mặt hồ. ${first(ctx)} té nước vào bệ hạ rồi lặn mất.${V()}` }));
  reg("core.duc_tri_tap_the", (ctx) => ({ title: `Dục Trì · ${ctx.participants.length} người`, text: `Cửa hồ mở. ${list(names(ctx))} lần lượt bước xuống làn nước ấm, tiếng cười vang khắp điện.${V()}` }));
  const kich = { thich_khach: "nữ thích khách", thon_nu: "thôn nữ hái dâu", nu_tuong: "nữ tướng bại trận", dao_vai: "chủ nhân, còn bệ hạ là nô bộc" };
  reg("core.nhap_vai_*", (ctx) => ({ title: "Hí kịch cung đình", text: `Đêm nay ${first(ctx)} là ${kich[ctx.extra.kichBan] || "một người khác"}. Nàng nhập vai đến mức bệ hạ suýt quên nàng là ai.${V()}` }));
  reg("core.lua_do_a", (ctx) => ({ title: "Dải lụa đỏ", text: `Bệ hạ cầm dải lụa. ${first(ctx)} đưa tay ra, nói khẽ ám hiệu dừng cho bệ hạ nhớ.${V()}` }));
  reg("core.lua_do_b", (ctx) => ({ title: "Dải lụa đỏ", text: `${first(ctx)} cầm dải lụa, cười.\n> Bệ hạ nhớ ám hiệu chứ? Đêm nay thiếp làm chủ.${V()}` }));
  reg("core.ty_thi_*", (ctx) => ({ title: "Phần thưởng của người thắng", text: `${list(names(ctx))} thở hổn hển sau điệu múa, mắt vẫn còn tia lửa tranh đua.${V()}` }));
  reg("core.bit_mat_bat_de", (ctx) => ({ title: "Bịt mắt bắt dê", text: `Bệ hạ chộp được một bàn tay mềm. Mùi hương này… ${first(ctx)}! Cả điện vỗ tay.` }));
  reg("core.bit_mat_o_lai", (ctx) => ({ title: "Người bị bắt", text: `Người bị bắt là ${first(ctx)}. Theo luật chơi, nàng ở lại, còn những người khác cười khúc khích lui ra.${V()}` }));
  reg("core.bit_mat_hai", (ctx) => ({ title: "Bắt được hai người", text: `Hai tay, hai người: ${list(names(ctx))}. Không ai chịu thả ai.${V()}` }));
  reg("core.thuyen_hoa", (ctx) => ({ title: "Thuyền hoa Thái Dịch", text: `Thuyền trôi giữa hồ sen. ${list(names(ctx))} rót rượu, gảy đàn, rèm buông bốn phía.${V()}` }));
  reg("core.thuyen_hoa_ba_ngay", (ctx) => ({ title: "Ba ngày trên hồ", text: `Thuyền không cập bến ba ngày. ${list(names(ctx))} thay nhau chèo, thay nhau hát.${V()}` }));
  reg("core.hoang_hau_yen", (ctx) => ({ title: "Bất ngờ của Uyển Nghi", text: `Lục Uyển Nghi tự tay sắp xếp mọi thứ theo đúng sở thích của bệ hạ. ${list(names(ctx).filter((n) => n !== "Lục Uyển Nghi"))} đã đợi sẵn.${V()}` }));
  reg("core.cuu_phi_chin_dem", (ctx) => ({ title: "Chín đêm, chín màu", text: `Chín đêm liền, mỗi đêm một màu lụa: ${list(names(ctx))}. Đến đêm thứ chín, bệ hạ không còn phân biệt ngày đêm.` }));
  reg("core.cuu_phi_mot_dem", (ctx) => ({ title: "Cửu Phi Lệnh", text: `Chín dải lụa chín màu xếp vòng quanh long sàng: ${list(names(ctx))}.${V()}` }));
  reg("core.tuyen_sung", (ctx) => ({ title: "Tuyển sủng", text: `Những phi tần chưa từng được thị tẩm lần lượt trình diễn. Người bệ hạ chọn là ${first(ctx)}. Nàng run rẩy nhận thẻ bài.${V()}` }));

  /* ---- Vô đạo ---- */
  reg("core.tuu_tri_hoi", (ctx) => ({ title: "Tửu Trì Hội", text: `Hồ rượu sóng sánh dưới ánh đuốc. ${list(names(ctx))} đùa giỡn quanh hồ suốt ba ngày ba đêm.${V()}` }));
  reg("core.ngu_hoa", (ctx) => ({ title: "Ngũ Hoa", text: `Năm đóa hoa của bệ hạ: ${list(names(ctx))}. Từ đêm nay, các nàng chỉ đến cùng nhau.${V()}` }));

  /* ---- Cốt truyện riêng ---- */
  reg("core.uyen_nghi_ngay_tu_do", () => ({ title: "Một ngày tự do", text: "Hai người cải trang, ăn kẹo hồ lô ở chợ phía Đông, xem múa rối, cãi nhau vì giá một cái quạt. Tối về, Uyển Nghi ngủ gục trên vai bệ hạ trong kiệu." }));
  reg("core.moc_can_tuong_thanh", () => ({ title: "Diều giấy", text: "Chiếc diều cũ bay lên, giấy vàng rung trong gió. Mộc Cẩn nắm dây diều, tay kia nắm tay bệ hạ, như năm tám tuổi." }));
  reg("core.tuyet_lua_trai", () => ({ title: "Lửa trại", text: "Tuyết kéo bệ hạ vào vòng múa, rồi kéo ra khỏi vòng, chạy về phía lều thảo nguyên dựng trong ngự uyển." + V() }));
  reg("core.nhu_yen_vu_rieng", () => ({ title: "Điệu múa riêng", text: "Chỉ một ngọn đèn. Như Yên múa trong vầng sáng nhỏ, tà áo lướt qua mặt bệ hạ." + V() }));
  reg("core.mi_nuong_huong_moi", () => ({ title: "Mộng Hồ", text: "Mùi hương lan ra. Mọi thứ mờ đi như trong mơ, chỉ còn nụ cười của Mị Nương rõ nét.\n> Hình như thiếp chế thành công rồi." + V() }));
  reg("core.huong_mua", () => ({ title: "Hương và múa", text: "Mỗi bước múa của Như Yên làm hương của Mị Nương tỏa ra một lớp. Đến cuối điệu múa, cả điện đã say hương." + V() }));
  reg("core.dai_kich_hau_cung", () => ({ title: "Vở kịch cung đình", text: "Tử Lan dẫn truyện, Thanh Ca đàn, Như Yên múa. Vở kịch kể về một hoàng đế và ba nàng tiên. Hết màn, ba nàng tiên cùng cúi chào khán giả duy nhất." }));

  /* ---- Đối thực ---- */
  reg("core.doi_thuc_tam_nguoi", (ctx) => ({ title: "Ba người", text: `${list(names(ctx))} nhìn nhau, rồi nhìn bệ hạ, cùng cười.\n> Bệ hạ nói đấy nhé.${V()}` }));
  reg("core.cung_dong_tam", (ctx) => ({ title: "Cung Đồng Tâm", text: `Ở Cung Đồng Tâm, ${list(names(ctx))} không cần giấu gì. Bệ hạ là khách, được mời ngồi giữa.${V()}` }));
  reg("core.dem_ty_muoi", (ctx) => ({ title: "Đêm Tỷ Muội", text: `Các cặp tỷ muội tự tổ chức, bệ hạ là khách duy nhất. ${list(names(ctx))} nâng chén mời.${V()}` }));

  /* ---- Hằng ngày, lễ hội ---- */
  reg("core.mua_dem", (ctx) =>
    pickOne([
      { title: "Trú mưa", text: `${first(ctx)} mở cửa, thấy bệ hạ ướt sũng, vội lấy khăn lau tóc cho người. Mưa ngoài hiên càng lúc càng to.${V()}` },
      { title: "Trú mưa", text: `${first(ctx)} hâm rượu, hong áo cho bệ hạ bên lò than.\n> Mưa thế này, bệ hạ đừng về nữa.${V()}` },
      { title: "Trú mưa", text: `Sấm rền. ${first(ctx)} giả vờ sợ, nép sát vào bệ hạ, rồi cười khúc khích.${V()}` },
    ])
  );
  reg("core.tn_tao_bao", (ctx) => ({ title: `${first(ctx)} táo bạo`, text: `${first(ctx)} kéo tay bệ hạ đi thẳng vào cung, đóng cửa lại.\n> Lần này bệ hạ khỏi chạy.${V()}` }));
  reg("core.tn_huong_la", (ctx) => ({ title: "Hương theo gió", text: `${first(ctx)} mở cửa, mùi hương ùa ra.\n> Bệ hạ tìm được đến đây, vậy là hương của thiếp thành công rồi.${V()}` }));
  reg("core.tet", (ctx) => ({ title: "Giao thừa", text: `Pháo hoa nổ trên mái Càn Thanh cung. ${first(ctx)} nắm tay bệ hạ đếm ngược đến năm mới.${V()}` }));
  reg("core.that_tich", (ctx) => ({ title: "Đèn Thất tịch", text: `Bài thơ trên chiếc đèn bệ hạ chọn là của ${first(ctx)}. Nàng đứng đợi dưới giàn hoa, như biết trước.${V()}` }));
  reg("core.trung_thu", (ctx) => ({ title: "Đèn hoa đăng", text: `Hai chiếc đèn trôi cạnh nhau trên hồ. ${first(ctx)} không chịu nói đã ước gì.` }));

  /* ---- Cung đình, lễ tết (0.3.1) ---- */
  reg("core.nguyen_tieu", (ctx) => ({ title: "Đèn đố chữ", text: `${first(ctx)} giải được hai mươi câu đố, nhận thưởng rồi kéo bệ hạ đi xem đèn đến khuya.` }));
  reg("core.trung_cuu", (ctx) => ({ title: "Rượu hoa cúc", text: `Trên đỉnh Cảnh Sơn, ${first(ctx)} rót rượu hoa cúc, cài một bông cúc vàng lên mũ bệ hạ.${V()}` }));
  reg("core.dong_chi", (ctx) => ({ title: "Đêm Đông chí", text: `Ngoài trời tuyết rơi. Trong cung ${first(ctx)}, lò than đỏ rực, bát chè còn ấm.${V()}` }));
  reg("core.hoa_si", (ctx) => ({ title: "Bức chân dung", text: `Họa sĩ vẽ ${first(ctx)} ba ngày ba đêm. Bức tranh treo ở Dưỡng Tâm điện, ai vào cũng phải ngoái nhìn.` }));
  reg("core.hong_tieu_ho", () => ({ title: "Hoa Thanh Trì", text: "Hơi nước ôn tuyền mờ mịt. Tạ Hồng Tiêu vươn tay kéo bệ hạ xuống hồ." + V() }));
  reg("core.td_dem_thuyen", (ctx) => ({ title: "Đêm trên sông", text: `Thuyền rồng neo giữa dòng. ${list(names(ctx))} hát khúc quê mình, tiếng hát trôi xa trên mặt nước.${V()}` }));

  /* ---- Cuộc thi ---- */
  const thi = (title, line) => (ctx) => ({
    title,
    text: `${line}\nXếp hạng: ${(ctx.extra.ranking || names(ctx)).join(" › ")}.\n> ${ctx.extra.winner || first(ctx)} đoạt giải nhất.`,
  });
  reg("core.thi_tho", thi("Thi thơ hậu cung", "Mỗi người một bài thơ về hoa mẫu đơn, chép trên quạt lụa."));
  reg("core.thi_cam", thi("Đàn trong đêm trăng", "Đèn tắt, chỉ còn trăng và tiếng đàn lần lượt vang lên."));
  reg("core.thi_tuyen_diem", thi("Bách Hoa Tuyển Diễm", "Từng người bước ra trong bộ y phục đẹp nhất, châu ngọc lấp lánh."));
  reg("core.thi_huong_dau", thi("Hương Đấu", "Bệ hạ bịt mắt, từng mùi hương lướt qua. Có mùi trầm, mùi hoa, mùi gì đó không gọi được tên."));
  reg("core.thi_vu_mi", thi("Vũ Mị", "Các vũ khúc nối nhau, mỗi điệu một kiểu quyến rũ."));
  reg("core.thi_duc_tri", thi("Dục Trì Tranh Sủng", "Hai đội té nước, giành nhau một quả cầu lụa giữa hồ ôn tuyền."));
  reg("core.thi_dai_kich", thi("Đại Kịch Phong Nguyệt", "Mỗi đội dựng một màn nhập vai, bệ hạ là nhân vật chính của mọi màn."));
  reg("core.thi_thi_tham", thi("Thì Thầm Mê Hồn", "Trong bóng tối, từng giọng nói thì thầm bên tai bệ hạ."));
  reg("core.thi_ngu_yen", thi("Ngự Yến Phong Lưu", "Mỗi người bày một yến tiệc, bệ hạ đi từ bàn này sang bàn khác."));
  reg("core.thi_hoang_hau_mot_dem", (ctx) => ({ title: "Hoàng Hậu Một Đêm", text: `${ctx.extra.winner || first(ctx)} thắng. Theo luật đã thỏa thuận, đêm nay nàng chỉ huy cả hậu cung và cả bệ hạ, có ám hiệu dừng.${V()}` }));
  reg("core.dai_dien", (ctx) => ({ title: "Phong Nguyệt Đại Điển", text: `Ba đêm, ba vòng: Sắc, Tình, Phong Lưu. ${list(names(ctx))} đều dốc hết sức.\n> ${ctx.extra.winner} đoạt danh hiệu Phong Nguyệt Đệ Nhất.${V()}` }));
})(window.Game);
