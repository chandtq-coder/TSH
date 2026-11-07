import { STARS, STAR_ORDER, FIELD_LABELS, DOMAINS, COMBOS, HEAL, HEAL_NUMBERS, CARRIER_NOTE } from "./data.js";
import { CARRIERS, carrierById } from "./carriers.js";
import { analyze, analyzePhone, analyzeCCCD, compatibility, formatPhone, digitsOnly, normalizePhone, summarize, levelOf } from "./engine.js";
import { parseList, fmtPrice } from "./listparse.js";
import { generateLucky, stationsFor, parseDateInput, dateLabel, WEEKDAYS, XSMN } from "./lucky.js";
import { GOALS, generateForCarrier, generateAll, carrierPrefixInfo } from "./generator.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const state = { tab: "lookup", mode: "phone", seed: 1, suggest: null, cccdForSuggest: null };

/* ------------------------------------------------------------------ định dạng ---- */
const MODES = {
  phone: { label: "Số điện thoại (10 số)", placeholder: "0912 345 678", max: 12, hint: "SĐT di động Việt Nam, có thể gõ dạng +84. Ứng dụng tự nhận nhà mạng theo đầu số." },
  cccd: { label: "Căn cước công dân (12 số)", placeholder: "079 0 88 012345", max: 12, hint: "Đủ 12 số. Ứng dụng đọc mã tỉnh, giới tính, năm sinh rồi phân tích toàn bộ dãy số." },
  seq: { label: "Dãy số bất kỳ", placeholder: "Số tài khoản, biển số, số nhà…", max: 24, hint: "Cần ít nhất hai chữ số khác 0 và 5. Mọi quy tắc cặp số vẫn áp dụng như với SĐT." },
};

function formatInput(mode, digits) {
  if (mode === "phone" && digits.startsWith("0")) {
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10)].filter(Boolean).join(" ");
  }
  if (mode === "cccd") return [digits.slice(0, 3), digits.slice(3, 4), digits.slice(4, 6), digits.slice(6, 12)].filter(Boolean).join(" ");
  return digits;
}

function bindNumberInput(input, getMode, max) {
  input.addEventListener("input", () => {
    const m = typeof getMode === "function" ? getMode() : getMode;
    const d = digitsOnly(input.value).slice(0, typeof max === "function" ? max() : max);
    input.value = formatInput(m, d);
  });
}

/* ------------------------------------------------------------------ thành phần UI ---- */
const toneBadge = (t) => (t === "muted" ? "neutral" : t);

function gauge(score, tone, label = "/100") {
  const r = 44;
  const c = 2 * Math.PI * r;
  return `<svg class="gauge ${tone}" viewBox="0 0 100 100" role="img" aria-label="Điểm ${score} trên 100">
    <circle class="g-bg" cx="50" cy="50" r="${r}"/>
    <circle class="g-fg" cx="50" cy="50" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - score / 100)).toFixed(1)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="54" text-anchor="middle" class="g-num">${score}</text>
    <text x="50" y="68" text-anchor="middle" class="g-sub">${esc(label)}</text></svg>`;
}

const chip = (id, text) => `<span class="chip st-${id}"><i class="dot"></i>${esc(text ?? STARS[id].name)}</span>`;

function domainBars(domains) {
  return `<div class="bars">${Object.entries(DOMAINS).map(([k, def]) => {
    const v = domains[k];
    const t = v >= 70 ? "good" : v >= 55 ? "ok" : v >= 42 ? "warn" : "bad";
    return `<div class="bar ${t}"><span>${def.label}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><b>${v}</b></div>`;
  }).join("")}</div>`;
}

function digitsRow(res, groups) {
  const bounds = new Set();
  if (groups) { let a = 0; groups.slice(0, -1).forEach((g) => { a += g; bounds.add(a); }); }
  const n = res.cells.length;
  const cells = res.cells.map((c, i) => `${bounds.has(i) ? '<span class="dg gap"></span>' : ""}<span class="dg ${c.kind}${i >= n - 3 ? " tail" : ""}">${c.d}</span>`).join("");
  return `<div class="digits" role="img" aria-label="Dãy số ${res.digits}">${cells}</div>
    <p class="legend">Ba số cuối (gạch vàng) quan trọng nhất. Ô nét đứt là số 0/5 – không tạo từ trường riêng, chỉ làm “ẩn”/“hiện” cặp chứa nó.</p>`;
}

function pairsList(res) {
  const last = res.pairs.length - 1;
  return `<ul class="pairs">${res.pairs.map((p, i) => {
    const mods = [p.zero ? `0×${p.zero}` : "", p.five ? `5×${p.five}` : ""].filter(Boolean).join(" ");
    return `<li class="pair st-${p.star}${i === last ? " tail" : ""}"><span class="pn">${p.text}</span><b>${STARS[p.star].name}</b><small>cấp ${p.rank + 1}${mods ? " · " + mods : ""}</small>${p.healed ? '<span class="ok" title="Được hóa giải">✓</span>' : ""}</li>`;
  }).join("")}</ul>`;
}

function distribution(res) {
  const total = res.pairs.length || 1;
  const ids = STAR_ORDER.filter((id) => res.counts[id] > 0);
  return `<div class="dist" role="img" aria-label="Phân bố từ trường">${ids.map((id) => `<span class="st-${id}" style="flex:${res.counts[id]}"></span>`).join("")}</div>
    <div class="dist-legend">${ids.map((id) => chip(id, `${STARS[id].name} ×${res.counts[id]}`)).join("")}</div>`;
}

function flagsHtml(res) {
  const order = { bad: 0, warn: 1, good: 2, info: 3 };
  const icon = { bad: "✕", warn: "!", good: "✓", info: "i" };
  const list = [...res.flags].sort((a, b) => order[a.tone] - order[b.tone]);
  return `<ul class="flags">${list.map((f) => `<li class="flag ${f.tone}"><span class="ico" aria-hidden="true">${icon[f.tone]}</span><div><b>${esc(f.title)}</b><p>${esc(f.text)}</p></div></li>`).join("")}</ul>`;
}

