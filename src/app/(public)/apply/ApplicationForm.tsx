"use client";

import { useActionState, useState } from "react";
import { Field, Select, TextArea } from "@/components/ui";
import { submitApplication, type ApplyState } from "./actions";

const assistance = ["SNAP / food stamps", "WIC", "Medicaid / ALL Kids", "Housing assistance", "SSI / disability", "Unemployment"];

export function ApplicationForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, {});
  const [kids, setKids] = useState([0]);
  const [next, setNext] = useState(1);

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-copper-100 bg-copper-50 px-4 py-3 text-sm text-copper-800" role="alert">
          {state.error}
        </div>
      )}

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl font-bold text-dusk-800">Parent or guardian</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="parentFirstName" required autoComplete="given-name" />
          <Field label="Last name" name="parentLastName" required autoComplete="family-name" />
          <Field label="Phone" name="phone" type="tel" required autoComplete="tel" />
          <Field label="Email" name="email" type="email" required autoComplete="email" hint="We'll send your private link and updates here." />
          <Field label="Street address" name="address" required autoComplete="street-address" className="sm:col-span-2" />
          <Field label="City" name="city" required autoComplete="address-level2" />
          <Field label="ZIP" name="zip" required autoComplete="postal-code" inputMode="numeric" />
          <Select
            label="Community"
            name="community"
            required
            options={[
              { value: "", label: "Choose…" },
              { value: "Reeltown", label: "Reeltown" },
              { value: "Tallassee", label: "Tallassee" },
              { value: "Other", label: "Other nearby area" },
            ]}
          />
          <Field label="Adults living in the home" name="adultsInHome" type="number" min={1} max={20} defaultValue={1} required />
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl font-bold text-dusk-800">Household situation</legend>
        <Field label="Approximate monthly household income" name="monthlyIncome" inputMode="decimal" placeholder="$" hint="Optional, but it helps us review." />
        <div>
          <span className="label">Does your household receive any of these?</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {assistance.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="assistance" value={a} className="h-4 w-4 accent-dusk-700" /> {a}
              </label>
            ))}
          </div>
        </div>
        <TextArea
          label="Tell us about your family's need this Christmas"
          name="circumstances"
          required
          maxLength={2000}
          hint="Job loss, illness, a new baby, a hard year. Anything you'd like us to know. Everything you share is kept private."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Church home" name="churchHome" hint="Optional" />
          <Field label="How did you hear about us?" name="referredBy" hint="Optional" />
        </div>
      </fieldset>

      <fieldset className="card space-y-5">
        <legend className="font-display text-xl font-bold text-dusk-800">Children</legend>
        <p className="text-sm text-black/60">
          List each child (17 and under) living in your home. You&rsquo;ll make each child&rsquo;s wish list after you&rsquo;re approved.
        </p>
        {kids.map((k, idx) => (
          <div key={k} className="rounded-xl border border-black/10 bg-cream/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold">Child {idx + 1}</h3>
              {kids.length > 1 && (
                <button type="button" className="text-xs font-semibold text-copper-700" onClick={() => setKids(kids.filter((x) => x !== k))}>
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" name="childFirstName" required />
              <Field label="Last name" name="childLastName" required />
              <Field label="Birth date" name="childBirthDate" type="date" required />
              <Select
                label="Boy or girl"
                name="childGender"
                required
                options={[
                  { value: "", label: "Choose…" },
                  { value: "GIRL", label: "Girl" },
                  { value: "BOY", label: "Boy" },
                ]}
              />
              <Field label="Shirt size" name="childShirt" placeholder="e.g. Youth M" />
              <Field label="Pants size" name="childPants" placeholder="e.g. 10 slim" />
              <Field label="Shoe size" name="childShoe" placeholder="e.g. 3Y" />
              <Field label="Interests / favorite things" name="childInterests" placeholder="Dinosaurs, art, football…" />
            </div>
          </div>
        ))}
        {kids.length < 10 && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setKids([...kids, next]);
              setNext(next + 1);
            }}
          >
            + Add another child
          </button>
        )}
      </fieldset>

      <div className="card space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 accent-dusk-700" />
          <span>
            I confirm the information above is true, this is the only application for my household this year, and I
            understand gifts must be picked up at the time and place the ministry provides.
          </span>
        </label>
        <button className="btn-primary px-8 py-3 text-base" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
