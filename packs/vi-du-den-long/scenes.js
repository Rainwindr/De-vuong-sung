/* Gói ví dụ: cách đăng ký cảnh cho HOOK của gói mình. */
(function (Game) {
  "use strict";
  const PACK = "vi-du-den-long";

  Game.hooks.register(PACK + ".dem_den", (ctx) => {
    const p = ctx.participants[0];
    return {
      title: "Đêm đèn hoa",
      text: `Hàng trăm chiếc đèn hoa đào lắc lư trên xà nhà. ${p.name} ngồi giữa vầng sáng hồng.\n> Đèn này thiếp làm cả tháng, chỉ để thắp đêm nay.\nNgọn đèn cuối cùng được thổi tắt.`,
    };
  }, PACK);

  Game.hooks.register(PACK + ".dem_den_tap_the", (ctx) => {
    const ten = ctx.participants.map((p) => p.name).join(", ");
    return {
      title: `Hội đèn trong cung · ${ctx.participants.length} người`,
      text: `${ten} ngồi quanh hồ sen nhỏ, mỗi người thả một chiếc đèn và một điều ước. Không ai chịu nói mình đã ước gì.`,
    };
  }, PACK);
})(window.Game);
