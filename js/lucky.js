// Bộ số may mắn 6 chữ số (vé số kiến thiết miền Nam), cá nhân hóa theo CCCD, giới tính, ngày và đài.
// LƯU Ý: xổ số là ngẫu nhiên; không có bộ số nào làm tăng xác suất trúng. Đây chỉ là gợi ý mang tính giải trí,
// chọn theo Bát tinh (cặp số cát, đuôi cát) cùng các "số neo" lấy từ ngày và CCCD của bạn.
import { analyze, analyzeCCCD, digitsOnly } from "./engine.js";
import { mulberry32 } from "./generator.js";
import { STARS, CAT, HEAL } from "./data.js";
import { pairStar } from "./engine.js";

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

function buildSix(rng, pool, anchorDigits, needs) {
  let lastSig = null;
  let prevStar = null;
  let out = "";
  for (let i = 0; i < 6; i++) {
    const isLast = i === 5;
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
 * @param {object} o
 * @param {string} [o.cccd]        12 số (tùy chọn)
 * @param {string|null} [o.gender] "nam" | "nu" | null (nếu rỗng sẽ lấy từ CCCD)
 * @param {Date} o.date
 * @param {string} [o.station]     tên đài; rỗng = tất cả đài trong ngày
 * @param {boolean} [o.allow05]
 * @param {number} [o.variant]
 */
export function generateLucky(o) {
  const date = o.date;
  const cccdDigits = digitsOnly(o.cccd || "");
  const profile = cccdDigits.length === 12 ? analyzeCCCD(cccdDigits, date) : null;
  const gender = o.gender || profile?.info.gender || null;
  const stations = stationsFor(date);
  const targets = o.station ? [o.station] : stations;
  const perStation = o.station ? 6 : 2;
  const pool = o.allow05 ? ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] : ["1", "2", "3", "4", "6", "7", "8", "9"];
  const needs = new Set(profile?.needs || []);
  const iso = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const groups = [];
  const taken = new Set();
  for (const name of targets) {
    const idx = Math.max(0, stations.indexOf(name));
    const anchors = anchorsFor(date, idx, profile?.info.birthYear).filter((a) => pool.includes(a.digit));
    const anchorDigits = new Set(anchors.map((a) => a.digit));
    const rng = mulberry32(fnv1a(`${cccdDigits}|${gender}|${iso}|${name}|${o.allow05 ? 1 : 0}|${o.variant || 0}`));
    const pooled = new Map();
    for (let i = 0; i < 500; i++) {
      const num = buildSix(rng, pool, anchorDigits, needs);
      if (pooled.has(num)) continue;
      const counts = {};
      for (const d of num) counts[d] = (counts[d] || 0) + 1;
      if (Math.max(...Object.values(counts)) > 3) continue;
      const a = analyze(num, { gender });
      const hit = anchors.filter((x, k) => num.includes(x.digit) && anchors.findIndex((y) => y.digit === x.digit) === k);
      let rank = a.total + Math.min(9, hit.length * 3) + rng() * 6; // xáo nhẹ để mỗi đài/bộ khác nhau
      if (profile) rank += Math.min(6, [...needs].filter((s) => a.counts[s] > 0).length * 2);
      pooled.set(num, { number: num, analysis: a, rank, hit });
    }
    const sorted = [...pooled.values()].sort((x, y) => y.rank - x.rank);
    const picked = [];
    const used2 = new Set();
    for (const c of sorted) {
      const t2 = c.number.slice(-2);
      if (used2.has(t2) || taken.has(c.number)) continue;
      used2.add(t2);
      taken.add(c.number);
      picked.push({ ...c, formatted: `${c.number.slice(0, 3)} ${c.number.slice(3)}` });
      if (picked.length >= perStation) break;
    }
    groups.push({ station: name, items: picked });
  }
  return { date, gender, profile, groups };
}
