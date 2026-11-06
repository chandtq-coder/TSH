// Bộ máy phân tích Bát tinh cho dãy số (SĐT, CCCD, dãy số bất kỳ). Thuần JS, không phụ thuộc DOM.
import { STARS, STAR_ORDER, HEAL, HEAL_NUMBERS, DOMAINS, COMBOS, PATTERNS, PROVINCES, CAT } from "./data.js";
import { carrierByPrefix } from "./carriers.js";

const RANK_MULT = [1, 0.85, 0.65, 0.5];
const DN_STRONG = new Set(["19", "91", "78", "87"]);

// ---- Bảng tra cặp số -> từ trường -------------------------------------------------------------
const PAIR_INDEX = new Map();
for (const id of STAR_ORDER) {
  STARS[id].pairs.forEach((group, rank) => group.forEach((p) => PAIR_INDEX.set(p, { star: id, rank })));
}

export function pairStar(a, b) {
  return PAIR_INDEX.get(`${a}${b}`) || null;
}

export function digitsOnly(s) {
  return String(s ?? "").replace(/\D/g, "");
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ---- Phân tích chuỗi số ----------------------------------------------------------------------
// Quy tắc (giáo trình tr.43, 68–72): 0 và 5 không tạo từ trường riêng; 0 “ẩn/rút bớt” còn 5 “hiển/kéo dài”
// năng lượng của cặp số chứa chúng. Chuỗi 13957230123 cho ra đúng 8 sao: TY SK NQ TY HH TY TM HH như sách.
export function analyze(raw, opts = {}) {
  const { gender = null, phonePrefix = false, strictTail = true } = opts;
  const digits = digitsOnly(raw);
  const cells = [...digits].map((d, i) => ({ d, i, kind: d === "0" ? "zero" : d === "5" ? "five" : "sig" }));
  if (phonePrefix && cells[0]?.d === "0") cells[0].kind = "prefix";
  const firstSig = cells.findIndex((c) => c.kind === "sig");
  cells.forEach((c, i) => {
    if ((firstSig === -1 || i < firstSig) && (c.kind === "zero" || c.kind === "five")) c.kind = "lead";
  });

  const sig = cells.filter((c) => c.kind === "sig");
  const pairs = [];
  for (let k = 0; k < sig.length - 1; k++) {
    const A = sig[k];
    const B = sig[k + 1];
    const info = pairStar(A.d, B.d);
    let zero = 0;
    let five = 0;
    for (let j = A.i + 1; j < B.i; j++) cells[j].d === "0" ? zero++ : five++;
    pairs.push({ idx: k, a: A.d, b: B.d, from: A.i, to: B.i, text: digits.slice(A.i, B.i + 1), star: info.star, rank: info.rank, zero, five });
  }

  const last = sig[sig.length - 1];
  let tailZero = 0;
  let tailFive = 0;
  if (last) {
    for (let j = last.i + 1; j < cells.length; j++) cells[j].d === "0" ? tailZero++ : tailFive++;
  }
  const endsWith05 = /[05]$/.test(digits);

  const counts = Object.fromEntries(STAR_ORDER.map((id) => [id, 0]));
  pairs.forEach((p) => counts[p.star]++);

  // Điểm tổng
  let raw$ = 0;
  const n = pairs.length;
  pairs.forEach((p, k) => {
    const st = STARS[p.star];
    const fromEnd = n - 1 - k;
    const posW = fromEnd === 0 ? 2.5 : fromEnd === 1 ? 1.8 : 1;
    const mod = st.good ? Math.max(0.35, 1 + 0.15 * p.five - 0.3 * p.zero) : 1 + 0.2 * (p.zero + p.five);
    let v = st.base * RANK_MULT[p.rank] * mod * posW;
    const next = pairs[k + 1];
    if (st.base < 0 && next) {
      if (HEAL[p.star]?.includes(next.star)) {
        v += -v * 0.6;
        p.healed = true;
      } else if (STARS[next.star].base < 0) {
        v -= 3;
      }
    }
    if (st.base < 0 && fromEnd === 0) {
      v -= 6;
      p.tailHung = true;
    }
    p.value = v;
    raw$ += v;
  });

  const zeroCount = [...digits].filter((d, i) => d === "0" && !(phonePrefix && i === 0)).length;
  const adj = [];
  let allCat = false;
  if (n >= 2) {
    if (endsWith05 && strictTail) { raw$ -= 18; adj.push("Số cuối là 0 hoặc 5"); }
    if (zeroCount >= 2) { raw$ -= 5 * (zeroCount - 1); adj.push(`Có ${zeroCount} số 0`); }
    if (counts.SK === 0) raw$ -= 7;
    if (counts.TY === 0) raw$ -= 7;
    if (counts.SK > 0 && counts.TY > 0) raw$ += 3;
    if (counts.SK > 0 && counts.TY > 0 && counts.DN > 0) raw$ += 2;
    const anyHung = pairs.some((p) => STARS[p.star].base < 0);
    const openHung = pairs.some((p) => STARS[p.star].base < 0 && !p.healed);
    if (n >= 5 && !anyHung) { raw$ -= 5; allCat = true; }
    if (anyHung && !openHung) raw$ += 2;
    if (counts.PV >= 2) raw$ -= 5 * (counts.PV - 1);
    for (const pt of PATTERNS) {
      if (pt.re.test(digits)) raw$ -= 4;
      pt.re.lastIndex = 0;
    }
    if (gender === "nu" && pairs.some((p) => DN_STRONG.has(p.a + p.b))) raw$ -= 5;
  }
  const total = n === 0 ? 0 : clamp(Math.round(50 + raw$ * 0.42), 3, 99);

  // Điểm 5 lĩnh vực
  const domains = {};
  for (const [key, def] of Object.entries(DOMAINS)) {
    let s = 0;
    pairs.forEach((p, k) => {
      const fromEnd = n - 1 - k;
      s += (def.w[p.star] || 0) * RANK_MULT[p.rank] * (fromEnd === 0 ? 1.5 : fromEnd === 1 ? 1.2 : 1);
    });
    domains[key] = n === 0 ? 0 : clamp(Math.round(50 + s * 1.6), 8, 98);
  }

  // Sao chủ đạo (Pháp tắc hai): loại sao nhiều nhất
  let dominant = null;
  let best = -1;
  for (const id of STAR_ORDER) {
    const weight = counts[id] * 10 + pairs.filter((p) => p.star === id).reduce((a, p) => a + (3 - p.rank), 0);
    if (counts[id] > 0 && weight > best) { best = weight; dominant = id; }
  }

  const tailPair = pairs[n - 1] || null;
  const res = {
    digits, cells, pairs, counts, total, domains, dominant, tailPair,
    zeroCount, endsWith05, tailZero, tailFive, gender, strictTail, allCat,
    level: levelOf(total, n),
    combos: [],
    flags: [],
    heal: [],
  };
  for (let k = 0; k < n - 1; k++) {
    const a = pairs[k].star;
    const b = pairs[k + 1].star;
    res.combos.push({ from: a, to: b, at: k, text: COMBOS[a][b] });
  }
  buildFlags(res);
  return res;
}

export function levelOf(score, n = 1) {
  if (n === 0) return { label: "Chưa đủ dữ liệu", tone: "muted" };
  if (score >= 82) return { label: "Rất tốt", tone: "good" };
  if (score >= 70) return { label: "Tốt", tone: "good" };
  if (score >= 56) return { label: "Khá", tone: "ok" };
  if (score >= 44) return { label: "Trung bình", tone: "warn" };
  if (score >= 30) return { label: "Nhiều lưu ý", tone: "warn" };
  return { label: "Không khuyến nghị", tone: "bad" };
}

function buildFlags(res) {
  const { pairs, counts, flags, digits } = res;
  const n = pairs.length;
  if (n === 0) {
    flags.push({ tone: "info", title: "Chưa đủ dữ liệu", text: "Cần ít nhất hai chữ số khác 0 và 5 để tạo cặp từ trường." });
    return;
  }
  const tp = res.tailPair;
  const ts = STARS[tp.star];
  if (CAT.has(tp.star)) {
    flags.push({ tone: "good", title: `Số đuôi là ${ts.name} (${tp.text})`, text: `Giáo trình: “số đuôi tất cát mới có thể thành quả”. ${ts.tag}.` });
  } else if (tp.star === "PV") {
    flags.push({ tone: "info", title: `Số đuôi là Phục vị (${tp.text})`, text: "Phục vị kéo dài năng lượng phía trước; thiên về ổn định, bị động." });
  } else if (tp.healed) {
    // không xảy ra ở đuôi (không có pair sau) – giữ cho đầy đủ
  } else {
    flags.push({ tone: "bad", title: `Số đuôi là ${ts.name} (${tp.text})`, text: "Giáo trình khuyên không dùng hung tinh làm số đuôi vì kết quả cuối cùng có xu hướng chuyển xấu." });
  }
  if (res.endsWith05) {
    flags.push(res.strictTail
      ? { tone: "bad", title: "Số cuối là 0 hoặc 5", text: "Giáo trình gọi là “tứ đại giai không” (tài, nghiệp, tình, sức khỏe đều “không”): số đuôi nhất định không nên là 0 hoặc 05." }
      : { tone: "info", title: "Số cuối là 0 hoặc 5", text: "Với số tiên thiên (CCCD) bạn không thể đổi; giáo trình khuyên dùng SĐT hậu thiên có đuôi cát tinh để bù." });
  }
  if (res.zeroCount >= 2) {
    flags.push({ tone: res.zeroCount >= 3 ? "bad" : "warn", title: `Có ${res.zeroCount} số 0`, text: "Giáo trình: dãy số nhiều số 0 là hao tiết nguyên khí, kiếm tiền vất vả; nên hạn chế." });
  }
  const healed = pairs.filter((p) => p.healed);
  healed.forEach((p) => {
    const nx = pairs[p.idx + 1];
    flags.push({ tone: "good", title: `${STARS[p.star].name} (${p.text}) được ${STARS[nx.star].name} (${nx.text}) hóa giải`, text: "Hung tinh có “hóa thần” đứng ngay sau nên bớt hung (giáo trình: “Tứ hung tinh, phải có hóa thần”)." });
  });
  const hungOpen = pairs.filter((p) => STARS[p.star].base < 0 && !p.healed);
  if (hungOpen.length >= 3) {
    flags.push({ tone: "bad", title: `${hungOpen.length} cặp hung tinh chưa được hóa giải`, text: "Nhiều hung tinh trong cùng dãy; nên cân nhắc đổi số hoặc bổ sung cát tinh chế hóa." });
  }
  if (res.allCat) {
    flags.push({ tone: "info", title: "Toàn cát tinh", text: "Giáo trình: số điện thoại không nên toàn cát tinh, cũng không nên toàn hung tinh – “có ăn có thải”, cát bên trong có chút hung đã hóa giải mới thành dụng." });
  }
  if (counts.SK === 0) flags.push({ tone: "warn", title: "Không có Sinh khí", text: "Giáo trình: thiếu Sinh khí (14, 67, 39, 28) thì ít quý nhân trợ giúp, mọi thứ dựa vào bản thân." });
  if (counts.TY === 0) flags.push({ tone: "warn", title: "Không có Thiên y", text: "Giáo trình: thiếu Thiên y (13, 68, 49, 27) thì tài vận kém lý tưởng, hôn nhân khó hài hòa." });
  pairs.forEach((p) => {
    if (p.star === "SK" && p.zero > 0) flags.push({ tone: "warn", title: `Sinh khí ${p.text} có số 0 ở giữa`, text: "Sinh khí ở giữa thêm 0: dễ gặp tiểu nhân." });
    if (p.star === "TY" && p.zero > 0) flags.push({ tone: "info", title: `Thiên y ${p.text} có số 0 ở giữa`, text: "Tình cảm ẩn giấu, khó nhìn thấy; kiểu “ngoài giá thú” theo cách nói của giáo trình, chỉ là khuynh hướng." });
  });
  for (const pt of PATTERNS) {
    if (pt.re.test(digits)) flags.push({ tone: pt.tone, title: pt.title, text: pt.text });
    pt.re.lastIndex = 0;
  }
  if (res.gender === "nu" && pairs.some((p) => DN_STRONG.has(p.a + p.b))) {
    flags.push({ tone: "warn", title: "Diên niên cấp cao (19/91/78/87)", text: "Giáo trình cho rằng các cặp này quá mạnh với nữ giới; nếu theo quan điểm này, ưu tiên 34/43 hoặc 26/62." });
  }
  if (res.dominant) {
    const d = STARS[res.dominant];
    flags.push({ tone: "info", title: `Sao chủ đạo: ${d.name} (${counts[res.dominant]} cặp)`, text: `Pháp tắc hai: loại sao nhiều nhất sẽ mạnh nhất. ${d.tag}.` });
  }
  // Gợi ý hóa giải
  const needs = new Set();
  pairs.forEach((p) => {
    if (STARS[p.star].base < 0 && !p.healed) HEAL[p.star]?.forEach((s) => needs.add(s));
  });
  res.heal = [...needs];
}

// ---- Thông tin nhà mạng & định dạng ---------------------------------------------------------
export function normalizePhone(input) {
  let d = digitsOnly(input);
  if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2);
  return d;
}

