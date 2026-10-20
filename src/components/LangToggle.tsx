import Link from "next/link";
import { dict, type Lang } from "@/content/i18n";

/** "Español" / "English" switch for family-facing pages. */
export function LangToggle({ lang, path }: { lang: Lang; path: string }) {
  const t = dict[lang];
  const sep = path.includes("?") ? "&" : "?";
  return (
    <Link href={`${path}${sep}lang=${t.switchLang}`} className="btn-outline btn-sm" hrefLang={t.switchLang} lang={t.switchLang}>
      🌐 {t.switchTo}
    </Link>
  );
}
