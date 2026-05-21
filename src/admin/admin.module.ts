import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ContentModule } from '../content/content.module';
import { MenuService } from '../bot/menu.service';

@Module({
  imports: [ContentModule],
  controllers: [AdminController],
  providers: [AdminService, MenuService],
})
export class AdminModule {}
