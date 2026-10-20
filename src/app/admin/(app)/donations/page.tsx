import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { seasonStats } from "@/lib/stats";
import { formatDateShort, money, toDateInput } from "@/lib/format";
import { AdminTitle, Stat } from "@/components/admin";
import { Notice } from "@/components/ui";
import {
  confirmDonation,
  deleteDonation,
  deleteInKind,
  markDonationNotReceived,
  markInKindReceived,
  recordDonation,
  recordInKind,
  resendReceipt,
} from "../../actions";

export const metadata = { title: "Money & gifts" };

const methodLabel = { VENMO: "Venmo", CASH: "Cash", CHECK: "Check", OTHER: "Other" } as const;

export default async function Donations({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const season = (await getAdminSeason())!;
  const [stats, pending, donations, inKind] = await Promise.all([
    seasonStats(season.id),
    db.donation.findMany({ where: { seasonId: season.id, status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.donation.findMany({ where: { seasonId: season.id, status: { not: "PENDING" } }, orderBy: { createdAt: "desc" } }),
    db.inKindGift.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <AdminTitle title="Money & gifts" />
      {sp.saved && <div className="mb-4"><Notice tone="success">Saved.</Notice></div>}
      {sp.error && <div className="mb-4"><Notice tone="error">Please fill in the required fields.</Notice></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Money received" value={money(stats.raisedCents)} tone="green" sub={`${stats.donationCount} gifts${pending.length ? ` · ${pending.length} waiting to confirm` : ""}`} />
        <Stat label="Spent on gifts" value={money(stats.ministrySpentCents)} sub="Items marked Ministry buying" />
        <Stat label="Fund balance" value={money(stats.fundBalanceCents)} tone="gold" />
        <Stat label="Unsponsored gifts" value={money(stats.neededCents)} tone="red" sub={`${stats.items.NEEDED} items · ${money(stats.ministryPlannedCents)} more planned`} />
      </div>

      {pending.length > 0 && (
        <div className="card mt-6 border-amber-200 bg-amber-50/60">
          <h2 className="text-xl font-bold">Waiting to confirm ({pending.length})</h2>
          <p className="text-sm text-black/60">
            These givers said they sent a gift by Venmo, check, or cash. When it arrives, mark it received. That emails their receipt and adds it to
            the totals.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="table">
              <tbody>
                {pending.map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap">{formatDateShort(d.createdAt)}</td>
                    <td>
                      <a href={d.sponsorId ? `/admin/sponsors/${d.sponsorId}` : undefined}>{d.donorName}</a>
                      {d.note && <div className="text-xs text-black/55">{d.note}</div>}
                    </td>
                    <td className="text-xs">{methodLabel[d.method]}</td>
                    <td className="text-right font-semibold">{money(d.amountCents, { cents: true })}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <form action={confirmDonation.bind(null, d.id)}><button className="btn-green btn-sm">✓ Received</button></form>
                        <form action={markDonationNotReceived.bind(null, d.id)}><button className="btn-outline btn-sm">Never came</button></form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-x-auto">
          <h2 className="text-xl font-bold">Donations received</h2>
          <table className="table mt-2">
            <thead>
              <tr>
                <th>Date</th>
                <th>Giver</th>
                <th>Method</th>
                <th className="text-right">Amount</th>
                <th>Receipt</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className={d.status !== "PAID" ? "text-black/40" : ""}>
                  <td>{formatDateShort(d.receivedAt ?? d.createdAt)}</td>
                  <td>
                    {d.sponsorId ? <a href={`/admin/sponsors/${d.sponsorId}`}>{d.donorName}</a> : d.donorName}
                    {d.note && <div className="text-xs text-black/50">{d.note}</div>}
                  </td>
                  <td className="text-xs">
                    {methodLabel[d.method]}
                    {d.status === "NOT_RECEIVED" && " · never came"}
                  </td>
                  <td className="text-right font-semibold">{money(d.amountCents, { cents: true })}</td>
                  <td className="text-xs">
                    {d.receiptSentAt ? `sent ${formatDateShort(d.receiptSentAt)}` : d.donorEmail && d.status === "PAID" ? (
                      <form action={resendReceipt.bind(null, d.id)}><button className="text-copper-700 underline">send</button></form>
                    ) : "—"}
                  </td>
                  <td>
                    {d.status === "NOT_RECEIVED" && (
                      <form action={confirmDonation.bind(null, d.id)}><button className="text-xs text-dusk-700 underline">received after all</button></form>
                    )}
                    <form action={deleteDonation.bind(null, d.id)}><button className="text-xs text-black/40 hover:text-copper-700">delete</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {donations.length === 0 && <p className="mt-3 text-sm text-black/50">No donations yet.</p>}
        </div>

        <form action={recordDonation} className="card h-fit space-y-2">
          <h2 className="text-lg font-bold">Record money received</h2>
          <p className="text-xs text-black/55">For Venmo gifts nobody reported on the website, and for cash or checks.</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="firstName" placeholder="First name *" required className="input" />
            <input name="lastName" placeholder="Last name" className="input" />
          </div>
          <input name="email" type="email" placeholder="Email (for receipt & giving record)" className="input" />
          <div className="grid grid-cols-3 gap-2">
            <input name="amount" placeholder="$ amount *" required className="input" />
            <select name="method" className="input">
              <option value="VENMO">Venmo</option>
              <option value="CHECK">Check</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
            <input name="date" type="date" defaultValue={toDateInput(new Date())} className="input" />
          </div>
          <input name="note" placeholder="Note (check #, Venmo name, in honor of…)" className="input" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sendReceipt" defaultChecked className="accent-dusk-700" /> Email a receipt now</label>
          <button className="btn-green btn-sm">Record donation</button>
        </form>
      </div>

      <div id="in-kind" className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-x-auto">
          <h2 className="text-xl font-bold">Amazon &amp; drop-off gifts</h2>
          <p className="text-sm text-black/55">General gifts not tied to an angel. Givers can report Amazon purchases on the Give page.</p>
          <table className="table mt-2">
            <thead>
              <tr>
                <th>Date</th>
                <th>Giver</th>
                <th>Gift</th>
                <th>Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inKind.map((g) => (
                <tr key={g.id}>
                  <td>{formatDateShort(g.createdAt)}</td>
                  <td>{g.sponsorId ? <a href={`/admin/sponsors/${g.sponsorId}`}>{g.donorName}</a> : g.donorName}</td>
                  <td>
                    {g.description}
                    <div className="text-xs text-black/50">{g.source === "AMAZON_WISHLIST" ? "Amazon" : "Drop-off"}{g.estValueCents != null && ` · ~${money(g.estValueCents)}`}</div>
                  </td>
                  <td>
                    <form action={markInKindReceived.bind(null, g.id)}>
                      <button className={`badge ${g.receivedAt ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                        {g.receivedAt ? `✓ ${formatDateShort(g.receivedAt)}` : "Mark received"}
                      </button>
                    </form>
                  </td>
                  <td><form action={deleteInKind.bind(null, g.id)}><button className="text-xs text-black/40 hover:text-copper-700">delete</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
          {inKind.length === 0 && <p className="mt-3 text-sm text-black/50">None yet.</p>}
        </div>
        <form action={recordInKind} className="card h-fit space-y-2">
          <h2 className="text-lg font-bold">Record a gift</h2>
          <div className="grid grid-cols-2 gap-2">
            <input name="firstName" placeholder="First name *" required className="input" />
            <input name="lastName" placeholder="Last name" className="input" />
          </div>
          <input name="email" type="email" placeholder="Email" className="input" />
          <textarea name="description" placeholder="What was given? *" required className="input" />
          <div className="grid grid-cols-2 gap-2">
            <select name="source" className="input">
              <option value="DROP_OFF">Drop-off</option>
              <option value="AMAZON_WISHLIST">Amazon wish list</option>
            </select>
            <input name="value" placeholder="$ est. value (internal)" className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="received" defaultChecked className="accent-dusk-700" /> Already received</label>
          <button className="btn-green btn-sm">Record gift</button>
        </form>
      </div>
    </>
  );
}
