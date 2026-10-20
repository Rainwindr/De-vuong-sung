/*
 * Chân dung vẽ bằng SVG, dùng khi nhân vật chưa có ảnh thật (portrait.image).
 * Mỗi nhân vật có kiểu tóc, trâm, màu áo, màu da cố định theo id; nét mặt đổi theo Sủng ái.
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

  const SKIN = ["#f3dccb", "#eccbb2", "#f6e2d4", "#e5bfa3"];
  const HAIR = ["#1a1013", "#24161a", "#2b1a14", "#16121a"];

  /** Trả về chuỗi <svg>. c: nhân vật (phi tần hoặc đối tượng người nói của con cái). */
  G.portraitSVG = function (c) {
    const p = c.portrait || {};
    const h = hash(c.id || c.name);
    const hue = p.hue != null ? p.hue : h % 360;
    const skin = SKIN[(h >> 3) % SKIN.length];
    const hair = HAIR[(h >> 5) % HAIR.length];
    const style = c.isChild ? "child" : ["song", "cao", "nghieng", "xoa"][(h >> 7) % 4];
    const favor = c.favor != null ? c.favor : 50;
    const mood = c.isChild ? "smile" : favor >= 70 ? "smile" : favor >= 35 ? "calm" : "sad";
    const robe = `hsl(${hue} 48% 36%)`;
    const robe2 = `hsl(${(hue + 25) % 360} 55% 24%)`;
    const pin = `hsl(${(hue + 45) % 360} 70% 62%)`;
    const bg1 = `hsl(${hue} 45% 30%)`;
    const bg2 = `hsl(${(hue + 30) % 360} 40% 12%)`;
    const uid = "p" + (h % 1e6);

    // Tóc phía sau
    const backHair = {
      song: `<ellipse cx="50" cy="58" rx="24" ry="27" fill="${hair}"/>`,
      cao: `<ellipse cx="50" cy="58" rx="23" ry="26" fill="${hair}"/>`,
      nghieng: `<ellipse cx="50" cy="58" rx="24" ry="27" fill="${hair}"/><path d="M28 60 Q24 84 32 98 L40 98 Q34 82 36 62Z" fill="${hair}"/>`,
      xoa: `<path d="M25 56 Q24 92 30 104 L70 104 Q76 92 75 56 Q74 30 50 30 Q26 30 25 56Z" fill="${hair}"/>`,
      child: `<ellipse cx="50" cy="60" rx="21" ry="22" fill="${hair}"/>`,
    }[style];

    // Búi tóc và trâm
    const buns = {
      song: `<circle cx="36" cy="30" r="9" fill="${hair}"/><circle cx="64" cy="30" r="9" fill="${hair}"/><path d="M60 26 L76 18" stroke="${pin}" stroke-width="1.6"/><circle cx="77" cy="17" r="3" fill="${pin}"/>`,
      cao: `<ellipse cx="50" cy="24" rx="11" ry="13" fill="${hair}"/><path d="M38 28 L64 20" stroke="${pin}" stroke-width="1.8"/><circle cx="66" cy="19" r="3.2" fill="${pin}"/><path d="M66 22 L68 30" stroke="${pin}" stroke-width="1"/><circle cx="68" cy="31" r="1.4" fill="${pin}"/>`,
      nghieng: `<ellipse cx="62" cy="30" rx="12" ry="10" fill="${hair}" transform="rotate(-20 62 30)"/><path d="M54 24 L74 34" stroke="${pin}" stroke-width="1.6"/><circle cx="75" cy="35" r="3" fill="${pin}"/>`,
      xoa: `<path d="M36 34 Q50 26 64 34" stroke="${pin}" stroke-width="1.6" fill="none"/><circle cx="50" cy="29" r="2.6" fill="${pin}"/>`,
      child: `<circle cx="37" cy="40" r="6" fill="${hair}"/><circle cx="63" cy="40" r="6" fill="${hair}"/><circle cx="37" cy="40" r="2" fill="${pin}"/><circle cx="63" cy="40" r="2" fill="${pin}"/>`,
    }[style];

    const faceRy = c.isChild ? 17 : 19;
    const faceY = c.isChild ? 62 : 58;
    // Mắt
    const ey = faceY - 1;
    const eyes = {
      smile: `<path d="M41 ${ey} Q44 ${ey - 3} 47 ${ey}" stroke="#2a1616" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M53 ${ey} Q56 ${ey - 3} 59 ${ey}" stroke="#2a1616" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
      calm: `<ellipse cx="44" cy="${ey}" rx="2.6" ry="1.5" fill="#2a1616"/><ellipse cx="56" cy="${ey}" rx="2.6" ry="1.5" fill="#2a1616"/>`,
      sad: `<path d="M41 ${ey - 1} Q44 ${ey + 1.5} 47 ${ey}" stroke="#2a1616" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M53 ${ey} Q56 ${ey + 1.5} 59 ${ey - 1}" stroke="#2a1616" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    }[mood];
    const brows = `<path d="M40 ${ey - 5} Q44 ${ey - (mood === "sad" ? 5 : 7)} 48 ${ey - 5.5}" stroke="${hair}" stroke-width="1" fill="none"/><path d="M52 ${ey - 5.5} Q56 ${ey - (mood === "sad" ? 5 : 7)} 60 ${ey - 5}" stroke="${hair}" stroke-width="1" fill="none"/>`;
    const my = faceY + 9;
    const mouth = mood === "smile" ? `<path d="M46.5 ${my} Q50 ${my + 3} 53.5 ${my}" stroke="#b8323a" stroke-width="1.8" fill="none" stroke-linecap="round"/>` : mood === "calm" ? `<ellipse cx="50" cy="${my}" rx="2.6" ry="1.3" fill="#c0393f"/>` : `<path d="M47 ${my + 1.5} Q50 ${my - 0.5} 53 ${my + 1.5}" stroke="#b8323a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    const blush = favor >= 60 || c.isChild ? `<ellipse cx="40" cy="${faceY + 4}" rx="4" ry="2.2" fill="#e8777f" opacity=".35"/><ellipse cx="60" cy="${faceY + 4}" rx="4" ry="2.2" fill="#e8777f" opacity=".35"/>` : "";
    // Hoa điền giữa trán cho phẩm Phi trở lên
    const hoaDien = !c.isChild && c.rank >= 4 ? `<path d="M50 ${faceY - 13} l1.6 2.6 l-1.6 2.6 l-1.6 -2.6z" fill="#d2442f"/>` : "";
    // Tóc mái
    const bangs =
      style === "xoa"
        ? `<path d="M30 52 Q32 34 50 33 Q68 34 70 52 Q62 42 50 42 Q38 42 30 52Z" fill="${hair}"/>`
        : style === "child"
        ? `<path d="M31 58 Q34 42 50 42 Q66 42 69 58 Q60 50 50 52 Q40 50 31 58Z" fill="${hair}"/>`
        : `<path d="M30 54 Q31 36 50 35 Q69 36 70 54 Q66 44 56 42 Q50 46 44 42 Q34 44 30 54Z" fill="${hair}"/>`;
    // Áo
    const body = c.isChild
      ? `<path d="M28 100 Q30 84 50 82 Q70 84 72 100Z" fill="${robe}"/>`
      : `<path d="M20 100 Q24 80 50 77 Q76 80 80 100Z" fill="${robe}"/><path d="M38 79 L50 94 L62 79" stroke="${pin}" stroke-width="2" fill="none"/><path d="M41 78.5 L50 90 L59 78.5" fill="${robe2}"/>`;

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><radialGradient id="${uid}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></radialGradient></defs>
<rect width="100" height="100" fill="url(#${uid})"/>
${backHair}${body}
<rect x="45" y="${faceY + 14}" width="10" height="8" fill="${skin}"/>
<ellipse cx="50" cy="${faceY}" rx="${c.isChild ? 16 : 17}" ry="${faceRy}" fill="${skin}"/>
${blush}${brows}${eyes}${mouth}${hoaDien}${bangs}${buns}
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
