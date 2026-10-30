import type { ApplicationStatus } from "@prisma/client";
import { db } from "./db";
import { button, esc, layout, sendEmail, siteUrl } from "./email";
import { wishlistsAreOpen } from "./season";
import { site } from "@/content/site";
import { dict, longDate, toLang } from "@/content/i18n";

type Opts = {
  notify: boolean;
  message?: string;
  adminNotes?: string | null;
  capOverride?: boolean;
  // Set when the automatic check approves the family.
  auto?: boolean;
};

/**
 * Records a decision on an application. Approving gives each child an angel
 * number (and, after the wish-list deadline, locks in their lists). With
 * `notify`, the family is emailed in their language.
 */
export async function setDecision(id: string, status: ApplicationStatus, opts: Opts) {
  const app = await db.application.findUnique({ where: { id }, include: { household: true, season: true, angels: true } });
  if (!app) return;

  // After the wish-list deadline, approving locks in the list from the application.
  const lockLists = status === "APPROVED" && !app.listSubmittedAt && !wishlistsAreOpen(app.season);
  await db.$transaction(async (tx) => {
    await tx.application.update({
      where: { id },
      data: {
        status,
        decidedAt: status === "PENDING" ? null : new Date(),
        ...(lockLists ? { listSubmittedAt: new Date() } : {}),
        ...(opts.adminNotes !== undefined ? { adminNotes: opts.adminNotes ?? app.adminNotes } : {}),
        ...(opts.capOverride ? { capOverrideAt: new Date() } : {}),
        ...(opts.auto ? { autoApprovedAt: new Date(), reviewFlags: [], missingInfo: [] } : {}),
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

  if (opts.notify && app.household.email && status !== "PENDING") {
    const lang = toLang(app.language);
    const t = dict[lang].email;
    const first = esc(app.household.parentFirstName);
    const link = siteUrl(`/family/${app.accessToken}`);
    const extra = opts.message ? `<p>${esc(opts.message).replace(/\n/g, "<br/>")}</p>` : "";
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
}
