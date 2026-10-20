import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Quick check that the site can reach its database. Never includes credentials.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const seasons = await db.season.count();
    return NextResponse.json({ ok: true, database: "connected", seasons });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const message = (e.message ?? "unknown error").replace(/postgres(ql)?:\/\/[^\s"']+/gi, "[connection string]").slice(-300);
    return NextResponse.json({ ok: false, database: "error", code: e.code ?? null, message }, { status: 503 });
  }
}
