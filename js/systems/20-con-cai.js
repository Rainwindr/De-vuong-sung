/*
 * Con cái vừa phải: tỉ lệ hoài thai (☰), Tị tử thang, "Muốn có con" từng phi, phi tự kiêng sau 2 con.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const d20 = (s) => {
    s = s || G.state;
    if (!s.d20) s.d20 = {};
    const d = s.d20;
    if (d.rate == null) d.rate = 2;
    if (!d.want) d.want = {};
    return d;
  };
  G.d20 = d20;

  /* Tỉ lệ hoài thai */
  G.CONCEIVE_LEVELS = [
    { name: "Tắt", mult: 0 },
    { name: "Thấp", mult: 0.5 },
    { name: "Vừa", mult: 1 },
    { name: "Cao", mult: 1.6 },
  ];
  G.conceiveLevel = () => (G.state ? d20().rate : 2);
  G.setConceiveLevel = (v) => (d20().rate = Math.max(0, Math.min(G.CONCEIVE_LEVELS.length - 1, Number(v) || 0)));
  G.conceiveRate = () => (G.state ? G.CONCEIVE_LEVELS[d20().rate].mult : 1);

  /* Muốn có con: mặc định bật khi nàng chưa đủ 2 con (đủ 2 con nàng tự kiêng) */
  G.KID_SELF_LIMIT = 2;
  G.wantsKid = function (c) {
    if (!c || !G.state) return false;
    const w = d20().want[c.id];
    return w != null ? !!w : (c.kids || 0) < G.KID_SELF_LIMIT;
  };
  G.setWantsKid = (cid, on) => (d20().want[cid] = !!on);

  /* Tị tử thang: món dùng một lần, đêm dùng chắc chắn không thụ thai */
  if (G.BED_ITEMS) {
    G.BED_ITEMS.ti_tu_thang = { name: "Tị tử thang", cost: 80, desc: "Canh tránh thai: đêm dùng chắc chắn không thụ thai", fx: {}, noLike: true };
    if (G.D13_TEXT && G.D13_TEXT.item) G.D13_TEXT.item.ti_tu_thang = ["Trước khi lên giường, {name} uống cạn bát Tị tử thang còn ấm, đặt bát xuống rồi cười với bệ hạ.", "{name} nhấp từng ngụm canh đắng, nhăn mặt rồi chui vào lòng bệ hạ đòi ngậm mứt."];
    // món này không được chọn làm món ♥ của phi, để bộ ♥ cũ không đổi
    const likedD20 = G.likedItem;
    G.likedItem = function (c) {
      const stash = {};
      for (const [k, v] of Object.entries(G.BED_ITEMS)) if (v.noLike) (stash[k] = v), delete G.BED_ITEMS[k];
      try {
        return likedD20(c);
      } finally {
        Object.assign(G.BED_ITEMS, stash);
      }
    };
    const extrasD20 = G.setNightExtras;
    G.setNightExtras = function (cid, items) {
      const d = d20();
      d.noKid = (items || []).includes("ti_tu_thang") && G.bedStock("ti_tu_thang") > 0 ? { id: cid, turn: G.state.turn } : null;
      return extrasD20.apply(this, arguments);
    };
  }

  G.canConceive = function (c) {
    if (!G.state) return true;
    const d = d20();
    if (!G.conceiveRate()) return false;
    if (d.noKid && d.noKid.id === c.id && d.noKid.turn === G.state.turn) return false;
    return G.wantsKid(c);
  };
})();
