"use client";

import { useState, useTransition } from "react";
import { dict, type Lang } from "@/content/i18n";
import { shrinkImage } from "@/lib/shrinkImage";
import { addMissingDocuments } from "../actions";

/** Upload box for documents the automatic check asked the family for. */
export function DocumentsForm({ token, lang, missing }: { token: string; lang: Lang; missing: string[] }) {
  const t = dict[lang];
  const [pending, start] = useTransition();
  const [preparing, setPreparing] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPreparing(true);
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
    start(() => addMissingDocuments(token, fd));
  }

  const field = (name: string, label: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <input type="file" name={name} required accept="image/*,application/pdf" className="input file:mr-3 file:rounded-md file:border-0 file:bg-dusk-50 file:px-3 file:py-1 file:text-dusk-800" />
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {missing.includes("PHOTO_ID") && field("photoId", t.form.photoIdShort)}
      {missing.includes("INCOME") && field("incomeProof", t.form.incomeProofShort)}
      <button className="btn-primary" disabled={pending || preparing}>
        {pending || preparing ? t.form.submitting : t.family.needInfoUpload}
      </button>
    </form>
  );
}