function combosHtml(res) {
  if (!res.combos.length) return '<p class="empty">Chưa đủ cặp để xét tổ hợp.</p>';
  return `<ul class="combos">${res.combos.map((c) => {
    const a = res.pairs[c.at];
    const b = res.pairs[c.at + 1];
    return `<li class="combo"><div class="top">${chip(c.from)}<span class="arrow">→</span>${chip(c.to)}<span class="digs">${a.text} → ${b.text}</span></div>${esc(c.text)}</li>`;
  }).join("")}</ul>`;
}

function starCards(res) {
  const ids = STAR_ORDER.filter((id) => res.counts[id] > 0).sort((a, b) => res.counts[b] - res.counts[a]);
  return ids.map((id, i) => {
    const s = STARS[id];
    const ps = res.pairs.filter((p) => p.star === id).map((p) => p.text).join(", ");
    const rows = FIELD_LABELS.filter(([k]) => s[k]).map(([k, l]) => `<div><dt>${l}</dt><dd>${esc(s[k])}</dd></div>`).join("");
    return `<details class="star-card st-${id}"${i === 0 ? " open" : ""}><summary><span>${s.name}</span><span class="han">${s.han}</span><span class="tier">${s.tier} · ${s.element}</span><span class="muted">×${res.counts[id]} (${ps})</span></summary>
      <div class="body"><p><b>${esc(s.tag)}</b></p><dl>${rows}</dl><p class="poem">${s.ve.map(esc).join("<br>")}</p></div></details>`;
  }).join("");
}

function healHtml(res) {
  if (!res.heal.length) return "";
  const rows = res.heal.map((id) => `<div class="row">${chip(id)}<span class="muted">nên bổ sung các cặp</span><span class="nums">${STARS[id].pairs.map((g) => g[0]).join(" · ")}</span></div>`).join("");
  return `<section class="card"><h3>Gợi ý hóa giải</h3><p class="hint" style="margin-top:0">Hung tinh chưa có “hóa thần” đứng ngay sau. Giáo trình khuyên dùng số hậu thiên (SĐT mới) có các cát tinh sau để chế hóa:</p><div class="remedy">${rows}</div></section>`;
}

const DISCLAIMER = `<p class="disclaimer">Nội dung là diễn giải theo giáo trình “Thần Số Học Phương Đông” – thuộc văn hóa, tín ngưỡng dân gian, <b>không có cơ sở khoa học</b>. Đừng dùng làm căn cứ cho quyết định về sức khỏe, tài chính hay hôn nhân.</p>`;

function section(title, inner, extra = "") {
  return `<section class="card ${extra}"><h3>${title}</h3>${inner}</section>`;
}

function coreSections(res, { groups, showDomains = true } = {}) {
  if (!res.pairs.length) return section("Chưa đủ dữ liệu", `<p>Cần ít nhất hai chữ số khác 0 và 5 để tạo cặp từ trường.</p>`);
  const tp = res.tailPair;
  const tail = section("Ba số cuối – “kết quả” của dãy số", `<div class="tail-box">${chip(tp.star, `${STARS[tp.star].name} · ${tp.text}`)}<span class="muted">${esc(STARS[tp.star].tag)}</span></div>
    <p class="hint">Pháp tắc ba: năng lượng tập trung ở vị trí ba số đuôi và quyết định kết quả thực sự của dãy số.</p>`);
  return [
    section("Điểm nổi bật & lưu ý", flagsHtml(res)),
    section("Chuỗi từ trường (đọc từ trái sang phải)", digitsRow(res, groups) + pairsList(res) + distribution(res)),
    tail,
    section("Tổ hợp hai sao liền kề", combosHtml(res)),
    section("Diễn giải từng từ trường", starCards(res)),
    healHtml(res),
  ].join("");
}

/* ------------------------------------------------------------------ tra cứu ---- */
function setError(el, msg) {
  el.hidden = !msg;
  el.textContent = msg || "";
}

function renderPhoneResult(r, compat) {
  const carrier = r.carrier ? `<span class="badge neutral">${esc(r.carrier.name)}</span>` : `<span class="badge warn">Đầu số ${esc(r.phone.slice(0, 3))} chưa nhận diện</span>`;
  const head = `<section class="card"><div class="res-head"><div><div class="res-num">${formatPhone(r.phone)}</div>
    <div class="meta-row">${carrier}<span class="badge ${toneBadge(r.level.tone)}">${r.level.label}</span></div></div>${gauge(r.total, r.level.tone)}</div>
    <p class="summary">${esc(summarize(r))}</p>${domainBars(r.domains)}</section>`;
  let compatHtml = "";
  if (compat) {
    const lv = levelOf(compat.score);
    compatHtml = section("Tương hợp với CCCD của bạn", `<div class="res-head"><div><span class="badge ${toneBadge(lv.tone)}">${lv.label}</span></div>${gauge(compat.score, lv.tone)}</div>
      <ul class="flags" style="margin-top:10px">${compat.notes.map((n) => `<li class="flag ${n.tone}"><span class="ico" aria-hidden="true">${{ good: "✓", warn: "!", bad: "✕" }[n.tone]}</span><div><p style="color:inherit;margin:0">${esc(n.text)}</p></div></li>`).join("") || '<li class="empty">CCCD không có hung tinh cần chế hóa.</li>'}</ul>`);
  }
  return head + compatHtml + coreSections(r, { groups: [4, 3, 3] }) + DISCLAIMER;
}

