// Cân xương (xưng cốt) theo ngày giờ sinh âm lịch: cộng trọng lượng năm + tháng + ngày + giờ (đơn vị lượng, chỉ).
// Phần này KHÔNG dùng Bát tinh/thần số học: chỉ dùng bảng trọng lượng cân xương và các số suy ra từ kết quả cân.
// Lưu ý: phương pháp cân xương chỉ có lời bàn về vận mệnh; việc suy ra "số hợp" cho SĐT/xổ số là QUY ƯỚC của ứng dụng (xem moTaQuyUoc).
import { YEAR_W, MONTH_W, DAY_W, HOUR_W, CHI_NAMES, CHI_HOURS } from "./bone_data.js";
import { solarToLunar } from "./lunar.js";
import { CARRIERS, carrierById } from "./carriers.js";
import { mulberry32 } from "./generator.js";
import { PRIZES, stationsFor, WEEKDAYS } from "./lucky.js";

export { CHI_NAMES, CHI_HOURS };

const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"]; // theo chữ số cuối của năm
export const canChiOfYear = (y) => `${CAN[((y % 10) + 10) % 10]} ${CHI_NAMES[(((y - 4) % 12) + 12) % 12]}`;

export const hourIndex = (h) => Math.floor(((h + 1) % 24) / 2); // 23:00–00:59 → Tý (0)

export function fmtLuongChi(w) {
  const l = Math.floor(w / 10);
  const c = w % 10;
  if (l && c) return `${l} lượng ${c} chỉ`;
  if (l) return `${l} lượng`;
  return `${c} chỉ`;
}

// Lời giải theo NHÓM mức cân (tóm tắt của ứng dụng; bản gốc "Xưng cốt ca" có lời riêng cho từng mức).
export const TIERS = [
  { min: 21, max: 30, name: "Mệnh nhẹ", range: "2,1 – 3,0 lượng", text: "Nhóm nhẹ nhất theo phương pháp: tuổi trẻ nhiều vất vả, hay phải tự lực, có thể xa quê lập nghiệp. Bù lại, sự cần cù và chịu khó dần tích lũy thành nền tảng.", advice: "Học nghề chắc tay, sống giản dị, giữ sức khỏe và tránh đặt cược lớn." },
  { min: 31, max: 40, name: "Nhẹ đến vừa", range: "3,1 – 4,0 lượng", text: "Lúc đầu còn lo toan, sau dần ổn định. Thành quả đến từ lao động đều đặn hơn là từ may rủi; hợp công việc bền bỉ, tích lũy từ từ.", advice: "Cẩn trọng chuyện hùn hạp, vay mượn; ưu tiên công việc ổn định." },
  { min: 41, max: 50, name: "Mệnh vừa", range: "4,1 – 5,0 lượng", text: "Cuộc sống đủ đầy ở mức bình thường, có lúc thăng trầm nhưng thường có người đỡ đầu. Hợp lối sống điềm đạm, giữ chữ tín.", advice: "Tránh tiêu hoang, giữ quan hệ gia đình và bạn bè." },
  { min: 51, max: 60, name: "Mệnh khá", range: "5,1 – 6,0 lượng", text: "Phúc lộc khá dày, dễ gặp quý nhân, công việc và danh tiếng tương đối thuận. Thành công đi cùng sự nhân hòa.", advice: "Biết chia sẻ và giữ nhân hòa để phúc bền lâu." },
  { min: 61, max: 70, name: "Mệnh nặng", range: "6,1 – 7,0 lượng", text: "Được xem là mệnh tốt về công danh, tài lộc; có sức gánh vác việc lớn và trách nhiệm lớn.", advice: "Giữ khiêm nhường, tránh tham vọng quá mức và kiêu ngạo." },
  { min: 71, max: 99, name: "Mệnh rất nặng", range: "từ 7,1 lượng", text: "Mức cao nhất trong phương pháp, truyền thống ví như bậc đại quý và là mức rất hiếm gặp.", advice: "Điểm số chỉ để tham khảo; công việc và đức độ vẫn là gốc." },
];
export const tierOf = (w) => TIERS.find((t) => w >= t.min && w <= t.max) || null;

