# SOTIK77 (xstore-buy)

**Локальная рабочая копия на вашем ПК:** `C:\Users\jasper\Documents\vegan-skupka`  
**GitHub (прод-репозиторий):** [hashc0d3/xstore-buy](https://github.com/hashc0d3/xstore-buy)  
Связка «папка → репо → сервер» описана в [`DEPLOY-SOURCE.md`](./DEPLOY-SOURCE.md).

Магазин и сервис выкупа техники. Прод: [https://sotik77.ru](https://sotik77.ru) / [www.sotik77.ru](https://www.sotik77.ru) (шаблон nginx: `nginx/sotik77.ru.conf`).

Витрина и карточки каталога совпадают с репозиторием **vegan** (X:STORE): общие `storefront.tsx`, `lib/store.ts`, `lib/api.ts`, страницы корзины, каталога и админки. Логотип и канонический URL SOTIK77 задаются при сборке (`NEXT_PUBLIC_STORE_BRAND=sotik77`, `NEXT_PUBLIC_SITE_URL`).

Стек:

- **web** — Next.js (`web/`), слушает 3000 внутри контейнера.
- **api** — NestJS + Prisma + SQLite (`api/`), слушает 4000 внутри
  контейнера, БД хранится в docker-volume `api-data`.
- Снаружи доступен только `web`, на хосте опубликован как
  `127.0.0.1:8083`. Публичные 80/443 терминирует общий `infra-nginx`
  на сервере (см. ниже).

## Локальный запуск

```bash
docker compose up -d --build
```

Web: http://localhost:8083 — туда зайдёт через тот же
`infra-nginx`-настроенный proxy_pass, если ты деплоишь, либо
напрямую при локальной разработке.

## Прод-деплой

**Обновление на уже настроенном сервере (достаточно одной строки):**

```bash
cd /opt/xstore-buy && git pull origin main && docker compose up -d --build
```

Отдельный `.env` не обязателен: в `docker-compose.yml` заданы значения по умолчанию (бренд SOTIK77, `www.sotik77.ru`, порт **8083**, автозаливка каталога из `snifer/output` в пустую БД).

Сайт `sotik77.ru` живёт на сервере `debian-for-tests` рядом с другими
проектами (`xstore55.ru`, `playbetatool.ru`). Все они проходят через
один общий реверс-прокси `infra-nginx`. Полное описание архитектуры,
портов и SSL — в:

- [`docs/SERVER_DEPLOYMENT.md`](./docs/SERVER_DEPLOYMENT.md) — как устроен сервер целиком.
- [`docs/ADD_NEW_SITE.md`](./docs/ADD_NEW_SITE.md) — плэйбук «добавить новый домен на сервер».

### Каталог (товары на витрине)

В репозитории лежит **`snifer/output/*.json`** — они копируются в образ `api` как **`/app/catalog`**. При первом старте с **пустой** БД (`AUTO_SEED_CATALOG=1` по умолчанию) entrypoint сам выполняет заливку каталога. Если товары уже есть в volume `api-data`, автозаливка пропускается. Обновить каталог после смены JSON: пересборка образа `api` или вручную `docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'` (см. также `npm run seed:catalog` из каталога `api/` локально).

Проверка: `curl -I https://sotik77.ru` → `200 OK`. В браузере открыть
с hard refresh (`Ctrl+F5`), чтобы исключить кеш.

### Если разворачиваешь с нуля на новом сервере

1. Поднять стек `infra-proxy` (см. [`docs/SERVER_DEPLOYMENT.md`](./docs/SERVER_DEPLOYMENT.md#41-optinfra-proxy--реверс-прокси)).
2. Выпустить сертификат для `sotik77.ru` и `www.sotik77.ru`
   (см. [`docs/SERVER_DEPLOYMENT.md` → раздел 5](./docs/SERVER_DEPLOYMENT.md#5-ssl-сертификаты)).
3. Склонировать репо в `/opt/xstore-buy` и поднять `docker compose up -d --build`.
4. Добавить vhost — готовый блок лежит в [`nginx/sotik77.ru.conf`](./nginx/sotik77.ru.conf) — в
   `/opt/infra-proxy/conf.d/sites.conf`, выполнить
   `docker exec infra-nginx nginx -t && docker exec infra-nginx nginx -s reload`.

## Структура каталога

```
.
├── api/                       # NestJS + Prisma
├── web/                       # Next.js
├── nginx/                     # vhost-шаблоны (sotik77.ru.conf, xstore55.ru.conf)
├── docs/
│   ├── SERVER_DEPLOYMENT.md   # архитектура, порты, SSL, troubleshooting
│   └── ADD_NEW_SITE.md        # плэйбук для нового домена
├── snifer/output/             # JSON каталога (в образе api → /app/catalog)
├── docker-compose.yml         # api + web (web → 127.0.0.1:8083 по умолчанию)
└── README.md
```

## Данные

API использует SQLite в docker-volume `api-data`. Prisma-миграции
накатываются автоматически при старте контейнера `api`.
