import Link from "next/link";
import { brand, site } from "@/content/site";
import { BrandImage } from "@/components/BrandImage";
import { Photo, ProgressBar } from "@/components/ui";
import { Star } from "@/components/SiteChrome";
import { Testimonials } from "@/components/Testimonials";
import { applicationsAreOpen, getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { seasonStats } from "@/lib/stats";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const season = await getActiveSeason();
  const stats = season ? await seasonStats(season.id) : null;
  const appsOpen = applicationsAreOpen(season);
  const covered = stats ? stats.angels.fullyCovered : 0;
  const withLists = stats ? stats.angels.total - stats.angels.noList : 0;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-dusk-600 via-dusk-500 to-dusk-500 text-white">
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 16 }).map((_, i) => (
            <Star
              key={i}
              className={`absolute ${i % 3 === 0 ? "h-5 w-5 text-copper-500" : "h-3 w-3 text-gold-300"} opacity-80`}
              style={{ left: `${(i * 53) % 97}%`, top: `${(i * 37) % 85}%` }}
            />
          ))}
          {/* Soft clouds along the bottom, like the logo artwork. */}
          <div className="absolute -bottom-24 left-[-10%] h-56 w-[60%] rounded-full bg-white/25 blur-3xl" />
          <div className="absolute -bottom-28 right-[-10%] h-56 w-[55%] rounded-full bg-white/25 blur-3xl" />
        </div>
        <div className="container-page relative grid items-center gap-6 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-300 uppercase">{site.communities} · Christmas {season?.year ?? ""}</p>
            <h1 className="mt-3 text-white">
              <span className="block font-display text-2xl font-semibold tracking-[0.15em] uppercase sm:text-3xl">LIFT Community</span>
              <span className="-mt-2 block font-script text-7xl leading-tight font-normal text-white sm:text-8xl">Christmas</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-white/90">
              Every child deserves a Christmas morning. {site.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/give" className="btn-primary px-7 py-3 text-base">Give a Gift</Link>
              <Link href="/angels" className="btn bg-white px-7 py-3 text-base text-dusk-800 hover:bg-cream">Sponsor an Angel</Link>
            </div>
            {appsOpen && (
              <p className="mt-5 text-sm text-white/85">
                Need help this Christmas?{" "}
                <Link href="/apply" className="font-semibold text-gold-300">Apply for sponsorship →</Link>
              </p>
            )}
          </div>
          <div className="flex justify-center">
            <BrandImage src={brand.angel} alt="Angel blowing a trumpet" className="h-72 w-72 drop-shadow-xl sm:h-96 sm:w-96" />
          </div>
        </div>
      </section>

      <section className="container-page -mt-8">
        <div className="card mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl text-dusk-800 italic">&ldquo;{site.verse.text}&rdquo;</p>
          <p className="mt-2 text-sm text-copper-700">{site.verse.ref}</p>
        </div>
      </section>

      {stats && withLists > 0 && (
        <section className="container-page mt-14">
          <div className="card mx-auto max-w-3xl">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-2xl font-bold">Christmas {season!.year} progress</h2>
              <p className="text-sm text-black/60">
                <strong className="text-dusk-800">{covered}</strong> of {withLists} angels fully sponsored
              </p>
            </div>
            <ProgressBar value={covered} max={withLists} className="mt-4" />
            {sponsoringIsOpen(season) && stats.angels.notCovered + stats.angels.partlyCovered > 0 && (
              <p className="mt-3 text-sm text-black/60">
                {stats.angels.notCovered + stats.angels.partlyCovered} angels are still waiting.{" "}
                <Link href="/angels" className="font-semibold text-copper-700">Find one to sponsor →</Link>
              </p>
            )}
          </div>
        </section>
      )}

      <section className="container-page mt-16">
        <p className="eyebrow text-center">Three ways to give</p>
        <h2 className="mt-2 text-center text-3xl font-bold sm:text-4xl">Every gift fits a budget</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <WayToGive
            title="Sponsor an Angel"
            body="Adopt a child's whole Christmas list as a family, class, or Sunday school — or choose just a few items you can cover."
            href="/angels"
            cta="Browse the Angel Tree"
          />
          <WayToGive
            title="Shop the Wish List"
            body="Buy items from our Amazon wish list and have them shipped straight to the ministry."
            href="/give#amazon"
            cta="Shop on Amazon"
          />
          <WayToGive
            title="Give Money"
            body="Any amount helps us fill in the gaps so no child on our list is left out."
            href="/donate"
            cta="Donate now"
          />
        </div>
        {season?.giftDeadline && (
          <p className="mt-6 text-center text-sm text-black/60">
            Gifts and donations are due by <strong>{formatDate(season.giftDeadline)}</strong>.
          </p>
        )}
      </section>

      <section className="container-page mt-20 grid items-center gap-10 md:grid-cols-2">
        <div className="aspect-[4/3]">
          <Photo {...site.photos.mission} />
        </div>
        <div>
          <p className="eyebrow">Our mission</p>
          <h2 className="mt-2 text-3xl font-bold">Giving because He first gave to us</h2>
          <div className="prose-lift mt-4">
            {site.mission.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href="/about" className="btn-outline">Learn more</Link>
        </div>
      </section>

      <section className="container-page mt-20">
        <div className="rounded-3xl bg-dusk-700 p-8 text-white sm:p-12">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Is your family in need this Christmas?</h2>
              <p className="mt-3 text-white/85">
                Parents and guardians in {site.communities} can apply for Christmas sponsorship for their children.
                Once approved, you&rsquo;ll make a wish list for each child and our community will do the rest.
              </p>
              {season?.applicationDeadline && (
                <p className="mt-3 text-sm text-white/75">Applications close {formatDate(season.applicationDeadline)}.</p>
              )}
            </div>
            <div className="md:text-right">
              {appsOpen ? (
                <Link href="/apply" className="btn bg-white px-7 py-3 text-base text-dusk-800 hover:bg-cream">Apply for Sponsorship</Link>
              ) : (
                <p className="text-white/85">Applications are currently closed. Please check back next season.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
    </>
  );
}

function WayToGive({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="card flex flex-col">
      <Star className="h-6 w-6 text-gold-500" />
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-black/70">{body}</p>
      <Link href={href} className="mt-5 font-semibold text-copper-700">{cta} →</Link>
    </div>
  );
}
