# X:STORE

Docker-deploy for the main storefront.

## Production URL

- Web: `https://sotik77.ru`
- API: proxied internally through `/api`

## Deploy

```bash
docker compose up -d --build
```

Caddy listens on ports `80` and `443`, proxies traffic to the Next.js container, and issues the SSL certificate automatically.

## Update

```bash
git pull
docker compose up -d --build
```

## Data

The API uses SQLite in the Docker volume `api-data`.
Prisma migrations run automatically when the API container starts.
