# SOTIK77 (xstore-buy)

Магазин и сервис выкупа техники. Прод: [https://sotik77.ru](https://sotik77.ru).

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

Сайт `sotik77.ru` живёт на сервере `debian-for-tests` рядом с другими
проектами (`xstore55.ru`, `playbetatool.ru`). Все они проходят через
один общий реверс-прокси `infra-nginx`. Полное описание архитектуры,
портов и SSL — в:

- [`docs/SERVER_DEPLOYMENT.md`](./docs/SERVER_DEPLOYMENT.md) — как устроен сервер целиком.
- [`docs/ADD_NEW_SITE.md`](./docs/ADD_NEW_SITE.md) — плэйбук «добавить новый домен на сервер».

### Обновление этого сайта

```bash
ssh debian-for-tests
cd /opt/xstore-buy
git pull origin main
docker compose up -d --build
docker compose ps
```

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
├── docker-compose.yml         # api + web (web → 127.0.0.1:8083)
└── README.md
```

## Данные

API использует SQLite в docker-volume `api-data`. Prisma-миграции
накатываются автоматически при старте контейнера `api`.

В образ `api` копируется **`snifer/output/*.json`** в `/app/catalog`. При **`AUTO_SEED_CATALOG=1`** (по умолчанию в `docker-compose.yml`), если в БД **ещё нет товаров**, при старте один раз выполняется **`seed:catalog`** — витрина и админка совпадают с JSON из репозитория. Если товары уже есть, автозаливка пропускается. Отключить: **`AUTO_SEED_CATALOG=0`**.

Обновить каталог после смены JSON: `git pull`, `docker compose up -d --build`, затем при необходимости вручную:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```

В README выше для деплоя используется ветка **`main`** на GitHub.
