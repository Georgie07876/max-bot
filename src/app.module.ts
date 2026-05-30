import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { AdminModule } from './admin/admin.module';
import { SharedModule } from './shared/shared.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
    }),
    SharedModule,
    BotModule,
    AdminModule,
    PrismaModule,
  ],
})
export class AppModule {}
