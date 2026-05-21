import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BotService } from './bot.service';
import { BotLauncher } from './bot.launcher';
import { ContentModule } from '../content/content.module';
import { MenuService } from './menu.service';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    ContentModule,
  ],
  providers: [BotService, BotLauncher, MenuService],
  exports: [MenuService],
})
export class BotModule {}
