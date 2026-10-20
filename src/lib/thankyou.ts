import { db } from "./db";
import { button, esc, layout, sendEmail, siteUrl } from "./email";
import { pause } from "./givers";
import { site } from "@/content/site";

/** Givers who sponsored the children a note is about (or all the family's children). */
export async function noteRecipients(noteId: string) {
  const note = await db.thankYouNote.findUnique({
    where: { id: noteId },
    select: { angelId: true, applicationId: true },
  });
  if (!note) return [];
  const sponsorships = await db.sponsorship.findMany({
    where: {
      status: { not: "CANCELLED" },
      ...(note.angelId ? { angelId: note.angelId } : { angel: { applicationId: note.applicationId } }),
    },
    include: { sponsor: true, angel: { select: { number: true } } },
  });
  const byGiver = new Map<string, { sponsor: (typeof sponsorships)[number]["sponsor"]; angels: Set<number> }>();
  for (const s of sponsorships) {
    const entry = byGiver.get(s.sponsorId) ?? { sponsor: s.sponsor, angels: new Set<number>() };
    if (s.angel.number != null) entry.angels.add(s.angel.number);
    byGiver.set(s.sponsorId, entry);
  }
  return [...byGiver.values()];
}

/** Emails an approved note (with any edits already saved) to its sponsors. */
export async function deliverNote(noteId: string) {
  const note = await db.thankYouNote.findUnique({ where: { id: noteId }, select: { message: true, imageKey: true } });
  if (!note) return 0;
  const recipients = await noteRecipients(noteId);
  let sent = 0;
  for (const r of recipients) {
    const angels = [...r.angels].sort((a, b) => a - b).map((n) => `Angel #${n}`).join(" & ");
    const ok = await sendEmail({
      to: r.sponsor.email,
      subject: `A thank-you from ${angels}'s family 💌`,
      html: layout(`<p>Dear ${esc(r.sponsor.firstName)},</p>
<p>The family of <strong>${angels}</strong>, whom you sponsored this Christmas, wanted you to have this:</p>
<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #d9824a;background:#fcf2ea;font-size:16px;white-space:pre-line">${esc(note.message)}</blockquote>
${note.imageKey ? `<p><img src="${siteUrl(`/card/${note.imageKey}`)}" alt="Thank-you card" style="max-width:100%;border-radius:12px"/></p>` : ""}
<p>Thank you for being the hands and feet of Jesus to a child in ${esc(site.communities)}.</p>
${button(siteUrl("/account"), "View my giver profile")}`),
    });
    if (ok || !process.env.RESEND_API_KEY) sent++;
    await pause();
  }
  await db.thankYouNote.update({ where: { id: noteId }, data: { status: "SENT", sentAt: new Date(), sentCount: sent } });
  return sent;
}
