import Link from "next/link";
import { db } from "@/lib/db";
import { currentGiver } from "@/lib/auth";
import { formatDateShort, money } from "@/lib/format";
import { Notice, PageHero } from "@/components/ui";
import { createProfile, logout, requestLogin, saveTracking, updateProfile } from "./actions";
import { ShipTo } from "@/components/ShipTo";

export const metadata = { title: "My Giving", robots: { index: false } };
export const dynamic = "force-dynamic";

const itemStatus: Record<string, string> = {
  NEEDED: "Open",
  CLAIMED: "Committed",
  RECEIVED: "Received ✓",
  MINISTRY: "Covered by ministry",
};

export default async function Account({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  const giver = await currentGiver();

  if (!giver) {
    return (
      <>
        <PageHero eyebrow="My giving" title="Your giver profile">
          <p>See the angels you&rsquo;ve sponsored, your gifts and donations, and download your yearly giving statements.</p>
        </PageHero>
        <section className="container-page mt-10 max-w-4xl space-y-6">
          {sent && <Notice tone="success">Check your email! If we have a profile for that address, a sign-in link is on its way.</Notice>}
          {error === "expired" && <Notice tone="error">That sign-in link has expired or was already used. Please request a new one.</Notice>}
          {error === "missing" && <Notice tone="error">Please fill in your name and email.</Notice>}
          <div className="grid gap-6 md:grid-cols-2">
            <form action={requestLogin} className="card space-y-4">
              <h2 className="text-xl">Sign in</h2>
              <p className="text-sm text-black/60">Already given or sponsored? Your profile was created automatically. Enter the email you used.</p>
              <input name="email" type="email" required placeholder="Email" className="input" />
              <button className="btn-green">Email me a sign-in link</button>
            </form>
            <form action={createProfile} className="card space-y-3">
              <h2 className="text-xl">Create a profile</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="firstName" required placeholder="First name" className="input" />
                <input name="lastName" required placeholder="Last name" className="input" />
                <input name="email" type="email" required placeholder="Email" className="input sm:col-span-2" />
                <input name="phone" type="tel" placeholder="Phone (optional)" className="input" />
                <input name="organization" placeholder="Church / business (optional)" className="input" />
              </div>
              <button className="btn-primary">Create my profile</button>
            </form>
          </div>
        </section>
      </>
    );
  }

  const [sponsorships, donations, inKind, statements, notes] = await Promise.all([
    db.sponsorship.findMany({
      where: { sponsorId: giver.id, status: { not: "CANCELLED" } },
      include: { angel: true, items: true, season: true },
      orderBy: { createdAt: "desc" },
    }),
    db.donation.findMany({ where: { sponsorId: giver.id, status: "PAID" }, orderBy: { createdAt: "desc" } }),
    db.inKindGift.findMany({ where: { sponsorId: giver.id }, orderBy: { createdAt: "desc" } }),
    db.givingStatement.findMany({ where: { sponsorId: giver.id }, orderBy: { taxYear: "desc" } }),
    db.thankYouNote.findMany({
      where: {
        status: "SENT",
        OR: [
          { angel: { sponsorships: { some: { sponsorId: giver.id, status: { not: "CANCELLED" } } } } },
          { angelId: null, application: { angels: { some: { sponsorships: { some: { sponsorId: giver.id, status: { not: "CANCELLED" } } } } } } },
        ],
      },
      select: { id: true, message: true, imageKey: true, sentAt: true, angel: { select: { number: true } } },
      orderBy: { sentAt: "desc" },
    }),
  ]);

  const years = new Set<number>();
  sponsorships.forEach((s) => years.add(s.season.year));
  donations.forEach((d) => years.add((d.receivedAt ?? d.createdAt).getFullYear()));
  inKind.forEach((g) => years.add(g.createdAt.getFullYear()));
  statements.forEach((s) => years.add(s.taxYear));
  const taxYears = [...years].sort((a, b) => b - a);
  const seasonsServed = new Set(sponsorships.map((s) => s.season.year)).size;

  return (
    <>
      <PageHero eyebrow="My giving" title={`Merry Christmas, ${giver.firstName}!`}>
        {seasonsServed > 0 && (
          <p>
            Thank you for sponsoring angels {seasonsServed === 1 ? "this Christmas" : `for ${seasonsServed} Christmases`}.
          </p>
        )}
      </PageHero>
      <section className="container-page mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl">My angels</h2>
            {sponsorships.length === 0 ? (
              <p className="mt-2 text-sm text-black/60">
                No sponsorships yet. <Link href="/angels" className="font-semibold text-star-700">Visit the Angel Tree →</Link>
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {sponsorships.map((s) => (
                  <div key={s.id} className="rounded-xl border border-black/5 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold">
                        Angel #{s.angel.number} · {s.angel.gender === "GIRL" ? "Girl" : "Boy"}, age {s.angel.ageAtSeason}
                      </p>
                      <span className="text-sm text-black/55">Christmas {s.season.year}</span>
                    </div>
                    <p className="text-xs text-black/55">
                      Shirt {s.angel.shirtSize || "—"} · Pants {s.angel.pantsSize || "—"} · Shoes {s.angel.shoeSize || "—"}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {s.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3">
                          <span>
                            {i.name}
                            {i.details && <span className="text-black/50"> — {i.details}</span>}
                          </span>
                          <span className={i.status === "RECEIVED" ? "text-dusk-700" : "text-black/50"}>{itemStatus[i.status]}</span>
                        </li>
                      ))}
                    </ul>
                    {s.delivery === "SHIP" && s.status === "COMMITTED" && s.season.shippingAddress && (
                      <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                        <p className="text-xs font-semibold text-black/60 uppercase">Ship to</p>
                        <ShipTo angelNumber={s.angel.number} address={s.season.shippingAddress} />
                        <form action={saveTracking.bind(null, s.id)} className="flex gap-2">
                          <input name="trackingInfo" defaultValue={s.trackingInfo ?? ""} placeholder="Order or tracking number(s)" className="input" />
                          <button className="btn-outline btn-sm">Save</button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notes.length > 0 && (
            <div className="card bg-star-50/60">
              <h2 className="text-xl">💌 Thank-you notes</h2>
              <div className="mt-3 space-y-4">
                {notes.map((n) => (
                  <figure key={n.id} className="rounded-xl bg-white p-4">
                    <blockquote className="font-display text-lg whitespace-pre-line text-dusk-800">&ldquo;{n.message}&rdquo;</blockquote>
                    {n.imageKey && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/card/${n.imageKey}`} alt="Thank-you card" className="mt-3 max-h-72 rounded-lg" />
                    )}
                    <figcaption className="mt-2 text-xs text-black/55">
                      {n.angel ? `Angel #${n.angel.number}'s family` : "Your angel's family"} · {formatDateShort(n.sentAt)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-xl">Donations &amp; gifts</h2>
            {donations.length + inKind.length === 0 ? (
              <p className="mt-2 text-sm text-black/60">
                None yet. <Link href="/donate" className="font-semibold text-star-700">Make a gift →</Link>
              </p>
            ) : (
              <table className="table mt-3">
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id}>
                      <td>{formatDateShort(d.receivedAt ?? d.createdAt)}</td>
                      <td>Donation ({d.method.toLowerCase()})</td>
                      <td className="text-right font-semibold">{money(d.amountCents, { cents: true })}</td>
                    </tr>
                  ))}
                  {inKind.map((g) => (
                    <tr key={g.id}>
                      <td>{formatDateShort(g.createdAt)}</td>
                      <td>{g.description}</td>
                      <td className="text-right text-black/55">{g.receivedAt ? "Received ✓" : "On its way"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl">Giving statements</h2>
            <p className="mt-1 text-sm text-black/60">A record of your giving. Statements are emailed every January.</p>
            {taxYears.length === 0 ? (
              <p className="mt-3 text-sm text-black/50">Your first statement will appear here after you give.</p>
            ) : (
              <ul className="mt-3 divide-y divide-black/5">
                {taxYears.map((y) => (
                  <li key={y} className="flex items-center justify-between py-2">
                    <span className="font-medium">{y}</span>
                    <Link href={`/account/statements/${y}`} className="text-sm font-semibold text-star-700">View / print →</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form action={updateProfile} className="card space-y-3">
            <h2 className="text-xl">My info</h2>
            <div className="grid grid-cols-2 gap-3">
              <input name="firstName" defaultValue={giver.firstName} className="input" />
              <input name="lastName" defaultValue={giver.lastName} className="input" />
            </div>
            <input value={giver.email} disabled className="input bg-black/5" />
            <input name="phone" defaultValue={giver.phone ?? ""} placeholder="Phone" className="input" />
            <input name="organization" defaultValue={giver.organization ?? ""} placeholder="Church / business" className="input" />
            <div className="flex justify-between">
              <button className="btn-outline btn-sm">Save</button>
            </div>
          </form>
          <form action={logout}>
            <button className="text-sm text-black/50 underline">Sign out</button>
          </form>
        </div>
      </section>
    </>
  );
}
