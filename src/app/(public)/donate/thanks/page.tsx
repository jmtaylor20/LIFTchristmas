import Link from "next/link";
import { PageHero } from "@/components/ui";
import { confirmStripeSession } from "@/lib/donations";
import { money } from "@/lib/format";
import { site } from "@/content/site";

export const metadata = { title: "Thank you!" };
export const dynamic = "force-dynamic";

export default async function DonateThanks({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const donation = session_id ? await confirmStripeSession(session_id).catch(() => null) : null;
  return (
    <>
      <PageHero eyebrow="Thank you" title="Thank you for your gift!">
        <p>&ldquo;{site.giveVerse.text}&rdquo; — {site.giveVerse.ref}</p>
      </PageHero>
      <section className="container-page mt-10 max-w-2xl">
        <div className="card space-y-3">
          {donation ? (
            <p>
              Your gift of <strong>{money(donation.amountCents, { cents: true })}</strong> was received. A receipt is on its way to{" "}
              {donation.donorEmail}.
            </p>
          ) : (
            <p>Your gift is being processed. A receipt will be emailed to you shortly.</p>
          )}
          <p className="text-sm text-black/60">
            Your year-end giving statement will be emailed in January. You can also find it under My Giving.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/account" className="btn-green">My giving</Link>
            <Link href="/angels" className="btn-outline">Visit the Angel Tree</Link>
          </div>
        </div>
      </section>
    </>
  );
}
