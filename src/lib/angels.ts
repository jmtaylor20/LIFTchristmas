import type { Prisma } from "@prisma/client";

/** Angels that may be shown on the public Angel Tree. */
export function publicAngelWhere(seasonId: string): Prisma.AngelWhereInput {
  return {
    seasonId,
    hidden: false,
    number: { not: null },
    application: { status: "APPROVED", listSubmittedAt: { not: null } },
  };
}

/**
 * Returns a shuffled copy, so the same angels aren't always at the top of the
 * Angel Tree. Each page load gets a new order.
 */
export function shuffled<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
