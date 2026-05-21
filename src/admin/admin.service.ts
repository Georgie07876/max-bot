import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { AdminUser } from './interfaces/admin-user.interface';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);
  private readonly filePath = path.resolve(
    process.cwd(),
    'data',
    'admins.json',
  );
  private users: AdminUser[] = [];

  private get salt(): string {
    return process.env.SESSION_SECRET ?? 'rinh-default-salt';
  }

  onModuleInit() {
    this.loadFromDisk();
  }

  // ── УТИЛИТЫ ──────────────────────────────────────────────────
  private hash(password: string): string {
    return createHash('sha256')
      .update(password + this.salt)
      .digest('hex');
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

  // ── АУТЕНТИФИКАЦИЯ ────────────────────────────────────────────

  validateSuperAdmin(username: string, password: string): boolean {
    const envUser = process.env.SUPER_ADMIN_USERNAME ?? 'superadmin';
    const envPass = process.env.SUPER_ADMIN_PASSWORD ?? 'admin123';
    return username === envUser && password === envPass;
  }

  validateAdmin(username: string, password: string): AdminUser | null {
    const user = this.users.find(
      (u) => u.username === username && u.role === 'admin',
    );
    if (!user) return null;
    return user.passwordHash === this.hash(password) ? user : null;
  }

  // ── CRUD ПОЛЬЗОВАТЕЛЕЙ (только для SuperAdmin) ─────────────────

  getAllAdmins(): Omit<AdminUser, 'passwordHash'>[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return this.users.map(({ passwordHash: _, ...rest }) => rest);
  }

  createAdmin(
    username: string,
    password: string,
  ): Omit<AdminUser, 'passwordHash'> {
    if (!username.trim() || !password.trim()) {
      throw new Error('Имя пользователя и пароль не могут быть пустыми');
    }
    if (this.users.find((u) => u.username === username)) {
      throw new Error(`Пользователь "${username}" уже существует`);
    }
    if (username === (process.env.SUPER_ADMIN_USERNAME ?? 'superadmin')) {
      throw new Error('Это имя зарезервировано');
    }
    const user: AdminUser = {
      id: randomUUID(),
      username,
      passwordHash: this.hash(password),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveToDisk();
    this.logger.log(`Создан администратор: ${username}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  deleteAdmin(id: string): void {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Пользователь не найден');
    const removed = this.users[idx];
    this.users.splice(idx, 1);
    this.saveToDisk();
    this.logger.log(`Удалён администратор: ${removed.username}`);
  }

  changePassword(id: string, newPassword: string): void {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('Пользователь не найден');
    if (!newPassword.trim()) throw new Error('Пароль не может быть пустым');
    user.passwordHash = this.hash(newPassword);
    this.saveToDisk();
    this.logger.log(`Изменён пароль для: ${user.username}`);
  }
}
