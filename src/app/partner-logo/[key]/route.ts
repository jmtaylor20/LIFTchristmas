import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// Serves a business partner's logo. Public once the owner approves it; before
// that, only signed-in admins can see it (for review).
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const p = await db.corporatePartner.findUnique({
    where: { logoKey: key },
    select: { logoData: true, logoType: true, status: true },
  });
  if (!p?.logoData || (p.status !== "APPROVED" && !(await isAdmin()))) return new Response("Not found", { status: 404 });
  return new Response(p.logoData, {
    headers: {
      "Content-Type": p.logoType ?? "image/png",
      "Cache-Control": p.status === "APPROVED" ? "public, max-age=3600" : "private, no-store",
      // Uploaded SVGs are shown as images only; never let them run scripts.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
