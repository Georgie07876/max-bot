import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);
  private readonly filePath = path.resolve(
    process.cwd(),
    'data',
    'content.json',
  );
  private readonly backupDir = path.resolve(process.cwd(), 'data', 'backups');
  private readonly logFile = path.resolve(process.cwd(), 'data', 'changes.log');
  private cache: Record<string, string> = {};

  onModuleInit() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.logger.warn(`Файл ${this.filePath} не найден. Создаю пустой.`);
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, '{}', 'utf-8');
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.cache = JSON.parse(raw) as Record<string, string>;
      this.logger.log(
        `Контент загружен: ${Object.keys(this.cache).length} записей`,
      );
    } catch (err) {
      this.logger.error('Ошибка загрузки контента:', err);
      this.cache = {};
    }
  }

  get(key: string): string | null {
    return this.cache[key] ?? null;
  }

  getAll(): Record<string, string> {
    return { ...this.cache };
  }

  update(key: string, value: string, adminName = 'admin'): void {
    const oldValue = this.cache[key] ?? '';
    this.cache[key] = value;
    this.saveToDisk();
    this.appendLog(key, oldValue, value, adminName);
    this.logger.log(`Обновлён ключ "${key}" администратором "${adminName}"`);
  }

  private saveToDisk(): void {
    try {
      // Создаём резервную копию перед сохранением
      if (fs.existsSync(this.filePath)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupPath = path.join(this.backupDir, `content_${ts}.json`);
        fs.copyFileSync(this.filePath, backupPath);
        this.cleanOldBackups();
      }
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.cache, null, 2),
        'utf-8',
      );
    } catch (err) {
      this.logger.error('Ошибка сохранения контента:', err);
    }
  }

  private cleanOldBackups(): void {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.startsWith('content_'))
        .sort();
      // Оставляем только последние 10 резервных копий
      while (files.length > 10) {
        const oldest = files.shift()!;
        fs.unlinkSync(path.join(this.backupDir, oldest));
      }
    } catch {
      // Игнорируем ошибки очистки бэкапов
    }
  }

  private appendLog(
    key: string,
    oldVal: string,
    newVal: string,
    admin: string,
  ): void {
    try {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
      const ts = new Date().toLocaleString('ru-RU');
      const line = `[${ts}] admin="${admin}" key="${key}"\n  OLD: ${oldVal.replace(/\n/g, '\\n').slice(0, 80)}\n  NEW: ${newVal.replace(/\n/g, '\\n').slice(0, 80)}\n\n`;
      fs.appendFileSync(this.logFile, line, 'utf-8');
    } catch {
      // Игнорируем ошибки логирования
    }
  }
}
