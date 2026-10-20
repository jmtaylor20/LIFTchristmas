import Link from "next/link";
import { requireAdminSeason } from "@/lib/season";
import { seasonNeeds } from "@/lib/needs";
import { formatDateShort, money } from "@/lib/format";
import { AdminTitle, Empty } from "@/components/admin";
import { Notice, ProgressBar } from "@/components/ui";
import { addNeeds, deleteNeed, toggleNeedHidden, updateNeed } from "../../actions";

export const metadata = { title: "Ministry needs" };

export default async function Needs({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const sp = await searchParams;
  const season = await requireAdminSeason();
  const needs = await seasonNeeds(season.id, { includeHidden: true });

  return (
    <>
      <AdminTitle title="Ministry needs">
        <Link href="/give#needs" className="btn-outline btn-sm">See it on the Give page ↗</Link>
      </AdminTitle>
      <p className="mb-5 max-w-2xl text-sm text-black/60">
        Things the ministry needs, such as items from your Amazon wish list, wrapping supplies, or batteries. They show on the Give page
        with a <strong>Buy</strong> button and an <strong>I bought this</strong> button. Each &ldquo;I bought this&rdquo; shows up under
        Money &amp; Gifts; mark it received when it arrives, and the giver is thanked automatically.
      </p>
      <div className="mb-4 space-y-3">
        {sp.added && <Notice tone="success">Added {sp.added} item{sp.added === "1" ? "" : "s"}. Check the names and prices below.</Notice>}
        {sp.error === "empty" && <Notice tone="error">Paste at least one item, one per line.</Notice>}
      </div>

      <form action={addNeeds} className="card mb-6 space-y-3">
        <h2 className="text-xl">Add items</h2>
        <p className="text-sm text-black/60">
          Paste one item per line. Put the price, link, and how many you need anywhere on the line. Copying from your Amazon wish list
          works well:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-cream p-3 text-xs text-black/70">{`Wrapping paper rolls, $12.99, x10, https://www.amazon.com/dp/...
Scotch tape | qty 20
Gift bags (large) $24.50 https://amzn.to/...`}</pre>
        <textarea name="lines" required className="input min-h-36 font-mono text-xs" placeholder="One item per line" />
        <button className="btn-green">Add items</button>
      </form>

      {needs.length === 0 ? (
        <Empty>No needs listed yet for Christmas {season.year}.</Empty>
      ) : (
        <div className="space-y-3">
          {needs.map((n) => (
            <div key={n.id} className={`card space-y-3 ${n.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {n.name}
                  {n.hidden && <span className="badge ml-2 bg-black/10 text-black/60">hidden</span>}
                </p>
                <p className="text-sm text-black/60">
                  {n.covered} of {n.quantity} covered · {n.received} received
                </p>
              </div>
              <ProgressBar value={n.covered} max={n.quantity} />
              <form action={updateNeed.bind(null, n.id)} className="grid gap-2 sm:grid-cols-[2fr_1fr_90px_80px_2fr_auto]">
                <input name="name" defaultValue={n.name} className="input" aria-label="Item" />
                <input name="details" defaultValue={n.details ?? ""} placeholder="Details (size, color)" className="input" aria-label="Details" />
                <input name="price" defaultValue={n.priceCents != null ? (n.priceCents / 100).toFixed(2) : ""} placeholder="$ price" className="input" aria-label="Price" />
                <input name="quantity" type="number" min={1} defaultValue={n.quantity} className="input" aria-label="How many needed" />
                <input name="url" defaultValue={n.url ?? ""} placeholder="Link (Amazon, store…)" className="input" aria-label="Link" />
                <button className="btn-outline btn-sm">Save</button>
              </form>
              {n.gifts.length > 0 && (
                <ul className="space-y-1 text-xs text-black/65">
                  {n.gifts.map((g) => (
                    <li key={g.id}>
                      {g.quantity} from {g.sponsorId ? <Link href={`/admin/sponsors/${g.sponsorId}`}>{g.donorName}</Link> : g.donorName} ·{" "}
                      {formatDateShort(g.createdAt)} · {g.receivedAt ? "✓ received" : <Link href="/admin/donations#in-kind">mark received in Money &amp; Gifts</Link>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-3 text-xs">
                {n.url && <a href={n.url} target="_blank" rel="noopener noreferrer">Open link ↗</a>}
                <form action={toggleNeedHidden.bind(null, n.id)}><button className="underline">{n.hidden ? "Show on Give page" : "Hide from Give page"}</button></form>
                <form action={deleteNeed.bind(null, n.id)}>
                  <button className="text-star-800 underline">{n.gifts.length ? "Remove (keeps giving records)" : "Delete"}</button>
                </form>
                {n.priceCents != null && <span className="text-black/45">{money(n.priceCents, { cents: true })} each</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
