import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { publicAngelWhere } from "@/lib/angels";
import { ageText, genderLabel, money } from "@/lib/format";
import { PageHero } from "@/components/ui";

export const metadata = { title: "Gifts by price" };
export const dynamic = "force-dynamic";

const bands: Record<string, { label: string; min?: number; max?: number }> = {
  "25": { label: "Under $25", max: 2500 },
  "50": { label: "$25 – $50", min: 2500, max: 5000 },
  "100": { label: "$50 – $100", min: 5000, max: 10000 },
  more: { label: "$100+", min: 10000 },
};

export default async function ItemsByPrice({ searchParams }: { searchParams: Promise<{ price?: string }> }) {
  const { price } = await searchParams;
  const season = await getActiveSeason();
  const band = price ? bands[price] : undefined;
  const items =
    season && sponsoringIsOpen(season)
      ? await db.wishItem.findMany({
          where: {
            status: "NEEDED",
            angel: publicAngelWhere(season.id),
            ...(band
              ? { estPriceCents: { ...(band.min != null ? { gte: band.min } : {}), ...(band.max != null ? { lt: band.max } : {}) } }
              : {}),
          },
          include: { angel: { select: { number: true, gender: true, ageAtSeason: true } } },
          // Cheapest first; gifts without a price follow, by angel number.
          orderBy: [{ estPriceCents: { sort: "asc", nulls: "last" } }, { angel: { number: "asc" } }, { sortOrder: "asc" }],
          take: 300,
        })
      : [];

  return (
    <>
      <PageHero eyebrow="Pick a few gifts" title="Gifts for every budget">
        <p>Choose any item below to give it to that angel. You can add more items from the same list on the next page.</p>
      </PageHero>
      <section className="container-page mt-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/angels/items" className={chip(!price)}>Any price</Link>
          {Object.entries(bands).map(([k, b]) => (
            <Link key={k} href={`/angels/items?price=${k}`} className={chip(price === k)}>{b.label}</Link>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="card mt-6 text-center text-black/60">No open gifts in this range right now.</div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white">
            <ul className="divide-y divide-black/5">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-black/55">
                      Angel #{i.angel.number} · {genderLabel(i.angel.gender)}, {ageText(i.angel.ageAtSeason)}
                      {i.details && <> · {i.details}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {i.estPriceCents != null && <span className="font-semibold text-dusk-800">~{money(i.estPriceCents)}</span>}
                    <Link href={`/angels/${i.angel.number}?item=${i.id}`} className="btn-primary btn-sm">Give this</Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

function chip(active: boolean) {
  return `rounded-full px-3 py-1 no-underline ${active ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/10 hover:bg-dusk-50"}`;
}