export function formatPhone(d) {
  const s = digitsOnly(d);
  return s.length === 10 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : s;
}

export function analyzePhone(input, opts = {}) {
  const phone = normalizePhone(input);
  const problems = [];
  if (phone.length !== 10) problems.push("SĐT di động Việt Nam gồm đúng 10 chữ số.");
  if (!phone.startsWith("0")) problems.push("SĐT phải bắt đầu bằng 0 (hoặc +84).");
  const carrier = phone.length >= 3 ? carrierByPrefix(phone.slice(0, 3)) : null;
  const res = analyze(phone, { ...opts, phonePrefix: true });
  return { ...res, phone, carrier, problems };
}

// ---- CCCD ---------------------------------------------------------------------------------------
export function parseCCCD(input, now = new Date()) {
  const d = digitsOnly(input);
  const out = { digits: d, valid: false, problems: [] };
  if (d.length !== 12) { out.problems.push("CCCD gồm đúng 12 chữ số."); return out; }
  const provinceCode = d.slice(0, 3);
  const c = Number(d[3]);
  const century = 20 + Math.floor(c / 2); // 0/1 → TK20 (19xx), 2/3 → TK21 (20xx)…
  const male = c % 2 === 0;
  const yy = Number(d.slice(4, 6));
  const birthYear = (century - 1) * 100 + yy;
  const year = now.getFullYear();
  out.provinceCode = provinceCode;
  out.province = PROVINCES[provinceCode] || null;
  out.gender = male ? "nam" : "nu";
  out.birthYear = birthYear;
  out.age = year - birthYear;
  out.serial = d.slice(6);
  if (!out.province) out.problems.push(`Mã tỉnh ${provinceCode} không có trong bảng tra.`);
  if (birthYear > year) out.problems.push("Năm sinh suy ra lớn hơn năm hiện tại.");
  out.valid = out.problems.length === 0;
  return out;
}

