import Link from "next/link";
import { PageHero } from "@/components/ui";
import { dict, toLang } from "@/content/i18n";
import { db } from "@/lib/db";

export const metadata = { title: "Application received", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Thanks({ searchParams }: { searchParams: Promise<{ t?: string; lang?: string }> }) {
  const { t: token, lang: l } = await searchParams;
  const lang = toLang(l);
  const t = dict[lang].thanks;
  // The automatic check runs as soon as they apply, so say how it went.
  const app = token ? await db.application.findUnique({ where: { accessToken: token }, select: { status: true, missingInfo: true } }) : null;
  const state = app?.status === "APPROVED" ? "approved" : app?.status === "PENDING" && app.missingInfo.length > 0 ? "needInfo" : "received";
  const copy =
    state === "approved"
      ? { title: t.approvedTitle, intro: t.approvedIntro, body: t.approvedBody }
      : state === "needInfo"
        ? { title: t.needInfoTitle, intro: t.needInfoIntro, body: t.needInfoBody }
        : { title: t.title, intro: t.intro, body: t.body };
  return (
    <div lang={lang}>
      <PageHero eyebrow={t.eyebrow} title={copy.title}>
        <p>{copy.intro}</p>
      </PageHero>
      <section className="container-page mt-10 max-w-2xl">
        <div className="card space-y-4">
          <p>{copy.body}</p>
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
