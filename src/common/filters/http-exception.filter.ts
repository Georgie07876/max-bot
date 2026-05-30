import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Глобальный фильтр HTTP-исключений.
 * Формирует единообразный формат ответа об ошибке.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const body = exception.getResponse();
    const message =
      typeof body === 'object' && 'message' in body
        ? (body as { message: string }).message
        : exception.message;

    this.logger.warn(
      `HTTP ${status} ${request.method} ${request.url}: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      ok: false,
      statusCode: status,
      error: message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
