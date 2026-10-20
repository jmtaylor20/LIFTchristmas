import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { getActiveSeason } from "@/lib/season";
import { inSeasonThanksWindow, sendSeasonThanks } from "@/lib/thanks";

// Runs hourly December 27–31 (netlify/functions/season-thanks.mts): thanks the
// next batch of this season's givers for Community Christmas.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const season = await getActiveSeason();
  if (!season || !inSeasonThanksWindow(season.year)) return NextResponse.json({ skipped: true });
  return NextResponse.json(await sendSeasonThanks(season.id));
}
