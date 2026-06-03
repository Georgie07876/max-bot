import * as fs from 'fs';
import * as path from 'path';

/** Каталог собранной Vue-панели (index.html + assets/). */
export function resolveAdminUiDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'dist', 'admin-ui'),
    path.resolve(process.cwd(), 'admin-ui', 'dist'),
  ];
  const found = candidates.find((p) => fs.existsSync(path.join(p, 'index.html')));
  if (!found) {
    throw new Error('Admin UI не собран. Выполните: npm run admin:build');
  }
  return found;
}
