import { db } from "@/lib/db";
import { requireAdminSeason } from "@/lib/season";
import { ageText, genderLabel } from "@/lib/format";
import { AdminTitle } from "@/components/admin";
import { PrintButton } from "@/components/PrintButton";
import { Star } from "@/components/SiteChrome";
import { site } from "@/content/site";

export const metadata = { title: "Gift tags" };

// Printable tags: one per angel for the paper Angel Tree, or bag labels for sorting gifts.
export default async function Tags({ searchParams }: { searchParams: Promise<{ kind?: string; only?: string }> }) {
  const { kind = "tree", only } = await searchParams;
  const season = await requireAdminSeason();
  const angels = await db.angel.findMany({
    where: { seasonId: season.id, number: { not: null }, application: { status: "APPROVED" } },
    include: {
      child: true,
      application: { include: { household: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { number: "asc" },
  });
  const list = only === "open" ? angels.filter((a) => a.items.some((i) => i.status === "NEEDED")) : angels;

  return (
    <>
      <div className="no-print">
        <AdminTitle title="Printable gift tags">
          <a href="/admin/tags?kind=tree" className={kind === "tree" ? "btn-green btn-sm" : "btn-outline btn-sm"}>Angel Tree tags</a>
          <a href="/admin/tags?kind=tree&only=open" className={only === "open" ? "btn-green btn-sm" : "btn-outline btn-sm"}>Tree tags (still needed)</a>
          <a href="/admin/tags?kind=bag" className={kind === "bag" ? "btn-green btn-sm" : "btn-outline btn-sm"}>Bag labels (with family name)</a>
          <PrintButton label="Print" />
        </AdminTitle>
        <p className="mb-4 text-sm text-black/60">
          Tree tags show only the angel number, age, sizes, and list, so they&rsquo;re safe to hang at church. Bag labels include the family name for pickup day. Keep those private.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
        {list.map((a) => (
          <div key={a.id} className="break-inside-avoid rounded-xl border-2 border-dashed border-dusk-700/40 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-semibold text-dusk-800">Angel #{a.number}</span>
              <Star className="h-5 w-5 text-gold-500" />
            </div>
            <p className="text-black/70">{genderLabel(a.gender)}, {ageText(a.ageAtSeason)}</p>
            {kind === "bag" ? (
              <>
                <p className="mt-2 text-lg font-bold">{a.application.household.parentLastName} family</p>
                <p>{a.child.firstName} · {a.application.household.phone}</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-xs">Shirt {a.shirtSize || "—"} · Pants {a.pantsSize || "—"} · Shoes {a.shoeSize || "—"}</p>
                <ul className="mt-2 list-disc pl-4 text-xs">
                  {a.items.filter((i) => only !== "open" || i.status === "NEEDED").map((i) => (
                    <li key={i.id}>{i.name}{i.details && ` (${i.details})`}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-black/50">{site.name} · Sign up at {process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ?? ""}/angels/{a.number}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
