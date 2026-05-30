import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

interface AdminJson {
  id: string;
  username: string;
  passwordHash?: string;
  password?: string;
  role: string;
  createdAt?: string;
}

type ContentJson = Record<string, string>;

interface MenuButtonJson {
  id: string;
  label: string;
  type: string;
  value: string;
}

interface MenuPageJson {
  text: string;
  parent: string | null;
  buttons: MenuButtonJson[];
}

type MenusJson = Record<string, MenuPageJson>;

async function main() {
  console.log('🌱 Старт заполнения базы данных из JSON файлов...');

  const dataDir = path.resolve(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) {
    throw new Error(`Папка с данными не найдена по пути: ${dataDir}`);
  }

  const adminsPath = path.join(dataDir, 'admins.json');
  const contentPath = path.join(dataDir, 'content.json');
  const menusPath = path.join(dataDir, 'menus.json');

  // 1. АДМИНИСТРАТОРЫ
  if (fs.existsSync(adminsPath)) {
    const admins = JSON.parse(
      fs.readFileSync(adminsPath, 'utf-8'),
    ) as AdminJson[];
    for (const admin of admins) {
      await prisma.admin.upsert({
        where: { username: admin.username },
        update: {},
        create: {
          id: admin.id,
          username: admin.username,
          password: admin.passwordHash || admin.password || '',
          role: admin.role,
          createdAt: admin.createdAt ? new Date(admin.createdAt) : new Date(),
        },
      });
    }
    console.log(`✅ Администраторы перенесены (${admins.length} шт.)`);
  }

  // 2. КОНТЕНТ
  if (fs.existsSync(contentPath)) {
    const content = JSON.parse(
      fs.readFileSync(contentPath, 'utf-8'),
    ) as ContentJson;
    for (const [key, textValue] of Object.entries(content)) {
      await prisma.contentBlock.upsert({
        where: { id: key },
        update: { text: textValue },
        create: {
          id: key,
          text: textValue,
        },
      });
    }
    console.log(
      `✅ Текстовые блоки перенесены (${Object.keys(content).length} шт.)`,
    );
  }

  // 3. МЕНЮ
  if (fs.existsSync(menusPath)) {
    const menus = JSON.parse(fs.readFileSync(menusPath, 'utf-8')) as MenusJson;
    for (const [menuId, menuData] of Object.entries(menus)) {
      await prisma.menuPage.upsert({
        where: { id: menuId },
        update: {
          text: menuData.text,
          parent: menuData.parent,
        },
        create: {
          id: menuId,
          text: menuData.text,
          parent: menuData.parent,
        },
      });

      await prisma.menuButton.deleteMany({ where: { menuId } });

      if (menuData.buttons && Array.isArray(menuData.buttons)) {
        for (let i = 0; i < menuData.buttons.length; i++) {
          const btn = menuData.buttons[i];
          await prisma.menuButton.create({
            data: {
              id: btn.id,
              label: btn.label,
              type: btn.type,
              value: btn.value,
              position: i,
              menuId: menuId,
            },
          });
        }
      }
    }
    console.log(
      `✅ Меню и кнопки перенесены (${Object.keys(menus).length} страниц)`,
    );
  }

  console.log('🏁 База данных успешно синхронизирована с JSON-источниками!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка во время заполнения БД:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
