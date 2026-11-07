import test from "node:test";
import assert from "node:assert/strict";
import { analyze, analyzePhone, parseCCCD, analyzeCCCD, normalizePhone } from "../js/engine.js";
import { STARS } from "../js/data.js";
import { generateForCarrier } from "../js/generator.js";
import { CARRIERS } from "../js/carriers.js";

const chain = (r) => r.pairs.map((p) => p.star).join(" ");

test("28 cặp khác nhau đều tra được; mỗi sao có đúng 4 cấp", () => {
  const d = "12346789";
  for (const a of d) for (const b of d) if (a !== b) assert.ok(analyze(a + b).pairs[0], a + b);
  for (const s of Object.values(STARS)) assert.equal(s.pairs.length, 4);
});

test("ví dụ trong giáo trình 13957230123 ra đúng 8 sao", () => {
  assert.equal(chain(analyze("13957230123")), "TY SK NQ TY HH TY TM HH");
});

test("hóa thần: 213 (Tuyệt mệnh → Thiên y) được hóa giải", () => {
  const r = analyze("2130");
  assert.ok(r.pairs[0].healed);
});

test("số cuối 0/5 bị trừ điểm với SĐT nhưng không với CCCD", () => {
  const a = analyzePhone("0912345670").total;
  const b = analyzePhone("0912345678").total;
  assert.ok(a < b);
  assert.equal(analyze("1234567890", { strictTail: false }).flags.some((f) => f.tone === "bad" && /0 hoặc 5/.test(f.title)), false);
});

test("chuẩn hóa +84 và nhận diện nhà mạng", () => {
  assert.equal(normalizePhone("+84 912 345 678"), "0912345678");
  assert.equal(analyzePhone("0912345678").carrier.id, "vinaphone");
  assert.equal(analyzePhone("0391234567").carrier.id, "viettel");
});

test("CCCD: thế kỷ, giới tính, năm sinh", () => {
  const nam = parseCCCD("079088012345", new Date("2026-06-01"));
  assert.equal(nam.birthYear, 1988); assert.equal(nam.gender, "nam"); assert.equal(nam.age, 38);
  const nu = parseCCCD("001305012345", new Date("2026-06-01"));
  assert.equal(nu.birthYear, 2005); assert.equal(nu.gender, "nu");
  assert.equal(parseCCCD("123").valid, false);
  assert.ok(analyzeCCCD("079088012345").timeline[0].from === 1);
});

test("bộ sinh số: 10 chữ số, đúng đầu số, đuôi cát, tái lập theo seed", () => {
  for (const c of CARRIERS) {
    const a = generateForCarrier({ carrierId: c.id, seed: 5, count: 10 });
    assert.equal(a.length, 10, c.id);
    for (const it of a) {
      assert.match(it.number, /^0\d{9}$/);
      assert.ok(c.prefixes.includes(it.number.slice(0, 3)));
      assert.ok(["SK", "TY", "DN"].includes(it.analysis.tailPair.star));
      assert.ok(it.analysis.total >= 70, `${it.number} ${it.analysis.total}`);
    }
    assert.deepEqual(a.map((x) => x.number), generateForCarrier({ carrierId: c.id, seed: 5, count: 10 }).map((x) => x.number));
  }
});

test("chế độ nữ không sinh Diên niên cấp cao 19/91/78/87", () => {
  const a = generateForCarrier({ carrierId: "viettel", seed: 9, count: 10, gender: "nu" });
  assert.ok(a.every((x) => !x.analysis.pairs.some((p) => ["19", "91", "78", "87"].includes(p.a + p.b))));
});

import { parseList, parsePrice } from "../js/listparse.js";
test("đọc danh sách số kèm giá", () => {
  assert.equal(parsePrice("1.500.000đ"), 1500000);
  assert.equal(parsePrice("800k"), 800000);
  assert.equal(parsePrice("1,5tr"), 1500000);
  assert.equal(parsePrice("2 triệu"), 2000000);
  const l = parseList("0931 413 191 - 1.500.000đ\n+84 893.131.919  800k\n0794191313\nrác\n0931413191");
  assert.deepEqual(l.map((x) => x.number), ["0931413191", "0893131919", "0794191313"]);
  assert.deepEqual(l.map((x) => x.price), [1500000, 800000, null]);
});

