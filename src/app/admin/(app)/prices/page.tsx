import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminSeason } from "@/lib/season";
import { ageText, genderLabel, money } from "@/lib/format";
import { AdminTitle, Empty } from "@/components/admin";
import { Notice } from "@/components/ui";
import { saveItemPrices } from "../../actions";

export const metadata = { title: "Gift prices" };

// Families' wish lists rarely include prices, but sponsors browse "Gifts for
// every budget" by price. This page lets the owner price many gifts at once.
export default async function Prices({ searchParams }: { searchParams: Promise<{ show?: string; saved?: string }> }) {
  const { show, saved } = await searchParams;
  const season = await requireAdminSeason();
  const all = show === "all";
  const items = await db.wishItem.findMany({
    where: {
      angel: { seasonId: season.id, number: { not: null } },
      status: { in: ["NEEDED", "CLAIMED"] },
      ...(all ? {} : { estPriceCents: null }),
    },
    include: { angel: { select: { id: true, number: true, gender: true, ageAtSeason: true } } },
    orderBy: [{ angel: { number: "asc" } }, { sortOrder: "asc" }],
  });
  const unpriced = all ? items.filter((i) => i.estPriceCents == null).length : items.length;

  return (
    <>
      <AdminTitle title="Gift prices" />
      <div className="mb-4 space-y-3">
        {saved != null && <Notice tone="success">Saved {saved} price{saved === "1" ? "" : "s"}.</Notice>}
        <p className="max-w-2xl text-sm text-black/60">
          Sponsors can shop &ldquo;Gifts for every budget&rdquo; by price, but most wish lists came in without prices. Type a rough
          price for each gift (whole dollars are fine) and save. Gifts without a price still appear, after the priced ones.
        </p>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/prices" className={!all ? "btn-green btn-sm" : "btn-outline btn-sm"}>Needs a price ({all ? unpriced : items.length})</Link>
          <Link href="/admin/prices?show=all" className={all ? "btn-green btn-sm" : "btn-outline btn-sm"}>All open gifts</Link>
        </div>
      </div>
      {items.length === 0 ? (
        <Empty>Every open gift has a price.</Empty>
      ) : (
        <form action={saveItemPrices} className="space-y-4">
          <input type="hidden" name="back" value={all ? "/admin/prices?show=all" : "/admin/prices"} />
          <div className="rtable-wrap">
            <table className="table rtable">
              <thead>
                <tr>
                  <th>Angel</th>
                  <th>Gift</th>
                  <th className="w-36">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td data-label="Angel" className="whitespace-nowrap text-sm">
                      <Link href={`/admin/angels/${i.angel.id}`}>#{i.angel.number}</Link>
                      <span className="text-black/50"> · {genderLabel(i.angel.gender)}, {ageText(i.angel.ageAtSeason)}</span>
                    </td>
                    <td data-label="Gift">
                      <span className="font-medium">{i.name}</span>
                      {i.details && <span className="block text-xs text-black/55">{i.details}</span>}
                    </td>
                    <td data-label="Price">
                      <input
                        name={`price:${i.id}`}
                        defaultValue={i.estPriceCents != null ? money(i.estPriceCents) : ""}
                        inputMode="decimal"
                        placeholder="$"
                        aria-label={`Price for ${i.name}`}
                        className="input py-1.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sticky bottom-24 z-10 flex justify-end lg:bottom-4">
            <button className="btn-green px-8 shadow-lg">Save prices</button>
          </div>
        </form>
      )}
    </>
  );
}
