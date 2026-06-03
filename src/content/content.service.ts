import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ContentRepository } from './content.repository';

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);

  constructor(private readonly contentRepository: ContentRepository) {}

  async onModuleInit(): Promise<void> {
    const total = await this.contentRepository.count();
    this.logger.log(`Контент в БД: ${total} записей`);
    if (total === 0) {
      this.logger.warn(
        'Таблица контента пуста. Выполните: npm run db:seed',
      );
    }
  }

  async get(key: string): Promise<string | null> {
    return this.contentRepository.findByKey(key);
  }

  async getAll(): Promise<Record<string, string>> {
    return this.contentRepository.findAllAsMap();
  }

  async update(key: string, value: string, adminName = 'admin'): Promise<void> {
    await this.contentRepository.upsertWithAudit(key, value, adminName);
    this.logger.log(`Обновлён ключ "${key}" администратором "${adminName}"`);
  }
}
