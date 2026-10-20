"use client";

import { useActionState, useState } from "react";
import { Field, Select, TextArea } from "@/components/ui";
import { dict, type Lang } from "@/content/i18n";
import { submitApplication, type ApplyState } from "./actions";

export function ApplicationForm({ lang }: { lang: Lang }) {
  const t = dict[lang].form;
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, {});
  const [kids, setKids] = useState([0]);
  const [next, setNext] = useState(1);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lang" value={lang} />
      {state.error && (
        <div className="rounded-xl border border-copper-100 bg-copper-50 px-4 py-3 text-sm text-copper-800" role="alert">
          {state.error}
        </div>
      )}

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl font-bold text-dusk-800">{t.parent}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.firstName} name="parentFirstName" required autoComplete="given-name" />
          <Field label={t.lastName} name="parentLastName" required autoComplete="family-name" />
          <Field label={t.phone} name="phone" type="tel" required autoComplete="tel" />
          <Field label={t.email} name="email" type="email" required autoComplete="email" hint={t.emailHint} />
          <Field label={t.address} name="address" required autoComplete="street-address" className="sm:col-span-2" />
          <Field label={t.city} name="city" required autoComplete="address-level2" />
          <Field label={t.zip} name="zip" required autoComplete="postal-code" inputMode="numeric" />
          <Select
            label={t.community}
            name="community"
            required
            options={[
              { value: "", label: t.choose },
              { value: "Reeltown", label: "Reeltown" },
              { value: "Tallassee", label: "Tallassee" },
              { value: "Other", label: t.otherArea },
            ]}
          />
          <Field label={t.adults} name="adultsInHome" type="number" min={1} max={20} defaultValue={1} required />
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl font-bold text-dusk-800">{t.household}</legend>
        <Field label={t.income} name="monthlyIncome" inputMode="decimal" placeholder="$" hint={t.incomeHint} />
        <div>
          <span className="label">{t.assistanceQ}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {t.assistance.map((a, i) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                {/* Stored in English so the admin always sees the same labels. */}
                <input type="checkbox" name="assistance" value={dict.en.form.assistance[i]} className="h-4 w-4 accent-dusk-700" /> {a}
              </label>
            ))}
          </div>
        </div>
        <TextArea label={t.need} name="circumstances" required maxLength={2000} hint={t.needHint} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.church} name="churchHome" hint={t.optional} />
          <Field label={t.heard} name="referredBy" hint={t.optional} />
        </div>
      </fieldset>

      <fieldset className="card space-y-5">
        <legend className="font-display text-xl font-bold text-dusk-800">{t.children}</legend>
        <p className="text-sm text-black/60">{t.childrenIntro}</p>
        {kids.map((k, idx) => (
          <div key={k} className="rounded-xl border border-black/10 bg-cream/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold">{t.child(idx + 1)}</h3>
              {kids.length > 1 && (
                <button type="button" className="text-xs font-semibold text-copper-700" onClick={() => setKids(kids.filter((x) => x !== k))}>
                  {t.remove}
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.firstName} name="childFirstName" required />
              <Field label={t.lastName} name="childLastName" required />
              <Field label={t.birthDate} name="childBirthDate" type="date" required />
              <Select
                label={t.boyOrGirl}
                name="childGender"
                required
                options={[
                  { value: "", label: t.choose },
                  { value: "GIRL", label: t.girl },
                  { value: "BOY", label: t.boy },
                ]}
              />
              <Field label={t.shirt} name="childShirt" placeholder="Youth M" />
              <Field label={t.pants} name="childPants" placeholder="10 slim" />
              <Field label={t.shoe} name="childShoe" placeholder="3Y" />
              <Field label={t.interests} name="childInterests" placeholder={t.interestsPh} />
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
            {t.addChild}
          </button>
        )}
      </fieldset>

      <div className="card space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 accent-dusk-700" />
          <span>{t.agree}</span>
        </label>
        <button className="btn-primary px-8 py-3 text-base" disabled={pending}>
          {pending ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  );
}
