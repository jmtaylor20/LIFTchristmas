import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { publicAngelWhere } from "@/lib/angels";
import { currentGiver } from "@/lib/auth";
import { formatDate, genderLabel, money } from "@/lib/format";
import { Notice } from "@/components/ui";
import { Star } from "@/components/SiteChrome";
import { sponsorItems } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  return { title: `Angel #${(await params).number}` };
}

export default async function AngelPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ item?: string; error?: string }>;
}) {
  const { number } = await params;
  const { item: preselect, error } = await searchParams;
  const season = await getActiveSeason();
  const n = Number(number);
  if (!season || !Number.isInteger(n)) notFound();

  const angel = await db.angel.findFirst({
    where: { ...publicAngelWhere(season.id), number: n },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!angel) notFound();

  const giver = await currentGiver();
  const open = sponsoringIsOpen(season);
  const needed = angel.items.filter((i) => i.status === "NEEDED");
  const neededCents = needed.reduce((s, i) => s + (i.estPriceCents ?? 0), 0);
  const whole = needed.length === angel.items.length;

  return (
    <section className="container-page mt-10 max-w-4xl">
      <Link href="/angels" className="text-sm text-dusk-700">← Back to the Angel Tree</Link>
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <div className="card h-fit bg-gradient-to-b from-dusk-600 to-dusk-500 text-white">
          <Star className="h-8 w-8 text-star-500" />
          <h1 className="mt-3 text-4xl text-white">Angel #{angel.number}</h1>
          <p className="mt-1 text-white/80">{genderLabel(angel.gender)} · age {angel.ageAtSeason}</p>
          <dl className="mt-5 space-y-1 text-sm text-white/85">
            <Row k="Shirt" v={angel.shirtSize} />
            <Row k="Pants" v={angel.pantsSize} />
            <Row k="Shoes" v={angel.shoeSize} />
          </dl>
          {angel.interests && <p className="mt-4 text-sm text-white/85"><span className="text-gold-300">Loves:</span> {angel.interests}</p>}
          {needed.length > 0 && (
            <p className="mt-6 border-t border-white/15 pt-4 text-sm text-white/80">
              {needed.length} gift{needed.length === 1 ? "" : "s"} still needed{neededCents > 0 && <> · about {money(neededCents)}</>}
            </p>
          )}
        </div>

        <div className="card">
          {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
          <h2 className="text-2xl">Wish list</h2>
          {!open && <p className="mt-2 text-sm text-black/60">Sponsorships are closed for this season.</p>}

          {needed.length === 0 ? (
            <p className="mt-4 font-semibold text-dusk-700">✓ This angel&rsquo;s whole list has been sponsored. Thank you!</p>
          ) : null}

          <form action={sponsorItems} className="mt-4 space-y-5">
            <input type="hidden" name="angelId" value={angel.id} />
            <ul className="divide-y divide-black/5">
              {angel.items.map((i) => (
                <li key={i.id} className="flex items-start gap-3 py-2.5">
                  {i.status === "NEEDED" && open ? (
                    <input
                      type="checkbox"
                      name="itemId"
                      value={i.id}
                      defaultChecked={preselect ? preselect === i.id : false}
                      className="item-box mt-1 h-4 w-4 accent-star-700"
                    />
                  ) : (
                    <span className="mt-0.5 text-dusk-600">✓</span>
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${i.status !== "NEEDED" ? "text-black/40 line-through" : ""}`}>{i.name}</p>
                    <p className="text-xs text-black/55">
                      {i.details}
                      {i.url && i.status === "NEEDED" && (
                        <>
                          {i.details && " · "}
                          <a href={i.url} target="_blank" rel="noopener noreferrer nofollow">example ↗</a>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-black/60">{i.estPriceCents != null ? `~${money(i.estPriceCents)}` : ""}</span>
                </li>
              ))}
            </ul>

            {open && needed.length > 0 && (
              <>
                {whole && (
                  <label className="flex items-center gap-2 rounded-xl bg-star-50 px-4 py-3 text-sm font-semibold text-star-800">
                    <input type="checkbox" name="whole" value="1" className="h-4 w-4 accent-star-700" defaultChecked={!preselect} />
                    Sponsor Angel #{angel.number}&rsquo;s entire list
                  </label>
                )}
                <p className="text-xs text-black/55">
                  {whole ? "Or uncheck the box above and choose just the items you'd like to give." : "Choose the items you'd like to give."}
                </p>

                <div className="grid gap-3 border-t border-black/5 pt-5 sm:grid-cols-2">
                  <h3 className="text-lg sm:col-span-2">Your information</h3>
                  <input name="firstName" required placeholder="First name" defaultValue={giver?.firstName} className="input" />
                  <input name="lastName" required placeholder="Last name" defaultValue={giver?.lastName} className="input" />
                  <input name="email" type="email" required placeholder="Email" defaultValue={giver?.email} className="input" />
                  <input name="phone" type="tel" placeholder="Phone" defaultValue={giver?.phone ?? ""} className="input" />
                  <input name="organization" placeholder="Family, church, class, or business (optional)" defaultValue={giver?.organization ?? ""} className="input sm:col-span-2" />
                </div>
                <fieldset className="space-y-2 border-t border-black/5 pt-5">
                  <legend className="text-lg">How will you get the gifts to us?</legend>
                  <label className="flex items-start gap-2 text-sm">
                    <input type="radio" name="delivery" value="DROP_OFF" defaultChecked className="mt-1 accent-dusk-700" />
                    <span>I&rsquo;ll shop and drop the gifts off</span>
                  </label>
                  {season.shippingAddress && (
                    <label className="flex items-start gap-2 text-sm">
                      <input type="radio" name="delivery" value="SHIP" className="mt-1 accent-dusk-700" />
                      <span>
                        I&rsquo;ll order online (Amazon, Walmart, Target…) and ship to the ministry.
                        <span className="block text-xs text-black/55">We&rsquo;ll give you a ship-to label with Angel #{angel.number} on it.</span>
                      </span>
                    </label>
                  )}
                </fieldset>
                <button className="btn-primary w-full py-3 text-base">Sponsor these gifts</button>
                {season.giftDeadline && (
                  <p className="text-center text-xs text-black/55">Unwrapped gifts are due by {formatDate(season.giftDeadline)}.</p>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/60">{k}</dt>
      <dd>{v || "—"}</dd>
    </div>
  );
}
