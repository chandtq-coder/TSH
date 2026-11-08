// Bộ số may mắn theo CẤU TRÚC GIẢI xổ số kiến thiết miền Nam (từ giải tám 2 số đến giải đặc biệt 6 số).
// Mỗi dãy được chọn để: đủ cát tinh (Sinh khí, Thiên y, Diên niên), có hóa thần cho hung tinh, tăng Sinh khí và Thiên y,
// nối các từ trường theo ngũ hành tương sinh, hợp mệnh theo năm sinh trên CCCD, và bù phần còn thiếu so với kết quả các kỳ gần nhất.
// LƯU Ý: xổ số là ngẫu nhiên; không có bộ số nào làm tăng xác suất trúng. Đây chỉ là gợi ý mang tính giải trí.
import { analyze, analyzeCCCD, digitsOnly, pairStar } from "./engine.js";
import { mulberry32 } from "./generator.js";
import { STARS, STAR_ORDER, CAT, HEAL } from "./data.js";

export const HUNG_IDS = ["HH", "TM", "NQ", "LS"];
export const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// Lịch mở thưởng xổ số miền Nam theo thứ (khóa = Date.getDay()). Có thể thay đổi theo quyết định của các công ty xổ số.
export const XSMN = {
  1: ["TP. Hồ Chí Minh", "Đồng Tháp", "Cà Mau"],
  2: ["Bến Tre", "Vũng Tàu", "Bạc Liêu"],
  3: ["Đồng Nai", "Cần Thơ", "Sóc Trăng"],
  4: ["Tây Ninh", "An Giang", "Bình Thuận"],
  5: ["Vĩnh Long", "Bình Dương", "Trà Vinh"],
  6: ["TP. Hồ Chí Minh", "Long An", "Bình Phước", "Hậu Giang"],
  0: ["Tiền Giang", "Kiên Giang", "Đà Lạt"],
};

// Cơ cấu giải của một đài (18 dãy số), sắp từ giải tám đến giải đặc biệt như bảng kết quả.
export const PRIZES = [
  { key: "G8", name: "Giải tám", digits: 2, count: 1 },
  { key: "G7", name: "Giải bảy", digits: 3, count: 1 },
  { key: "G6", name: "Giải sáu", digits: 4, count: 3 },
  { key: "G5", name: "Giải năm", digits: 4, count: 1 },
  { key: "G4", name: "Giải tư", digits: 5, count: 7 },
  { key: "G3", name: "Giải ba", digits: 5, count: 2 },
  { key: "G2", name: "Giải nhì", digits: 5, count: 1 },
  { key: "G1", name: "Giải nhất", digits: 5, count: 1 },
  { key: "DB", name: "Giải đặc biệt", digits: 6, count: 1 },
];

