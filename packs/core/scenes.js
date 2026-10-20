/*
 * Cảnh mặc định của gói lõi. Chỉ ở mức gợi, rồi chuyển cảnh.
 * Gói bên thứ ba muốn thay cảnh nào thì đăng ký lại đúng id đó (gói nạp sau ghi đè gói nạp trước),
 * hoặc đăng ký id có dấu * để bắt cả nhóm, ví dụ "core.thi_tam*".
 */
(function (Game) {
  "use strict";
  const PACK = "core";
  const names = (ctx) => ctx.participants.map((p) => p.name);
  const list = (arr) => (arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " và " + arr[arr.length - 1]);

  Game.hooks.register("core.thi_tam", (ctx) => {
    const p = ctx.participants[0];
    return {
      title: `Thị tẩm · ${p.name}`,
      text: `Thái giám lật thẻ bài khắc tên ${p.name}. Đèn ở ${p.rank === "Hoàng hậu" ? "Khôn Ninh cung" : "Dưỡng Tâm điện"} được vặn nhỏ.\n> Bệ hạ… đêm nay là của thiếp.\nRèm lụa buông xuống.`,
    };
  }, PACK);

  Game.hooks.register("core.thi_tam_so_thich", (ctx) => {
    const p = ctx.participants[0];
    const fs = ctx.fetish.map((f) => (Game.registry.fetishes[f] || {}).name || f);
    return {
      title: `Thị tẩm · ${p.name}`,
      text: `Đêm nay theo ý bệ hạ: ${fs.join(", ")}. ${p.name} đã chuẩn bị từ chiều, mặt ửng hồng khi thái giám lui ra.\nRèm lụa buông xuống.`,
    };
  }, PACK);

  Game.hooks.register("core.da_yen_thi_tam", (ctx) => ({
    title: "Chén rượu đầu tiên",
    text: `${names(ctx)[0]} dìu bệ hạ rời yến tiệc, tà áo đỏ quét qua bậc thềm ngọc.\n> Thiếp đã nói rồi, đêm nay là đêm của người.\nCửa điện khép lại.`,
  }), PACK);

  Game.hooks.register("core.moc_can_dem_dau", (ctx) => ({
    title: "Mười năm chờ đợi",
    text: "Mộc Cẩn run run tháo trâm. Tóc nàng xõa xuống, vẫn mùi hoa nhài như những năm còn ở Đông cung.\n> Thiếp… thiếp không mơ chứ?\nNến tắt.",
  }), PACK);

  Game.hooks.register("core.den_long_dem", (ctx) => ({
    title: "Đêm hội đèn lồng",
    text: "Mặt nạ hồ ly rơi xuống. Hồ Mị Nương kéo bệ hạ vào con hẻm sau tiệm hương, nơi mùi trầm và mùi hoa quyện vào nhau.\n> Công tử thắng rồi. Phần thưởng là ta.",
  }), PACK);

  Game.hooks.register("core.tu_lan_dem_dau", (ctx) => ({
    title: "Thuyền hoa Tần Hoài",
    text: "Tiếng đàn ngừng giữa chừng. Tử Lan vén rèm, mắt cười.\n> Đoạn cuối câu chuyện, thiếp kể bằng cách khác.\nĐèn thuyền hoa tắt dần trên mặt sông.",
  }), PACK);

  Game.hooks.register("core.uyen_nghi_sa_nga", (ctx) => ({
    title: "Phượng hoàng sa ngã",
    text: "Lục Uyển Nghi nhìn bệ hạ rất lâu, rồi tự tay tháo mũ phượng đặt xuống.\n> Nếu bệ hạ đã chọn đường này, thiếp đi cùng.\nĐêm ấy Khôn Ninh cung không còn là Khôn Ninh cung của ngày hôm qua.",
  }), PACK);

  Game.hooks.register("core.xe_de", (ctx) => ({
    title: "Dê dừng trước cửa",
    text: `Con dê đi một vòng, rồi dừng trước cửa cung của ${names(ctx)[0] || "một mỹ nhân"}. Bên thềm còn mấy hạt muối trắng.\n> Thiếp không biết gì đâu nhé.`,
  }), PACK);

  Game.hooks.register("core.me_lau", (ctx) => ({
    title: "Lạc trong Mê Lâu",
    text: `Hành lang nối hành lang, rèm nối rèm. Tiếng cười của ${list(names(ctx))} lúc gần lúc xa.\n> Bệ hạ cứ lạc đường đi. Chúng thiếp sẽ tìm thấy người.\nBa ngày sau, bệ hạ mới bước ra.`,
  }), PACK);

  Game.hooks.register("core.bach_hoa", (ctx) => ({
    title: `Đêm Bách Hoa · ${ctx.participants.length} người`,
    text: `Vườn hoa trong điện thắp ${ctx.participants.length * 3} ngọn nến. ${list(names(ctx))} mỗi người một màu lụa, xếp thành vòng.\n> Đêm nay vườn hoa nở cùng lúc.\nRèm buông xuống.`,
  }), PACK);

  Game.hooks.register("core.that_tich", (ctx) => ({
    title: "Đèn Thất tịch",
    text: `Bài thơ trên chiếc đèn bệ hạ chọn là của ${names(ctx)[0]}. Nàng đứng đợi dưới giàn hoa, như biết trước.`,
  }), PACK);

  Game.hooks.register("core.mua_dem", (ctx) => ({
    title: "Trú mưa",
    text: `${names(ctx)[0]} mở cửa, thấy bệ hạ ướt sũng, vội lấy khăn lau tóc cho người. Mưa ngoài hiên càng lúc càng to.`,
  }), PACK);
})(window.Game);
