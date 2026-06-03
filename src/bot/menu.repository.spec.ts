import { MenuRepository } from './menu.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('MenuRepository', () => {
  let repository: MenuRepository;
  let prisma: {
    menuPage: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    menuButton: {
      findFirst: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      menuPage: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      menuButton: {
        findFirst: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    repository = new MenuRepository(prisma as unknown as PrismaService);
  });

  it('countPages возвращает количество страниц', async () => {
    prisma.menuPage.count.mockResolvedValue(12);
    await expect(repository.countPages()).resolves.toBe(12);
  });

  it('findById возвращает null если страница не найдена', async () => {
    prisma.menuPage.findUnique.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('createPage создаёт запись в БД', async () => {
    prisma.menuPage.create.mockResolvedValue({});
    await repository.createPage('new_menu', 'Hello', 'main');
    expect(prisma.menuPage.create).toHaveBeenCalledWith({
      data: { id: 'new_menu', text: 'Hello', parent: 'main' },
    });
  });
});
