import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ContentMap = Record<string, string>;

@Injectable()
export class ContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(): Promise<number> {
    return this.prisma.contentBlock.count();
  }

  async findAllAsMap(): Promise<ContentMap> {
    const blocks = await this.prisma.contentBlock.findMany();
    const map: ContentMap = {};
    for (const block of blocks) {
      map[block.id] = block.text;
    }
    return map;
  }

  async findByKey(key: string): Promise<string | null> {
    const block = await this.prisma.contentBlock.findUnique({
      where: { id: key },
      select: { text: true },
    });
    return block?.text ?? null;
  }

  async upsert(key: string, text: string): Promise<string> {
    const existing = await this.prisma.contentBlock.findUnique({
      where: { id: key },
      select: { text: true },
    });
    const oldText = existing?.text ?? '';

    await this.prisma.$transaction(async (tx) => {
      await tx.contentBlock.upsert({
        where: { id: key },
        update: { text },
        create: { id: key, text },
      });
    });

    return oldText;
  }

  async upsertWithAudit(
    key: string,
    text: string,
    adminName: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.contentBlock.findUnique({
        where: { id: key },
        select: { text: true },
      });
      const oldText = existing?.text ?? '';

      await tx.contentBlock.upsert({
        where: { id: key },
        update: { text },
        create: { id: key, text },
      });

      if (oldText !== text) {
        await tx.contentAuditLog.create({
          data: { blockId: key, adminName, oldText, newText: text },
        });
      }
    });
  }
}
