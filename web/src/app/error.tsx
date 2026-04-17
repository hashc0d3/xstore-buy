"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4f6] px-4 py-10">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#121317] p-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] min-[640px]:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Ошибка приложения</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight min-[640px]:text-5xl">Что-то пошло не так</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 min-[640px]:text-base">
          Возникла временная ошибка при загрузке страницы. Попробуйте обновить раздел или вернуться на главную.
        </p>
        <div className="mt-7 flex flex-col gap-3 min-[640px]:mt-8 min-[640px]:flex-row">
          <button type="button" onClick={reset} className="btn-primary">
            Попробовать снова
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-400 hover:bg-zinc-800"
          >
            На главную
          </Link>
        </div>
      </section>
    </main>
  );
}
