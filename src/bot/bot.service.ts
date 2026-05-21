import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Keyboard } from '@maxhub/max-bot-api';
import type { KeyboardButtons } from './bot.buttons';
import { ContentService } from '../content/content.service';
import { MenuService } from './menu.service';

interface BotResponse {
  text: string;
  reply_markup: { inline_keyboard: KeyboardButtons };
}

@Injectable()
export class BotService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly contentService: ContentService,
    private readonly menuService: MenuService,
  ) {}

  async updateUserActivity(userId: string): Promise<void> {
    await this.redis.setex(`user:${userId}:status`, 120, 'active');
  }

  handleCallback(data: string, userName = 'студент'): BotResponse {
    const startMenu = this.menuService.getMenu('main');
    const welcomeText =
      startMenu?.text.replace('Добро пожаловать!', `Привет, ${userName}!`) ??
      `👋 Привет, ${userName}!`;

    // Главное меню / В начало
    if (data === 'nav_start' || data === 'main') {
      return this.buildMenuResponse('main', welcomeText);
    }

    // Проверяем — есть ли меню с таким ID
    const menu = this.menuService.getMenu(data);
    if (menu) {
      return this.buildMenuResponse(data, menu.text);
    }

    // Проверяем контент
    const content = this.contentService.get(data);
    if (content) {
      const parentMenuId = this.menuService.findParentMenuId(data) ?? 'main';
      return {
        text: content,
        reply_markup: {
          inline_keyboard: [
            [Keyboard.button.callback('↩️ Назад', parentMenuId)],
            [Keyboard.button.callback('⬅️ В начало', 'nav_start')],
          ],
        },
      };
    }

    // Fallback
    return {
      text: 'Упс! Информация по этому разделу ещё наполняется.',
      reply_markup: {
        inline_keyboard: [
          [Keyboard.button.callback('⬅️ В начало', 'nav_start')],
        ],
      },
    };
  }

  private buildMenuResponse(menuId: string, text: string): BotResponse {
    const menu = this.menuService.getMenu(menuId);
    if (!menu) return this.handleCallback('nav_start');

    const rows: KeyboardButtons = menu.buttons.map((btn) => {
      if (btn.type === 'url') {
        return [Keyboard.button.link(btn.label, btn.value)];
      }
      return [Keyboard.button.callback(btn.label, btn.value)];
    });

    // Добавляем кнопку "Назад" если есть родитель
    if (menu.parent) {
      rows.push([Keyboard.button.callback('↩️ Назад', menu.parent)]);
    }
    if (menuId !== 'main') {
      rows.push([Keyboard.button.callback('⬅️ В начало', 'nav_start')]);
    }

    return { text, reply_markup: { inline_keyboard: rows } };
  }

  // Для приветствия в bot.launcher.ts
  getMainMenuKeyboard(): KeyboardButtons {
    const menu = this.menuService.getMenu('main');
    if (!menu) return [[Keyboard.button.callback('⬅️ В начало', 'nav_start')]];
    return menu.buttons.map((btn) =>
      btn.type === 'url'
        ? [Keyboard.button.link(btn.label, btn.value)]
        : [Keyboard.button.callback(btn.label, btn.value)],
    );
  }
}
