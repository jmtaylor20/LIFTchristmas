import { db } from "@/lib/db";

// Serves a thank-you card photo. The key is random and only shared with the
// ministry and the note's sponsors, so emailed images load without signing in.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const note = await db.thankYouNote.findUnique({ where: { imageKey: key }, select: { imageData: true, imageType: true } });
  if (!note?.imageData) return new Response("Not found", { status: 404 });
  return new Response(note.imageData, {
    headers: {
      "Content-Type": note.imageType ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