/**
 * @param {{year:number, month:number, day:number, hourIdx:number}} o  ngày dương lịch và chỉ số giờ (0 = Tý … 11 = Hợi)
 */
export function computeBone({ year, month, day, hourIdx }) {
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) throw new Error("Ngày sinh không hợp lệ.");
  if (!(hourIdx >= 0 && hourIdx <= 11)) throw new Error("Giờ sinh không hợp lệ.");
  const lunar = solarToLunar(day, month, year);
  const canChi = canChiOfYear(lunar.year);
  const parts = { year: YEAR_W[canChi], month: MONTH_W[lunar.month - 1], day: DAY_W[lunar.day - 1], hour: HOUR_W[hourIdx] };
  const total = parts.year + parts.month + parts.day + parts.hour;
  return { solar: { year, month, day }, lunar, canChi, hourIdx, hourName: CHI_NAMES[hourIdx], parts, total, L: Math.floor(total / 10), C: total % 10, tier: tierOf(total) };
}

/* ----------------------------------------------------------------- số hợp theo cân xương ---- */
const reduce9 = (n) => { let x = Math.abs(n); while (x > 9) x = String(x).split("").reduce((a, d) => a + Number(d), 0); return x; };
const digitsSum = (s) => [...s].reduce((a, d) => a + Number(d), 0);

export const moTaQuyUoc = "Cân xương chỉ cho lời bàn về vận mệnh. Việc chọn số theo cân xương là quy ước của ứng dụng: lấy chữ số của lượng, chỉ, số gốc của tổng, ngày âm, tháng âm và giờ sinh làm “số hợp”; số đẹp là số có nhiều số hợp, đuôi là cặp lượng–chỉ, và tổng các chữ số rút gọn bằng số gốc.";

export function boneNumbers(b) {
  const { L, C, total } = b;
  const root = reduce9(total);
  const labels = new Map();
  const add = (d, label) => { d = String(d); if (!labels.has(d)) labels.set(d, label); };
  add(L, `lượng ${L}`);
  add(C, `chỉ ${C}`);
  add(root, `số gốc ${root}`);
  add(b.lunar.day % 10, `ngày âm ${b.lunar.day}`);
  add(b.lunar.month % 10, `tháng âm ${b.lunar.month}`);
  add((b.hourIdx + 1) % 10, `giờ ${b.hourName}`);
  const pairs = [...new Set([`${L}${C}`, `${C}${L}`])];
  return { root, support: new Set(labels.keys()), labels, pairs, main: new Set([String(L), String(C)]) };
}

