import Link from "next/link";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminSeason } from "@/lib/season";
import { formatDateShort } from "@/lib/format";
import { AdminTitle, AppBadge, Empty } from "@/components/admin";

export const metadata = { title: "Applications" };

const statuses: ApplicationStatus[] = ["PENDING", "APPROVED", "WAITLIST", "DENIED"];

export default async function Applications({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const season = await requireAdminSeason();
  const status = statuses.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  // Pending applications the automatic check flagged for the owner.
  const flagged = sp.status === "FLAGGED";
  const q = sp.q?.trim();

  const apps = await db.application.findMany({
    where: {
      seasonId: season.id,
      ...(status ? { status } : {}),
      ...(flagged ? { status: "PENDING" as const, reviewFlags: { isEmpty: false } } : {}),
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
  const flaggedCount = await db.application.count({ where: { seasonId: season.id, status: "PENDING", reviewFlags: { isEmpty: false } } });

  return (
    <>
      <AdminTitle title="Applications">
        <Link href="/admin/applications/import" className="btn-outline btn-sm">Import from Google Form</Link>
        <Link href="/admin/export/applications" className="btn-outline btn-sm">Export CSV</Link>
      </AdminTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Tab href="/admin/applications" active={!status && !flagged}>All ({counts.reduce((n, c) => n + c._count, 0)})</Tab>
        {statuses.map((s) => (
          <Tab key={s} href={`/admin/applications?status=${s}`} active={status === s}>
            {s.charAt(0) + s.slice(1).toLowerCase()} ({counts.find((c) => c.status === s)?._count ?? 0})
          </Tab>
        ))}
        <Tab href="/admin/applications?status=FLAGGED" active={flagged}>⚑ Flagged ({flaggedCount})</Tab>
        <form className="ml-auto">
          {(status || flagged) && <input type="hidden" name="status" value={flagged ? "FLAGGED" : status} />}
          <input name="q" defaultValue={q} placeholder="Search name, phone, email" className="input w-full sm:w-64" />
        </form>
      </div>
      {apps.length === 0 ? (
        <Empty>No applications here yet.</Empty>
      ) : (
        <div className="rtable-wrap">
          <table className="table rtable">
            <thead>
              <tr>
                <th>Parent / guardian</th>
                <th>Community</th>
                <th>Kids</th>
                <th>Years approved</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Automatic check</th>
                <th>Lists</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const prior = a.household.applications.filter((x) => x.seasonId !== season.id).length + (a.household.priorYearsSponsored ?? 0);
                const atCap = prior >= season.approvalCapYears;
                return (
                  <tr key={a.id}>
                    <td data-label="Parent / guardian">
                      <Link href={`/admin/applications/${a.id}`} className="font-semibold">
                        {a.household.parentFirstName} {a.household.parentLastName}
                      </Link>
                      <div className="text-xs text-black/50">{a.household.phone}</div>
                    </td>
                    <td data-label="Community">{a.community}</td>
                    <td data-label="Kids">{a._count.angels}</td>
                    <td data-label="Years approved">
                      <span className={atCap ? "font-semibold text-star-700" : ""}>
                        {prior} prior
                        {a.household.priorYearsSponsored == null && a.priorHelp && " (not checked)"}
                        {atCap && " · at cap"}
                      </span>
                    </td>
                    <td data-label="Applied">{formatDateShort(a.createdAt)}</td>
                    <td data-label="Status"><AppBadge status={a.status} /></td>
                    <td data-label="Automatic check" className="text-xs">
                      {a.autoApprovedAt ? (
                        <span className="text-emerald-700">✓ Approved automatically</span>
                      ) : a.status === "PENDING" && a.missingInfo.length > 0 ? (
                        <span className="text-amber-700">Waiting on family for documents</span>
                      ) : a.status === "PENDING" && a.reviewFlags.length > 0 ? (
                        <span className="font-semibold text-star-700" title={a.reviewFlags.join("\n")}>
                          ⚑ {a.reviewFlags[0]}{a.reviewFlags.length > 1 && ` (+${a.reviewFlags.length - 1} more)`}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Lists" className="text-xs">{a.status === "APPROVED" ? (a.listSubmittedAt ? "✓ Submitted" : "Not yet") : ""}</td>
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
