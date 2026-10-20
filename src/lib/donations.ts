import { db } from "./db";
import { stripe } from "./stripe";
import { sendDonationReceipt } from "./givers";

/** Marks a Stripe donation paid (idempotent) and sends its receipt. */
export async function confirmStripeSession(sessionId: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return null;
  const donation = await db.donation.findUnique({ where: { stripeSessionId: session.id } });
  if (!donation) return null;
  if (donation.status !== "PAID") {
    await db.donation.update({
      where: { id: donation.id },
      data: { status: "PAID", amountCents: session.amount_total ?? donation.amountCents },
    });
  }
  await sendDonationReceipt(donation.id);
  return db.donation.findUnique({ where: { id: donation.id } });
}
