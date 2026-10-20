#!/usr/bin/env node
/*
 * Kiểm tra các gói nội dung trước khi phát hành.
 * Dùng: node tools/validate.js            (kiểm tra mọi gói trong packs/index.json)
 *       node tools/validate.js ten-goi    (chỉ kiểm tra một thư mục gói, vẫn nạp các gói nó phụ thuộc)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const PACKS = path.join(ROOT, "packs");
const MIN_AGE = 18;
const CONSENT = ["willing", "persuade", "refuse"];

let errors = 0;
let warnings = 0;
const err = (p, m) => (errors++, console.log(`  ✗ [${p}] ${m}`));
const warn = (p, m) => (warnings++, console.log(`  ! [${p}] ${m}`));

function readJSON(file, pack) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err(pack, `${path.relative(ROOT, file)}: ${e.message}`);
    return null;
  }
}

const all = { characters: {}, fetishes: {}, events: {}, hooksUsed: [], hooksRegistered: new Set() };

function collectHooks(file, packId) {
  const code = fs.readFileSync(file, "utf8");
  const Game = {
    hooks: { register: (id) => all.hooksRegistered.add(id) },
    asset: (_p, rel) => rel,
    registry: { fetishes: {} },
  };
  try {
    vm.runInNewContext(code, { window: { Game }, Game, console });
  } catch (e) {
    err(packId, `scenes.js lỗi khi chạy: ${e.message}`);
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
  for (const [k, f] of Object.entries(files)) if (!fs.existsSync(path.join(dir, f))) err(id, `files.${k}: không thấy ${f}`);

  const load = (k) => (files[k] && fs.existsSync(path.join(dir, files[k])) ? readJSON(path.join(dir, files[k]), id) : null);

  for (const f of load("fetishes") || []) {
    if (!f.id) err(id, "sở thích thiếu id");
    else if (!f.id.startsWith(prefix)) warn(id, `sở thích ${f.id} thiếu tiền tố ${prefix}`);
    if (!f.name) err(id, `sở thích ${f.id} thiếu name`);
    if (f.tier && ![1, 2, 3].includes(f.tier)) warn(id, `sở thích ${f.id}: tier nên là 1, 2 hoặc 3`);
    if (f.default_consent && !CONSENT.includes(f.default_consent)) err(id, `sở thích ${f.id}: default_consent sai`);
    all.fetishes[f.id] = f;
  }

  for (const c of load("characters") || []) {
    if (!c.id) err(id, "nhân vật thiếu id");
    else if (!c.id.startsWith(prefix)) warn(id, `nhân vật ${c.id} thiếu tiền tố ${prefix}`);
    if (typeof c.age !== "number") err(id, `nhân vật ${c.id}: thiếu age (số)`);
    else if (c.age < MIN_AGE) err(id, `nhân vật ${c.id}: tuổi ${c.age} dưới ${MIN_AGE}, sẽ bị lõi từ chối`);
    if (!c.name) err(id, `nhân vật ${c.id} thiếu name`);
    for (const [fid, lvl] of Object.entries(c.consent || {})) if (!CONSENT.includes(lvl)) err(id, `nhân vật ${c.id}: consent "${fid}" = "${lvl}" không hợp lệ`);
    if (c.portrait && c.portrait.image && !/^(https?:|data:)/.test(c.portrait.image) && !fs.existsSync(path.join(dir, c.portrait.image)))
      warn(id, `nhân vật ${c.id}: không thấy ảnh ${c.portrait.image}`);
    all.characters[c.id] = c;
  }

  for (const e of load("events") || []) {
    if (!e.id) err(id, "sự kiện thiếu id");
    else if (!e.id.startsWith(prefix)) warn(id, `sự kiện ${e.id} thiếu tiền tố ${prefix}`);
    if (!Array.isArray(e.choices) || !e.choices.length) err(id, `sự kiện ${e.id}: không có lựa chọn`);
    all.events[e.id] = Object.assign({ _pack: id }, e);
  }

  if (files.scenes && fs.existsSync(path.join(dir, files.scenes))) collectHooks(path.join(dir, files.scenes), id);
}

function crossCheck() {
  console.log("\n▸ Kiểm tra tham chiếu");
  for (const c of Object.values(all.characters)) {
    for (const f of Object.keys(c.consent || {})) if (!all.fetishes[f]) warn("tham chiếu", `${c.id}: consent nói tới sở thích không tồn tại "${f}"`);
    for (const f of c.likes || []) if (!all.fetishes[f]) warn("tham chiếu", `${c.id}: likes nói tới sở thích không tồn tại "${f}"`);
  }
  for (const e of Object.values(all.events)) {
    if (e.speaker && e.speaker !== "random" && !all.characters[e.speaker]) err(e._pack, `${e.id}: speaker "${e.speaker}" không tồn tại`);
    const w = e.when || {};
    for (const k of ["hasConsort", "notConsort"]) if (w[k] && !all.characters[w[k]]) err(e._pack, `${e.id}: when.${k} "${w[k]}" không tồn tại`);
    (e.choices || []).forEach((ch, i) => {
      const where = `${e.id} lựa chọn ${i + 1}`;
      if (!ch.label) err(e._pack, `${where}: thiếu label`);
      for (const f of ch.fetish || []) if (!all.fetishes[f]) err(e._pack, `${where}: sở thích "${f}" không tồn tại`);
      const fx = ch.effects || {};
      for (const a of [].concat(fx.addConsort || [])) if (!all.characters[a]) err(e._pack, `${where}: addConsort "${a}" không tồn tại`);
      if (fx.addConsortSpeaker && (!e.speaker || e.speaker === "random")) warn(e._pack, `${where}: addConsortSpeaker cần speaker cụ thể`);
      for (const [f, lvl] of Object.entries(fx.consent || {})) {
        if (!all.fetishes[f]) warn(e._pack, `${where}: effects.consent nói tới sở thích không tồn tại "${f}"`);
        if (!CONSENT.includes(lvl)) err(e._pack, `${where}: effects.consent "${lvl}" không hợp lệ`);
      }
      if (ch.hook) all.hooksUsed.push({ hook: ch.hook, where, pack: e._pack });
    });
  }
  const reg = [...all.hooksRegistered];
  const covered = (h) => reg.includes(h) || reg.some((r) => r.endsWith("*") && h.startsWith(r.slice(0, -1)));
  for (const u of all.hooksUsed) if (!covered(u.hook)) warn(u.pack, `${u.where}: HOOK "${u.hook}" chưa có cảnh đăng ký (sẽ dùng cảnh mặc định)`);
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
