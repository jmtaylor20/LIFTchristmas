import { db } from "./db";
import { button, esc, layout, sendEmail, siteUrl } from "./email";
import { formatDate, money } from "./format";
import { BATCH_SIZE, pause } from "./givers";
import { getActiveSeason } from "./season";
import { dict, longDate, toLang } from "@/content/i18n";
import { shipToHtml } from "./shipping";

const DAY = 24 * 60 * 60 * 1000;
// Automatic reminders go out this many days before a deadline.
export const REMINDER_DAYS_BEFORE = 4;

function inReminderWindow(deadline: Date | null) {
  if (!deadline) return false;
  const left = deadline.getTime() - Date.now();
  return left > 0 && left <= REMINDER_DAYS_BEFORE * DAY;
}

type Opts = {
  // Send now even if the deadline isn't close (admin button). Still skips anyone reminded in the last day.
  force?: boolean;
  limit?: number;
};

/** Approved families who haven't submitted their wish lists yet. */
export async function familiesNeedingLists(seasonId: string) {
  return db.application.findMany({
    where: { seasonId, status: "APPROVED", listSubmittedAt: null },
    include: { household: true, season: true },
    orderBy: { listReminderSentAt: { sort: "asc", nulls: "first" } },
  });
}

/** Sponsors who committed to gifts that haven't been dropped off yet. */
export async function sponsorsWithOpenGifts(seasonId: string) {
  return db.sponsorship.findMany({
    where: { seasonId, status: "COMMITTED", items: { some: { status: "CLAIMED" } } },
    include: { sponsor: true, angel: true, season: true, items: { where: { status: "CLAIMED" } } },
    orderBy: { reminderSentAt: { sort: "asc", nulls: "first" } },
  });
}

function due(lastSent: Date | null, deadline: Date | null, force: boolean) {
  if (force) return !lastSent || Date.now() - lastSent.getTime() > DAY;
  return !lastSent && inReminderWindow(deadline);
}

export async function sendListReminders(opts: Opts = {}) {
  const season = await getActiveSeason();
  if (!season || (season.wishlistDeadline && season.wishlistDeadline < new Date())) return { sent: 0, remaining: 0 };
  const todo = (await familiesNeedingLists(season.id)).filter(
    (a) => a.household.email && due(a.listReminderSentAt, season.wishlistDeadline, !!opts.force),
  );
  const limit = opts.limit ?? BATCH_SIZE;
  let sent = 0;
  for (const app of todo.slice(0, limit)) {
    const lang = toLang(app.language);
    const t = dict[lang].email;
    await sendEmail({
      to: app.household.email!,
      subject: t.reminderSubject,
      html: layout(
        t.reminder(
          esc(app.household.parentFirstName),
          season.wishlistDeadline ? longDate(season.wishlistDeadline, lang) : "",
          button(siteUrl(`/family/${app.accessToken}`), t.approvedButton),
        ),
      ),
    });
    await db.application.update({ where: { id: app.id }, data: { listReminderSentAt: new Date() } });
    sent++;
    await pause();
  }
  return { sent, remaining: Math.max(0, todo.length - limit) };
}

export async function sendSponsorReminders(opts: Opts = {}) {
  const season = await getActiveSeason();
  if (!season || (season.giftDeadline && season.giftDeadline < new Date())) return { sent: 0, remaining: 0 };
  const todo = (await sponsorsWithOpenGifts(season.id)).filter((s) => due(s.reminderSentAt, season.giftDeadline, !!opts.force));
  const limit = opts.limit ?? BATCH_SIZE;
  let sent = 0;
  for (const s of todo.slice(0, limit)) {
    const list = s.items
      .map((i) => `<li><strong>${esc(i.name)}</strong>${i.details ? ` &mdash; ${esc(i.details)}` : ""}${i.estPriceCents ? ` (about ${money(i.estPriceCents)})` : ""}</li>`)
      .join("");
    await sendEmail({
      to: s.sponsor.email,
      subject: `Reminder: gifts for Angel #${s.angel.number}${season.giftDeadline ? ` are due ${formatDate(season.giftDeadline, { month: "short", year: undefined })}` : ""}`,
      html: layout(`<p>Hi ${esc(s.sponsor.firstName)},</p>
<p>Thank you again for sponsoring <strong>Angel #${s.angel.number}</strong>! This is a friendly reminder that these gifts are due${season.giftDeadline ? ` by <strong>${formatDate(season.giftDeadline)}</strong>` : " soon"}:</p>
<ul>${list}</ul>
<p>Sizes: shirt ${esc(s.angel.shirtSize) || "—"}, pants ${esc(s.angel.pantsSize) || "—"}, shoes ${esc(s.angel.shoeSize) || "—"}.</p>
${
  s.delivery === "SHIP" && season.shippingAddress
    ? `<p>Please ship your order to:</p>${shipToHtml(s.angel.number, season.shippingAddress)}`
    : `<p>Please bring gifts unwrapped and labeled &ldquo;Angel #${s.angel.number}&rdquo;.</p>
${season.dropOffInstructions ? `<p>${esc(season.dropOffInstructions).replace(/\n/g, "<br/>")}</p>` : ""}`
}
<p>If something has come up and you can't finish, just reply to this email so we can make sure Angel #${s.angel.number} is still covered.</p>
${button(siteUrl("/account"), "View my giver profile")}`),
    });
    await db.sponsorship.update({ where: { id: s.id }, data: { reminderSentAt: new Date() } });
    sent++;
    await pause();
  }
  return { sent, remaining: Math.max(0, todo.length - limit) };
}
