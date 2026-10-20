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
