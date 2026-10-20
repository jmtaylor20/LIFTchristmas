"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { dict, type Lang } from "@/content/i18n";
import { submitThankYou, type ThankYouState } from "../actions";

/** Shrinks a phone photo to at most 1600px so uploads stay small and fast. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.82),
  );
}

export function ThankYouForm({
  token,
  lang,
  kids,
}: {
  token: string;
  lang: Lang;
  kids: { angelId: string; firstName: string }[];
}) {
  const t = dict[lang].thankYou;
  const [state, action] = useActionState<ThankYouState, FormData>(submitThankYou.bind(null, token), {});
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const photo = fd.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try {
        fd.set("photo", await shrink(photo), "card.jpg");
      } catch {
        // Fall back to the original file; the server checks its size and type.
      }
    } else {
      fd.delete("photo");
    }
    start(() => {
      action(fd);
      formRef.current?.reset();
      setPreview(null);
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {state.error && <p className="rounded-lg bg-copper-50 px-3 py-2 text-sm text-copper-800">{t[state.error]}</p>}
      {state.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t.sent}</p>}
      <label className="block">
        <span className="label">{t.to}</span>
        <select name="angelId" className="input">
          <option value="">{t.wholeFamily}</option>
          {kids.map((k) => (
            <option key={k.angelId} value={k.angelId}>
              {t.fromChild(k.firstName)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">{t.message}</span>
        <textarea name="message" required maxLength={2000} placeholder={t.messagePh} className="input min-h-28" />
      </label>
      <label className="block">
        <span className="label">{t.photo}</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="block text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="" className="max-h-48 rounded-lg border border-black/10" />}
      <button className="btn-primary" disabled={pending}>
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}
