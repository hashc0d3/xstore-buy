# Деплой и устройство сервера `debian-for-tests`

Этот документ описывает, как устроена инфраструктура сервера и как на нём
живут проекты `betatool`, `xstore` (xstore55.ru), `xstore-buy` (sotik77.ru).
Цель — чтобы любой агент/человек по этому файлу мог:

- понять, какой сервис куда проксируется и почему;
- обновить уже задеплоенный сайт;
- добавить новый домен/проект, не уронив остальные.

> Если только нужен короткий чек-лист «как добавить новый сайт», смотри
> [`ADD_NEW_SITE.md`](./ADD_NEW_SITE.md).

---

## 1. Общая схема

```
                         Интернет (80/443)
                                │
                                ▼
        ┌────────────────────────────────────────────┐
        │  infra-nginx  (Docker, network_mode: host) │
        │  /opt/infra-proxy                          │
        │  conf.d/sites.conf — все vhost'ы           │
        │  /etc/letsencrypt — SSL-сертификаты (ro)   │
        └────────────────────────────────────────────┘
                                │  proxy_pass http(s)://127.0.0.1:<порт>
                                ▼
   ┌───────────────────┬──────────────────────┬──────────────────────┐
   │ 127.0.0.1:8080    │ 127.0.0.1:8083       │ 127.0.0.1:18080      │
   │ /opt/xstore       │ /opt/xstore-buy      │ /opt/betatool        │
   │ (xstore55.ru)     │ (sotik77.ru)         │ (playbetatool.ru)    │
   │ web Next.js       │ web Next.js          │ внутренний nginx     │
   │ + api NestJS      │ + api NestJS         │ + бэкенд betatool    │
   └───────────────────┴──────────────────────┴──────────────────────┘
```

Главные принципы:

1. **Только один процесс держит публичные 80/443** — это `infra-nginx`
   из стека `/opt/infra-proxy`. Все остальные стек'и слушают только
   `127.0.0.1:<порт>`, поэтому никогда не конфликтуют между собой.
2. **`infra-nginx` запущен в `network_mode: host`**, чтобы видеть
   `127.0.0.1` с самого хоста. Без этого `proxy_pass` к локальным портам
   приложений не работает (получаем `502 Bad Gateway`).
3. **SSL — общий**, через `certbot` в `/etc/letsencrypt`. Этот каталог
   монтируется в `infra-nginx` read-only.
4. Каждое приложение разворачивается своим `docker compose` стеком в
   `/opt/<имя>` и не знает про другие. Это даёт изоляцию и независимый
   deploy.

---

## 2. Подключение к серверу

```bash
ssh debian-for-tests           # алиас в ~/.ssh/config на твоей машине
# или явно:
ssh root@155.117.46.144
```

Все рабочие операции в этом гайде делаются под `root`, в каталогах `/opt/...`.

---

## 3. Карта портов и доменов

| Домен (внешний)                         | Прокси-pass (на хосте)              | Стек                          | Каталог            |
|-----------------------------------------|--------------------------------------|--------------------------------|--------------------|
| `xstore55.ru`                           | `http://127.0.0.1:8080`             | `xstore` (web + api)           | `/opt/xstore`      |
| `sotik77.ru`, `www.sotik77.ru`          | `http://127.0.0.1:8083`             | `xstore-buy` (web + api)       | `/opt/xstore-buy`  |
| `playbetatool.ru`, `www.playbetatool.ru`| `https://127.0.0.1:18080`           | `betatool` (свой nginx внутри) | `/opt/betatool`    |

Заливка каталога в админку (те же скрипты, что локально): в образе `api` есть `npm run seed:catalog`; JSON — из `vegan/snifer/output` или копируются в контейнер. Подробно — в `README.md` репозиториев `vegan` и `vegan-skupka`.

Резервируй новый порт **из диапазона `8081–8099` или `18081+`** и запиши
его сюда после добавления нового сайта.

---

## 4. Содержимое каталогов на сервере

### 4.1 `/opt/infra-proxy` — реверс-прокси

```
/opt/infra-proxy/
├── docker-compose.yml         # один сервис: nginx (host network)
├── conf.d/
│   └── sites.conf             # все vhost'ы для всех доменов
└── certbot/                   # webroot для будущих обновлений Let's Encrypt
```

