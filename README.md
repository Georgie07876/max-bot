# rinh-max-bot

Чат-помощник для студентов **РГЭУ (РИНХ)** в мессенджере **MAX** и веб-панель для редактирования контента и меню без перезапуска бота.

Один сервер NestJS одновременно:
- принимает события от MAX (команды, нажатия кнопок);
- отдаёт админ-панель и REST API для редакторов;
- хранит данные в SQLite, активность пользователей — в Redis.

## Быстрый старт

### Требования

- Node.js 20+
- Redis (локально или Docker)
- Токен бота MAX (`BOT_TOKEN`)

### Установка

```bash
cp .env.example .env
```

Заполните в `.env` как минимум:

| Переменная | Назначение |
|------------|------------|
| `BOT_TOKEN` | Токен бота в MAX |
| `SESSION_SECRET` | Секрет для cookie-сессий админки (длинная случайная строка) |
| `SUPER_ADMIN_PASSWORD` | Пароль суперадмина (логин по умолчанию `superadmin`) |
| `REDIS_URL` | Например `redis://localhost:6379` |
| `DATABASE_URL` | Например `file:./dev.db` |
| `PORT` | HTTP-порт (по умолчанию `3000`) |

```bash
npm install
npm run db:setup          # migrate + seed
npm run admin:build       # сборка Vue-панели
npm run start:dev         # prestart: nest build + copy admin-ui
```

- Бот в MAX: команда `/start`
- Админка: `http://localhost:<PORT>/admin` (логин: `superadmin` или пользователь из БД после seed)

### Redis без установки в систему

```bash
docker run -d --name rinh-redis -p 6379:6379 redis:7-alpine
```

## Основные команды

| Команда | Назначение |
|---------|------------|
| `npm run start:dev` | Разработка: сборка + watch Nest |
| `npm run build` | Production-сборка (backend + admin-ui) |
| `npm run start:prod` | Запуск `node dist/main.js` |
| `npm run admin:build` | Собрать Vue-панель (`admin-ui/dist`) |
| `npm run admin:dev` | Vite dev-сервер панели (:5173, proxy на backend) |
| `npm run copy:admin-ui` | Скопировать `admin-ui/dist` → `dist/admin-ui` |
| `npm run db:migrate` | Применить миграции Prisma |
| `npm run db:seed` | Импорт из `data/*.json` (только seed, не runtime) |
| `npm run db:setup` | `migrate` + `seed` |
| `npm test` | Unit-тесты (Jest) |

## Docker (production)

```bash
docker compose up -d --build
```

При старте: `prisma migrate deploy` → seed если БД пуста → `node dist/main.js`.  
SQLite в volume `app_data`, Redis — отдельный контейнер.

## Импорт начальных данных

Единственная точка импорта JSON — **`npm run db:seed`**:

| Файл | Таблицы |
|------|---------|
| `data/admins.json` | `Admin` |
| `data/content.json` | `ContentBlock` |
| `data/menus.json` | `MenuPage`, `MenuButton` |
| *(нет `menus.json`)* | `getDefaultMenus()` в коде |

В **runtime** приложение читает и пишет только **SQLite через Prisma**, не JSON на диске.

## Структура репозитория

```
src/
  bot/          # MAX-бот: launcher, логика ответов, меню
  admin/        # HTTP: админка, API, guards
  content/      # Текстовые блоки + аудит
  stats/        # Подсчёт активных пользователей (Redis)
  prisma/       # Seed, PrismaService
admin-ui/       # Vue 3 SPA (Vite)
prisma/         # schema, migrations
data/           # JSON только для seed
```

Слои: **Controller / BotLauncher → Service → Repository → Prisma → SQLite**.

## Подробная документация

Полное описание архитектуры, данных, БД, нагрузки и обоснование решений — в файле **[docs/PROJECT.md](./docs/PROJECT.md)** (аудит, стек, сценарии для новичка, ER-схема, масштабирование).

## Лицензия

UNLICENSED (частный / учебный проект).
