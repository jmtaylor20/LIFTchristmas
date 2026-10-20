import { db } from "./db";
import { button, esc, layout, sendEmail, siteUrl } from "./email";
import { formatDate, money } from "./format";
import { BATCH_SIZE, pause } from "./givers";
import { seasonPartners, tierLabel } from "./recognition";
import { site } from "@/content/site";

// Automatic thank-you emails. Each is logged in EmailLog so it goes out once.

async function sendOnce(kind: string, refId: string, send: () => Promise<boolean>) {
  if (await db.emailLog.findUnique({ where: { kind_refId: { kind, refId } } })) return false;
  const ok = await send();
  // Without an email provider configured, messages are only logged; still mark them done.
  if (!ok && process.env.RESEND_API_KEY) return false;
  await db.emailLog.create({ data: { kind, refId } }).catch(() => null);
  return true;
}

/** A sponsor's gifts for their angel have all arrived. */
export async function thankForReceivedGifts(sponsorshipId: string) {
  const s = await db.sponsorship.findUnique({
    where: { id: sponsorshipId },
    include: { sponsor: true, angel: true, items: true },
  });
  if (!s || s.status !== "DELIVERED") return;
  await sendOnce("GIFTS_RECEIVED", s.id, () =>
    sendEmail({
      to: s.sponsor.email,
      subject: `Your gifts for Angel #${s.angel.number} arrived. Thank you!`,
      html: layout(`<p>Dear ${esc(s.sponsor.firstName)},</p>
<p>We wanted you to know that your gifts for <strong>Angel #${s.angel.number}</strong> have arrived safely:</p>
<ul>${s.items.map((i) => `<li>${esc(i.name)}</li>`).join("")}</ul>
<p>Because of you, a child in ${esc(site.communities)} will have a Christmas morning filled with joy. ${esc(site.thanksLine)}</p>
<p>&ldquo;${esc(site.giveVerse.text)}&rdquo; &mdash; ${esc(site.giveVerse.ref)}</p>
${button(siteUrl("/account"), "View my giving")}
<p>With gratitude,<br/>${esc(site.fullName)}</p>`),
    }),
  );
}

/** An Amazon wish-list or drop-off gift was received. */
export async function thankForInKindGift(id: string) {
  const g = await db.inKindGift.findUnique({ where: { id } });
  if (!g?.receivedAt || !g.donorEmail) return;
  await sendOnce("IN_KIND_RECEIVED", g.id, () =>
    sendEmail({
      to: g.donorEmail!,
      subject: `We received your gift. Thank you!`,
      html: layout(`<p>Dear ${esc(g.donorName.split(" ")[0])},</p>
<p>Your gift arrived: <strong>${esc(g.description)}</strong>. Thank you for helping us bless families in ${esc(site.communities)} this Christmas!</p>
<p>${esc(site.thanksLine)}</p>
${button(siteUrl("/account"), "View my giving")}
<p>With gratitude,<br/>${esc(site.fullName)}</p>`),
    }),
  );
}

/** A business partner's logo is now on the home page (approved and gift received). */
export async function thankPartnerIfLive(partnerId: string) {
  const p = await db.corporatePartner.findUnique({ where: { id: partnerId }, select: { seasonId: true } });
  if (!p) return;
  const partner = (await seasonPartners(p.seasonId)).find((x) => x.id === partnerId);
  if (!partner || partner.status !== "APPROVED" || !partner.tier) return;
  await sendOnce("PARTNER_LIVE", partner.id, () =>
    sendEmail({
      to: partner.sponsor.email,
      subject: `${partner.businessName} is now a ${tierLabel(partner.tier)} Christmas partner`,
      html: layout(`<p>Dear ${esc(partner.sponsor.firstName)},</p>
<p>Thank you! <strong>${esc(partner.businessName)}</strong> is now featured on our home page as a <strong>${tierLabel(partner.tier)} partner</strong> of ${esc(site.fullName)}.</p>
<p>Your gift of ${money(partner.confirmedCents)} helps children across ${esc(site.communities)} wake up to gifts chosen just for them. ${esc(site.thanksLine)}</p>
${button(siteUrl("/"), "See your logo")}
<p>With gratitude,<br/>${esc(site.fullName)}</p>`),
    }),
  );
}