const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
const pick = (rng, items, w) => { const t = w.reduce((a, b) => a + b, 0); let r = rng() * t; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const fmtPhone = (d) => `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;

/** Bảng SĐT hợp cân xương cho một nhà mạng. */
export function suggestPhones(b, { carrierId, count = 10, seed = 1 }) {
  const carrier = carrierById(carrierId);
  const nums = boneNumbers(b);
  if (!carrier) return [];
  const rng = mulberry32(hash(`phone|${b.total}|${b.lunar.day}|${b.lunar.month}|${b.hourIdx}|${carrierId}|${seed}`));
  const w = DIGITS.map((d) => (nums.support.has(d) ? 3 : 1));
  const pool = new Map();
  for (let i = 0; i < 1600; i++) {
    const prefix = carrier.prefixes[Math.floor(rng() * carrier.prefixes.length)];
    let tail = "";
    for (let k = 0; k < 7; k++) tail += pick(rng, DIGITS, w);
    if (rng() < 0.55) tail = tail.slice(0, 5) + nums.pairs[Math.floor(rng() * nums.pairs.length)];
    const num = prefix + tail;
    if (pool.has(num)) continue;
    const reasons = [];
    let score = 0;
    const last2 = num.slice(-2);
    if (nums.pairs.includes(last2)) { score += 3; reasons.push(`Đuôi ${last2} là cặp lượng–chỉ`); }
    if (reduce9(digitsSum(num)) === nums.root) { score += 2; reasons.push(`Tổng chữ số rút gọn = ${nums.root} (số gốc)`); }
    const body = num.slice(1);
    const hit = [...body].filter((d) => nums.support.has(d)).length;
    if (hit >= 6) { score += 2; reasons.push(`${hit}/9 chữ số là số hợp`); }
    if (hit >= 8) score += 1;
    if (nums.pairs.some((p) => body.includes(p))) { score += 1; if (!nums.pairs.includes(last2)) reasons.push("Chứa cặp lượng–chỉ liền nhau"); }
    pool.set(num, { number: num, formatted: fmtPhone(num), carrierId, score, reasons, rank: score + rng() });
  }
  const sorted = [...pool.values()].sort((x, y) => y.rank - x.rank);
  const cap = Math.ceil(count / Math.min(carrier.prefixes.length, 3));
  const perPrefix = {};
  const tails = new Set();
  const out = [];
  for (const c of sorted) {
    const pf = c.number.slice(0, 3);
    const t4 = c.number.slice(-4);
    if ((perPrefix[pf] || 0) >= cap || tails.has(t4)) continue;
    perPrefix[pf] = (perPrefix[pf] || 0) + 1;
    tails.add(t4);
    out.push(c);
    if (out.length >= count) break;
  }
  return out;
}

/** Bảng số may mắn xổ số miền Nam theo cân xương (đủ cơ cấu giải 18 dãy mỗi đài; không dùng kết quả cũ, không dùng Bát tinh). */
export function boneLucky({ bone, date, station = "", variant = 0 }) {
  const nums = boneNumbers(bone);
  const stations = stationsFor(date);
  const targets = station ? [station] : stations;
  const iso = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const w = DIGITS.map((d) => (nums.support.has(d) ? 2.2 : 1));
  const taken = new Set();
  const groups = targets.map((name) => {
    const rng = mulberry32(hash(`lucky|${bone.total}|${bone.lunar.day}|${bone.lunar.month}|${bone.hourIdx}|${iso}|${name}|${variant}`));
    const tiers = PRIZES.map((prize) => {
      const cands = new Map();
      for (let i = 0; i < 160 + 40 * prize.count; i++) {
        let num = "";
        for (let k = 0; k < prize.digits; k++) num += pick(rng, DIGITS, w);
        if (taken.has(`${prize.digits}:${num}`) || cands.has(num)) continue;
        const hit = [...num].filter((d) => nums.support.has(d)).length;
        let score = hit * 2;
        if (prize.digits >= 3 && nums.support.has(num.at(-1))) score += 3;
        if (nums.pairs.some((p) => num.includes(p))) score += prize.digits >= 5 ? 4 : 1; // cặp lượng–chỉ ưu tiên ở các giải 5–6 số
        if (prize.key === "DB" && reduce9(digitsSum(num)) === nums.root) score += 4;
        cands.set(num, { number: num, score: score + rng() * 2 });
      }
      const items = [...cands.values()].sort((x, y) => y.score - x.score).slice(0, prize.count);
      items.forEach((it) => taken.add(`${prize.digits}:${it.number}`));
      return { ...prize, items };
    });
    const anchors = [...nums.labels.entries()].map(([digit, label]) => ({ digit, label }));
    return {
      station: name, mode: "bone", tiers, anchors, stat: null, recentSource: null,
      note: `Số hợp theo cân xương ${fmtLuongChi(bone.total)}: ${[...nums.support].sort().join(", ")} · số gốc ${nums.root} · cặp ${nums.pairs.join("/")}. Ưu tiên dãy có nhiều số hợp, đuôi là số hợp, giải đặc biệt chứa cặp lượng–chỉ và có tổng chữ số rút gọn bằng số gốc.`,
    };
  });
  return { date, mode: "bone", bone, groups };
}

export { CARRIERS, WEEKDAYS };
