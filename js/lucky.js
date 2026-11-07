// Bộ số may mắn theo CẤU TRÚC GIẢI xổ số kiến thiết miền Nam (từ giải tám 2 số đến giải đặc biệt 6 số),
// cá nhân hóa theo CCCD, giới tính, ngày và đài.
// LƯU Ý: xổ số là ngẫu nhiên; không có bộ số nào làm tăng xác suất trúng. Đây chỉ là gợi ý mang tính giải trí,
// chọn theo Bát tinh (cặp số cát, đuôi cát) cùng các "số neo" lấy từ ngày và CCCD của bạn.
import { analyze, analyzeCCCD, digitsOnly, pairStar } from "./engine.js";
import { mulberry32 } from "./generator.js";
import { STARS, CAT, HEAL } from "./data.js";

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

function buildDigits(rng, len, pool, anchorDigits, needs) {
  let lastSig = null;
  let prevStar = null;
  let out = "";
  for (let i = 0; i < len; i++) {
    const isLast = i === len - 1;
    const w = pool.map((d) => {
      let x = 1;
      const zeroFive = d === "0" || d === "5";
      if (zeroFive) x = isLast ? 0.15 : 0.7;
      else if (lastSig) {
        const star = pairStar(lastSig, d).star;
        if (CAT.has(star)) x = 3;
        else if (star === "PV") x = 0.3;
        else x = isLast ? 0 : 0.15;
        if (prevStar && STARS[prevStar].base < 0 && HEAL[prevStar]?.includes(star)) x *= 3;
        if (needs.has(star)) x *= 1.5;
      }
      if (anchorDigits.has(d)) x *= 2.2;
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

/**
 * Sinh bộ số theo cơ cấu giải cho từng đài.
 * @param {object} o
 * @param {string} [o.cccd]        12 số (tùy chọn)
 * @param {string|null} [o.gender] "nam" | "nu" | null (nếu rỗng sẽ lấy từ CCCD)
 * @param {Date} o.date
 * @param {string} [o.station]     tên đài; rỗng = tất cả đài trong ngày
 * @param {boolean} [o.allow05]
 * @param {number} [o.variant]
 * @returns {{date: Date, gender: string|null, profile: object|null, groups: Array}}
 */
export function generateLucky(o) {
  const date = o.date;
  const cccdDigits = digitsOnly(o.cccd || "");
  const profile = cccdDigits.length === 12 ? analyzeCCCD(cccdDigits, date) : null;
  const gender = o.gender || profile?.info.gender || null;
  const stations = stationsFor(date);
  const targets = o.station ? [o.station] : stations;
  const pool = o.allow05 ? ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] : ["1", "2", "3", "4", "6", "7", "8", "9"];
  const needs = new Set(profile?.needs || []);
  const iso = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const groups = [];
  const takenAcross = new Set(); // tránh các đài trong cùng ngày trùng dãy số
  for (const name of targets) {
    const idx = Math.max(0, stations.indexOf(name));
    const anchors = anchorsFor(date, idx, profile?.info.birthYear).filter((a) => pool.includes(a.digit));
    const anchorDigits = new Set(anchors.map((a) => a.digit));
    const rng = mulberry32(fnv1a(`${cccdDigits}|${gender}|${iso}|${name}|${o.allow05 ? 1 : 0}|${o.variant || 0}`));
    const tiers = [];
    for (const prize of PRIZES) {
      const pooled = new Map();
      const attempts = 60 + 60 * prize.count;
      for (let i = 0; i < attempts; i++) {
        const num = buildDigits(rng, prize.digits, pool, anchorDigits, needs);
        if (pooled.has(num) || takenAcross.has(`${prize.digits}:${num}`)) continue;
        const counts = {};
        for (const d of num) counts[d] = (counts[d] || 0) + 1;
        if (prize.digits >= 4 && Math.max(...Object.values(counts)) > 3) continue;
        const a = analyze(num, { gender });
        const hit = anchors.filter((x, k) => num.includes(x.digit) && anchors.findIndex((y) => y.digit === x.digit) === k);
        let rank = a.total + Math.min(9, hit.length * 3) + rng() * 6; // xáo nhẹ để mỗi đài/giải khác nhau
        if (profile) rank += Math.min(6, [...needs].filter((s) => a.counts[s] > 0).length * 2);
        pooled.set(num, { number: num, analysis: a, rank, hit });
      }
      const picked = [...pooled.values()].sort((x, y) => y.rank - x.rank).slice(0, prize.count);
      picked.forEach((c) => takenAcross.add(`${prize.digits}:${c.number}`));
      tiers.push({ ...prize, items: picked });
    }
    groups.push({ station: name, anchors, tiers });
  }
  return { date, gender, profile, groups };
}
