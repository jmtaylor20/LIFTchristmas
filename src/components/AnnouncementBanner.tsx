import Link from "next/link";

/** The season's announcement, shown across the top of every public page when set. */
export function AnnouncementBanner({ text, link }: { text?: string | null; link?: string | null }) {
  if (!text) return null;
  return (
    <div className="no-print bg-dusk-700 px-4 py-3 text-center text-sm text-white sm:text-base">
      <span className="mr-1 text-gold-300" aria-hidden>
        ✦
      </span>
      {text}
      {link && (
        <Link href={link} className="ml-3 inline-block rounded-full bg-star-500 px-3 py-0.5 text-sm font-semibold text-ink no-underline">
          {link.startsWith("/apply") ? "Apply now" : "Learn more"} →
        </Link>
      )}
    </div>
  );
}
