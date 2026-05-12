# Откуда деплоится SOTIK77 (xstore-buy)

| Что | Где |
|-----|-----|
| **Локальная разработка (ваш ПК)** | `C:\Users\jasper\Documents\vegan-skupka` — эта папка |
| **Публичный репозиторий** | [github.com/hashc0d3/xstore-buy](https://github.com/hashc0d3/xstore-buy), ветка **`main`** |
| **Прод на сервере** | Клон репозитория, обычно `/opt/xstore-buy` (см. [README.md](./README.md)) |

## Поток работы

1. Правки в **`vegan-skupka`** → коммит → `git push origin main` в удалённый **`xstore-buy`**.
2. На сервере одной строкой: `cd /opt/xstore-buy && git pull origin main && docker compose up -d --build` (отдельный `.env` не нужен — см. `docker-compose.yml`).

Сайт **www.sotik77.ru** обслуживается общим nginx (`infra-nginx`); upstream — порт из compose (по умолчанию **8083**), см. `nginx/sotik77.ru.conf`.

Репозиторий **vegan** (`hashc0d3/xstore`) и каталог **`vegan`** на диске — это **отдельный** проект X:STORE; не смешивайте push в два разных remote без осознанного выбора.
