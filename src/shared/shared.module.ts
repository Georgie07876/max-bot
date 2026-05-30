import { Global, Module } from '@nestjs/common';
import { MenuService } from '../bot/menu.service';

/**
 * SharedModule решает проблему двух экземпляров MenuService.
 * Декоратор @Global() делает провайдеры доступными во всём приложении
 * без необходимости импортировать модуль повторно.
 */
@Global()
@Module({
  providers: [MenuService],
  exports: [MenuService],
})
export class SharedModule {}
