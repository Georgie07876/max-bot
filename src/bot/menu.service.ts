import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MenuRepository } from './menu.repository';
import type { MenuButton, MenuItem, MenuMap } from './menu.types';

export type { MenuButton, MenuItem, MenuMap } from './menu.types';

@Injectable()
export class MenuService implements OnModuleInit {
  private readonly logger = new Logger(MenuService.name);

  constructor(private readonly menuRepository: MenuRepository) {}

  async onModuleInit(): Promise<void> {
    const total = await this.menuRepository.countPages();
    this.logger.log(`Меню в БД: ${total} шт.`);
    if (total === 0) {
      this.logger.warn(
        'Таблица меню пуста. Выполните: npm run db:seed',
      );
    }
  }

  async getAll(): Promise<MenuMap> {
    return this.menuRepository.findAllAsMap();
  }

  async getMenu(id: string): Promise<MenuItem | null> {
    return this.menuRepository.findById(id);
  }

  async findParentMenuId(callbackValue: string): Promise<string | null> {
    return this.menuRepository.findParentMenuId(callbackValue);
  }

  async updateMenuText(menuId: string, text: string): Promise<void> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) throw new Error(`Меню "${menuId}" не найдено`);
    await this.menuRepository.updateText(menuId, text);
  }

  async addMenu(id: string, text: string, parent: string | null): Promise<void> {
    const existing = await this.menuRepository.findById(id);
    if (existing) throw new Error(`Меню "${id}" уже существует`);
    await this.menuRepository.createPage(id, text, parent);
  }

  async deleteMenu(id: string): Promise<void> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) throw new Error(`Меню "${id}" не найдено`);
    await this.menuRepository.deletePage(id);
  }

  async addButton(
    menuId: string,
    label: string,
    type: 'callback' | 'url',
    value: string,
  ): Promise<MenuButton> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) throw new Error(`Меню "${menuId}" не найдено`);
    return this.menuRepository.createButton(menuId, label, type, value);
  }

  async updateButton(
    menuId: string,
    btnId: string,
    label: string,
    type: 'callback' | 'url',
    value: string,
  ): Promise<void> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) throw new Error(`Меню "${menuId}" не найдено`);
    await this.menuRepository.updateButton(menuId, btnId, label, type, value);
  }

  async deleteButton(menuId: string, btnId: string): Promise<void> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) throw new Error(`Меню "${menuId}" не найдено`);
    await this.menuRepository.deleteButton(menuId, btnId);
  }

  async moveButton(
    menuId: string,
    btnId: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    await this.menuRepository.moveButton(menuId, btnId, direction);
  }
}