/* ----------------------------------------------------------------- ngũ hành & mệnh ---- */
export const SINH = { Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc" }; // A sinh B
export const KHAC = { Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc" }; // A khắc B
const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"]; // theo chữ số cuối của năm
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const CAN_VAL = { Giáp: 1, Ất: 1, Bính: 2, Đinh: 2, Mậu: 3, Kỷ: 3, Canh: 4, Tân: 4, Nhâm: 5, Quý: 5 };
const CHI_VAL = { Tý: 0, Sửu: 0, Ngọ: 0, Mùi: 0, Dần: 1, Mão: 1, Thân: 1, Dậu: 1, Thìn: 2, Tỵ: 2, Tuất: 2, Hợi: 2 };
const NAP_AM = ["", "Kim", "Thủy", "Hỏa", "Thổ", "Mộc"];

// Mệnh nạp âm theo năm sinh dương lịch (ước tính; người sinh đầu năm trước Tết âm lịch có thể lệch một năm).
export function menhOf(year) {
  const can = CAN[year % 10];
  const chi = CHI[(((year - 4) % 12) + 12) % 12];
  let v = CAN_VAL[can] + CHI_VAL[chi];
  if (v > 5) v -= 5;
  return { year, canChi: `${can} ${chi}`, element: NAP_AM[v] };
}

// Các từ trường cát/hung hỗ trợ hay xung với mệnh: hành sinh ta và cùng hành là hỗ trợ; hành khắc ta là xung.
export function supportFor(element) {
  const sinhTa = Object.keys(SINH).find((k) => SINH[k] === element);
  const khacTa = Object.keys(KHAC).find((k) => KHAC[k] === element);
  const support = new Set(STAR_ORDER.filter((id) => STARS[id].base > 0 && [element, sinhTa].includes(STARS[id].element)));
  const clash = new Set(STAR_ORDER.filter((id) => STARS[id].element === khacTa));
  return { support, clash, sinhTa, khacTa };
}

/* ----------------------------------------------------------------- kết quả các kỳ gần nhất ---- */
// Đọc văn bản dán vào: các kỳ ngăn cách bằng dòng trống hoặc dòng bắt đầu "Xổ số…"/"Kỳ…". Tối đa 8 kỳ, kỳ mới nhất ở trên.
// Nhận ra bảng nhiều đài sao chép từ trang kết quả (tiêu đề "Giải <đài> <đài> …", mỗi hàng giải xếp xen kẽ theo cột đài,
// ví dụ "Giải tám 29 . 34 . 15 . 12") và tách số liệu riêng từng đài; nếu không nhận ra thì gom mọi dãy 2–6 chữ số.
const normName = (x) => String(x).toLowerCase().replace(/^tp\.?\s*/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const STATION_ALIASES = { "tp hcm": "TP. Hồ Chí Minh", hcm: "TP. Hồ Chí Minh", "hồ chí minh": "TP. Hồ Chí Minh", "bà rịa vũng tàu": "Vũng Tàu", "lâm đồng": "Đà Lạt" };
const ALL_STATIONS = [...new Set(Object.values(XSMN).flat())];
const PRIZE_ROW = /^\s*(?:giải\s*)?(đặc biệt|dac biet|tám|tam|bảy|bay|sáu|sau|năm|nam|tư|tu|ba|nhì|nhi|nhất|nhat|đb|db)(?![\p{L}\p{N}])(.*)$/iu;
const PRIZE_COUNT = { "tám": 1, tam: 1, "bảy": 1, bay: 1, "sáu": 3, sau: 3, "năm": 1, nam: 1, "tư": 7, tu: 7, ba: 2, "nhì": 1, nhi: 1, "nhất": 1, nhat: 1, "đặc biệt": 1, "dac biet": 1, "đb": 1, db: 1 };

function stationsInLine(line) {
  const n = normName(line);
  const found = [];
  const names = [...ALL_STATIONS.map((x) => [x, normName(x)]), ...Object.entries(STATION_ALIASES).map(([a, x]) => [x, a])];
  for (const [canon, key] of names) {
    const i = n.indexOf(key);
    if (i >= 0 && !found.some((f) => f.canon === canon)) found.push({ canon, i });
  }
  return found.sort((a, b) => a.i - b.i).map((f) => f.canon);
}

export function parseRecent(text, maxDraws = 8) {
  const clean = String(text || "").replace(/\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/g, "\n");
  const blocks = clean.split(/\n\s*\n|\n(?=\s*(?:kỳ|ky|xổ số|xo so)(?![\p{L}\p{N}]))/iu).map((b) => b.trim()).filter((b) => /(?<![\w])\d{2,6}(?![\w])/.test(b)).slice(0, maxDraws); // bỏ khối không có số (vd. dòng tiêu đề) rồi mới lấy tối đa 8 kỳ
  const draws = [];
  const byStation = {};
  const stationDraws = {}; // đài → các kỳ (mới nhất trước), mỗi kỳ là mảng dãy số
  for (const b of blocks) {
    const lines = b.split(/\n/);
    const header = lines.map(stationsInLine).find((st) => st.length >= 2);
    let nums = [];
    if (header) {
      const per = Object.fromEntries(header.map((h) => [h, []]));
      for (const line of lines) {
        const m = PRIZE_ROW.exec(line);
        if (!m) continue;
        const toks = m[2].match(/(?<![\w])\d{2,6}(?![\w])/g) || [];
        const need = (PRIZE_COUNT[m[1].toLowerCase()] || 1) * header.length;
        if (toks.length !== need) continue;
        toks.forEach((t, i) => per[header[i % header.length]].push(t));
      }
      for (const [st, arr] of Object.entries(per)) {
        if (!arr.length) continue;
        (byStation[st] ||= []).push(...arr);
        (stationDraws[st] ||= []).push(arr);
        nums.push(...arr);
      }
    }
    if (!nums.length) nums = b.match(/(?<![\w])\d{2,6}(?![\w])/g) || [];
    if (nums.length) draws.push(nums);
  }
  return { draws, numbers: draws.flat(), byStation, stationDraws };
}

export function recentEnergy(parsed) {
  if (!parsed || !parsed.numbers.length) return null;
  const counts = Object.fromEntries(STAR_ORDER.map((id) => [id, 0]));
  const elements = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  for (const n of parsed.numbers) {
    const a = analyze(n);
    for (const p of a.pairs) { counts[p.star]++; elements[STARS[p.star].element]++; }
  }
  const total = Object.values(counts).reduce((x, y) => x + y, 0) || 1;
  const missing = STAR_ORDER.filter((id) => counts[id] === 0);
  const weakCat = ["SK", "TY", "DN", "PV"].filter((id) => counts[id] / total < 0.1);
  const hungDominant = ["HH", "TM", "NQ", "LS"].filter((id) => counts[id] / total >= 0.15).sort((a, b) => counts[b] - counts[a]);
  const weakElements = Object.keys(elements).filter((e) => elements[e] / total < 0.12);
  return { draws: parsed.draws.length, numbers: parsed.numbers.length, counts, elements, total, missing, weakCat, hungDominant, weakElements };
}

/* ----------------------------------------------------------------- quy luật 8 sao của đài ---- */
// Mỗi sao chiếm 8/64 cặp chữ số có nghĩa, nên nếu các chữ số hoàn toàn ngẫu nhiên thì mỗi sao kỳ vọng 12,5% số cặp.
// Độ lệch so với mức này (điểm z) cho biết sao đang "nổi" hay "vắng" trong các kỳ gần nhất — chỉ là thống kê mô tả.
const EXPECT = 1 / 8;

// draws: các kỳ của một đài, mới nhất trước; mỗi kỳ là mảng các dãy số.
export function stationRule(draws) {
  if (!draws || !draws.length) return null;
  const kept = draws.slice(0, 8);
  const zero = () => Object.fromEntries(STAR_ORDER.map((id) => [id, 0]));
  const counts = zero();
  const elements = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  const tail = zero();
  const dbTail = [];
  const perDraw = kept.map((nums) => {
    const c = zero();
    let n = 0;
    for (const num of nums) {
      const a = analyze(num);
      a.pairs.forEach((q) => { c[q.star]++; counts[q.star]++; elements[STARS[q.star].element]++; n++; });
      if (a.tailPair) tail[a.tailPair.star]++;
    }
    // Trong bảng kết quả, giải đặc biệt là dãy cuối cùng của kỳ đầy đủ (18 dãy).
    if (nums.length === 18) { const db = analyze(nums[17]).tailPair; if (db) dbTail.push(db.star); }
    return { counts: c, pairs: n };
  });
  const N = Object.values(counts).reduce((x, y) => x + y, 0);
  if (!N) return null;
  const sd = Math.sqrt((EXPECT * (1 - EXPECT)) / N);
  const share = {};
  const z = {};
  const state = {};
  for (const id of STAR_ORDER) {
    share[id] = counts[id] / N;
    z[id] = (share[id] - EXPECT) / sd;
    state[id] = z[id] >= 1.5 ? "nổi" : z[id] <= -1.5 ? "vắng" : "cân bằng";
  }
  let trend = null;
  if (kept.length >= 4) {
    const recentN = perDraw.slice(0, 3).reduce((a, d) => a + d.pairs, 0) || 1;
    const olderN = perDraw.slice(3).reduce((a, d) => a + d.pairs, 0) || 1;
    trend = {};
    for (const id of STAR_ORDER) {
      const r = perDraw.slice(0, 3).reduce((a, d) => a + d.counts[id], 0) / recentN;
      const o = perDraw.slice(3).reduce((a, d) => a + d.counts[id], 0) / olderN;
      trend[id] = r - o >= 0.05 ? "tăng" : r - o <= -0.05 ? "giảm" : "ổn định";
    }
  }
  const dominantElement = Object.keys(elements).sort((a, b) => elements[b] - elements[a])[0];
  const tailTop = STAR_ORDER.slice().sort((a, b) => tail[b] - tail[a])[0];
  return { draws: kept.length, pairs: N, counts, share, z, state, trend, tail, tailTop, dbTail, elements, dominantElement };
}

// Đối chiếu quy luật của đài với hồ sơ cá nhân (CCCD, mệnh) để ra hành động và trọng số cho từng sao.
export function buildPlan(rule, profile, support, clash) {
  const personalNeeds = new Set(profile?.needs || []);
  const personalHung = new Set(profile?.hung || []);
  const plan = {};
  for (const id of STAR_ORDER) {
    const st = STARS[id];
    const state = rule?.state[id] || null;
    const trend = rule?.trend?.[id] || null;
    let weight = 1;
    let action;
    let personal = "—";
    if (st.base > 0) {
      const need = personalNeeds.has(id);
      personal = need ? "cần bổ sung" : support.has(id) ? "hợp mệnh" : "—";
      if (state === "vắng") { weight = need ? 2.2 : 1.5; action = need ? "Đài đang vắng, cá nhân cũng cần → bổ sung mạnh" : "Đài đang vắng → bổ sung"; }
      else if (state === "nổi") { weight = need ? 1.6 : 1.1; action = need ? "Đài đang vượng, cá nhân cần → tăng cường" : "Đài đang vượng → giữ nhịp"; }
      else { weight = need ? 1.5 : 1; action = need ? "Cá nhân cần → bổ sung" : "Cân bằng → giữ"; }
      if (trend === "giảm") weight *= 1.15;
      if (support.has(id)) weight *= 1.15;
      if (clash.has(id)) weight *= 0.7;
    } else {
      const mine = personalHung.has(id);
      personal = mine ? "hung tinh trong CCCD" : "—";
      weight = state === "nổi" ? 0.6 : state === "vắng" ? 0.9 : 0.8;
      action = state === "nổi" ? "Đài đang nhiều sao này → chỉ dùng kèm hóa thần" : "Chỉ dùng một dãy kèm hóa thần để đủ 8 sao";
      if (mine) { weight *= 0.85; action += " (CCCD cũng có → hóa giải mạnh)"; }
    }
    plan[id] = { state, trend, personal, weight, action };
  }
  for (const h of HUNG_IDS) {
    const boosted = rule?.state[h] === "nổi";
    if (!boosted && !personalHung.has(h)) continue;
    const mult = boosted && personalHung.has(h) ? 1.5 : 1.25;
    for (const hl of HEAL[h] || []) {
      plan[hl].weight *= mult;
      plan[hl].action += ` · hóa giải ${STARS[h].name}`;
    }
  }
  for (const id of STAR_ORDER) plan[id].weight = Math.max(0.4, Math.min(3, plan[id].weight));
  return plan;
}

// Kiểm tra bộ số đã sinh có thực hiện đúng kế hoạch đối chiếu hay không.
export function verifySet({ tiers, coverage, includeHung, profile, menh, support, clash, plan, rule }) {
  const items = tiers.flatMap((t) => t.items);
  const checks = [];
  const add = (ok, text) => checks.push({ ok: !!ok, text });
  if (includeHung) add(STAR_ORDER.every((x) => coverage[x] > 0), "Đủ cả 8 sao, mỗi sao xấu đều có hóa thần đứng sau");
  else add(["SK", "TY", "DN", "PV"].every((x) => coverage[x] > 0), "Đủ 4 cát tinh");
  const db = tiers.at(-1).items[0]?.analysis;
  add(db && db.counts.SK > 0 && db.counts.TY > 0 && db.counts.DN > 0, "Giải đặc biệt đủ Sinh khí – Thiên y – Diên niên");
  if (profile?.hung.length) {
    const ok = profile.hung.every((h) => (HEAL[h] || []).some((x) => coverage[x] > 0));
    add(ok, `Hung tinh trong CCCD (${profile.hung.map((h) => STARS[h].name).join(", ")}) đều có hóa thần chế hóa`);
  }
  if (rule) {
    const vang = ["SK", "TY", "DN", "PV"].filter((x) => plan[x].state === "vắng");
    if (vang.length) add(vang.every((x) => coverage[x] >= 3), `Đã bù ${vang.map((x) => STARS[x].name).join(", ")} mà đài đang vắng`);
    const noi = HUNG_IDS.filter((h) => plan[h].state === "nổi");
    if (noi.length) add(noi.every((h) => (HEAL[h] || []).some((x) => coverage[x] >= 3)), `Đã tăng hóa thần cho ${noi.map((h) => STARS[h].name).join(", ")} mà đài đang nhiều`);
  }
  let pairs = 0, sup = 0, cl = 0, sinh = 0, khac = 0;
  for (const it of items) {
    const ps = it.analysis.pairs;
    ps.forEach((q) => { pairs++; if (support.has(q.star)) sup++; if (clash.has(q.star)) cl++; });
    for (let k = 0; k < ps.length - 1; k++) {
      const x = STARS[ps[k].star].element, y = STARS[ps[k + 1].star].element;
      if (SINH[x] === y) sinh++; else if (KHAC[x] === y) khac++;
    }
  }
  if (menh && pairs) add(sup / pairs >= 0.25 && cl / pairs <= 0.2, `Hợp mệnh ${menh.element}: ${Math.round((100 * sup) / pairs)}% cặp là sao hợp, ${Math.round((100 * cl) / pairs)}% cặp khắc mệnh`);
  add(sinh >= khac, `Các từ trường nối theo chiều tương sinh (${sinh} lần sinh, ${khac} lần khắc)`);
  const passed = checks.filter((c) => c.ok).length;
  return { checks, matchScore: Math.round((100 * passed) / checks.length) };
}

/* ----------------------------------------------------------------- tiện ích ---- */
export function parseDateInput(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export const stationsFor = (date) => XSMN[date.getDay()];

export function dateLabel(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${WEEKDAYS[date.getDay()]}, ${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// "Số neo": chữ số lấy từ ngày dự thưởng, thứ, đài và năm sinh trên CCCD.
export function anchorsFor(date, stationIdx, birthYear) {
  const wd = date.getDay() === 0 ? 8 : date.getDay() + 1; // Thứ Hai=2 … Thứ Bảy=7, Chủ nhật=8
  const list = [
    { digit: String(wd), label: `${WEEKDAYS[date.getDay()]} → ${wd}` },
    { digit: String(date.getDate() % 10), label: `ngày ${date.getDate()}` },
    { digit: String(Math.floor(date.getDate() / 10)), label: `ngày ${date.getDate()}` },
    { digit: String((date.getMonth() + 1) % 10), label: `tháng ${date.getMonth() + 1}` },
    { digit: String(stationIdx + 1), label: `đài thứ ${stationIdx + 1} trong ngày` },
  ];
  if (birthYear) {
    const yy = String(birthYear).slice(-2);
    list.push({ digit: yy[0], label: `năm sinh ${birthYear}` }, { digit: yy[1], label: `năm sinh ${birthYear}` });
  }
  return list;
}

function pickWeighted(rng, items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function buildDigits(rng, len, pool, ctx) {
  let lastSig = null;
  let prevStar = null;
  let out = "";
  for (let i = 0; i < len; i++) {
    const isLast = i === len - 1;
    const w = pool.map((d) => {
      let x = 1;
      if (d === "0" || d === "5") x = isLast ? 0.15 : 0.7;
      else if (lastSig) {
        const star = pairStar(lastSig, d).star;
        if (CAT.has(star)) x = 3;
        else if (star === "PV") x = 0.4;
        else x = isLast ? 0 : len >= 5 ? 0.35 : 0.15; // hung tinh chỉ để chờ hóa thần đứng sau
        if (prevStar && STARS[prevStar].base < 0 && HEAL[prevStar]?.includes(star)) x *= 4;
        if (star === "SK" || star === "TY") x *= 1.4; // bổ sung Sinh khí, tăng cường Thiên y
        if (ctx.hungBoost && star === ctx.hungBoost && !isLast) x = Math.max(x, 1) * 6; // chủ động đưa hung tinh (kèm hóa thần) vào dãy
        x *= ctx.weights ? ctx.weights[star] ?? 1 : ctx.needs.has(star) ? 1.5 : 1;
        if (ctx.support.has(star)) x *= 1.3;
        if (ctx.clash.has(star)) x *= 0.5;
      }
      if (ctx.anchorDigits.has(d)) x *= 2.2;
      return x;
    });
    const d = pickWeighted(rng, pool, w);
    if (d !== "0" && d !== "5") {
      if (lastSig) prevStar = pairStar(lastSig, d).star;
      lastSig = d;
    }
    out += d;
  }
  return out;
}

// Điểm phù hợp của một dãy: Bát tinh + đủ cát tinh + hóa giải + Sinh khí/Thiên y + hành tương sinh + hợp mệnh + bù kết quả gần đây.
function fitScore(a, len, ctx) {
  const c = a.counts;
  let r = a.total;
  if (len >= 5) for (const s of ["SK", "TY", "DN"]) r += c[s] ? 6 : -6;
  else if (len === 4) r += 3 * ["SK", "TY", "DN"].filter((s) => c[s]).length;
  else r += c.SK || c.TY ? 4 : 0;
  r += 4 * Math.min(2, c.SK) + 4 * Math.min(2, c.TY);
  r += 3 * a.pairs.filter((p) => p.healed).length;
  if (ctx.allow05 && len >= 3) {
    // Giáo trình: 5 làm tăng cường và kéo dài cát tinh; 0 làm ẩn bớt. Khi người dùng cho phép, thưởng nhẹ để có mặt trong bộ số.
    const inner = a.digits.slice(1, -1);
    if (inner.includes("5")) r += 5;
    else if (inner.includes("0")) r += 2;
  }
  let flow = 0;
  for (let k = 0; k < a.pairs.length - 1; k++) {
    const x = STARS[a.pairs[k].star].element;
    const y = STARS[a.pairs[k + 1].star].element;
    if (SINH[x] === y) flow += 3;
    else if (KHAC[x] === y) flow -= 3;
  }
  r += Math.max(-6, Math.min(9, flow));
  let own = 0;
  for (const p of a.pairs) { if (ctx.support.has(p.star)) own += 2; if (ctx.clash.has(p.star)) own -= 3; }
  r += Math.max(-6, Math.min(8, own));
  if (ctx.recent) {
    let bu = 0;
    for (const s of ctx.recent.weakCat) bu += c[s] ? 2 : 0;
    for (const h of ctx.recent.hungDominant) for (const hl of HEAL[h] || []) bu += c[hl] ? 1 : 0;
    for (const p of a.pairs) if (ctx.recent.weakElements.includes(STARS[p.star].element) && STARS[p.star].base > 0) bu += 1;
    r += Math.min(8, bu);
  }
  if (ctx.profile) r += Math.min(6, [...ctx.profile.needs].filter((s) => c[s] > 0).length * 2);
  if (ctx.weights) {
    let wsum = 0;
    for (const p of a.pairs) wsum += ((ctx.weights[p.star] ?? 1) - 1) * 2.5;
    r += Math.max(-8, Math.min(10, wsum));
  }
  return r;
}


/**
 * Chế độ "thống kê": chọn số theo phân bố chữ số trong 8 kỳ gần nhất của từng đài, KHÔNG hạn chế theo Bát tinh
 * (dùng mọi chữ số 0–9, không cần đủ sao, không cần hóa thần). Chữ số xuất hiện nhiều ở đúng vị trí (tính từ cuối)
 * có xác suất được chọn cao hơn; ngày dự thưởng và năm sinh làm "số neo". Không trùng các dãy đã ra trong các kỳ đó.
 * Đây chỉ là thống kê mô tả: thử trên hơn 6.000 kỳ thật cho thấy cách này không hơn chọn ngẫu nhiên.
 */
export function generateStatistical(o) {
  const date = o.date;
  const cccdDigits = digitsOnly(o.cccd || "");
  const profile = cccdDigits.length === 12 ? analyzeCCCD(cccdDigits, date) : null;
  const gender = o.gender || profile?.info.gender || null;
  const parsedRecent = o.recent || parseRecent(o.recentText);
  const stations = stationsFor(date);
  const targets = o.station ? [o.station] : stations;
  const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const iso = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const takenAcross = new Set();
  const groups = [];
  for (const name of targets) {
    const idx = Math.max(0, stations.indexOf(name));
    const anchors = anchorsFor(date, idx, profile?.info.birthYear);
    const anchorDigits = new Set(anchors.map((a) => a.digit));
    const own = parsedRecent.stationDraws[name];
    const src = own && own.length ? own : parsedRecent.draws.length ? parsedRecent.draws : null;
    const posCount = Array.from({ length: 6 }, () => Array(10).fill(0)); // vị trí tính từ cuối → số lần mỗi chữ số xuất hiện
    const digitTotal = Array(10).fill(0);
    const tails = new Map();
    const recentSet = new Set();
    let seen = 0;
    for (const draw of src || []) {
      for (const num of draw) {
        recentSet.add(num);
        seen++;
        for (let k = 0; k < Math.min(6, num.length); k++) posCount[k][Number(num[num.length - 1 - k])]++;
        for (const ch of num) digitTotal[Number(ch)]++;
        if (num.length >= 2) tails.set(num.slice(-2), (tails.get(num.slice(-2)) || 0) + 1);
      }
    }
    const rng = mulberry32(fnv1a(`stat|${cccdDigits}|${gender}|${iso}|${name}|${o.variant || 0}|${seen}`));
    const tiers = PRIZES.map((prize) => {
      const items = [];
      const used = new Set();
      for (let guard = 0; items.length < prize.count && guard < 600; guard++) {
        let num = "";
        for (let i = 0; i < prize.digits; i++) {
          const k = Math.min(5, prize.digits - 1 - i);
          const w = DIGITS.map((d) => (posCount[k][Number(d)] + 1) * (anchorDigits.has(d) ? 1.6 : 1));
          num += pickWeighted(rng, DIGITS, w);
        }
        if (used.has(num) || recentSet.has(num) || takenAcross.has(`${prize.digits}:${num}`)) continue;
        used.add(num);
        takenAcross.add(`${prize.digits}:${num}`);
        const hit = anchors.filter((x, k2) => num.includes(x.digit) && anchors.findIndex((y) => y.digit === x.digit) === k2);
        items.push({ number: num, analysis: analyze(num, { gender }), hit });
      }
      return { ...prize, items };
    });
    const rank = DIGITS.map((d) => [d, digitTotal[Number(d)]]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const stat = seen
      ? {
          draws: src.length, numbers: seen,
          hotDigits: rank.slice(0, 3).map((x) => `${x[0]} (${x[1]})`),
          coldDigits: rank.slice(-3).reverse().map((x) => `${x[0]} (${x[1]})`),
          topTails: [...tails.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map((x) => `${x[0]} (${x[1]})`),
        }
      : null;
    groups.push({ station: name, mode: "stat", anchors, tiers, stat, recentSource: own && own.length ? "station" : src ? "all" : null });
  }
  return { date, gender, mode: "stat", includeHung: false, profile, menh: null, support: [], clash: [], needs: [], recent: recentEnergy(parsedRecent), groups };
}

/**
 * Sinh bộ số theo cơ cấu giải cho từng đài.
 * @param {object} o
 * @param {string} [o.cccd]        12 số (tùy chọn)
 * @param {string|null} [o.gender] "nam" | "nu" | null (nếu rỗng sẽ lấy từ CCCD)
 * @param {Date} o.date
 * @param {string} [o.station]     tên đài; rỗng = tất cả đài trong ngày
 * @param {boolean} [o.allow05]
 * @param {number} [o.variant]
 * @param {boolean} [o.includeHung] mặc định true: bộ số có đủ cả 4 hung tinh, mỗi hung tinh kèm hóa thần
 * @param {object} [o.recent]      kết quả đã dựng sẵn (vd. từ kqxs.js); ưu tiên hơn recentText
 * @param {string} [o.recentText]  kết quả các kỳ gần nhất do người dùng dán (tối đa 8 kỳ)
 */
export function generateLucky(o) {
  if (o.mode === "stat") return generateStatistical(o);
  const date = o.date;
  const cccdDigits = digitsOnly(o.cccd || "");
  const profile = cccdDigits.length === 12 ? analyzeCCCD(cccdDigits, date) : null;
  const gender = o.gender || profile?.info.gender || null;
  const menh = profile ? menhOf(profile.info.birthYear) : null;
  const { support, clash, sinhTa, khacTa } = menh ? supportFor(menh.element) : { support: new Set(), clash: new Set() };
  const includeHung = o.includeHung !== false; // mặc định bao gồm cả sao xấu (luôn kèm hóa thần)
  const parsedRecent = o.recent || parseRecent(o.recentText); // o.recent: dữ liệu tự động tải (cùng cấu trúc với parseRecent)
  const recentAll = recentEnergy(parsedRecent);
  const recent = recentAll;

  // Sao cần bổ sung/hóa giải: từ CCCD, từ kết quả các kỳ gần nhất, và luôn nhấn Sinh khí – Thiên y.
  const baseNeeds = ["SK", "TY", ...(profile?.needs || [])];
  const needsFor = (rc) => {
    const set = new Set(baseNeeds);
    if (rc) {
      rc.weakCat.forEach((x) => set.add(x));
      rc.hungDominant.forEach((h) => (HEAL[h] || []).forEach((x) => set.add(x)));
    }
    return set;
  };
  const needs = needsFor(recentAll);

  const stations = stationsFor(date);
  const targets = o.station ? [o.station] : stations;
  const pool = o.allow05 ? ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] : ["1", "2", "3", "4", "6", "7", "8", "9"];
  const iso = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const groups = [];
  const takenAcross = new Set();
  for (const name of targets) {
    const idx = Math.max(0, stations.indexOf(name));
    const anchors = anchorsFor(date, idx, profile?.info.birthYear).filter((a) => pool.includes(a.digit));
    // Nếu kết quả dán vào có số liệu riêng của đài này thì dùng riêng, nếu không dùng năng lượng chung.
    const own = parsedRecent.byStation[name];
    const recentSt = own && own.length ? recentEnergy({ draws: [own], numbers: own }) : null;
    const rc = recentSt || recentAll;
    const needsSt = needsFor(rc);
    // Quy luật 8 sao của đài trong tối đa 8 kỳ (riêng đài nếu có, nếu không dùng số liệu chung) rồi đối chiếu với cá nhân.
    const ownDraws = parsedRecent.stationDraws[name];
    const drawsSrc = ownDraws && ownDraws.length ? ownDraws : parsedRecent.draws.length ? parsedRecent.draws : null;
    const rule = stationRule(drawsSrc);
    const plan = buildPlan(rule, profile, support, clash);
    const weights = Object.fromEntries(STAR_ORDER.map((id) => [id, plan[id].weight]));
    const ctx = { allow05: !!o.allow05, anchorDigits: new Set(anchors.map((a) => a.digit)), needs: needsSt, weights, support, clash, recent: rc, profile: profile ? { needs: needsSt } : null };
    const rng = mulberry32(fnv1a(`${cccdDigits}|${gender}|${iso}|${name}|${o.allow05 ? 1 : 0}|${o.variant || 0}|${rc ? rc.numbers : 0}`));
    const tiers = [];
    const coverage = Object.fromEntries(STAR_ORDER.map((id) => [id, 0]));
    const pools = {};
    const usedTail = new Map(); // phạt dãy trùng 3 số cuối để bộ số đa dạng
    for (const prize of PRIZES) {
      const pooled = new Map();
      const attempts = 80 + 70 * prize.count;
      for (let i = 0; i < attempts; i++) {
        const num = buildDigits(rng, prize.digits, pool, ctx);
        if (pooled.has(num) || takenAcross.has(`${prize.digits}:${num}`)) continue;
        const counts = {};
        for (const d of num) counts[d] = (counts[d] || 0) + 1;
        if (prize.digits >= 4 && Math.max(...Object.values(counts)) > 3) continue;
        const a = analyze(num, { gender });
        const hit = anchors.filter((x, k) => num.includes(x.digit) && anchors.findIndex((y) => y.digit === x.digit) === k);
        const rank = fitScore(a, prize.digits, ctx) + Math.min(9, hit.length * 3) + rng() * 6;
        pooled.set(num, { number: num, analysis: a, rank, hit });
      }
      const sortedPool = [...pooled.values()].sort((x, y) => y.rank - x.rank);
      pools[prize.key] = sortedPool;
      const picked = [];
      let left = [...sortedPool];
      if (["DB", "G1", "G2"].includes(prize.key)) {
        // giải lớn phải đủ Sinh khí – Thiên y – Diên niên nếu có ứng viên như vậy
        const full = left.filter((c) => ["SK", "TY", "DN"].every((x) => c.analysis.counts[x] > 0));
        if (full.length >= prize.count) left = full;
      }
      while (picked.length < prize.count && left.length) {
        let bi = 0;
        let bv = -Infinity;
        left.forEach((c, i) => {
          const v = c.rank - 5 * (usedTail.get(c.number.slice(-3)) || 0);
          if (v > bv) { bv = v; bi = i; }
        });
        const [c] = left.splice(bi, 1);
        picked.push(c);
        const t3 = c.number.slice(-3);
        usedTail.set(t3, (usedTail.get(t3) || 0) + 1);
      }
      picked.forEach((c) => {
        takenAcross.add(`${prize.digits}:${c.number}`);
        c.analysis.pairs.forEach((p) => coverage[p.star]++);
      });
      tiers.push({ ...prize, items: picked });
    }
    // Bảo đảm độ phủ: đủ 4 cát tinh; nếu bật "bao gồm sao xấu" thì đủ cả Họa hại, Tuyệt mệnh, Ngũ quỷ, Lục sát,
    // mỗi hung tinh đều nằm trong dãy có hóa thần đứng ngay sau. Thay từng dãy sao cho không làm mất sao đã có.
    const required = ["SK", "TY", "DN", "PV", ...(includeHung ? HUNG_IDS : [])];
    const hungPools = {};
    const hungPool = (star, len) => {
      const k = `${star}${len}`;
      if (hungPools[k]) return hungPools[k];
      const found = new Map();
      for (let i = 0; i < 500; i++) {
        const num = buildDigits(rng, len, pool, { ...ctx, hungBoost: star });
        if (found.has(num)) continue;
        const a = analyze(num, { gender });
        if (!a.pairs.some((q) => q.star === star && q.healed)) continue;
        const hit = anchors.filter((x, i2) => num.includes(x.digit) && anchors.findIndex((y) => y.digit === x.digit) === i2);
        found.set(num, { number: num, analysis: a, rank: fitScore(a, len, ctx) + rng() * 6, hit });
      }
      return (hungPools[k] = [...found.values()].sort((x, y) => y.rank - x.rank));
    };
    for (let pass = 0; pass < 4; pass++) {
      for (const need of required) {
        if (coverage[need] > 0) continue;
        let done = false;
        for (const key of ["G4", "G6", "G3", "G5"]) {
          const t = tiers.find((x) => x.key === key);
          const list = HUNG_IDS.includes(need) ? hungPool(need, t.digits) : pools[key];
          for (const cand of list) {
            if (t.items.some((it) => it.number === cand.number) || takenAcross.has(`${t.digits}:${cand.number}`)) continue;
            for (let slot = t.items.length - 1; slot >= 0; slot--) {
              const old = t.items[slot];
              const next = { ...coverage };
              old.analysis.pairs.forEach((q) => next[q.star]--);
              cand.analysis.pairs.forEach((q) => next[q.star]++);
              if (next[need] <= 0 || !required.every((x) => coverage[x] <= 0 || next[x] > 0)) continue;
              Object.assign(coverage, next);
              takenAcross.delete(`${t.digits}:${old.number}`);
              takenAcross.add(`${t.digits}:${cand.number}`);
              t.items[slot] = cand;
              done = true;
              break;
            }
            if (done) break;
          }
          if (done) break;
        }
      }
    }
    groups.push({ station: name, anchors, tiers, coverage, recentSource: recentSt ? "station" : recentAll ? "all" : null, rule, plan, ...verifySet({ tiers, coverage, includeHung, profile, menh, support, clash, plan, rule }), fullAll: STAR_ORDER.every((x) => coverage[x] > 0), fullCat: ["SK", "TY", "DN", "PV"].every((s) => coverage[s] > 0) });
  }
  return { date, gender, includeHung, profile, menh, support: [...support], clash: [...clash], sinhTa, khacTa, needs: [...needs], recent, groups };
}
