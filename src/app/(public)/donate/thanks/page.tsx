import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHero } from "@/components/ui";
import { money } from "@/lib/format";
import { cleanHandle, venmoPayUrl } from "@/lib/venmo";
import { site } from "@/content/site";

export const metadata = { title: "Thank you!" };
export const dynamic = "force-dynamic";

export default async function DonateThanks({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const donation = d ? await db.donation.findUnique({ where: { id: d }, include: { season: true } }) : null;
  if (!donation) notFound();
  const amount = money(donation.amountCents, { cents: true });
  const handle = donation.season.venmoHandle ? cleanHandle(donation.season.venmoHandle) : null;
  const isVenmo = donation.method === "VENMO" && handle;

  return (
    <>
      <PageHero eyebrow={isVenmo ? "Almost done" : "Thank you"} title={isVenmo ? "Now send your gift in Venmo" : "Thank you for your gift!"}>
        <p>&ldquo;{site.giveVerse.text}&rdquo; — {site.giveVerse.ref}</p>
      </PageHero>
      <section className="container-page mt-10 max-w-2xl space-y-6">
        {isVenmo ? (
          <div className="card space-y-4 text-center">
            <p className="text-lg">
              Send <strong>{amount}</strong> to <strong>@{handle}</strong>
            </p>
            <a
              href={venmoPayUrl(handle, donation.amountCents, `LIFT Christmas gift from ${donation.donorName}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-8 py-3 text-base"
            >
              Open Venmo
            </a>
            <p className="text-sm text-black/60">On a computer? Open Venmo on your phone and search for <strong>@{handle}</strong>.</p>
          </div>
        ) : (
          <div className="card space-y-3">
            <p className="text-lg">
              We&rsquo;re expecting your gift of <strong>{amount}</strong> by {donation.method === "CHECK" ? "check" : "cash"}.
            </p>
            {donation.season.donationInstructions ? (
              <p className="whitespace-pre-line text-black/75">{donation.season.donationInstructions}</p>
            ) : (
              <p className="text-black/75">Please contact us at {site.contactEmail} for where to send or drop off your gift.</p>
            )}
          </div>
        )}
        <div className="card bg-dusk-50 text-sm">
          <p>
            As soon as your gift arrives, we&rsquo;ll email a receipt to <strong>{donation.donorEmail}</strong> and add it to your giving
            record.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/account" className="btn-green btn-sm">My giving</Link>
            <Link href="/angels" className="btn-outline btn-sm">Visit the Angel Tree</Link>
          </div>
        </div>
      </section>
    </>
  );
}
