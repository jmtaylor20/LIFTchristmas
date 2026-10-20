import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { Star } from "@/components/SiteChrome";
import { adminLogout, switchSeason } from "../actions";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/angels", label: "Angels & Lists" },
  { href: "/admin/sponsors", label: "Givers" },
  { href: "/admin/donations", label: "Money & Gifts" },
  { href: "/admin/families", label: "Family History" },
  { href: "/admin/statements", label: "Tax Statements" },
  { href: "/admin/tags", label: "Gift Tags" },
  { href: "/admin/seasons", label: "Seasons & Deadlines" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [season, seasons] = await Promise.all([getAdminSeason(), db.season.findMany({ orderBy: { year: "desc" } })]);

  return (
    <div className="min-h-screen bg-[#f4f1ea] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="no-print bg-dusk-900 text-white/85 lg:min-h-screen">
        <div className="flex items-center gap-2 px-5 py-5">
          <Star className="h-6 w-6 text-gold-400" />
          <div className="leading-tight">
            <p className="font-display text-lg text-white">LIFT Admin</p>
            <p className="text-[11px] tracking-widest text-gold-300 uppercase">Community Christmas</p>
          </div>
        </div>
        {seasons.length > 0 && (
          <form action={switchSeason} className="px-5 pb-4">
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
              <button className="rounded-md bg-white/15 px-2 text-xs">Go</button>
            </div>
          </form>
        )}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm whitespace-nowrap text-white/85 no-underline hover:bg-white/10">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden space-y-2 px-5 pt-6 text-xs lg:block">
          <Link href="/" className="block text-white/60">View public site ↗</Link>
          <form action={adminLogout}>
            <button className="text-white/60 underline">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">
        {!season ? (
          <div className="card max-w-xl">
            <h1 className="text-2xl font-bold">Welcome!</h1>
            <p className="mt-2">Start by creating this year&rsquo;s season and setting your deadlines.</p>
            <Link href="/admin/seasons" className="btn-green mt-4">Set up a season</Link>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
