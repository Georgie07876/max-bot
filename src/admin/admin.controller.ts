import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as path from 'path';
import { AdminGuard, SuperAdminGuard } from './admin.guard';
import { resolveAdminUiDir } from './admin-ui.paths';
import { AdminService } from './admin.service';
import { ContentService } from '../content/content.service';
import { MenuService } from '../bot/menu.service';
import { StatsService } from '../stats/stats.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly contentService: ContentService,
    private readonly menuService: MenuService,
    private readonly statsService: StatsService,
  ) {}

  private serveSpa(res: Response): void {
    res.sendFile(path.join(resolveAdminUiDir(), 'index.html'));
  }

  @Get('login')
  showLogin(@Res() res: Response): void {
    this.serveSpa(res);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { username, password } = body;

    if (!username || !password) {
      res.status(400).json({ ok: false, error: 'Логин и пароль обязательны' });
      return;
    }

    if (this.adminService.validateSuperAdmin(username, password)) {
      req.session.role = 'superAdmin';
      req.session.username = username;
      res.json({ ok: true, role: 'superAdmin' });
      return;
    }

    const user = await this.adminService.validateAdmin(username, password);
    if (user) {
      req.session.role = 'admin';
      req.session.username = user.username;
      res.json({ ok: true, role: 'admin' });
      return;
    }

    res.status(401).json({ ok: false });
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res() res: Response): void {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ ok: false });
        return;
      }
      res.json({ ok: true });
    });
  }

  @Get()
  showAdmin(@Req() req: Request, @Res() res: Response): void {
    if (!req.session?.role) {
      res.redirect('/admin/login');
      return;
    }
    this.serveSpa(res);
  }

  @Get('api/session')
  @UseGuards(AdminGuard)
  getSession(@Req() req: Request): { role: string; username: string } {
    return {
      role: req.session.role as string,
      username: req.session.username as string,
    };
  }

  @Get('api/stats/active-users')
  @UseGuards(AdminGuard)
  async getActiveUsers(): Promise<{ count: number }> {
    const count = await this.statsService.getActiveUsersCount();
    return { count };
  }

  @Get('api/content')
  @UseGuards(AdminGuard)
  async getContent(): Promise<Record<string, string>> {
    return this.contentService.getAll();
  }

  @Put('api/content/:key')
  @UseGuards(AdminGuard)
  async updateContent(
    @Param('key') key: string,
    @Body() body: { value: string },
    @Req() req: Request,
  ): Promise<{ ok: boolean; key: string }> {
    if (!key) throw new BadRequestException('Ключ не может быть пустым');
    if (body.value === undefined || body.value === null) {
      throw new BadRequestException('Значение обязательно');
    }
    const editor = req.session.username ?? 'admin';
    await this.contentService.update(key, body.value, editor);
    return { ok: true, key };
  }

  @Get('api/menus')
  @UseGuards(AdminGuard)
  async getMenus() {
    return this.menuService.getAll();
  }

  @Post('api/menus')
  @UseGuards(SuperAdminGuard)
  async createMenu(
    @Body() body: { id: string; text: string; parent: string | null },
  ) {
    if (!body.id || !body.text) {
      throw new BadRequestException('ID и текст меню обязательны');
    }
    try {
      await this.menuService.addMenu(body.id, body.text, body.parent ?? null);
      return { ok: true };
    } catch (e: unknown) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Ошибка создания меню',
      );
    }
  }

  @Put('api/menus/:id/text')
  @UseGuards(SuperAdminGuard)
  async updateMenuText(@Param('id') id: string, @Body() body: { text: string }) {
    if (!body.text) throw new BadRequestException('Текст не может быть пустым');
    try {
      await this.menuService.updateMenuText(id, body.text);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка обновления',
      );
    }
  }

  @Delete('api/menus/:id')
  @UseGuards(SuperAdminGuard)
  async deleteMenu(@Param('id') id: string) {
    try {
      await this.menuService.deleteMenu(id);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка удаления',
      );
    }
  }

  @Post('api/menus/:id/buttons')
  @UseGuards(SuperAdminGuard)
  async addButton(
    @Param('id') menuId: string,
    @Body() body: { label: string; type: 'callback' | 'url'; value: string },
  ) {
    if (!body.label || !body.value) {
      throw new BadRequestException('Текст и значение кнопки обязательны');
    }
    try {
      const btn = await this.menuService.addButton(
        menuId,
        body.label,
        body.type,
        body.value,
      );
      return { ok: true, button: btn };
    } catch (e: unknown) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Ошибка добавления кнопки',
      );
    }
  }

  @Put('api/menus/:menuId/buttons/:btnId')
  @UseGuards(SuperAdminGuard)
  async updateButton(
    @Param('menuId') menuId: string,
    @Param('btnId') btnId: string,
    @Body() body: { label: string; type: 'callback' | 'url'; value: string },
  ) {
    try {
      await this.menuService.updateButton(
        menuId,
        btnId,
        body.label,
        body.type,
        body.value,
      );
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка обновления кнопки',
      );
    }
  }

  @Delete('api/menus/:menuId/buttons/:btnId')
  @UseGuards(SuperAdminGuard)
  async deleteButton(@Param('menuId') menuId: string, @Param('btnId') btnId: string) {
    try {
      await this.menuService.deleteButton(menuId, btnId);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка удаления кнопки',
      );
    }
  }

  @Post('api/menus/:menuId/buttons/:btnId/move')
  @UseGuards(SuperAdminGuard)
  async moveButton(
    @Param('menuId') menuId: string,
    @Param('btnId') btnId: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    if (body.direction !== 'up' && body.direction !== 'down') {
      throw new BadRequestException('direction должен быть "up" или "down"');
    }
    await this.menuService.moveButton(menuId, btnId, body.direction);
    return { ok: true };
  }

  @Get('api/admins')
  @UseGuards(SuperAdminGuard)
  async getAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Post('api/admins')
  @UseGuards(SuperAdminGuard)
  async createAdmin(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Логин и пароль обязательны');
    }
    try {
      const user = await this.adminService.createAdmin(
        body.username,
        body.password,
      );
      return { ok: true, user };
    } catch (e: unknown) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Ошибка создания',
      );
    }
  }

  @Put('api/admins/:id/password')
  @UseGuards(SuperAdminGuard)
  async changePassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    if (!body.password) {
      throw new BadRequestException('Пароль не может быть пустым');
    }
    try {
      await this.adminService.changePassword(id, body.password);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  @Delete('api/admins/:id')
  @UseGuards(SuperAdminGuard)
  async deleteAdmin(@Param('id') id: string) {
    try {
      await this.adminService.deleteAdmin(id);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(e instanceof Error ? e.message : 'Ошибка');
    }
  }
}
