import { seedDatabase } from './seed-runner';

const mockPrisma = () => ({
  admin: { count: jest.fn(), upsert: jest.fn() },
  contentBlock: { count: jest.fn(), upsert: jest.fn() },
  menuPage: {
    count: jest.fn(),
    upsert: jest.fn(),
  },
  menuButton: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
});

describe('seedDatabase', () => {
  it('onlyIfEmpty пропускает seed если БД не пуста', async () => {
    const prisma = mockPrisma();
    prisma.admin.count.mockResolvedValue(1);
    prisma.contentBlock.count.mockResolvedValue(0);
    prisma.menuPage.count.mockResolvedValue(0);

    await seedDatabase({
      onlyIfEmpty: true,
      prisma: prisma as never,
    });

    expect(prisma.admin.upsert).not.toHaveBeenCalled();
    expect(prisma.menuPage.upsert).not.toHaveBeenCalled();
  });
});
