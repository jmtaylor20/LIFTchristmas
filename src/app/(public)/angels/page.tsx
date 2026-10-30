import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { publicAngelWhere, shuffled } from "@/lib/angels";
import { ageText, formatDate, genderLabel, money } from "@/lib/format";
import { PageHero, ProgressBar } from "@/components/ui";
import { cleanHandle, venmoPayUrl } from "@/lib/venmo";
import { Star } from "@/components/SiteChrome";

export const metadata = { title: "Angel Tree" };
export const dynamic = "force-dynamic";

type Search = { gender?: string; age?: string; view?: string };

export default async function AngelTree({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const season = await getActiveSeason();
  const open = sponsoringIsOpen(season);

  const ageRanges: Record<string, [number, number]> = { "0-4": [0, 4], "5-8": [5, 8], "9-12": [9, 12], "13-17": [13, 17] };
  const range = sp.age ? ageRanges[sp.age] : undefined;

  const angels = season
    ? await db.angel.findMany({
        where: {
          ...publicAngelWhere(season.id),
          ...(sp.gender === "GIRL" || sp.gender === "BOY" ? { gender: sp.gender } : {}),
          ...(range ? { ageAtSeason: { gte: range[0], lte: range[1] } } : {}),
        },
        include: { items: { select: { status: true, estPriceCents: true } } },
        orderBy: { number: "asc" },
      })
    : [];

  // Shuffled on every visit so no angel is always first; angels still needing
  // gifts stay ahead of the ones that are fully covered.
  const cards = shuffled(angels)
    .map((a) => {
      const open = a.items.filter((i) => i.status === "NEEDED");
      return {
        ...a,
        openCount: open.length,
        openCents: open.reduce((s, i) => s + (i.estPriceCents ?? 0), 0),
        untouched: open.length === a.items.length,
      };
    })
    .filter((a) => (sp.view === "whole" ? a.untouched && a.openCount > 0 : true))
    .sort((a, b) => Number(b.openCount > 0) - Number(a.openCount > 0));

  const qs = (patch: Partial<Search>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `/angels?${s}` : "/angels";
  };

  return (
    <>
      <PageHero eyebrow={`Christmas ${season?.year ?? ""}`} title="The Angel Tree">
        <p>
          Each angel is a child in our community. Sponsor a whole wish list, or choose just a few items. Names are kept private.
        </p>
        {season?.giftDeadline && open && (
          <p className="mt-2 text-base">Gifts are due by <strong>{formatDate(season.giftDeadline)}</strong>.</p>
        )}
        {season?.venmoHandle && (
          <p className="mt-2 text-sm">
            Rather give money? Send any amount on Venmo to{" "}
            <a href={venmoPayUrl(season.venmoHandle, null, "LIFT Community Christmas")} target="_blank" rel="noopener noreferrer" className="font-semibold">
              @{cleanHandle(season.venmoHandle)}
            </a>{" "}
            or see <Link href="/donate" className="font-semibold">other ways to give</Link>.
          </p>
        )}
      </PageHero>

      <section className="container-page mt-8">
        {!open && season && (
          <div className="card mb-6 text-center">
            Sponsorships for Christmas {season.year} are closed. Thank you to everyone who gave!
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterLink href={qs({ view: undefined })} active={!sp.view}>All angels</FilterLink>
          <FilterLink href={qs({ view: "whole" })} active={sp.view === "whole"}>Whole list available</FilterLink>
          <span className="mx-2 h-5 w-px bg-black/10" />
          <FilterLink href={qs({ gender: undefined })} active={!sp.gender}>All</FilterLink>
          <FilterLink href={qs({ gender: "GIRL" })} active={sp.gender === "GIRL"}>Girls</FilterLink>
          <FilterLink href={qs({ gender: "BOY" })} active={sp.gender === "BOY"}>Boys</FilterLink>
          <span className="mx-2 h-5 w-px bg-black/10" />
          <FilterLink href={qs({ age: undefined })} active={!sp.age}>Any age</FilterLink>
          {Object.keys(ageRanges).map((r) => (
            <FilterLink key={r} href={qs({ age: r })} active={sp.age === r}>Ages {r}</FilterLink>
          ))}
          <Link href="/angels/items" className="ml-auto font-semibold text-star-700">Shop gifts by price →</Link>
        </div>

        {cards.length === 0 ? (
          <div className="card mt-6 text-center text-black/60">
            {season ? "No angels match right now. Check back soon; new angels are added as families finish their lists." : "The Angel Tree opens soon."}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((a) => (
              <Link key={a.id} href={`/angels/${a.number}`} className="card group flex flex-col no-underline transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className={`badge ${a.gender === "GIRL" ? "bg-star-50 text-star-700" : "bg-dusk-50 text-dusk-700"}`}>
                    {genderLabel(a.gender)} · {ageText(a.ageAtSeason)}
                  </span>
                  <Star className="h-5 w-5 text-gold-500" />
                </div>
                <h2 className="mt-3 text-2xl">Angel #{a.number}</h2>
                {a.interests && <p className="mt-1 line-clamp-2 text-sm text-black/60">Loves {a.interests}</p>}
                <div className="mt-auto pt-5">
                  {a.openCount === 0 ? (
                    <p className="text-sm font-semibold text-dusk-700">✓ Fully sponsored. Thank you!</p>
                  ) : (
                    <>
                      <ProgressBar value={a.items.length - a.openCount} max={a.items.length} />
                      <p className="mt-2 text-sm text-black/65">
                        {a.openCount} of {a.items.length} gifts still needed
                        {a.openCents > 0 && <> · about {money(a.openCents)}</>}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-star-700 group-hover:underline">
                        {a.untouched ? "Sponsor this angel →" : "Help finish this list →"}
                      </p>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 no-underline ${active ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/10 hover:bg-dusk-50"}`}
    >
      {children}
    </Link>
  );
}
