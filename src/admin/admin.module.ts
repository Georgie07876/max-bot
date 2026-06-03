import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { ContentModule } from '../content/content.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [ContentModule, BotModule],
  controllers: [AdminController],
  providers: [AdminRepository, AdminService],
})
export class AdminModule {}
