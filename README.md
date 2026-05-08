# X:STORE

Docker-deploy for the main storefront.

## Production URL

- Web: `https://xstore55.ru`
- API: proxied internally through `/api`

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
sudo certbot --nginx -d xstore55.ru
```

## Update

```bash
git pull
docker compose up -d --build
```

## Data

The API uses SQLite in the Docker volume `api-data`.
Prisma migrations run automatically when the API container starts.
