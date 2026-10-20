#!/usr/bin/env node
/*
 * Kiểm tra các gói nội dung trước khi phát hành.
 * Dùng: node tools/validate.js            (kiểm tra mọi gói trong packs/index.json)
 *       node tools/validate.js ten-goi    (thêm một thư mục gói chưa có trong index.json)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const PACKS = path.join(ROOT, "packs");
const MIN_AGE = 18;
const CONSENT = ["willing", "persuade", "refuse"];
const LIST_KINDS = ["characters", "events", "fetishes", "contests", "gifts", "buildings", "regions"];
const SPEAKERS = ["random", "child", "pair"];

let errors = 0;
let warnings = 0;
const err = (p, m) => (errors++, console.log(`  ✗ [${p}] ${m}`));
const warn = (p, m) => (warnings++, console.log(`  ! [${p}] ${m}`));
const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

function readJSON(file, pack) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err(pack, `${path.relative(ROOT, file)}: ${e.message}`);
    return null;
  }
}

const sceneTexts = []; // { pack, file, hook, key, lv, n }
const all = { characters: {}, fetishes: {}, events: {}, contests: {}, gifts: {}, buildings: {}, regions: {}, hooksUsed: [], hooksRegistered: new Set() };

function collectHooks(file, packId) {
  const code = fs.readFileSync(file, "utf8");
  const Game = { hooks: { register: (id) => all.hooksRegistered.add(id) }, asset: (_p, rel) => rel, registry: { fetishes: {} } };
  try {
    vm.runInNewContext(code, { window: { Game }, Game, console });
  } catch (e) {
    err(packId, `${path.basename(file)} lỗi khi chạy: ${e.message}`);
  }
}

function checkPack(folder) {
  const dir = path.join(PACKS, folder);
  console.log(`\n▸ ${folder}`);
  const m = readJSON(path.join(dir, "manifest.json"), folder);
  if (!m) return;
  const id = m.id;
  if (!id || !/^[a-z0-9-]+$/.test(id)) err(folder, "manifest.id thiếu hoặc sai định dạng");
  if (id !== folder) warn(folder, `manifest.id "${id}" khác tên thư mục "${folder}"`);
  const prefix = id + ".";
  const files = m.files || {};
  for (const [k, v] of Object.entries(files)) for (const f of asList(v)) if (!fs.existsSync(path.join(dir, f))) err(id, `files.${k}: không thấy ${f}`);

  const load = (k) => {
    const out = [];
    for (const f of asList(files[k])) {
      const p = path.join(dir, f);
      if (!fs.existsSync(p)) continue;
      const d = readJSON(p, id);
      if (Array.isArray(d)) out.push(...d.map((x) => Object.assign({ _file: f }, x)));
      else if (d) err(id, `${f}: phải là một mảng JSON`);
    }
    return out;
  };

  const seen = new Set();
  const checkId = (kind, x) => {
    if (!x.id) return err(id, `${kind} thiếu id (${x._file})`), false;
    if (!x.id.startsWith(prefix)) warn(id, `${kind} ${x.id} thiếu tiền tố ${prefix}`);
    if (seen.has(x.id)) err(id, `id trùng: ${x.id}`);
    seen.add(x.id);
    return true;
  };

  for (const f of load("fetishes")) {
    if (!checkId("sở thích", f)) continue;
    if (!f.name) err(id, `sở thích ${f.id} thiếu name`);
    if (f.tier && ![1, 2, 3].includes(f.tier)) warn(id, `sở thích ${f.id}: tier nên là 1, 2 hoặc 3`);
    if (f.default_consent && !CONSENT.includes(f.default_consent)) err(id, `sở thích ${f.id}: default_consent sai`);
    all.fetishes[f.id] = f;
  }
  for (const c of load("characters")) {
    if (!checkId("nhân vật", c)) continue;
    if (typeof c.age !== "number") err(id, `nhân vật ${c.id}: thiếu age (số)`);
    else if (c.age < MIN_AGE) err(id, `nhân vật ${c.id}: tuổi ${c.age} dưới ${MIN_AGE}, sẽ bị lõi từ chối`);
    if (!c.name) err(id, `nhân vật ${c.id} thiếu name`);
    for (const [fid, lvl] of Object.entries(c.consent || {})) if (!CONSENT.includes(lvl)) err(id, `nhân vật ${c.id}: consent "${fid}" = "${lvl}" không hợp lệ`);
    if (c.portrait && c.portrait.image && !/^(https?:|data:)/.test(c.portrait.image) && !fs.existsSync(path.join(dir, c.portrait.image))) warn(id, `nhân vật ${c.id}: không thấy ảnh ${c.portrait.image}`);
    all.characters[c.id] = c;
  }
  for (const k of ["contests", "gifts", "buildings", "regions"]) {
    for (const x of load(k)) {
      if (!checkId(k, x)) continue;
      if (!x.name) err(id, `${k} ${x.id} thiếu name`);
      if (k === "contests" && !x.hook) warn(id, `cuộc thi ${x.id} không có hook`);
      if (k === "contests" && x.hook) all.hooksUsed.push({ hook: x.hook, where: x.id, pack: id });
      all[k][x.id] = Object.assign({ _pack: id }, x);
    }
  }
  for (const e of load("events")) {
    if (!checkId("sự kiện", e)) continue;
    if (!Array.isArray(e.choices) || !e.choices.length) err(id, `sự kiện ${e.id}: không có lựa chọn`);
    all.events[e.id] = Object.assign({ _pack: id }, e);
  }
  for (const f of asList(files.scenes)) if (fs.existsSync(path.join(dir, f))) collectHooks(path.join(dir, f), id);

  // Cảnh viết bằng JSON
  for (const f of asList(files.sceneTexts)) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) continue;
    const d = readJSON(p, id);
    if (!d) continue;
    if (typeof d !== "object" || Array.isArray(d)) {
      err(id, `${f}: phải là một khối { "hook": {...} }`);
      continue;
    }
    for (const [hook, byKey] of Object.entries(d)) {
      if (hook.startsWith("_")) continue;
      if (typeof byKey !== "object" || Array.isArray(byKey)) {
        err(id, `${f} / ${hook}: phải là một khối {...}`);
        continue;
      }
      for (const [key, byLv] of Object.entries(byKey)) {
        if (key === "_title" || (key.startsWith("_") && key !== "_chung")) continue;
        if (typeof byLv !== "object" || Array.isArray(byLv)) {
          err(id, `${f} / ${hook} / ${key}: phải có dạng { "dau": [...], "quen": [...], "lau": [...] } hoặc { "_": [...] }`);
          continue;
        }
        for (const [lv, arr] of Object.entries(byLv)) {
          if (!["dau", "quen", "lau", "_"].includes(lv)) err(id, `${f} / ${hook} / ${key}: mức "${lv}" không hợp lệ (chỉ dau, quen, lau, _)`);
          if (!Array.isArray(arr)) {
            err(id, `${f} / ${hook} / ${key} / ${lv}: phải là danh sách [...]`);
            continue;
          }
          arr.forEach((t, i) => {
            if (typeof t !== "string") return err(id, `${f} / ${hook} / ${key} / ${lv} #${i + 1}: phải là chuỗi chữ`);
            const bad = (t.match(/\{[^}]*\}/g) || []).filter((x) => !["{name}", "{names}", "{emperor}", "{fetish}"].includes(x));
            if (bad.length) warn(id, `${f} / ${hook} / ${key} #${i + 1}: biến lạ ${bad.join(", ")} (chỉ dùng {name} {names} {emperor} {fetish})`);
          });
          sceneTexts.push({ pack: id, file: f, hook, key, lv, n: arr.length });
        }
      }
    }
  }
}

function crossCheck() {
  console.log("\n▸ Kiểm tra tham chiếu");
  const F = all.fetishes;
  for (const c of Object.values(all.characters)) {
    for (const f of Object.keys(c.consent || {})) if (!F[f]) warn("tham chiếu", `${c.id}: consent nói tới sở thích không tồn tại "${f}"`);
    for (const f of c.likes || []) if (!F[f]) warn("tham chiếu", `${c.id}: likes nói tới sở thích không tồn tại "${f}"`);
    for (const o of Object.keys(c.affinity || {})) if (!all.characters[o]) warn("tham chiếu", `${c.id}: affinity nói tới nhân vật không tồn tại "${o}"`);
  }
  for (const f of Object.values(F)) {
    for (const [cid, lvl] of Object.entries(f.consent || {})) {
      if (!all.characters[cid]) warn("tham chiếu", `${f.id}: consent nói tới nhân vật không tồn tại "${cid}"`);
      if (!CONSENT.includes(lvl)) err("tham chiếu", `${f.id}: consent "${cid}" = "${lvl}" không hợp lệ`);
    }
    for (const [t, lvl] of Object.entries(f.consentByTrait || {})) if (!CONSENT.includes(lvl)) err("tham chiếu", `${f.id}: consentByTrait "${t}" = "${lvl}" không hợp lệ`);
  }
  for (const f of Object.values(F)) for (const cb of f.combos || []) if (!F[cb.with]) err("tham chiếu", `${f.id}: combo với sở thích không tồn tại "${cb.with}"`);
  for (const f of Object.values(F)) for (const cb of f.combos || []) all.hooksUsed.push({ hook: cb.hook, where: f.id + " combo", pack: "?" });
  for (const ct of Object.values(all.contests)) for (const f of ct.fetish || []) if (!F[f]) err(ct._pack, `${ct.id}: sở thích "${f}" không tồn tại`);

  const checkWhenRefs = (w, where, pack) => {
    if (!w) return;
    for (const k of ["hasConsort", "notConsort"]) for (const c of asList(w[k])) if (!all.characters[c]) err(pack, `${where}: ${k} "${c}" không tồn tại`);
    for (const k of ["building", "notBuilding"]) for (const b of asList(w[k])) if (!all.buildings[b]) err(pack, `${where}: ${k} "${b}" không tồn tại`);
    for (const f of Object.keys(w.fetishLevel || {})) if (!F[f]) err(pack, `${where}: fetishLevel "${f}" không tồn tại`);
    for (const f of asList(w.fetishUnlocked)) if (!F[f]) err(pack, `${where}: fetishUnlocked "${f}" không tồn tại`);
  };

  for (const e of Object.values(all.events)) {
    const sp = e.speaker;
    if (sp && !SPEAKERS.includes(sp) && !all.characters[sp]) err(e._pack, `${e.id}: speaker "${sp}" không tồn tại`);
    checkWhenRefs(e.when, e.id, e._pack);
    (e.choices || []).forEach((ch, i) => {
      const where = `${e.id} lựa chọn ${i + 1}`;
      if (!ch.label) err(e._pack, `${where}: thiếu label`);
      checkWhenRefs(ch.requires, where, e._pack);
      for (const f of ch.fetish || []) if (!F[f]) err(e._pack, `${where}: sở thích "${f}" không tồn tại`);
      if (sp === "child" && ch.hook) err(e._pack, `${where}: sự kiện của con cái không được gọi HOOK (lõi sẽ từ chối cả sự kiện)`);
      if (Array.isArray(ch.participants)) for (const p of ch.participants) if (!all.characters[p]) err(e._pack, `${where}: participants "${p}" không tồn tại`);
      const groupSize = ch.participants === "pair" ? 2 : Array.isArray(ch.participants) ? ch.participants.length : ch.participants && ch.participants.count ? ch.participants.count : 1;
      if (ch.hook && groupSize > 1 && !(ch.fetish || []).length && !e.id.startsWith("sys."))
        warn(e._pack, `${where}: cảnh nhiều người nhưng không có "fetish" nào; nên thêm một sở thích (ví dụ core.ngam_nhin) để mọi người tham gia phải sẵn lòng`);
      const fx = ch.effects || {};
      for (const a of asList(fx.addConsort)) if (!all.characters[a]) err(e._pack, `${where}: addConsort "${a}" không tồn tại`);
      for (const a of Object.keys(fx.favorConsort || {})) if (!all.characters[a]) err(e._pack, `${where}: favorConsort "${a}" không tồn tại`);
      for (const b of asList(fx.building)) if (!all.buildings[b]) err(e._pack, `${where}: building "${b}" không tồn tại`);
      if (fx.addConsortSpeaker && (!sp || SPEAKERS.includes(sp))) warn(e._pack, `${where}: addConsortSpeaker cần speaker là một nhân vật cụ thể`);
      if ((fx.closeness || fx.teacher || fx.educate || fx.marry || fx.motherFavor) && sp !== "child") warn(e._pack, `${where}: hệ quả của con cái nhưng speaker không phải "child"`);
      if ((fx.tinhY || fx.favor2 || fx.removePair) && sp !== "pair") warn(e._pack, `${where}: hệ quả của đối thực nhưng speaker không phải "pair"`);
      for (const [f, lvl] of Object.entries(fx.consent || {})) {
        if (!F[f]) warn(e._pack, `${where}: effects.consent nói tới sở thích không tồn tại "${f}"`);
        if (!CONSENT.includes(lvl)) err(e._pack, `${where}: effects.consent "${lvl}" không hợp lệ`);
      }
      if (ch.hook) all.hooksUsed.push({ hook: ch.hook, where, pack: e._pack });
    });
  }
  const reg = [...all.hooksRegistered];
  // Cảnh JSON: khóa phải là nhân vật, sở thích hoặc _chung; HOOK phải có thật
  const knownHooks = new Set([...all.hooksUsed.map((u) => u.hook), ...reg]);
  const isKnownHook = (h) => knownHooks.has(h) || reg.some((r) => r.endsWith("*") && h.startsWith(r.slice(0, -1)));
  const seenHook = new Set();
  let written = 0;
  for (const st of sceneTexts) {
    written += st.n;
    if (st.key !== "_chung" && !all.characters[st.key] && !F[st.key]) warn(st.pack, `${st.file} / ${st.hook}: khóa "${st.key}" không phải nhân vật hay sở thích nào (game sẽ không dùng tới)`);
    if (!seenHook.has(st.hook) && !isKnownHook(st.hook)) warn(st.pack, `${st.file}: HOOK "${st.hook}" không có sự kiện nào gọi (game sẽ không dùng tới)`);
    seenHook.add(st.hook);
  }
  if (sceneTexts.length) console.log(`\n  Cảnh viết bằng JSON: ${written} đoạn.`);
  const textHooks = new Set(sceneTexts.filter((st) => st.n > 0).map((st) => st.hook));
  const covered = (h) => reg.includes(h) || textHooks.has(h) || reg.some((r) => r.endsWith("*") && h.startsWith(r.slice(0, -1)));
  for (const u of all.hooksUsed) if (!covered(u.hook)) warn(u.pack, `${u.where}: HOOK "${u.hook}" chưa có cảnh đăng ký (sẽ dùng cảnh mặc định)`);
  console.log(
    `\n  ${Object.keys(all.characters).length} nhân vật · ${Object.keys(all.events).length} sự kiện · ${Object.keys(F).length} sở thích · ${Object.keys(all.contests).length} cuộc thi · ${Object.keys(all.gifts).length} quà · ${Object.keys(all.buildings).length} công trình · ${Object.keys(all.regions).length} vùng · ${reg.length} HOOK`
  );
}

function main() {
  const index = readJSON(path.join(PACKS, "index.json"), "index");
  if (!index) process.exit(1);
  let list = index.packs || [];
  const only = process.argv[2];
  if (only && !list.includes(only)) list = list.concat(only);
  for (const folder of list) checkPack(folder);
  crossCheck();
  console.log(`\n${errors} lỗi, ${warnings} cảnh báo.`);
  process.exit(errors ? 1 : 0);
}

main();