/** Real numbers for the season wrap-up (no estimates). */
export async function seasonImpact(seasonId: string) {
  const [children, families, giftsGiven, givers] = await Promise.all([
    db.angel.count({ where: { seasonId, application: { status: "APPROVED", listSubmittedAt: { not: null } } } }),
    db.application.count({ where: { seasonId, status: "APPROVED" } }),
    db.wishItem.count({ where: { angel: { seasonId }, status: { in: ["RECEIVED", "MINISTRY"] } } }),
    seasonGivers(seasonId),
  ]);
  return { children, families, giftsGiven, givers: givers.length };
}

/** Everyone whose gift the ministry confirmed this season (anonymous givers included; this is private email). */
export async function seasonGivers(seasonId: string) {
  return db.sponsor.findMany({
    where: {
      OR: [
        { donations: { some: { seasonId, status: "PAID" } } },
        { sponsorships: { some: { seasonId, status: { not: "CANCELLED" }, items: { some: { status: "RECEIVED" } } } } },
        { inKindGifts: { some: { seasonId, receivedAt: { not: null } } } },
        { partners: { some: { seasonId, status: "APPROVED" } } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export function seasonThanksHtml(firstName: string, year: number, impact: Awaited<ReturnType<typeof seasonImpact>>) {
  const lines = [
    impact.children > 0 && `<li><strong>${impact.children}</strong> children in ${impact.families} families had gifts to open on Christmas morning</li>`,
    impact.giftsGiven > 0 && `<li><strong>${impact.giftsGiven}</strong> wish-list gifts were given</li>`,
    impact.givers > 1 && `<li><strong>${impact.givers}</strong> neighbors, churches, and businesses gave, including you</li>`,
  ].filter(Boolean);
  return `<p>Dear ${esc(firstName)},</p>
<p>Merry Christmas! As Community Christmas ${year} comes to a close, we want to say <strong>thank you</strong>. Your generosity helped families across ${esc(site.communities)} celebrate the birth of our Savior with joy.</p>
${lines.length ? `<p>Together, this Christmas:</p><ul>${lines.join("")}</ul>` : ""}
<p>${esc(site.thanksLine)}</p>
<p style="font-family:Georgia,serif;font-style:italic">&ldquo;${esc(site.giveVerse.text)}&rdquo; &mdash; ${esc(site.giveVerse.ref)}</p>
${button(siteUrl("/account"), "See my giving")}
<p>With love and gratitude,<br/>${esc(site.fullName)}<br/><span style="color:#55636a">${esc(site.ministry)} &middot; ${esc(site.ministryMotto)}</span></p>`;
}

/** Sends the season wrap-up thank-you to the next batch of givers who haven't had it. */
export async function sendSeasonThanks(seasonId: string, opts: { limit?: number } = {}) {
  const season = await db.season.findUnique({ where: { id: seasonId } });
  if (!season) return { sent: 0, remaining: 0, total: 0 };
  const givers = await seasonGivers(seasonId);
  const done = new Set(
    (await db.emailLog.findMany({ where: { kind: "SEASON_THANKS", refId: { startsWith: `${seasonId}:` } }, select: { refId: true } })).map(
      (l) => l.refId,
    ),
  );
  const todo = givers.filter((g) => !done.has(`${seasonId}:${g.id}`));
  const impact = await seasonImpact(seasonId);
  const limit = opts.limit ?? BATCH_SIZE;
  let sent = 0;
  for (const g of todo.slice(0, limit)) {
    const ok = await sendOnce("SEASON_THANKS", `${seasonId}:${g.id}`, () =>
      sendEmail({
        to: g.email,
        subject: `Thank you for Community Christmas ${season.year}!`,
        html: layout(seasonThanksHtml(g.firstName, season.year, impact)),
      }),
    );
    if (ok) sent++;
    await pause();
  }
  return { sent, remaining: Math.max(0, todo.length - limit), total: givers.length };
}

/** The wrap-up goes out automatically from December 27 through January 10 (US Central). */
export function inSeasonThanksWindow(year: number, now = new Date()) {
  const start = new Date(`${year}-12-27T08:00:00-06:00`);
  const end = new Date(`${year + 1}-01-10T23:59:59-06:00`);
  return now >= start && now <= end;
}

export function seasonThanksStartDate(year: number) {
  return formatDate(new Date(`${year}-12-27T08:00:00-06:00`));
}
