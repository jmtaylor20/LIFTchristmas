import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { genderLabel, money } from "@/lib/format";
import { AdminTitle, Empty } from "@/components/admin";
import { ProgressBar } from "@/components/ui";

export const metadata = { title: "Angels" };

export default async function AdminAngels({ searchParams }: { searchParams: Promise<{ coverage?: string }> }) {
  const { coverage } = await searchParams;
  const season = (await getAdminSeason())!;
  const angels = await db.angel.findMany({
    where: { seasonId: season.id, application: { status: "APPROVED" } },
    include: {
      child: true,
      application: { select: { listSubmittedAt: true, household: { select: { parentLastName: true } } } },
      items: { select: { status: true, estPriceCents: true } },
      sponsorships: { where: { status: { not: "CANCELLED" } }, include: { sponsor: true } },
    },
    orderBy: { number: "asc" },
  });

  const rows = angels
    .map((a) => {
      const needed = a.items.filter((i) => i.status === "NEEDED");
      const cov = a.items.length === 0 ? "nolist" : needed.length === 0 ? "full" : needed.length === a.items.length ? "none" : "partial";
      return { ...a, needed, cov, neededCents: needed.reduce((s, i) => s + (i.estPriceCents ?? 0), 0) };
    })
    .filter((a) => !coverage || a.cov === coverage);

  const tabs = [
    [undefined, "All"],
    ["none", "No sponsor yet"],
    ["partial", "Partly covered"],
    ["full", "Fully covered"],
    ["nolist", "No list yet"],
  ] as const;

  return (
    <>
      <AdminTitle title="Angels & wish lists">
        <Link href="/admin/tags" className="btn-outline btn-sm">Print gift tags</Link>
        <Link href="/admin/export/angels" className="btn-outline btn-sm">Export CSV</Link>
      </AdminTitle>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {tabs.map(([k, label]) => (
          <Link key={label} href={k ? `/admin/angels?coverage=${k}` : "/admin/angels"} className={`rounded-full px-3 py-1 no-underline ${coverage === k ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/10"}`}>
            {label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty>No angels here. Angels appear when applications are approved.</Empty>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Angel</th>
                <th>Child</th>
                <th>Gifts covered</th>
                <th>Still needed</th>
                <th>Sponsors</th>
                <th>Public</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/angels/${a.id}`} className="font-semibold">#{a.number}</Link></td>
                  <td>
                    {a.child.firstName} {a.child.lastName}
                    <div className="text-xs text-black/50">{genderLabel(a.gender)}, {a.ageAtSeason}</div>
                  </td>
                  <td className="min-w-40">
                    {a.items.length ? (
                      <>
                        <ProgressBar value={a.items.length - a.needed.length} max={a.items.length} />
                        <span className="text-xs text-black/55">{a.items.length - a.needed.length} of {a.items.length}</span>
                      </>
                    ) : (
                      <span className="text-xs text-black/45">No list yet</span>
                    )}
                  </td>
                  <td>{a.needed.length ? money(a.neededCents) : "—"}</td>
                  <td className="text-xs">
                    {a.sponsorships.map((s) => (
                      <div key={s.id}>
                        <Link href={`/admin/sponsors/${s.sponsorId}`}>{s.sponsor.firstName} {s.sponsor.lastName}</Link>
                        {s.type === "FULL" && " (whole list)"}
                      </div>
                    ))}
                  </td>
                  <td className="text-xs">{a.hidden ? "Hidden" : a.application.listSubmittedAt ? "✓" : "Waiting on list"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
