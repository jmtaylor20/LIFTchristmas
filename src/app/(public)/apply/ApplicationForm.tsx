"use client";

import { useActionState, useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { dict, type Lang } from "@/content/i18n";
import { shrinkImage } from "@/lib/shrinkImage";
import { MAX_CHILDREN, WISHES_PER_CHILD } from "@/lib/applicationLimits";
import { submitApplication, type ApplyState } from "./actions";

export function ApplicationForm({ lang }: { lang: Lang }) {
  const t = dict[lang].form;
  const [state, action] = useActionState<ApplyState, FormData>(submitApplication, {});
  const [pending, start] = useTransition();
  const [preparing, setPreparing] = useState(false);
  const [kids, setKids] = useState([0]);
  const [next, setNext] = useState(1);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPreparing(true);
    // Shrink phone photos of documents so the upload is quick; PDFs go as they are.
    for (const key of ["photoId", "incomeProof"]) {
      const file = fd.get(key);
      if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) continue;
      try {
        const { blob, name } = await shrinkImage(file, 1800);
        fd.set(key, blob, name);
      } catch {
        // Keep the original; the server checks its size and type.
      }
    }
    setPreparing(false);
    start(() => action(fd));
  }

  const busy = pending || preparing;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="lang" value={lang} />
      {state.error && (
        <div className="rounded-xl border border-star-100 bg-star-50 px-4 py-3 text-sm text-star-800" role="alert">
          {state.error}
        </div>
      )}

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl text-dusk-800">{t.parent}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.firstName} name="parentFirstName" required autoComplete="given-name" />
          <Field label={t.lastName} name="parentLastName" required autoComplete="family-name" />
          <Field label={t.phone} name="phone" type="tel" required autoComplete="tel" />
          <Field label={t.email} name="email" type="email" required autoComplete="email" hint={t.emailHint} />
          <Field label={t.address} name="address" required autoComplete="street-address" className="sm:col-span-2" />
          <Field label={t.city} name="city" required autoComplete="address-level2" />
          <Field label={t.zip} name="zip" required autoComplete="postal-code" inputMode="numeric" />
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl text-dusk-800">{t.work}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.employer} name="employer" required hint={t.employerHint} />
          <Field label={t.jobLength} name="jobLength" required />
        </div>
        <YesNo label={t.priorHelpQ} name="priorHelp" yes={t.yes} no={t.no} />
        <Field label={t.priorYears} name="priorHelpYears" />
        <YesNo label={t.agencyQ} name="otherAgencyHelp" yes={t.yes} no={t.no} />
        <Field label={t.agencyNames} name="agencyNames" />
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl text-dusk-800">{t.documents}</legend>
        <p className="text-sm text-black/60">{t.documentsIntro}</p>
        <FileField label={t.photoId} name="photoId" />
        <FileField label={t.incomeProof} name="incomeProof" hint={t.incomeHint} />
      </fieldset>

      <fieldset className="card space-y-5">
        <legend className="font-display text-xl text-dusk-800">{t.children}</legend>
        <p className="text-sm text-black/60">{t.childrenIntro}</p>
        {kids.map((k, idx) => (
          <div key={k} className="rounded-xl border border-black/10 bg-cream/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base">{t.child(idx + 1)}</h3>
              {kids.length > 1 && (
                <button type="button" className="text-xs font-semibold text-star-700" onClick={() => setKids(kids.filter((x) => x !== k))}>
                  {t.remove}
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.firstName} name="childFirstName" required />
              <Field label={t.lastName} name="childLastName" required />
              <Field label={t.age} name="childAge" required placeholder={t.agePh} />
              <label className="block">
                <span className="label">{t.boyOrGirl}</span>
                <select name="childGender" required className="input" defaultValue="">
                  <option value="">{t.choose}</option>
                  <option value="GIRL">{t.girl}</option>
                  <option value="BOY">{t.boy}</option>
                </select>
              </label>
              <Field label={t.clothing} name="childClothing" placeholder={t.clothingPh} />
              <Field label={t.shoe} name="childShoe" placeholder="3Y" />
              <Field label={t.race} name="childRace" className="sm:col-span-2" />
            </div>
            <div className="mt-3">
              <span className="label">{t.wishList}</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: WISHES_PER_CHILD }, (_, i) => (
                  <input key={i} name="childWish" maxLength={200} placeholder={t.wishPh(i + 1)} aria-label={t.wishPh(i + 1)} className="input" />
                ))}
              </div>
            </div>
          </div>
        ))}
        {kids.length < MAX_CHILDREN && (
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

      <fieldset className="card space-y-4">
        <legend className="font-display text-xl text-dusk-800">{t.agreementTitle}</legend>
        <p className="text-sm text-black/70">{t.agree}</p>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 accent-dusk-700" />
          <span>{t.agreeCheck}</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.printedName} name="printedName" required autoComplete="name" />
          <Field label={t.signature} name="signatureName" required hint={t.signatureHint} />
        </div>
        <button className="btn-primary px-8 py-3 text-base" disabled={busy}>
          {busy ? t.submitting : t.submit}
        </button>
      </fieldset>
    </form>
  );
}

function YesNo({ label, name, yes, no }: { label: string; name: string; yes: string; no: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="yes" required className="h-4 w-4 accent-dusk-700" /> {yes}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="no" className="h-4 w-4 accent-dusk-700" /> {no}
        </label>
      </div>
    </div>
  );
}

function FileField({ label, name, hint }: { label: string; name: string; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type="file" name={name} required accept="image/*,application/pdf" className="input file:mr-3 file:rounded-md file:border-0 file:bg-dusk-50 file:px-3 file:py-1 file:text-dusk-800" />
      {hint && <span className="mt-1 block text-xs text-black/55">{hint}</span>}
    </label>
  );
}