function renderCCCDResult(c) {
  const { info, res } = c;
  const gender = info.gender === "nam" ? "Nam" : info.gender === "nu" ? "Nữ" : "";
  const facts = [
    info.province ? `Mã tỉnh ${info.provinceCode}: ${info.province}` : `Mã tỉnh ${info.provinceCode}`,
    gender && `Giới tính: ${gender}`,
    `Sinh năm ${info.birthYear} (${info.age} tuổi)`,
  ].filter(Boolean).map((t) => `<span class="badge neutral">${esc(t)}</span>`).join("");
  const head = `<section class="card"><div class="res-head"><div><div class="res-num">${esc(formatInput("cccd", info.digits))}</div><div class="facts">${facts}</div></div>
    ${gauge(res.total, res.level.tone, "TIÊN THIÊN")}</div><p class="summary">${esc(summarize(res))}. Đây là số tiên thiên bạn không đổi được; điểm chỉ mang tính tham khảo.</p>${domainBars(res.domains)}</section>`;

  let remedy = "";
  if (c.hung.length || c.missing.length) {
    const rows = [];
    c.hung.forEach((h) => rows.push(`<div class="row">${chip(h, `${STARS[h].name} ×${res.counts[h]}`)}<span class="muted">chế hóa bằng:</span>${(HEAL[h] || []).map((x) => chip(x)).join("")}<span class="nums">${HEAL_NUMBERS[h].join(" · ")}</span></div>`));
    c.missing.forEach((m) => rows.push(`<div class="row">${chip(m, `Thiếu ${STARS[m].name}`)}<span class="muted">nên bổ sung các cặp</span><span class="nums">${STARS[m].pairs.map((g) => g[0]).join(" · ")}</span></div>`));
    remedy = section("Hung tinh tiên thiên & cách bù bằng SĐT (hậu thiên)", `<p class="hint" style="margin-top:0">Giáo trình: dùng số hậu thiên để phá giải hung tinh tiên thiên; còn thiếu Sinh khí / Thiên y thì quý nhân, tài vận kém.</p><div class="remedy">${rows.join("")}</div>
      <div class="actions"><button type="button" class="btn primary" data-act="suggest-from-cccd">Đề xuất SĐT bù theo CCCD này</button></div>`);
  }

  let tl = "";
  if (c.timeline.length) {
    tl = section("Vận theo từng giai đoạn tuổi (tham khảo)", `<p class="hint" style="margin-top:0">Quy ước theo giáo trình: mỗi từ trường ứng một giai đoạn, giai đoạn đầu 10 năm, các giai đoạn sau mỗi 5 năm, hết dãy thì quay vòng.</p>
      <ul class="timeline">${c.timeline.slice(0, 14).map((t) => `<li class="tl${t.current ? " current" : ""}"${t.current ? ' aria-current="true"' : ""}><span class="age">${t.from}–${t.to} tuổi</span><span class="who">${chip(t.pair.star)}<span class="nums">${t.pair.text}</span>${t.current ? '<span class="badge good">hiện tại</span>' : ""}</span></li>`).join("")}</ul>`);
  }
  const warn = info.problems.length ? `<div class="card"><ul class="flags">${info.problems.map((p) => `<li class="flag warn"><span class="ico">!</span><div><b>${esc(p)}</b></div></li>`).join("")}</ul></div>` : "";
  return head + warn + remedy + coreSections(res, { groups: [3, 1, 2, 6] }) + tl + DISCLAIMER;
}

function renderSeqResult(res) {
  const head = `<section class="card"><div class="res-head"><div><div class="res-num">${esc(res.digits)}</div><div class="meta-row"><span class="badge ${toneBadge(res.level.tone)}">${res.level.label}</span></div></div>${gauge(res.total, res.level.tone)}</div>
    <p class="summary">${esc(summarize(res))}</p>${res.pairs.length ? domainBars(res.domains) : ""}</section>`;
  return head + coreSections(res, { groups: null }) + DISCLAIMER;
}

function currentGender() {
  const v = $('input[name="gender"]:checked')?.value;
  return v || null;
}

function runLookup() {
  const raw = $("#lookup-input").value;
  const out = $("#lookup-result");
  const err = $("#lookup-error");
  setError(err, "");
  const mode = state.mode;
  const digits = mode === "phone" ? normalizePhone(raw) : digitsOnly(raw);
  if (!digits) { setError(err, "Hãy nhập một dãy số."); return; }

  if (mode === "phone") {
    if (digits.length !== 10 || !digits.startsWith("0")) { setError(err, "SĐT di động Việt Nam gồm đúng 10 chữ số và bắt đầu bằng 0 (hoặc +84)."); out.innerHTML = ""; return; }
    const r = analyzePhone(digits, { gender: currentGender() });
    let compat = null;
    const cc = digitsOnly($("#compat-input").value);
    if (cc) {
      const c = analyzeCCCD(cc);
      if (c.info.digits.length === 12) compat = compatibility(c, r);
      else setError(err, "CCCD để so sánh cần đủ 12 số – phần tương hợp được bỏ qua.");
    }
    out.innerHTML = renderPhoneResult(r, compat);
  } else if (mode === "cccd") {
    if (digits.length !== 12) { setError(err, "CCCD gồm đúng 12 chữ số."); out.innerHTML = ""; return; }
    const c = analyzeCCCD(digits);
    state.cccdForSuggest = digits;
    out.innerHTML = renderCCCDResult(c);
  } else {
    if (digits.length < 3) { setError(err, "Nhập ít nhất 3 chữ số."); out.innerHTML = ""; return; }
    out.innerHTML = renderSeqResult(analyze(digits, { gender: currentGender() }));
  }
  out.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

function setMode(mode) {
  state.mode = mode;
  const m = MODES[mode];
  $$("#tab-lookup .seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
  $("#lookup-label").textContent = m.label;
  const inp = $("#lookup-input");
  inp.placeholder = m.placeholder;
  inp.value = "";
  $("#lookup-hint").textContent = m.hint;
  $("#gender-field").hidden = mode === "cccd";
  $("#compat-field").hidden = mode !== "phone";
  $("#privacy-note").hidden = mode !== "cccd" && mode !== "phone";
  $("#lookup-result").innerHTML = "";
  setError($("#lookup-error"), "");
}

/* ------------------------------------------------------------------ đề xuất ---- */
const FAV_KEY = "tsh.favs.v1";
function loadFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } }
function saveFavs(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch { /* bỏ qua */ } }

