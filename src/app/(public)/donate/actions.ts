"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parseMoneyToCents, str } from "@/lib/format";
import { getActiveSeason } from "@/lib/season";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { upsertGiver } from "@/lib/givers";
import { siteUrl } from "@/lib/email";
import { site } from "@/content/site";

export type DonateState = { error?: string };

export async function startDonation(_prev: DonateState, fd: FormData): Promise<DonateState> {
  const season = await getActiveSeason();
  if (!season || !stripeEnabled()) return { error: "Online giving isn't available right now." };
  const amountCents = parseMoneyToCents(fd.get("amount"));
  if (!amountCents || amountCents < 500) return { error: "Please enter an amount of at least $5." };
  if (amountCents > 5_000_000) return { error: "For gifts over $50,000 please contact us directly." };
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter your name and email." };

  const giver = await upsertGiver({ firstName, lastName, email });
  const donation = await db.donation.create({
    data: {
      seasonId: season.id,
      sponsorId: giver.id,
      donorName: `${firstName} ${lastName}`,
      donorEmail: email,
      amountCents,
      method: "ONLINE",
      status: "PENDING",
      note: str(fd, "note").slice(0, 300) || null,
    },
  });

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    submit_type: "donate",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: `Gift to ${site.fullName}`, description: `Christmas ${season.year}` },
        },
      },
    ],
    metadata: { donationId: donation.id },
    success_url: siteUrl(`/donate/thanks?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: siteUrl("/donate?canceled=1"),
  });
  await db.donation.update({ where: { id: donation.id }, data: { stripeSessionId: session.id } });
  redirect(session.url!);
}
