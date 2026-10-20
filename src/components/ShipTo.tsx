import { shipToLines } from "@/lib/shipping";

export function ShipTo({ angelNumber, address }: { angelNumber: number | null; address: string }) {
  return (
    <div>
      <div className="rounded-xl border-2 border-dashed border-dusk-500 bg-white px-4 py-3 font-mono text-sm leading-relaxed">
        {shipToLines(angelNumber, address).map((l, i) => (
          <div key={i} className={i === 0 ? "font-bold" : ""}>{l}</div>
        ))}
      </div>
      <p className="mt-2 text-xs text-black/60">
        Use exactly this name line, &ldquo;LIFT Christmas - Angel #{angelNumber}&rdquo;, so we know which child the box is for. Choose
        &ldquo;gift receipt / hide prices&rdquo; if offered, and please don&rsquo;t gift-wrap.
      </p>
    </div>
  );
}
