import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { sendListReminders, sendSponsorReminders } from "@/lib/reminders";
import { getActiveSeason } from "@/lib/season";
import { inSeasonThanksWindow, sendSeasonThanks } from "@/lib/thanks";

// Runs daily (netlify/functions/daily-reminders.mts). Emails families whose
// wish lists are due soon and sponsors whose gifts are due soon, once each.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const families = await sendListReminders();
  const sponsors = await sendSponsorReminders();
  // After Christmas, thank every giver for the season (a batch per run until everyone has it).
  const season = await getActiveSeason();
  const seasonThanks = season && inSeasonThanksWindow(season.year) ? await sendSeasonThanks(season.id) : null;
  return NextResponse.json({ families, sponsors, seasonThanks });
}
