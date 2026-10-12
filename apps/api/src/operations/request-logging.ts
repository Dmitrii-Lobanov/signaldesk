import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestLogging() {
  return (request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    let recorded = false;

    response.setHeader('X-Request-ID', requestId);

    const record = (outcome: 'completed' | 'aborted') => {
      if (recorded) return;
      recorded = true;

      // Log the declared route template, never the URL or query string.
      const route: unknown = request.route?.path;

      console.log(
        JSON.stringify({
          event: 'http_request',
          requestId,
          method: request.method,
          route: typeof route === 'string' ? route : 'unmatched',
          statusCode: outcome === 'completed' ? response.statusCode : null,
          durationMs: Math.round(performance.now() - startedAt),
          outcome,
        }),
      );
    };

    response.once('finish', () => record('completed'));
    response.once('close', () => record('aborted'));

    next();
  };
}