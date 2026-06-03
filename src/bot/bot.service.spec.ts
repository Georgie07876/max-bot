import { BotService } from './bot.service';
import { ContentService } from '../content/content.service';
import { MenuService } from './menu.service';
import { StatsService } from '../stats/stats.service';

describe('BotService', () => {
  let service: BotService;
  let menuService: jest.Mocked<Pick<MenuService, 'getMenu' | 'findParentMenuId'>>;
  let contentService: jest.Mocked<Pick<ContentService, 'get'>>;
  const redis = { setex: jest.fn(), keys: jest.fn() };
  const statsService = { getActiveUsersCount: jest.fn() };

  beforeEach(() => {
    menuService = {
      getMenu: jest.fn(),
      findParentMenuId: jest.fn(),
    };
    contentService = {
      get: jest.fn(),
    };
    service = new BotService(
      redis as never,
      contentService as unknown as ContentService,
      menuService as unknown as MenuService,
      statsService as unknown as StatsService,
    );
  });

  it('handleCallback возвращает главное меню для nav_start', async () => {
    menuService.getMenu.mockResolvedValue({
      text: '👋 Добро пожаловать!',
      parent: null,
      buttons: [
        { id: 'b1', label: 'Контакты', type: 'callback', value: 'menu_contacts' },
      ],
    });

    const response = await service.handleCallback('nav_start', 'Иван');
    expect(response.text).toContain('Привет, Иван');
    expect(menuService.getMenu).toHaveBeenCalledWith('main');
  });

  it('handleCallback возвращает контент по ключу', async () => {
    menuService.getMenu.mockResolvedValue(null);
    contentService.get.mockResolvedValue('Контакты кафедры');
    menuService.findParentMenuId.mockResolvedValue('contacts_faculties');

    const response = await service.handleCallback('fac_management');
    expect(response.text).toBe('Контакты кафедры');
  });
});
