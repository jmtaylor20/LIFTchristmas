import Link from "next/link";
import { PageHero } from "@/components/ui";
import { dict, toLang } from "@/content/i18n";

export const metadata = { title: "Application received" };

export default async function Thanks({ searchParams }: { searchParams: Promise<{ t?: string; lang?: string }> }) {
  const { t: token, lang: l } = await searchParams;
  const lang = toLang(l);
  const t = dict[lang].thanks;
  return (
    <div lang={lang}>
      <PageHero eyebrow={t.eyebrow} title={t.title}>
        <p>{t.intro}</p>
      </PageHero>
      <section className="container-page mt-10 max-w-2xl">
        <div className="card space-y-4">
          <p>{t.body}</p>
          {token && (
            <>
              <p className="text-sm text-black/60">{t.bookmark}</p>
              <Link href={`/family/${token}`} className="btn-green">{t.go}</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