function numberCard(item) {
  const a = item.analysis;
  const favs = loadFavs();
  const isFav = favs.includes(item.number);
  const chain = a.pairs.map((p) => chip(p.star, `${STARS[p.star].name} ${p.text}`)).join("");
  const c = carrierById(item.carrierId);
  return `<article class="num-card" data-num="${item.number}">
    <div class="nc-top"><button type="button" class="nc-num" data-act="detail" aria-label="Xem diễn giải ${item.formatted}">${item.formatted}</button>
      <span class="badge ${toneBadge(a.level.tone)}">${a.total} · ${a.level.label}</span></div>
    <div class="nc-chain">${chain}</div>
    <ul class="nc-why">${item.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
    <p class="nc-tail">${c ? esc(c.name) : ""} · tìm theo đuôi <b>${item.number.slice(-4)}</b> tại kênh chính thức của nhà mạng${c?.shop ? " (bấm nút tìm sẽ tự chép đuôi, chỉ cần dán)" : ""}</p>
    <div class="nc-actions">
      <button type="button" class="btn ghost" data-act="detail">Xem diễn giải</button>
      <button type="button" class="btn ghost" data-act="copy">Sao chép</button>
      ${c?.shop ? `<a class="btn ghost" href="${c.shop.url}" target="_blank" rel="noopener noreferrer" data-act="shop" data-tail="${item.number.slice(-4)}">Tìm trên ${esc(c.shop.label)} ↗</a>` : ""}
      <button type="button" class="btn ghost" data-act="copytail">Sao chép đuôi ${item.number.slice(-4)}</button>
      <button type="button" class="btn ghost" data-act="fav" aria-pressed="${isFav}">${isFav ? "★ Đã lưu" : "☆ Lưu"}</button>
    </div></article>`;
}

function prefixChips(carrierId) {
  return `<div class="pfx" aria-label="Đầu số và từ trường tạo bởi đầu số">${carrierPrefixInfo(carrierId).map((p) => {
    const label = p.star ? `${p.prefix} · ${STARS[p.star].name}` : `${p.prefix} · trung tính`;
    return p.star ? chip(p.star, label) : `<span class="chip" style="--sc: var(--muted)"><i class="dot"></i>${esc(label)}</span>`;
  }).join("")}</div>`;
}

function readSuggestOptions() {
  const carrierId = $('input[name="carrier"]:checked')?.value || "all";
  const cccd = digitsOnly($("#suggest-cccd").value) || state.cccdForSuggest || "";
  let profile = null;
  if (cccd) {
    if (cccd.length !== 12) return { error: "CCCD để cá nhân hóa cần đủ 12 số (hoặc để trống)." };
    profile = analyzeCCCD(cccd);
  }
  const gender = $('input[name="sgender"]:checked')?.value || profile?.info.gender || null;
  return {
    carrierId, profile, gender,
    goal: $("#goal").value,
    tailStar: $("#tail").value || null,
    allowZeroFive: $("#allow05").checked,
    seed: state.seed,
  };
}

function runSuggest(newSeed = false) {
  const err = $("#suggest-error");
  setError(err, "");
  if (newSeed) state.seed = Math.floor(Math.random() * 1e9);
  const o = readSuggestOptions();
  if (o.error) { setError(err, o.error); return; }
  const out = $("#suggest-result");
  const note = `<p class="disclaimer">Các số dưới đây do ứng dụng <b>tạo theo quy tắc</b> (ưu tiên cát tinh, đuôi cát, tránh 0/5, có hóa thần…) để bạn tham khảo mẫu số đẹp. Số có thể đã được cấp hoặc không còn trong kho của nhà mạng; hãy tìm theo đuôi tại kênh chính thức (nút “Tìm trên…” mở trang chọn số của nhà mạng). ${esc(CARRIER_NOTE)}</p>`;
  let html = note;
  if (o.profile) html += `<p class="hint" style="margin:0 2px 10px">Đã cá nhân hóa theo CCCD: ưu tiên bù ${o.profile.needs.length ? o.profile.needs.map((s) => STARS[s].name).join(", ") : "—"}.</p>`;
  if (o.carrierId === "all") {
    generateAll({ ...o, perCarrier: 3 }).forEach(({ carrier, items }) => {
      html += `<div class="group-title"><h3>${esc(carrier.name)}</h3><span class="muted">${carrier.prefixes.join(" · ")}</span></div>${items.map(numberCard).join("") || '<p class="empty">Không tìm được số phù hợp.</p>'}`;
    });
  } else {
    const c = carrierById(o.carrierId);
    const items = generateForCarrier({ ...o, count: 10 });
    html += `<div class="group-title"><h3>${esc(c.name)}</h3><span class="muted">${items.length} số</span></div>${prefixChips(c.id)}${items.map(numberCard).join("") || '<p class="empty">Không tìm được số phù hợp.</p>'}`;
  }
  out.innerHTML = html;
  $("#suggest-more").hidden = false;
  state.suggest = o;
  out.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

function renderFavs() {
  const favs = loadFavs();
  $("#fav-count").textContent = String(favs.length);
  const box = $("#fav-list");
  if (!favs.length) { box.innerHTML = '<p class="empty">Chưa có số nào. Bấm “☆ Lưu” ở thẻ số bất kỳ.</p>'; return; }
  box.innerHTML = favs.map((n) => {
    const a = analyzePhone(n);
    const item = { number: n, formatted: formatPhone(n), analysis: a, carrierId: a.carrier?.id, reasons: [summarize(a)] };
    return numberCard(item);
  }).join("");
}

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.append(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* bỏ qua */ }
    ta.remove();
    return ok;
  }
}

function openDetail(num) {
  setTab("lookup");
  setMode("phone");
  $("#lookup-input").value = formatInput("phone", num);
  runLookup();
}

function onDelegatedClick(e) {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const card = btn.closest("[data-num]");
  const num = card?.dataset.num;
  switch (btn.dataset.act) {
    case "detail": openDetail(num); break;
    case "copy": copyText(num).then((ok) => { const old = btn.textContent; btn.textContent = ok ? "Đã sao chép ✓" : "Không sao chép được"; setTimeout(() => (btn.textContent = old), 1400); }); break;
    case "copytail": copyText(num.slice(-4)).then((ok) => { const old = btn.textContent; btn.textContent = ok ? "Đã sao chép ✓" : "Không sao chép được"; setTimeout(() => (btn.textContent = old), 1400); }); break;
    case "shop": copyText(btn.dataset.tail); break; // chép sẵn 4 số cuối để dán vào ô tìm của nhà mạng
    case "fav": {
      let favs = loadFavs();
      favs = favs.includes(num) ? favs.filter((x) => x !== num) : [num, ...favs].slice(0, 100);
      saveFavs(favs);
      $$(`[data-num="${num}"] [data-act="fav"]`).forEach((b) => { const f = favs.includes(num); b.setAttribute("aria-pressed", String(f)); b.textContent = f ? "★ Đã lưu" : "☆ Lưu"; });
      renderFavs();
      break;
    }
    case "suggest-from-cccd": {
      setTab("suggest");
      $("#suggest-cccd").value = formatInput("cccd", state.cccdForSuggest || "");
      $("#suggest-cccd-wrap").open = true;
      runSuggest(true);
      break;
    }
    default:
  }
}

