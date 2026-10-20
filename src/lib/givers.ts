import { db } from "./db";
import { button, esc, layout, sendEmail, siteUrl } from "./email";
import { formatDate, money, normalizeEmail } from "./format";
import { randomToken, sha256 } from "./tokens";
import { org, receiptDisclaimer, site } from "@/content/site";

export type GiverInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
};

/** Every donor, sponsor and wish-list buyer gets one profile, keyed by email. */
export async function upsertGiver(input: GiverInput) {
  const emailNormalized = normalizeEmail(input.email)!;
  return db.sponsor.upsert({
    where: { emailNormalized },
    create: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.trim(),
      emailNormalized,
      phone: input.phone || null,
      organization: input.organization || null,
    },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.organization ? { organization: input.organization } : {}),
    },
  });
}

export async function sendLoginLink(sponsorId: string, email: string, firstName: string) {
  const token = randomToken();
  await db.loginToken.create({
    data: { sponsorId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const link = siteUrl(`/account/verify?token=${encodeURIComponent(token)}`);
  await sendEmail({
    to: email,
    subject: `Your ${site.name} sign-in link`,
    html: layout(`<p>Hi ${esc(firstName)},</p>
<p>Use the button below to open your giver profile. You'll see your sponsored angels, your gifts, and your giving records.</p>
${button(link, "Open my giver profile")}
<p style="font-size:13px;color:#666">This link works once and expires in 1 hour. If you didn't ask for it, you can ignore this email.</p>`),
  });
}

// ---------------------------------------------------------------- receipts

export async function sendDonationReceipt(donationId: string) {
  const d = await db.donation.findUnique({ where: { id: donationId } });
  if (!d || d.status !== "PAID" || d.receiptSentAt || !d.donorEmail) return;
  const ok = await sendEmail({
    to: d.donorEmail,
    subject: `Thank you for your gift to ${site.name}`,
    html: layout(`<p>Dear ${esc(d.donorName)},</p>
<p>Thank you for your generous gift! Every dollar helps a child in ${esc(site.communities)} experience the joy of Christmas and the love of Christ.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <tr><td style="padding:6px 0;color:#666">Amount</td><td style="text-align:right;font-weight:bold">${money(d.amountCents, { cents: true })}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Date received</td><td style="text-align:right">${formatDate(d.receivedAt ?? d.createdAt)}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Method</td><td style="text-align:right">${methodLabel(d.method)}</td></tr>
</table>
${receiptFooter()}
<p>A full giving statement for the year will be emailed to you in January, and you can view it any time from your giver profile.</p>
${button(siteUrl("/account"), "View my giver profile")}`),
  });
  if (ok) await db.donation.update({ where: { id: d.id }, data: { receiptSentAt: new Date() } });
}

function methodLabel(m: string) {
  return { VENMO: "Venmo", CASH: "Cash", CHECK: "Check", OTHER: "Other" }[m] ?? m;
}

function receiptFooter(plural = false) {
  return `<p style="font-size:13px;color:#555;border-top:1px solid #eee;padding-top:12px">
${esc(org.legalName)}${org.ein ? ` &middot; EIN ${esc(org.ein)}` : ""}${org.mailingAddress ? `<br/>${esc(org.mailingAddress)}` : ""}<br/>
${esc(receiptDisclaimer(plural))}</p>`;
}

// ------------------------------------------------------ giving statements

function yearRange(year: number) {
  // Calendar year in US Central time.
  return { gte: new Date(`${year}-01-01T00:00:00-06:00`), lt: new Date(`${year + 1}-01-01T00:00:00-06:00`) };
}

export async function buildStatement(sponsorId: string, year: number) {
  const range = yearRange(year);
  const sponsor = await db.sponsor.findUnique({ where: { id: sponsorId } });
  if (!sponsor) return null;

  const [donations, items, inKind] = await Promise.all([
    db.donation.findMany({
      where: { sponsorId, status: "PAID", receivedAt: range },
      orderBy: { receivedAt: "asc" },
    }),
    db.wishItem.findMany({
      where: { status: "RECEIVED", receivedAt: range, sponsorship: { sponsorId } },
      include: { angel: true },
      orderBy: { receivedAt: "asc" },
    }),
    db.inKindGift.findMany({
      where: { sponsorId, receivedAt: range },
      orderBy: { receivedAt: "asc" },
    }),
  ]);

  const cashTotalCents = donations.reduce((sum, d) => sum + d.amountCents, 0);
  const noncash = [
    ...items.map((i) => ({
      date: i.receivedAt!,
      description: `${i.name}${i.details ? ` (${i.details})` : ""} — gift for Angel #${i.angel.number}`,
    })),
    ...inKind.map((g) => ({
      date: g.receivedAt!,
      description: `${g.description}${g.source === "AMAZON_WISHLIST" ? " (Amazon wish list)" : ""}`,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    sponsor,
    year,
    donations,
    cashTotalCents,
    noncash,
    isEmpty: donations.length === 0 && noncash.length === 0,
  };
}

export type Statement = NonNullable<Awaited<ReturnType<typeof buildStatement>>>;

export function statementHtml(s: Statement) {
  const rows = s.donations
    .map(
      (d) =>
        `<tr><td style="padding:6px 0">${formatDate(d.receivedAt, { month: "short" })}</td><td>${methodLabel(d.method)}</td><td style="text-align:right">${money(d.amountCents, { cents: true })}</td></tr>`,
    )
    .join("");
  const noncash = s.noncash
    .map((n) => `<li>${formatDate(n.date, { month: "short" })} &mdash; ${esc(n.description)}</li>`)
    .join("");
  const name = [s.sponsor.firstName, s.sponsor.lastName].join(" ");

  return `<p>Dear ${esc(s.sponsor.firstName)},</p>
<p>Thank you for blessing the children of ${esc(site.communities)} this year. Below is your ${s.year} giving statement${org.taxExempt ? " for your tax records" : ""}.</p>
<h3 style="margin:20px 0 4px;color:#294f65;font-family:Georgia,serif;font-weight:normal">${s.year} Giving Statement</h3>
<p style="margin:0;color:#555">${esc(name)}${s.sponsor.organization ? ` &middot; ${esc(s.sponsor.organization)}` : ""}<br/>${esc(s.sponsor.email)}</p>
<h4 style="margin:20px 0 4px">Monetary contributions</h4>
${
  s.donations.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td colspan="2" style="padding-top:8px;border-top:1px solid #ddd;font-weight:bold">Total</td><td style="text-align:right;padding-top:8px;border-top:1px solid #ddd;font-weight:bold">${money(s.cashTotalCents, { cents: true })}</td></tr></table>`
    : `<p style="color:#666">None recorded.</p>`
}
<h4 style="margin:20px 0 4px">Non-cash gifts received</h4>
${
  s.noncash.length
    ? `<ul style="padding-left:18px;font-size:14px">${noncash}</ul><p style="font-size:13px;color:#555">The ministry does not assign a value to non-cash gifts. Please keep your purchase receipts to determine their value.</p>`
    : `<p style="color:#666">None recorded.</p>`
}
${receiptFooter(true)}`;
}

/**
 * Emails the statement and records it. Skips givers with nothing to report.
 * With `onlyIfUnsent`, givers who already received this year's statement are skipped.
 */
export async function sendStatement(sponsorId: string, year: number, opts: { onlyIfUnsent?: boolean } = {}) {
  if (opts.onlyIfUnsent) {
    const existing = await db.givingStatement.findUnique({ where: { sponsorId_taxYear: { sponsorId, taxYear: year } } });
    if (existing) return "skipped" as const;
  }
  const s = await buildStatement(sponsorId, year);
  if (!s || s.isEmpty) return "empty" as const;
  const ok = await sendEmail({
    to: s.sponsor.email,
    subject: `Your ${s.year} giving statement — ${site.name}`,
    html: layout(statementHtml(s) + button(siteUrl(`/account/statements/${year}`), "View or print online")),
  });
  if (!ok && process.env.RESEND_API_KEY) return "failed" as const;
  await db.givingStatement.upsert({
    where: { sponsorId_taxYear: { sponsorId, taxYear: year } },
    create: { sponsorId, taxYear: year, totalCents: s.cashTotalCents, emailedTo: s.sponsor.email },
    update: { totalCents: s.cashTotalCents, emailedTo: s.sponsor.email, sentAt: new Date(), sendCount: { increment: 1 } },
  });
  return "sent" as const;
}

/** Givers who gave anything (money, received gifts, in-kind) during the year. */
export async function giversForYear(year: number) {
  const range = yearRange(year);
  const rows = await db.sponsor.findMany({
    where: {
      OR: [
        { donations: { some: { status: "PAID", receivedAt: range } } },
        { inKindGifts: { some: { receivedAt: range } } },
        { sponsorships: { some: { items: { some: { status: "RECEIVED", receivedAt: range } } } } },
      ],
    },
    include: { statements: { where: { taxYear: year } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return rows;
}

/**
 * Sends statements in small batches so a run fits within the host's request
 * time limit and the email provider's rate limit. Call again (or let the
 * scheduled job run again) until `remaining` is 0.
 */
export async function sendAllStatements(year: number, opts: { onlyIfUnsent?: boolean; limit?: number } = {}) {
  const limit = opts.limit ?? BATCH_SIZE;
  const givers = await giversForYear(year);
  const todo = opts.onlyIfUnsent ? givers.filter((g) => g.statements.length === 0) : givers;
  const result = { sent: 0, skipped: givers.length - todo.length, empty: 0, failed: 0, remaining: 0 };
  for (const [i, g] of todo.entries()) {
    if (i >= limit) {
      result.remaining = todo.length - i;
      break;
    }
    result[await sendStatement(g.id, year)]++;
    await pause();
  }
  return result;
}

export const BATCH_SIZE = 12;

/** Keeps bulk sends under the email provider's ~2 messages/second limit. */
export function pause(ms = 600) {
  return new Promise((r) => setTimeout(r, ms));
}
