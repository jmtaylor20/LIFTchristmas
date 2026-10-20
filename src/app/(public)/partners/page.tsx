import { PageHero } from "@/components/ui";
import { PartnerWall } from "@/components/PartnerWall";
import { getActiveSeason, sponsoringIsOpen } from "@/lib/season";
import { partnerWall, TIERS } from "@/lib/recognition";
import { formatDate, money } from "@/lib/format";
import { site } from "@/content/site";
import { PartnerForm } from "./PartnerForm";

export const metadata = { title: "Become a Christmas Partner" };
export const dynamic = "force-dynamic";

export default async function Partners() {
  const season = await getActiveSeason();
  const wall = season ? await partnerWall(season.id) : [];
  const open = sponsoringIsOpen(season);

  return (
    <>
      <PageHero eyebrow="For businesses" title="Become a Christmas partner">
        <p>
          Local businesses make Christmas possible for children across {site.communities}. Partner with us this season and
          we&rsquo;ll proudly feature your logo on our home page.
        </p>
        {season?.giftDeadline && open && (
          <p className="mt-2 text-base">Partner gifts are due by <strong>{formatDate(season.giftDeadline)}</strong>.</p>
        )}
      </PageHero>

      <section className="container-page mt-10 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <h2 className="text-3xl">Partner levels</h2>
          {TIERS.map((t, i) => (
            <div key={t.tier} className="card flex items-start gap-4">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg ${
                  ["bg-gradient-to-br from-[#f2d79d] to-[#dfab61]", "bg-gradient-to-br from-[#eef1f3] to-[#c9d2d8]", "bg-gradient-to-br from-[#f1d5bd] to-[#c98f5f]"][i]
                }`}
              >
                ✦
              </span>
              <div>
                <h3 className="text-2xl">
                  {t.label} <span className="font-sans text-base text-black/55">{money(t.minCents)}{i === 0 ? " or more" : `–${money(TIERS[i - 1].minCents - 1, { cents: true })}`}</span>
                </h3>
                <p className="text-sm text-black/65">{t.perks}, plus a thank-you on our rotating sponsor list.</p>
              </div>
            </div>
          ))}
          <p className="text-sm text-black/60">
            Every dollar goes toward Christmas gifts for local children. Your level is based on the gift we receive this season.
          </p>
          {wall.length > 0 && (
            <div className="pt-4">
              <h2 className="mb-4 text-3xl">This year&rsquo;s partners</h2>
              <PartnerWall wall={wall} />
            </div>
          )}
        </div>

        <div className="card h-fit">
          <h2 className="text-2xl">Sign up</h2>
          {season && open ? (
            <div className="mt-4">
              <PartnerForm venmo={!!season.venmoHandle} />
            </div>
          ) : (
            <p className="mt-2 text-black/65">
              Partner sign-up opens when our Christmas season begins. Questions? Email{" "}
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
