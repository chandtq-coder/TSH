// Bộ đề xuất SĐT 10 số theo nhà mạng. Sinh ngẫu nhiên có định hướng (bước đi qua các cặp cát tinh) rồi
// chấm điểm bằng đúng bộ máy phân tích ở engine.js. Đây là số "đẹp theo giáo trình", KHÔNG phải kho số còn trống của nhà mạng.
import { STARS, CAT, HEAL } from "./data.js";
import { CARRIERS, carrierById } from "./carriers.js";
import { analyze, analyzePhone, pairStar, formatPhone } from "./engine.js";

export const GOALS = {
  can_bang: { label: "Cân bằng", w: { SK: 1, TY: 1, DN: 1 }, domain: null },
  tai: { label: "Tài lộc", w: { TY: 3, SK: 1.3, DN: 1.3 }, domain: "tai" },
  nghiep: { label: "Sự nghiệp", w: { DN: 3, TY: 1.4, SK: 1.4 }, domain: "nghiep" },
  quynhan: { label: "Quý nhân", w: { SK: 3, TY: 1.3, DN: 1.3 }, domain: "quynhan" },
  tinhcam: { label: "Tình cảm – gia đạo", w: { TY: 2.6, SK: 1.8, DN: 0.8 }, domain: "tinhcam" },
  khoe: { label: "Sức khỏe – bình an", w: { DN: 2, SK: 2, TY: 1.6 }, domain: "khoe" },
};

const SIG = ["1", "2", "3", "4", "6", "7", "8", "9"];
const DN_STRONG = new Set(["19", "91", "78", "87"]);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Thông tin từng đầu số: cặp sao tạo bởi 2 chữ số sau số 0.
export function prefixInfo(prefix) {
  const r = analyze(prefix, { phonePrefix: true });
  const p = r.pairs[0] || null;
  return { prefix, pair: p, star: p ? p.star : null, score: r.total, res: r };
}

export function carrierPrefixInfo(carrierId) {
  const c = carrierById(carrierId);
  if (!c) return [];
  return c.prefixes.map(prefixInfo);
}

function lastSigAfterPrefix(prefix) {
  const ds = prefix.slice(1).split("").filter((d) => d !== "0" && d !== "5");
  return ds.length ? ds[ds.length - 1] : null;
}

function prefixLastStar(prefix) {
  const r = analyze(prefix, { phonePrefix: true });
  return r.pairs.length ? r.pairs[r.pairs.length - 1].star : null;
}

function stepWeight(star, prevStar, ctx, pairKey, used) {
  let w;
  if (CAT.has(star)) w = ctx.goalW[star] ?? 1;
  else if (star === "PV") w = 0.1;
  else w = 0.05;
  if (ctx.boost[star]) w *= ctx.boost[star];
  if (CAT.has(star) && !used.has(star)) w *= 1.3;
  if (prevStar && STARS[prevStar].base < 0 && HEAL[prevStar]?.includes(star)) w *= 4;
  if (ctx.female && DN_STRONG.has(pairKey)) w *= 0.1;
  return w;
}

function buildTail(rng, prefix, ctx, length = 7) {
  let lastSig = lastSigAfterPrefix(prefix);
  let prevStar = prefixLastStar(prefix);
  const used = new Set();
  let out = "";
  for (let i = 0; i < length; i++) {
    const isLast = i === length - 1;
    // chèn 0/5 (nếu được phép) với xác suất nhỏ, không bao giờ ở cuối
    if (ctx.allowZeroFive && !isLast && i > 0 && rng() < 0.06) {
      out += rng() < 0.5 ? "0" : "5";
      continue;
    }
    const weights = SIG.map((d) => {
      if (!lastSig) return 1;
      const info = pairStar(lastSig, d);
      let w = stepWeight(info.star, prevStar, ctx, lastSig + d, used);
      if (isLast) {
        if (!CAT.has(info.star)) return 0;
        if (ctx.tailStar && info.star !== ctx.tailStar) return 0;
      }
      return w;
    });
    const d = pick(rng, SIG, weights);
    if (lastSig) {
      const info = pairStar(lastSig, d);
      prevStar = info.star;
      used.add(info.star);
    }
    lastSig = d;
    out += d;
  }
  return out;
}

