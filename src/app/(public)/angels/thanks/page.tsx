import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import { PageHero } from "@/components/ui";
import { site } from "@/content/site";

export const metadata = { title: "Thank you!" };
export const dynamic = "force-dynamic";

export default async function SponsorThanks({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const sp = s
    ? await db.sponsorship.findUnique({ where: { id: s }, include: { angel: true, items: true, season: true, sponsor: true } })
    : null;
  if (!sp) notFound();
  return (
    <>
      <PageHero eyebrow="Thank you" title={`You're sponsoring Angel #${sp.angel.number}!`}>
        <p>&ldquo;{site.giveVerse.text}&rdquo; — {site.giveVerse.ref}</p>
      </PageHero>
      <section className="container-page mt-10 max-w-2xl space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold">Your gifts</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {sp.items.map((i) => (
              <li key={i.id}>
                <strong>{i.name}</strong>
                {i.details && <> — {i.details}</>}
                {i.estPriceCents != null && <span className="text-black/55"> (about {money(i.estPriceCents)})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-black/70">
            Sizes: shirt {sp.angel.shirtSize || "—"}, pants {sp.angel.pantsSize || "—"}, shoes {sp.angel.shoeSize || "—"}
          </p>
        </div>
        <div className="card bg-dusk-50">
          <h2 className="text-xl font-bold">What&rsquo;s next</h2>
          <p className="mt-2">
            Please bring gifts <strong>unwrapped</strong> and labeled &ldquo;Angel #{sp.angel.number}&rdquo;
            {sp.season.giftDeadline && <> by <strong>{formatDate(sp.season.giftDeadline)}</strong></>}.
          </p>
          {sp.season.dropOffInstructions && <p className="mt-2 whitespace-pre-line">{sp.season.dropOffInstructions}</p>}
          <p className="mt-2 text-sm text-black/60">We sent these details to {sp.sponsor.email}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/account" className="btn-green">My giver profile</Link>
          <Link href="/angels" className="btn-outline">Back to the Angel Tree</Link>
        </div>
      </section>
    </>
  );
}
