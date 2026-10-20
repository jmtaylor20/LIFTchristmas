import { db } from "@/lib/db";
import { requireAdminSeason } from "@/lib/season";
import { AdminTitle } from "@/components/admin";
import { ProgressBar } from "@/components/ui";
import { markPickedUp, undoPickedUp } from "../../actions";

export const metadata = { title: "Pickup day" };

// Built for a phone at the pickup table: search a family, see if their gifts
// are ready, tap once to check them out.
export default async function Pickup({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const { q = "", show } = await searchParams;
  const season = await requireAdminSeason();
  const query = q.trim();
  const all_ = await db.application.findMany({
    where: { seasonId: season.id, status: "APPROVED", ...(show === "waiting" ? { pickedUpAt: null } : {}) },
    include: {
      household: true,
      angels: { include: { child: true, items: { select: { status: true } } }, orderBy: { number: "asc" } },
    },
    orderBy: [{ household: { parentLastName: "asc" } }],
  });
  // Filtered here rather than in SQL so "garcia" finds "García".
  const apps = query ? all_.filter((a) => matches(a, query)) : all_;
  const totals = await db.application.groupBy({
    by: ["pickedUpAt"],
    where: { seasonId: season.id, status: "APPROVED" },
    _count: true,
  });
  const all = totals.reduce((n, t) => n + t._count, 0);
  const done = totals.filter((t) => t.pickedUpAt).reduce((n, t) => n + t._count, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminTitle title="Pickup day" />
      <div className="card mb-4">
        <p className="text-sm text-black/60">
          <strong className="text-dusk-800">{done}</strong> of {all} families have picked up
        </p>
        <ProgressBar value={done} max={all} className="mt-2" />
      </div>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={query} placeholder="Last name, phone, or angel #" autoFocus className="input py-3 text-base" />
        {show && <input type="hidden" name="show" value={show} />}
        <button className="btn-green">Find</button>
      </form>
      <div className="mb-4 flex gap-2 text-sm">
        <a href={`/admin/pickup?q=${encodeURIComponent(query)}`} className={!show ? "btn-green btn-sm" : "btn-outline btn-sm"}>Everyone</a>
        <a href={`/admin/pickup?show=waiting&q=${encodeURIComponent(query)}`} className={show === "waiting" ? "btn-green btn-sm" : "btn-outline btn-sm"}>Not picked up yet</a>
      </div>

      <div className="space-y-3">
        {apps.map((a) => {
          const items = a.angels.flatMap((x) => x.items);
          const ready = items.filter((i) => i.status === "RECEIVED" || i.status === "MINISTRY").length;
          const allReady = items.length > 0 && ready === items.length;
          return (
            <div key={a.id} className={`card p-4 ${a.pickedUpAt ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">
                    {a.household.parentLastName}, {a.household.parentFirstName}
                  </p>
                  <p className="text-sm text-black/60">{a.household.phone}</p>
                  <p className="mt-1 text-sm">
                    {a.angels.map((x) => `#${x.number} ${x.child.firstName}`).join(" · ")}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${allReady ? "text-emerald-700" : "text-amber-700"}`}>
                    {allReady ? "✓ All gifts in" : `${ready} of ${items.length} gifts in`}
                  </p>
                </div>
                {a.pickedUpAt ? (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-700">
                      ✓ Picked up {a.pickedUpAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}
                    </p>
                    <form action={undoPickedUp.bind(null, a.id)}>
                      <button className="text-xs text-black/50 underline">Undo</button>
                    </form>
                  </div>
                ) : (
                  <form action={markPickedUp.bind(null, a.id)}>
                    <input type="hidden" name="q" value={query} />
                    <button className="btn-primary px-6 py-3 text-base">Picked up</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {apps.length === 0 && <p className="text-center text-sm text-black/50">No families found.</p>}
      </div>
    </div>
  );
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function matches(
  a: { household: { parentFirstName: string; parentLastName: string; phoneDigits: string }; angels: { number: number | null }[] },
  query: string,
) {
  const q = fold(query);
  const digits = query.replace(/\D/g, "");
  if (/^#?\d{1,4}$/.test(query) && a.angels.some((x) => x.number === Number(query.replace("#", "")))) return true;
  if (digits.length >= 4 && a.household.phoneDigits.includes(digits)) return true;
  return fold(`${a.household.parentFirstName} ${a.household.parentLastName}`).includes(q);
}
