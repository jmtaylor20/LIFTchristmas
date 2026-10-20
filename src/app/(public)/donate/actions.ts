"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { money, parseMoneyToCents, str } from "@/lib/format";
import { getActiveSeason } from "@/lib/season";
import { recognitionFields, upsertGiver } from "@/lib/givers";
import { button, esc, notifyAdmin, siteUrl } from "@/lib/email";

export type DonateState = { error?: string };

const methodWords = { VENMO: "Venmo", CHECK: "check", CASH: "cash" } as const;

/**
 * Records a gift the giver says they're sending by Venmo, check, or cash. It
 * stays "pending" until the ministry confirms it arrived, which sends the receipt.
 */
export async function reportGift(_prev: DonateState, fd: FormData): Promise<DonateState> {
  const season = await getActiveSeason();
  if (!season) return { error: "Giving isn't open right now." };
  const method = str(fd, "method") as keyof typeof methodWords;
  if (!(method in methodWords) || (method === "VENMO" && !season.venmoHandle)) return { error: "Please choose how you'd like to give." };
  const amountCents = parseMoneyToCents(fd.get("amount"));
  if (!amountCents || amountCents < 100) return { error: "Please enter an amount of at least $1." };
  if (amountCents > 5_000_000) return { error: "For large gifts please contact us directly." };
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter your name and email." };

  const venmoName = str(fd, "venmoName").slice(0, 80);
  const note = str(fd, "note").slice(0, 300);
  const giver = await upsertGiver({ firstName, lastName, email, ...recognitionFields(fd) });
  const donation = await db.donation.create({
    data: {
      seasonId: season.id,
      sponsorId: giver.id,
      donorName: `${firstName} ${lastName}`,
      donorEmail: email,
      amountCents,
      method,
      status: "PENDING",
      note: [venmoName && `Venmo: ${venmoName}`, note].filter(Boolean).join(" · ") || null,
    },
  });
  await notifyAdmin(
    `${methodWords[method]} gift reported: ${money(amountCents)}`,
    `<p>${esc(firstName)} ${esc(lastName)} (${esc(email)}) says they're giving <strong>${money(amountCents, { cents: true })}</strong> by ${methodWords[method]}${venmoName ? ` from <strong>${esc(venmoName)}</strong>` : ""}.</p><p>Once it arrives, mark it received to send their receipt.</p>${button(siteUrl("/admin/donations"), "Open Money & Gifts")}`,
  );
  redirect(`/donate/thanks?d=${donation.id}`);
}
