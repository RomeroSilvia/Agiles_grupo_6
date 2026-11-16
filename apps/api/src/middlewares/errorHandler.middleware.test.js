import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseError, NotFoundError } from '../errors/index.js';
import { errorHandler, notFoundHandler } from './errorHandler.middleware.js';

function crearRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('errorHandler', () => {
  it('responde un AppError con su estado y código, sin registrarlo si es 4xx', () => {
    const res = crearRes();

    errorHandler(new NotFoundError('No está'), {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'No está', details: undefined },
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('registra los AppError 5xx sin exponer la causa', () => {
    const res = crearRes();

    errorHandler(new DatabaseError(new Error('detalle interno')), {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('detalle interno');
    expect(console.error).toHaveBeenCalled();
  });

  it('responde 400 INVALID_JSON si el body no es JSON válido', () => {
    const res = crearRes();

    errorHandler({ type: 'entity.parse.failed' }, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('INVALID_JSON');
  });

  it('responde 500 INTERNAL ante un error desconocido', () => {
    const res = crearRes();

    errorHandler(new TypeError('x is undefined'), {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado' },
    });
  });
});

describe('notFoundHandler', () => {
  it('pasa un NotFoundError', () => {
    const next = vi.fn();

    notFoundHandler({}, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });
});
