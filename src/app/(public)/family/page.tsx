import { PageHero } from "@/components/ui";
import { LangToggle } from "@/components/LangToggle";
import { dict, toLang } from "@/content/i18n";
import { resendFamilyLink } from "./actions";

export const metadata = { title: "Find my family's page" };

export default async function FamilyLookup({ searchParams }: { searchParams: Promise<{ sent?: string; lang?: string }> }) {
  const { sent, lang: l } = await searchParams;
  const lang = toLang(l);
  const t = dict[lang].lookup;
  return (
    <div lang={lang}>
      <PageHero eyebrow={t.eyebrow} title={t.title}>
        <p>{t.intro}</p>
        <div className="mt-4"><LangToggle lang={lang} path="/family" /></div>
      </PageHero>
      <section className="container-page mt-10 max-w-lg">
        {sent ? (
          <div className="card"><p>{t.sent}</p></div>
        ) : (
          <form action={resendFamilyLink} className="card space-y-4">
            <input type="hidden" name="lang" value={lang} />
            <label className="block">
              <span className="label">{t.field}</span>
              <input name="lookup" required className="input" />
            </label>
            <button className="btn-green">{t.button}</button>
          </form>
        )}
      </section>
    </div>
  );
}
