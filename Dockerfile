# ── СТАДИЯ 1: сборка ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build

# ── СТАДИЯ 2: production-образ ─────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY prisma ./prisma
COPY src/prisma ./src/prisma
COPY src/bot/default-menus.ts ./src/bot/default-menus.ts
COPY src/bot/menu.types.ts ./src/bot/menu.types.ts

COPY --from=builder /app/dist ./dist
COPY src/admin/admin.html ./dist/admin/admin.html

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app/data

USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx src/prisma/seed-if-empty.ts && node dist/main"]
