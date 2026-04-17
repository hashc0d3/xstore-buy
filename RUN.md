# Запуск проекта XSTORE

## Структура

- `api` — backend на NestJS
- `web` — frontend на Next.js

## Требования

- Node.js 18+ (рекомендуется 20+)
- npm

## Установка зависимостей

Выполните отдельно для каждой части:

```bash
cd api
npm install
```

```bash
cd web
npm install
```

## Запуск backend

```bash
cd api
npm run start:dev
```

После запуска API доступен по адресу:

- `http://localhost:4000/api`

Проверка:

- `GET http://localhost:4000/api/store`

## Запуск frontend

```bash
cd web
npm run dev
```

Обычно фронтенд открывается на:

- `http://localhost:3000`

Если порт 3000 занят, Next может выбрать другой (например `3001`).

## Если Next.js пишет, что dev-сервер уже запущен

Это значит, что в этой папке уже работает процесс `next dev`.

Остановить процесс по PID (Windows):

```bash
taskkill /PID <PID> /F
```

После этого снова:

```bash
npm run dev
```

