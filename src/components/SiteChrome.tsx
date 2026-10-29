import Link from "next/link";
import { site } from "@/content/site";
import { cleanHandle, venmoPayUrl } from "@/lib/venmo";

export function Star({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} style={style} fill="currentColor">
      <path d="M12 1.5l2.6 7.1 7.4.3-5.8 4.6 2.1 7.2L12 16.6l-6.3 4.1 2.1-7.2L2 8.9l7.4-.3z" />
    </svg>
  );
}

/** Live-text "LIFT ✦ | Community Christmas" wordmark from the brand kit. */
export function Wordmark({ tone = "light" }: { tone?: "light" | "dark" }) {
  const light = tone === "light";
  return (
    <span className="inline-flex items-center gap-3 leading-none">
      <span className={`font-display text-[2rem] font-semibold tracking-wide ${light ? "text-white" : "text-dusk-700"}`}>
        LIFT<span className={`ml-0.5 align-top text-[0.55em] ${light ? "text-gold-300" : "text-gold-500"}`}>✦</span>
      </span>
      <span
        className={`border-l pl-3 text-[0.72rem] leading-tight font-semibold tracking-[0.1em] uppercase ${light ? "border-white/50 text-white" : "border-dusk-700/30 text-dusk-700"}`}
      >
        Community
        <br />
        Christmas
      </span>
    </span>
  );
}

const nav = [
  { href: "/angels", label: "Angel Tree" },
  { href: "/give", label: "Ways to give" },
  { href: "/apply", label: "Apply for help" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="no-print bg-dusk-500 text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
        <Link href="/" className="no-underline" aria-label={`${site.fullName} home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm font-semibold sm:w-auto sm:justify-end">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-white no-underline decoration-gold-300 underline-offset-[6px] hover:underline">
              {n.label}
            </Link>
          ))}
          <Link href="/account" className="rounded-full border border-white/60 px-4 py-2 text-white no-underline transition hover:bg-white hover:text-dusk-700">
            My giving
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** `venmo`: the season's Venmo username, shown under "Get in touch" when set. */
export function SiteFooter({ venmo }: { venmo?: string | null }) {
  return (
    <footer className="no-print">
      <div className="bg-dusk-700 text-white">
        <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm text-dusk-100">
              A Christ-centered angel tree ministry serving children and families in {site.region}.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={site.ministryLogo} alt={`${site.ministry}: ${site.ministryMotto}`} className="h-16 w-auto" />
              <p className="text-xs leading-snug text-dusk-100">
                A ministry of <strong className="text-white">{site.ministry}</strong>
                <br />
                {site.ministryMotto}
              </p>
            </div>
          </div>
          <blockquote className="font-display text-base text-white/90 italic">
            &ldquo;{site.giveVerse.text}&rdquo;
            <span className="mt-2 block font-sans text-sm not-italic text-gold-300">{site.giveVerse.ref}</span>
          </blockquote>
          <div className="text-sm md:text-right">
            <p className="text-xs font-bold tracking-[0.18em] text-gold-300 uppercase">Get in touch</p>
            <p className="mt-2">
              <a className="text-white" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            </p>
            {site.contactPhone && (
              <p>
                <a className="text-dusk-100" href={`tel:${site.contactPhone.replace(/\D/g, "")}`}>{site.contactPhone}</a>
              </p>
            )}
            {venmo && (
              <p>
                <a className="text-white" href={venmoPayUrl(venmo, null, "LIFT Community Christmas")} target="_blank" rel="noopener noreferrer">
                  Venmo @{cleanHandle(venmo)}
                </a>
              </p>
            )}
            {site.facebookUrl && (
              <p><a className="text-white" href={site.facebookUrl}>Facebook</a></p>
            )}
            <ul className="mt-4 space-y-1 text-dusk-100">
              <li><Link href="/apply?lang=es" className="text-dusk-100" lang="es">Solicitud en español</Link></li>
              <li><Link href="/family" className="text-dusk-100">Families: find my page</Link></li>
              <li><Link href="/partners" className="text-dusk-100">Business partners</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-dusk-900 text-dusk-100">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs">
          <span>
            <strong className="text-white">LIFT <span className="text-gold-300">✦</span> Community Christmas</strong> · {site.motto}
          </span>
          <Link href="/admin" className="text-dusk-100/70">Ministry login</Link>
        </div>
      </div>
    </footer>
  );
}
