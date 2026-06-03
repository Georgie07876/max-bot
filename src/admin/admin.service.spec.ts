import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';

describe('AdminService', () => {
  let service: AdminService;
  let repository: jest.Mocked<
    Pick<
      AdminRepository,
      | 'count'
      | 'findByUsername'
      | 'findById'
      | 'findAll'
      | 'create'
      | 'delete'
      | 'updatePassword'
    >
  >;

  beforeEach(() => {
    repository = {
      count: jest.fn().mockResolvedValue(1),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      updatePassword: jest.fn(),
    };
    service = new AdminService(repository as unknown as AdminRepository);
  });

  it('validateSuperAdmin возвращает false без пароля в env', () => {
    const original = process.env.SUPER_ADMIN_PASSWORD;
    process.env.SUPER_ADMIN_PASSWORD = '';
    expect(service.validateSuperAdmin('superadmin', 'secret')).toBe(false);
    process.env.SUPER_ADMIN_PASSWORD = original;
  });

  it('createAdmin требует пароль не короче 8 символов', async () => {
    await expect(service.createAdmin('user1', 'short')).rejects.toThrow(
      'не менее 8 символов',
    );
  });
});
