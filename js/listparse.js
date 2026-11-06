// Đọc danh sách số (dán từ trang nhà mạng/đại lý): mỗi dòng có một SĐT và có thể kèm giá.
const PHONE_RE = /(?:\+?84|0)(?:[\s.\-]?\d){9}/;

export function parsePrice(text) {
  const m = /(\d[\d.,]*)\s*(k|nghìn|nghin|ngàn|ngan|tr|triệu|trieu|đ|vnđ|vnd|d)?\b/i.exec(text);
  if (!m) return null;
  const unit = (m[2] || "").toLowerCase();
  let raw = m[1].replace(/[.,]$/, "");
  const multi = { k: 1e3, "nghìn": 1e3, nghin: 1e3, "ngàn": 1e3, ngan: 1e3, tr: 1e6, "triệu": 1e6, trieu: 1e6 }[unit];
  let n;
  if (multi) n = parseFloat(raw.replace(/\./g, "").replace(",", ".")) * multi;
  else {
    // "1.500.000" hay "1,500,000": dấu phân cách nhóm 3 chữ số
    n = /^\d{1,3}([.,]\d{3})+$/.test(raw) ? Number(raw.replace(/[.,]/g, "")) : Number(raw.replace(/[.,]/g, ""));
  }
  if (!Number.isFinite(n) || n < 1000) return null;
  return Math.round(n);
}

export function parseList(text) {
  const seen = new Set();
  const items = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = PHONE_RE.exec(line);
    if (!m) continue;
    let d = m[0].replace(/\D/g, "");
    if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2);
    if (d.length !== 10 || seen.has(d)) continue;
    seen.add(d);
    const rest = line.slice(0, m.index) + " " + line.slice(m.index + m[0].length);
    items.push({ number: d, price: parsePrice(rest) });
  }
  return items;
}

export const fmtPrice = (n) => (n == null ? "" : new Intl.NumberFormat("vi-VN").format(n) + " đ");
