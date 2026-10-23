import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// A family's photo ID or income proof. Admins only; never cached.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const doc = await db.applicationDocument.findUnique({ where: { id }, select: { data: true, contentType: true, url: true } });
  if (!doc) return new Response("Not found", { status: 404 });
  if (!doc.data) return doc.url ? Response.redirect(doc.url, 302) : new Response("Not found", { status: 404 });
  return new Response(doc.data, {
    headers: {
      "Content-Type": doc.contentType ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; object-src 'self'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
