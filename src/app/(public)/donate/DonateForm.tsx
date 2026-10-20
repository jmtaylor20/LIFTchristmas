"use client";

import { useActionState, useState } from "react";
import { reportGift, type DonateState } from "./actions";
import { RecognitionFields } from "@/components/RecognitionFields";

const presets = [25, 50, 100, 150, 250];

const methods = [
  { value: "VENMO", label: "Venmo" },
  { value: "CHECK", label: "Check" },
  { value: "CASH", label: "Cash" },
] as const;

export function DonateForm({
  defaults,
  venmo,
}: {
  defaults?: { firstName: string; lastName: string; email: string; anonymous?: boolean; displayName?: string | null };
  venmo: boolean;
}) {
  const [state, action, pending] = useActionState<DonateState, FormData>(reportGift, {});
  const [amount, setAmount] = useState("50");
  const [method, setMethod] = useState<string>(venmo ? "VENMO" : "CHECK");

  return (
    <form action={action} className="space-y-5">
      {state.error && <p className="rounded-lg bg-star-50 px-3 py-2 text-sm text-star-800">{state.error}</p>}
      <div>
        <span className="label">How would you like to give?</span>
        <div className="flex flex-wrap gap-2">
          {methods
            .filter((m) => venmo || m.value !== "VENMO")
            .map((m) => (
              <label
                key={m.value}
                className={`btn cursor-pointer ${method === m.value ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/15"}`}
              >
                <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="sr-only" />
                {m.label}
              </label>
            ))}
        </div>
      </div>
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
        <input name="email" type="email" required placeholder="Email (for your receipt)" defaultValue={defaults?.email} className="input" />
        {method === "VENMO" ? (
          <input name="venmoName" placeholder="Your Venmo name (helps us match it)" className="input" />
        ) : (
          <span />
        )}
        <input name="note" placeholder="In honor of… (optional)" className="input sm:col-span-2" />
        <RecognitionFields className="sm:col-span-2" defaults={defaults} />
      </div>
      <button className="btn-primary w-full py-3 text-base" disabled={pending}>
        {pending ? "One moment…" : method === "VENMO" ? `Continue to Venmo: $${amount || "0"}` : `Give $${amount || "0"} by ${method === "CHECK" ? "check" : "cash"}`}
      </button>
    </form>
  );
}
