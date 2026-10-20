import Link from "next/link";
import { getAdminSeason } from "@/lib/season";
import { seasonPartners, tierLabel, TIERS } from "@/lib/recognition";
import { formatDateShort, money } from "@/lib/format";
import { AdminTitle, Empty } from "@/components/admin";
import { approvePartner, declinePartner, updatePartner } from "../../actions";

export const metadata = { title: "Business partners" };

const statusTone = {
  PENDING: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  DECLINED: "bg-black/10 text-black/60",
} as const;

export default async function AdminPartners() {
  const season = (await getAdminSeason())!;
  const partners = await seasonPartners(season.id);
  const pending = partners.filter((p) => p.status === "PENDING");

  return (
    <>
      <AdminTitle title="Business partners">
        <Link href="/partners" className="btn-outline btn-sm">Partner sign-up page ↗</Link>
      </AdminTitle>
      <p className="mb-5 max-w-2xl text-sm text-black/60">
        Businesses sign up on the partner page with their logo and gift. Approve each logo here. It appears on the home page once
        it&rsquo;s approved <em>and</em> their gift is marked received under Money &amp; Gifts. Tiers follow the money received:{" "}
        {TIERS.map((t) => `${t.label} ${money(t.minCents)}+`).join(", ")}. You can set a tier by hand, for example for donated goods.
      </p>
      {pending.length > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          {pending.length} partner{pending.length === 1 ? "" : "s"} waiting for your review.
        </p>
      )}
      {partners.length === 0 ? (
        <Empty>No business partners yet for Christmas {season.year}.</Empty>
      ) : (
        <div className="space-y-4">
          {partners.map((p) => (
            <div key={p.id} className="card grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="flex h-32 items-center justify-center rounded-xl border border-dusk-100 bg-white p-3">
                {p.logoKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/partner-logo/${p.logoKey}`} alt={`${p.businessName} logo`} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-black/40">No logo</span>
                )}
              </div>
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl">{p.businessName}</h2>
                  <span className={`badge ${statusTone[p.status]}`}>{p.status.toLowerCase()}</span>
                  <span className="badge bg-dusk-50 text-dusk-700">{tierLabel(p.tier)}{p.tierOverride ? " (set by hand)" : ""}</span>
                </div>
                <p className="text-sm text-black/65">
                  <Link href={`/admin/sponsors/${p.sponsorId}`}>{p.sponsor.firstName} {p.sponsor.lastName}</Link> · {p.sponsor.email}
                  {p.sponsor.phone && ` · ${p.sponsor.phone}`} · signed up {formatDateShort(p.createdAt)}
                </p>
                <p className="text-sm">
                  Pledged <strong>{money(p.pledgeCents)}</strong> · received <strong>{money(p.confirmedCents)}</strong>
                  {p.confirmedCents < (p.pledgeCents ?? 0) && (
                    <> · <Link href="/admin/donations" className="text-star-700">mark the gift received in Money &amp; Gifts</Link></>
                  )}
                </p>
                {p.message && <p className="rounded-lg bg-cream px-3 py-2 text-sm text-black/70">&ldquo;{p.message}&rdquo;</p>}

                <form action={updatePartner.bind(null, p.id)} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <input name="businessName" defaultValue={p.businessName} className="input" aria-label="Business name" />
                  <input name="website" defaultValue={p.website ?? ""} placeholder="Website" className="input" aria-label="Website" />
                  <select name="tierOverride" defaultValue={p.tierOverride ?? ""} className="input" aria-label="Tier">
                    <option value="">Tier: automatic</option>
                    {TIERS.map((t) => (
                      <option key={t.tier} value={t.tier}>{t.label} (set by hand)</option>
                    ))}
                  </select>
                  <button className="btn-outline btn-sm">Save</button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {p.status !== "APPROVED" && (
                    <form action={approvePartner.bind(null, p.id)}><button className="btn-green btn-sm">✓ Approve logo</button></form>
                  )}
                  {p.status !== "DECLINED" && (
                    <form action={declinePartner.bind(null, p.id)}><button className="btn-outline btn-sm">Don&rsquo;t show</button></form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
