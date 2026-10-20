"use client";

import { useActionState, useState } from "react";
import { startDonation, type DonateState } from "./actions";

const presets = [25, 50, 100, 150, 250];

export function DonateForm({ defaults }: { defaults?: { firstName: string; lastName: string; email: string } }) {
  const [state, action, pending] = useActionState<DonateState, FormData>(startDonation, {});
  const [amount, setAmount] = useState("50");

  return (
    <form action={action} className="space-y-5">
      {state.error && <p className="rounded-lg bg-copper-50 px-3 py-2 text-sm text-copper-800">{state.error}</p>}
      <div>
        <span className="label">Amount</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setAmount(String(p))}
              className={`btn ${amount === String(p) ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/15"}`}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg text-black/50">$</span>
          <input name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="input max-w-40" required />
        </div>
        <p className="hint">$150 sponsors about one child&rsquo;s whole Christmas.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="firstName" required placeholder="First name" defaultValue={defaults?.firstName} className="input" />
        <input name="lastName" required placeholder="Last name" defaultValue={defaults?.lastName} className="input" />
        <input name="email" type="email" required placeholder="Email (for your receipt)" defaultValue={defaults?.email} className="input sm:col-span-2" />
        <input name="note" placeholder="In honor of… (optional)" className="input sm:col-span-2" />
      </div>
      <button className="btn-primary w-full py-3 text-base" disabled={pending}>
        {pending ? "Opening secure checkout…" : `Give $${amount || "0"}`}
      </button>
      <p className="text-center text-xs text-black/50">Payments are processed securely by Stripe.</p>
    </form>
  );
}
