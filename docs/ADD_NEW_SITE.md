# Плэйбук: добавить новый сайт на сервер

Короткий пошаговый гайд для добавления нового домена/проекта на сервер
`debian-for-tests`. Контекст и архитектура подробно описаны в
[`SERVER_DEPLOYMENT.md`](./SERVER_DEPLOYMENT.md). Здесь — только команды.

В примерах используется условный домен **`example.ru`** и условный
свободный порт **`127.0.0.1:8090`**. Меняй на свои значения.

---

## 0. Что нужно подготовить ДО входа на сервер

- [ ] DNS: `A`-запись `example.ru` и `www.example.ru` → `155.117.46.144`,
      и дождаться, пока `dig +short example.ru` отдаёт нужный IP.
- [ ] Репозиторий проекта с `docker-compose.yml`, в котором web-сервис
      слушает на `0.0.0.0:3000` **внутри** контейнера. На хост сервис
      будет публиковаться только через `127.0.0.1:<port>`.
- [ ] Свободный порт. Текущая занятость — в
      [SERVER_DEPLOYMENT.md → раздел 3](./SERVER_DEPLOYMENT.md#3-карта-портов-и-доменов).
      Бери из диапазона `8081–8099` или `18081+`.

---

## 1. Заходим и клонируем проект

```bash
ssh debian-for-tests
cd /opt
git clone https://github.com/<owner>/<repo>.git example
cd /opt/example
```

> Имя каталога обычно совпадает с проектом (`/opt/xstore-buy`,
> `/opt/betatool` и т.д.).

---

## 2. Настраиваем docker-compose под loopback-порт

Открой `docker-compose.yml` и убедись, что web-сервис публикуется
**только** на `127.0.0.1`:

```yaml
services:
  web:
    ports:
      - "127.0.0.1:8090:3000"   # ← обязательно с 127.0.0.1
```

Если в проекте есть свой Caddy/nginx, который хочет 80/443 — выключи
его. Внешним прокси у нас всегда `infra-nginx`.

Если у API есть `CORS_ORIGIN` — допиши туда новый домен:

```yaml
api:
  environment:
    CORS_ORIGIN: "https://example.ru,https://www.example.ru"
```

Запусти стек:

```bash
docker compose up -d --build
docker compose ps          # web должен быть Up, ports: 127.0.0.1:8090->3000
curl -I http://127.0.0.1:8090   # ожидаем 200/301/302, а не connection refused
```

---

## 3. Выпускаем SSL-сертификат

`certbot` использует standalone-режим, поэтому 80 порт ему нужно
освободить, остановив `infra-nginx` буквально на минуту.

```bash
cd /opt/infra-proxy
docker compose stop nginx

certbot certonly --standalone \
  -d example.ru -d www.example.ru \
  --agree-tos -m admin@example.ru --non-interactive

docker compose start nginx
```

Проверь, что сертификат на месте:

```bash
ls /etc/letsencrypt/live/example.ru/
# должны быть fullchain.pem и privkey.pem
```

> Если домен ещё не отрезолвился — certbot вернёт ошибку валидации.
> Подожди распространение DNS (`dig +short example.ru` должен показывать
> IP сервера) и попробуй снова.

---

## 4. Добавляем vhost в `infra-nginx`

```bash
nano /opt/infra-proxy/conf.d/sites.conf
```

Допиши **в конец** файла два блока:

```nginx
# ---------- example.ru ----------
server {
    listen 80;
    listen [::]:80;
    server_name example.ru www.example.ru;
    return 301 https://example.ru$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name example.ru www.example.ru;

    ssl_certificate     /etc/letsencrypt/live/example.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.ru/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Если приложение само терминирует HTTPS на своём порту (как `betatool`),
используй вариант с `https://127.0.0.1:<port>` и `proxy_ssl_server_name on`
(см. блок `playbetatool.ru` в [SERVER_DEPLOYMENT.md](./SERVER_DEPLOYMENT.md#41-optinfra-proxy--реверс-прокси)).

---

## 5. Проверяем конфиг и перечитываем nginx

```bash
docker exec infra-nginx nginx -t
docker exec infra-nginx nginx -s reload
```

Если `nginx -t` ругается — он точно укажет файл и строку. Чаще всего
это лишний/недостающий `;`, незакрытый `}` или схема в `proxy_pass`
(`http://` обязательна).

---

## 6. Финальная проверка

```bash
curl -I http://example.ru        # 301 → https
curl -I https://example.ru       # 200 OK
curl -I https://www.example.ru   # 200 OK (или 301 на основной домен)
```

И открой `https://example.ru` в браузере с hard refresh (`Ctrl+F5`).

---

## 7. Запиши изменение

После успешного деплоя обнови таблицу портов в
[SERVER_DEPLOYMENT.md → раздел 3](./SERVER_DEPLOYMENT.md#3-карта-портов-и-доменов),
чтобы следующий деплой не выбрал тот же порт.

---

## Откат

Если что-то пошло не так и сайт ломает остальные:

```bash
# Вернуть sites.conf
nano /opt/infra-proxy/conf.d/sites.conf   # удалить добавленные блоки
docker exec infra-nginx nginx -t
docker exec infra-nginx nginx -s reload

# Остановить стек нового приложения
cd /opt/example && docker compose down
```

Остальные сайты при этом продолжают работать, потому что у них свои
независимые стеки.
