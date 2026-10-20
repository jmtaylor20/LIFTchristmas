"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { str } from "@/lib/format";
import { recognitionFields, upsertGiver } from "@/lib/givers";
import { getActiveSeason } from "@/lib/season";
import { esc, notifyAdmin } from "@/lib/email";

export async function logAmazonGift(fd: FormData) {
  const season = await getActiveSeason();
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  const description = str(fd, "description").slice(0, 1000);
  if (!season || !firstName || !lastName || !email.includes("@") || !description) redirect("/give#amazon");

  const giver = await upsertGiver({ firstName, lastName, email, ...recognitionFields(fd) });
  await db.inKindGift.create({
    data: {
      seasonId: season.id,
      sponsorId: giver.id,
      donorName: `${firstName} ${lastName}`,
      donorEmail: email,
      source: "AMAZON_WISHLIST",
      description,
    },
  });
  await notifyAdmin("Amazon wish list gift reported", `<p>${esc(firstName)} ${esc(lastName)} (${esc(email)}) ordered:</p><p>${esc(description)}</p>`);
  redirect("/give?logged=1#amazon");
}

/** A giver says they bought something from the Ministry Needs list. */
export async function reportNeedPurchase(needId: string, fd: FormData) {
  const season = await getActiveSeason();
  const need = season ? await db.needItem.findFirst({ where: { id: needId, seasonId: season.id, hidden: false } }) : null;
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  if (!season || !need) redirect("/give#needs");
  if (!firstName || !lastName || !email.includes("@")) redirect(`/give?needError=${needId}#need-${needId}`);
  const quantity = Math.max(1, Math.min(need.quantity, Number(str(fd, "quantity")) || 1));

  const giver = await upsertGiver({ firstName, lastName, email, ...recognitionFields(fd) });
  await db.inKindGift.create({
    data: {
      seasonId: season.id,
      sponsorId: giver.id,
      donorName: `${firstName} ${lastName}`,
      donorEmail: email,
      source: need.url?.includes("amazon.") || need.url?.includes("amzn.") ? "AMAZON_WISHLIST" : "DROP_OFF",
      description: quantity > 1 ? `${quantity} × ${need.name}` : need.name,
      estValueCents: need.priceCents != null ? need.priceCents * quantity : null,
      needItemId: need.id,
      quantity,
    },
  });
  await notifyAdmin(
    `Ministry need covered: ${need.name}`,
    `<p>${esc(firstName)} ${esc(lastName)} (${esc(email)}) bought <strong>${quantity} × ${esc(need.name)}</strong> from the Ministry Needs list.</p><p>Mark it received under Money &amp; Gifts when it arrives.</p>`,
  );
  revalidatePath("/give");
  redirect(`/give?needThanks=1#needs`);
}