`docker-compose.yml`:

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    container_name: infra-nginx
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./certbot:/var/www/certbot:ro
```

`conf.d/sites.conf` — текущая рабочая версия:

```nginx
# ---------- HTTP → HTTPS редиректы ----------
server {
    listen 80;
    listen [::]:80;
    server_name playbetatool.ru www.playbetatool.ru;
    return 301 https://playbetatool.ru$request_uri;
}
server {
    listen 80;
    listen [::]:80;
    server_name sotik77.ru www.sotik77.ru;
    return 301 https://sotik77.ru$request_uri;
}
server {
    listen 80;
    listen [::]:80;
    server_name xstore55.ru www.xstore55.ru;
    return 301 https://xstore55.ru$request_uri;
}

# ---------- playbetatool.ru ----------
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name playbetatool.ru www.playbetatool.ru;

    ssl_certificate     /etc/letsencrypt/live/playbetatool.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/playbetatool.ru/privkey.pem;

    location / {
        proxy_pass         https://127.0.0.1:18080;
        proxy_http_version 1.1;
        proxy_ssl_server_name on;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
    }
}

# ---------- sotik77.ru ----------
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name sotik77.ru www.sotik77.ru;

    ssl_certificate     /etc/letsencrypt/live/sotik77.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sotik77.ru/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

# ---------- xstore55.ru ----------
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name xstore55.ru www.xstore55.ru;

    ssl_certificate     /etc/letsencrypt/live/xstore55.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xstore55.ru/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 `/opt/xstore-buy` — sotik77.ru (этот репозиторий)

```
/opt/xstore-buy/
├── docker-compose.yml   # api (внутр. 4000) + web (127.0.0.1:8083 → 3000)
├── api/                 # NestJS + Prisma + SQLite (volume api-data)
├── web/                 # Next.js
└── nginx/               # шаблоны vhost'ов на случай переезда
```

`docker-compose.yml` (важные строки):

```yaml
services:
  api:
    environment:
      CORS_ORIGIN: "https://www.sotik77.ru,https://sotik77.ru,..."
    volumes:
      - api-data:/data

  web:
    ports:
      - "127.0.0.1:8083:3000"   # ⚠️ только loopback, никогда не 0.0.0.0
```

### 4.3 `/opt/xstore` — xstore55.ru

Аналогично `xstore-buy`, но `web` слушает на `127.0.0.1:8080:3000`.

### 4.4 `/opt/betatool` — playbetatool.ru

У этого проекта свой внутренний nginx (исторически он сразу делает
HTTPS-терминирование). Поэтому он опубликован на хосте как
`127.0.0.1:18080:443`, а `infra-nginx` ходит к нему по **HTTPS**:

```yaml
# /opt/betatool/docker-compose.yml — фрагмент
services:
  nginx:
    ports:
      - "127.0.0.1:18080:443"
```

В `infra-nginx` для этого хоста стоит `proxy_pass https://127.0.0.1:18080`,
`proxy_ssl_server_name on` и `X-Forwarded-Proto https` — иначе получится
бесконечный редирект.

---

## 5. SSL-сертификаты

Все сертификаты выпускаются `certbot`-ом в **standalone**-режиме. Перед
выпуском нужно временно остановить `infra-nginx`, чтобы `certbot` смог
занять 80 порт.

```bash
# 1. Останавливаем фронт-прокси
cd /opt/infra-proxy
docker compose stop nginx

# 2. Выпускаем сертификат
certbot certonly --standalone \
  -d example.ru -d www.example.ru \
  --agree-tos -m admin@example.ru --non-interactive

# 3. Поднимаем прокси обратно
docker compose start nginx
```

Файлы окажутся в `/etc/letsencrypt/live/example.ru/` и автоматически
доступны контейнеру (каталог монтируется ro).

**Автообновление**: certbot ставит свой systemd-таймер. Чтобы он
перезагружал прокси после renewal, добавь deploy-hook (одноразово):

```bash
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat >/etc/letsencrypt/renewal-hooks/deploy/reload-infra-nginx.sh <<'EOF'
#!/bin/sh
docker exec infra-nginx nginx -s reload || true
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-infra-nginx.sh
```

