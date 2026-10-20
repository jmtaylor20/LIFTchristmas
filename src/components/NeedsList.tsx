import type { seasonNeeds } from "@/lib/needs";
import { money } from "@/lib/format";
import { ProgressBar } from "./ui";
import { RecognitionFields } from "./RecognitionFields";
import { reportNeedPurchase } from "@/app/(public)/give/actions";

type Need = Awaited<ReturnType<typeof seasonNeeds>>[number];

/** The Ministry Needs list on the Give page: buy it, then tell us you did. */
export function NeedsList({ needs, open, errorFor }: { needs: Need[]; open: boolean; errorFor?: string }) {
  const sorted = [...needs].sort((a, b) => Number(a.remaining === 0) - Number(b.remaining === 0));
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sorted.map((n) => {
        const done = n.remaining === 0;
        return (
          <li key={n.id} id={`need-${n.id}`} className={`rounded-2xl border border-dusk-100 bg-white p-4 ${done ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{n.name}</p>
                {n.details && <p className="text-xs text-black/55">{n.details}</p>}
              </div>
              {n.priceCents != null && <span className="text-sm font-semibold whitespace-nowrap text-dusk-700">{money(n.priceCents, { cents: true })}</span>}
            </div>
            <ProgressBar value={n.covered} max={n.quantity} className="mt-3" />
            <p className="mt-1 text-xs text-black/60">
              {done ? "✓ Covered. Thank you!" : n.quantity > 1 ? `${n.remaining} of ${n.quantity} still needed` : "Still needed"}
            </p>
            {!done && open && (
              <div className="mt-3 flex flex-wrap items-start gap-2">
                {n.url && (
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                    Buy {n.url.includes("amazon.") || n.url.includes("amzn.") ? "on Amazon" : "it"} ↗
                  </a>
                )}
                <details className="w-full" open={errorFor === n.id}>
                  <summary className="cursor-pointer text-sm font-semibold text-dusk-700">I bought this →</summary>
                  <form action={reportNeedPurchase.bind(null, n.id)} className="mt-3 grid gap-2 sm:grid-cols-2">
                    {errorFor === n.id && (
                      <p className="rounded-lg bg-star-50 px-3 py-2 text-xs text-star-800 sm:col-span-2">Please enter your name and email.</p>
                    )}
                    <input name="firstName" required placeholder="First name" className="input" />
                    <input name="lastName" required placeholder="Last name" className="input" />
                    <input name="email" type="email" required placeholder="Email" className="input" />
                    <label className="flex items-center gap-2 text-sm">
                      How many?
                      <input name="quantity" type="number" min={1} max={n.remaining} defaultValue={1} className="input w-20" />
                    </label>
                    <RecognitionFields className="sm:col-span-2" />
                    <button className="btn-green btn-sm sm:col-span-2 sm:justify-self-start">Let the ministry know</button>
                  </form>
                </details>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
