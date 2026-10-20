import { PageHero, Notice } from "@/components/ui";
import { getActiveSeason } from "@/lib/season";
import { stripeEnabled } from "@/lib/stripe";
import { currentGiver } from "@/lib/auth";
import { org, site } from "@/content/site";
import { DonateForm } from "./DonateForm";

export const metadata = { title: "Donate" };
export const dynamic = "force-dynamic";

export default async function Donate({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const { canceled } = await searchParams;
  const season = await getActiveSeason();
  const giver = await currentGiver();
  const online = stripeEnabled();

  return (
    <>
      <PageHero eyebrow="Give money" title="Make a gift">
        <p>
          Your gift fills in the gaps so every angel on our tree is covered and no child in {site.communities} is left out.
        </p>
      </PageHero>
      <section className="container-page mt-10 grid max-w-5xl gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="card">
          {canceled && <div className="mb-4"><Notice tone="warn">Your payment was canceled. No charge was made.</Notice></div>}
          {online && season ? (
            <DonateForm
              defaults={giver ? { firstName: giver.firstName, lastName: giver.lastName, email: giver.email } : undefined}
            />
          ) : (
            <p className="text-black/70">Online giving is coming soon. In the meantime, please see the other ways to give.</p>
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
              You&rsquo;ll get an emailed receipt right away, and a year-end giving statement each January for your taxes.
              View them any time under <a href="/account">My Giving</a>.
            </p>
            {org.ein && <p className="mt-2">{org.legalName} · EIN {org.ein}</p>}
          </div>
        </div>
      </section>
    </>
  );
}
