import { db } from "./db";

export type ParsedNeed = { name: string; url: string | null; priceCents: number | null; quantity: number };

/**
 * Turns pasted lines (e.g. copied from an Amazon wish list) into need items.
 * Each line is one item; the link, price, and quantity can appear anywhere:
 *   Wrapping paper, $12.99, x10, https://www.amazon.com/dp/...
 *   Scotch tape | qty 20
 */
export function parseNeedLines(text: string): ParsedNeed[] {
  const items: ParsedNeed[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    const url = line.match(/https?:\/\/\S+/)?.[0] ?? null;
    if (url) line = line.replace(url, " ");
    let quantity = 1;
    const qty = line.match(/(?:\b(?:qty|quantity|need(?:ed)?)\s*:?\s*|(?:^|\s)[x×]\s*)(\d{1,4})\b/i);
    if (qty) {
      quantity = Math.max(1, Number(qty[1]));
      line = line.replace(qty[0], " ");
    }
    let priceCents: number | null = null;
    const price = line.match(/\$\s*(\d{1,5}(?:,\d{3})*(?:\.\d{1,2})?)/);
    if (price) {
      priceCents = Math.round(Number(price[1].replace(/,/g, "")) * 100);
      line = line.replace(price[0], " ");
    }
    const name = line
      .replace(/[|;]+/g, " ")
      .replace(/\s*,\s*(,\s*)*/g, ", ")
      .replace(/\s+/g, " ")
      .replace(/^[\s,–—-]+|[\s,–—-]+$/g, "")
      .slice(0, 160);
    if (name) items.push({ name, url, priceCents, quantity: Math.min(quantity, 9999) });
  }
  return items;
}

/** Need items for a season with how many have been covered (reported or received). */
export async function seasonNeeds(seasonId: string, opts: { includeHidden?: boolean } = {}) {
  const needs = await db.needItem.findMany({
    where: { seasonId, ...(opts.includeHidden ? {} : { hidden: false }) },
    include: { gifts: { select: { id: true, quantity: true, receivedAt: true, donorName: true, donorEmail: true, sponsorId: true, createdAt: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return needs.map((n) => {
    const covered = n.gifts.reduce((s, g) => s + g.quantity, 0);
    const received = n.gifts.filter((g) => g.receivedAt).reduce((s, g) => s + g.quantity, 0);
    return { ...n, covered, received, remaining: Math.max(0, n.quantity - covered) };
  });
}
