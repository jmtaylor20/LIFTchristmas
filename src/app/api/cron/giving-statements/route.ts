import { NextResponse } from "next/server";
import { sendAllStatements } from "@/lib/givers";
import { cronAuthorized } from "@/lib/cron";

// Runs hourly on January 15–17 (netlify/functions/giving-statements.mts). Each
// run emails the next small batch of last year's statements to givers who
// haven't received one, so large lists finish across several runs.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear() - 1;
  const result = await sendAllStatements(year, { onlyIfUnsent: true });
  return NextResponse.json({ year, ...result });
}
