import Link from "next/link";
import { giversForYear } from "@/lib/givers";
import { db } from "@/lib/db";
import { formatDateShort, money } from "@/lib/format";
import { org } from "@/content/site";
import { AdminTitle, Empty } from "@/components/admin";
import { Notice } from "@/components/ui";
import { adminSendAllStatements, adminSendStatement } from "../../actions";

export const metadata = { title: "Giving statements" };

export default async function Statements({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; sent?: string; skipped?: string; failed?: string; remaining?: string; one?: string }>;
}) {
  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getFullYear();
  const givers = await giversForYear(year);
  const cash = await db.donation.groupBy({
    by: ["sponsorId"],
    where: { status: "PAID", sponsorId: { in: givers.map((g) => g.id) }, receivedAt: { gte: new Date(`${year}-01-01T00:00:00-06:00`), lt: new Date(`${year + 1}-01-01T00:00:00-06:00`) } },
    _sum: { amountCents: true },
  });
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  return (
    <>
      <AdminTitle title={`${year} giving statements`}>
        {years.map((y) => (
          <Link key={y} href={`/admin/statements?year=${y}`} className={y === year ? "btn-green btn-sm" : "btn-outline btn-sm"}>{y}</Link>
        ))}
      </AdminTitle>
      <div className="mb-4 space-y-3">
        <Notice>
          Statements go out <strong>automatically every January 15</strong> for the year before, to every giver who has not already
          received one. Each gift also gets a receipt as soon as you mark it received. You can preview, send early, or resend here.
        </Notice>
        {!org.taxExempt && (
          <Notice>
            Statements currently say {org.legalName} is not yet a 501(c)(3) and gifts are not tax-deductible. Once the IRS approves your
            status, set <code>ORG_TAX_EXEMPT=true</code> (and <code>ORG_EIN</code>) in Netlify and they&rsquo;ll switch to tax-receipt wording.
          </Notice>
        )}
        {sp.sent && (
          <Notice tone={Number(sp.remaining) > 0 ? "warn" : "success"}>
            Sent {sp.sent} statement(s). {Number(sp.skipped) > 0 && `${sp.skipped} already had one.`} {Number(sp.failed) > 0 && `${sp.failed} failed.`}{" "}
            {Number(sp.remaining) > 0 && <strong>{sp.remaining} still to send. Press the button again to send the next batch.</strong>}
          </Notice>
        )}
        {sp.one && <Notice tone={sp.one === "sent" ? "success" : "warn"}>{sp.one === "sent" ? "Statement sent." : sp.one === "empty" ? "Nothing to report for that year." : "Sending failed. Check the email settings."}</Notice>}
      </div>
      {givers.length === 0 ? (
        <Empty>No giving recorded for {year} yet.</Empty>
      ) : (
        <>
          <form action={adminSendAllStatements.bind(null, year)} className="card mb-4 flex flex-wrap items-center gap-4">
            <p className="text-sm">{givers.length} givers · {givers.filter((g) => g.statements.length).length} already sent</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="onlyUnsent" defaultChecked className="accent-dusk-700" /> Only givers who haven&rsquo;t received one</label>
            <button className="btn-primary btn-sm">Email {year} statements now</button>
          </form>
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Giver</th>
                  <th>Email</th>
                  <th className="text-right">Cash total</th>
                  <th>Sent</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {givers.map((g) => {
                  const st = g.statements[0];
                  return (
                    <tr key={g.id}>
                      <td><Link href={`/admin/statements/${g.id}/${year}`} className="font-semibold">{g.firstName} {g.lastName}</Link></td>
                      <td className="text-xs">{g.email}</td>
                      <td className="text-right">{money(cash.find((c) => c.sponsorId === g.id)?._sum.amountCents ?? 0, { cents: true })}</td>
                      <td className="text-xs">{st ? `${formatDateShort(st.sentAt)}${st.sendCount > 1 ? ` (${st.sendCount}×)` : ""}` : "—"}</td>
                      <td>
                        <form action={adminSendStatement.bind(null, g.id, year)}><button className="btn-outline btn-sm">{st ? "Resend" : "Send"}</button></form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
