# SOTIK77 (xstore-buy)

**GitHub:** [hashc0d3/xstore-buy](https://github.com/hashc0d3/xstore-buy). Связка папка → репо → сервер — [`DEPLOY-SOURCE.md`](./DEPLOY-SOURCE.md).

Прод: [sotik77.ru](https://sotik77.ru) (nginx: `nginx/sotik77.ru.conf`). Витрина синхронизируется с репозиторием **vegan**; бренд — `NEXT_PUBLIC_STORE_BRAND=sotik77`, домен — `NEXT_PUBLIC_SITE_URL`.

Рядом на сервере может быть **xstore55.ru** ([xstore](https://github.com/hashc0d3/xstore)) — используйте разные `COMPOSE_PROJECT_NAME` и не смешивайте volume `api-data`.

## Deploy

```bash
docker compose up -d --build
```

Web по умолчанию: **127.0.0.1:8083** (см. `.env.example`, переменная `WEB_HOST_PORT`).

### Прод-деплой

```bash
cd /opt/xstore-buy && git pull origin main && docker compose up -d --build
```

Документация по серверу: [`docs/SERVER_DEPLOYMENT.md`](./docs/SERVER_DEPLOYMENT.md), новый домен: [`docs/ADD_NEW_SITE.md`](./docs/ADD_NEW_SITE.md).

### Каталог (`snifer/output`)

JSON попадают в образ как `/app/catalog`. При **пустой** БД и **`AUTO_SEED_CATALOG=1`** выполняется однократная заливка.

Структура репозитория:

```
.
├── api/
├── web/
├── nginx/
├── docs/
├── snifer/output/
├── docker-compose.yml
└── README.md
```

Ручная заливка:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```

## Каталог из сниффера при первом запуске

В образ `api` копируется **`snifer/output/*.json`**. При **`AUTO_SEED_CATALOG=1`** и **пустой** БД (новый volume `api-data`) контейнер один раз выполнит `seed:catalog`.

- Если товары уже есть — автозаливка **не** запускается.
- Отключить: **`AUTO_SEED_CATALOG=0`**, затем пересобрать.

## Каталог в админке (как локально)

JSON после сниффера: `snifer/output/*.json`. Дополнительно можно заливать с ПК или вручную на сервере — как ниже.

### С вашего ПК (проще всего)

Из корня репозитория, с установленным Node 18+:

```bash
cd api
API_URL=https://xstore55.ru/api npm run seed:catalog
API_URL=https://sotik77.ru/api npm run seed:catalog
```

(Пароль/фаервол не мешают `POST` с машины — CORS только для браузеров.)

Если JSON лежат не в `../snifer/output`:

```bash
CATALOG_ROOT=/полный/путь/к/output API_URL=https://xstore55.ru/api npm run seed:catalog
```

### На сервере (если нужен ручной импорт без пересборки образа)

JSON уже в образе в `/app/catalog`. Либо скопируйте свежие файлы в контейнер в этот путь и выполните:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```

## Data

The API uses SQLite in the Docker volume `api-data`.
Prisma [migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate) run when the API container starts (`migrate deploy` in `api/docker-entrypoint.sh`).

## Catalog (snifer JSON)

`snifer/output/*.json` is bundled into the `api` image at `/app/catalog`. With **`AUTO_SEED_CATALOG=1`**, if the database has **no products yet**, the container runs **`seed:catalog`** once. If products already exist, the seed step is skipped. Set **`AUTO_SEED_CATALOG=0`** to disable. To refresh after updating JSON: `git pull`, `docker compose up -d --build`, then either use a fresh volume or run manually:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```
