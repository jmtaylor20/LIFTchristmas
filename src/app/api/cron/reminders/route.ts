import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { sendListReminders, sendSponsorReminders } from "@/lib/reminders";

// Runs daily (netlify/functions/daily-reminders.mts). Emails families whose
// wish lists are due soon and sponsors whose gifts are due soon, once each.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const families = await sendListReminders();
  const sponsors = await sendSponsorReminders();
  return NextResponse.json({ families, sponsors });
}
