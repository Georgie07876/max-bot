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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AdminGuard, SuperAdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ContentService } from '../content/content.service';
import { MenuService } from '../bot/menu.service';
// import '../../src/types/session';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly contentService: ContentService,
    private readonly menuService: MenuService,
  ) {}

  // ── СТРАНИЦА ВХОДА ────────────────────────────────────────────

  @Get('login')
  showLogin(@Res() res: Response) {
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
    body: JSON.stringify({ username: document.getElementById('uname').value, password: document.getElementById('pwd').value })
  });
  if (r.ok) { window.location.href = '/admin'; }
  else { document.getElementById('err').classList.add('show'); document.getElementById('pwd').value=''; }
});
</script>
</body>
</html>`);
  }

  // ── ВХОД / ВЫХОД ──────────────────────────────────────────────

  @Post('login')
  @HttpCode(200)
  login(
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { username, password } = body;

    // Проверяем SuperAdmin
    if (this.adminService.validateSuperAdmin(username, password)) {
      req.session.role = 'superAdmin';
      req.session.username = username;
      return res.json({ ok: true, role: 'superAdmin' });
    }

    // Проверяем обычного Admin
    const user = this.adminService.validateAdmin(username, password);
    if (user) {
      req.session.role = 'admin';
      req.session.username = user.username;
      return res.json({ ok: true, role: 'admin' });
    }

    return res.status(401).json({ ok: false });
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ ok: false });
      return res.json({ ok: true });
    });
  }

  // ── ГЛАВНАЯ СТРАНИЦА ──────────────────────────────────────────

  @Get()
  showAdmin(@Req() req: Request, @Res() res: Response) {
    if (!req.session?.role) return res.redirect('/admin/login');
    const htmlPath = path.resolve(__dirname, 'admin.html');
    if (fs.existsSync(htmlPath)) return res.sendFile(htmlPath);
    return res.sendFile(
      path.resolve(process.cwd(), 'src', 'admin', 'admin.html'),
    );
  }

  // ── API: СЕССИЯ ───────────────────────────────────────────────

  @Get('api/session')
  @UseGuards(AdminGuard)
  getSession(@Req() req: Request) {
    return { role: req.session.role, username: req.session.username };
  }

  // ── API: КОНТЕНТ ──────────────────────────────────────────────

  @Get('api/content')
  @UseGuards(AdminGuard)
  getContent() {
    return this.contentService.getAll();
  }

  @Put('api/content/:key')
  @UseGuards(AdminGuard)
  updateContent(
    @Param('key') key: string,
    @Body() body: { value: string },
    @Req() req: Request,
  ) {
    if (!key || body.value === undefined)
      return { ok: false, error: 'Неверные параметры' };

    const editor = req.session.username || 'admin';
    this.contentService.update(key, body.value, editor);
    return { ok: true, key };
  }

  // ── API: МЕНЮ (superAdmin) ────────────────────────────────────

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
    try {
      this.menuService.addMenu(body.id, body.text, body.parent ?? null);
      return { ok: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Put('api/menus/:id/text')
  @UseGuards(SuperAdminGuard)
  updateMenuText(@Param('id') id: string, @Body() body: { text: string }) {
    try {
      this.menuService.updateMenuText(id, body.text);
      return { ok: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Delete('api/menus/:id')
  @UseGuards(SuperAdminGuard)
  deleteMenu(@Param('id') id: string) {
    try {
      this.adminService.deleteAdmin(id);
      return { ok: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Post('api/menus/:id/buttons')
  @UseGuards(SuperAdminGuard)
  addButton(
    @Param('id') menuId: string,
    @Body() body: { label: string; type: 'callback' | 'url'; value: string },
  ) {
    try {
      const btn = this.menuService.addButton(
        menuId,
        body.label,
        body.type,
        body.value,
      );
      return { ok: true, button: btn };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
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
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Delete('api/menus/:menuId/buttons/:btnId')
  @UseGuards(SuperAdminGuard)
  deleteButton(@Param('menuId') menuId: string, @Param('btnId') btnId: string) {
    try {
      this.menuService.deleteButton(menuId, btnId);
      return { ok: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Post('api/menus/:menuId/buttons/:btnId/move')
  @UseGuards(SuperAdminGuard)
  moveButton(
    @Param('menuId') menuId: string,
    @Param('btnId') btnId: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    this.menuService.moveButton(menuId, btnId, body.direction);
    return { ok: true };
  }

  // ── API: АДМИНИСТРАТОРЫ (только superAdmin) ───────────────────

  @Get('api/admins')
  @UseGuards(SuperAdminGuard)
  getAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Post('api/admins')
  @UseGuards(SuperAdminGuard)
  createAdmin(@Body() body: { username: string; password: string }) {
    try {
      const user = this.adminService.createAdmin(body.username, body.password);
      return { ok: true, user };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Put('api/admins/:id/password')
  @UseGuards(SuperAdminGuard)
  changePassword(@Param('id') id: string, @Body() body: { password: string }) {
    try {
      this.adminService.changePassword(id, body.password);
      return { ok: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Delete('api/admins/:id')
  @UseGuards(SuperAdminGuard)
  deleteAdmin(@Param('id') id: string) {
    try {
      this.adminService.deleteAdmin(id);
      return { ok: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }

  @Get('*path')
  catchAll(@Req() req: Request, @Res() res: Response) {
    if (!req.session?.role) return res.redirect('/admin/login');
    return res.status(404).send('Страница не найдена');
  }
}
