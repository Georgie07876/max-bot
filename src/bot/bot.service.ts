import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Keyboard } from '@maxhub/max-bot-api';
import { ContentService } from '../content/content.service';
import { MenuService } from './menu.service';

// KeyboardButtons не экспортируется из bot.buttons.ts (там только данные).
// Определяем тип здесь. any[][]
// @maxhub/max-bot-api не предоставляет строгих типов для кнопок.
type KeyboardButtons = any[][]; // eslint-disable-line @typescript-eslint/no-explicit-any

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

  /**
   * Количество активных пользователей за последние 2 минуты.
   * Redis хранит ключи с TTL — они автоматически истекают.
   */
  async getActiveUsersCount(): Promise<number> {
    const keys = await this.redis.keys('user:*:status');
    return keys.length;
  }

  handleCallback(data: string, userName = 'студент'): BotResponse {
    const startMenu = this.menuService.getMenu('main');
    const welcomeText =
      startMenu?.text.replace('Добро пожаловать!', `Привет, ${userName}!`) ??
      `👋 Привет, ${userName}!`;

    if (data === 'nav_start' || data === 'main') {
      return this.buildMenuResponse('main', welcomeText);
    }

    const menu = this.menuService.getMenu(data);
    if (menu) {
      return this.buildMenuResponse(data, menu.text);
    }

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

    const rows: KeyboardButtons = [];
    for (const btn of menu.buttons) {
      if (btn.type === 'url') {
        rows.push([Keyboard.button.link(btn.label, btn.value)]);
      } else {
        rows.push([Keyboard.button.callback(btn.label, btn.value)]);
      }
    }

    if (menu.parent) {
      rows.push([Keyboard.button.callback('↩️ Назад', menu.parent)]);
    }
    if (menuId !== 'main') {
      rows.push([Keyboard.button.callback('⬅️ В начало', 'nav_start')]);
    }

    return { text, reply_markup: { inline_keyboard: rows } };
  }

  getMainMenuKeyboard(): KeyboardButtons {
    const menu = this.menuService.getMenu('main');
    if (!menu) {
      return [[Keyboard.button.callback('⬅️ В начало', 'nav_start')]];
    }
    const result: KeyboardButtons = [];
    for (const btn of menu.buttons) {
      if (btn.type === 'url') {
        result.push([Keyboard.button.link(btn.label, btn.value)]);
      } else {
        result.push([Keyboard.button.callback(btn.label, btn.value)]);
      }
    }
    return result;
  }
}
