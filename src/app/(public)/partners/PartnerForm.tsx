"use client";

import { useActionState, useState, useTransition } from "react";
import { becomePartner, type PartnerState } from "./actions";
import { RecognitionFields } from "@/components/RecognitionFields";
import { shrinkImage } from "@/lib/shrinkImage";

const levels = [
  { amount: "1000", label: "Gold", sub: "$1,000+" },
  { amount: "500", label: "Silver", sub: "$500+" },
  { amount: "100", label: "Bronze", sub: "$100+" },
];

export function PartnerForm({ venmo }: { venmo: boolean }) {
  const [state, action] = useActionState<PartnerState, FormData>(becomePartner, {});
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("500");
  const [method, setMethod] = useState(venmo ? "VENMO" : "CHECK");
  const [preview, setPreview] = useState<string | null>(null);
  const cents = Math.round(Number(amount.replace(/[$,]/g, "")) * 100) || 0;
  const tier = cents >= 100_000 ? "Gold" : cents >= 50_000 ? "Silver" : cents >= 10_000 ? "Bronze" : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const logo = fd.get("logo");
    if (logo instanceof File && logo.size > 0 && logo.type !== "image/svg+xml") {
      try {
        const { blob, name } = await shrinkImage(logo, 800);
        fd.set("logo", blob, name);
      } catch {
        // Keep the original; the server checks size and type.
      }
    }
    start(() => action(fd));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state.error && <p className="rounded-lg bg-star-50 px-3 py-2 text-sm text-star-800">{state.error}</p>}

      <div>
        <span className="label">Partner level</span>
        <div className="grid grid-cols-3 gap-2">
          {levels.map((l) => (
            <button
              type="button"
              key={l.label}
              onClick={() => setAmount(l.amount)}
              className={`rounded-xl border px-3 py-3 text-center ${tier === l.label ? "border-dusk-700 bg-dusk-700 text-white" : "border-dusk-100 bg-white text-dusk-700 hover:bg-dusk-50"}`}
            >
              <span className="block font-display text-lg">{l.label}</span>
              <span className="text-xs opacity-80">{l.sub}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg text-black/50">$</span>
          <input name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required className="input max-w-40" />
          <span className="text-sm text-black/60">{tier ? `${tier} partner` : "Partner gifts start at $100"}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="businessName" required placeholder="Business name" className="input sm:col-span-2" />
        <input name="firstName" required placeholder="Your first name" className="input" />
        <input name="lastName" required placeholder="Your last name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="phone" type="tel" placeholder="Phone" className="input" />
        <input name="website" placeholder="Website (optional)" className="input sm:col-span-2" />
      </div>

      <div>
        <span className="label">Your logo</span>
        <input
          name="logo"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="block text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
        <p className="hint">PNG with a transparent background looks best. We review every logo before it appears.</p>
        {preview && (
          <div className="mt-3 inline-flex rounded-xl border border-dusk-100 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Logo preview" className="max-h-24 max-w-56 object-contain" />
          </div>
        )}
      </div>

      <div>
        <span className="label">How will you give?</span>
        <div className="flex flex-wrap gap-2">
          {[
            ...(venmo ? [{ v: "VENMO", l: "Venmo" }] : []),
            { v: "CHECK", l: "Check" },
            { v: "CASH", l: "Cash" },
          ].map((m) => (
            <label key={m.v} className={`btn cursor-pointer ${method === m.v ? "bg-dusk-700 text-white" : "bg-white text-dusk-800 ring-1 ring-black/15"}`}>
              <input type="radio" name="method" value={m.v} checked={method === m.v} onChange={() => setMethod(m.v)} className="sr-only" />
              {m.l}
            </label>
          ))}
        </div>
      </div>

      <textarea name="message" maxLength={500} placeholder="Anything you'd like us to know? (optional)" className="input" />
      <RecognitionFields />

      <button className="btn-primary w-full py-3 text-base" disabled={pending}>
        {pending ? "Sending…" : "Become a Christmas partner"}
      </button>
      <p className="text-center text-xs text-black/50">
        Your logo appears on our home page once we&rsquo;ve approved it and received your gift. Your tier is set by the gift we receive.
      </p>
    </form>
  );
}
