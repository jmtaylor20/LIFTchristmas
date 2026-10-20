import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateShort, genderLabel, money } from "@/lib/format";
import { AdminTitle, ItemBadge } from "@/components/admin";
import { Notice } from "@/components/ui";
import {
  adminAddItem,
  adminAssignSponsor,
  adminDeleteItem,
  cancelSponsorship,
  receiveSponsorship,
  setItemStatus,
  toggleAngelHidden,
} from "../../../actions";

export const metadata = { title: "Angel" };

export default async function AdminAngel({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const angel = await db.angel.findUnique({
    where: { id },
    include: {
      child: true,
      application: { include: { household: true } },
      items: { include: { sponsorship: { include: { sponsor: true } } }, orderBy: { sortOrder: "asc" } },
      sponsorships: { include: { sponsor: true, items: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!angel) notFound();
  const h = angel.application.household;
  const needed = angel.items.filter((i) => i.status === "NEEDED");

  return (
    <>
      <AdminTitle title={`Angel #${angel.number ?? "—"} · ${angel.child.firstName} ${angel.child.lastName}`}>
        <Link href="/admin/angels" className="btn-outline btn-sm">← All angels</Link>
        {angel.number != null && <Link href={`/angels/${angel.number}`} className="btn-outline btn-sm">Public page ↗</Link>}
        <form action={toggleAngelHidden.bind(null, angel.id)}>
          <button className="btn-outline btn-sm">{angel.hidden ? "Show on Angel Tree" : "Hide from Angel Tree"}</button>
        </form>
      </AdminTitle>
      {error === "assign" && <div className="mb-4"><Notice tone="error">Enter the giver&rsquo;s name and email, and choose at least one item.</Notice></div>}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card">
          <p className="text-sm text-black/60">
            {genderLabel(angel.gender)}, age {angel.ageAtSeason} · Shirt {angel.shirtSize || "—"} · Pants {angel.pantsSize || "—"} · Shoes {angel.shoeSize || "—"}
            {angel.interests && <> · Loves {angel.interests}</>}
          </p>
          <p className="mt-1 text-sm">
            Family: <Link href={`/admin/applications/${angel.applicationId}`}>{h.parentFirstName} {h.parentLastName}</Link> · {h.phone}
          </p>

          <h2 className="mt-6 text-xl font-bold">Wish list</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Est.</th>
                  <th>Status</th>
                  <th>Sponsor</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {angel.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <span className="font-medium">{i.name}</span>
                      {i.details && <div className="text-xs text-black/50">{i.details}</div>}
                      {i.url && <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-xs">link ↗</a>}
                    </td>
                    <td>{i.estPriceCents != null ? money(i.estPriceCents) : "—"}</td>
                    <td>
                      <ItemBadge status={i.status} />
                      {i.status === "MINISTRY" && i.ministryCostCents != null && <div className="text-xs text-black/50">spent {money(i.ministryCostCents, { cents: true })}</div>}
                    </td>
                    <td className="text-xs">
                      {i.sponsorship && (
                        <Link href={`/admin/sponsors/${i.sponsorship.sponsorId}`}>
                          {i.sponsorship.sponsor.firstName} {i.sponsorship.sponsor.lastName}
                        </Link>
                      )}
                    </td>
                    <td>
                      <form action={setItemStatus.bind(null, i.id)} className="flex flex-wrap items-center gap-1">
                        <select name="status" defaultValue={i.status} className="input w-auto py-1 text-xs">
                          <option value="NEEDED">Needed</option>
                          <option value="CLAIMED" disabled={!i.sponsorshipId}>Committed</option>
                          <option value="RECEIVED">Received</option>
                          <option value="MINISTRY">Ministry buying</option>
                        </select>
                        <input name="cost" placeholder="$ spent" className="input w-20 py-1 text-xs" defaultValue={i.ministryCostCents != null ? (i.ministryCostCents / 100).toFixed(2) : ""} />
                        <button className="btn-outline btn-sm">Save</button>
                      </form>
                      {i.status === "NEEDED" && (
                        <form action={adminDeleteItem.bind(null, i.id)}>
                          <button className="mt-1 text-xs text-copper-700">Delete</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-black/50">&ldquo;$ spent&rdquo; is only used for Ministry buying. It&rsquo;s subtracted from the fund balance.</p>

          <form action={adminAddItem.bind(null, angel.id)} className="mt-4 grid gap-2 rounded-xl bg-cream p-3 sm:grid-cols-4">
            <input name="name" placeholder="Add item" required className="input sm:col-span-2" />
            <input name="details" placeholder="Size / details" className="input" />
            <input name="price" placeholder="$ est." className="input" />
            <button className="btn-green btn-sm sm:col-span-4 sm:justify-self-start">Add item</button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold">Sponsors</h2>
            {angel.sponsorships.length === 0 && <p className="mt-2 text-sm text-black/55">No sponsors yet.</p>}
            <ul className="mt-2 space-y-3 text-sm">
              {angel.sponsorships.map((s) => (
                <li key={s.id} className={`rounded-lg border border-black/5 p-3 ${s.status === "CANCELLED" ? "opacity-50" : ""}`}>
                  <Link href={`/admin/sponsors/${s.sponsorId}`} className="font-semibold">{s.sponsor.firstName} {s.sponsor.lastName}</Link>
                  <div className="text-xs text-black/55">
                    {s.sponsor.email} {s.sponsor.phone && `· ${s.sponsor.phone}`} · {formatDateShort(s.createdAt)} · {s.type === "FULL" ? "whole list" : `${s.items.length} items`} · {s.status.toLowerCase()}
                  </div>
                  {s.status === "COMMITTED" && (
                    <div className="mt-2 flex gap-2">
                      <form action={receiveSponsorship.bind(null, s.id)}><button className="btn-green btn-sm">Mark all received</button></form>
                      <form action={cancelSponsorship.bind(null, s.id)}><button className="btn-outline btn-sm">Cancel &amp; release items</button></form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {needed.length > 0 && (
            <form action={adminAssignSponsor.bind(null, angel.id)} className="card space-y-2">
              <h2 className="text-lg font-bold">Add a sponsor by hand</h2>
              <p className="text-xs text-black/55">For phone calls or paper sign-up sheets.</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="firstName" placeholder="First name" className="input" />
                <input name="lastName" placeholder="Last name" className="input" />
              </div>
              <input name="email" type="email" placeholder="Email" className="input" />
              <input name="phone" placeholder="Phone" className="input" />
              <input name="organization" placeholder="Church / business" className="input" />
              <div className="space-y-1 pt-1">
                {needed.map((i) => (
                  <label key={i.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="itemId" value={i.id} defaultChecked className="accent-dusk-700" /> {i.name}
                  </label>
                ))}
              </div>
              <button className="btn-green btn-sm">Assign</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