> На время `renew` certbot тоже занимает 80 порт. Если хочется без
> остановки прокси — переходи на webroot-режим и проксируй
> `/.well-known/acme-challenge/` в `/opt/infra-proxy/certbot/`.

---

## 6. Обновление уже задеплоенного сайта

Стандартный цикл (на примере `xstore-buy`):

```bash
ssh debian-for-tests
cd /opt/xstore-buy

git pull origin main
docker compose up -d --build
docker compose ps
```

Проверка снаружи:

```bash
curl -I https://sotik77.ru
docker compose logs --tail=80 web
```

То же самое работает для `/opt/xstore` (xstore55.ru) и `/opt/betatool`,
с поправкой на ветку и название стека.

---

## 7. Добавление нового сайта (короткая версия)

Подробный плэйбук со всеми командами — в
[`ADD_NEW_SITE.md`](./ADD_NEW_SITE.md). Кратко шаги такие:

1. Привязать DNS: A-запись домена → `155.117.46.144`.
2. Подготовить проект в `/opt/<name>` со своим `docker compose`,
   опубликовать web-сервис только на `127.0.0.1:<свободный порт>`.
3. Выпустить сертификат через certbot (см. раздел 5).
4. Добавить 2 server-блока (HTTP→HTTPS редирект + HTTPS) в
   `/opt/infra-proxy/conf.d/sites.conf`.
5. Проверить и применить:
   ```bash
   docker exec infra-nginx nginx -t
   docker exec infra-nginx nginx -s reload
   ```
6. Проверить домен `curl -I https://<домен>` и записать выбранный порт
   в таблицу из раздела 3 этого документа.

---

## 8. Распространённые проблемы

| Симптом                              | Причина                                                               | Решение                                                                       |
|--------------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `502 Bad Gateway` от `infra-nginx`   | Контейнер app упал / слушает не на ожидаемом порту                    | `docker compose ps` в `/opt/<name>`, `docker compose logs`, проверить `ports:` |
| `502` после переноса прокси в bridge | `infra-nginx` без `network_mode: host` не видит `127.0.0.1` хоста     | Вернуть `network_mode: host`, убрать `ports:` и `extra_hosts:`                 |
| Бесконечный redirect loop            | App сам редиректит HTTP→HTTPS, а прокси ходит по HTTP                 | Либо проксируй на HTTPS-порт app, либо отключи внутренний редирект             |
| `Bind for 0.0.0.0:80 failed`         | Кто-то ещё слушает 80/443 (старый Caddy/nginx из приложения)         | В app-стеке обязательно `127.0.0.1:<порт>:3000`, а не `80:80`                  |
| `cannot load certificate`            | Сертификат для домена не выпущен                                      | Раздел 5: `certbot certonly --standalone -d ...`                              |
| Сайт показывает «не тот» контент     | Браузерный кеш / CDN                                                  | `Ctrl+F5`, инкогнито, либо `curl -I` с правильным `Host:`                      |
| `nginx: invalid number of arguments` | Опечатка в `sites.conf` (часто `proxy_pass` без схемы)                | `docker exec infra-nginx nginx -t` укажет файл и строку                       |

---

## 9. Полезные команды

```bash
# Кто слушает 80/443 на хосте:
ss -tlnp | grep -E ':80|:443'

# Все запущенные контейнеры:
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# Перечитать nginx без рестарта:
docker exec infra-nginx nginx -t && docker exec infra-nginx nginx -s reload

# Полный рестарт прокси (на ~1 секунду роняет все домены):
cd /opt/infra-proxy && docker compose restart nginx

# Логи отдельного приложения:
cd /opt/xstore-buy && docker compose logs -f --tail=200 web
```

---

## 10. Что НЕ ломать

- Не трогай `network_mode: host` у `infra-nginx`.
- Не публикуй порты 80/443 ни в одном app-стеке — только loopback.
- Не правь `/etc/nginx/...` напрямую: системный nginx на этом сервере
  не используется, конфиг живёт в `/opt/infra-proxy/conf.d/sites.conf`.
- Не выпускай сертификат, забыв остановить `infra-nginx` — будет ошибка
  «адрес уже занят».
- Не используй один и тот же порт `127.0.0.1:<port>` в двух стеках.
