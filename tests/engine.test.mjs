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
