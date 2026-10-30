import { db } from "@/lib/db";
import { money, toDateInput } from "@/lib/format";
import { AdminTitle } from "@/components/admin";
import { Notice } from "@/components/ui";
import { activateSeason, createSeason, deleteEmptySeason, updateSeason } from "../../actions";

export const metadata = { title: "Seasons" };

export default async function Seasons({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; error?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const seasons = await db.season.findMany({ orderBy: { year: "desc" }, include: { _count: { select: { applications: true, angels: true, donations: true, sponsorships: true, inKindGifts: true, partners: true } } } });
  const editing = seasons.find((s) => s.id === sp.edit) ?? seasons.find((s) => s.isActive) ?? seasons[0];

  return (
    <>
      <AdminTitle title="Seasons & deadlines" />
      {sp.saved && <div className="mb-4"><Notice tone="success">Saved.</Notice></div>}
      {sp.error === "exists" && <div className="mb-4"><Notice tone="error">That year already exists.</Notice></div>}
      {sp.error === "notempty" && <div className="mb-4"><Notice tone="error">Only a season with no families, gifts, or partners can be deleted.</Notice></div>}
      {sp.deleted && <div className="mb-4"><Notice tone="success">Season deleted.</Notice></div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg">All seasons</h2>
            <ul className="mt-3 divide-y divide-black/5">
              {seasons.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <a href={`/admin/seasons?edit=${s.id}`} className="font-semibold">
                    {s.year} {s.isActive && <span className="badge ml-1 bg-emerald-100 text-emerald-900">Active</span>}
                  </a>
                  <span className="text-black/50">{s._count.applications} apps · {s._count.angels} angels</span>
                  <span className="flex gap-1">
                    {!s.isActive && (
                      <form action={activateSeason.bind(null, s.id)}>
                        <button className="btn-outline btn-sm">Make active</button>
                      </form>
                    )}
                    {Object.values(s._count).every((n) => n === 0) && (
                      <form action={deleteEmptySeason.bind(null, s.id)}>
                        <button className="btn-outline btn-sm text-star-800" title="Only empty seasons can be deleted">Delete</button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <form action={createSeason} className="card space-y-3">
            <h2 className="text-lg">Start a new season</h2>
            <p className="text-xs text-black/55">Settings carry over from last year. Families and givers keep their history.</p>
            <input name="year" type="number" defaultValue={new Date().getFullYear() + (seasons.some((s) => s.year === new Date().getFullYear()) ? 1 : 0)} className="input" />
            <button className="btn-green btn-sm">Create season</button>
          </form>
        </div>

        {editing && (
          <form action={updateSeason.bind(null, editing.id)} className="card space-y-5">
            <h2 className="text-xl">Christmas {editing.year} settings</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <DateField label="Applications close" name="applicationDeadline" value={editing.applicationDeadline} />
              <DateField label="Wish lists due" name="wishlistDeadline" value={editing.wishlistDeadline} />
              <DateField label="Gifts, money & sponsors due" name="giftDeadline" value={editing.giftDeadline} />
              <DateField label="Pickup day" name="pickupDate" value={editing.pickupDate} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="applicationsOpen" defaultChecked={editing.applicationsOpen} className="h-4 w-4 accent-dusk-700" />
              Accept applications (turn off to close early)
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Suggested spend per child (optional)" name="perChildBudget" defaultValue={editing.perChildBudgetCents != null ? money(editing.perChildBudgetCents) : ""} placeholder="No suggested amount" />
              <Input label="Max wish-list items per child" name="maxItemsPerChild" type="number" defaultValue={editing.maxItemsPerChild} />
              <Input label="Approval cap (years per family)" name="approvalCapYears" type="number" defaultValue={editing.approvalCapYears} />
            </div>
            <div className="rounded-xl bg-cream p-4 space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="autoApprove" defaultChecked={editing.autoApprove} className="mt-0.5 h-4 w-4 accent-dusk-700" />
                <span>
                  <strong>Approve website applications automatically</strong> when they have a job, are at or under the income limit,
                  uploaded a photo ID and proof of income, and are under the approval cap. Everything else is flagged for you, and
                  families missing documents are emailed to add them.
                </span>
              </label>
              <div className="max-w-xs">
                <Input label="Income limit (yearly household income)" name="incomeLimit" defaultValue={money(editing.incomeLimitCents)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Venmo username for donations" name="venmoHandle" defaultValue={editing.venmoHandle ?? ""} placeholder="@LIFT-Ministries" />
              <Input label="Amazon wish list link" name="amazonWishlistUrl" defaultValue={editing.amazonWishlistUrl ?? ""} placeholder="https://www.amazon.com/hz/wishlist/ls/…" />
            </div>
            <Area label="Gift drop-off instructions (shown to sponsors)" name="dropOffInstructions" defaultValue={editing.dropOffInstructions} placeholder="Drop off unwrapped gifts at … between …" />
            <Area label="Shipping address for online orders (leave blank to turn off shipping)" name="shippingAddress" defaultValue={editing.shippingAddress} placeholder={"123 Main St\nTallassee, AL 36078"} />
            <Area label="Check / in-person giving instructions (shown on Donate page)" name="donationInstructions" defaultValue={editing.donationInstructions} placeholder="Make checks payable to … and mail to …" />
            <Area label="Gift pickup details (shown to approved families, in their approval email, and in the pickup reminder sent before pickup day)" name="pickupInstructions" defaultValue={editing.pickupInstructions} placeholder="Pickup is Saturday, Dec. 19, 9am–noon at … Please bring your ID." />
            <button className="btn-green">Save settings</button>
          </form>
        )}
      </div>
    </>
  );
}

function DateField({ label, name, value }: { label: string; name: string; value: Date | null }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type="date" name={name} defaultValue={toDateInput(value)} className="input" />
    </label>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

function Area({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue: string | null; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="input min-h-20" />
    </label>
  );
}
