import {
  HttpException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';

type Bucket = {
  resetsAt: number;
  requests: number;
  writes: number;
};

@Injectable()
export class FeedbackRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { session?: UserSession }>();
    const response = http.getResponse<Response>();
    const userId = request.session?.user.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const now = Date.now();
    let bucket = this.buckets.get(userId);

    if (!bucket || now >= bucket.resetsAt) {
      // Bound storage and remove expired entries before admitting new users.
      if (this.buckets.size >= 5000) {
        for (const [key, candidate] of this.buckets) {
          if (now >= candidate.resetsAt) {
            this.buckets.delete(key);
          }
        }
      }

      if (!this.buckets.has(userId) && this.buckets.size >= 5000) {
        response.setHeader('Retry-After', '60');
        throw new HttpException('Request limit reached. Try later.', 429);
      }

      bucket = { resetsAt: now + 60000, requests: 0, writes: 0 };
      this.buckets.set(userId, bucket);
    }

    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);

    if (bucket.requests >= 120 || (isWrite && bucket.writes >= 30)) {
      response.setHeader(
        'Retry-After',
        String(Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000))),
      );
      throw new HttpException('Request limit reached. Try later.', 429);
    }

    bucket.requests += 1;
    if (isWrite) bucket.writes += 1;

    return true;
  }
}
