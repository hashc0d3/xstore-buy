/**
 * Два независимых продакшена: X:STORE (xstore55) и SOTIK77 (sotik77).
 * Сборка задаётся только через NEXT_PUBLIC_STORE_BRAND при `next build` / Docker ARG.
 */
/** lower-case: «SOTIK77» в .env не должен ломать определение бренда */
export const STORE_BRAND = (process.env.NEXT_PUBLIC_STORE_BRAND ?? "xstore").trim().toLowerCase();

export const IS_SOTIK_BRAND = STORE_BRAND === "sotik77";

export const SITE_TITLE = IS_SOTIK_BRAND ? "SOTIK77" : "X:STORE";

export const SITE_DESCRIPTION = IS_SOTIK_BRAND
  ? "Магазин техники SOTIK77 — sotik77.ru"
  : "Магазин оригинальной техники Apple — X:STORE (xstore55.ru)";

/** SOTIK — общая ссылка на сообщество; X:STORE — официальная группа. */
export const VK_HREF = IS_SOTIK_BRAND ? "https://vk.com" : "https://vk.ru/xstore_55";

/**
 * Разные ключи localStorage, чтобы корзины двух магазинов не пересекались в одном браузере.
 */
export const CART_STORAGE_KEY = IS_SOTIK_BRAND ? "sotik77-cart-v1" : "xstore-cart-v1";

export const SLIDER_PHOTO_ALT_FALLBACK = IS_SOTIK_BRAND ? "Фото SOTIK77" : "Фото X:STORE";
