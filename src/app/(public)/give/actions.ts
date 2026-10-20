"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { str } from "@/lib/format";
import { upsertGiver } from "@/lib/givers";
import { getActiveSeason } from "@/lib/season";
import { esc, notifyAdmin } from "@/lib/email";

export async function logAmazonGift(fd: FormData) {
  const season = await getActiveSeason();
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  const description = str(fd, "description").slice(0, 1000);
  if (!season || !firstName || !lastName || !email.includes("@") || !description) redirect("/give#amazon");

  const giver = await upsertGiver({ firstName, lastName, email });
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
