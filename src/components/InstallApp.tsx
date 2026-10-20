"use client";

import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const text = {
  en: {
    title: (app: string) => `Add ${app} to your home screen`,
    body: "Open it like an app, right from your phone.",
    button: "Add to Home Screen",
    ios: "Tap the Share button, then choose “Add to Home Screen.”",
    dismiss: "Not now",
  },
  es: {
    title: (app: string) => `Agregue ${app} a su pantalla de inicio`,
    body: "Ábrala como una aplicación, directo desde su teléfono.",
    button: "Agregar a la pantalla de inicio",
    ios: "Toque el botón Compartir y luego “Agregar a pantalla de inicio”.",
    dismiss: "Ahora no",
  },
};

/**
 * Invites phone users to install this section as a home-screen app. Hidden on
 * computers, when already installed, and once dismissed.
 */
export function InstallApp({ app, lang = "en", tone = "light" }: { app: string; lang?: "en" | "es"; tone?: "light" | "dark" }) {
  const t = text[lang];
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const key = `lift-install-dismissed-${app}`;

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const phone = window.matchMedia("(max-width: 900px)").matches;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(key) === "1";
    } catch {}
    if (standalone || !phone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [key]);

  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  };
  const dark = tone === "dark";

  return (
    <div className={`no-print flex items-start gap-3 rounded-2xl p-4 text-sm ${dark ? "bg-white/10 text-white" : "border border-dusk-100 bg-white"}`}>
      <span aria-hidden className="text-2xl leading-none text-gold-500">✦</span>
      <div className="flex-1">
        <p className="font-semibold">{t.title(app)}</p>
        <p className={dark ? "text-white/75" : "text-black/60"}>{ios ? t.ios : t.body}</p>
        <div className="mt-2 flex gap-3">
          {prompt && (
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={async () => {
                await prompt.prompt();
                await prompt.userChoice;
                setHidden(true);
              }}
            >
              {t.button}
            </button>
          )}
          <button type="button" onClick={dismiss} className={`text-xs underline ${dark ? "text-white/70" : "text-black/50"}`}>
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
