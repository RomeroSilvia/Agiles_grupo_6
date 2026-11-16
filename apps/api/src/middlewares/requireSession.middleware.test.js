import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthenticatedError } from '../errors/index.js';
import { loadSession } from './loadSession.middleware.js';
import { requireSession } from './requireSession.middleware.js';

vi.mock('./loadSession.middleware.js', () => ({ loadSession: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

describe('requireSession', () => {
  it('sigue si hay un usuario en la sesión', async () => {
    loadSession.mockImplementation(async (req) => {
      req.user = { id: 'u1', email: 'ana@mail.com' };
    });
    const next = vi.fn();

    await requireSession({}, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('responde 401 si no hay sesión', async () => {
    loadSession.mockImplementation(async (req) => {
      req.user = null;
    });
    const next = vi.fn();

    await expect(requireSession({}, {}, next)).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(next).not.toHaveBeenCalled();
  });
});
