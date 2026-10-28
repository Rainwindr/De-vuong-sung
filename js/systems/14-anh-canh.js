/*
 * Ảnh đầu cảnh: mỗi lần mở cảnh bốc ngẫu nhiên một ảnh trong packs/canh-viet/scene-art/ (xem "Kho ảnh ngẫu nhiên").
 * Cách cũ (khi không lấy được danh sách ảnh): mỗi sở thích dùng một trong 31 tư thế, file P01.jpg … P31.jpg.
 * Một phần của các hệ thống game (xây trên js/engine.js). Các file trong js/systems/ nạp theo thứ tự số,
 * file sau có thể bọc (wrap) hàm của file trước, nên đừng đổi thứ tự.
 */
(function () {
  "use strict";
  const G = window.Game;

  G.SCENE_ART_BASE = "packs/canh-viet/scene-art/";
  // Tư thế → các sở thích dùng ảnh đó (theo PROMPT-GROK-ANH-SO-THICH)
  const BY_POSE = {
    P01: ["canh-viet.after_sex_body_inspection", "canh-viet.aftercare_intense", "canh-viet.cham_cham", "canh-viet.marking", "canh-viet.multiple_continuous_long_orgasms", "canh-viet.ngoc_hanh", "canh-viet.nuoc_mat", "canh-viet.one_bar", "canh-viet.overstimulation", "canh-viet.praise_kink", "canh-viet.slow_tease_long", "canh-viet.toc_dai", "canh-viet.women_having_orgasms", "core.huong_sac", "core.ngam_nhin", "core.thi_tham", "khung-nong-bong.kiem_che", "vi-du-den-long.ngam_den"],
    P02: ["canh-viet.bi_bat_lot_do", "canh-viet.clothing_malfunction", "canh-viet.embarrassed_nude_female", "canh-viet.women_taking_off_their_clothes", "canh-viet.xe_toat_quan_ao"],
    P03: ["canh-viet.do_choi_thai_hau", "canh-viet.phuc_trang", "canh-viet.sexy_lingerie_thong_bikini", "core.nhap_vai", "core.y_phuc", "khung-nong-bong.y_phuc_goi"],
    P04: ["canh-viet.always_bottomless", "canh-viet.cmnf", "canh-viet.women_wearing_see_through_clothing", "core.lua_la"],
    P05: ["canh-viet.am_thanh", "core.trang_suc"],
    P06: ["canh-viet.bat_luc", "canh-viet.bon_chua_tinh", "canh-viet.breeding", "canh-viet.chenh_lech", "canh-viet.creampie_marathon", "canh-viet.cumflation", "canh-viet.degradation", "canh-viet.dem_truoc_dai_hon", "canh-viet.double_penetration_toys", "canh-viet.du_xong_bat_giu_tinh", "canh-viet.force_squirt", "canh-viet.invisible_force_play", "canh-viet.mutual_masturbation", "canh-viet.pha_trinh", "canh-viet.phong_van", "canh-viet.rubbing", "canh-viet.sau_man", "canh-viet.squirting_mess_fuck", "canh-viet.sweat_play", "canh-viet.thu_do_sau", "core.chinh_phuc", "core.chu_to", "khung-nong-bong.long_chung"],
    P07: ["canh-viet.cau_quan", "core.ban_thuong", "core.ganh_dua"],
    P08: ["canh-viet.women_being_carried_and_fucked"],
    P09: ["canh-viet.du_xoa_bop", "canh-viet.lesbian_massage_contest", "canh-viet.massage_pussy", "canh-viet.titties_clit_massage", "khung-nong-bong.xoa_bop"],
    P10: ["canh-viet.freeuse_harem", "canh-viet.harem_phuc_vu_hang_ngay", "canh-viet.ton_tho_khi_lam_viec", "khung-nong-bong.phuc_dich", "khung-nong-bong.tu_do"],
    P11: ["canh-viet.hai_loc_dau_ngay"],
    P12: ["canh-viet.lesbian_eating", "canh-viet.lesbian_eating_contest", "canh-viet.lesbian_femdom", "canh-viet.men_watching_lesbian", "canh-viet.quan_sat_bi", "khung-nong-bong.doi_thuc_nong"],
    P13: ["canh-viet.edging_tap_the", "canh-viet.hai_nguoi", "canh-viet.japanese_gameshow", "canh-viet.khoi_dong_gai_moi", "canh-viet.phat_tap_the", "canh-viet.porn_gameshow", "canh-viet.row_of_girls_dildo", "canh-viet.tho_phung_ca_dem", "core.khan_dai", "core.trinh_dien", "khung-nong-bong.gameshow", "khung-nong-bong.khan_gia", "khung-nong-bong.tan_phi"],
    P14: ["canh-viet.bdsm", "canh-viet.keo_tay", "canh-viet.predicament_bondage", "core.troi_lua", "khung-nong-bong.troi_buoc"],
    P15: ["canh-viet.sensory_deprivation", "canh-viet.voice_control", "core.bit_mat"],
    P16: ["canh-viet.temperature_play", "core.nong_lanh"],
    P17: ["canh-viet.du_danh_don", "canh-viet.grab", "canh-viet.lenh_phat", "canh-viet.trung_phat", "canh-viet.veo_cau"],
    P18: ["canh-viet.breast", "canh-viet.groping_and_sucking_titties", "canh-viet.milking"],
    P19: ["canh-viet.guong", "canh-viet.mirror_sex"],
    P20: ["canh-viet.doi_noi", "canh-viet.outdoor_night"],
    P21: ["canh-viet.du_trong_kieu"],
    P22: ["canh-viet.du_ban_tho"],
    P23: ["canh-viet.yen_tiec", "core.yen_tiec"],
    P24: ["canh-viet.du_cao_long", "canh-viet.shaving_pussy"],
    P25: ["canh-viet.mang_thai"],
    P26: ["canh-viet.ngua_go"],
    P27: ["canh-viet.cang_chan"],
    P28: ["canh-viet.giu_vat_nang"],
    P29: ["canh-viet.chan_tay", "canh-viet.tickle_fuck"],
    P30: ["canh-viet.gloryholes"],
    P31: ["core.duc_tri", "khung-nong-bong.nghi_thuc"]
  };
  G.SCENE_ART_PLAIN = "P06"; // đêm thường, không chọn sở thích
  // Game tự tìm file theo mã tư thế, thử lần lượt các đuôi này (P06.jpg, P06.jpeg, P06.png, P06.webp).
  // Không có file nào thì cảnh hiện khung "· · ·" như cũ.
  G.SCENE_ART_EXT = [".jpg", ".jpeg", ".png", ".webp"];
  // Ghi đè tên file riêng nếu cần, ví dụ P06: "dem-thuong.jpg"
  G.SCENE_ART_FILES = {};

  G.SCENE_ART = {};
  for (const [pose, ids] of Object.entries(BY_POSE)) for (const id of ids) G.SCENE_ART[id] = pose;

  /* ---------- Kho ảnh ngẫu nhiên ----------
   * Mỗi lần mở cảnh, game bốc ngẫu nhiên một ảnh trong packs/canh-viet/scene-art/ (đặt tên gì cũng được,
   * nhận .jpg .jpeg .png .webp), không lặp lại ảnh vừa hiện. Danh sách ảnh lấy theo thứ tự:
   *   1. file list.json trong thư mục (nếu có): ["a.jpg", "b.jpg", ...]
   *   2. trang GitHub Pages (<chủ>.github.io/<repo>/): hỏi GitHub danh sách file trong thư mục
   *   3. máy chạy python -m http.server: đọc trang liệt kê thư mục
   * Không lấy được danh sách thì dùng cách cũ: ảnh theo mã tư thế (P01…P31).
   */
  G.SCENE_ART_POOL = [];
  const IMG = /\.(jpe?g|png|webp)$/i;
  const CACHE = "dvs.sceneArtList";
  const uniq = (a) => [...new Set(a)].filter((n) => IMG.test(n) && !n.startsWith("_"));
  async function fromJson() {
    const r = await fetch(G.SCENE_ART_BASE + "list.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("no list.json");
    const a = await r.json();
    if (!Array.isArray(a)) throw new Error("bad list.json");
    return uniq(a.map(String));
  }
  async function fromGithub() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    if (!m) throw new Error("not github pages");
    const repo = location.pathname.split("/").filter(Boolean)[0];
    const path = G.SCENE_ART_BASE.replace(/\/$/, "");
    const url = repo && !/\.html?$/i.test(repo) ? `https://api.github.com/repos/${m[1]}/${repo}/contents/${path}` : `https://api.github.com/repos/${m[1]}/${m[1]}.github.io/contents/${path}`;
    const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error("github " + r.status);
    const a = await r.json();
    return uniq(a.filter((f) => f.type === "file").map((f) => f.name));
  }
  async function fromListing() {
    const r = await fetch(G.SCENE_ART_BASE, { cache: "no-cache" });
    if (!r.ok) throw new Error("no listing");
    const html = await r.text();
    return uniq([...html.matchAll(/href="([^"?#]+)"/g)].map((x) => decodeURIComponent(x[1].split("/").filter(Boolean).pop() || "")));
  }
  G.sceneArtReady = (async () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE) || "null");
      if (Array.isArray(c) && c.length) return (G.SCENE_ART_POOL = c);
    } catch (e) {}
    for (const f of [fromJson, fromGithub, fromListing]) {
      try {
        const list = await f();
        if (list.length) {
          G.SCENE_ART_POOL = list;
          try {
            sessionStorage.setItem(CACHE, JSON.stringify(list));
          } catch (e) {}
          return list;
        }
      } catch (e) {}
    }
    return [];
  })();
  let lastArt = null;

  /** Ảnh cho đêm nay: { src, alt: [các đường dẫn thử tiếp] } hoặc null. */
  G.sceneArtFor = function (fetishIds) {
    const pool = G.SCENE_ART_POOL;
    if (pool.length) {
      const choices = pool.length > 1 ? pool.filter((n) => n !== lastArt) : pool;
      const name = choices[Math.floor(Math.random() * choices.length)];
      lastArt = name;
      return { src: G.SCENE_ART_BASE + encodeURIComponent(name), alt: [] };
    }
    // cách cũ: theo mã tư thế
    const list = (fetishIds || []).filter(Boolean);
    const pose = list.length ? list.map((f) => G.SCENE_ART[f]).find(Boolean) : G.SCENE_ART_PLAIN;
    if (!pose) return null;
    const files = G.SCENE_ART_FILES[pose] ? [G.SCENE_ART_FILES[pose]] : G.SCENE_ART_EXT.map((e) => pose + e);
    const paths = files.map((f) => G.SCENE_ART_BASE + f);
    return { src: paths[0], alt: paths.slice(1) };
  };
  const withArt = (scene, fx) => {
    if (scene && !scene.blocked && !scene.image) {
      const art = G.sceneArtFor(fx);
      if (art) Object.assign(scene, { image: art.src, imageAlt: art.alt });
    }
    return scene;
  };
  const summonD14 = G.summon;
  G.summon = (id, fetishIds) => withArt(summonD14(id, fetishIds), fetishIds);
  const roundD14 = G.extraRound;
  G.extraRound = (cid, fid) => withArt(roundD14(cid, fid), fid ? [fid] : []);
})();
