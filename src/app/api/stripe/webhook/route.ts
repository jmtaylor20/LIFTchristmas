import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { confirmStripeSession } from "@/lib/donations";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await confirmStripeSession(event.data.object.id);
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    await db.donation.updateMany({
      where: { stripeSessionId: event.data.object.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }
  return NextResponse.json({ received: true });
}
