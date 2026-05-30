# ── СТАДИЯ 1: сборка ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

# ── СТАДИЯ 2: production-образ ─────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Только production зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Артефакты сборки
COPY --from=builder /app/dist ./dist
COPY src/admin/admin.html ./dist/admin/admin.html

# Создаём директорию для данных
RUN mkdir -p /app/data

# Непривилегированный пользователь (security best practice)
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]