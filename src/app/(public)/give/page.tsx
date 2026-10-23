import Link from "next/link";
import { site } from "@/content/site";
import { PageHero } from "@/components/ui";
import { Star } from "@/components/SiteChrome";
import { getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { formatDate, money } from "@/lib/format";
import { db } from "@/lib/db";
import { logAmazonGift } from "./actions";
import { RecognitionFields } from "@/components/RecognitionFields";
import { NeedsList } from "@/components/NeedsList";
import { seasonNeeds } from "@/lib/needs";

export const metadata = { title: "Give" };
export const dynamic = "force-dynamic";

export default async function Give({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string; needThanks?: string; needError?: string }>;
}) {
  const { logged, needThanks, needError } = await searchParams;
  const season = await getActiveSeason();
  const open = sponsoringIsOpen(season);
  const needs = season ? await seasonNeeds(season.id) : [];
  const cheapest = season
    ? await db.wishItem.findFirst({
        where: { status: "NEEDED", estPriceCents: { not: null }, angel: { seasonId: season.id, hidden: false, application: { status: "APPROVED", listSubmittedAt: { not: null } } } },
        orderBy: { estPriceCents: "asc" },
        select: { estPriceCents: true },
      })
    : null;

  return (
    <>
      <PageHero eyebrow="Give" title="Share the joy of Christmas">
        <p>
          &ldquo;{site.giveVerse.text}&rdquo; <span className="text-star-700">— {site.giveVerse.ref}</span>
        </p>
        {season?.giftDeadline && (
          <p className="mt-3 text-base">
            All gifts are due by <strong>{formatDate(season.giftDeadline)}</strong>.
          </p>
        )}
      </PageHero>

      <section className="container-page mt-12 space-y-6">
        <Option
          n={1}
          title="Sponsor an angel's whole Christmas"
          body={`Take on one child's complete wish list. It's perfect for families, small groups, Sunday school classes, and businesses.${season?.perChildBudgetCents ? ` We suggest around ${money(season.perChildBudgetCents)} per child.` : ""}`}
        >
          {open ? (
            <Link href="/angels?view=whole" className="btn-primary">Choose an angel</Link>
          ) : (
            <p className="text-sm text-black/60">Sponsorships are closed for this season.</p>
          )}
        </Option>

        <Option
          n={2}
          title="Pick a few gifts"
          body={`Can't cover a whole list? Choose one or more items from any angel's list${cheapest?.estPriceCents ? `, starting around ${money(cheapest.estPriceCents)}` : ""}. Every item matters.`}
        >
          {open ? (
            <Link href="/angels/items" className="btn-primary">Browse gifts by price</Link>
          ) : (
            <p className="text-sm text-black/60">Sponsorships are closed for this season.</p>
          )}
        </Option>

        <div id="amazon">
          <Option
            n={3}
            title={needs.length ? "Shop what the ministry needs" : "Shop our Amazon wish list"}
            body="Order from our Amazon list and it ships straight to the ministry. Tell us what you bought so we can thank you and include it on your giving record."
          >
            {needs.length > 0 && (
              <div id="needs" className="mb-5 scroll-mt-6">
                {needThanks && (
                  <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Thank you! We&rsquo;ve recorded your gift and will thank you when it arrives.
                  </p>
                )}
                <NeedsList needs={needs} open={open} errorFor={needError} />
              </div>
            )}
            {season?.amazonWishlistUrl ? (
              <a href={season.amazonWishlistUrl} target="_blank" rel="noopener noreferrer" className={needs.length ? "btn-outline" : "btn-primary"}>
                {needs.length ? "See our full Amazon wish list ↗" : "Open the Amazon wish list ↗"}
              </a>
            ) : (
              <p className="text-sm text-black/60">Our Amazon wish list is coming soon.</p>
            )}
            {logged ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Thank you! We&rsquo;ve recorded your Amazon gift.</p>
            ) : (
              season && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-dusk-700">
                    {needs.length ? "Bought something else from the wish list? Let us know →" : "Already ordered? Let us know →"}
                  </summary>
                  <form action={logAmazonGift} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input name="firstName" required placeholder="First name" className="input" />
                    <input name="lastName" required placeholder="Last name" className="input" />
                    <input name="email" type="email" required placeholder="Email" className="input sm:col-span-2" />
                    <textarea name="description" required placeholder="What did you order? (e.g. 2 pairs of size 10 sneakers)" className="input sm:col-span-2" />
                    <RecognitionFields className="sm:col-span-2" />
                    <button className="btn-green sm:col-span-2 sm:justify-self-start">Record my gift</button>
                  </form>
                </details>
              )
            )}
          </Option>
        </div>

        <Option
          n={4}
          title="Partner as a business"
          body="Businesses giving $100 or more are featured on our home page with their logo: Gold ($1,000+), Silver ($500+), or Bronze ($100+)."
        >
          <Link href="/partners" className="btn-primary">Become a Christmas partner</Link>
        </Option>

        <Option n={5} title="Give money" body="Gifts of any size help us buy the items no one has chosen yet, plus wrapping supplies, so every angel is covered.">
          <Link href="/donate" className="btn-primary">Donate</Link>
        </Option>

        {season?.dropOffInstructions && (
          <div className="card bg-dusk-50">
            <h3 className="text-lg">Dropping off gifts</h3>
            <p className="mt-2 whitespace-pre-line text-black/75">{season.dropOffInstructions}</p>
          </div>
        )}
      </section>
    </>
  );
}

function Option({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="card grid gap-4 sm:grid-cols-[auto_1fr]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-star-50 font-display text-xl font-semibold text-star-700">
        {n}
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-2xl">
          {title} <Star className="h-4 w-4 text-gold-500" />
        </h2>
        <p className="mt-2 max-w-2xl text-black/70">{body}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
