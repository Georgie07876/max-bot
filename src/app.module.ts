import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [BotModule, AdminModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
