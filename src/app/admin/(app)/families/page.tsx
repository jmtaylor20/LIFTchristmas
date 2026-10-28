import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminSeason } from "@/lib/season";
import { AdminTitle, Empty } from "@/components/admin";

export const metadata = { title: "Family history" };

export default async function Families({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const season = await requireAdminSeason();
  const households = await db.household.findMany({
    where: q
      ? { OR: [{ parentFirstName: { contains: q, mode: "insensitive" } }, { parentLastName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" } }] }
      : {},
    include: {
      applications: { include: { season: { select: { year: true } } }, orderBy: { season: { year: "asc" } } },
      _count: { select: { children: true } },
    },
    orderBy: [{ parentLastName: "asc" }],
  });

  return (
    <>
      <AdminTitle title="Family history" />
      <p className="mb-4 max-w-2xl text-sm text-black/60">
        Every family that has ever applied. Families are matched year to year by phone number or email. The current cap is{" "}
        <strong>{season.approvalCapYears} approved years</strong>.
      </p>
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Search name, phone, email" className="input w-full sm:w-72" /></form>
      {households.length === 0 ? (
        <Empty>No families yet.</Empty>
      ) : (
        <div className="rtable-wrap">
          <table className="table rtable">
            <thead>
              <tr>
                <th>Family</th>
                <th>Children</th>
                <th>Years applied</th>
                <th>Years approved</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {households.map((h) => {
                const approved = h.applications.filter((a) => a.status === "APPROVED").map((a) => a.season.year);
                const before = h.priorYearsSponsored ?? 0;
                const remaining = Math.max(0, season.approvalCapYears - approved.length - before);
                return (
                  <tr key={h.id}>
                    <td data-label="Family">
                      <Link href={`/admin/families/${h.id}`} className="font-semibold">{h.parentLastName}, {h.parentFirstName}</Link>
                      <div className="text-xs text-black/50">{h.phone}</div>
                    </td>
                    <td data-label="Children">{h._count.children}</td>
                    <td data-label="Years applied" className="text-xs">{h.applications.map((a) => a.season.year).join(", ")}</td>
                    <td data-label="Years approved">{approved.length + before} <span className="text-xs text-black/45">{[before > 0 && `${before} before this website`, approved.length > 0 && approved.join(", ")].filter(Boolean).join(" · ")}</span></td>
                    <td data-label="Remaining" className={remaining === 0 ? "font-semibold text-star-700" : ""}>{remaining === 0 ? "At cap" : remaining}</td>
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
