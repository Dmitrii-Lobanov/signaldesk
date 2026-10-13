import {
  ConflictException,
  Controller,
  Get,
  ServiceUnavailableException,
  type INestApplication,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { QueryFailedError } from 'typeorm';
import { requestLogging } from './request-logging.js';
import { SafeExceptionFilter } from './safe-exception.filter.js';

@Controller('probe')
class ProbeController {
  @Get('database')
  database() {
    throw new QueryFailedError(
      'SELECT private_query',
      ['private_feedback'],
      new Error('private_password'),
    );
  }

  @Get('application')
  application() {
    throw new Error('private_application_details');
  }

  @Get('conflict')
  conflict() {
    throw new ConflictException('Feedback changed');
  }

  @Get('ready')
  ready() {
    throw new ServiceUnavailableException({
      status: 'not_ready',
      dependency: 'postgres',
    });
  }
}

describe('SafeExceptionFilter', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    app = module.createNestApplication({ logger: false });
    app.use(requestLogging());

    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SafeExceptionFilter(httpAdapter));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  it.each([
    ['database', 'database'],
    ['application', 'application'],
  ])(
    'sanitizes %s failures and correlates the error log',
    async (path, kind) => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logs = vi.spyOn(console, 'log').mockImplementation(() => {});

      const response = await request(app.getHttpServer())
        .get(`/probe/${path}?private_query=value`)
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
      });

      const requestId = response.headers['x-request-id'];
      expect(requestId).toEqual(expect.any(String));

      expect(errors).toHaveBeenCalledOnce();
      expect(JSON.parse(errors.mock.calls[0][0] as string)).toEqual({
        event: 'api_error',
        requestId,
        method: 'GET',
        route: `/probe/${path}`,
        statusCode: 500,
        failureKind: kind,
      });

      expect(logs).toHaveBeenCalledOnce();
      expect(JSON.parse(logs.mock.calls[0][0] as string)).toMatchObject({
        event: 'http_request',
        requestId,
        statusCode: 500,
        outcome: 'completed',
      });

      expect(
        JSON.stringify({
          body: response.body,
          errors: errors.mock.calls,
          logs: logs.mock.calls,
        }),
      ).not.toContain('private');
    },
  );

  it('preserves conflicts without recording them as server errors', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const response = await request(app.getHttpServer())
      .get('/probe/conflict')
      .expect(409);

    expect(response.body.message).toBe('Feedback changed');
    expect(errors).not.toHaveBeenCalled();
  });

  it('preserves the readiness response and records its failure', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const response = await request(app.getHttpServer())
      .get('/probe/ready')
      .expect(503);

    expect(response.body).toEqual({
      status: 'not_ready',
      dependency: 'postgres',
    });

    expect(errors).toHaveBeenCalledOnce();
    expect(JSON.parse(errors.mock.calls[0][0] as string)).toMatchObject({
      requestId: response.headers['x-request-id'],
      statusCode: 503,
      failureKind: 'http',
    });
  });
});
