"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "xstore-cart-v1";

const IS_SOTIK_BRAND = process.env.NEXT_PUBLIC_STORE_BRAND === "sotik77";
const VK_HREF = IS_SOTIK_BRAND ? "https://vk.com" : "https://vk.ru/xstore_55";

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
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-6 px-8 py-3 text-[13px] font-medium tracking-[0.01em] text-zinc-500 min-[1440px]:px-12 min-[1920px]:px-16">
          <div className="flex items-center gap-4">
            <Link href="/info#delivery" className="transition hover:text-zinc-900">
              Доставка и оплата
            </Link>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-zinc-300" />
            <Link href="/info#return" className="transition hover:text-zinc-900">
              Возврат и обмен
            </Link>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-zinc-300" />
            <Link href="/info#warranty" className="transition hover:text-zinc-900">
              Гарантия и проверка
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-600 ring-1 ring-inset ring-red-200">
              <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M10 2a6 6 0 0 0-6 6c0 4.6 5.3 9.7 5.5 9.9a.7.7 0 0 0 1 0c.2-.2 5.5-5.3 5.5-9.9a6 6 0 0 0-6-6Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </svg>
              Омск, ул. Гагарина 3
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Сейчас открыто · 11:00–20:00
            </span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white text-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-2 px-4 py-3 min-[390px]:gap-3 min-[640px]:px-6 min-[640px]:py-5 min-[960px]:px-8 min-[960px]:py-6 min-[1440px]:px-12 min-[1920px]:px-16">
          <Link href="/" className="inline-flex shrink-0 items-center text-2xl font-bold tracking-tight text-zinc-950 min-[390px]:text-3xl min-[640px]:text-4xl min-[1920px]:text-5xl">
            <span className="text-red-500">X</span> : STORE
          </Link>

          <nav className="hidden h-11 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 text-sm font-medium text-zinc-700 backdrop-blur-xl min-[960px]:flex min-[1920px]:text-base">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex h-9 items-center rounded-full px-3 transition min-[1440px]:px-4 ${
                    isActive
                      ? "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200"
                      : "hover:bg-white hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 min-[960px]:hidden">
            <Link
              href="/cart"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-white min-[390px]:gap-2 min-[390px]:px-3.5 min-[640px]:h-12 min-[640px]:px-4 min-[640px]:text-sm"
              aria-label="Корзина"
            >
              <span>Корзина</span>
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {cartCount}
              </span>
            </Link>
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-white min-[640px]:h-12 min-[640px]:w-12"
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
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 min-[960px]:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`fixed right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-l border-zinc-200 bg-white px-5 py-5 text-zinc-900 shadow-[0_24px_64px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out min-[640px]:w-[82%] min-[640px]:px-7 min-[640px]:py-7 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
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
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-900 transition hover:border-zinc-300 hover:bg-white"
              aria-label="Закрыть меню"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="absolute h-0.5 w-5 rotate-45 rounded-full bg-current" />
              <span className="absolute h-0.5 w-5 -rotate-45 rounded-full bg-current" />
            </button>
          </div>

          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-lg font-semibold transition min-[640px]:text-xl ${
                    isActive
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 hover:bg-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                  <span aria-hidden="true" className="text-zinc-400">›</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 space-y-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-600 min-[640px]:text-base">
            <Link
              href="/info#delivery"
              className="block rounded-xl px-3 py-2 transition hover:bg-white hover:text-zinc-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Доставка и оплата
            </Link>
            <Link
              href="/info#return"
              className="block rounded-xl px-3 py-2 transition hover:bg-white hover:text-zinc-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Возврат и обмен
            </Link>
            <Link
              href="/info#warranty"
              className="block rounded-xl px-3 py-2 transition hover:bg-white hover:text-zinc-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Гарантия и проверка
            </Link>
          </div>

          <a
            href="tel:+79236969377"
            className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-zinc-300 hover:bg-white"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 ring-1 ring-inset ring-red-200">
              <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className="h-4 w-4">
                <path d="M5.5 3a1.5 1.5 0 0 1 1.42 1.02l.7 2.07a1.5 1.5 0 0 1-.4 1.59l-1.04.97a11 11 0 0 0 4.17 4.17l.97-1.04a1.5 1.5 0 0 1 1.59-.4l2.07.7A1.5 1.5 0 0 1 17 13.5V16a1.5 1.5 0 0 1-1.5 1.5C8.6 17.5 2.5 11.4 2.5 4.5A1.5 1.5 0 0 1 4 3h1.5Z" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-zinc-950 min-[640px]:text-xl">+7 (923) 696-93-77</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Позвонить</span>
            </span>
          </a>

          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-2 text-red-600">
              <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M10 2a6 6 0 0 0-6 6c0 4.6 5.3 9.7 5.5 9.9a.7.7 0 0 0 1 0c.2-.2 5.5-5.3 5.5-9.9a6 6 0 0 0-6-6Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </svg>
              Омск, ул. Гагарина 3
            </span>
            <span className="inline-flex items-center gap-2 text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Сейчас открыто · 11:00–20:00
            </span>
            <span className="text-zinc-500">+7 (923) 686-93-77</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function SiteFooter() {
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const footerLinks = [
    { href: "/catalog", label: "Каталог" },
    { href: "/assessment", label: "Выкуп" },
    { href: "/cart", label: "Корзина" },
    { href: "/info#delivery", label: "Доставка и оплата" },
    { href: "/info#return", label: "Возврат и обмен" },
    { href: "/info#warranty", label: "Гарантия и проверка" }
  ];

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="mt-14 bg-[#111112] text-zinc-300">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 text-center min-[640px]:max-w-xl min-[960px]:max-w-5xl min-[960px]:py-14">
        <Link href="/" className="mb-8 inline-flex items-center text-2xl font-bold tracking-tight text-white min-[640px]:text-3xl">
          <span className="text-red-500">X</span> : STORE
        </Link>

        <div className="w-full max-w-lg">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-transparent px-4 py-3 text-left text-sm font-medium text-zinc-100 transition hover:border-white/20"
            aria-expanded={footerMenuOpen}
            onClick={() => setFooterMenuOpen((open) => !open)}
          >
            Меню
            <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {footerMenuOpen ? (
            <div className="mt-3 space-y-1 text-left">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex w-full max-w-lg flex-wrap items-center justify-center gap-4">
          <a href="tel:+79236969377" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-100">
            <span aria-hidden="true">☎</span>
            +7 (923) 696-93-77
          </a>
          <a href={VK_HREF} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10" aria-label="VK">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon/vk.svg" alt="" className="h-5 w-5" />
          </a>
          <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10" aria-label="Telegram">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon/telegram.svg" alt="" className="h-5 w-5" />
          </a>
        </div>

        <div className="mt-4 flex w-full max-w-lg items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
          <span aria-hidden="true">⌖</span>
          Омск, ул. Гагарина 3
        </div>

        <p className="mt-10 text-sm text-zinc-500">© 2026 Все права защищены.</p>
        <Link href="/policy" className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-300">
          Политика конфиденциальности
        </Link>

        {showScrollTop ? (
          <button
            type="button"
            className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-xl font-semibold leading-none text-white shadow-[0_10px_28px_rgba(239,68,68,0.32)] transition hover:bg-red-600"
            aria-label="Наверх"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            ↑
          </button>
        ) : null}
      </div>
    </footer>
  );
}
