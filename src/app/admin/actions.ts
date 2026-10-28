"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ApplicationStatus, ItemStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { clearAdminSession, requireAdmin, setAdminSession } from "@/lib/auth";
import { safeEqual } from "@/lib/tokens";
import { ADMIN_SEASON_COOKIE, getAdminSeason, wishlistsAreOpen } from "@/lib/season";
import { approvedYears } from "@/lib/households";
import { createApplication, parseGoogleFormCsv } from "@/lib/applications";
import { normalizeEmail, optStr, parseDeadline, parseMoneyToCents, str } from "@/lib/format";
import { button, esc, layout, sendEmail, siteUrl } from "@/lib/email";
import { sendAllStatements, sendDonationReceipt, sendStatement, upsertGiver } from "@/lib/givers";
import { site } from "@/content/site";
import { deliverNote } from "@/lib/thankyou";
import { isSandbox } from "@/lib/sandbox";
import { parseNeedLines } from "@/lib/needs";
import { deleteAllData, loadSampleData } from "@/lib/sampleData";
import { sendSeasonThanks, thankForInKindGift, thankForReceivedGifts, thankPartnerIfLive } from "@/lib/thanks";
import { sendListReminders, sendPickupReminders, sendSponsorReminders } from "@/lib/reminders";
import { dict, longDate, toLang } from "@/content/i18n";

// ------------------------------------------------------------------ session

const MAX_FAILED_LOGINS = 8;
const LOCKOUT_MINUTES = 15;

