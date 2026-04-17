import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4f6] px-4 py-10">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#121317] p-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] min-[640px]:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Ошибка 404</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight min-[640px]:text-5xl">Страница не найдена</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 min-[640px]:text-base">
          Возможно, ссылка устарела или страница была перемещена. Вернитесь на главную или откройте каталог, чтобы
          продолжить просмотр товаров.
        </p>
        <div className="mt-7 flex flex-col gap-3 min-[640px]:mt-8 min-[640px]:flex-row">
          <Link href="/" className="btn-primary inline-flex items-center justify-center">
            На главную
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-400 hover:bg-zinc-800"
          >
            Открыть каталог
          </Link>
        </div>
      </section>
    </main>
  );
}
