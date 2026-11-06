// Đầu số di động Việt Nam (mạng 10 số). Chỉnh sửa tại đây khi quy hoạch thay đổi.
export const CARRIERS = [
  { id: "viettel", name: "Viettel", prefixes: ["032", "033", "034", "035", "036", "037", "038", "039", "086", "096", "097", "098"] },
  { id: "vinaphone", name: "VinaPhone", shop: { label: "VNPT DigiShop", url: "https://digishop.vnpt.vn/sim-so" }, prefixes: ["081", "082", "083", "084", "085", "088", "091", "094"] },
  { id: "mobifone", name: "MobiFone", shop: { label: "MobiFone Sim số", url: "https://simso.mobifone.vn/" }, prefixes: ["070", "076", "077", "078", "079", "089", "090", "093"] },
  { id: "vietnamobile", name: "Vietnamobile", prefixes: ["052", "056", "058", "092"] },
  { id: "gmobile", name: "Gmobile", prefixes: ["059", "099"] },
  { id: "itelecom", name: "Itelecom (iTel)", prefixes: ["087"] },
  { id: "wintel", name: "Wintel (Reddi)", prefixes: ["055"] },
];

export function carrierByPrefix(prefix3) {
  return CARRIERS.find((c) => c.prefixes.includes(prefix3)) || null;
}

export function carrierById(id) {
  return CARRIERS.find((c) => c.id === id) || null;
}
