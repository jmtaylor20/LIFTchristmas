"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApplicationStatus, ItemStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { clearAdminSession, requireAdmin, setAdminSession } from "@/lib/auth";
import { safeEqual } from "@/lib/tokens";
import { ADMIN_SEASON_COOKIE, getAdminSeason } from "@/lib/season";
import { approvedYears } from "@/lib/households";
import { optStr, parseDeadline, parseMoneyToCents, str } from "@/lib/format";
import { button, esc, layout, sendEmail, siteUrl } from "@/lib/email";
import { sendAllStatements, sendDonationReceipt, sendStatement, upsertGiver } from "@/lib/givers";
import { site } from "@/content/site";

// ------------------------------------------------------------------ session

export async function adminLogin(fd: FormData) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !safeEqual(str(fd, "password"), expected)) redirect("/admin/login?error=1");
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function switchSeason(fd: FormData) {
  await requireAdmin();
  (await cookies()).set(ADMIN_SEASON_COOKIE, str(fd, "seasonId"), { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/admin");
}

// ------------------------------------------------------------------ seasons

function seasonFields(fd: FormData) {
  return {
    applicationsOpen: fd.get("applicationsOpen") === "on",
    applicationDeadline: parseDeadline(str(fd, "applicationDeadline")),
    wishlistDeadline: parseDeadline(str(fd, "wishlistDeadline")),
    giftDeadline: parseDeadline(str(fd, "giftDeadline")),
    perChildBudgetCents: parseMoneyToCents(fd.get("perChildBudget")) ?? 15000,
    maxItemsPerChild: Math.max(1, Math.min(25, Number(str(fd, "maxItemsPerChild")) || 8)),
    approvalCapYears: Math.max(1, Math.min(50, Number(str(fd, "approvalCapYears")) || 5)),
    amazonWishlistUrl: optStr(fd, "amazonWishlistUrl"),
    dropOffInstructions: optStr(fd, "dropOffInstructions"),
    donationInstructions: optStr(fd, "donationInstructions"),
  };
}

export async function createSeason(fd: FormData) {
  await requireAdmin();
  const year = Number(str(fd, "year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) redirect("/admin/seasons?error=year");
  if (await db.season.findUnique({ where: { year } })) redirect("/admin/seasons?error=exists");
  // Carry settings forward from the most recent season.
  const prev = await db.season.findFirst({ orderBy: { year: "desc" } });
  const hasActive = await db.season.count({ where: { isActive: true } });
  const s = await db.season.create({
    data: {
      year,
      isActive: hasActive === 0,
      perChildBudgetCents: prev?.perChildBudgetCents,
      maxItemsPerChild: prev?.maxItemsPerChild,
      approvalCapYears: prev?.approvalCapYears,
      amazonWishlistUrl: prev?.amazonWishlistUrl,
      dropOffInstructions: prev?.dropOffInstructions,
      donationInstructions: prev?.donationInstructions,
    },
  });
  redirect(`/admin/seasons?edit=${s.id}`);
}

export async function updateSeason(id: string, fd: FormData) {
  await requireAdmin();
  await db.season.update({ where: { id }, data: seasonFields(fd) });
  revalidatePath("/", "layout");
  redirect("/admin/seasons?saved=1");
}

export async function activateSeason(id: string) {
  await requireAdmin();
  await db.$transaction([
    db.season.updateMany({ data: { isActive: false } }),
    db.season.update({ where: { id }, data: { isActive: true } }),
  ]);
  (await cookies()).delete(ADMIN_SEASON_COOKIE);
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------- applications

export async function decideApplication(id: string, fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status") as ApplicationStatus;
  if (!["APPROVED", "DENIED", "WAITLIST", "PENDING"].includes(status)) return;
  const notify = fd.get("notify") === "on";
  const message = str(fd, "message");

  const app = await db.application.findUnique({ where: { id }, include: { household: true, season: true, angels: true } });
  if (!app) return;

  if (status === "APPROVED") {
    const years = await approvedYears(app.householdId, app.seasonId);
    if (years.length >= app.season.approvalCapYears) {
      redirect(`/admin/applications/${id}?error=cap`);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.application.update({
      where: { id },
      data: { status, decidedAt: status === "PENDING" ? null : new Date(), adminNotes: optStr(fd, "adminNotes") ?? app.adminNotes },
    });
    if (status === "APPROVED") {
      // Give each child a public angel number.
      const max = await tx.angel.aggregate({ where: { seasonId: app.seasonId }, _max: { number: true } });
      let n = max._max.number ?? 0;
      for (const angel of app.angels.filter((a) => a.number == null)) {
        await tx.angel.update({ where: { id: angel.id }, data: { number: ++n } });
      }
    }
  });

  if (notify && app.household.email && status !== "PENDING") {
    const link = siteUrl(`/family/${app.accessToken}`);
    const extra = message ? `<p>${esc(message).replace(/\n/g, "<br/>")}</p>` : "";
    const bodies: Record<string, string> = {
      APPROVED: `<p>Hi ${esc(app.household.parentFirstName)},</p>
<p><strong>Good news: your family has been approved for Christmas sponsorship!</strong></p>
<p>Next, please make a wish list for each of your children using your family's page below${app.season.wishlistDeadline ? ` by <strong>${app.season.wishlistDeadline.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Chicago" })}</strong>` : ""}.</p>
${extra}${button(link, "Make our wish lists")}
<p>Merry Christmas,<br/>${esc(site.name)}</p>`,
      WAITLIST: `<p>Hi ${esc(app.household.parentFirstName)},</p>
<p>Thank you for applying. Your family has been placed on our waiting list. We'll contact you if a spot opens.</p>${extra}
${button(link, "Check my status")}`,
      DENIED: `<p>Hi ${esc(app.household.parentFirstName)},</p>
<p>Thank you for applying. We're sorry, but we are unable to sponsor your family this year.</p>${extra}
<p>We'll be praying for you and your family this Christmas season.</p>`,
    };
    await sendEmail({
      to: app.household.email,
      subject: status === "APPROVED" ? `You're approved! Next step: wish lists` : `Your Christmas sponsorship application`,
      html: layout(bodies[status]),
    });
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/applications/${id}?saved=1`);
}

export async function unlockLists(id: string) {
  await requireAdmin();
  await db.application.update({ where: { id }, data: { listSubmittedAt: null } });
  revalidatePath(`/admin/applications/${id}`);
}

export async function lockLists(id: string) {
  await requireAdmin();
  await db.application.update({ where: { id }, data: { listSubmittedAt: new Date() } });
  revalidatePath(`/admin/applications/${id}`);
}

export async function saveHouseholdNotes(id: string, fd: FormData) {
  await requireAdmin();
  await db.household.update({ where: { id }, data: { adminNotes: optStr(fd, "adminNotes") } });
  revalidatePath("/admin", "layout");
}

// ------------------------------------------------------------------- angels

export async function toggleAngelHidden(id: string) {
  await requireAdmin();
  const a = await db.angel.findUnique({ where: { id } });
  if (a) await db.angel.update({ where: { id }, data: { hidden: !a.hidden } });
  revalidatePath("/admin", "layout");
}

export async function adminAddItem(angelId: string, fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return;
  const count = await db.wishItem.count({ where: { angelId } });
  await db.wishItem.create({
    data: { angelId, name, details: optStr(fd, "details"), estPriceCents: parseMoneyToCents(fd.get("price")), sortOrder: count },
  });
  revalidatePath(`/admin/angels/${angelId}`);
}

export async function adminDeleteItem(itemId: string) {
  await requireAdmin();
  const item = await db.wishItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/angels/${item.angelId}`);
}

export async function setItemStatus(itemId: string, fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status") as ItemStatus;
  if (!["NEEDED", "CLAIMED", "RECEIVED", "MINISTRY"].includes(status)) return;
  const item = await db.wishItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  await db.wishItem.update({
    where: { id: itemId },
    data: {
      status,
      receivedAt: status === "RECEIVED" ? (item.receivedAt ?? new Date()) : null,
      // Releasing an item back to "needed" detaches it from its sponsor.
      ...(status === "NEEDED" ? { sponsorshipId: null } : {}),
      ...(status === "MINISTRY" ? { ministryCostCents: parseMoneyToCents(fd.get("cost")) ?? item.ministryCostCents } : {}),
    },
  });
  await refreshSponsorshipStatus(item.sponsorshipId);
  revalidatePath("/admin", "layout");
}

/** Mark every committed item on a sponsorship as received (sponsor dropped off their bag). */
export async function receiveSponsorship(sponsorshipId: string) {
  await requireAdmin();
  await db.wishItem.updateMany({ where: { sponsorshipId, status: "CLAIMED" }, data: { status: "RECEIVED", receivedAt: new Date() } });
  await refreshSponsorshipStatus(sponsorshipId);
  revalidatePath("/admin", "layout");
}

export async function cancelSponsorship(sponsorshipId: string) {
  await requireAdmin();
  await db.$transaction([
    db.wishItem.updateMany({ where: { sponsorshipId, status: "CLAIMED" }, data: { status: "NEEDED", sponsorshipId: null } }),
    db.sponsorship.update({ where: { id: sponsorshipId }, data: { status: "CANCELLED" } }),
  ]);
  revalidatePath("/admin", "layout");
}

async function refreshSponsorshipStatus(sponsorshipId: string | null) {
  if (!sponsorshipId) return;
  const s = await db.sponsorship.findUnique({ where: { id: sponsorshipId }, include: { items: true } });
  if (!s || s.status === "CANCELLED") return;
  const delivered = s.items.length > 0 && s.items.every((i) => i.status === "RECEIVED");
  await db.sponsorship.update({ where: { id: s.id }, data: { status: delivered ? "DELIVERED" : "COMMITTED" } });
}

/** Admin signs someone up for an angel (e.g. a phone call or a church sign-up sheet). */
export async function adminAssignSponsor(angelId: string, fd: FormData) {
  await requireAdmin();
  const email = str(fd, "email");
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const itemIds = fd.getAll("itemId").map(String);
  if (!email || !firstName || !lastName || itemIds.length === 0) redirect(`/admin/angels/${angelId}?error=assign`);
  const angel = await db.angel.findUnique({ where: { id: angelId }, include: { items: true } });
  if (!angel) return;
  const giver = await upsertGiver({ firstName, lastName, email, phone: optStr(fd, "phone"), organization: optStr(fd, "organization") });
  await db.$transaction(async (tx) => {
    const s = await tx.sponsorship.create({
      data: {
        seasonId: angel.seasonId,
        sponsorId: giver.id,
        angelId,
        type: itemIds.length === angel.items.length ? "FULL" : "PARTIAL",
        note: "Added by admin",
      },
    });
    await tx.wishItem.updateMany({ where: { id: { in: itemIds }, angelId, status: "NEEDED" }, data: { status: "CLAIMED", sponsorshipId: s.id } });
  });
  revalidatePath(`/admin/angels/${angelId}`);
  redirect(`/admin/angels/${angelId}`);
}

// --------------------------------------------------------- money and gifts

export async function recordDonation(fd: FormData) {
  await requireAdmin();
  const season = await getAdminSeason();
  const amountCents = parseMoneyToCents(fd.get("amount"));
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  const method = str(fd, "method") as "CASH" | "CHECK" | "OTHER";
  if (!season || !amountCents || !firstName || !["CASH", "CHECK", "OTHER"].includes(method)) redirect("/admin/donations?error=1");
  const giver = email ? await upsertGiver({ firstName, lastName, email }) : null;
  const dateStr = str(fd, "date");
  const d = await db.donation.create({
    data: {
      seasonId: season.id,
      sponsorId: giver?.id,
      donorName: `${firstName} ${lastName}`.trim(),
      donorEmail: email || null,
      amountCents,
      method,
      status: "PAID",
      note: optStr(fd, "note"),
      ...(dateStr ? { createdAt: new Date(`${dateStr}T12:00:00-06:00`) } : {}),
    },
  });
  if (fd.get("sendReceipt") === "on") await sendDonationReceipt(d.id);
  revalidatePath("/admin", "layout");
  redirect("/admin/donations?saved=1");
}

export async function deleteDonation(id: string) {
  await requireAdmin();
  await db.donation.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}

export async function resendReceipt(id: string) {
  await requireAdmin();
  await db.donation.update({ where: { id }, data: { receiptSentAt: null } });
  await sendDonationReceipt(id);
  revalidatePath("/admin/donations");
}

export async function recordInKind(fd: FormData) {
  await requireAdmin();
  const season = await getAdminSeason();
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  const description = str(fd, "description");
  if (!season || !firstName || !description) redirect("/admin/donations?error=1");
  const giver = email ? await upsertGiver({ firstName, lastName, email }) : null;
  await db.inKindGift.create({
    data: {
      seasonId: season.id,
      sponsorId: giver?.id,
      donorName: `${firstName} ${lastName}`.trim(),
      donorEmail: email || null,
      source: str(fd, "source") === "AMAZON_WISHLIST" ? "AMAZON_WISHLIST" : "DROP_OFF",
      description,
      estValueCents: parseMoneyToCents(fd.get("value")),
      receivedAt: fd.get("received") === "on" ? new Date() : null,
    },
  });
  revalidatePath("/admin", "layout");
  redirect("/admin/donations?saved=1#in-kind");
}

export async function markInKindReceived(id: string) {
  await requireAdmin();
  const g = await db.inKindGift.findUnique({ where: { id } });
  if (g) await db.inKindGift.update({ where: { id }, data: { receivedAt: g.receivedAt ? null : new Date() } });
  revalidatePath("/admin/donations");
}

export async function deleteInKind(id: string) {
  await requireAdmin();
  await db.inKindGift.delete({ where: { id } });
  revalidatePath("/admin/donations");
}

// ---------------------------------------------------------- tax statements

export async function adminSendStatement(sponsorId: string, year: number) {
  await requireAdmin();
  const r = await sendStatement(sponsorId, year);
  redirect(`/admin/statements?year=${year}&one=${r}`);
}

export async function adminSendAllStatements(year: number, fd: FormData) {
  await requireAdmin();
  const r = await sendAllStatements(year, { onlyIfUnsent: fd.get("onlyUnsent") === "on" });
  redirect(`/admin/statements?year=${year}&sent=${r.sent}&skipped=${r.skipped}&failed=${r.failed}`);
}

export async function saveSponsorNotes(id: string, fd: FormData) {
  await requireAdmin();
  await db.sponsor.update({ where: { id }, data: { adminNotes: optStr(fd, "adminNotes") } });
  revalidatePath(`/admin/sponsors/${id}`);
}
