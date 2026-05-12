# X:STORE

Docker-deploy for the main storefront.

## Production URL

- Web: `http://155.117.46.144:8080`
- API: proxied internally through `/api`

## Deploy

```bash
docker compose up -d --build
```

## Update

```bash
git pull
docker compose up -d --build
```

## Data

The API uses SQLite in the Docker volume `api-data`.
Prisma migrations run automatically when the API container starts.

## Catalog (snifer JSON)

`snifer/output/*.json` is bundled into the `api` image at `/app/catalog`. With **`AUTO_SEED_CATALOG=1`** (default in `docker-compose.yml`), if the database has **no products yet**, the container runs **`seed:catalog`** once so the admin matches the repo JSON. If products already exist, the seed step is skipped. Set **`AUTO_SEED_CATALOG=0`** to disable. To refresh data after updating JSON: `git pull`, `docker compose up -d --build`, then either use a fresh volume or run manually:

```bash
docker compose exec api sh -c 'API_URL=http://127.0.0.1:4000/api CATALOG_ROOT=/app/catalog npm run seed:catalog'
```
