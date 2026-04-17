"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/catalog", label: "Каталог" },
  { href: "/assessment", label: "Выкуп" },
  { href: "/cart", label: "Корзина" },
  { href: "/info", label: "Информация" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <div className="hidden border-b border-zinc-200 bg-white min-[960px]:block">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-8 py-3 text-sm text-zinc-500 min-[1440px]:px-12 min-[1920px]:px-16">
          <div className="flex gap-5">
            <Link href="/info#delivery" className="transition hover:text-zinc-700">
              Доставка и оплата
            </Link>
            <Link href="/info#return" className="transition hover:text-zinc-700">
              Возврат и обмен
            </Link>
            <Link href="/info#warranty" className="transition hover:text-zinc-700">
              Гарантия и проверка
            </Link>
          </div>
          <div className="flex gap-5 text-red-500">
            <span>Омск, ул. Гагарина 3</span>
            <span>11:00 - 20:00</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/50 liquid-glass">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-4 py-4 min-[640px]:px-6 min-[640px]:py-5 min-[960px]:px-8 min-[960px]:py-6 min-[1440px]:px-12 min-[1920px]:px-16">
          <Link href="/" className="inline-flex items-center text-3xl font-bold tracking-tight text-zinc-950 min-[640px]:text-4xl min-[1920px]:text-5xl">
            <span className="text-red-500">X</span> : STORE
          </Link>

          <nav className="hidden items-center gap-5 text-zinc-700 min-[960px]:flex min-[1440px]:gap-8 min-[1920px]:text-lg">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={isActive ? "text-red-500" : "hover:text-red-500"}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-[1.2rem] border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm min-[640px]:rounded-[1.4rem] min-[640px]:px-4 min-[640px]:py-2.5 min-[960px]:hidden"
          >
            Каталог
          </Link>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-14 bg-[#111217] text-zinc-300">
      <div className="mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-8 px-4 py-12 min-[640px]:grid-cols-2 min-[640px]:px-6 min-[640px]:py-14 min-[960px]:grid-cols-4 min-[960px]:px-8 min-[960px]:py-16 min-[1440px]:px-12 min-[1920px]:px-16">
        <div>
          <div className="mb-6 text-3xl font-bold text-white min-[640px]:mb-8 min-[640px]:text-4xl">
            <span className="text-red-500">X</span> : STORE
          </div>
          <p className="text-sm text-zinc-500">ИП ИНН</p>
          <div className="mt-8 space-y-2 text-sm text-zinc-500 min-[640px]:mt-14">
            <Link href="/policy" className="block hover:text-zinc-300">
              Политика конфиденциальности
            </Link>
            <Link href="/offer" className="block hover:text-zinc-300">
              Публичная оферта
            </Link>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase text-zinc-500">Навигация</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/catalog" className="transition hover:text-zinc-100">
                Каталог
              </Link>
            </li>
            <li>
              <Link href="/assessment" className="transition hover:text-zinc-100">
                Выкуп
              </Link>
            </li>
            <li>
              <Link href="/cart" className="transition hover:text-zinc-100">
                Корзина
              </Link>
            </li>
            <li>
              <Link href="/info" className="transition hover:text-zinc-100">
                Информация
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase text-zinc-500">Покупателям</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/info#delivery" className="transition hover:text-zinc-100">
                Доставка и оплата
              </Link>
            </li>
            <li>
              <Link href="/info#return" className="transition hover:text-zinc-100">
                Возврат и обмен
              </Link>
            </li>
            <li>
              <Link href="/info#warranty" className="transition hover:text-zinc-100">
                Гарантия и проверка
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase text-zinc-500">Контакты</h4>
          <p className="mb-2 text-xl font-semibold text-white">Омск, ул. Гагарина 3</p>
          <p className="mb-6 text-red-500">11:00 - 20:00</p>
          <p className="text-lg">+7 (923) 696-93-77</p>
          <p className="mb-5 text-lg">+7 (923) 686-93-77</p>
        </div>
      </div>
    </footer>
  );
}
