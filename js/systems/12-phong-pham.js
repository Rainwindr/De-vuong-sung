/*
 * Phong phẩm theo ý bệ hạ: Đặc ân phong phẩm, Ban phẩm trên giường, Đệ nhất sủng phi.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;
  const { clamp } = G.util;
  const log = (t, k) => G.log(t, k);
  const monthly = (fn) => G.monthlyHooks.push(fn);

  // Câu do Claude viết (mức gợi tình). Grok có thể viết lại theo PROMPT-GROK-PHONG-PHAM. Biến: {name}, {rank} (phẩm mới).
  G.D12_TEXT = {
    // ghi nhật ký khi bệ hạ đặc ân phong phẩm (phẩm dưới Phi, không cần lễ)
    dacAn: [
      "Một đạo khẩu dụ truyền xuống, {name} được bệ hạ phá lệ phong lên {rank}, cả hậu cung xôn xao bàn tán.",
      "{name} chưa đủ lệ mà vẫn lên {rank}, các phi đều hiểu đó là ân sủng riêng bệ hạ dành cho nàng.",
      "Bệ hạ đặc ân phong {name} lên {rank}, nàng quỳ tạ ơn mà má đỏ bừng, mắt không rời long nhan.",
      "Kim sách phong {name} làm {rank} đến sớm hơn lệ cả năm, chỉ vì bệ hạ muốn thấy nàng cười.",
    ],
    // ban phẩm ngay trên giường, sau đêm thị tẩm: câu dẫn + thoại
    banPham: [
      "Còn nằm trong vòng tay bệ hạ, mồ hôi chưa ráo, {name} nghe bệ hạ phán từ mai nàng là {rank}.\n> Thần thiếp tạ ơn bệ hạ… thân này của thiếp, đêm nào bệ hạ muốn cũng xin dâng trọn.",
      "Bệ hạ vuốt dọc tấm lưng trần của {name}, khẽ nói sẽ phong nàng lên {rank}.\n> Bệ hạ thương thiếp quá… thiếp không có gì báo đáp, chỉ biết hầu bệ hạ thật ngoan thôi.",
      "{name} vừa thở dốc vừa nghe tin được ban phẩm {rank}, nàng ôm siết lấy bệ hạ không chịu buông.\n> Vậy đêm mai thiếp càng phải làm bệ hạ vừa ý hơn đêm nay mới được.",
      "Bệ hạ hôn lên vai {name} còn ửng hồng, ban cho nàng phẩm {rank} ngay trên gối.\n> {rank} của bệ hạ xin tạ ơn bằng cả đêm nay… bệ hạ còn sức không?",
      "{name} quấn mình trong chăn gấm, nghe bệ hạ phong mình làm {rank} thì cười khúc khích, áp sát vào lòng bệ hạ.\n> Thiếp lên phẩm rồi, mà vẫn chỉ muốn nằm dưới bệ hạ thôi.",
    ],
    // khi được ghim làm Đệ nhất sủng phi: câu dẫn + thoại
    topPin: [
      "Bệ hạ đặt thẻ tên {name} lên đầu khay, từ nay {rank} {name} là đệ nhất sủng phi.\n> Thần thiếp xin chỉ thuộc về một mình bệ hạ, đêm nào cũng chờ.",
      "Lý công công truyền chỉ khắp lục cung: {rank} {name} là người bệ hạ sủng nhất.\n> Bệ hạ đã chọn thiếp… vậy đêm nay bệ hạ có đến không?",
      "{name} nhận ấn ngọc khắc chữ Sủng, dù mới là {rank} mà các phi đã phải nhường lối.\n> Thiếp sẽ giữ bệ hạ thật chặt, để bệ hạ không nỡ rời giường thiếp.",
      "Bệ hạ cài trâm phượng lên tóc {name}, phán rằng {rank} này đứng trên cả hậu cung trong lòng trẫm.\n> Thiếp mong bệ hạ triệu thiếp thật nhiều, nhiều đến mức các phi phải ghen.",
    ],
  };

  G.TOP_FAV_MONTHLY = { favor: 2, affection: 1 };
  G.DAC_AN_BASE = { 1: 100, 2: 200, 3: 350 }; // phẩm dưới Phi; từ Phi trở lên phí lễ sắc phong tính riêng
  G.DAC_AN_PER_FAVOR = 15; // mỗi điểm Sủng ái còn thiếu
  G.DAC_AN_PER_KID = 400; // mỗi người con còn thiếu
  G.BAN_PHAM_DISCOUNT = 0.7; // ban trên giường rẻ hơn

  const d12 = (s) => {
    s = s || G.state;
    if (!s.d12) s.d12 = {};
    const d = s.d12;
    if (d.top === undefined) d.top = null;
    if (!d.banTurn) d.banTurn = {};
    return d;
  };
  G.d12 = d12;

  const rankText = (t, c, rank) => G.fill(t.replace(/\{rank\}/g, G.RANKS[rank]), { speaker: c });
  const rich = () => G.state.godFlags && G.state.godFlags.infiniteMoney;

  /** Thông tin thăng thêm một phẩm theo ý bệ hạ, hoặc null nếu không thể (đã Hoàng quý phi, là Hoàng hậu). */
  G.dacAnInfo = function (c, discount) {
    if (!c || c.isChild || c.rank >= 6) return null;
    const next = c.rank + 1;
    const need = G.PROMOTE[next];
    const favorGap = Math.max(0, Math.ceil(need.favor - c.favor));
    const kidGap = Math.max(0, need.kids - c.kids);
    const ceremony = next >= 4;
    let fee = (ceremony ? 0 : G.DAC_AN_BASE[next] || 0) + favorGap * G.DAC_AN_PER_FAVOR + kidGap * G.DAC_AN_PER_KID;
    if (discount) fee = Math.round(fee * discount);
    return { next, fee, ceremony, favorGap, kidGap, eligible: !favorGap && !kidGap, total: fee + (ceremony ? G.SAC_PHONG_COST[next] : 0) };
  };

  /**
   * Đặc ân phong phẩm (từ hồ sơ phi).
   * Phẩm dưới Phi: thăng ngay. Từ Phi trở lên: trả về sự kiện lễ sắc phong (phí đặc ân cộng vào lễ).
   */
  G.dacAn = function (id) {
    const s = G.state;
    const c = G.findConsort(id);
    const info = G.dacAnInfo(c);
    if (!info) return { ok: false, text: "Nàng đã ở phẩm cao nhất." };
    if (info.ceremony) {
      if (!G.sacEvent) return { ok: false, text: "Chưa thể cử hành lễ sắc phong." };
      const ev = G.sacEvent(c, info.next, info.fee);
      return ev.choices.some((x) => x.cost) ? { ok: true, event: ev } : { ok: false, text: `Ngân khố không đủ cho lễ sắc phong (cần ${info.total} lượng).` };
    }
    if (s.stats.quocKho < info.fee && !rich()) return { ok: false, text: `Ngân khố không đủ (cần ${info.fee} lượng).` };
    if (info.fee) G.addStat("quocKho", -info.fee);
    G.promote(c, info.next);
    c.affection = clamp(c.affection + 3, 0, 100);
    const text = rankText(G.d3one(G.D12_TEXT.dacAn), c, info.next);
    log(text, "harem");
    return { ok: true, text, notes: [info.fee ? `Quốc khố −${info.fee}` : "", `${c.name} lên ${G.RANKS[c.rank]}`, "Tình cảm +3"].filter(Boolean) };
  };

  /** Ban phẩm trên giường: mỗi phi một lần mỗi tháng, phí đặc ân giảm. */
  G.banPhamInfo = function (c) {
    if (!c || d12().banTurn[c.id] === G.state.turn) return null;
    const q = G.state.d2 && G.state.d2.sacQueue.find((x) => x.id === c.id);
    if (q) return null; // đang chờ lễ sắc phong rồi
    return G.dacAnInfo(c, G.BAN_PHAM_DISCOUNT);
  };
  G.banPham = function (id) {
    const s = G.state;
    const c = G.findConsort(id);
    const info = G.banPhamInfo(c);
    if (!info) return { ok: false, text: "Đêm nay bệ hạ đã ban rồi." };
    if (s.stats.quocKho < info.fee && !rich()) return { ok: false, text: `Ngân khố không đủ (cần ${info.fee} lượng).` };
    d12().banTurn[c.id] = s.turn;
    if (info.fee) G.addStat("quocKho", -info.fee);
    const text = rankText(G.d3one(G.D12_TEXT.banPham), c, info.next);
    const notes = [info.fee ? `Quốc khố −${info.fee}` : ""];
    c.affection = clamp(c.affection + 4, 0, 100);
    if (info.ceremony) {
      // sáng mai Lễ bộ dâng tấu: xếp lễ sắc phong vào tháng tới
      const d2 = G.d2(s);
      if (!d2.sacQueue.some((x) => x.id === c.id)) d2.sacQueue.unshift({ id: c.id, rank: info.next });
      delete d2.sacAsked[c.id];
      d12().banSac = { id: c.id, rank: info.next }; // tháng tới ưu tiên dâng tấu lễ này
      notes.push(`Tháng tới Lễ bộ dâng tấu sắc phong ${G.RANKS[info.next]} (${G.SAC_PHONG_COST[info.next]} lượng)`);
    } else {
      G.promote(c, info.next);
      notes.push(`${c.name} lên ${G.RANKS[c.rank]}`);
    }
    notes.push("Tình cảm +4");
    log(`Đêm thị tẩm, bệ hạ ban cho ${c.name} phẩm ${G.RANKS[info.next]}.`, "night");
    return { ok: true, text, notes: notes.filter(Boolean) };
  };

  // Lễ sắc phong do ban trên giường: tháng tới luôn có tấu, đứng đầu chuyện hậu cung
  monthly((s, report) => {
    const d = d12(s);
    const q = d.banSac;
    if (!q || s.ended) return;
    d.banSac = null;
    const c = G.findConsort(q.id);
    if (!c || c.rank >= q.rank || !G.sacEvent) return;
    const list = report.sideEvents;
    const i = list.findIndex((e) => e.ev && e.ev.id === "sys.sac_phong" && e.speaker && e.speaker.id === c.id);
    if (i === 0) return;
    if (i > 0) list.unshift(list.splice(i, 1)[0]);
    else {
      const p = G.sacEvent(c, q.rank);
      if (!p.choices.length) return;
      list.unshift(p);
      if (G.SIDE_MAX && list.length > G.SIDE_MAX) list.pop();
      G.d2(s).sacAsked[c.id] = s.turn;
    }
  });

  /* ---------------- Đệ nhất sủng phi ---------------- */
  G.topFav = function () {
    const s = G.state;
    if (!s) return null;
    const d = d12(s);
    if (!d.top) return null;
    const c = G.findConsort(d.top);
    if (!c) d.top = null;
    return c || null;
  };
  G.isTopFav = (c) => !!c && !!G.state && d12().top === c.id;
  /** Ghim hoặc bỏ ghim (id rỗng). Trả về câu nàng nói khi được ghim. */
  G.setTopFav = function (id) {
    const d = d12();
    const c = id ? G.findConsort(id) : null;
    if (!c || d.top === c.id) {
      d.top = null;
      return null;
    }
    d.top = c.id;
    c.affection = clamp(c.affection + 2, 0, 100);
    log(`${c.name} được bệ hạ chọn làm đệ nhất sủng phi.`, "harem");
    return rankText(G.d3one(G.D12_TEXT.topPin), c, c.rank);
  };
  monthly((s) => {
    if (s.ended) return;
    const c = G.topFav();
    if (!c) return;
    G.changeFavor(c, G.TOP_FAV_MONTHLY.favor);
    c.affection = clamp(c.affection + G.TOP_FAV_MONTHLY.affection, 0, 100);
  });
})();
