import type { Statement } from "@/lib/givers";
import { formatDate, money } from "@/lib/format";
import { org, receiptDisclaimer, site } from "@/content/site";
import { Star } from "./SiteChrome";

export function StatementView({ s }: { s: Statement }) {
  return (
    <article className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm print:shadow-none">
      <header className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gold-500" />
            <span className="font-display text-xl font-semibold text-dusk-800">{org.legalName}</span>
          </div>
          {org.mailingAddress && <p className="mt-1 text-sm whitespace-pre-line text-black/60">{org.mailingAddress}</p>}
          {org.ein && <p className="text-sm text-black/60">EIN {org.ein}</p>}
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold text-dusk-800">{s.year}</p>
          <p className="text-xs tracking-wider text-black/50 uppercase">Giving statement</p>
        </div>
      </header>
      <section className="mt-5 text-sm">
        <p className="font-semibold">
          {s.sponsor.firstName} {s.sponsor.lastName}
        </p>
        {s.sponsor.organization && <p>{s.sponsor.organization}</p>}
        <p className="text-black/60">{s.sponsor.email}</p>
      </section>

      <h2 className="mt-8 text-lg">Monetary contributions</h2>
      {s.donations.length ? (
        <table className="table mt-2">
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {s.donations.map((d) => (
              <tr key={d.id}>
                <td>{formatDate(d.receivedAt, { month: "short" })}</td>
                <td className="capitalize">{d.method.toLowerCase()}</td>
                <td className="text-right">{money(d.amountCents, { cents: true })}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} className="font-bold">Total</td>
              <td className="text-right font-bold">{money(s.cashTotalCents, { cents: true })}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-black/55">None recorded.</p>
      )}

      <h2 className="mt-8 text-lg">Non-cash gifts received</h2>
      {s.noncash.length ? (
        <>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {s.noncash.map((n, i) => (
              <li key={i}>
                {formatDate(n.date, { month: "short" })} — {n.description}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-black/55">
            The ministry does not assign a value to non-cash gifts. Please keep your purchase receipts to determine their value.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-black/55">None recorded.</p>
      )}

      <footer className="mt-10 border-t border-black/10 pt-4 text-xs text-black/60">
        <p>{receiptDisclaimer(true)}</p>
        <p className="mt-3 italic">
          &ldquo;{site.giveVerse.text}&rdquo; — {site.giveVerse.ref}
        </p>
      </footer>
    </article>
  );
}
