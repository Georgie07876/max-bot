import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(): Promise<number> {
    return this.prisma.admin.count();
  }

  async findAll(): Promise<AdminRecord[]> {
    const admins = await this.prisma.admin.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return admins.map((a) => ({
      id: a.id,
      username: a.username,
      passwordHash: a.password,
      role: a.role,
      createdAt: a.createdAt,
    }));
  }

  async findByUsername(username: string): Promise<AdminRecord | null> {
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (!admin) return null;
    return {
      id: admin.id,
      username: admin.username,
      passwordHash: admin.password,
      role: admin.role,
      createdAt: admin.createdAt,
    };
  }

  async findById(id: string): Promise<AdminRecord | null> {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) return null;
    return {
      id: admin.id,
      username: admin.username,
      passwordHash: admin.password,
      role: admin.role,
      createdAt: admin.createdAt,
    };
  }

  async create(
    username: string,
    passwordHash: string,
    role = 'admin',
  ): Promise<AdminRecord> {
    const admin = await this.prisma.admin.create({
      data: { username, password: passwordHash, role },
    });
    return {
      id: admin.id,
      username: admin.username,
      passwordHash: admin.password,
      role: admin.role,
      createdAt: admin.createdAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.admin.delete({ where: { id } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.admin.update({
      where: { id },
      data: { password: passwordHash },
    });
  }
}
