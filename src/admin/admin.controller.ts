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
import * as fs from 'fs';
import { AdminGuard, SuperAdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ContentService } from '../content/content.service';
import { MenuService } from '../bot/menu.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly contentService: ContentService,
    private readonly menuService: MenuService,
  ) {}

  // ── СТРАНИЦА ВХОДА ────────────────────────────────────────────

  @Get('login')
  showLogin(@Res() res: Response): void {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Вход — Панель управления РГЭУ</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f5f5f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#fff;border-radius:14px;padding:40px;width:340px;box-shadow:0 2px 20px rgba(0,0,0,0.09)}
  h1{font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:6px}
  .sub{font-size:13px;color:#aaa;margin-bottom:28px}
  label{font-size:12px;color:#666;display:block;margin-bottom:4px;font-weight:500}
  input{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;transition:border .15s}
  input:focus{border-color:#1D9E75}
  button{width:100%;padding:11px;background:#1D9E75;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:background .15s}
  button:hover{background:#0F6E56}
  .error{color:#e53e3e;font-size:13px;margin-bottom:12px;display:none;background:#fff5f5;padding:8px 10px;border-radius:6px}
  .error.show{display:block}
</style>
</head>
<body>
<div class="card">
  <h1>Панель управления</h1>
  <div class="sub">Бот РГЭУ (РИНХ)</div>
  <div class="error" id="err">Неверный логин или пароль</div>
  <form id="form">
    <label>Имя пользователя</label>
    <input type="text" id="uname" placeholder="Введите логин" autocomplete="username" autofocus>
    <label>Пароль</label>
    <input type="password" id="pwd" placeholder="Введите пароль" autocomplete="current-password">
    <button type="submit">Войти</button>
  </form>
</div>
<script>
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await fetch('/admin/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      username: document.getElementById('uname').value,
      password: document.getElementById('pwd').value
    })
  });
  if (r.ok) { window.location.href = '/admin'; }
  else { document.getElementById('err').classList.add('show'); document.getElementById('pwd').value = ''; }
});
</script>
</body>
</html>`);
  }

  // ── ВХОД / ВЫХОД ──────────────────────────────────────────────

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

    // SuperAdmin — синхронная проверка через timingSafeEqual
    if (this.adminService.validateSuperAdmin(username, password)) {
      req.session.role = 'superAdmin';
      req.session.username = username;
      res.json({ ok: true, role: 'superAdmin' });
      return;
    }

    // Admin — асинхронная проверка через bcrypt.compare
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

  // ── ГЛАВНАЯ СТРАНИЦА ──────────────────────────────────────────

  @Get()
  showAdmin(@Req() req: Request, @Res() res: Response): void {
    if (!req.session?.role) {
      res.redirect('/admin/login');
      return;
    }
    const htmlPath = path.resolve(__dirname, 'admin.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
      return;
    }
    res.sendFile(path.resolve(process.cwd(), 'src', 'admin', 'admin.html'));
  }

  // ── API: СЕССИЯ ───────────────────────────────────────────────

  @Get('api/session')
  @UseGuards(AdminGuard)
  getSession(@Req() req: Request): { role: string; username: string } {
    return {
      role: req.session.role as string,
      username: req.session.username as string,
    };
  }

  // ── API: КОНТЕНТ ──────────────────────────────────────────────

  @Get('api/content')
  @UseGuards(AdminGuard)
  getContent(): Record<string, string> {
    return this.contentService.getAll();
  }

  @Put('api/content/:key')
  @UseGuards(AdminGuard)
  updateContent(
    @Param('key') key: string,
    @Body() body: { value: string },
    @Req() req: Request,
  ): { ok: boolean; key: string } {
    if (!key) throw new BadRequestException('Ключ не может быть пустым');
    if (body.value === undefined || body.value === null) {
      throw new BadRequestException('Значение обязательно');
    }
    const editor = req.session.username ?? 'admin';
    this.contentService.update(key, body.value, editor);
    return { ok: true, key };
  }

  // ── API: МЕНЮ ─────────────────────────────────────────────────

  @Get('api/menus')
  @UseGuards(AdminGuard)
  getMenus() {
    return this.menuService.getAll();
  }

  @Post('api/menus')
  @UseGuards(SuperAdminGuard)
  createMenu(
    @Body() body: { id: string; text: string; parent: string | null },
  ) {
    if (!body.id || !body.text) {
      throw new BadRequestException('ID и текст меню обязательны');
    }
    try {
      this.menuService.addMenu(body.id, body.text, body.parent ?? null);
      return { ok: true };
    } catch (e: unknown) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Ошибка создания меню',
      );
    }
  }

  @Put('api/menus/:id/text')
  @UseGuards(SuperAdminGuard)
  updateMenuText(@Param('id') id: string, @Body() body: { text: string }) {
    if (!body.text) throw new BadRequestException('Текст не может быть пустым');
    try {
      this.menuService.updateMenuText(id, body.text);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка обновления',
      );
    }
  }

  @Delete('api/menus/:id')
  @UseGuards(SuperAdminGuard)
  deleteMenu(@Param('id') id: string) {
    try {
      // ИСПРАВЛЕНО (v1): было adminService.deleteAdmin(id)
      this.menuService.deleteMenu(id);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка удаления',
      );
    }
  }

  @Post('api/menus/:id/buttons')
  @UseGuards(SuperAdminGuard)
  addButton(
    @Param('id') menuId: string,
    @Body() body: { label: string; type: 'callback' | 'url'; value: string },
  ) {
    if (!body.label || !body.value) {
      throw new BadRequestException('Текст и значение кнопки обязательны');
    }
    try {
      const btn = this.menuService.addButton(
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
  updateButton(
    @Param('menuId') menuId: string,
    @Param('btnId') btnId: string,
    @Body() body: { label: string; type: 'callback' | 'url'; value: string },
  ) {
    try {
      this.menuService.updateButton(
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
  deleteButton(@Param('menuId') menuId: string, @Param('btnId') btnId: string) {
    try {
      this.menuService.deleteButton(menuId, btnId);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(
        e instanceof Error ? e.message : 'Ошибка удаления кнопки',
      );
    }
  }

  @Post('api/menus/:menuId/buttons/:btnId/move')
  @UseGuards(SuperAdminGuard)
  moveButton(
    @Param('menuId') menuId: string,
    @Param('btnId') btnId: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    if (body.direction !== 'up' && body.direction !== 'down') {
      throw new BadRequestException('direction должен быть "up" или "down"');
    }
    this.menuService.moveButton(menuId, btnId, body.direction);
    return { ok: true };
  }

  // ── API: АДМИНИСТРАТОРЫ ───────────────────────────────────────

  @Get('api/admins')
  @UseGuards(SuperAdminGuard)
  getAdmins() {
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
  deleteAdmin(@Param('id') id: string) {
    try {
      this.adminService.deleteAdmin(id);
      return { ok: true };
    } catch (e: unknown) {
      throw new NotFoundException(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  @Get('*path')
  catchAll(@Req() req: Request, @Res() res: Response): void {
    if (!req.session?.role) {
      res.redirect('/admin/login');
      return;
    }
    res.status(404).send('Страница не найдена');
  }
}