// Vận theo tuổi (giáo trình tr.83–84): mỗi từ trường ứng một giai đoạn; giai đoạn 1 kéo dài 10 năm, các giai đoạn sau 5 năm,
// hết dãy thì quay vòng.
export function lifeTimeline(res, age = null, maxAge = 90) {
  const stars = res.pairs;
  if (!stars.length) return [];
  const out = [];
  let from = 1;
  let to = 10;
  let k = 0;
  while (from <= maxAge) {
    out.push({ from, to: Math.min(to, maxAge), pair: stars[k % stars.length], current: age != null && age >= from && age <= to });
    from = to + 1;
    to = from + 4;
    k++;
  }
  return out;
}

export function analyzeCCCD(input, now = new Date()) {
  const info = parseCCCD(input, now);
  const res = analyze(info.digits, { gender: info.gender || null, phonePrefix: true, strictTail: false });
  const hung = STAR_ORDER.filter((id) => STARS[id].base < 0 && res.counts[id] > 0)
    .sort((a, b) => res.counts[b] * Math.abs(STARS[b].base) - res.counts[a] * Math.abs(STARS[a].base));
  const missing = ["SK", "TY", "DN"].filter((id) => res.counts[id] === 0);
  const needs = [];
  hung.forEach((h) => (HEAL[h] || []).forEach((s) => { if (!needs.includes(s)) needs.push(s); }));
  missing.forEach((s) => { if (!needs.includes(s)) needs.push(s); });
  const remedies = hung.map((h) => ({ star: h, numbers: HEAL_NUMBERS[h] }));
  const timeline = res.pairs.length ? lifeTimeline(res, info.age ?? null, 90) : [];
  return { info, res, hung, missing, needs, remedies, timeline };
}

