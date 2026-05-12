# X:STORE

Docker-deploy for the main storefront.

## Production URL

- Web: `https://xstore55.ru` (основной канонический домен; `www.xstore55.ru` редиректится на него).
- API: proxied internally through `/api`

Образ витрины и каталога совпадает с репозиторием **vegan-skupka** (SOTIK77): общий `storefront.tsx` и страницы каталога. Различаются только логотип/метаданные (сборка `NEXT_PUBLIC_STORE_BRAND` и `NEXT_PUBLIC_SITE_URL`).

## Deploy

```bash
docker compose up -d --build
```

The web container is published on `127.0.0.1:8080`. Use nginx on the host as the public reverse proxy and issue SSL with certbot:

```bash
sudo cp nginx/xstore55.ru.conf /etc/nginx/sites-available/xstore55.ru
sudo ln -sf /etc/nginx/sites-available/xstore55.ru /etc/nginx/sites-enabled/xstore55.ru
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d xstore55.ru -d www.xstore55.ru
```

## Update

```bash
git pull
docker compose up -d --build
```

## Каталог из сниффера при первом запуске

В образ `api` копируется актуальный **`snifer/output/*.json`**. При **`AUTO_SEED_CATALOG=1`** (значение по умолчанию в `docker-compose.yml`) при **пустой** БД (новый volume `api-data`) контейнер сам один раз выполнит `seed:catalog` — в админке и на витрине будут те же товары, что и из JSON в репозитории.

- Если БД уже с товарами, автозаливка **не запускается** (чтобы не затереть прод).
- Отключить автозаливку: в `.env` или окружении **`AUTO_SEED_CATALOG=0`**, затем `docker compose up -d --build`.

Обновить каталог после смены JSON: заново прогнать сниффер, закоммитить `snifer/output`, на сервере `git pull`, затем либо очистить volume БД (осторожно), либо вручную:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```

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
Prisma migrations run automatically when the API container starts.

## Catalog (snifer JSON)

`snifer/output/*.json` is bundled into the `api` image at `/app/catalog`. With **`AUTO_SEED_CATALOG=1`** (default in `docker-compose.yml`), if the database has **no products yet**, the container runs **`seed:catalog`** once so the admin matches the repo JSON. If products already exist, the seed step is skipped. Set **`AUTO_SEED_CATALOG=0`** to disable. To refresh data after updating JSON: `git pull`, `docker compose up -d --build`, then either use a fresh volume or run manually:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```
