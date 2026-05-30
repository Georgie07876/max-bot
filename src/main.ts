import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import session from 'express-session';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ── БЕЗОПАСНОСТЬ: HTTP-заголовки ──────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          // ИСПРАВЛЕНО: helmet v8 автоматически добавляет script-src-attr: 'none',
          // что блокирует onclick/onchange и другие inline-обработчики в admin.html.
          // scriptSrc: 'unsafe-inline' покрывает только <script> теги, но НЕ атрибуты.
          // Решение: явно разрешить inline-атрибуты для /admin
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );

  // ── RATE LIMITING: Защита от брутфорса ────────────────────────
  app.use(
    '/admin/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: { ok: false, error: 'Слишком много попыток. Попробуйте позже.' },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ── СЕССИИ ────────────────────────────────────────────────────
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    logger.error(
      'SESSION_SECRET не задан! Используется небезопасное значение.',
    );
  }

  app.use(
    session({
      secret: sessionSecret ?? 'CHANGE_ME_IN_PRODUCTION_' + String(Date.now()),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  // ── ГЛОБАЛЬНАЯ ВАЛИДАЦИЯ ──────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
  logger.log(`Приложение запущено на порту ${port}`);
  logger.log(`Панель управления: http://localhost:${port}/admin`);
}

void bootstrap().catch((err: unknown) => {
  console.error('Критическая ошибка при запуске:', err);
  process.exit(1);
});
