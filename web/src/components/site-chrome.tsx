"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "xstore-cart-v1";

type StoredCartItem = {
  quantity?: number;
};

const navItems = [
  { href: "/catalog", label: "Каталог" },
  { href: "/assessment", label: "Выкуп" },
  { href: "/cart", label: "Корзина" },
  { href: "/info", label: "Информация" }
];

function readCartCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return 0;

    const parsed = JSON.parse(raw) as StoredCartItem[];
    if (!Array.isArray(parsed)) return 0;

    return parsed.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  } catch {
    return 0;
  }
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(readCartCount());

    const handleStorage = () => setCartCount(readCartCount());
    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

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
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-2 px-4 py-3 min-[390px]:gap-3 min-[640px]:px-6 min-[640px]:py-5 min-[960px]:px-8 min-[960px]:py-6 min-[1440px]:px-12 min-[1920px]:px-16">
          <Link href="/" className="inline-flex shrink-0 items-center text-2xl font-bold tracking-tight text-zinc-950 min-[390px]:text-3xl min-[640px]:text-4xl min-[1920px]:text-5xl">
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

          <div className="flex shrink-0 items-center gap-2 min-[960px]:hidden">
            <Link
              href="/cart"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm min-[390px]:gap-2 min-[390px]:px-3.5 min-[640px]:h-12 min-[640px]:px-4 min-[640px]:text-sm"
              aria-label="Корзина"
            >
              <span>Корзина</span>
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">
                {cartCount}
              </span>
            </Link>
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-sm transition min-[640px]:h-12 min-[640px]:w-12"
              aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span className="sr-only">{mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}</span>
              <span className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition ${
                    mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition ${
                    mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/65 transition-opacity duration-300 min-[960px]:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`h-full w-[86%] max-w-sm overflow-y-auto bg-white px-5 py-5 transition-transform duration-300 ease-out min-[640px]:w-[82%] min-[640px]:px-7 min-[640px]:py-7 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-6"
          }`}
        >
          <div className="mb-6 flex items-center justify-between min-[640px]:mb-8">
            <Link
              href="/"
              className="text-3xl font-bold tracking-tight text-zinc-950 min-[640px]:text-4xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-red-500">X</span> : STORE
            </Link>
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-900"
              aria-label="Закрыть меню"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="absolute h-0.5 w-5 rotate-45 rounded-full bg-current" />
              <span className="absolute h-0.5 w-5 -rotate-45 rounded-full bg-current" />
            </button>
          </div>

          <div className="space-y-4 text-[1.35rem] font-semibold leading-none text-zinc-900 min-[390px]:text-[1.5rem] min-[640px]:space-y-5 min-[640px]:text-[1.7rem]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block ${isActive ? "text-red-500" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 text-sm text-zinc-600 min-[390px]:text-base min-[640px]:mt-8 min-[640px]:text-lg">
            <Link href="/info#delivery" className="block" onClick={() => setMobileMenuOpen(false)}>
              Доставка и оплата
            </Link>
            <Link href="/info#return" className="block" onClick={() => setMobileMenuOpen(false)}>
              Возврат и обмен
            </Link>
            <Link href="/info#warranty" className="block" onClick={() => setMobileMenuOpen(false)}>
              Гарантия и проверка
            </Link>
          </div>

          <div className="mt-6 space-y-1 text-[1.25rem] font-semibold leading-tight text-zinc-900 min-[390px]:text-[1.4rem] min-[640px]:mt-8 min-[640px]:text-[1.6rem]">
            <p>+7 (923) 696-93-77</p>
            <p>+7 (923) 686-93-77</p>
          </div>

          <div className="mt-5 min-[640px]:mt-7">
            <p className="text-[1.25rem] font-semibold leading-tight text-red-500 min-[390px]:text-[1.4rem] min-[640px]:text-[1.6rem]">Омск, ул. Гагарина 3</p>
            <p className="mt-1 text-[1.25rem] font-semibold leading-tight text-red-500 min-[390px]:text-[1.4rem] min-[640px]:text-[1.6rem]">11:00 - 20:00</p>
          </div>
        </div>
      </div>
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