/* ------------------------------------------------------------------ số may mắn (xổ số miền Nam) ---- */
const todayISO = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

function syncLuckyGender() {
  const d = digitsOnly($("#lucky-cccd").value);
  if (d.length !== 12) return;
  const g = analyzeCCCD(d).info.gender;
  const r = $(`input[name="lgender"][value="${g || ""}"]`);
  if (r) r.checked = true;
}

function renderStations() {
  const date = parseDateInput($("#lucky-date").value);
  const box = $("#lucky-stations");
  if (!date) { box.innerHTML = ""; $("#lucky-weekday").textContent = "—"; return; }
  $("#lucky-weekday").textContent = dateLabel(date);
  const prev = $('input[name="lstation"]:checked')?.value ?? "";
  const names = stationsFor(date);
  box.innerHTML = [`<label><input type="radio" name="lstation" value=""${prev === "" || !names.includes(prev) ? " checked" : ""}><span>Tất cả đài trong ngày</span></label>`]
    .concat(names.map((n) => `<label><input type="radio" name="lstation" value="${esc(n)}"${n === prev ? " checked" : ""}><span>${esc(n)}</span></label>`)).join("");
}

const scoreTone = (t) => (t >= 70 ? "good" : t >= 56 ? "ok" : "warn");

function prizeText(g) {
  return `Đài ${g.station}\n` + g.tiers.map((t) => `${t.name}: ${t.items.map((i) => i.number).join(" - ")}`).join("\n");
}

function stationCard(g) {
  const anchors = g.anchors.length ? `<div class="anchors">${[...new Map(g.anchors.map((a) => [a.digit, a])).values()].map((a) => `<span class="badge neutral">số ${a.digit}: ${esc(a.label)}</span>`).join("")}</div>` : "";
  const rows = g.tiers.map((t) => `<tr class="${t.key === "DB" ? "db" : ""}"><th scope="row">${esc(t.name)}<small>${t.digits} số${t.items.length > 1 ? ` × ${t.items.length}` : ""}</small></th>
    <td>${t.items.map((i) => `<span class="pn-num ${scoreTone(i.analysis.total)}" title="Điểm Bát tinh ${i.analysis.total} (${i.analysis.level.label})">${i.number}</span>`).join("")}</td></tr>`).join("");
  return `<section class="card prize-card"><div class="station-title" style="margin-top:0"><h3>Đài ${esc(g.station)}</h3><span class="muted">18 dãy số</span></div>
    <table class="prize-table"><caption class="sr-only">Bộ số may mắn đài ${esc(g.station)}</caption><tbody>${rows}</tbody></table>
    <h4>Độ phủ các sao trong bộ số</h4>
    <div class="dist-legend">${STAR_ORDER.map((id) => g.coverage[id] ? chip(id, `${STARS[id].name} ×${g.coverage[id]}`) : `<span class="chip" style="--sc: var(--muted); opacity:.55"><i class="dot"></i>${STARS[id].name} ×0</span>`).join("")}</div>
    <p class="hint" style="margin-top:6px">${g.fullCat ? "✓ Đủ cả 4 cát tinh: Sinh khí, Thiên y, Diên niên, Phục vị." : "Chưa đủ 4 cát tinh – bấm “Bộ số khác”."}</p>
    ${anchors}<p class="legend" style="margin-top:10px">Viền xanh: điểm Bát tinh cao · viền vàng: khá · viền cam: trung bình. Di chuột/giữ vào số để xem điểm.</p>
    <div class="nc-actions"><button type="button" class="btn ghost" data-copyset="${esc(prizeText(g))}">Sao chép cả bộ</button></div></section>`;
}

let luckyVariant = 0;
function basisPanel(r) {
  const rows = [];
  if (r.menh) {
    const sup = r.support.map((id) => STARS[id].name).join(", ") || "—";
    rows.push(`<div class="row"><b>Mệnh theo năm sinh ${r.menh.year}:</b> ${esc(r.menh.canChi)} → hành <b>${r.menh.element}</b> <span class="muted">(ước tính theo dương lịch, không thay luận bát tự)</span></div>
      <div class="row">Hành hỗ trợ: <b>${r.sinhTa}</b> (sinh ta) và <b>${r.menh.element}</b> (cùng hành) → ưu tiên sao <b>${esc(sup)}</b>; tránh hành <b>${r.khacTa}</b> (khắc ta).</div>`);
  } else {
    rows.push('<div class="row">Chưa nhập CCCD nên chưa xét mệnh và hung tinh tiên thiên. Nhập CCCD để cá nhân hóa đầy đủ.</div>');
  }
  const heal = r.profile && r.profile.hung.length ? r.profile.hung.map((h) => `${STARS[h].name} (chế hóa bằng ${(HEAL[h] || []).map((x) => STARS[x].name).join("/")})`).join("; ") : "";
  rows.push(`<div class="row"><b>Bổ sung:</b> Sinh khí và Thiên y luôn được tăng cường; sao cần bù: ${r.needs.map((id) => chip(id)).join(" ")}</div>`);
  if (heal) rows.push(`<div class="row"><b>Hóa giải theo CCCD:</b> ${esc(heal)}</div>`);
  rows.push("<div class=\"row\"><b>Ngũ hành:</b> các từ trường liền kề được chọn theo chiều tương sinh (Mộc → Hỏa → Thổ → Kim → Thủy → Mộc), tránh tương khắc.</div>");
  if (r.recent) {
    const nm = (ids) => (ids.length ? ids.map((id) => STARS[id].name).join(", ") : "không");
    rows.push(`<div class="row"><b>Kết quả gần đây:</b> đã đọc ${r.recent.draws} kỳ, ${r.recent.numbers} dãy số. Cát tinh còn yếu: ${esc(nm(r.recent.weakCat))}. Hung tinh nổi: ${esc(nm(r.recent.hungDominant))}. Bộ số được bù theo đó.</div>`);
  } else {
    rows.push('<div class="row muted">Chưa dán kết quả các kỳ gần nhất (tùy chọn).</div>');
  }
  return `<section class="card"><h3>Cơ sở của bộ số</h3><div class="remedy">${rows.join("")}</div></section>`;
}

