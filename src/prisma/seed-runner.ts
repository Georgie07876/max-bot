import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getDefaultMenus } from '../bot/default-menus';
import type { MenuMap } from '../bot/menu.types';

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

export interface SeedOptions {
  /** Пропустить заполнение, если в БД уже есть данные */
  onlyIfEmpty?: boolean;
  prisma?: PrismaClient;
}

export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  const { onlyIfEmpty = false, prisma: externalPrisma } = options;
  const ownsClient = !externalPrisma;
  const prisma = externalPrisma ?? new PrismaClient();

  try {
    if (onlyIfEmpty) {
      const [admins, content, menus] = await Promise.all([
        prisma.admin.count(),
        prisma.contentBlock.count(),
        prisma.menuPage.count(),
      ]);
      if (admins > 0 || content > 0 || menus > 0) {
        console.log('⏭️  БД уже содержит данные — seed пропущен');
        return;
      }
    }

    console.log('🌱 Заполнение базы данных...');
    const dataDir = path.resolve(process.cwd(), 'data');
    fs.mkdirSync(dataDir, { recursive: true });

    await seedAdmins(prisma, path.join(dataDir, 'admins.json'));
    await seedContent(prisma, path.join(dataDir, 'content.json'));
    await seedMenus(prisma, path.join(dataDir, 'menus.json'));

    console.log('🏁 База данных успешно заполнена');
  } finally {
    if (ownsClient) {
      await prisma.$disconnect();
    }
  }
}

async function seedAdmins(
  prisma: PrismaClient,
  adminsPath: string,
): Promise<void> {
  if (!fs.existsSync(adminsPath)) {
    console.log('ℹ️  admins.json не найден — администраторы не импортированы');
    return;
  }

  const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf-8')) as AdminJson[];
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
  console.log(`✅ Администраторы: ${admins.length} шт.`);
}

async function seedContent(
  prisma: PrismaClient,
  contentPath: string,
): Promise<void> {
  if (!fs.existsSync(contentPath)) {
    console.log('ℹ️  content.json не найден — контент не импортирован');
    return;
  }

  const content = JSON.parse(
    fs.readFileSync(contentPath, 'utf-8'),
  ) as ContentJson;
  for (const [key, textValue] of Object.entries(content)) {
    await prisma.contentBlock.upsert({
      where: { id: key },
      update: { text: textValue },
      create: { id: key, text: textValue },
    });
  }
  console.log(`✅ Контент: ${Object.keys(content).length} записей`);
}

async function seedMenus(
  prisma: PrismaClient,
  menusPath: string,
): Promise<void> {
  let menus: MenusJson;

  if (fs.existsSync(menusPath)) {
    menus = JSON.parse(fs.readFileSync(menusPath, 'utf-8')) as MenusJson;
    console.log('ℹ️  Меню загружены из menus.json');
  } else {
    menus = getDefaultMenus() as MenusJson;
    console.log('ℹ️  menus.json не найден — используются меню по умолчанию');
  }

  await upsertMenus(prisma, menus);
  console.log(`✅ Меню: ${Object.keys(menus).length} страниц`);
}

async function upsertMenus(
  prisma: PrismaClient,
  menus: MenusJson | MenuMap,
): Promise<void> {
  for (const [menuId, menuData] of Object.entries(menus)) {
    await prisma.menuPage.upsert({
      where: { id: menuId },
      update: { text: menuData.text, parent: menuData.parent },
      create: {
        id: menuId,
        text: menuData.text,
        parent: menuData.parent,
      },
    });

    await prisma.menuButton.deleteMany({ where: { menuId } });

    for (let i = 0; i < menuData.buttons.length; i++) {
      const btn = menuData.buttons[i];
      await prisma.menuButton.create({
        data: {
          id: btn.id,
          label: btn.label,
          type: btn.type,
          value: btn.value,
          position: i,
          menuId,
        },
      });
    }
  }
}
