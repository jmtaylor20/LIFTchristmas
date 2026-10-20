import Link from "next/link";
import { PageHero, Notice } from "@/components/ui";
import { LangToggle } from "@/components/LangToggle";
import { applicationsAreOpen, getActiveSeason } from "@/lib/season";
import { dict, longDate, toLang } from "@/content/i18n";
import { site } from "@/content/site";
import { ApplicationForm } from "./ApplicationForm";

export const metadata = { title: "Apply for Christmas Sponsorship" };
export const dynamic = "force-dynamic";

export default async function Apply({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = toLang((await searchParams).lang);
  const t = dict[lang];
  const season = await getActiveSeason();
  const open = applicationsAreOpen(season);

  return (
    <div lang={lang}>
      <PageHero eyebrow={t.christmas(season?.year ?? "")} title={t.apply.title}>
        <p>{t.apply.intro(site.communities)}</p>
        {season?.applicationDeadline && open && (
          <p className="mt-2 text-base">
            {t.apply.closes} <strong>{longDate(season.applicationDeadline, lang)}</strong>.
          </p>
        )}
        <div className="mt-4">
          <LangToggle lang={lang} path="/apply" />
        </div>
      </PageHero>
      <section className="container-page mt-10 max-w-3xl">
        {open ? (
          <>
            <Notice>
              {t.apply.alreadyApplied}{" "}
              <Link href={`/family?lang=${lang}`} className="font-semibold">{t.apply.getLinkAgain}</Link>.
            </Notice>
            <div className="mt-6">
              <ApplicationForm lang={lang} />
            </div>
          </>
        ) : (
          <div className="card text-center">
            <h2 className="text-2xl font-bold">{t.apply.closedTitle}</h2>
            <p className="mt-2 text-black/70">
              {season ? t.apply.closedEnded : t.apply.closedNoSeason} {t.apply.closedCheck}{" "}
              <Link href={`/family?lang=${lang}`} className="font-semibold text-copper-700">{t.apply.checkStatus}</Link>.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