function runLucky(bump = false) {
  const err = $("#lucky-error");
  setError(err, "");
  const date = parseDateInput($("#lucky-date").value);
  if (!date) { setError(err, "Hãy chọn ngày dự thưởng."); return; }
  const cccd = digitsOnly($("#lucky-cccd").value);
  if (cccd && cccd.length !== 12) { setError(err, "CCCD cần đủ 12 số (hoặc để trống)."); return; }
  if (bump) luckyVariant++;
  const station = $('input[name="lstation"]:checked')?.value || "";
  const r = generateLucky({ cccd, gender: $('input[name="lgender"]:checked')?.value || null, date, station, allow05: $("#lucky-05").checked, variant: luckyVariant, recentText: $("#lucky-recent").value });
  const gtxt = r.gender === "nam" ? "Nam" : r.gender === "nu" ? "Nữ" : "";
  let html = `<p class="hint" style="margin:0 2px 8px"><b>${esc(dateLabel(date))}</b>${gtxt ? ` · ${gtxt}` : ""}${r.profile ? ` · sinh năm ${r.profile.info.birthYear}` : ""}. Mỗi đài một bộ số đủ cơ cấu giải (giải tám 2 số → giải đặc biệt 6 số). Cùng thông tin, kết quả giữ nguyên; bấm “Bộ số khác” để đổi.</p>`;
  html += basisPanel(r) + r.groups.map(stationCard).join("");
  html += `<p class="disclaimer"><b>Lưu ý:</b> xổ số hoàn toàn ngẫu nhiên, không có bộ số nào làm tăng khả năng trúng. Các bộ số trên chỉ là gợi ý giải trí, chọn theo cặp số cát của Bát tinh cùng các “số neo” từ ngày và CCCD của bạn. Chỉ mua vé của các công ty xổ số được cấp phép, trong khả năng tài chính; không dành cho người dưới 18 tuổi.</p>`;
  $("#lucky-result").innerHTML = html;
  $("#lucky-more").hidden = false;
  $("#lucky-result").scrollIntoView({ behavior: "auto", block: "start" });
}

function initLucky() {
  $("#lucky-date").value = todayISO();
  renderStations();
  $("#lucky-schedule").innerHTML = `<table class="k-table"><thead><tr><th>Thứ</th><th>Các đài</th></tr></thead><tbody>${[1, 2, 3, 4, 5, 6, 0].map((k) => `<tr><td><b>${WEEKDAYS[k]}</b></td><td>${XSMN[k].map(esc).join(", ")}</td></tr>`).join("")}</tbody></table><p class="hint">Lịch có thể thay đổi theo quyết định của các công ty xổ số; hãy đối chiếu với thông báo chính thức.</p>`;
  bindNumberInput($("#lucky-cccd"), "cccd", 12);
  $("#lucky-cccd").addEventListener("input", () => { state.cccdForSuggest = null; syncLuckyGender(); });
  $("#lucky-date").addEventListener("change", renderStations);
  $("#lucky-form").addEventListener("submit", (e) => { e.preventDefault(); luckyVariant = 0; runLucky(false); });
  $("#lucky-more").addEventListener("click", () => runLucky(true));
  $("#lucky-result").addEventListener("click", (e) => {
    const b = e.target.closest("[data-copyset]");
    if (!b) return;
    copyText(b.dataset.copyset).then((ok) => { const old = b.textContent; b.textContent = ok ? "Đã sao chép ✓" : "Không sao chép được"; setTimeout(() => (b.textContent = old), 1400); });
  });
}

/* ------------------------------------------------------------------ chấm điểm danh sách ---- */
function runList() {
  const err = $("#list-error");
  setError(err, "");
  const items = parseList($("#list-input").value);
  const out = $("#list-result");
  if (!items.length) { setError(err, "Không tìm thấy SĐT 10 số nào. Mỗi dòng cần một số như 0931 413 191."); out.innerHTML = ""; return; }
  const min = Number($("#list-min").value);
  const rows = items.map((it) => ({ ...it, a: analyzePhone(it.number) })).filter((r) => r.a.total >= min);
  const mode = $("#list-sort").value;
  const key = { score: (r) => -r.a.total, price: (r) => (r.price ?? Infinity), value: (r) => (r.price ? -(r.a.total / (r.price / 1e6)) : -r.a.total / 1e6) }[mode];
  rows.sort((x, y) => key(x) - key(y) || y.a.total - x.a.total);
  const head = `<p class="hint" style="margin:0 2px 10px">Nhận dạng ${items.length} số, hiển thị ${rows.length} số đạt điểm tối thiểu${rows.some((r) => r.price) ? "" : " (không thấy giá trong danh sách)"}.</p>`;
  out.innerHTML = head + (rows.map((r, i) => {
    const item = { number: r.number, formatted: formatPhone(r.number), analysis: r.a, carrierId: r.a.carrier?.id, reasons: [summarize(r.a)] };
    return numberCard(item).replace('<div class="nc-top">', `<div class="nc-top"><span><span class="rank" aria-label="Hạng ${i + 1}">${i + 1}</span>${r.price ? `<span class="price">${fmtPrice(r.price)}</span>` : ""}</span>`);
  }).join("") || '<p class="empty">Không có số nào đạt điểm tối thiểu. Thử hạ mức điểm.</p>');
  out.scrollIntoView({ behavior: "auto", block: "start" });
}

