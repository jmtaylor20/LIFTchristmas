// Shared by the application form (browser) and the server.
export const MAX_CHILDREN = 5;
export const WISHES_PER_CHILD = 5;
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;

// Size choices on the application. Values are stored in English so the admin
// and sponsors always see the same labels; `sizeLabel` translates for Spanish.
export const CLOTHING_SIZES = [
  { group: "Baby", sizes: ["Preemie", "Newborn", "0-3 months", "3-6 months", "6-9 months", "9-12 months", "12 months", "18 months", "24 months"] },
  { group: "Toddler", sizes: ["2T", "3T", "4T", "5T"] },
  { group: "Youth", sizes: ["Youth XS (4-5)", "Youth S (6-7)", "Youth M (8)", "Youth M (10-12)", "Youth L (14-16)", "Youth XL (18-20)"] },
  { group: "Adult", sizes: ["Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL", "Adult 4XL"] },
];

const halves = (from: number, to: number, prefix: string) => {
  const out: string[] = [];
  for (let n = from; n <= to; n += 0.5) out.push(`${prefix} ${n}`);
  return out;
};
export const SHOE_SIZES = [
  { group: "Baby", sizes: ["Baby 0-1", "Baby 2", "Baby 3", "Baby 4"] },
  { group: "Toddler", sizes: halves(5, 13.5, "Toddler").map((s) => `${s}C`) },
  { group: "Youth", sizes: halves(1, 7, "Youth").map((s) => `${s}Y`) },
  { group: "Women's", sizes: halves(5, 12, "Women's") },
  { group: "Men's", sizes: [...halves(6, 13, "Men's"), "Men's 14", "Men's 15", "Men's 16"] },
];

export const isClothingSize = (v: string) => CLOTHING_SIZES.some((g) => g.sizes.includes(v));
export const isShoeSize = (v: string) => SHOE_SIZES.some((g) => g.sizes.includes(v));

const ES: [RegExp, string][] = [
  [/^Preemie$/, "Prematuro"],
  [/^Newborn$/, "Recién nacido"],
  [/ months$/, " meses"],
  [/^Youth /, "Juvenil "],
  [/^Adult /, "Adulto "],
  [/^Baby /, "Bebé "],
  [/^Toddler /, "Niño pequeño "],
  [/^Women's /, "Mujer "],
  [/^Men's /, "Hombre "],
];
const ES_GROUPS: Record<string, string> = { Baby: "Bebé", Toddler: "Niño pequeño", Youth: "Juvenil", Adult: "Adulto", "Women's": "Mujer", "Men's": "Hombre" };

export function sizeLabel(value: string, lang: "en" | "es") {
  return lang === "es" ? ES.reduce((s, [re, to]) => s.replace(re, to), value) : value;
}
export function sizeGroupLabel(group: string, lang: "en" | "es") {
  return lang === "es" ? (ES_GROUPS[group] ?? group) : group;
}
