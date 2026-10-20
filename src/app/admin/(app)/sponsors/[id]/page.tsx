import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateShort, money } from "@/lib/format";
import { AdminTitle, ItemBadge } from "@/components/admin";
import { adminSendStatement, receiveSponsorship, saveSponsorNotes } from "../../../actions";

export const metadata = { title: "Giver" };

export default async function SponsorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await db.sponsor.findUnique({
    where: { id },
    include: {
      sponsorships: { include: { season: true, angel: true, items: true }, orderBy: { createdAt: "desc" } },
      donations: { include: { season: true }, orderBy: { createdAt: "desc" } },
      inKindGifts: { orderBy: { createdAt: "desc" } },
      statements: { orderBy: { taxYear: "desc" } },
    },
  });
  if (!g) notFound();
  const years = [...new Set(g.sponsorships.filter((s) => s.status !== "CANCELLED").map((s) => s.season.year))].sort();
  const taxYears = [...new Set([...g.donations.filter((d) => d.receivedAt).map((d) => d.receivedAt!.getFullYear()), ...g.sponsorships.map((s) => s.season.year)])].sort((a, b) => b - a);

  return (
    <>
      <AdminTitle title={`${g.firstName} ${g.lastName}`}>
        <Link href="/admin/sponsors" className="btn-outline btn-sm">← All givers</Link>
      </AdminTitle>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl">Sponsorships</h2>
            <p className="text-sm text-black/55">Sponsored {years.length} Christmas{years.length === 1 ? "" : "es"}{years.length > 0 && `: ${years.join(", ")}`}</p>
            <div className="mt-3 space-y-3">
              {g.sponsorships.map((s) => (
                <div key={s.id} className={`rounded-xl border border-black/5 p-3 ${s.status === "CANCELLED" ? "opacity-50" : ""}`}>
                  <div className="flex justify-between text-sm">
                    <Link href={`/admin/angels/${s.angelId}`} className="font-semibold">Angel #{s.angel.number} ({s.season.year})</Link>
                    <span className="text-black/50">{s.type === "FULL" ? "Whole list" : "Some items"} · {s.delivery === "SHIP" ? "shipping" : "drop-off"} · {s.status.toLowerCase()}</span>
                  </div>
                  {s.trackingInfo && <p className="text-xs text-black/60">Tracking: {s.trackingInfo}</p>}
                  <ul className="mt-2 space-y-1 text-sm">
                    {s.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-2">{i.name}<ItemBadge status={i.status} /></li>
                    ))}
                  </ul>
                  {s.status === "COMMITTED" && (
                    <form action={receiveSponsorship.bind(null, s.id)} className="mt-2">
                      <button className="btn-green btn-sm">Gifts dropped off: mark all received</button>
                    </form>
                  )}
                </div>
              ))}
              {g.sponsorships.length === 0 && <p className="text-sm text-black/50">None.</p>}
            </div>
          </div>
          <div className="card">
            <h2 className="text-xl">Donations &amp; in-kind gifts</h2>
            <table className="table mt-2">
              <tbody>
                {g.donations.map((d) => (
                  <tr key={d.id}>
                    <td>{formatDateShort(d.receivedAt ?? d.createdAt)}</td>
                    <td>{d.method.toLowerCase()} {d.status !== "PAID" && <span className="text-xs text-star-700">({d.status.toLowerCase()})</span>}</td>
                    <td className="text-right">{money(d.amountCents, { cents: true })}</td>
                  </tr>
                ))}
                {g.inKindGifts.map((k) => (
                  <tr key={k.id}>
                    <td>{formatDateShort(k.createdAt)}</td>
                    <td>{k.description}</td>
                    <td className="text-right text-xs">{k.receivedAt ? "Received" : "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card text-sm">
            <p>{g.email}</p>
            {g.phone && <p>{g.phone}</p>}
            {g.organization && <p>{g.organization}</p>}
            <p className="mt-2 text-xs text-black/50">Giver since {formatDateShort(g.createdAt)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg">Giving statements</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {taxYears.map((y) => {
                const sent = g.statements.find((s) => s.taxYear === y);
                return (
                  <li key={y} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/statements/${g.id}/${y}`}>{y}</Link>
                    <span className="text-xs text-black/50">{sent ? `sent ${formatDateShort(sent.sentAt)}` : "not sent"}</span>
                    <form action={adminSendStatement.bind(null, g.id, y)}><button className="btn-outline btn-sm">{sent ? "Resend" : "Send"}</button></form>
                  </li>
                );
              })}
            </ul>
          </div>
          <form action={saveSponsorNotes.bind(null, g.id)} className="card space-y-2">
            <h2 className="text-lg">Private notes</h2>
            <textarea name="adminNotes" defaultValue={g.adminNotes ?? ""} className="input min-h-24" />
            <button className="btn-outline btn-sm">Save notes</button>
          </form>
        </div>
      </div>
    </>
  );
}
