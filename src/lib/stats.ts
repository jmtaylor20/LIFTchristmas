import { db } from "./db";

export async function seasonStats(seasonId: string) {
  const [apps, angels, donations, sponsorships] = await Promise.all([
    db.application.groupBy({ by: ["status"], where: { seasonId }, _count: true }),
    db.angel.findMany({
      where: { seasonId, hidden: false, application: { status: "APPROVED" } },
      select: { id: true, items: { select: { status: true, estPriceCents: true, ministryCostCents: true } } },
    }),
    db.donation.aggregate({ where: { seasonId, status: "PAID" }, _sum: { amountCents: true }, _count: true }),
    db.sponsorship.findMany({ where: { seasonId, status: { not: "CANCELLED" } }, select: { sponsorId: true } }),
  ]);

  const appCount = (s: string) => apps.find((a) => a.status === s)?._count ?? 0;

  let fullyCovered = 0;
  let partlyCovered = 0;
  let notCovered = 0;
  let noList = 0;
  const itemCounts = { NEEDED: 0, CLAIMED: 0, RECEIVED: 0, MINISTRY: 0 };
  let neededCents = 0;
  let ministrySpentCents = 0;
  let ministryPlannedCents = 0;

  for (const a of angels) {
    if (a.items.length === 0) {
      noList++;
      continue;
    }
    const open = a.items.filter((i) => i.status === "NEEDED").length;
    if (open === 0) fullyCovered++;
    else if (open === a.items.length) notCovered++;
    else partlyCovered++;
    for (const i of a.items) {
      itemCounts[i.status]++;
      if (i.status === "NEEDED") neededCents += i.estPriceCents ?? 0;
      if (i.status === "MINISTRY") {
        if (i.ministryCostCents != null) ministrySpentCents += i.ministryCostCents;
        else ministryPlannedCents += i.estPriceCents ?? 0;
      }
    }
  }

  const raisedCents = donations._sum.amountCents ?? 0;
  return {
    applications: {
      total: apps.reduce((n, a) => n + a._count, 0),
      pending: appCount("PENDING"),
      approved: appCount("APPROVED"),
      waitlist: appCount("WAITLIST"),
      denied: appCount("DENIED"),
    },
    angels: { total: angels.length, fullyCovered, partlyCovered, notCovered, noList },
    items: itemCounts,
    neededCents,
    raisedCents,
    donationCount: donations._count,
    ministrySpentCents,
    ministryPlannedCents,
    fundBalanceCents: raisedCents - ministrySpentCents,
    sponsorCount: new Set(sponsorships.map((s) => s.sponsorId)).size,
  };
}
