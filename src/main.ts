import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'rinh-bot-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Приложение запущено на порту ${port}`);
  console.log(`Панель управления: http://localhost:${port}/admin`);
}

void bootstrap().catch((err: unknown) => {
  console.error('Ошибка при запуске приложения:', err);
});
