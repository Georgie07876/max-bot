import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class StatsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /** Активные пользователи за последние 2 минуты (TTL-ключи Redis). */
  async getActiveUsersCount(): Promise<number> {
    let cursor = '0';
    let total = 0;

    do {
      const [next, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        'user:*:status',
        'COUNT',
        100,
      );
      cursor = next;
      total += keys.length;
    } while (cursor !== '0');

    return total;
  }
}
