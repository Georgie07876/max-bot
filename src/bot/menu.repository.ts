import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { MenuButton, MenuItem, MenuMap } from './menu.types';

type MenuPageWithButtons = {
  id: string;
  text: string;
  parent: string | null;
  buttons: Array<{
    id: string;
    label: string;
    type: string;
    value: string;
    position: number;
  }>;
};

@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countPages(): Promise<number> {
    return this.prisma.menuPage.count();
  }

  async findAllAsMap(): Promise<MenuMap> {
    const pages = await this.prisma.menuPage.findMany({
      include: { buttons: { orderBy: { position: 'asc' } } },
    });
    return this.pagesToMap(pages);
  }

  async findById(id: string): Promise<MenuItem | null> {
    const page = await this.prisma.menuPage.findUnique({
      where: { id },
      include: { buttons: { orderBy: { position: 'asc' } } },
    });
    return page ? this.pageToItem(page) : null;
  }

  async findParentMenuId(callbackValue: string): Promise<string | null> {
    const button = await this.prisma.menuButton.findFirst({
      where: { value: callbackValue },
      select: { menuId: true },
    });
    return button?.menuId ?? null;
  }

  async seedDefaults(menus: MenuMap): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [menuId, menuData] of Object.entries(menus)) {
        await tx.menuPage.create({
          data: {
            id: menuId,
            text: menuData.text,
            parent: menuData.parent,
            buttons: {
              create: menuData.buttons.map((btn, index) => ({
                id: btn.id,
                label: btn.label,
                type: btn.type,
                value: btn.value,
                position: index,
              })),
            },
          },
        });
      }
    });
  }

  async updateText(menuId: string, text: string): Promise<void> {
    await this.prisma.menuPage.update({
      where: { id: menuId },
      data: { text },
    });
  }

  async createPage(
    id: string,
    text: string,
    parent: string | null,
  ): Promise<void> {
    await this.prisma.menuPage.create({
      data: { id, text, parent },
    });
  }

  async deletePage(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.menuButton.deleteMany({ where: { value: id } }),
      this.prisma.menuPage.delete({ where: { id } }),
    ]);
  }

  async createButton(
    menuId: string,
    label: string,
    type: 'callback' | 'url',
    value: string,
  ): Promise<MenuButton> {
    const last = await this.prisma.menuButton.findFirst({
      where: { menuId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;
    const btn: MenuButton = {
      id: randomUUID(),
      label,
      type,
      value,
    };

    await this.prisma.menuButton.create({
      data: {
        id: btn.id,
        label: btn.label,
        type: btn.type,
        value: btn.value,
        position,
        menuId,
      },
    });

    return btn;
  }

  async updateButton(
    menuId: string,
    btnId: string,
    label: string,
    type: 'callback' | 'url',
    value: string,
  ): Promise<void> {
    const result = await this.prisma.menuButton.updateMany({
      where: { id: btnId, menuId },
      data: { label, type, value },
    });
    if (result.count === 0) {
      throw new Error(`Кнопка "${btnId}" не найдена`);
    }
  }

  async deleteButton(menuId: string, btnId: string): Promise<void> {
    const result = await this.prisma.menuButton.deleteMany({
      where: { id: btnId, menuId },
    });
    if (result.count === 0) {
      throw new Error(`Кнопка "${btnId}" не найдена`);
    }
  }

  async moveButton(
    menuId: string,
    btnId: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    const buttons = await this.prisma.menuButton.findMany({
      where: { menuId },
      orderBy: { position: 'asc' },
    });

    const idx = buttons.findIndex((b) => b.id === btnId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= buttons.length) return;

    const current = buttons[idx];
    const neighbor = buttons[newIdx];

    await this.prisma.$transaction([
      this.prisma.menuButton.update({
        where: { id: current.id },
        data: { position: neighbor.position },
      }),
      this.prisma.menuButton.update({
        where: { id: neighbor.id },
        data: { position: current.position },
      }),
    ]);
  }

  private pagesToMap(pages: MenuPageWithButtons[]): MenuMap {
    const map: MenuMap = {};
    for (const page of pages) {
      map[page.id] = this.pageToItem(page);
    }
    return map;
  }

  private pageToItem(page: MenuPageWithButtons): MenuItem {
    return {
      text: page.text,
      parent: page.parent,
      buttons: page.buttons.map((btn) => ({
        id: btn.id,
        label: btn.label,
        type: btn.type as 'callback' | 'url',
        value: btn.value,
      })),
    };
  }
}
