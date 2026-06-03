import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContentModule } from '../content/content.module';
import { BotService } from './bot.service';
import { BotLauncher } from './bot.launcher';
import { StatsService } from '../stats/stats.service';

@Module({
  imports: [
    ContentModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),
  ],
  providers: [BotService, BotLauncher, StatsService],
  exports: [BotService, StatsService],
})
export class BotModule {}