/* ------------------------------------------------------------------ kiến thức & giới thiệu ---- */
function renderLearn() {
  const rows = STAR_ORDER.map((id) => {
    const s = STARS[id];
    return `<tr><td>${chip(id)}<br><small class="muted">${s.han}</small></td><td>${s.element}<br><small class="muted">${s.tier}</small></td><td>${esc(s.tag)}</td><td class="pr">${s.pairs.map((g) => g.join("/")).join("<br>")}</td></tr>`;
  }).join("");

  const healRows = Object.keys(HEAL).map((id) => `<tr><td>${chip(id)}</td><td>${HEAL[id].map((x) => chip(x)).join(" ")}</td><td class="pr">${HEAL_NUMBERS[id].join("<br>")}</td></tr>`).join("");

  const tone = (a, b) => (STARS[a].base > 0 && STARS[b].base > 0 ? "cc" : STARS[a].base < 0 && STARS[b].base < 0 ? "hh" : "ch");
  const head = STAR_ORDER.map((id) => `<th scope="col" title="${STARS[id].name}">${id}</th>`).join("");
  const grid = STAR_ORDER.map((a) => `<tr><th scope="row" title="${STARS[a].name}">${a}</th>${STAR_ORDER.map((b) => `<td><button type="button" class="${tone(a, b)}" data-a="${a}" data-b="${b}" aria-pressed="false" aria-label="${STARS[a].name} rồi ${STARS[b].name}">${tone(a, b) === "cc" ? "✓" : tone(a, b) === "hh" ? "✕" : "~"}</button></td>`).join("")}</tr>`).join("");

  $("#learn-body").innerHTML = `
  <details class="kdet" open><summary>Cách đọc nhanh một dãy số</summary><div class="kbody"><ol class="steps">
    <li><b>Thu thập tư liệu:</b> số đầy đủ, thời gian sử dụng (trên 3 năm năng lượng mới “ngấm”), giới tính, tuổi, hôn nhân, nghề nghiệp.</li>
    <li><b>Ghép cặp:</b> bỏ số 0 và 5 (ghi nhớ vị trí), rồi ghép từng hai số liền kề. Mỗi cặp thuộc một trong 8 từ trường.</li>
    <li><b>Đọc từ trái sang phải:</b> trái là khởi đầu (nhân), phải là kết quả (quả). Ba pháp tắc: <i>tổ hợp có số 1 mang năng lượng cao</i>; <i>loại sao nhiều nhất mạnh nhất</i>; <i>ba số cuối quan trọng nhất</i>.</li>
    <li><b>Tìm “điểm vào”:</b> Thiên y = tiền tài &amp; hôn nhân · Diên niên = công việc, năng lực · Sinh khí = quý nhân · Tuyệt mệnh/Ngũ quỷ = hao tài, biến động · Lục sát/Họa hại = quan hệ, thị phi.</li>
    <li><b>Cân bằng &amp; hóa giải:</b> số điện thoại không nên toàn cát hay toàn hung (“có ăn có thải”); hung tinh cần hóa thần đứng sau; đuôi nên là cát tinh.</li></ol></div></details>

  <details class="kdet"><summary>8 từ trường (Bát tinh) và các cặp số</summary><div class="kbody table-scroll">
    <table class="k-table"><thead><tr><th>Sao</th><th>Hành</th><th>Ý nghĩa</th><th>Cặp số (cấp 1→4)</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="hint">Cấp 1–2 là “động số” mạnh; cấp 3–4 là “tĩnh số” yếu. Cặp hai chữ số giống nhau (11, 22, 33…) là Phục vị.</p></div></details>

  <details class="kdet"><summary>Số 0 và số 5</summary><div class="kbody">
    <ul>
      <li><b>0</b> thuộc âm: ẩn tàng, rút bớt năng lượng, “chờ đợi, bất đắc dĩ”. Nhiều số 0 trong dãy là hao tiết nguyên khí.</li>
      <li><b>5</b> thuộc dương: nổi bật, tăng cường và kéo dài năng lượng của cặp chứa nó.</li>
      <li>Với cát tinh: 5 làm mạnh thêm, 0 làm yếu bớt. Với hung tinh: cả 0 lẫn 5 đều không nên.</li>
      <li>Số đuôi không nên là 0 hoặc 05: “tứ đại giai không” (tài, nghiệp, tình, sức khỏe đều “không”).</li>
      <li>Ví dụ trong sách: 856 – có tài nhưng kiếm vất vả; 806 – tài ẩn, dễ bị mắc kẹt; 865 – tài ngày càng nhiều; 860 – không có tài.</li></ul></div></details>

  <details class="kdet"><summary>Hóa giải hung tinh</summary><div class="kbody table-scroll">
    <table class="k-table"><thead><tr><th>Sao cần chế hóa</th><th>Hóa thần</th><th>Số gợi ý</th></tr></thead><tbody>${healRows}</tbody></table>
    <p class="hint">Ví dụ trong sách: 213 (Tuyệt mệnh 21 → Thiên y 13), 968, 176, 619.</p></div></details>

  <details class="kdet"><summary>Tổ hợp hai sao liền kề (bảng 8×8)</summary><div class="kbody">
    <p class="hint" style="margin-top:0">Hàng = sao đứng trước, cột = sao đứng sau. ✓ cát+cát · ✕ hung+hung · ~ lẫn lộn. Chạm vào ô để đọc.</p>
    <div class="table-scroll"><table class="grid-combo"><thead><tr><th></th>${head}</tr></thead><tbody>${grid}</tbody></table></div>
    <div id="combo-detail" aria-live="polite">Chọn một ô trong bảng.</div></div></details>
  ${DISCLAIMER}`;

  $("#learn-body").addEventListener("click", (e) => {
    const b = e.target.closest(".grid-combo button");
    if (!b) return;
    $$(".grid-combo button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true");
    const { a, b: bb } = b.dataset;
    $("#combo-detail").innerHTML = `<div class="combo"><div class="top">${chip(a)}<span class="arrow">→</span>${chip(bb)}</div>${esc(COMBOS[a][bb])}</div>`;
  });
}

