import Image from "next/image";
import Link from "next/link";
import { brand, site } from "@/content/site";
import { ProgressBar } from "@/components/ui";
import { Star } from "@/components/SiteChrome";
import { Testimonials } from "@/components/Testimonials";
import { applicationsAreOpen, getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { seasonStats } from "@/lib/stats";
import { formatDate, money } from "@/lib/format";
import { partnerWall, tickerNames } from "@/lib/recognition";
import { PartnerWall } from "@/components/PartnerWall";
import { ThankYouTicker } from "@/components/ThankYouTicker";

export const dynamic = "force-dynamic";

export default async function Home() {
  const season = await getActiveSeason();
  const [stats, wall, names] = season
    ? await Promise.all([seasonStats(season.id), partnerWall(season.id), tickerNames(season.id)])
    : [null, [], []];
  const appsOpen = applicationsAreOpen(season);
  const giftsOpen = sponsoringIsOpen(season);
  const covered = stats ? stats.angels.fullyCovered : 0;
  const withLists = stats ? stats.angels.total - stats.angels.noList : 0;
  const waiting = stats ? stats.angels.notCovered + stats.angels.partlyCovered : 0;

  return (
    <>
      {/* Hero: the artwork's sky is the same blue as the section, so it sits seamlessly on the right. */}
      <section className="relative overflow-hidden bg-dusk-500 text-white" aria-labelledby="hero-title">
        <div className="container-page grid items-center md:min-h-[590px] md:grid-cols-[47%_53%]">
          <div className="relative z-10 pt-14 pb-10 md:py-20 md:pr-6">
            <p className="text-xs font-bold tracking-[0.18em] text-gold-300 uppercase">
              <span aria-hidden className="mr-2 text-sm">✦</span>
              {site.communities}
              {season && <> · Christmas {season.year}</>}
            </p>
            <h1 id="hero-title" className="mt-5 text-[clamp(3rem,5.4vw,5.4rem)] leading-[1.06] tracking-[-0.03em] text-white">
              A little kindness can <em className="text-gold-300">lift</em> a Christmas.
            </h1>
            <p className="mt-6 max-w-[30rem] text-lg text-dusk-50">
              LIFT Community Christmas brings neighbors together to care for local children and families, sharing the
              love of Christ one gift at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/give" className="btn bg-gold-300 px-6 py-3.5 text-base text-ink shadow-sm hover:-translate-y-0.5 hover:bg-[#ffe7ae]">
                Find your way to help <span aria-hidden>↗</span>
              </Link>
              <Link href="/angels" className="btn border border-white/70 px-6 py-3.5 text-base text-white hover:bg-white hover:text-dusk-700">
                Sponsor an angel
              </Link>
            </div>
            {appsOpen && (
              <p className="mt-6 text-sm text-dusk-50">
                Need help this Christmas?{" "}
                <Link href="/apply" className="font-semibold text-white underline decoration-gold-300 underline-offset-4">
                  Apply for sponsorship
                </Link>
                <span aria-hidden className="mx-2 text-white/50">·</span>
                <Link href="/apply?lang=es" lang="es" className="font-semibold text-white underline decoration-gold-300 underline-offset-4">
                  Solicite en español
                </Link>
              </p>
            )}
          </div>
          <div className="self-end">
            <Image
              src={brand.full}
              alt="Community Christmas artwork: a blue-robed angel playing a trumpet beneath gold stars"
              width={1206}
              height={1092}
              priority
              sizes="(min-width: 768px) 53vw, 100vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {season && <ThankYouTicker names={names} year={season.year} />}

      {stats && withLists > 0 && (
        <section className="container-page mt-10">
          <div className="card mx-auto max-w-3xl">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-2xl">Christmas {season!.year} so far</h2>
              <p className="text-sm text-black/60">
                <strong className="text-dusk-700">{covered}</strong> of {withLists} angels fully sponsored
              </p>
            </div>
            <ProgressBar value={covered} max={withLists} className="mt-4" />
            {giftsOpen && waiting > 0 && (
              <p className="mt-3 text-sm text-black/60">
                {waiting} angel{waiting === 1 ? " is" : "s are"} still waiting.{" "}
                <Link href="/angels" className="font-semibold text-dusk-700">Find one to sponsor →</Link>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="container-page py-16 md:py-24" aria-labelledby="mission-title">
        <div className="grid gap-8 md:grid-cols-2 md:gap-[10%]">
          <div>
            <p className="eyebrow">The heart behind LIFT</p>
            <h2 id="mission-title" className="mt-4 text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.12]">
              Making room for joy, together.
            </h2>
          </div>
          <div className="space-y-4 pt-1 text-[1.06rem] leading-relaxed text-black/70">
            {site.mission.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="border-l-2 border-gold-500 pl-4 font-display text-dusk-700 italic">
              &ldquo;{site.verse.text}&rdquo; <span className="font-sans text-sm not-italic text-black/50">{site.verse.ref}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Ways to help */}
      <section id="ways-to-help" className="bg-dusk-50 py-20 md:py-24" aria-labelledby="help-title">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Share the season</p>
            <h2 id="help-title" className="mt-4 text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.12]">There is a place for you here.</h2>
            <p className="mt-4 text-black/65">
              Every gift fits a budget, whether you take on a child&rsquo;s whole list or a single pair of socks.
              {season?.giftDeadline && <> Gifts and donations are due by <strong className="text-ink">{formatDate(season.giftDeadline)}</strong>.</>}
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <HelpCard
              n="01"
              icon="✦"
              title="Sponsor an angel"
              body={`Take on a child's whole wish list as a family, class, or business${season?.perChildBudgetCents ? ` (about ${money(season.perChildBudgetCents)})` : ""}, or choose just a few gifts.`}
              href="/angels"
              cta="Visit the Angel Tree"
            />
            <HelpCard
              n="02"
              icon="♡"
              title="Shop from anywhere"
              body="Order online from Amazon or any store and ship it to us, labeled for your angel, or shop our Amazon wish list."
              href="/give"
              cta="See how it works"
            />
            <HelpCard
              n="03"
              icon="✳"
              title="Give what you can"
              body={`Give by Venmo${season?.venmoHandle ? ` (@${season.venmoHandle.replace(/^@/, "")})` : ""}, check, or cash. Gifts of any size help us fill in the gaps so no child is left out.`}
              href="/donate"
              cta="Make a gift"
            />
          </div>
        </div>
      </section>

      {/* Business partners */}
      <section className="container-page py-20 md:py-24" aria-labelledby="partners-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow">Our Christmas partners</p>
            <h2 id="partners-title" className="mt-4 text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.12]">
              Local businesses lifting local families
            </h2>
          </div>
          <Link href="/partners" className="btn-outline">Become a partner →</Link>
        </div>
        <div className="mt-8">
          {wall.length > 0 ? (
            <PartnerWall wall={wall} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Gold", "$1,000+"],
                ["Silver", "$500+"],
                ["Bronze", "$100+"],
              ].map(([t, a]) => (
                <Link
                  key={t}
                  href="/partners"
                  className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dusk-200 bg-white text-center no-underline transition hover:border-dusk-500"
                >
                  <span className="font-display text-2xl text-dusk-700">{t} partner</span>
                  <span className="text-sm text-black/55">{a} · Your logo here</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Angel */}
      <section className="bg-white py-20 md:py-24" aria-labelledby="angel-title">
        <div className="container-page grid items-center gap-10 md:grid-cols-[44%_1fr] md:gap-[10%]">
          <div className="mx-auto w-full max-w-[420px]">
            <Image
              src={brand.angel}
              alt="A small angel in a pale blue robe playing a trumpet"
              width={828}
              height={938}
              sizes="(min-width: 768px) 420px, 80vw"
              className="h-auto w-full mix-blend-multiply"
            />
          </div>
          <div className="max-w-lg">
            <p className="eyebrow">A season of hope</p>
            <h2 id="angel-title" className="mt-4 text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.12]">Let kindness lead the way.</h2>
            <p className="mt-5 text-[1.06rem] leading-relaxed text-black/70">
              One gift, one caring neighbor at a time, together we can lift up our community this Christmas and remind
              every child that they are seen, remembered, and loved.
            </p>
            <blockquote className="mt-6 rounded-2xl bg-dusk-50 p-5 font-display text-dusk-700 italic">
              &ldquo;{site.giveVerse.text}&rdquo;
              <span className="mt-2 block font-sans text-sm not-italic text-black/50">{site.giveVerse.ref}</span>
            </blockquote>
            <Link href="/angels" className="mt-6 inline-block font-semibold text-dusk-700 no-underline hover:underline">
              Meet the angels <span aria-hidden className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Families */}
      <section className="container-page pt-20 md:pt-24" aria-labelledby="families-title">
        <div className="relative overflow-hidden rounded-3xl bg-dusk-500 p-8 text-white sm:p-12">
          <Star className="pointer-events-none absolute -right-6 -bottom-8 h-48 w-48 text-white/10" />
          <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-gold-300 uppercase">For families</p>
              <h2 id="families-title" className="mt-3 text-3xl text-white sm:text-4xl">Is your family in need this Christmas?</h2>
              <p className="mt-3 text-dusk-50">
                Parents and guardians in {site.communities} can apply for Christmas sponsorship. Once approved, you&rsquo;ll make a
                wish list for each child, and our community will do the rest.
              </p>
              {season?.applicationDeadline && appsOpen && (
                <p className="mt-3 text-sm text-dusk-100">Applications close {formatDate(season.applicationDeadline)}.</p>
              )}
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              {appsOpen ? (
                <>
                  <Link href="/apply" className="btn bg-gold-300 px-6 py-3.5 text-base text-ink hover:bg-[#ffe7ae]">Apply for sponsorship</Link>
                  <Link href="/apply?lang=es" lang="es" className="text-sm font-semibold text-white underline decoration-gold-300 underline-offset-4">
                    ¿Necesita ayuda? Solicite en español
                  </Link>
                </>
              ) : (
                <p className="text-dusk-50">Applications are closed right now. Please check back next season.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Connect */}
      <section className="flush-end mt-24 bg-dusk-700 py-20 text-center text-white" aria-labelledby="connect-title">
        <div className="container-page max-w-3xl">
          <span aria-hidden className="text-3xl text-gold-300">✦</span>
          <p className="mt-3 text-xs font-bold tracking-[0.18em] text-gold-300 uppercase">{site.motto}</p>
          <h2 id="connect-title" className="mt-3 text-[clamp(2.2rem,4vw,3.4rem)] leading-tight text-white">
            Let&rsquo;s lift the season together.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-dusk-100">
            Questions about the angel tree, giving, or how your church or business can help? We&rsquo;d love to hear from you.
          </p>
          <a href={`mailto:${site.contactEmail}`} className="btn mt-8 bg-gold-300 px-6 py-3.5 text-base text-ink hover:bg-[#ffe7ae]">
            Email the LIFT team <span aria-hidden>↗</span>
          </a>
        </div>
      </section>
    </>
  );
}

function HelpCard({ n, icon, title, body, href, cta }: { n: string; icon: string; title: string; body: string; href: string; cta: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-72 flex-col rounded-2xl border border-dusk-100 bg-white p-7 no-underline shadow-[0_12px_35px_rgb(41_79_101/0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgb(41_79_101/0.12)]"
    >
      <span className="text-xs font-bold tracking-[0.12em] text-dusk-500">{n}</span>
      <span aria-hidden className="mt-6 text-3xl leading-none text-[#bc8645]">{icon}</span>
      <h3 className="mt-3 text-[1.7rem] leading-tight">{title}</h3>
      <p className="mt-2 flex-1 text-[0.95rem] text-black/65">{body}</p>
      <span className="mt-5 text-sm font-semibold text-dusk-700 group-hover:underline">
        {cta} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
