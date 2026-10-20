import Link from "next/link";
import type { partnerWall } from "@/lib/recognition";

type Wall = Awaited<ReturnType<typeof partnerWall>>;

const sizes = {
  GOLD: { box: "h-32 sm:h-36", img: "max-h-24 sm:max-h-28", grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" },
  SILVER: { box: "h-24", img: "max-h-16", grid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" },
  BRONZE: { box: "h-20", img: "max-h-12", grid: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" },
};

const badge = {
  GOLD: "bg-gradient-to-r from-[#f2d79d] to-[#dfab61] text-ink",
  SILVER: "bg-gradient-to-r from-[#eef1f3] to-[#c9d2d8] text-ink",
  BRONZE: "bg-gradient-to-r from-[#f1d5bd] to-[#c98f5f] text-ink",
};

/** Business partners' logos, grouped by tier. */
export function PartnerWall({ wall }: { wall: Wall }) {
  return (
    <div className="space-y-8">
      {wall.map((g) => (
        <div key={g.tier}>
          <p className={`badge mb-3 px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase ${badge[g.tier]}`}>✦ {g.label} partners</p>
          <ul className={`grid gap-3 ${sizes[g.tier].grid}`}>
            {g.partners.map((p) => {
              const logo = (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/partner-logo/${p.logoKey}`} alt={p.businessName} className={`w-auto max-w-[85%] object-contain ${sizes[g.tier].img}`} />
              );
              return (
                <li key={p.id}>
                  {p.website ? (
                    <Link
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      title={p.businessName}
                      className={`flex items-center justify-center rounded-2xl border border-dusk-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${sizes[g.tier].box}`}
                    >
                      {logo}
                    </Link>
                  ) : (
                    <div title={p.businessName} className={`flex items-center justify-center rounded-2xl border border-dusk-100 bg-white p-4 ${sizes[g.tier].box}`}>
                      {logo}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
