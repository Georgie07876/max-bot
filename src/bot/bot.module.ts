import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { BotLauncher } from './bot.launcher';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),
    ContentModule,
  ],
  providers: [BotService, BotLauncher],
})
export class BotModule {}
