import { ContentService } from './content.service';
import { ContentRepository } from './content.repository';

describe('ContentService', () => {
  let service: ContentService;
  let repository: jest.Mocked<
    Pick<
      ContentRepository,
      'count' | 'findByKey' | 'findAllAsMap' | 'upsertWithAudit'
    >
  >;

  beforeEach(() => {
    repository = {
      count: jest.fn().mockResolvedValue(1),
      findByKey: jest.fn(),
      findAllAsMap: jest.fn(),
      upsertWithAudit: jest.fn(),
    };
    service = new ContentService(repository as unknown as ContentRepository);
  });

  it('get возвращает текст по ключу', async () => {
    repository.findByKey.mockResolvedValue('текст кафедры');
    await expect(service.get('fac_management')).resolves.toBe('текст кафедры');
  });

  it('update делегирует запись в репозиторий с audit', async () => {
    await service.update('fac_management', 'новый текст', 'editor');
    expect(repository.upsertWithAudit).toHaveBeenCalledWith(
      'fac_management',
      'новый текст',
      'editor',
    );
  });
});
