"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "sotik77-cookie-consent-v1";

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
        className="pointer-events-auto flex w-full max-w-3xl flex-col items-stretch gap-3 rounded-2xl border border-white/10 bg-[#1a1a1c]/95 px-4 py-4 text-sm text-zinc-300 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-5 min-[640px]:px-6 min-[640px]:py-5 min-[640px]:text-base"
      >
        <p className="leading-relaxed">
          Посещая наш сайт, вы соглашаетесь с{" "}
          <Link
            href="/policy"
            className="font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white/60"
          >
            условиями обработки персональных данных
          </Link>
          . Наш сайт{" "}
          <Link
            href="/policy"
            className="font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white/60"
          >
            использует файлы cookie
          </Link>
          . Оставаясь на сайте sotik77.ru, вы подтверждаете свое согласие на использование данных файлов.
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-red-500 px-8 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(239,68,68,0.32)] transition hover:bg-red-600 min-[640px]:h-12 min-[640px]:px-10 min-[640px]:text-base"
        >
          ОК
        </button>
      </div>
    </div>
  );
}
