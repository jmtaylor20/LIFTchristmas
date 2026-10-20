import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { normalizeEmail, phoneDigits } from "./format";

type Tx = Prisma.TransactionClient;

/** Match a returning family by phone or email so their history follows them. */
export async function findHousehold(tx: Tx, email: string | null, phone: string) {
  const digits = phoneDigits(phone);
  const em = normalizeEmail(email);
  return tx.household.findFirst({
    where: { OR: [{ phoneDigits: digits }, ...(em ? [{ emailNormalized: em }] : [])] },
    orderBy: { createdAt: "asc" },
  });
}

/** Seasons (other than `excludeSeasonId`) in which this household was approved. */
export async function approvedYears(householdId: string, excludeSeasonId?: string) {
  const apps = await db.application.findMany({
    where: { householdId, status: "APPROVED", ...(excludeSeasonId ? { seasonId: { not: excludeSeasonId } } : {}) },
    include: { season: { select: { year: true } } },
  });
  return apps.map((a) => a.season.year).sort();
}
