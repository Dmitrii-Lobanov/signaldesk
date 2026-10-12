import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller.js';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
}));

vi.mock('pg', () => ({
  Pool: class {
    query = mocks.query;
    end = mocks.end;
    on = mocks.on;
  },
}));

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    mocks.end.mockResolvedValue(undefined);

    controller = new HealthController(
      new ConfigService({
        DATABASE_URL: 'postgresql://test:test@localhost:5432/signaldesk_test',
      }),
    );
  });

  it('reports liveness without querying PostgreSQL', () => {
    expect(controller.live()).toEqual({ status: 'alive' });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('reports dependency failure safely and recovers on the next probe', async () => {
    mocks.query.mockRejectedValueOnce(
      new Error('Sensitive driver details must remain private'),
    );

    let failure: unknown;
    try {
      await controller.ready();
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(ServiceUnavailableException);

    const exception = failure as ServiceUnavailableException;
    expect(exception.getStatus()).toBe(503);
    expect(exception.getResponse()).toEqual({
      status: 'not_ready',
      dependency: 'postgres',
    });

    expect(controller.live()).toEqual({ status: 'alive' });
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
    });
  });

  it('shares a database query between concurrent readiness probes', async () => {
    let resolveQuery!: () => void;
    mocks.query.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveQuery = resolve;
      }),
    );

    const first = controller.ready();
    const second = controller.ready();

    expect(mocks.query).toHaveBeenCalledTimes(1);

    resolveQuery();

    await expect(first).resolves.toEqual({ status: 'ready' });
    await expect(second).resolves.toEqual({ status: 'ready' });
  });

  it('closes the probe pool during shutdown', async () => {
    await controller.onModuleDestroy();
    expect(mocks.end).toHaveBeenCalledOnce();
  });
});
