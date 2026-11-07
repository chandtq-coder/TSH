// Tự động lấy kết quả xổ số miền Nam từ dịch vụ dữ liệu công khai 383.im (api.383.im).
// Điều khoản (https://383.im/terms-of-service/) cho phép hiển thị dữ liệu kết quả công khai trong ứng dụng; cấm dùng cho cá cược/thanh toán
// và cấm trình bày như dữ liệu chính thức của nhà nước. Ứng dụng này không cá cược, và luôn ghi rõ nguồn để người dùng đối chiếu.
// Chỉ gửi yêu cầu GET tới tệp JSON công khai; không gửi CCCD, SĐT hay dữ liệu cá nhân nào.

export const API_BASE = "https://api.383.im/lottery";
export const SOURCE_NAME = "383.im";
export const SOURCE_URL = "https://383.im/";

// Tên đài trong ứng dụng → mã đài của nguồn dữ liệu.
export const SLUGS = {
  "TP. Hồ Chí Minh": "tp-hcm", "Đồng Tháp": "dong-thap", "Cà Mau": "ca-mau",
  "Bến Tre": "ben-tre", "Vũng Tàu": "vung-tau", "Bạc Liêu": "bac-lieu",
  "Đồng Nai": "dong-nai", "Cần Thơ": "can-tho", "Sóc Trăng": "soc-trang",
  "Tây Ninh": "tay-ninh", "An Giang": "an-giang", "Bình Thuận": "binh-thuan",
  "Vĩnh Long": "vinh-long", "Bình Dương": "binh-duong", "Trà Vinh": "tra-vinh",
  "Long An": "long-an", "Bình Phước": "binh-phuoc", "Hậu Giang": "hau-giang",
  "Tiền Giang": "tien-giang", "Kiên Giang": "kien-giang", "Đà Lạt": "lam-dong",
};

const ORDER = ["g8", "g7", "g6", "g5", "g4", "g3", "g2", "g1", "db"];
const NEED = { g8: 1, g7: 1, g6: 3, g5: 1, g4: 7, g3: 2, g2: 1, g1: 1, db: 1 };

// Một kỳ hợp lệ khi đủ 18 dãy; trả về mảng theo thứ tự giải tám → đặc biệt (dãy cuối là giải đặc biệt).
export function drawNumbers(g) {
  if (!g) return null;
  const out = [];
  for (const k of ORDER) {
    const arr = g[k];
    if (!Array.isArray(arr) || arr.length !== NEED[k] || arr.some((x) => !/^\d+$/.test(String(x)))) return null;
    out.push(...arr.map(String));
  }
  return out;
}

/**
 * Dựng dữ liệu "kỳ gần nhất" cho từng đài (hàm thuần, dễ kiểm thử).
 * @param {Record<string, {items: Array<{d:string,g:object}>}>} provinces  tên đài → tệp lịch sử (mới nhất trước)
 * @param {{d:string, mn?:{ps:Array<{i:string,g:object}>}}|null} live       live.json (bổ sung kỳ mới nhất nếu tệp lịch sử chưa có)
 * @param {string} beforeISO  chỉ lấy các kỳ trước ngày này (yyyy-mm-dd)
 * @param {number} max        tối đa số kỳ mỗi đài
 */
export function buildRecent(provinces, live, beforeISO, max = 8) {
  const stationDraws = {};
  const byStation = {};
  const latest = {};
  for (const [name, file] of Object.entries(provinces)) {
    const rows = [];
    const seen = new Set();
    const add = (d, g) => {
      if (!d || d >= beforeISO || seen.has(d)) return;
      const nums = drawNumbers(g);
      if (!nums) return;
      seen.add(d);
      rows.push({ d, nums });
    };
    const slug = SLUGS[name];
    const lp = live?.mn?.ps?.find((p) => p.i === slug);
    if (lp) add(live.d, lp.g);
    for (const it of file?.items || []) add(it.d, it.g);
    rows.sort((a, b) => (a.d < b.d ? 1 : -1));
    const top = rows.slice(0, max);
    if (!top.length) continue;
    stationDraws[name] = top.map((r) => r.nums);
    byStation[name] = top.flatMap((r) => r.nums);
    latest[name] = top[0].d;
  }
  const names = Object.keys(stationDraws);
  const k = Math.max(0, ...names.map((n) => stationDraws[n].length));
  const draws = [];
  for (let i = 0; i < k; i++) draws.push(names.flatMap((n) => stationDraws[n][i] || []));
  return { draws, numbers: draws.flat(), byStation, stationDraws, latest };
}

const memo = new Map(); // bộ nhớ tạm trong phiên để bấm "Bộ số khác" không tải lại
async function getJSON(path, { signal } = {}) {
  const hit = memo.get(path);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.v;
  const res = await fetch(`${API_BASE}/${path}`, { signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const v = await res.json();
  memo.set(path, { t: Date.now(), v });
  return v;
}

/**
 * Tải kết quả các kỳ gần nhất của các đài chỉ định rồi dựng dữ liệu cho bộ sinh số.
 * @returns {Promise<{recent: object, updatedAt: string|null, failed: string[]}>}
 */
export async function fetchRecent({ stations, beforeISO, max = 8, signal }) {
  const failed = [];
  const provinces = {};
  let live = null;
  try { live = await getJSON("live.json", { signal }); } catch { /* không bắt buộc */ }
  await Promise.all(stations.map(async (name) => {
    const slug = SLUGS[name];
    if (!slug) { failed.push(name); return; }
    try { provinces[name] = await getJSON(`province/${slug}.json`, { signal }); } catch { failed.push(name); }
  }));
  const recent = buildRecent(provinces, live, beforeISO, max);
  const updated = Object.values(provinces).map((p) => p.updated_at).filter(Boolean).sort().pop() || live?.updated_at || null;
  return { recent, updatedAt: updated, failed };
}
