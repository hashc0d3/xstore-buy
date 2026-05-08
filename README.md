# X:STORE

Docker-deploy for the main storefront.

## Production URL

- Web: `https://sotik77.ru`
- API: proxied internally through `/api`

## Deploy

```bash
docker compose up -d --build
```

The app exposes only local port `127.0.0.1:8083` (change with `WEB_PORT` env var) and is expected to run behind system `nginx`.

This does not require changing the `betatool` application itself. Only the shared nginx gateway config must include the `sotik77.ru` vhost.

Example `nginx` vhost:

```nginx
server {
    listen 80;
    server_name sotik77.ru www.sotik77.ru;
    return 301 https://sotik77.ru$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.sotik77.ru;
    return 301 https://sotik77.ru$request_uri;

    ssl_certificate /etc/letsencrypt/live/sotik77.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sotik77.ru/privkey.pem;
}

server {
    listen 443 ssl http2;
    server_name sotik77.ru;

    ssl_certificate /etc/letsencrypt/live/sotik77.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sotik77.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The same config is available in `deploy/nginx/sotik77.conf`.

## Update

```bash
git pull
docker compose up -d --build
```

## Data

The API uses SQLite in the Docker volume `api-data`.
Prisma migrations run automatically when the API container starts.
