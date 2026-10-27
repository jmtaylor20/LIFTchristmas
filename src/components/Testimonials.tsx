import { site } from "@/content/site";

export function Testimonials() {
  // Show only real stories. Until the first one is filled in, leave the section
  // out rather than show a row of "coming soon" cards.
  const stories = site.testimonials.filter((t) => !t.placeholder);
  if (stories.length === 0) return null;

  return (
    <section className="container-page mt-20 md:mt-24">
      <p className="eyebrow text-center">Stories of Christmas joy</p>
      <h2 className="mt-3 text-center text-[clamp(2.2rem,4vw,3.2rem)] leading-tight">What our neighbors are saying</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {stories.map((t, i) => (
          <figure key={i} className="card">
            <blockquote className="font-display text-lg leading-relaxed text-dusk-700">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 text-sm text-black/60">
              — {t.name}
              {t.role && <span className="text-black/40">, {t.role}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
