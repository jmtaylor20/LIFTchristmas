import { site } from "@/content/site";
import { Star } from "./SiteChrome";

export function Testimonials() {
  return (
    <section className="container-page mt-20">
      <p className="eyebrow text-center">Stories of Christmas joy</p>
      <h2 className="mt-2 text-center text-3xl font-bold">What our community is saying</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {site.testimonials.map((t, i) =>
          t.placeholder ? (
            <figure key={i} className="card flex min-h-44 flex-col items-center justify-center border-dashed text-center text-black/45">
              <Star className="h-6 w-6 text-gold-400" />
              <figcaption className="mt-2 text-sm">A {t.role.toLowerCase()} story is coming soon.</figcaption>
            </figure>
          ) : (
            <figure key={i} className="card">
              <blockquote className="font-display text-lg leading-relaxed text-dusk-800">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm text-black/60">
                — {t.name}
                {t.role && <span className="text-black/40">, {t.role}</span>}
              </figcaption>
            </figure>
          ),
        )}
      </div>
    </section>
  );
}
