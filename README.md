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

## Каталог в админке (как локально)

JSON после сниффера: `snifer/output/*.json`. Заливка теми же скриптами, что и локально.

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

### На сервере после `docker compose up`

Скрипты входят в образ `api`. Скопируйте каталог JSON в контейнер и выполните заливку **на localhost API внутри контейнера**:

```bash
cd /opt/xstore   # или ваш каталог стека
docker compose up -d --build
CID=$(docker compose ps -q api)
docker cp ./snifer/output/. "$CID:/tmp/catalog"
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/tmp/catalog npm run seed:catalog'
```

Повторите для `/opt/xstore-buy` (другой контейнер `api`), подставив свой путь к JSON.

## Data

The API uses SQLite in the Docker volume `api-data`.
Prisma migrations run automatically when the API container starts.
