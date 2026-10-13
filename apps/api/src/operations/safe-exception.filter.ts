import { Catch, HttpException, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class SafeExceptionFilter extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost) {
    // Parser errors may contain the submitted body. Convert known failures
    // into fixed HTTP messages before logging or returning a response.
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'type' in exception &&
      'status' in exception
    ) {
      if (exception.type === 'entity.too.large' && exception.status === 413) {
        exception = new HttpException('Request body too large', 413);
      } else if (
        exception.type === 'entity.parse.failed' &&
        exception.status === 400
      ) {
        exception = new HttpException('Invalid JSON body', 400);
      }
    }

    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    if (statusCode >= 500) {
      const route: unknown = request.route?.path;

      console.error(
        JSON.stringify({
          event: 'api_error',
          requestId: response.getHeader('X-Request-ID') ?? null,
          method: request.method,
          route: typeof route === 'string' ? route : 'unmatched',
          statusCode,
          failureKind:
            exception instanceof QueryFailedError
              ? 'database'
              : exception instanceof HttpException
                ? 'http'
                : 'application',
        }),
      );
    }

    // Preserve intentional HTTP errors, including readiness and validation.
    if (exception instanceof HttpException) {
      super.catch(exception, host);
      return;
    }

    // Avoid the default logger printing unexpected exception details.
    if (!response.headersSent) {
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    } else {
      response.end();
    }
  }
}
