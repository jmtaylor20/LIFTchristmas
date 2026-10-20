import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { seasonStats } from "@/lib/stats";
import { formatDate, formatDateShort, money } from "@/lib/format";
import { AdminTitle, Stat } from "@/components/admin";
import { ProgressBar } from "@/components/ui";

export const metadata = { title: "Admin" };

export default async function Dashboard() {
  const season = await getAdminSeason();
  if (!season) return null;
  const s = await seasonStats(season.id);
  const [recentSponsorships, recentDonations, pendingApps] = await Promise.all([
    db.sponsorship.findMany({
      where: { seasonId: season.id },
      include: { sponsor: true, angel: true, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.donation.findMany({ where: { seasonId: season.id, status: "PAID" }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.application.findMany({ where: { seasonId: season.id, status: "PENDING" }, include: { household: true, _count: { select: { angels: true } } }, orderBy: { createdAt: "asc" }, take: 6 }),
  ]);
  const totalItems = s.items.NEEDED + s.items.CLAIMED + s.items.RECEIVED + s.items.MINISTRY;
  const deadlines = [
    ["Applications close", season.applicationDeadline],
    ["Wish lists due", season.wishlistDeadline],
    ["Gifts & money due", season.giftDeadline],
  ] as const;

  return (
    <>
      <AdminTitle title={`Christmas ${season.year}`}>
        <Link href="/admin/export/angels" className="btn-outline btn-sm">Export angels (CSV)</Link>
        <Link href="/admin/export/sponsors" className="btn-outline btn-sm">Export givers (CSV)</Link>
      </AdminTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Applications to review" value={s.applications.pending} tone={s.applications.pending ? "red" : "default"} sub={`${s.applications.total} total · ${s.applications.approved} approved`} />
        <Stat label="Angels" value={s.angels.total} sub={`${s.angels.noList} still need a wish list`} />
        <Stat label="Money raised" value={money(s.raisedCents)} tone="green" sub={`${s.donationCount} gifts · balance ${money(s.fundBalanceCents)}`} />
        <Stat label="Still needed" value={money(s.neededCents)} tone="red" sub={`${s.items.NEEDED} items without a sponsor`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <h2 className="text-xl font-bold">Angel coverage</h2>
          <ProgressBar value={s.angels.fullyCovered} max={s.angels.total - s.angels.noList} className="mt-3" />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Mini label="Fully covered" value={s.angels.fullyCovered} href="/admin/angels?coverage=full" />
            <Mini label="Partly covered" value={s.angels.partlyCovered} href="/admin/angels?coverage=partial" />
            <Mini label="No sponsor yet" value={s.angels.notCovered} href="/admin/angels?coverage=none" />
            <Mini label="No list yet" value={s.angels.noList} href="/admin/angels?coverage=nolist" />
          </div>
          <h3 className="mt-6 text-sm font-semibold text-black/60 uppercase">Gift items ({totalItems})</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Mini label="Needed" value={s.items.NEEDED} />
            <Mini label="Committed" value={s.items.CLAIMED} />
            <Mini label="Received" value={s.items.RECEIVED} />
            <Mini label="Ministry buying" value={s.items.MINISTRY} />
          </div>
          <p className="mt-4 text-xs text-black/55">
            Ministry purchases: {money(s.ministrySpentCents)} spent{s.ministryPlannedCents > 0 && <>, about {money(s.ministryPlannedCents)} more planned</>}.
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold">Deadlines</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {deadlines.map(([label, d]) => (
              <li key={label} className="flex justify-between gap-3">
                <span className="text-black/60">{label}</span>
                <span className={d && d < new Date() ? "text-black/40 line-through" : "font-semibold"}>{d ? formatDate(d) : "Not set"}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/seasons" className="mt-4 inline-block text-sm font-semibold text-copper-700">Edit deadlines →</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Feed title="Waiting for review" href="/admin/applications?status=PENDING">
          {pendingApps.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/applications/${a.id}`}>{a.household.parentFirstName} {a.household.parentLastName}</Link>
              <span className="text-black/50"> · {a._count.angels} kids · {formatDateShort(a.createdAt)}</span>
            </li>
          ))}
        </Feed>
        <Feed title="Latest sponsorships" href="/admin/sponsors">
          {recentSponsorships.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/sponsors/${r.sponsorId}`}>{r.sponsor.firstName} {r.sponsor.lastName}</Link>
              <span className="text-black/50"> → <Link href={`/admin/angels/${r.angelId}`}>Angel #{r.angel.number}</Link> ({r.type === "FULL" ? "whole list" : `${r._count.items} items`})</span>
            </li>
          ))}
        </Feed>
        <Feed title="Latest donations" href="/admin/donations">
          {recentDonations.map((d) => (
            <li key={d.id}>
              <strong>{money(d.amountCents)}</strong> <span className="text-black/50">from {d.donorName} · {formatDateShort(d.createdAt)}</span>
            </li>
          ))}
        </Feed>
      </div>
    </>
  );
}

function Mini({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <p className="font-display text-2xl font-bold text-dusk-800">{value}</p>
      <p className="text-xs text-black/55">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-xl bg-cream p-3 no-underline hover:bg-dusk-50">{inner}</Link>
  ) : (
    <div className="rounded-xl bg-cream p-3">{inner}</div>
  );
}

function Feed({ title, href, children }: { title: string; href: string; children: React.ReactNode[] }) {
  return (
    <div className="card">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="text-sm text-copper-700">All →</Link>
      </div>
      {children.length === 0 ? <p className="mt-3 text-sm text-black/50">Nothing yet.</p> : <ul className="mt-3 space-y-2 text-sm">{children}</ul>}
    </div>
  );
}
