/**
 * A slowly scrolling "thank you" band of giver names. The list is rendered
 * twice so the loop is seamless; people who prefer reduced motion get a
 * static, wrapped list instead.
 */
export function ThankYouTicker({ names, year }: { names: string[]; year: number }) {
  if (names.length === 0) return null;
  const seconds = Math.max(30, names.length * 4);
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-8 pr-8">
      {names.map((n, i) => (
        <li key={`${n}-${i}`} className="flex items-center gap-8 whitespace-nowrap">
          <span className="font-display text-lg text-white">{n}</span>
          <span aria-hidden className="text-gold-300">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={`Thank you to our Christmas ${year} givers`} className="overflow-hidden bg-dusk-700 py-4 text-white">
      <div className="container-page mb-2 flex items-center gap-3">
        <p className="text-xs font-bold tracking-[0.18em] whitespace-nowrap text-gold-300 uppercase">Thank you to our {year} givers</p>
        <span className="h-px flex-1 bg-white/15" />
      </div>
      <div className="group relative flex [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:hidden">
        <div className="flex animate-[lift-ticker_var(--ticker-duration)_linear_infinite] group-hover:[animation-play-state:paused]" style={{ ["--ticker-duration" as string]: `${seconds}s` }}>
          {row(false)}
          {row(true)}
        </div>
      </div>
      <p className="container-page hidden text-sm leading-relaxed text-white/90 motion-reduce:block">{names.join(" ✦ ")}</p>
    </section>
  );
}
