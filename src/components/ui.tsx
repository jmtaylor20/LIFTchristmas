import { Star } from "./SiteChrome";

export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`h-full w-full rounded-2xl object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex h-full min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dusk-200 bg-dusk-50 text-center text-dusk-600 ${className}`}
    >
      <Star className="h-8 w-8 text-gold-400" />
      <span className="mt-2 text-sm font-medium">Photo coming soon</span>
      <span className="text-xs">{alt}</span>
    </div>
  );
}

export function ProgressBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-black/10 ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-dusk-500 to-gold-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "warn" | "error"; children: React.ReactNode }) {
  const tones = {
    info: "bg-dusk-50 text-dusk-800 border-dusk-100",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
    error: "bg-star-50 text-star-800 border-star-100",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-dusk-100 bg-dusk-50">
      <Star className="pointer-events-none absolute -top-6 right-[8%] h-28 w-28 text-white/70" />
      <Star className="pointer-events-none absolute right-[22%] bottom-6 h-6 w-6 text-gold-400/70" />
      <div className="container-page relative py-12 sm:py-16">
        {eyebrow && (
          <p className="eyebrow">
            <span aria-hidden className="mr-1.5 text-gold-500">✦</span>
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.1] sm:text-5xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-black/70">{children}</div>}
      </div>
    </section>
  );
}

export function Field({
  label,
  name,
  hint,
  className = "",
  ...props
}: { label: string; name: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">
        {label}
        {props.required && <span className="text-star-700"> *</span>}
      </span>
      <input name={name} className="input" {...props} />
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  hint,
  className = "",
  ...props
}: { label: string; name: string; hint?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">
        {label}
        {props.required && <span className="text-star-700"> *</span>}
      </span>
      <textarea name={name} className="input min-h-24" {...props} />
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  className = "",
  ...props
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">
        {label}
        {props.required && <span className="text-star-700"> *</span>}
      </span>
      <select name={name} className="input" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
