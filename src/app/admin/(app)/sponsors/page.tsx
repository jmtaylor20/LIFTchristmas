import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { money } from "@/lib/format";
import { AdminTitle, Empty } from "@/components/admin";

export const metadata = { title: "Givers" };

export default async function Sponsors({ searchParams }: { searchParams: Promise<{ q?: string; scope?: string }> }) {
  const { q, scope } = await searchParams;
  const season = (await getAdminSeason())!;
  const thisSeason = scope !== "all";
  const givers = await db.sponsor.findMany({
    where: {
      ...(q ? { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { organization: { contains: q, mode: "insensitive" } }] } : {}),
      ...(thisSeason
        ? { OR: [{ sponsorships: { some: { seasonId: season.id } } }, { donations: { some: { seasonId: season.id, status: "PAID" } } }, { inKindGifts: { some: { seasonId: season.id } } }] }
        : {}),
    },
    include: {
      sponsorships: { where: { status: { not: "CANCELLED" } }, select: { seasonId: true, angelId: true, season: { select: { year: true } }, _count: { select: { items: true } } } },
      donations: { where: { status: "PAID" }, select: { seasonId: true, amountCents: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <>
      <AdminTitle title="Givers">
        <Link href="/admin/export/sponsors" className="btn-outline btn-sm">Export CSV</Link>
      </AdminTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/admin/sponsors" className={`rounded-full px-3 py-1 no-underline ${thisSeason ? "bg-dusk-700 text-white" : "bg-white ring-1 ring-black/10"}`}>Christmas {season.year}</Link>
        <Link href="/admin/sponsors?scope=all" className={`rounded-full px-3 py-1 no-underline ${!thisSeason ? "bg-dusk-700 text-white" : "bg-white ring-1 ring-black/10"}`}>All years</Link>
        <form className="ml-auto">
          {!thisSeason && <input type="hidden" name="scope" value="all" />}
          <input name="q" defaultValue={q} placeholder="Search" className="input w-64" />
        </form>
      </div>
      {givers.length === 0 ? (
        <Empty>No givers yet.</Empty>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Angels {season.year}</th>
                <th>Items {season.year}</th>
                <th>Donated {season.year}</th>
                <th>Years sponsoring</th>
                <th>Lifetime donated</th>
              </tr>
            </thead>
            <tbody>
              {givers.map((g) => {
                const cur = g.sponsorships.filter((s) => s.seasonId === season.id);
                const years = [...new Set(g.sponsorships.map((s) => s.season.year))].sort();
                return (
                  <tr key={g.id}>
                    <td>
                      <Link href={`/admin/sponsors/${g.id}`} className="font-semibold">{g.firstName} {g.lastName}</Link>
                      {g.organization && <div className="text-xs text-black/50">{g.organization}</div>}
                    </td>
                    <td className="text-xs">{g.email}<br />{g.phone}</td>
                    <td>{new Set(cur.map((s) => s.angelId)).size || "—"}</td>
                    <td>{cur.reduce((n, s) => n + s._count.items, 0) || "—"}</td>
                    <td>{money(g.donations.filter((d) => d.seasonId === season.id).reduce((n, d) => n + d.amountCents, 0))}</td>
                    <td title={years.join(", ")}>{years.length} {years.length > 0 && <span className="text-xs text-black/45">({years.join(", ")})</span>}</td>
                    <td>{money(g.donations.reduce((n, d) => n + d.amountCents, 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