import { generateLucky, stationsFor, XSMN, PRIZES } from "../js/lucky.js";
test("số may mắn: đúng cơ cấu giải miền Nam, tái lập, tùy chọn 0/5", () => {
  const sat = new Date(2026, 10, 7); // Thứ Bảy
  assert.deepEqual(stationsFor(sat), ["TP. Hồ Chí Minh", "Long An", "Bình Phước", "Hậu Giang"]);
  assert.equal(Object.values(XSMN).length, 7);
  assert.equal(PRIZES.reduce((a, p) => a + p.count, 0), 18);
  const o = { cccd: "079088012345", date: sat, allow05: false };
  const r = generateLucky(o);
  assert.equal(r.groups.length, 4);
  assert.equal(r.gender, "nam");
  const want = { G8: [2, 1], G7: [3, 1], G6: [4, 3], G5: [4, 1], G4: [5, 7], G3: [5, 2], G2: [5, 1], G1: [5, 1], DB: [6, 1] };
  for (const g of r.groups) {
    assert.deepEqual(g.tiers.map((t) => t.key), Object.keys(want));
    for (const t of g.tiers) {
      assert.equal(t.items.length, want[t.key][1], `${g.station} ${t.key}`);
      for (const it of t.items) { assert.equal(it.number.length, want[t.key][0]); assert.ok(!/[05]/.test(it.number)); }
      assert.equal(new Set(t.items.map((i) => i.number)).size, t.items.length);
    }
  }
  const dbs = r.groups.map((g) => g.tiers.at(-1).items[0].number);
  assert.equal(new Set(dbs).size, dbs.length);
  const flat = (x) => x.groups.map((g) => g.tiers.map((t) => t.items.map((i) => i.number)));
  assert.deepEqual(flat(generateLucky(o)), flat(r));
  assert.notDeepEqual(flat(generateLucky({ ...o, variant: 1 })), flat(r));
  const one = generateLucky({ ...o, station: "Long An" });
  assert.equal(one.groups.length, 1);
  const w = generateLucky({ ...o, allow05: true, variant: 3 });
  assert.ok(w.groups.flatMap((g) => g.tiers.flatMap((t) => t.items)).some((i) => /[05]/.test(i.number)));
});

import { menhOf, supportFor, parseRecent, recentEnergy, SINH, KHAC } from "../js/lucky.js";
test("mệnh nạp âm theo năm sinh và quan hệ ngũ hành", () => {
  assert.equal(menhOf(1988).element, "Mộc"); // Mậu Thìn – Đại Lâm Mộc
  assert.equal(menhOf(1988).canChi, "Mậu Thìn");
  assert.equal(menhOf(1984).element, "Kim"); // Giáp Tý – Hải Trung Kim
  assert.equal(menhOf(2000).element, "Kim"); // Canh Thìn – Bạch Lạp Kim
  const s = supportFor("Mộc");
  assert.equal(s.sinhTa, "Thủy"); assert.equal(s.khacTa, "Kim");
  assert.ok(s.support.has("SK") && !s.support.has("DN") && s.clash.has("DN"));
  assert.equal(SINH.Mộc, "Hỏa"); assert.equal(KHAC.Kim, "Mộc");
});

const SAMPLE = `07/11/2026
TP. HCM XSHCM - 11A7
Giải tám 29
Giải bảy 420
Giải sáu 1387 2100 0266
Giải năm 8011
Giải tư 06509 93007 16758 66679 75842 01765 59607
Giải ba 41762 75058
Giải nhì 57040
Giải nhất 66219
Đặc biệt 274588

31/10/2026
Giải tám 11
Giải bảy 222
Đặc biệt 123456`;
test("đọc kết quả các kỳ gần nhất và phân tích năng lượng", () => {
  const pr = parseRecent(SAMPLE);
  assert.equal(pr.draws.length, 2);
  assert.equal(pr.draws[0].length, 18); // không lẫn ngày hay mã đài như 11A7
  assert.ok(!pr.numbers.includes("11A7"));
  assert.equal(parseRecent(Array(12).fill("12345\n").join("\n")).draws.length <= 8, true);
  const en = recentEnergy(pr);
  assert.equal(en.draws, 2);
  assert.ok(en.total > 0 && Array.isArray(en.missing));
  assert.equal(recentEnergy(parseRecent("")), null);
});

