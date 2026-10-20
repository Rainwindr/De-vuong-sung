/*
 * Khung "Sự nóng bỏng": cảnh mặc định chỉ chuyển cảnh.
 * Gói bên thứ ba thay cảnh bằng cách đăng ký lại đúng id, ví dụ "khung-nong-bong.xoa_bop",
 * hoặc bắt cả nhóm bằng "khung-nong-bong.*". Dùng ctx.fetish, ctx.tier, ctx.participants để dựng cảnh.
 */
(function (Game) {
  "use strict";
  const PACK = "khung-nong-bong";
  Game.hooks.register(PACK + ".*", (ctx) => {
    const f = Game.registry.fetishes[ctx.fetish[0]] || { name: "" };
    const ten = ctx.participants.map((p) => p.name).join(", ");
    return { title: f.name, text: `${ten}. Đêm nay theo ý bệ hạ: ${f.name}.\nRèm lụa buông xuống.` };
  }, PACK);
})(window.Game);