async function clientIp() {
  const h = await headers();
  return h.get("x-nf-client-connection-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function adminLogin(fd: FormData) {
  const expected = process.env.ADMIN_PASSWORD;
  const ip = await clientIp();
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  // Slow down password guessing: too many misses from one address locks it out for a while.
  const recentFailures = await db.adminLoginAttempt.count({ where: { ip, createdAt: { gte: since } } });
  if (recentFailures >= MAX_FAILED_LOGINS) redirect("/admin/login?error=locked");

  if (!expected || !safeEqual(str(fd, "password"), expected)) {
    await db.adminLoginAttempt.create({ data: { ip } });
    redirect("/admin/login?error=1");
  }
  await db.adminLoginAttempt.deleteMany({ where: { OR: [{ ip }, { createdAt: { lt: since } }] } });
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
    pickupDate: parseDeadline(str(fd, "pickupDate")),
    perChildBudgetCents: parseMoneyToCents(fd.get("perChildBudget")),
    maxItemsPerChild: Math.max(1, Math.min(25, Number(str(fd, "maxItemsPerChild")) || 8)),
    approvalCapYears: Math.max(1, Math.min(50, Number(str(fd, "approvalCapYears")) || 5)),
    amazonWishlistUrl: optStr(fd, "amazonWishlistUrl"),
    venmoHandle: optStr(fd, "venmoHandle")?.replace(/^@/, "") ?? null,
    dropOffInstructions: optStr(fd, "dropOffInstructions"),
    shippingAddress: optStr(fd, "shippingAddress"),
    donationInstructions: optStr(fd, "donationInstructions"),
    pickupInstructions: optStr(fd, "pickupInstructions"),
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
      venmoHandle: prev?.venmoHandle,
      dropOffInstructions: prev?.dropOffInstructions,
      shippingAddress: prev?.shippingAddress,
      donationInstructions: prev?.donationInstructions,
      pickupInstructions: prev?.pickupInstructions,
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

  // Families at the approval cap can only be approved with the override password.
  let capOverride = false;
  if (status === "APPROVED" && app.status !== "APPROVED") {
    const years = await approvedYears(app.householdId, app.seasonId);
    if (years.length >= app.season.approvalCapYears) {
      const given = str(fd, "overridePassword");
      const expected = process.env.CAP_OVERRIDE_PASSWORD;
      if (!given) redirect(`/admin/applications/${id}?error=cap`);
      if (!expected || !safeEqual(given, expected)) redirect(`/admin/applications/${id}?error=override`);
      capOverride = true;
    }
  }

  // After the wish-list deadline, approving locks in the list from the application.
  const lockLists = status === "APPROVED" && !app.listSubmittedAt && !wishlistsAreOpen(app.season);
  await db.$transaction(async (tx) => {
    await tx.application.update({
      where: { id },
      data: {
        status,
        decidedAt: status === "PENDING" ? null : new Date(),
        ...(lockLists ? { listSubmittedAt: new Date() } : {}),
        adminNotes: optStr(fd, "adminNotes") ?? app.adminNotes,
        ...(capOverride ? { capOverrideAt: new Date() } : {}),
      },
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
    const lang = toLang(app.language);
    const t = dict[lang].email;
    const first = esc(app.household.parentFirstName);
    const link = siteUrl(`/family/${app.accessToken}`);
    const extra = message ? `<p>${esc(message).replace(/\n/g, "<br/>")}</p>` : "";
    const due = app.season.wishlistDeadline ? longDate(app.season.wishlistDeadline, lang) : null;
    const pickup = app.season.pickupInstructions ? esc(app.season.pickupInstructions).replace(/\n/g, "<br/>") : "";
    const listsLocked = lockLists || !!app.listSubmittedAt;
    const html =
      status === "APPROVED"
        ? listsLocked
          ? t.approvedListsIn(first, extra, button(link, t.pageButton), pickup, esc(site.name), esc(site.contactEmail))
          : t.approved(first, due, extra, button(link, t.approvedButton), pickup, esc(site.name))
        : status === "WAITLIST"
          ? t.waitlist(first, extra, button(link, t.statusButton))
          : t.denied(first, extra);
    await sendEmail({
      to: app.household.email,
      subject: status === "APPROVED" ? (listsLocked ? t.approvedListsInSubject : t.approvedSubject) : t.decisionSubject,
      html: layout(html),
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
  if (delivered) await thankForReceivedGifts(s.id);
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
  const method = str(fd, "method") as "VENMO" | "CASH" | "CHECK" | "OTHER";
  if (!season || !amountCents || !firstName || !["VENMO", "CASH", "CHECK", "OTHER"].includes(method)) redirect("/admin/donations?error=1");
  const giver = email ? await upsertGiver({ firstName, lastName, email }) : null;
  const dateStr = str(fd, "date");
  const receivedAt = dateStr ? new Date(`${dateStr}T12:00:00-06:00`) : new Date();
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
      createdAt: receivedAt,
      receivedAt,
    },
  });
  if (fd.get("sendReceipt") === "on") await sendDonationReceipt(d.id);
  await thankPartnersOf(d.id);
  revalidatePath("/admin", "layout");
  redirect("/admin/donations?saved=1");
}

/** A reported Venmo gift showed up: count it and email the receipt. */
export async function confirmDonation(id: string) {
  await requireAdmin();
  await db.donation.updateMany({ where: { id, status: { not: "PAID" } }, data: { status: "PAID", receivedAt: new Date() } });
  await sendDonationReceipt(id);
  await thankPartnersOf(id);
  revalidatePath("/admin", "layout");
}

export async function markDonationNotReceived(id: string) {
  await requireAdmin();
  await db.donation.update({ where: { id }, data: { status: "NOT_RECEIVED", receivedAt: null } });
  revalidatePath("/admin", "layout");
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
  const gift = await db.inKindGift.create({
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
  await thankForInKindGift(gift.id);
  revalidatePath("/admin", "layout");
  redirect("/admin/donations?saved=1#in-kind");
}

export async function markInKindReceived(id: string) {
  await requireAdmin();
  const g = await db.inKindGift.findUnique({ where: { id } });
  if (g) await db.inKindGift.update({ where: { id }, data: { receivedAt: g.receivedAt ? null : new Date() } });
  if (g && !g.receivedAt) await thankForInKindGift(id);
  revalidatePath("/admin/donations");
}

export async function deleteInKind(id: string) {
  await requireAdmin();
  await db.inKindGift.delete({ where: { id } });
  revalidatePath("/admin/donations");
}

// ------------------------------------------------------ giving statements

export async function adminSendStatement(sponsorId: string, year: number) {
  await requireAdmin();
  const r = await sendStatement(sponsorId, year);
  redirect(`/admin/statements?year=${year}&one=${r}`);
}

export async function adminSendAllStatements(year: number, fd: FormData) {
  await requireAdmin();
  const r = await sendAllStatements(year, { onlyIfUnsent: fd.get("onlyUnsent") === "on" });
  redirect(`/admin/statements?year=${year}&sent=${r.sent}&skipped=${r.skipped}&failed=${r.failed}&remaining=${r.remaining}`);
}

export async function saveSponsorNotes(id: string, fd: FormData) {
  await requireAdmin();
  await db.sponsor.update({ where: { id }, data: { adminNotes: optStr(fd, "adminNotes") } });
  revalidatePath(`/admin/sponsors/${id}`);
}

// ----------------------------------------------------------- thank-you notes

export async function sendThankYou(noteId: string, fd: FormData) {
  await requireAdmin();
  const message = str(fd, "message").slice(0, 2000);
  if (message) await db.thankYouNote.update({ where: { id: noteId }, data: { message } });
  const sent = await deliverNote(noteId);
  revalidatePath("/admin", "layout");
  redirect(`/admin/thank-yous?sent=${sent}`);
}

export async function holdThankYou(noteId: string) {
  await requireAdmin();
  await db.thankYouNote.update({ where: { id: noteId }, data: { status: "HELD" } });
  revalidatePath("/admin", "layout");
}

export async function reopenThankYou(noteId: string) {
  await requireAdmin();
  await db.thankYouNote.update({ where: { id: noteId }, data: { status: "PENDING" } });
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------- reminders

export async function remindFamilies() {
  await requireAdmin();
  const r = await sendListReminders({ force: true });
  redirect(`/admin?reminded=families&sent=${r.sent}&remaining=${r.remaining}`);
}

export async function remindSponsors() {
  await requireAdmin();
  const r = await sendSponsorReminders({ force: true });
  redirect(`/admin?reminded=sponsors&sent=${r.sent}&remaining=${r.remaining}`);
}

export async function remindPickup() {
  await requireAdmin();
  const r = await sendPickupReminders({ force: true });
  redirect(`/admin?reminded=families about pickup&sent=${r.sent}&remaining=${r.remaining}`);
}

// --------------------------------------------------------------- pickup day

export async function markPickedUp(applicationId: string, fd: FormData) {
  await requireAdmin();
  await db.application.update({ where: { id: applicationId }, data: { pickedUpAt: new Date() } });
  revalidatePath("/admin/pickup");
  redirect(`/admin/pickup${str(fd, "q") ? `?q=${encodeURIComponent(str(fd, "q"))}` : ""}`);
}

export async function undoPickedUp(applicationId: string) {
  await requireAdmin();
  await db.application.update({ where: { id: applicationId }, data: { pickedUpAt: null } });
  revalidatePath("/admin/pickup");
}

// --------------------------------------------------------- business partners

export async function approvePartner(id: string) {
  await requireAdmin();
  await db.corporatePartner.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
  await thankPartnerIfLive(id);
  revalidatePath("/", "layout");
}

export async function declinePartner(id: string) {
  await requireAdmin();
  await db.corporatePartner.update({ where: { id }, data: { status: "DECLINED", approvedAt: null } });
  revalidatePath("/", "layout");
}

export async function updatePartner(id: string, fd: FormData) {
  await requireAdmin();
  const tier = str(fd, "tierOverride");
  await db.corporatePartner.update({
    where: { id },
    data: {
      businessName: str(fd, "businessName") || undefined,
      website: optStr(fd, "website"),
      tierOverride: tier === "GOLD" || tier === "SILVER" || tier === "BRONZE" ? tier : null,
    },
  });
  await thankPartnerIfLive(id);
  revalidatePath("/", "layout");
}

export async function saveSponsorPublic(id: string, fd: FormData) {
  await requireAdmin();
  await db.sponsor.update({
    where: { id },
    data: { anonymous: fd.get("anonymous") === "on", displayName: optStr(fd, "displayName") },
  });
  revalidatePath("/", "layout");
}

// --------------------------------------------------------------- seasons

/** Deletes a season that has nothing in it yet (e.g. one created while testing). */
export async function deleteEmptySeason(id: string) {
  await requireAdmin();
  const s = await db.season.findUnique({
    where: { id },
    include: { _count: { select: { applications: true, angels: true, sponsorships: true, donations: true, inKindGifts: true, partners: true } } },
  });
  if (!s) redirect("/admin/seasons");
  if (Object.values(s._count).some((n) => n > 0)) redirect("/admin/seasons?error=notempty");
  await db.season.delete({ where: { id } });
  (await cookies()).delete(ADMIN_SEASON_COOKIE);
  revalidatePath("/", "layout");
  redirect("/admin/seasons?deleted=1");
}

/** When a business partner's gift is confirmed, their logo may have just gone live. */
async function thankPartnersOf(donationId: string) {
  const d = await db.donation.findUnique({ where: { id: donationId }, select: { sponsorId: true, seasonId: true } });
  if (!d?.sponsorId) return;
  const p = await db.corporatePartner.findUnique({ where: { seasonId_sponsorId: { seasonId: d.seasonId, sponsorId: d.sponsorId } } });
  if (p) await thankPartnerIfLive(p.id);
}

export async function sendSeasonThanksNow() {
  await requireAdmin();
  const season = await getAdminSeason();
  if (!season) redirect("/admin");
  const r = await sendSeasonThanks(season.id);
  redirect(`/admin/season-thanks?sent=${r.sent}&remaining=${r.remaining}`);
}

// ---------------------------------------------------------------- test mode

export async function loadSampleDataAction() {
  await requireAdmin();
  if (!isSandbox()) redirect("/admin");
  const r = await loadSampleData(db);
  (await cookies()).delete(ADMIN_SEASON_COOKIE);
  revalidatePath("/", "layout");
  redirect(`/admin/sandbox?loaded=${r.angels}`);
}

export async function deleteAllDataAction(fd: FormData) {
  await requireAdmin();
  if (!isSandbox()) redirect("/admin");
  if (str(fd, "confirm") !== "DELETE") redirect("/admin/sandbox?error=confirm");
  await deleteAllData(db);
  (await cookies()).delete(ADMIN_SEASON_COOKIE);
  revalidatePath("/", "layout");
  redirect("/admin/sandbox?wiped=1");
}

export async function clearOutbox() {
  await requireAdmin();
  if (!isSandbox()) redirect("/admin");
  await db.sandboxEmail.deleteMany();
  revalidatePath("/admin/sandbox");
}

// ---------------------------------------------------------- ministry needs

function safeUrl(raw: string) {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function addNeeds(fd: FormData) {
  await requireAdmin();
  const season = await getAdminSeason();
  if (!season) redirect("/admin/seasons?setup=1");
  const items = parseNeedLines(str(fd, "lines"));
  if (items.length === 0) redirect("/admin/needs?error=empty");
  const last = await db.needItem.aggregate({ where: { seasonId: season.id }, _max: { sortOrder: true } });
  let order = (last._max.sortOrder ?? 0) + 1;
  await db.needItem.createMany({
    data: items.map((i) => ({ seasonId: season.id, name: i.name, url: safeUrl(i.url ?? ""), priceCents: i.priceCents, quantity: i.quantity, sortOrder: order++ })),
  });
  revalidatePath("/give");
  redirect(`/admin/needs?added=${items.length}`);
}

export async function updateNeed(id: string, fd: FormData) {
  await requireAdmin();
  await db.needItem.update({
    where: { id },
    data: {
      name: str(fd, "name").slice(0, 160) || undefined,
      details: optStr(fd, "details"),
      url: safeUrl(str(fd, "url")),
      priceCents: parseMoneyToCents(fd.get("price")),
      quantity: Math.max(1, Math.min(9999, Number(str(fd, "quantity")) || 1)),
    },
  });
  revalidatePath("/give");
  revalidatePath("/admin/needs");
}

export async function toggleNeedHidden(id: string) {
  await requireAdmin();
  const n = await db.needItem.findUnique({ where: { id } });
  if (n) await db.needItem.update({ where: { id }, data: { hidden: !n.hidden } });
  revalidatePath("/give");
  revalidatePath("/admin/needs");
}

/** Deletes an item nobody has bought yet (items with gifts are hidden instead, to keep giving records). */
export async function deleteNeed(id: string) {
  await requireAdmin();
  const gifts = await db.inKindGift.count({ where: { needItemId: id } });
  if (gifts > 0) await db.needItem.update({ where: { id }, data: { hidden: true } });
  else await db.needItem.delete({ where: { id } });
  revalidatePath("/give");
  revalidatePath("/admin/needs");
}

// ------------------------------------------------------------------ applications from the Google Form

/** Boy/girl for a child whose application didn't say (e.g. imported from the Google Form). */
export async function setChildGender(angelId: string, fd: FormData) {
  await requireAdmin();
  const gender = str(fd, "gender");
  if (gender !== "GIRL" && gender !== "BOY") return;
  const angel = await db.angel.update({ where: { id: angelId }, data: { gender } });
  await db.child.update({ where: { id: angel.childId }, data: { gender } });
  revalidatePath(`/admin/applications/${angel.applicationId}`);
}

/**
 * Imports applications from the Google Form's CSV export into the season being viewed.
 * Rows already imported are skipped, so uploading the same (or a newer) export again
 * only adds what's new. Stops early if it runs long; upload again to finish.
 */
export async function importApplications(fd: FormData) {
  await requireAdmin();
  const season = await getAdminSeason();
  const file = fd.get("csv");
  if (!season || !(file instanceof File) || file.size === 0) redirect("/admin/applications/import?error=file");
  let rows: ReturnType<typeof parseGoogleFormCsv>;
  try {
    rows = parseGoogleFormCsv(await file.text());
  } catch {
    redirect("/admin/applications/import?error=format");
  }
  const started = Date.now();
  let added = 0;
  let already = 0;
  let left = 0;
  const problems: string[] = [];
  for (const r of rows) {
    if (!r.data) {
      problems.push(`Row ${r.row}: ${r.error}`);
      continue;
    }
    if (Date.now() - started > 7000) {
      left++;
      continue;
    }
    if (await db.application.findUnique({ where: { importKey: r.data.importKey }, select: { id: true } })) {
      already++;
      continue;
    }
    const data = { ...r.data, seasonId: season.id };
    const result = await db.$transaction((tx) => createApplication(tx, data), { timeout: 20000 });
    if (result.duplicate) {
      already++;
      problems.push(`Row ${r.row}: ${r.data.parentFirstName} ${r.data.parentLastName} already has an application this season (same phone).`);
    } else added++;
  }
  revalidatePath("/admin/applications");
  const q = new URLSearchParams({ added: String(added), already: String(already), left: String(left) });
  if (problems.length) q.set("problems", problems.slice(0, 20).join("\n"));
  redirect(`/admin/applications/import?${q}`);
}

/** Saves a parent's email (e.g. for a family imported without one) and emails them their family link. */
export async function setFamilyEmail(applicationId: string, fd: FormData) {
  await requireAdmin();
  const email = str(fd, "email").slice(0, 200);
  const app = await db.application.findUnique({ where: { id: applicationId }, include: { household: true } });
  if (!app) return;
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect(`/admin/applications/${applicationId}?error=email`);
  await db.household.update({ where: { id: app.householdId }, data: { email, emailNormalized: normalizeEmail(email) } });
  const t = dict[toLang(app.language)].email;
  await sendEmail({
    to: email,
    subject: t.linkSubject(site.name),
    html: layout(t.link(esc(app.household.parentFirstName), button(siteUrl(`/family/${app.accessToken}`), t.pageButton))),
  });
  redirect(`/admin/applications/${applicationId}?saved=email`);
}
