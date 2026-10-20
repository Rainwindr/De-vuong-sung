/*
 * Cảnh viết tay (không cần code).
 *
 * Nguồn chữ, ưu tiên từ trên xuống:
 *   1. Trình soạn cảnh trong game (lưu trong trình duyệt)
 *   2. File scene-texts.json của các gói (manifest.files.sceneTexts)
 *   3. Cảnh do scenes.js của gói đăng ký (cảnh cũ vẫn chạy khi chưa có chữ mới)
 *
 * Cấu trúc dữ liệu:
 *   { "<hook>": { "<khóa>": { "<mức>": ["đoạn 1", "đoạn 2", ...] } } }
 *   khóa: id nhân vật, id sở thích, hoặc "_chung"
 *   mức:  "dau" | "quen" | "lau" (chỉ cảnh thị tẩm) hoặc "_" (mọi cảnh khác)
 * Trong chữ dùng được: {name} {names} {emperor} {fetish}
 */
(function () {
  "use strict";
  const G = window.Game;
  const KEY = "tsdv-scene-texts-v1";

  /** Danh mục cảnh, theo thứ tự ưu tiên nên viết. by: "char" theo nhân vật, "fetish" theo sở thích, "none" một bộ chung. */
  G.SCENE_CATALOG = [
    { group: "1. Thị tẩm thường", items: [{ hook: "core.thi_tam", by: "char", levels: true, name: "Thị tẩm", ctx: "Bệ hạ lật thẻ bài, triệu {name} thị tẩm một mình ở Dưỡng Tâm điện." }] },
    { group: "2. Thị tẩm có sở thích", items: [{ hook: "core.thi_tam_so_thich", by: "fetish", name: "Thị tẩm theo sở thích", ctx: "Bệ hạ triệu {name} thị tẩm, đêm nay theo sở thích: {fetish}. Nàng đã đồng ý với sở thích này." }] },
    {
      group: "3. Combo",
      items: [
        { hook: "core.combo_ho_ruou", name: "Đêm Hồ Rượu", ctx: "Dục trì + yến tiệc trên người: hồ tắm đổ đầy rượu ấm, {name} rót rượu cho bệ hạ." },
        { hook: "core.combo_kich", name: "Kịch Vương Triều", ctx: "Nhập vai + y phục đặc biệt: {name} thay nhiều bộ y phục, mỗi bộ một vai." },
        { hook: "core.combo_huong_toi", name: "Hương Trong Bóng Tối", ctx: "Thì thầm + bịt mắt: đèn tắt hết, chỉ còn mùi hương và giọng {name}." },
        { hook: "core.combo_lua_do", name: "Lụa Đỏ Quyền Uy", ctx: "Chủ và tớ + trói bằng lụa, có ám hiệu dừng đã thỏa thuận; đêm nay {name} nắm quyền." },
        { hook: "core.combo_tram_mau", name: "Hội Trăm Màu", ctx: "Trình diễn + trang sức: {name} đeo đầy châu ngọc, trình diễn trước các phi tần tự nguyện ngồi xem." },
      ],
    },
    {
      group: "4. Gặp gỡ lần đầu",
      items: [
        { hook: "core.da_yen_thi_tam", name: "Liễu Như Yên – dạ yến đăng cơ", ctx: "Đêm yến tiệc đăng cơ, vũ cơ Liễu Như Yên (22 tuổi) dâng rượu rồi theo bệ hạ về điện." },
        { hook: "core.tiem_huong", name: "Hồ Mị Nương – tiệm hương", ctx: "Bệ hạ cải trang tìm đến tiệm hương của Hồ Mị Nương (23 tuổi), nàng cho bệ hạ ngửi từng lọ hương." },
        { hook: "core.den_long_dem", name: "Hồ Mị Nương – đêm hội đèn", ctx: "Đêm hội đèn lồng, cô gái đeo mặt nạ hồ ly (Hồ Mị Nương, 23 tuổi) kéo bệ hạ vào hẻm sau tiệm hương." },
        { hook: "core.tu_lan_dem_dau", name: "Mạc Tử Lan – thuyền hoa", ctx: "Trên thuyền hoa Tần Hoài, Mạc Tử Lan (24 tuổi) ngừng đàn, mời 'công tử lạ mặt' nghe đoạn cuối câu chuyện." },
        { hook: "core.song_phi", name: "Song phi – đêm đầu", ctx: "Đêm đầu của hai chị em sinh đôi Song Nguyệt và Song Nhật (20 tuổi), cả hai cùng đợi bệ hạ." },
        { hook: "core.uyen_nghi_sa_nga", name: "Uyển Nghi sa ngã", ctx: "Lục Uyển Nghi (20 tuổi), vốn đoan trang, lần đầu tháo mũ phượng, chọn sa ngã cùng bệ hạ." },
      ],
    },
    {
      group: "5. Cảnh tập thể và lễ tết",
      items: [
        { hook: "core.dai_dien", name: "Phong Nguyệt Đại Điển", ctx: "Ba đêm Đại Điển cuối năm với ba phi đứng đầu mùa thi: {names}." },
        { hook: "core.xe_de", name: "Xe dê dừng cửa", ctx: "Xe dê dừng trước cửa cung của {name}; nàng giả vờ không biết vụ rắc muối." },
        { hook: "core.bit_mat_o_lai", name: "Bịt mắt – người bị bắt ở lại", ctx: "Chơi bịt mắt bắt dê, người bị bắt là {name}, theo luật nàng ở lại." },
        { hook: "core.bit_mat_hai", name: "Bịt mắt – bắt được hai người", ctx: "Chơi bịt mắt, bệ hạ bắt được cùng lúc hai người: {names}." },
        { hook: "core.bach_hoa", name: "Đêm Bách Hoa", ctx: "Đêm Bách Hoa: {names}, mỗi người một màu lụa, cùng ở bên bệ hạ." },
        { hook: "core.that_tich", name: "Đêm Thất tịch", ctx: "Đêm Thất tịch, bệ hạ chọn chiếc đèn có bài thơ của {name}." },
        { hook: "core.tet", name: "Giao thừa", ctx: "Đêm giao thừa, bệ hạ đón năm mới cùng {name}." },
        { hook: "core.trung_thu", name: "Trung Thu", ctx: "Đêm Trung Thu, bệ hạ thả đèn hoa đăng cùng {name}." },
        { hook: "core.nhap_vai_thich_khach", name: "Nhập vai – thích khách", ctx: "{name} đóng vai nữ thích khách bị bệ hạ bắt được." },
        { hook: "core.nhap_vai_thon_nu", name: "Nhập vai – thôn nữ", ctx: "{name} đóng vai thôn nữ hái dâu gặp vị quan tuần du." },
        { hook: "core.nhap_vai_nu_tuong", name: "Nhập vai – nữ tướng", ctx: "{name} đóng vai nữ tướng bại trận." },
        { hook: "core.nhap_vai_dao_vai", name: "Nhập vai – đảo vai", ctx: "{name} đóng vai chủ nhân, bệ hạ làm nô bộc, có ám hiệu dừng." },
      ],
    },
    {
      group: "6. Cao trào cốt truyện riêng",
      items: [
        { hook: "core.tuyet_lua_trai", name: "Hách Liên Tuyết – lửa trại", ctx: "Sau đêm lửa trại thảo nguyên giữa hoàng cung, Hách Liên Tuyết (21 tuổi) kéo bệ hạ về lều." },
        { hook: "core.nhu_yen_vu_rieng", name: "Liễu Như Yên – điệu múa riêng", ctx: "Liễu Như Yên múa điệu múa chỉ dành cho bệ hạ, dưới một ngọn đèn." },
        { hook: "core.mi_nuong_huong_moi", name: "Hồ Mị Nương – hương Mộng Hồ", ctx: "Hồ Mị Nương thử mùi hương Mộng Hồ vừa chế lại được, mọi thứ mờ như trong mơ." },
        { hook: "core.hong_tieu_ho", name: "Tạ Hồng Tiêu – Hoa Thanh Trì", ctx: "Tạ Hồng Tiêu (21 tuổi) kéo bệ hạ xuống hồ ôn tuyền Hoa Thanh Trì." },
        { hook: "core.song_phi_rieng", name: "Song Nhật – riêng một mình", ctx: "Lần đầu Song Nhật ở riêng với bệ hạ, không có chị." },
        { hook: "core.lua_do_a", name: "Dải lụa đỏ – bệ hạ nắm quyền", ctx: "Bệ hạ cầm dải lụa đỏ, {name} nhắc ám hiệu dừng trước." },
        { hook: "core.lua_do_b", name: "Dải lụa đỏ – nàng nắm quyền", ctx: "{name} cầm dải lụa đỏ, đêm nay nàng làm chủ, có ám hiệu dừng." },
      ],
    },
    {
      group: "7. Trụy lạc nặng",
      items: [
        { hook: "core.cuu_phi_mot_dem", name: "Cửu Phi một đêm", ctx: "Chín phi tần, chín màu lụa, cùng một đêm: {names}." },
        { hook: "core.ngu_hoa", name: "Ngũ Hoa", ctx: "Năm phi được phong Ngũ Hoa, chỉ thị tẩm cùng nhau: {names}." },
        { hook: "core.tuu_tri_hoi", name: "Tửu Trì Hội", ctx: "Hồ rượu giữa cung, ba ngày ba đêm cùng {names}." },
        { hook: "core.duc_tri_tap_the", name: "Dục Trì tập thể", ctx: "Cửa hồ ôn tuyền mở cho cả hậu cung: {names}." },
        { hook: "core.thuyen_hoa_ba_ngay", name: "Thuyền hoa ba ngày", ctx: "Thuyền rồng ba ngày không cập bến cùng {names}." },
        { hook: "core.dem_ty_muoi", name: "Đêm Tỷ Muội", ctx: "Các cặp đối thực tự tổ chức, bệ hạ là khách duy nhất: {names}." },
        { hook: "core.doi_thuc_tam_nguoi", name: "Đối thực – ba người", ctx: "Một cặp đối thực ({names}) được bệ hạ cho phép cùng hầu." },
      ],
    },
    {
      group: "8. Khung Sự nóng bỏng",
      items: ["phuc_dich", "tu_do", "kiem_che", "long_chung", "xoa_bop", "nghi_thuc", "y_phuc_goi", "doi_thuc_nong", "gameshow", "troi_buoc", "khan_gia", "tan_phi"].map((g) => ({
        hook: "khung-nong-bong." + g,
        name: g,
        ctx: "Nhóm sở thích \"{fetish}\" với {names}. Mọi người đã đồng ý.",
        nameFromFetish: "khung-nong-bong." + g,
      })),
    },
  ];
  G.sceneCatalogItem = (hook) => {
    for (const g of G.SCENE_CATALOG) for (const it of g.items) if (it.hook === hook) return it;
    return null;
  };

  /* ---------------- Kho chữ ---------------- */
  let packTexts = {}; // từ scene-texts.json của các gói
  G.addPackSceneTexts = function (data) {
    for (const [hook, byKey] of Object.entries(data || {})) {
      packTexts[hook] = packTexts[hook] || {};
      for (const [key, byLv] of Object.entries(byKey)) {
        packTexts[hook][key] = packTexts[hook][key] || {};
        for (const [lv, arr] of Object.entries(byLv)) packTexts[hook][key][lv] = (packTexts[hook][key][lv] || []).concat(arr);
      }
    }
  };
  G.customTexts = () => G.storage.get(KEY, {});
  G.setCustomTexts = (lst) => G.storage.set(KEY, lst);

  /** Lưu các đoạn cho một ô (hook, khóa, mức). Thay toàn bộ nội dung cũ của ô đó. */
  G.saveSceneTexts = function (hook, key, lv, parts) {
    const all = G.customTexts();
    all[hook] = all[hook] || {};
    all[hook][key] = all[hook][key] || {};
    if (parts.length) all[hook][key][lv] = parts;
    else delete all[hook][key][lv];
    G.setCustomTexts(all);
    G.installSceneTexts();
  };
  G.getSceneTexts = (hook, key, lv) => ((G.customTexts()[hook] || {})[key] || {})[lv] || [];

  /** Tách văn bản dán vào thành các đoạn: phân cách bằng dòng "---" (hoặc dòng trống đôi nếu không có ---). */
  G.splitParts = function (raw) {
    const t = String(raw || "").replace(/\r/g, "").trim();
    if (!t) return [];
    const byDash = t.split(/\n\s*-{3,}\s*\n/);
    const parts = byDash.length > 1 ? byDash : [t];
    return parts.map((p) => p.replace(/^\s*(đoạn|biến thể)\s*\d+\s*[:.]\s*/i, "").trim()).filter(Boolean);
  };

  function levelOf(p) {
    return p.nights === 0 ? "dau" : p.nights > 20 ? "lau" : "quen";
  }
  function fillText(t, ctx) {
    const names = ctx.participants.map((p) => p.name);
    const list = names.length <= 1 ? names.join("") : names.slice(0, -1).join(", ") + " và " + names[names.length - 1];
    const fet = ctx.fetish.map((f) => (G.registry.fetishes[f] || {}).name || f).join(", ");
    return t.replace(/\{name\}/g, names[0] || "nàng").replace(/\{names\}/g, list).replace(/\{emperor\}/g, ctx.emperor.name).replace(/\{fetish\}/g, fet);
  }

  /** Tìm chữ phù hợp cho một lần gọi HOOK. */
  function findText(hook, ctx) {
    const item = G.sceneCatalogItem(hook) || { by: "none" };
    const p = ctx.participants[0] || {};
    const lvs = item.levels ? [levelOf(p), "quen", "_"] : ["_"];
    const keys = item.by === "char" ? [p.id, "_chung"] : item.by === "fetish" ? [...ctx.fetish, "_chung"] : ["_chung"];
    for (const src of [G.customTexts(), packTexts]) {
      const byKey = src[hook];
      if (!byKey) continue;
      for (const k of keys) {
        if (!byKey[k]) continue;
        for (const lv of lvs) {
          const arr = byKey[k][lv];
          if (arr && arr.length) return arr[Math.floor(Math.random() * arr.length)];
        }
      }
    }
    return null;
  }

  const installed = {};
  /** Đăng ký đè các HOOK có chữ; giữ lại cảnh cũ để dùng khi chưa có chữ phù hợp. */
  G.installSceneTexts = function () {
    const hooks = new Set([...Object.keys(G.customTexts()), ...Object.keys(packTexts)]);
    for (const hook of hooks) {
      if (installed[hook]) continue;
      const prev = G.hooks.resolve(hook);
      installed[hook] = true;
      G.hooks.register(
        hook,
        (ctx) => {
          const t = findText(hook, ctx);
          if (t) {
            const item = G.sceneCatalogItem(hook);
            const title = item ? (ctx.participants.length > 1 ? `${item.name} · ${ctx.participants.length} người` : `${item.name} · ${(ctx.participants[0] || {}).name || ""}`) : hook;
            return { title, text: fillText(t, ctx) };
          }
          return prev ? prev.fn(ctx) : null;
        },
        "cảnh viết tay"
      );
    }
  };

  /** Prompt dán sang AI khác. */
  G.buildScenePrompt = function (hook, key, lv) {
    const item = G.sceneCatalogItem(hook) || { name: hook, ctx: "" };
    const R = G.registry;
    let who = "";
    let ctxLine = item.ctx;
    if (item.by === "char") {
      const c = R.characters[key];
      if (c) {
        who = `Nhân vật: ${c.name}, ${c.age} tuổi. ${c.origin}. Tính cách: ${(c.traits || []).join(", ")}. Câu cửa miệng: "${(c.lines || {}).high || ""}"`;
        ctxLine = ctxLine.replace(/\{name\}/g, c.name);
      } else {
        who = "Nhân vật: một phi tần bất kỳ (từ 18 tuổi trở lên). Dùng {name} ở chỗ cần tên nàng, game sẽ tự thay.";
      }
    } else if (item.by === "fetish") {
      const f = R.fetishes[key];
      ctxLine = ctxLine.replace(/\{fetish\}/g, f ? `${f.name} (${f.desc || ""})` : "sở thích của đêm nay");
      who = "Nhân vật: một phi tần bất kỳ (từ 18 tuổi trở lên). Dùng {name} ở chỗ cần tên nàng, game sẽ tự thay.";
    } else {
      who = "Dùng {name} cho người chính, {names} cho danh sách tất cả người tham gia; game sẽ tự thay. Số người có thể khác nhau mỗi lần.";
      if (item.nameFromFetish && R.fetishes[item.nameFromFetish]) ctxLine = ctxLine.replace(/\{fetish\}/g, R.fetishes[item.nameFromFetish].name + " — " + (R.fetishes[item.nameFromFetish].desc || ""));
    }
    const lvText = { dau: "Đây là đêm đầu tiên của hai người.", quen: "Hai người đã gần gũi vài lần.", lau: "Hai người đã gắn bó rất lâu, hơn hai mươi đêm." }[lv] || "";
    return [
      "Viết cho tôi 3 đoạn văn ngắn, mỗi đoạn là một phiên bản khác nhau của cùng một cảnh trong game mô phỏng hậu cung cổ trang Trung Hoa (hư cấu, dành cho người lớn).",
      "",
      `Cảnh: ${item.name}.`,
      `Tình huống: ${ctxLine}`,
      who,
      lvText,
      "Người chơi là hoàng đế, gọi là \"bệ hạ\". Mọi nhân vật đều là người trưởng thành từ 18 tuổi trở lên và hoàn toàn tự nguyện.",
      "",
      "Yêu cầu:",
      "- Tiếng Việt, văn phong cổ trang, mỗi đoạn 100 đến 200 chữ.",
      "- Lời thoại của nhân vật đặt trên một dòng riêng, bắt đầu bằng dấu > và một khoảng trắng.",
      "- Ngăn cách các đoạn bằng một dòng chỉ có ba gạch: ---",
      "- Chỉ trả về 3 đoạn văn, không tiêu đề, không giải thích, không đánh số.",
    ]
      .filter((x) => x !== "")
      .join("\n")
      .replace("Yêu cầu:", "\nYêu cầu:");
  };

  /** Mã để mang chữ đã viết sang máy khác hoặc gửi cho người khác. */
  G.exportSceneTexts = () => JSON.stringify(G.customTexts(), null, 1);
  G.importSceneTexts = function (raw) {
    try {
      const data = JSON.parse(raw);
      const all = G.customTexts();
      for (const [hook, byKey] of Object.entries(data)) for (const [k, byLv] of Object.entries(byKey)) for (const [lv, arr] of Object.entries(byLv)) {
        if (!Array.isArray(arr)) continue;
        all[hook] = all[hook] || {};
        all[hook][k] = all[hook][k] || {};
        all[hook][k][lv] = arr.map(String);
      }
      G.setCustomTexts(all);
      G.installSceneTexts();
      return true;
    } catch (e) {
      return false;
    }
  };
  G.countSceneTexts = function () {
    let n = 0;
    for (const byKey of Object.values(G.customTexts())) for (const byLv of Object.values(byKey)) for (const arr of Object.values(byLv)) n += arr.length;
    return n;
  };
})();
