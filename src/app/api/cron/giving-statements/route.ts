import { NextResponse } from "next/server";
import { sendAllStatements } from "@/lib/givers";
import { safeEqual } from "@/lib/tokens";

// Runs every January 15 (see vercel.json): emails last year's giving statement
// to every giver who hasn't already received one.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear() - 1;
  const result = await sendAllStatements(year, { onlyIfUnsent: true });
  return NextResponse.json({ year, ...result });
}
