# Передача проекта заказчику (X:STORE · SOTIK77)

Один и тот же код разворачивается **дважды** как независимые сайты. Различие только в переменных окружения при сборке **web** и настройках домена/API.

## Роли частей

- **`api/`** — NestJS, Prisma, REST `/api/…`, данные каталога и заявок.
- **`web/`** — Next.js (витрина, админка, страницы `/cart`, `/assessment`).

## Обязательные переменные (web)

| Переменная | X:STORE (xstore55.ru) | SOTIK77 (sotik77.ru) |
|------------|------------------------|----------------------|
| `NEXT_PUBLIC_STORE_BRAND` | `xstore` (или не задавать) | `sotik77` |
| `API_INTERNAL_URL` | URL API **из контейнера web** к api, напр. `http://api:4000` | то же для своего стека |
| `NEXT_PUBLIC_API_URL` | обычно `/api` (прокси через Next rewrites) | `/api` |
| `NEXT_PUBLIC_SITE_URL` | канонический URL сайта | канонический URL сайта |

Сборка Next вшивает `NEXT_PUBLIC_*` в бандл: **смена бренда = новая сборка образа web**.

## Производительность витрины

- Главная, каталог, политики и инфо-страницы получают каталог **на сервере** (`getStoreDataServer` → `API_INTERNAL_URL`), без пустой первой отрисовки.
- В браузере по-прежнему выполняется обновление с `/api/store`, чтобы подтянуть изменения после правок в админке.
- В Docker для SSR должен быть задан **`API_INTERNAL_URL`** (см. `web/Dockerfile`).

## Независимость брендов

- Заголовок вкладки и описание: `src/lib/brand.ts` → `SITE_TITLE`, `SITE_DESCRIPTION`.
- Логотип: `src/components/brand-mark.tsx` + использование в `storefront` и `site-chrome`.
- VK: `VK_HREF` в `brand.ts`.
- Корзина в `localStorage`: **`xstore-cart-v1`** vs **`sotik77-cart-v1`** (`CART_STORAGE_KEY`), чтобы при открытых обоих сайтах корзины не смешивались.

## Скелетоны

- Категории и сетка товаров: `src/components/catalog-skeleton.tsx` (до гидрации, если нет SSR-данных).
- Выкуп: `src/app/assessment/page.tsx` — плейсхолдер до ответа `/api/store/buyback`.

## Локальная разработка

1. Запустить API (порт 4000).
2. В `web` задать `API_INTERNAL_URL=http://127.0.0.1:4000` для SSR.
3. При необходимости `NEXT_PUBLIC_STORE_BRAND=sotik77` в `.env.local` для проверки второго бренда.

## Репозитории продакшена

| Сайт | GitHub | Типичная локальная папка (у вас) |
|------|--------|----------------------------------|
| X:STORE (xstore55) | [hashc0d3/xstore](https://github.com/hashc0d3/xstore) | `vegan` |
| SOTIK77 (sotik77) | [hashc0d3/xstore-buy](https://github.com/hashc0d3/xstore-buy) | `vegan-skupka` (`C:\Users\jasper\Documents\vegan-skupka`) |

У заказчика часто два деплоя (`/opt/xstore` и `/opt/xstore-buy`). Код синхронизируется из соответствующих репозиториев; отличия — env и домен. Подробнее для второго репо: **`vegan-skupka/DEPLOY-SOURCE.md`**.
