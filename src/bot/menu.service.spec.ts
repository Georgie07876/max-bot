import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';

describe('MenuService', () => {
  let service: MenuService;
  let repository: jest.Mocked<
    Pick<
      MenuRepository,
      | 'countPages'
      | 'findById'
      | 'findAllAsMap'
      | 'createPage'
      | 'updateText'
      | 'deletePage'
      | 'createButton'
    >
  >;

  beforeEach(() => {
    repository = {
      countPages: jest.fn().mockResolvedValue(5),
      findById: jest.fn(),
      findAllAsMap: jest.fn(),
      createPage: jest.fn(),
      updateText: jest.fn(),
      deletePage: jest.fn(),
      createButton: jest.fn(),
    };
    service = new MenuService(repository as unknown as MenuRepository);
  });

  it('addMenu создаёт страницу через репозиторий', async () => {
    repository.findById.mockResolvedValue(null);
    await service.addMenu('test_menu', 'Текст', 'main');
    expect(repository.createPage).toHaveBeenCalledWith(
      'test_menu',
      'Текст',
      'main',
    );
  });

  it('addMenu бросает ошибку если меню уже существует', async () => {
    repository.findById.mockResolvedValue({
      text: 'x',
      parent: null,
      buttons: [],
    });
    await expect(service.addMenu('main', 'x', null)).rejects.toThrow(
      'уже существует',
    );
  });

  it('deleteMenu удаляет через репозиторий', async () => {
    repository.findById.mockResolvedValue({
      text: 'x',
      parent: null,
      buttons: [],
    });
    await service.deleteMenu('test_menu');
    expect(repository.deletePage).toHaveBeenCalledWith('test_menu');
  });
});
