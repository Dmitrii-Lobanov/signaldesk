import {
  HttpException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { FeedbackRateLimitGuard } from './feedback-rate-limit.guard.js';

function context(method = 'GET', userId: string | null = 'user-a') {
  const setHeader = vi.fn();

  const executionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        session: userId ? { user: { id: userId } } : undefined,
      }),
      getResponse: () => ({ setHeader }),
    }),
  } as unknown as ExecutionContext;

  return { executionContext, setHeader };
}

function expectRateLimited(run: () => boolean) {
  let failure: unknown;

  try {
    run();
  } catch (error) {
    failure = error;
  }

  expect(failure).toBeInstanceOf(HttpException);
  expect((failure as HttpException).getStatus()).toBe(429);
}

describe('FeedbackRateLimitGuard', () => {
  let guard: FeedbackRateLimitGuard;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-13T12:00:00Z'));
    guard = new FeedbackRateLimitGuard();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects requests without an authenticated session', () => {
    const { executionContext } = context('GET', null);

    expect(() => guard.canActivate(executionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('allows 120 requests and rejects the next with Retry-After', () => {
    const { executionContext, setHeader } = context();

    for (let index = 0; index < 120; index += 1) {
      expect(guard.canActivate(executionContext)).toBe(true);
    }

    expectRateLimited(() => guard.canActivate(executionContext));
    expect(setHeader).toHaveBeenLastCalledWith('Retry-After', '60');
  });

  it('shares the write budget across mutation methods while allowing reads', () => {
    const methods = ['POST', 'PATCH', 'DELETE'];

    for (let index = 0; index < 30; index += 1) {
      const { executionContext } = context(methods[index % methods.length]);
      expect(guard.canActivate(executionContext)).toBe(true);
    }

    const write = context('PATCH');
    expectRateLimited(() => guard.canActivate(write.executionContext));

    const read = context('GET');
    expect(guard.canActivate(read.executionContext)).toBe(true);
  });

  it('counts writes toward the total request budget', () => {
    const read = context('GET');
    const write = context('POST');

    for (let index = 0; index < 100; index += 1) {
      guard.canActivate(read.executionContext);
    }

    for (let index = 0; index < 20; index += 1) {
      guard.canActivate(write.executionContext);
    }

    expectRateLimited(() => guard.canActivate(write.executionContext));
  });

  it('keeps users independent', () => {
    const first = context('POST', 'user-a');
    const second = context('POST', 'user-b');

    for (let index = 0; index < 30; index += 1) {
      guard.canActivate(first.executionContext);
    }

    expectRateLimited(() => guard.canActivate(first.executionContext));
    expect(guard.canActivate(second.executionContext)).toBe(true);
  });

  it('reports remaining wait time and resets after one minute', () => {
    const { executionContext, setHeader } = context('POST');

    for (let index = 0; index < 30; index += 1) {
      guard.canActivate(executionContext);
    }

    vi.advanceTimersByTime(15000);
    expectRateLimited(() => guard.canActivate(executionContext));
    expect(setHeader).toHaveBeenLastCalledWith('Retry-After', '45');

    vi.advanceTimersByTime(45000);
    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('bounds stored users and admits new users after expired entries clear', () => {
    for (let index = 0; index < 5000; index += 1) {
      guard.canActivate(context('GET', `user-${index}`).executionContext);
    }

    const newcomer = context('GET', 'new-user');
    expectRateLimited(() => guard.canActivate(newcomer.executionContext));

    vi.advanceTimersByTime(60000);
    expect(guard.canActivate(newcomer.executionContext)).toBe(true);
  });
});