function needBoost(profile) {
  const boost = {};
  if (!profile) return boost;
  for (const s of profile.needs || []) boost[s] = 1.8;
  return boost;
}

function reasonsFor(a, profile) {
  const out = [];
  const tp = a.tailPair;
  if (tp) out.push(`Đuôi ${STARS[tp.star].name} ${tp.text} – ${STARS[tp.star].tag.split(" · ")[0].toLowerCase()}`);
  const good = ["SK", "TY", "DN"].filter((id) => a.counts[id] > 0).map((id) => STARS[id].name);
  if (good.length === 3) out.push("Đủ bộ Sinh khí – Thiên y – Diên niên");
  else if (good.length) out.push(`Có ${good.join(", ")}`);
  if (a.pairs.every((p) => STARS[p.star].base >= 0)) out.push("Không có hung tinh");
  else if (a.pairs.some((p) => p.healed)) out.push("Hung tinh có hóa thần chế hóa");
  if (a.zeroCount === 0 && !a.endsWith05) out.push("Không có số 0/5 gây hao khí");
  if (profile) {
    const healers = (profile.needs || []).filter((s) => a.counts[s] > 0).map((s) => STARS[s].name);
    if (healers.length) out.push(`Bù cho CCCD: ${healers.join(", ")}`);
  }
  return out.slice(0, 4);
}

/**
 * @param {object} o
 * @param {string} o.carrierId
 * @param {string} [o.goal]       khóa trong GOALS
 * @param {string|null} [o.gender] "nam" | "nu" | null
 * @param {number} [o.count]
 * @param {number} [o.seed]
 * @param {boolean} [o.allowZeroFive]
 * @param {string|null} [o.tailStar] "SK" | "TY" | "DN" | null
 * @param {object|null} [o.profile] kết quả analyzeCCCD để cá nhân hóa
 */
export function generateForCarrier(o) {
  const carrier = carrierById(o.carrierId);
  if (!carrier) return [];
  const goal = GOALS[o.goal] || GOALS.can_bang;
  const count = o.count ?? 10;
  const rng = mulberry32((o.seed ?? 1) + carrier.id.length * 7919);
  const ctx = {
    goalW: goal.w,
    boost: needBoost(o.profile),
    female: o.gender === "nu",
    allowZeroFive: !!o.allowZeroFive,
    tailStar: o.tailStar || null,
  };

  const pool = new Map();
  const attempts = 1800;
  for (let i = 0; i < attempts; i++) {
    const prefix = carrier.prefixes[Math.floor(rng() * carrier.prefixes.length)];
    const tail = buildTail(rng, prefix, ctx);
    const num = prefix + tail;
    if (pool.has(num)) continue;
    const a = analyzePhone(num, { gender: o.gender });
    let rank = goal.domain ? a.total * 0.6 + a.domains[goal.domain] * 0.4 : a.total;
    if (o.profile) {
      const hit = (o.profile.needs || []).filter((s) => a.counts[s] > 0).length;
      rank += Math.min(6, hit * 2);
    }
    pool.set(num, { number: num, carrierId: carrier.id, rank, analysis: a });
  }

  const sorted = [...pool.values()].sort((x, y) => y.rank - x.rank);
  const perPrefixCap = Math.ceil(count / Math.min(carrier.prefixes.length, 3));
  const perPrefix = {};
  const tails4 = new Set();
  const picked = [];
  for (const c of sorted) {
    const pf = c.number.slice(0, 3);
    const t4 = c.number.slice(-4);
    if ((perPrefix[pf] || 0) >= perPrefixCap || tails4.has(t4)) continue;
    if (ctx.female && c.analysis.pairs.some((p) => DN_STRONG.has(p.a + p.b))) continue;
    perPrefix[pf] = (perPrefix[pf] || 0) + 1;
    tails4.add(t4);
    picked.push({ ...c, formatted: formatPhone(c.number), reasons: reasonsFor(c.analysis, o.profile) });
    if (picked.length >= count) break;
  }
  return picked;
}

export function generateAll(o) {
  return CARRIERS.map((c) => ({ carrier: c, items: generateForCarrier({ ...o, carrierId: c.id, count: o.perCarrier ?? 3 }) }));
}
