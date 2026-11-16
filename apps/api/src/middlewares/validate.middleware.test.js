import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { ValidationError } from '../errors/index.js';
import { validate } from './validate.middleware.js';

const middleware = validate({
  query: z.object({ pagina: z.coerce.number().int().min(1).default(1) }),
  params: z.object({ id: z.string().min(1) }),
});

describe('validate', () => {
  it('deja los datos parseados en req.validated', () => {
    const req = { query: {}, params: { id: 'abc' } };
    const next = vi.fn();

    middleware(req, {}, next);

    expect(req.validated).toEqual({ query: { pagina: 1 }, params: { id: 'abc' } });
    expect(next).toHaveBeenCalledWith();
  });

  it('pasa un ValidationError con el campo inválido', () => {
    const req = { query: { pagina: '0' }, params: { id: 'abc' } };
    const next = vi.fn();

    middleware(req, {}, next);

    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.details).toEqual([{ field: 'pagina', message: expect.any(String) }]);
    expect(req.validated).toBeUndefined();
  });
});
