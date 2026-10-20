import Link from "next/link";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { formatDateShort } from "@/lib/format";
import { AdminTitle, AppBadge, Empty } from "@/components/admin";

export const metadata = { title: "Applications" };

const statuses: ApplicationStatus[] = ["PENDING", "APPROVED", "WAITLIST", "DENIED"];

export default async function Applications({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const season = (await getAdminSeason())!;
  const status = statuses.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const q = sp.q?.trim();

  const apps = await db.application.findMany({
    where: {
      seasonId: season.id,
      ...(status ? { status } : {}),
      ...(q
        ? {
            household: {
              OR: [
                { parentFirstName: { contains: q, mode: "insensitive" } },
                { parentLastName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      household: { include: { applications: { where: { status: "APPROVED" }, select: { seasonId: true } } } },
      _count: { select: { angels: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const counts = await db.application.groupBy({ by: ["status"], where: { seasonId: season.id }, _count: true });

  return (
    <>
      <AdminTitle title="Applications">
        <Link href="/admin/export/applications" className="btn-outline btn-sm">Export CSV</Link>
      </AdminTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Tab href="/admin/applications" active={!status}>All ({counts.reduce((n, c) => n + c._count, 0)})</Tab>
        {statuses.map((s) => (
          <Tab key={s} href={`/admin/applications?status=${s}`} active={status === s}>
            {s.charAt(0) + s.slice(1).toLowerCase()} ({counts.find((c) => c.status === s)?._count ?? 0})
          </Tab>
        ))}
        <form className="ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search name, phone, email" className="input w-64" />
        </form>
      </div>
      {apps.length === 0 ? (
        <Empty>No applications here yet.</Empty>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Parent / guardian</th>
                <th>Community</th>
                <th>Kids</th>
                <th>Years approved</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Lists</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const prior = a.household.applications.filter((x) => x.seasonId !== season.id).length;
                const atCap = prior >= season.approvalCapYears;
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/applications/${a.id}`} className="font-semibold">
                        {a.household.parentFirstName} {a.household.parentLastName}
                      </Link>
                      <div className="text-xs text-black/50">{a.household.phone}</div>
                    </td>
                    <td>{a.community}</td>
                    <td>{a._count.angels}</td>
                    <td>
                      <span className={atCap ? "font-semibold text-copper-700" : ""}>
                        {prior} prior
                        {atCap && " · at cap"}
                      </span>
                    </td>
                    <td>{formatDateShort(a.createdAt)}</td>
                    <td><AppBadge status={a.status} /></td>
                    <td className="text-xs">{a.status === "APPROVED" ? (a.listSubmittedAt ? "✓ Submitted" : "Not yet") : ""}</td>
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

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`rounded-full px-3 py-1 no-underline ${active ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/10"}`}>
      {children}
    </Link>
  );
}
