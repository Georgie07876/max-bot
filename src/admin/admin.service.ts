import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'crypto';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'superAdmin';
  createdAt: string;
}

// Тип публичного представления пользователя (без хэша пароля)
export type SafeAdminUser = Omit<AdminUser, 'passwordHash'>;

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);
  private readonly filePath = path.resolve(
    process.cwd(),
    'data',
    'admins.json',
  );
  private users: AdminUser[] = [];

  onModuleInit() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, '[]', 'utf-8');
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.users = JSON.parse(raw) as AdminUser[];
      this.logger.log(`Загружено ${this.users.length} администраторов`);
    } catch (err) {
      this.logger.error('Ошибка загрузки admins.json:', err);
      this.users = [];
    }
  }

  private saveToDisk(): void {
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.users, null, 2),
      'utf-8',
    );
  }

  /**
   * Возвращает публичное представление пользователя без хэша пароля.
   * Явное перечисление полей — защита от случайной утечки новых полей.
   */
  private toSafeUser(user: AdminUser): SafeAdminUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  // ── АУТЕНТИФИКАЦИЯ ────────────────────────────────────────────

  /**
   * timingSafeEqual защищает от timing-атак:
   * злоумышленник не может угадать символы пароля
   * по разнице во времени ответа сервера.
   */
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
      // timingSafeEqual требует буферы одинаковой длины —
      // проверяем длины явно перед вызовом
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
    const user = this.users.find(
      (u) => u.username === username && u.role === 'admin',
    );
    if (!user) return null;
    const isValid = await bcryptCompare(password, user.passwordHash);
    return isValid ? user : null;
  }

  // ── CRUD ──────────────────────────────────────────────────────

  getAllAdmins(): SafeAdminUser[] {
    return this.users.map((u) => this.toSafeUser(u));
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
    if (this.users.find((u) => u.username === username)) {
      throw new Error(`Пользователь "${username}" уже существует`);
    }
    if (username === (process.env.SUPER_ADMIN_USERNAME ?? 'superadmin')) {
      throw new Error('Это имя зарезервировано');
    }

    const passwordHash = await bcryptHash(password, BCRYPT_ROUNDS);
    const user: AdminUser = {
      id: randomUUID(),
      username,
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveToDisk();
    this.logger.log(`Создан администратор: ${username}`);

    return this.toSafeUser(user);
  }

  deleteAdmin(id: string): void {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Пользователь не найден');
    const removed = this.users[idx];
    this.users.splice(idx, 1);
    this.saveToDisk();
    this.logger.log(`Удалён администратор: ${removed?.username ?? id}`);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('Пользователь не найден');
    if (!newPassword.trim() || newPassword.length < 8) {
      throw new Error('Пароль должен содержать не менее 8 символов');
    }
    user.passwordHash = await bcryptHash(newPassword, BCRYPT_ROUNDS);
    this.saveToDisk();
    this.logger.log(`Изменён пароль для: ${user.username}`);
  }
}