// Độ tương hợp giữa CCCD (tiên thiên) và SĐT (hậu thiên): hậu thiên có hóa thần của hung tinh tiên thiên thì cộng điểm,
// lặp lại đúng hung tinh đó thì trừ điểm.
export function compatibility(cccd, phoneRes) {
  let s = 55;
  const notes = [];
  const totalPairs = Math.max(1, cccd.res.pairs.length);
  for (const h of cccd.hung) {
    const share = cccd.res.counts[h] / totalPairs;
    const healers = HEAL[h] || [];
    const has = healers.filter((x) => phoneRes.counts[x] > 0);
    if (has.length) {
      s += 12 * Math.min(1, share * 3 + 0.4);
      notes.push({ tone: "good", text: `CCCD có ${STARS[h].name}; SĐT có ${has.map((x) => STARS[x].name).join(", ")} để chế hóa.` });
    } else {
      s -= 8 * Math.min(1, share * 3 + 0.4);
      notes.push({ tone: "warn", text: `CCCD có ${STARS[h].name} nhưng SĐT chưa có ${healers.map((x) => STARS[x].name).join(" / ")} để chế hóa.` });
    }
    if (phoneRes.counts[h] > 0) {
      s -= 6 * Math.min(2, phoneRes.counts[h]);
      notes.push({ tone: "bad", text: `SĐT lại có thêm ${STARS[h].name}, làm năng lượng này dày thêm.` });
    }
  }
  for (const m of cccd.missing) {
    if (phoneRes.counts[m] > 0) { s += 5; notes.push({ tone: "good", text: `SĐT bổ sung ${STARS[m].name} mà CCCD đang thiếu.` }); }
  }
  if (cccd.res.counts.TM > 0 && phoneRes.counts.NQ > 0) notes.push({ tone: "bad", text: "CCCD có Tuyệt mệnh, SĐT có Ngũ quỷ: cặp “Tuyệt – Quỷ” giáo trình đặc biệt khuyên tránh." });
  return { score: clamp(Math.round(s), 5, 98), notes };
}

export function summarize(res) {
  if (!res.pairs.length) return "";
  const tp = res.tailPair;
  const ts = STARS[tp.star];
  const bits = [`Đuôi ${ts.name} (${tp.text})`];
  const good = ["SK", "TY", "DN"].filter((id) => res.counts[id] > 0).map((id) => STARS[id].name);
  if (good.length) bits.push(`có ${good.join(", ")}`);
  const hung = STAR_ORDER.filter((id) => STARS[id].base < 0 && res.counts[id] > 0).length;
  bits.push(hung === 0 ? "không có hung tinh" : `${hung} loại hung tinh`);
  return bits.join(" · ");
}
