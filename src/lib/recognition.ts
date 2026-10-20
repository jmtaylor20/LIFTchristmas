import type { PartnerTier } from "@prisma/client";
import { db } from "./db";

// Business partner tiers, by money the ministry has confirmed receiving this season.
export const TIERS: { tier: PartnerTier; label: string; minCents: number; perks: string }[] = [
  { tier: "GOLD", label: "Gold", minCents: 100_000, perks: "Large logo at the top of our partner wall on the home page" },
  { tier: "SILVER", label: "Silver", minCents: 50_000, perks: "Logo on our partner wall on the home page" },
  { tier: "BRONZE", label: "Bronze", minCents: 10_000, perks: "Smaller logo on our partner wall on the home page" },
];

export function tierFor(cents: number): PartnerTier | null {
  return TIERS.find((t) => cents >= t.minCents)?.tier ?? null;
}

export function tierLabel(tier: PartnerTier | null | undefined) {
  return TIERS.find((t) => t.tier === tier)?.label ?? "No tier yet";
}

type NameParts = { firstName: string; lastName: string; displayName: string | null; organization: string | null };

/** How a giver is thanked in public: their chosen name, their organization, or "First L." */
export function publicName(s: NameParts) {
  if (s.displayName?.trim()) return s.displayName.trim();
  if (s.organization?.trim()) return s.organization.trim();
  return `${s.firstName} ${s.lastName.charAt(0).toUpperCase()}.`.trim();
}

/** Confirmed (received) money per giver for a season. */
async function confirmedCentsBySponsor(seasonId: string, sponsorIds: string[]) {
  if (sponsorIds.length === 0) return new Map<string, number>();
  const rows = await db.donation.groupBy({
    by: ["sponsorId"],
    where: { seasonId, status: "PAID", sponsorId: { in: sponsorIds } },
    _sum: { amountCents: true },
  });
  return new Map(rows.map((r) => [r.sponsorId!, r._sum.amountCents ?? 0]));
}

/** Every partner for the season with confirmed giving and the tier it earns. */
export async function seasonPartners(seasonId: string) {
  const partners = await db.corporatePartner.findMany({
    where: { seasonId },
    select: {
      id: true,
      sponsorId: true,
      businessName: true,
      website: true,
      logoKey: true,
      pledgeCents: true,
      message: true,
      status: true,
      tierOverride: true,
      createdAt: true,
      approvedAt: true,
      sponsor: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const confirmed = await confirmedCentsBySponsor(seasonId, partners.map((p) => p.sponsorId));
  return partners.map((p) => {
    const confirmedCents = confirmed.get(p.sponsorId) ?? 0;
    return { ...p, confirmedCents, tier: p.tierOverride ?? tierFor(confirmedCents) };
  });
}

/** Approved partners that have earned a tier, grouped Gold → Bronze, biggest givers first. */
export async function partnerWall(seasonId: string) {
  const all = (await seasonPartners(seasonId)).filter((p) => p.status === "APPROVED" && p.tier && p.logoKey);
  return TIERS.map((t) => ({
    ...t,
    partners: all.filter((p) => p.tier === t.tier).sort((a, b) => b.confirmedCents - a.confirmedCents),
  })).filter((g) => g.partners.length > 0);
}

/**
 * Names for the home-page thank-you ticker: everyone whose gift the ministry has
 * confirmed this season (money received, sponsored gifts dropped off, wish-list
 * gifts received, or an approved business partner), unless they chose to stay
 * anonymous. Because only confirmed givers appear, nobody can put an unvetted
 * name on the home page just by filling out a form.
 */
export async function tickerNames(seasonId: string) {
  const givers = await db.sponsor.findMany({
    where: {
      anonymous: false,
      OR: [
        { donations: { some: { seasonId, status: "PAID" } } },
        { sponsorships: { some: { seasonId, status: { not: "CANCELLED" }, items: { some: { status: "RECEIVED" } } } } },
        { inKindGifts: { some: { seasonId, receivedAt: { not: null } } } },
        { partners: { some: { seasonId, status: "APPROVED" } } },
      ],
    },
    select: {
      firstName: true,
      lastName: true,
      displayName: true,
      organization: true,
      partners: { where: { seasonId, status: "APPROVED" }, select: { businessName: true } },
    },
    take: 400,
  });
  const names = givers.map((g) => g.partners[0]?.businessName ?? publicName(g));
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}