test("số may mắn: đủ cát tinh, ưu tiên Sinh khí/Thiên y, mệnh và kết quả gần đây được dùng", () => {
  const o = { cccd: "079088012345", date: new Date(2026, 10, 7), recentText: SAMPLE };
  const r = generateLucky(o);
  assert.equal(r.menh.element, "Mộc");
  assert.ok(r.needs.includes("SK") && r.needs.includes("TY"));
  assert.equal(r.recent.draws, 2);
  for (const g of r.groups) {
    const db = g.tiers.at(-1).items[0].analysis;
    assert.ok(db.counts.SK > 0 && db.counts.TY > 0 && db.counts.DN > 0, `${g.station} ĐB ${g.tiers.at(-1).items[0].number}`);
    assert.ok(g.coverage.SK > 0 && g.coverage.TY > 0 && g.coverage.DN > 0);
    assert.equal(g.fullCat, true);
  }
  const a = generateLucky({ ...o, recentText: "" });
  const flat = (x) => JSON.stringify(x.groups.map((g) => g.tiers.map((t) => t.items.map((i) => i.number))));
  assert.notEqual(flat(a), flat(r)); // kết quả dán vào thực sự làm thay đổi bộ số
});

// Bảng sao chép từ kqxs.vn ngày 07/11/2026 (các đài xen kẽ theo cột; thứ tự hàng trong giải sáu/tư có thể đảo).
const KQXS = `Xổ số Miền Nam Thứ Bảy 07-11-2026
Giải Hồ Chí Minh Long An Bình Phước Hậu Giang
Giải tám 29 . 34 . 15 . 12
Giải bảy 420 . 043 . 452 . 588
Giải sáu 0266 . 3047 . 7360 . 0888 . 2100 . 5424 . 8893 . 8989 . 1387 . 8644 . 0656 . 2419
Giải năm 8011 . 3176 . 0819 . 5930
Giải tư 59607 . 55861 . 00262 . 18088 . 01765 . 27204 . 86244 . 86849 . 75842 . 99408 . 97075 . 01468 . 66679 . 31803 . 73219 . 84172 . 16758 . 26262 . 41507 . 14145 . 93007 . 57269 . 01695 . 38373 . 06509 . 35611 . 37465 . 36171
Giải ba 75058 . 26706 . 35520 . 59274 . 41762 . 18007 . 06275 . 73306
Giải nhì 57040 . 92892 . 75545 . 01910
Giải nhất 66219 . 20048 . 64229 . 63848
Đặc biệt 274588 . 471941 . 508805 . 830635
0 1 2 3 4 5 6 7 8 9
Lô tô Hồ Chí Minh Thứ Bảy 07-11-2026 00 07 07 09 11 19 20 29 40

Xổ số Miền Nam Thứ Sáu 06-11-2026
Giải Vĩnh Long Bình Dương Trà Vinh
Giải tám 11 . 22 . 33
Đặc biệt 123456 . 234567 . 345678`;
test("đọc bảng nhiều đài từ kqxs.vn và tách riêng từng đài", () => {
  const pr = parseRecent(KQXS);
  assert.equal(pr.draws.length, 2);
  assert.equal(pr.byStation["TP. Hồ Chí Minh"].filter((_, i) => i < 18).length, 18);
  const hcm = pr.byStation["TP. Hồ Chí Minh"];
  assert.ok(hcm.includes("274588") && hcm.includes("29") && hcm.includes("06509") && !hcm.includes("471941"));
  assert.ok(pr.byStation["Long An"].includes("471941") && pr.byStation["Long An"].includes("34"));
  assert.ok(pr.byStation["Hậu Giang"].includes("830635") && pr.byStation["Hậu Giang"].includes("36171"));
  assert.ok(pr.byStation["Vĩnh Long"].includes("123456") && pr.byStation["Trà Vinh"].includes("345678"));
  assert.equal(new Set(pr.byStation["Bình Phước"].slice(0, 18)).size, 18);
  const r = generateLucky({ cccd: "079088012345", date: new Date(2026, 10, 7), recentText: KQXS });
  assert.deepEqual(r.groups.map((g) => g.recentSource), ["station", "station", "station", "station"]);
  const mon = generateLucky({ date: new Date(2026, 10, 9), recentText: KQXS }); // Thứ Hai: chỉ TP.HCM có số liệu riêng
  assert.deepEqual(mon.groups.map((g) => g.recentSource), ["station", "all", "all"]);
  const tue = generateLucky({ date: new Date(2026, 10, 10), recentText: KQXS }); // Thứ Ba: không đài nào có số liệu riêng
  assert.ok(tue.groups.every((g) => g.recentSource === "all"));
  assert.ok(generateLucky({ date: new Date(2026, 10, 10) }).groups.every((g) => g.recentSource === null));
});
