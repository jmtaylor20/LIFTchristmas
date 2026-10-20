import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateShort, genderLabel } from "@/lib/format";
import { AdminTitle, AppBadge } from "@/components/admin";
import { saveHouseholdNotes } from "../../../actions";

export const metadata = { title: "Family" };

export default async function Family({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await db.household.findUnique({
    where: { id },
    include: {
      applications: { include: { season: true, _count: { select: { angels: true } } }, orderBy: { season: { year: "desc" } } },
      children: { include: { angels: { include: { season: true } } }, orderBy: { birthDate: "asc" } },
    },
  });
  if (!h) notFound();
  return (
    <>
      <AdminTitle title={`${h.parentFirstName} ${h.parentLastName}`}>
        <Link href="/admin/families" className="btn-outline btn-sm">← All families</Link>
      </AdminTitle>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="text-xl">Applications</h2>
          <table className="table mt-2">
            <tbody>
              {h.applications.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/applications/${a.id}`}>{a.season.year}</Link></td>
                  <td>{a._count.angels} children</td>
                  <td>{formatDateShort(a.createdAt)}</td>
                  <td><AppBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2 className="text-xl">Children</h2>
          <table className="table mt-2">
            <tbody>
              {h.children.map((c) => (
                <tr key={c.id}>
                  <td>{c.firstName} {c.lastName}</td>
                  <td className="text-xs">{genderLabel(c.gender)} · born {formatDate(c.birthDate, { timeZone: "UTC", month: "short" })}</td>
                  <td className="text-xs">Served: {c.angels.map((a) => a.season.year).sort().join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card text-sm">
          <p>{h.phone} · {h.email}</p>
          <p>{h.address}, {h.city} {h.zip}</p>
          <p className="mt-1 text-xs text-black/50">First applied {formatDate(h.createdAt)}</p>
        </div>
        <form action={saveHouseholdNotes.bind(null, h.id)} className="card space-y-2">
          <h2 className="text-lg">Private notes</h2>
          <textarea name="adminNotes" defaultValue={h.adminNotes ?? ""} className="input min-h-24" />
          <button className="btn-outline btn-sm">Save</button>
        </form>
      </div>
    </>
  );
}
