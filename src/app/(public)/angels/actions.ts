"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ageText, genderLabel, str } from "@/lib/format";
import { getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { publicAngelWhere } from "@/lib/angels";
import { recognitionFields, upsertGiver } from "@/lib/givers";
import { button, esc, layout, notifyAdmin, sendEmail, siteUrl } from "@/lib/email";
import { formatDate, money } from "@/lib/format";
import { site } from "@/content/site";
import { shipToHtml } from "@/lib/shipping";

export async function sponsorItems(fd: FormData) {
  const season = await getActiveSeason();
  const angelId = str(fd, "angelId");
  const angel = season
    ? await db.angel.findFirst({ where: { ...publicAngelWhere(season.id), id: angelId }, include: { items: true } })
    : null;
  if (!season || !angel) redirect("/angels");
  const back = (msg: string): never => redirect(`/angels/${angel.number}?error=${encodeURIComponent(msg)}`);
  if (!sponsoringIsOpen(season)) return back("Sponsorships are closed for this season.");

  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) return back("Please enter your name and a valid email.");

  const neededIds = angel.items.filter((i) => i.status === "NEEDED").map((i) => i.id);
  const wantsWhole = fd.get("whole") === "1";
  const chosen = wantsWhole ? neededIds : fd.getAll("itemId").map(String).filter((id) => neededIds.includes(id));
  if (chosen.length === 0) return back("Please choose at least one gift.");

  const giver = await upsertGiver({
    firstName,
    lastName,
    email,
    phone: str(fd, "phone") || null,
    organization: str(fd, "organization") || null,
    ...recognitionFields(fd),
  });

  const isFull = chosen.length === angel.items.length;
  const delivery = fd.get("delivery") === "SHIP" && season.shippingAddress ? "SHIP" : "DROP_OFF";
  const sponsorship = await db.$transaction(async (tx) => {
    const s = await tx.sponsorship.create({
      data: { seasonId: season.id, sponsorId: giver.id, angelId: angel.id, type: isFull ? "FULL" : "PARTIAL", delivery },
    });
    // Only claim items still open, so two people can't take the same gift.
    const res = await tx.wishItem.updateMany({
      where: { id: { in: chosen }, angelId: angel.id, status: "NEEDED" },
      data: { status: "CLAIMED", sponsorshipId: s.id },
    });
    if (res.count !== chosen.length) throw new Error("TAKEN");
    return s;
  }).catch((e: Error) => {
    if (e.message === "TAKEN") return null;
    throw e;
  });
  if (!sponsorship) return back("Someone just chose one of those gifts. Please review the list and try again.");

  const items = angel.items.filter((i) => chosen.includes(i.id));
  const list = items
    .map((i) => `<li><strong>${esc(i.name)}</strong>${i.details ? ` &mdash; ${esc(i.details)}` : ""}${i.estPriceCents ? ` (about ${money(i.estPriceCents)})` : ""}</li>`)
    .join("");
  await sendEmail({
    to: email,
    subject: `Thank you for sponsoring Angel #${angel.number}!`,
    html: layout(`<p>Dear ${esc(firstName)},</p>
<p>Thank you for sponsoring <strong>Angel #${angel.number}</strong> (${genderLabel(angel.gender).toLowerCase()}, ${ageText(angel.ageAtSeason)})! Here's what you've committed to give:</p>
<ul>${list}</ul>
<p>Sizes: shirt ${esc(angel.shirtSize) || "—"}, pants ${esc(angel.pantsSize) || "—"}, shoes ${esc(angel.shoeSize) || "—"}.</p>
${
    delivery === "SHIP"
      ? `<p><strong>Please have your order arrive${season.giftDeadline ? ` by ${formatDate(season.giftDeadline)}` : " soon"}</strong>, shipped to:</p>${shipToHtml(angel.number, season.shippingAddress!)}
<p>Once you've ordered, you can add your order or tracking number in your giver profile so we can watch for it.</p>`
      : `<p><strong>Please bring gifts unwrapped${season.giftDeadline ? ` by ${formatDate(season.giftDeadline)}` : ""}</strong>, labeled &ldquo;Angel #${angel.number}&rdquo;.</p>
${season.dropOffInstructions ? `<p>${esc(season.dropOffInstructions).replace(/\n/g, "<br/>")}</p>` : ""}`
  }
${button(siteUrl("/account"), "View my giver profile")}
<p>&ldquo;${esc(site.giveVerse.text)}&rdquo; &mdash; ${esc(site.giveVerse.ref)}</p>`),
  });
  await notifyAdmin(
    `Angel #${angel.number} ${isFull ? "fully" : "partly"} sponsored`,
    `<p>${esc(firstName)} ${esc(lastName)} (${esc(email)}) committed to ${items.length} gift(s) for Angel #${angel.number}${delivery === "SHIP" ? " and will ship them" : ""}.</p><ul>${list}</ul>`,
  );
  redirect(`/angels/thanks?s=${sponsorship.id}`);
}
