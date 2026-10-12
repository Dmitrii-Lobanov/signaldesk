import {
  Controller,
  Get,
  ServiceUnavailableException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Pool } from 'pg';

@Controller('health')
export class HealthController implements OnModuleDestroy {
  private readonly pool: Pool;
  private check: Promise<void> | undefined;

  constructor(config: ConfigService) {
    // A dedicated, bounded probe pool avoids changing application query limits.
    this.pool = new Pool({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      max: 1,
      connectionTimeoutMillis: 2000,
      statement_timeout: 2000,
      query_timeout: 2500,
      idleTimeoutMillis: 10000,
    });

    // Idle connection failures must not become unhandled EventEmitter errors.
    // Readiness reports dependency failure without logging driver details.
    this.pool.on('error', () => {});
  }

  @Get('live')
  @AllowAnonymous()
  live() {
    return { status: 'alive' };
  }

  @Get('ready')
  @AllowAnonymous()
  async ready() {
    try {
      // Concurrent probes share one query.
      await (this.check ??= this.checkDatabase());
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        dependency: 'postgres',
      });
    }
  }

  private async checkDatabase(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
    } finally {
      this.check = undefined;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
