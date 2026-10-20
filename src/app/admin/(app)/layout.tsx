import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { MobileHeader, MobileTabBar, SidebarNav } from "@/components/AdminNav";
import { SandboxBanner } from "@/components/SandboxBanner";
import { isSandbox } from "@/lib/sandbox";
import { adminLogout, switchSeason } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [season, seasons] = await Promise.all([getAdminSeason(), db.season.findMany({ orderBy: { year: "desc" } })]);

  const seasonSwitcher =
    seasons.length > 0 ? (
      <form action={switchSeason}>
        <label className="text-[11px] tracking-wider text-white/50 uppercase">Viewing season</label>
        <div className="mt-1 flex gap-2">
          <select name="seasonId" defaultValue={season?.id} className="w-full rounded-md bg-white/10 px-2 py-1.5 text-sm text-white">
            {seasons.map((s) => (
              <option key={s.id} value={s.id} className="text-ink">
                {s.year}
                {s.isActive ? " (active)" : ""}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-white/15 px-3 text-xs">Go</button>
        </div>
      </form>
    ) : null;
  const signOut = (
    <form action={adminLogout}>
      <button className="text-white/70 underline">Sign out</button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#f4f1ea] lg:grid lg:grid-cols-[240px_1fr]">
      <div className="lg:col-span-2"><SandboxBanner admin /></div>
      <MobileHeader seasonSwitcher={seasonSwitcher} signOut={signOut} testMode={isSandbox()} />
      <aside className="no-print hidden bg-dusk-900 text-white/85 lg:block lg:min-h-screen">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="text-2xl text-gold-300">✦</span>
          <div className="leading-tight">
            <p className="font-display text-lg text-white">LIFT Admin</p>
            <p className="text-[11px] tracking-widest text-gold-300 uppercase">Community Christmas</p>
          </div>
        </div>
        {seasonSwitcher && <div className="px-5 pb-4">{seasonSwitcher}</div>}
        <SidebarNav testMode={isSandbox()} />
        <div className="space-y-2 px-5 pt-6 text-xs">
          <Link href="/" className="block text-white/60">View public site ↗</Link>
          {signOut}
        </div>
      </aside>
      <div className="min-w-0 px-4 pt-5 pb-28 sm:px-8 sm:pt-8 lg:pb-10">
        {!season && (
          <div className="card mb-6 max-w-2xl border-star-100 bg-star-50/60">
            <h1 className="text-2xl">Welcome! Let&rsquo;s set up your Christmas season</h1>
            <p className="mt-2 text-black/70">
              Everything (applications, the Angel Tree, giving) belongs to a season. Create this year&rsquo;s season under Seasons
              &amp; Deadlines and set your dates.
              {isSandbox() && " In test mode you can also load sample data from Test Mode & Outbox."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/seasons" className="btn-green">Set up a season</Link>
              {isSandbox() && <Link href="/admin/sandbox" className="btn-outline">Load sample data</Link>}
            </div>
          </div>
        )}
        {children}
      </div>
      <MobileTabBar />
    </div>
  );
}
