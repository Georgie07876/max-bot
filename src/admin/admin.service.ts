import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { AdminRepository } from './admin.repository';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'superAdmin';
  createdAt: string;
}

export type SafeAdminUser = Omit<AdminUser, 'passwordHash'>;

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly adminRepository: AdminRepository) {}

  async onModuleInit(): Promise<void> {
    const total = await this.adminRepository.count();
    this.logger.log(`Администраторы в БД: ${total} шт.`);
    if (total === 0) {
      this.logger.warn(
        'Таблица администраторов пуста. Выполните: npm run db:seed',
      );
    }
  }

  private toSafeUser(user: AdminUser): SafeAdminUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private recordToUser(record: {
    id: string;
    username: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
  }): AdminUser {
    return {
      id: record.id,
      username: record.username,
      passwordHash: record.passwordHash,
      role: record.role as AdminUser['role'],
      createdAt: record.createdAt.toISOString(),
    };
  }

  validateSuperAdmin(username: string, password: string): boolean {
    const envUser = process.env.SUPER_ADMIN_USERNAME ?? 'superadmin';
    const envPass = process.env.SUPER_ADMIN_PASSWORD ?? '';

    if (!envPass) {
      this.logger.error(
        'SUPER_ADMIN_PASSWORD не задан! Вход суперадмина невозможен.',
      );
      return false;
    }

    try {
      if (
        username.length !== envUser.length ||
        password.length !== envPass.length
      ) {
        return false;
      }
      const userMatch = timingSafeEqual(
        Buffer.from(username),
        Buffer.from(envUser),
      );
      const passMatch = timingSafeEqual(
        Buffer.from(password),
        Buffer.from(envPass),
      );
      return userMatch && passMatch;
    } catch {
      return false;
    }
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<AdminUser | null> {
    const record = await this.adminRepository.findByUsername(username);
    if (!record || record.role !== 'admin') return null;
    const isValid = await bcryptCompare(password, record.passwordHash);
    return isValid ? this.recordToUser(record) : null;
  }

  async getAllAdmins(): Promise<SafeAdminUser[]> {
    const records = await this.adminRepository.findAll();
    return records
      .filter((r) => r.role === 'admin')
      .map((r) => this.toSafeUser(this.recordToUser(r)));
  }

  async createAdmin(
    username: string,
    password: string,
  ): Promise<SafeAdminUser> {
    if (!username.trim() || !password.trim()) {
      throw new Error('Имя пользователя и пароль не могут быть пустыми');
    }
    if (password.length < 8) {
      throw new Error('Пароль должен содержать не менее 8 символов');
    }
    const existing = await this.adminRepository.findByUsername(username);
    if (existing) {
      throw new Error(`Пользователь "${username}" уже существует`);
    }
    if (username === (process.env.SUPER_ADMIN_USERNAME ?? 'superadmin')) {
      throw new Error('Это имя зарезервировано');
    }

    const passwordHash = await bcryptHash(password, BCRYPT_ROUNDS);
    const record = await this.adminRepository.create(username, passwordHash);
    this.logger.log(`Создан администратор: ${username}`);
    return this.toSafeUser(this.recordToUser(record));
  }

  async deleteAdmin(id: string): Promise<void> {
    const record = await this.adminRepository.findById(id);
    if (!record) throw new Error('Пользователь не найден');
    await this.adminRepository.delete(id);
    this.logger.log(`Удалён администратор: ${record.username}`);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const record = await this.adminRepository.findById(id);
    if (!record) throw new Error('Пользователь не найден');
    if (!newPassword.trim() || newPassword.length < 8) {
      throw new Error('Пароль должен содержать не менее 8 символов');
    }
    const passwordHash = await bcryptHash(newPassword, BCRYPT_ROUNDS);
    await this.adminRepository.updatePassword(id, passwordHash);
    this.logger.log(`Изменён пароль для: ${record.username}`);
  }
}
