"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "xstore-cookie-consent-v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        const id = window.setTimeout(() => setVisible(true), 200);
        return () => window.clearTimeout(id);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    } catch {
      // ignore quota / privacy mode errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 min-[640px]:px-6 min-[640px]:pb-6">
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Согласие на использование cookie"
        className="pointer-events-auto flex w-full max-w-3xl flex-col items-stretch gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-4 text-sm text-zinc-700 shadow-[0_24px_64px_rgba(0,0,0,0.12)] backdrop-blur-xl min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-5 min-[640px]:px-6 min-[640px]:py-5 min-[640px]:text-base"
      >
        <p className="leading-relaxed">
          Посещая наш сайт, вы соглашаетесь с{" "}
          <Link
            href="/policy"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-500"
          >
            условиями обработки персональных данных
          </Link>
          . Наш сайт{" "}
          <Link
            href="/policy"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-500"
          >
            использует файлы cookie
          </Link>
          . Оставаясь на сайте, вы подтверждаете свое согласие на использование данных файлов.
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800 min-[640px]:h-12 min-[640px]:px-10 min-[640px]:text-base"
        >
          ОК
        </button>
      </div>
    </div>
  );
}
