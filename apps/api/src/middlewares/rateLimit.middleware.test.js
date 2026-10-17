import { afterEach, describe, expect, it, vi } from 'vitest';
import { rateLimit } from './rateLimit.middleware.js';

afterEach(() => vi.useRealTimers());

describe('rateLimit', () => {
  it('limita las solicitudes por IP y libera la ventana al vencer', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    const middleware = rateLimit({ maxRequests: 1, windowMs: 60_000 });
    const req = { ip: '192.0.2.10', socket: {} };
    const res = { setHeader: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();

    next.mockClear();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 429, code: 'RATE_LIMITED' }),
    );
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 60);

    vi.advanceTimersByTime(60_000);
    next.mockClear();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('mantiene ventanas independientes para cada IP', () => {
    const middleware = rateLimit({ maxRequests: 1, windowMs: 60_000 });
    const res = { setHeader: vi.fn() };
    const next = vi.fn();

    middleware({ ip: '192.0.2.1', socket: {} }, res, next);
    middleware({ ip: '192.0.2.2', socket: {} }, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenNthCalledWith(1);
    expect(next).toHaveBeenNthCalledWith(2);
  });
});
