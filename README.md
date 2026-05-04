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
