import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const role = req.session?.role;

    // 401 если сессии нет вообще
    if (!role) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    // 403 если роль не подходит
    if (role !== 'admin' && role !== 'superAdmin') {
      throw new ForbiddenException('Доступ запрещён');
    }

    return true;
  }
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const role = req.session?.role;

    if (!role) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    if (role !== 'superAdmin') {
      throw new ForbiddenException('Требуются права суперадминистратора');
    }

    return true;
  }
}
