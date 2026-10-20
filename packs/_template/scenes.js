/*
 * Cảnh của gói. Mỗi HOOK là một hàm nhận ctx (chỉ đọc) và trả về { title, text, image? }.
 * Lõi đã kiểm tra tuổi và mức đồng thuận TRƯỚC khi gọi hàm này.
 *
 * ctx = {
 *   hook,                // id HOOK đang gọi
 *   participants: [{ id, name, age, rank, favor, affection, traits, consent }],
 *   fetish: [...],       // id sở thích của cảnh
 *   fetishLevels: {...}, // độ nghiện hiện tại của hoàng đế theo id
 *   tier,                // tầng cao nhất trong các sở thích (0 nếu không có)
 *   truyLac,             // chỉ số Trụy lạc
 *   emperor: { name, age },
 *   place, extra         // tùy sự kiện truyền vào
 * }
 *
 * Trong text: xuống dòng bằng \n, dòng bắt đầu bằng "> " hiển thị như lời thoại.
 * Ảnh: đường dẫn tương đối với thư mục gói, dùng Game.asset(PACK, "assets/ten.webp").
 */
(function (Game) {
  "use strict";
  const PACK = "ten-goi-cua-ban";

  Game.hooks.register(PACK + ".canh_1", (ctx) => {
    const p = ctx.participants[0];
    return {
      title: "Tiêu đề cảnh",
      text: `Nội dung cảnh với ${p.name}.\n> Lời thoại.`,
      image: Game.asset(PACK, "assets/canh_1.webp"),
    };
  }, PACK);

  Game.hooks.register(PACK + ".canh_tap_the", (ctx) => {
    const ten = ctx.participants.map((p) => p.name).join(", ");
    return {
      title: `Cảnh tập thể · ${ctx.participants.length} người`,
      text: `Nội dung cảnh với ${ten}. Tầng sở thích: ${ctx.tier}.`,
    };
  }, PACK);

  // Cảnh cho cuộc thi: ctx.extra.winner, ctx.extra.ranking
  Game.hooks.register(PACK + ".thi_mau", (ctx) => ({
    title: "Tên cuộc thi",
    text: `Thứ hạng: ${(ctx.extra.ranking || []).join(" › ")}.\n> ${ctx.extra.winner} thắng.`,
  }), PACK);

  // Ghi đè cảnh của gói khác: đăng ký lại đúng id đó.
  // Game.hooks.register("core.thi_tam", (ctx) => ({ title: "...", text: "..." }), PACK);

  // Bắt cả nhóm HOOK bằng dấu *:
  // Game.hooks.register("core.thi_tam*", (ctx) => ({ title: "...", text: "..." }), PACK);
})(window.Game);
