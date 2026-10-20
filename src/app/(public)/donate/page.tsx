import { PageHero } from "@/components/ui";
import { getActiveSeason } from "@/lib/season";
import { currentGiver } from "@/lib/auth";
import { cleanHandle, venmoProfileUrl } from "@/lib/venmo";
import { org, site } from "@/content/site";
import { DonateForm } from "./DonateForm";

export const metadata = { title: "Donate" };
export const dynamic = "force-dynamic";

export default async function Donate() {
  const season = await getActiveSeason();
  const giver = await currentGiver();
  const handle = season?.venmoHandle ? cleanHandle(season.venmoHandle) : null;

  return (
    <>
      <PageHero eyebrow="Give money" title="Make a gift">
        <p>
          Your gift fills in the gaps so every angel on our tree is covered and no child in {site.communities} is left out.
        </p>
      </PageHero>
      <section className="container-page mt-10 grid max-w-5xl gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="card">
          {season ? (
            <>
              <h2 className="text-2xl font-bold">Give a gift</h2>
              <p className="mt-1 text-sm text-black/65">
                Give by {handle ? (
                  <>
                    Venmo (
                    <a href={venmoProfileUrl(handle)} target="_blank" rel="noopener noreferrer" className="font-semibold">@{handle}</a>
                    ),{" "}
                  </>
                ) : null}
                check, or cash. Tell us about your gift below so we can thank you and add it to your giving record.
              </p>
              <div className="mt-5">
                <DonateForm
                  venmo={!!handle}
                  defaults={giver ? { firstName: giver.firstName, lastName: giver.lastName, email: giver.email } : undefined}
                />
              </div>
            </>
          ) : (
            <p className="text-black/70">Giving opens soon. Please check back.</p>
          )}
        </div>
        <div className="space-y-4">
          {season?.donationInstructions && (
            <div className="card bg-dusk-50">
              <h2 className="text-lg font-bold">Give by check or in person</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-black/75">{season.donationInstructions}</p>
            </div>
          )}
          <div className="card text-sm text-black/65">
            <h2 className="text-lg font-bold text-dusk-800">Your giving record</h2>
            <p className="mt-2">
              Once we see your gift arrive, we&rsquo;ll email you a receipt. Each January you&rsquo;ll also get a giving statement
              for the year. You can view both any time under <a href="/account">My Giving</a>.
            </p>
            {!org.taxExempt && (
              <p className="mt-2 text-xs text-black/50">
                {org.legalName} is not yet a 501(c)(3), so gifts are not tax-deductible at this time.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
