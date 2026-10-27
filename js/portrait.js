/*
 * Chân dung vẽ bằng SVG, dùng khi nhân vật chưa có ảnh thật (portrait.image).
 * Phong cách tranh công bút: nền trăng tròn, tóc đen bóng, áo giao lĩnh nhiều lớp.
 * Mỗi nhân vật có kiểu tóc, trang sức, màu áo, màu da cố định theo id; nét mặt đổi theo Sủng ái,
 * trang sức đổi theo phẩm vị (Phi trở lên có hoa điền, Hoàng quý phi trở lên đội mũ phượng).
 * Gói có ảnh thật chỉ cần đặt portrait.image, ảnh sẽ thay hoàn toàn chân dung vẽ.
 */
(function () {
  "use strict";
  const G = window.Game;

  function hash(s) {
    let h = 2166136261;
    for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }

  const SKIN = [
    ["#f7e4d6", "#e9c6b0"],
    ["#f2d8c4", "#deb59a"],
    ["#f9eadf", "#ecccb8"],
    ["#ebc9ad", "#d3a688"],
  ];
  const HAIR = ["#15101a", "#1d1214", "#221712", "#110d14"];
  const LIP = ["#c2343f", "#b8283a", "#cf4a4a", "#a92c44"];

  /** Một bông hoa nhỏ năm cánh. */
  const flower = (x, y, r, c, core) => {
    let s = "";
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * (Math.PI / 180);
      s += `<circle cx="${(x + Math.cos(a) * r).toFixed(2)}" cy="${(y + Math.sin(a) * r).toFixed(2)}" r="${(r * 0.78).toFixed(2)}" fill="${c}"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${(r * 0.55).toFixed(2)}" fill="${core}"/>`;
  };
  /** Trâm có chuỗi hạt rủ (bộ diêu). */
  const buYao = (x1, y1, x2, y2, gold, gem, n) => {
    let s = `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>`;
    s += `<circle cx="${x2}" cy="${y2}" r="2.4" fill="${gold}"/><circle cx="${x2}" cy="${y2}" r="1.1" fill="${gem}"/>`;
    for (let i = 1; i <= n; i++) s += `<circle cx="${x2 + 0.6 * i}" cy="${y2 + 3.2 * i}" r="${i === n ? 1.4 : 0.8}" fill="${i === n ? gem : gold}"/>`;
    return s + `<path d="M${x2} ${y2 + 1.5} L${x2 + 0.6 * n} ${y2 + 3.2 * n}" stroke="${gold}" stroke-width=".5"/>`;
  };

  /** Trả về chuỗi <svg>. c: nhân vật (phi tần hoặc đối tượng người nói của con cái). */
  G.portraitSVG = function (c) {
    const p = c.portrait || {};
    const h = hash(c.id || c.name);
    const hue = p.hue != null ? p.hue : h % 360;
    const [skin, skinD] = SKIN[(h >>> 3) % SKIN.length];
    const hair = HAIR[(h >>> 5) % HAIR.length];
    const lip = LIP[(h >>> 9) % LIP.length];
    const kid = !!c.isChild;
    const style = kid ? "child" : ["song", "cao", "nghieng", "xoa"][(h >>> 7) % 4];
    const favor = c.favor != null ? c.favor : 50;
    const mood = kid ? "smile" : favor >= 70 ? "smile" : favor >= 35 ? "calm" : "sad";
    const rank = kid ? 0 : c.rank || 0;
    const uid = "p" + (h % 1e7);

    const robe = `hsl(${hue} 52% 38%)`;
    const robeD = `hsl(${hue} 55% 24%)`;
    const trim = `hsl(${(hue + 40) % 360} 62% 60%)`;
    const inner = `hsl(${(hue + 180) % 360} 30% 92%)`;
    const gold = "#e3bb62";
    const gem = `hsl(${(hue + 160) % 360} 70% 55%)`;
    const petal = `hsl(${(hue + 330) % 360} 75% 78%)`;
    const bgA = `hsl(${hue} 42% 34%)`;
    const bgB = `hsl(${(hue + 25) % 360} 38% 12%)`;

    // khuôn mặt (trẻ con tròn hơn, thấp hơn)
    const fy = kid ? 4 : 0; // dịch xuống
    const face = kid
      ? `M36 ${58 + fy} C36 ${46 + fy} 42 ${41 + fy} 50 ${41 + fy} C58 ${41 + fy} 64 ${46 + fy} 64 ${58 + fy} C64 ${67 + fy} 58 ${73 + fy} 50 ${73 + fy} C42 ${73 + fy} 36 ${67 + fy} 36 ${58 + fy}Z`
      : "M35.5 53 C35.5 42.5 42 37 50 37 C58 37 64.5 42.5 64.5 53 C64.5 63 58.5 71.5 50 74 C41.5 71.5 35.5 63 35.5 53Z";

    // tóc phía sau (rủ xuống vai)
    const back = {
      song: `<path d="M31 55 C29 35 39 27 50 27 C61 27 71 35 69 55 C71 68 69 78 64 84 L36 84 C31 78 29 68 31 55Z" fill="${hair}"/>`,
      cao: `<path d="M32 55 C30 36 39 28 50 28 C61 28 70 36 68 55 C70 66 68 75 64 80 L36 80 C32 75 30 66 32 55Z" fill="${hair}"/>`,
      nghieng: `<path d="M31 55 C29 35 39 27 50 27 C61 27 71 35 69 55 C71 68 69 78 64 84 L36 84 C31 78 29 68 31 55Z" fill="${hair}"/><path d="M33 64 C29 78 30 92 36 102 L44 102 C38 90 37 78 38 66Z" fill="${hair}"/>`,
      xoa: `<path d="M30 54 C28 34 38 26 50 26 C62 26 72 34 70 54 C73 72 74 90 72 104 L28 104 C26 90 27 72 30 54Z" fill="${hair}"/>`,
      child: `<path d="M34 ${58 + fy} C32 ${42 + fy} 40 ${35 + fy} 50 ${35 + fy} C60 ${35 + fy} 68 ${42 + fy} 66 ${58 + fy} L64 ${66 + fy} L36 ${66 + fy}Z" fill="${hair}"/>`,
    }[style];

    // búi tóc phía trên (vẽ trước mặt, sau mái)
    const bun = {
      song: `<circle cx="36" cy="27" r="8.5" fill="${hair}"/><circle cx="64" cy="27" r="8.5" fill="${hair}"/><path d="M30 25 Q36 20 42 25" stroke="#ffffff22" stroke-width="1.2" fill="none"/><path d="M58 25 Q64 20 70 25" stroke="#ffffff22" stroke-width="1.2" fill="none"/>`,
      cao: `<path d="M40 30 C38 18 44 11 50 11 C56 11 62 18 60 30Z" fill="${hair}"/><path d="M44 17 Q50 12 56 17" stroke="#ffffff22" stroke-width="1.2" fill="none"/>`,
      nghieng: `<ellipse cx="62" cy="26" rx="11" ry="8.5" transform="rotate(-24 62 26)" fill="${hair}"/><path d="M54 22 Q61 17 69 21" stroke="#ffffff22" stroke-width="1.2" fill="none"/>`,
      xoa: `<ellipse cx="50" cy="26" rx="9" ry="5.5" fill="${hair}"/>`,
      child: `<circle cx="37" cy="${38 + fy}" r="6" fill="${hair}"/><circle cx="63" cy="${38 + fy}" r="6" fill="${hair}"/>`,
    }[style];

    // tóc mái rẽ giữa, ôm khuôn mặt
    const front = kid
      ? `<path d="M35 ${58 + fy} C34 ${45 + fy} 41 ${39 + fy} 50 ${39 + fy} C59 ${39 + fy} 66 ${45 + fy} 65 ${58 + fy} C62 ${50 + fy} 57 ${46 + fy} 50 ${47 + fy} C43 ${46 + fy} 38 ${50 + fy} 35 ${58 + fy}Z" fill="${hair}"/>`
      : style === "xoa"
      ? `<path d="M34 64 C31 46 38 33 50 33 C62 33 69 46 66 64 C65 52 60 43 51.5 41.5 L50 40 L48.5 41.5 C40 43 35 52 34 64Z" fill="${hair}"/>`
      : `<path d="M34 60 C31 44 39 32 50 32 C61 32 69 44 66 60 C64 50 59 43 51.5 41 L50 39.5 L48.5 41 C41 43 36 50 34 60Z" fill="${hair}"/>`;
    const sheen = kid ? "" : `<path d="M40 36 Q45 33.5 49 35" stroke="#ffffff30" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M60 36 Q55 33.5 51 35" stroke="#ffffff1c" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

    // trang sức theo kiểu tóc và phẩm vị
    let jewel = "";
    if (kid) {
      jewel = `<path d="M33 ${41 + fy} l-3 5 M41 ${41 + fy} l3 5" stroke="#d2442f" stroke-width="1.6" stroke-linecap="round"/><path d="M59 ${41 + fy} l-3 5 M67 ${41 + fy} l3 5" stroke="#d2442f" stroke-width="1.6" stroke-linecap="round"/>`;
    } else {
      if (style === "song") jewel += flower(36, 21, 2.4, petal, gold) + flower(64, 21, 2.4, petal, gold);
      if (style === "cao") jewel += `<path d="M41 24 Q50 20 59 24" stroke="${gold}" stroke-width="1.6" fill="none"/><circle cx="50" cy="21.8" r="1.8" fill="${gem}"/>`;
      if (style === "nghieng") jewel += flower(36, 34, 2.8, petal, gold) + flower(31.5, 38.5, 1.8, petal, gold);
      if (style === "xoa") jewel += `<path d="M41 27 Q50 22 59 27" stroke="${gold}" stroke-width="1.3" fill="none"/>` + flower(50, 24, 1.9, petal, gold);
      if (rank >= 2) jewel += style === "nghieng" ? buYao(58, 24, 70, 19, gold, gem, 3) : style === "song" ? buYao(66, 27, 74, 22, gold, gem, 3) : buYao(57, 25, 68, 21, gold, gem, 3);
      if (rank >= 6) {
        // mũ phượng: vòng vàng trước búi, cánh phượng hai bên, hạt rủ
        jewel += `<path d="M36 33 Q50 21 64 33" stroke="${gold}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        jewel += `<path d="M50 19 l3.5 6 l-3.5 3 l-3.5 -3z" fill="${gold}"/><circle cx="50" cy="24" r="1.4" fill="#d2442f"/>`;
        jewel += `<path d="M36 33 q-6 -6 -9 -2 q4 1 6 5z" fill="${gold}"/><path d="M64 33 q6 -6 9 -2 q-4 1 -6 5z" fill="${gold}"/>`;
        for (const x of [39, 44, 56, 61]) jewel += `<path d="M${x} ${x < 50 ? 30.5 - (x - 39) * 0.5 : 26.5 + (x - 56) * 0.8} v3.5" stroke="${gold}" stroke-width=".6"/><circle cx="${x}" cy="${(x < 50 ? 34.5 - (x - 39) * 0.5 : 30.5 + (x - 56) * 0.8).toFixed(1)}" r=".9" fill="${gem}"/>`;
      }
    }

    // mắt, mày, môi
    const ey = kid ? 59 + fy - 4 : 54.5;
    const lx = 43.4;
    const rx = 56.6;
    const ink = "#1b1012";
    const eye = (x, flip) => {
      const d = flip ? -1 : 1; // 1 = mắt trái (đuôi mắt bên trái)
      if (mood === "smile")
        return `<path d="M${x - 3.6 * d} ${ey + 0.6} Q${x} ${ey - 2.6} ${x + 3.4 * d} ${ey + 0.4}" stroke="${ink}" stroke-width="1.35" fill="none" stroke-linecap="round"/><path d="M${x - 3.6 * d} ${ey + 0.6} l${-1.2 * d} -1" stroke="${ink}" stroke-width=".9" stroke-linecap="round"/>`;
      const lid = mood === "sad" ? 1.6 : 2.4;
      return `<path d="M${x - 3.8 * d} ${ey + 0.2} Q${x} ${ey - lid} ${x + 3.6 * d} ${ey + 0.3} Q${x} ${ey + 1.9} ${x - 3.8 * d} ${ey + 0.2}Z" fill="#fbf6f0"/>
<circle cx="${x + 0.2 * d}" cy="${ey + 0.1}" r="1.75" fill="#2b1813"/><circle cx="${x + 0.2 * d}" cy="${ey + 0.1}" r=".85" fill="#0b0607"/><circle cx="${x - 0.5 * d}" cy="${ey - 0.6}" r=".55" fill="#fff"/>
<path d="M${x - 3.8 * d} ${ey + 0.2} Q${x} ${ey - lid - 0.4} ${x + 3.6 * d} ${ey + 0.3}" stroke="${ink}" stroke-width="1.25" fill="none" stroke-linecap="round"/><path d="M${x - 3.8 * d} ${ey + 0.2} l${-1.4 * d} -1.1" stroke="${ink}" stroke-width=".9" stroke-linecap="round"/>`;
    };
    const browY = ey - 4.6;
    const brow = (x, flip) => {
      const d = flip ? -1 : 1;
      const inn = mood === "sad" ? -1.2 : 0.3; // đầu mày phía trong
      return `<path d="M${x - 4.4 * d} ${browY + 0.6} Q${x - 0.5 * d} ${browY - 1.6} ${x + 3.8 * d} ${browY + inn}" stroke="${hair}" stroke-width=".95" fill="none" stroke-linecap="round" opacity=".9"/>`;
    };
    const my = kid ? 67 + fy - 2 : 65.3;
    let mouth;
    if (mood === "smile")
      mouth = `<path d="M46.6 ${my} Q50 ${my + 3.2} 53.4 ${my} Q50 ${my + 1.1} 46.6 ${my}Z" fill="${lip}"/><path d="M46.6 ${my} q-.5 -.4 -.8 -.9 M53.4 ${my} q.5 -.4 .8 -.9" stroke="${lip}" stroke-width=".6" stroke-linecap="round"/>`;
    else if (mood === "calm")
      mouth = `<path d="M47.3 ${my} Q48.7 ${my - 1} 50 ${my - 0.4} Q51.3 ${my - 1} 52.7 ${my} Q50 ${my + 0.5} 47.3 ${my}Z" fill="${lip}"/><path d="M47.6 ${my + 0.1} Q50 ${my + 2.5} 52.4 ${my + 0.1} Q50 ${my + 0.7} 47.6 ${my + 0.1}Z" fill="${lip}" opacity=".85"/>`;
    else mouth = `<path d="M47.6 ${my + 0.8} Q50 ${my - 0.6} 52.4 ${my + 0.8} Q50 ${my + 1.9} 47.6 ${my + 0.8}Z" fill="${lip}" opacity=".9"/>`;
    const nose = kid ? "" : `<path d="M50.3 58.6 q-.9 2.4 .5 2.9" stroke="${skinD}" stroke-width=".8" fill="none" stroke-linecap="round"/>`;
    const blushOp = kid ? 0.45 : favor >= 60 ? 0.5 : 0.22;
    const blush = `<ellipse cx="40.5" cy="${ey + 6}" rx="4.2" ry="2.6" fill="url(#${uid}b)" opacity="${blushOp}"/><ellipse cx="59.5" cy="${ey + 6}" rx="4.2" ry="2.6" fill="url(#${uid}b)" opacity="${blushOp}"/>`;
    const hoaDien = rank >= 4 ? `<path d="M50 41.6 q1.4 1.8 0 3.6 q-1.4 -1.8 0 -3.6z" fill="#d2442f"/><circle cx="48.4" cy="45.2" r=".55" fill="#d2442f"/><circle cx="51.6" cy="45.2" r=".55" fill="#d2442f"/>` : "";
    const earring = !kid && (h >>> 11) % 2 ? `<path d="M35.6 61 v3" stroke="${gold}" stroke-width=".6"/><circle cx="35.6" cy="65" r="1.3" fill="${gem}"/>` : "";

    // áo giao lĩnh nhiều lớp
    const body = kid
      ? `<path d="M24 102 C26 88 36 82 50 81 C64 82 74 88 76 102Z" fill="${robe}"/><path d="M43 81 L50 90 L57 81Z" fill="${inner}"/><path d="M43 81 L52 96 M57 81 L50 90" stroke="${trim}" stroke-width="2"/>`
      : `<path d="M12 102 C14 87 28 80 41 78.5 L50 92 L59 78.5 C72 80 86 87 88 102Z" fill="url(#${uid}r)"/>
<path d="M41.5 78.6 L58.5 78.6 L50 90.5Z" fill="${inner}"/>
<path d="M44.6 78.6 L55.4 78.6 L50 85.6Z" fill="hsl(${hue} 45% 55%)"/>
<path d="M41 78.5 L54 102" stroke="${trim}" stroke-width="2.6"/><path d="M59 78.5 L50 92" stroke="${trim}" stroke-width="2.6"/>
<path d="M41 78.5 L54 102" stroke="${robeD}" stroke-width=".6" stroke-dasharray="1.2 1.6"/>
<path d="M20 92 q6 -3 9 2 M80 92 q-6 -3 -9 2" stroke="${trim}" stroke-width=".9" fill="none" opacity=".7"/>`;

    // nền: trăng tròn và mây
    const bg = `<rect width="100" height="100" fill="url(#${uid}g)"/>
<circle cx="50" cy="44" r="33" fill="hsl(${hue} 50% 70%)" opacity=".13"/><circle cx="50" cy="44" r="33" fill="none" stroke="${gold}" stroke-width=".6" opacity=".35"/>
<path d="M6 30 q5 -5 10 0 q4 -4 8 0" stroke="${gold}" stroke-width=".7" fill="none" opacity=".3"/><path d="M76 16 q5 -5 10 0 q4 -4 8 0" stroke="${gold}" stroke-width=".7" fill="none" opacity=".3"/>`;

    const neckTop = kid ? 70 + fy : 68;
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<radialGradient id="${uid}g" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></radialGradient>
<linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/></linearGradient>
<linearGradient id="${uid}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${robe}"/><stop offset="1" stop-color="${robeD}"/></linearGradient>
<radialGradient id="${uid}b"><stop offset="0" stop-color="#ee7d88"/><stop offset="1" stop-color="#ee7d88" stop-opacity="0"/></radialGradient>
</defs>
${bg}
<g transform="translate(50 54) scale(1.12) translate(-50 -54)">
${back}
${body}
<path d="M46 ${neckTop} L46 ${kid ? 82 : 79} Q50 ${kid ? 84.5 : 81.5} 54 ${kid ? 82 : 79} L54 ${neckTop}Z" fill="${skinD}"/>
<path d="${face}" fill="url(#${uid}f)"/>
${blush}${brow(lx, false)}${brow(rx, true)}${eye(lx, false)}${eye(rx, true)}${nose}${mouth}${hoaDien}${earring}
${bun}${front}${sheen}${jewel}
</g>
</svg>`;
  };
})();

/*
 * Ảnh chân dung thật do gói khai báo (files.portraits), ví dụ packs/canh-viet/portraits.json:
 *   { "core.tuyet": "portraits/tuyet.webp", "_tu_nu": ["portraits/tu-nu-1.webp", ...] }
 * Ảnh theo id nhân vật ưu tiên trước; tú nữ ngẫu nhiên lấy một ảnh trong "_tu_nu" theo id (cố định mỗi người).
 * Tra lúc vẽ nên áp dụng cả cho bản lưu cũ. Con cái không bao giờ dùng ảnh.
 */
(function (G) {
  "use strict";
  const byId = {};
  let pool = [];
  const abs = (base, rel) => (/^(https?:|data:|\/)/.test(rel) ? rel : base + rel);
  G.addPortraits = function (map, base) {
    for (const [k, v] of Object.entries(map || {})) {
      if (k === "_tu_nu") pool = pool.concat([].concat(v).filter(Boolean).map((x) => abs(base, x)));
      else if (k.startsWith("_")) continue;
      else if (typeof v === "string" && v) byId[k] = abs(base, v);
    }
  };
  G.portraitImageFor = function (c) {
    if (!c || c.isChild) return null;
    if (byId[c.id]) return byId[c.id];
    const def = G.registry.characters[c.id];
    const pack = c.pack || (def && def.pack);
    if ((pack === "generated" || pack === "god") && pool.length) {
      let h = 0;
      for (const ch of String(c.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return pool[h % pool.length];
    }
    return null;
  };
})(window.Game);
