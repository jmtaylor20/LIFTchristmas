import { db } from "./db";
import { button, esc, layout, notifyAdmin, sendEmail, siteUrl } from "./email";
import { money } from "./format";
import { approvedYears } from "./households";
import { setDecision } from "./decisions";
import { site } from "@/content/site";
import { dict, toLang } from "@/content/i18n";

// Documents a family must provide before the automatic check can approve them.
export const REQUIRED_DOCUMENTS = ["PHOTO_ID", "INCOME"] as const;
export type MissingItem = (typeof REQUIRED_DOCUMENTS)[number];

export type ReviewResult = "approved" | "flagged" | "missing" | "skipped";

/**
 * The three gates for a new website application:
 * 1. Missing documents → ask the family for them (by email, with a link to their page).
 * 2. Anything that doesn't meet the criteria → leave it pending and flag it for the owner.
 * 3. Everything checks out → approve it, just as the owner would.
 *
 * Only pending website applications are checked, and only while the season has
 * automatic approval turned on. Imported Google Form applications are left to the owner.
 */
export async function autoReview(applicationId: string, opts: { emailFamily?: boolean } = {}): Promise<ReviewResult> {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { season: true, household: true, documents: { select: { kind: true } }, _count: { select: { angels: true } } },
  });
  if (!app || app.status !== "PENDING" || app.source !== "web" || !app.season.autoApprove) return "skipped";
  const who = `${app.household.parentFirstName} ${app.household.parentLastName}`;
  const adminLink = button(siteUrl(`/admin/applications/${app.id}`), "Open the application");

  // Gate 1: missing documents.
  const missing = REQUIRED_DOCUMENTS.filter((kind) => !app.documents.some((d) => d.kind === kind));
  if (missing.length > 0) {
    await db.application.update({
      where: { id: app.id },
      data: { missingInfo: [...missing], reviewFlags: [], infoRequestedAt: app.infoRequestedAt ?? new Date() },
    });
    if (opts.emailFamily && app.household.email) {
      const lang = toLang(app.language);
      const t = dict[lang];
      const items = missing.map((m) => `<li>${esc(m === "PHOTO_ID" ? t.form.photoIdShort : t.form.incomeProofShort)}</li>`).join("");
      await sendEmail({
        to: app.household.email,
        subject: t.email.needInfoSubject,
        html: layout(t.email.needInfo(esc(app.household.parentFirstName), `<ul>${items}</ul>`, button(siteUrl(`/family/${app.accessToken}`), t.email.needInfoButton), esc(site.name))),
      });
    }
    await notifyAdmin(
      `Waiting on ${who} for documents`,
      `<p>${esc(who)} applied without: ${missing.map((m) => (m === "PHOTO_ID" ? "photo ID" : "income proof")).join(" and ")}. We emailed them a link to add ${missing.length === 1 ? "it" : "them"}; the application will be checked again when they do.</p>${adminLink}`,
    );
    return "missing";
  }

  // Gate 2: criteria.
  const flags: string[] = [];
  if (app.hasJob !== true) flags.push("Doesn't have a job");
  if (app.hasJob !== true && app.lookingForWork !== true) flags.push("Not working or looking for work");
  if (app.annualIncomeCents == null) flags.push("Yearly income not given");
  else if (app.annualIncomeCents > app.season.incomeLimitCents)
    flags.push(`Yearly income ${money(app.annualIncomeCents)} is over ${money(app.season.incomeLimitCents)}`);
  const years = (await approvedYears(app.householdId, app.seasonId)).length + (app.household.priorYearsSponsored ?? 0);
  if (years >= app.season.approvalCapYears) flags.push(`Already sponsored ${years} years (limit ${app.season.approvalCapYears})`);
  if (app.priorHelp && app.household.priorYearsSponsored == null) flags.push("Says Community Christmas helped them before: check how many years");

  if (flags.length > 0) {
    await db.application.update({ where: { id: app.id }, data: { reviewFlags: flags, missingInfo: [] } });
    await notifyAdmin(
      `Application from ${who} needs your review`,
      `<p>The automatic check didn't approve ${esc(who)}'s application:</p><ul>${flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>${adminLink}`,
    );
    return "flagged";
  }

  // Gate 3: approve.
  await setDecision(app.id, "APPROVED", { notify: true, auto: true });
  await notifyAdmin(
    `${who} was approved automatically`,
    `<p>${esc(who)} met every requirement and was approved automatically, with ${app._count.angels} child${app._count.angels === 1 ? "" : "ren"}. They've been emailed.</p>${adminLink}`,
  );
  return "approved";
}
