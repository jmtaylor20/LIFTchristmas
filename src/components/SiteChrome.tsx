import Link from "next/link";
import { brand, site } from "@/content/site";
import { BrandImage } from "./BrandImage";

export function Star({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} style={style} fill="currentColor">
      <path d="M12 1.5l2.6 7.1 7.4.3-5.8 4.6 2.1 7.2L12 16.6l-6.3 4.1 2.1-7.2L2 8.9l7.4-.3z" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="leading-none">
      <span className={`block font-display text-[13px] font-semibold tracking-[0.2em] uppercase ${light ? "text-white/85" : "text-dusk-700"}`}>
        LIFT Community
      </span>
      <span className={`-mt-1 block font-script text-3xl ${light ? "text-white" : "text-ink"}`}>Christmas</span>
    </span>
  );
}

export function SiteHeader() {
  const nav = [
    { href: "/give", label: "Give" },
    { href: "/angels", label: "Angel Tree" },
    { href: "/apply", label: "Apply for Help" },
    { href: "/about", label: "About" },
  ];
  return (
    <header className="no-print border-b border-black/5 bg-cream/90 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <BrandImage src={brand.angel} alt="LIFT Community Christmas angel" className="h-12 w-12" />
          <Wordmark />
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 font-medium text-dusk-800 no-underline hover:bg-dusk-50">
              {n.label}
            </Link>
          ))}
          <Link href="/account" className="btn-outline btn-sm ml-1">
            My Giving
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 bg-dusk-800 text-white/85">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <BrandImage src={brand.angel} alt="" className="h-14 w-14" />
            <Wordmark light />
          </div>
          <p className="mt-2 text-sm">Serving families in {site.region}.</p>
        </div>
        <blockquote className="text-sm italic">
          &ldquo;{site.giveVerse.text}&rdquo;
          <span className="mt-1 block not-italic text-gold-300">— {site.giveVerse.ref}</span>
        </blockquote>
        <div className="text-sm sm:text-right">
          <p>
            <a className="text-white" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          </p>
          {site.contactPhone && <p>{site.contactPhone}</p>}
          {site.facebookUrl && (
            <p><a className="text-white" href={site.facebookUrl}>Facebook</a></p>
          )}
          <p className="mt-3 text-xs text-white/50">
            <Link href="/admin" className="text-white/50">Ministry login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