let deferredInstall = null;
function renderAbout() {
  $("#about-body").innerHTML = `<div class="about">
  <section class="card"><h3>Ứng dụng này làm gì?</h3>
    <ul><li><b>Tra cứu:</b> phân tích SĐT, CCCD (12 số) hoặc dãy số bất kỳ theo 8 từ trường Bát tinh.</li>
    <li><b>Đề xuất SĐT:</b> tạo các số 10 chữ số có đầu số đúng của Viettel, VinaPhone, MobiFone, Vietnamobile, Gmobile, iTel, Wintel; có thể cá nhân hóa theo CCCD để bù hung tinh.</li>
    <li><b>May mắn:</b> bộ số đủ cơ cấu giải xổ số miền Nam (2→6 số) theo CCCD, mệnh, ngày, đài, đủ cát tinh, hóa giải, ngũ hành tương sinh và kết quả các kỳ gần đây bạn dán vào (chỉ mang tính giải trí).</li>
    <li><b>Chấm số:</b> dán danh sách số (kèm giá) lấy từ trang nhà mạng/đại lý để lọc và xếp hạng theo Bát tinh.</li>
    <li><b>Kiến thức:</b> bảng cặp số, quy tắc 0/5, hóa giải, tổ hợp hai sao.</li></ul></section>
  <section class="card"><h3>Nguồn và cách tính</h3>
    <p>Quy tắc, cặp số, mô tả từng sao và 64 tổ hợp lấy từ giáo trình “Thần Số Học Phương Đông” (100 trang) do bạn cung cấp. Chuỗi sao của ví dụ 13957230123 trong sách được tái hiện đúng.</p>
    <p>Điểm 0–100 là <b>quy ước của ứng dụng</b> để so sánh: cát tinh cộng, hung tinh trừ theo cấp và vị trí (ba số cuối nặng nhất), thưởng khi hung tinh có hóa thần, phạt khi đuôi 0/5, nhiều số 0, thiếu Sinh khí/Thiên y, hoặc toàn cát. Sách không đưa ra thang điểm.</p></section>
  <section class="card"><h3>Quyền riêng tư</h3>
    <p>Mọi tính toán chạy ngay trên thiết bị. Ứng dụng không gửi số điện thoại hay CCCD đi đâu và <b>không lưu CCCD</b>. Chỉ danh sách SĐT bạn bấm “Lưu” được giữ trong bộ nhớ trình duyệt.</p></section>
  <section class="card"><h3>Lưu ý quan trọng</h3>
    <ul><li>Thần số học phương đông là tín ngưỡng/văn hóa dân gian, <b>không có cơ sở khoa học</b>. Các nhận định về sức khỏe, tiền bạc, hôn nhân chỉ để tham khảo, không thay lời khuyên chuyên môn.</li>
    <li>Số đề xuất là số tạo theo quy tắc, <b>chưa kiểm tra còn hàng</b>. Cần kiểm tra và đăng ký thuê bao qua kênh chính thức của nhà mạng (ví dụ cửa hàng giao dịch hoặc đại lý ủy quyền).</li>
    <li>Bảng đầu số nằm trong <code>js/carriers.js</code>; nếu quy hoạch đổi, chỉ cần sửa tệp này.</li></ul></section>
  <section class="card"><h3>Cài ứng dụng</h3>
    <p>Dùng được ngoại tuyến sau lần mở đầu tiên.</p>
    <p class="hint">Android/Chrome: bấm “Cài ứng dụng” (nếu hiện) hoặc menu ⋮ → Thêm vào màn hình chính. iPhone/Safari: nút Chia sẻ → Thêm vào MH chính.</p>
    <div class="actions"><button type="button" class="btn ghost" id="install-btn-2" hidden>Cài ứng dụng</button></div>
    <p class="hint" id="online-state"></p></section></div>`;
  const updOnline = () => { const el = $("#online-state"); if (el) el.textContent = navigator.onLine ? "Đang trực tuyến." : "Đang ngoại tuyến – ứng dụng vẫn hoạt động."; };
  updOnline();
  addEventListener("online", updOnline);
  addEventListener("offline", updOnline);
  const showInstall = () => { ["#install-btn", "#install-btn-2"].forEach((s) => { const b = $(s); if (b) b.hidden = !deferredInstall; }); };
  ["#install-btn", "#install-btn-2"].forEach((s) => $(s)?.addEventListener("click", async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; showInstall(); }));
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; showInstall(); });
  addEventListener("appinstalled", () => { deferredInstall = null; showInstall(); });
}

/* ------------------------------------------------------------------ điều hướng ---- */
const TABS = ["lookup", "suggest", "list", "lucky", "learn", "about"];
function setTab(tab, { updateHash = true } = {}) {
  if (!TABS.includes(tab)) tab = "lookup";
  state.tab = tab;
  TABS.forEach((t) => { $(`#tab-${t}`).hidden = t !== tab; });
  $$(".bottom-nav button").forEach((b) => { if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (updateHash && location.hash !== `#${tab}`) history.replaceState(null, "", `#${tab}`);
  if (tab === "suggest") renderFavs();
  if (tab === "lucky" && !$("#lucky-cccd").value && state.cccdForSuggest) { $("#lucky-cccd").value = formatInput("cccd", state.cccdForSuggest); syncLuckyGender(); }
  window.scrollTo({ top: 0 });
}

/* ------------------------------------------------------------------ khởi tạo ---- */
function init() {
  // nhà mạng + mục tiêu
  $("#carrier-chips").innerHTML = [`<label><input type="radio" name="carrier" value="all" checked><span>Tất cả</span></label>`]
    .concat(CARRIERS.map((c) => `<label><input type="radio" name="carrier" value="${c.id}"><span>${esc(c.name)}</span></label>`)).join("");
  $("#goal").innerHTML = Object.entries(GOALS).map(([k, g]) => `<option value="${k}">${esc(g.label)}</option>`).join("");

  $$("#tab-lookup .seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  initLucky();
  bindNumberInput($("#lookup-input"), () => state.mode, () => MODES[state.mode].max);
  bindNumberInput($("#compat-input"), "cccd", 12);
  bindNumberInput($("#suggest-cccd"), "cccd", 12);

  $("#lookup-form").addEventListener("submit", (e) => { e.preventDefault(); runLookup(); });
  $("#lookup-clear").addEventListener("click", () => { setMode(state.mode); $("#compat-input").value = ""; $("#lookup-input").focus(); });
  $("#suggest-form").addEventListener("submit", (e) => { e.preventDefault(); runSuggest(true); });
  $("#suggest-more").addEventListener("click", () => runSuggest(true));
  $("#list-form").addEventListener("submit", (e) => { e.preventDefault(); runList(); });
  $("#list-clear").addEventListener("click", () => { $("#list-input").value = ""; $("#list-result").innerHTML = ""; setError($("#list-error"), ""); });
  $("#suggest-cccd").addEventListener("input", () => { state.cccdForSuggest = null; });

  document.addEventListener("click", onDelegatedClick);
  $$(".bottom-nav button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  addEventListener("hashchange", () => setTab(location.hash.slice(1), { updateHash: false }));

  renderLearn();
  renderAbout();
  setMode("phone");
  setTab(location.hash.slice(1) || "lookup", { updateHash: false });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => { /* ngoại tuyến không khả dụng */ });
  }
}

init();
