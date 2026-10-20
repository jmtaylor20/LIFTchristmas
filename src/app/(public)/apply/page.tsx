import Link from "next/link";
import { PageHero, Notice } from "@/components/ui";
import { applicationsAreOpen, getActiveSeason } from "@/lib/season";
import { formatDate } from "@/lib/format";
import { site } from "@/content/site";
import { ApplicationForm } from "./ApplicationForm";

export const metadata = { title: "Apply for Christmas Sponsorship" };
export const dynamic = "force-dynamic";

export default async function Apply() {
  const season = await getActiveSeason();
  const open = applicationsAreOpen(season);

  return (
    <>
      <PageHero eyebrow={`Christmas ${season?.year ?? ""}`} title="Apply for Christmas sponsorship">
        <p>
          For families living in {site.communities} who need help providing Christmas for their children this year.
          Please fill out one application per household.
        </p>
        {season?.applicationDeadline && open && (
          <p className="mt-2 text-base">
            Applications close <strong>{formatDate(season.applicationDeadline)}</strong>.
          </p>
        )}
      </PageHero>
      <section className="container-page mt-10 max-w-3xl">
        {open ? (
          <>
            <Notice>
              Already applied? Use the private link we emailed you, or{" "}
              <Link href="/family" className="font-semibold">get your link again</Link>.
            </Notice>
            <div className="mt-6">
              <ApplicationForm />
            </div>
          </>
        ) : (
          <div className="card text-center">
            <h2 className="text-2xl font-bold">Applications are closed</h2>
            <p className="mt-2 text-black/70">
              {season ? "The application period for this season has ended." : "Applications haven't opened yet."} If you
              have already applied, you can <Link href="/family" className="font-semibold text-copper-700">check your status here</Link>.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
