import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenError, UnauthenticatedError } from '../errors/index.js';
import * as perfilService from '../services/perfil.service.js';
import { requireAdmin } from './requireAdmin.middleware.js';
import { requireSession } from './requireSession.middleware.js';

vi.mock('./requireSession.middleware.js', () => ({ requireSession: vi.fn() }));
vi.mock('../services/perfil.service.js', () => ({ esAdministrador: vi.fn() }));

const USUARIO = { id: 'u1', email: 'admin@mail.com' };

beforeEach(() => {
  vi.resetAllMocks();
  requireSession.mockImplementation(async (req) => {
    req.user = USUARIO;
  });
});

describe('requireAdmin', () => {
  it('deja pasar a un administrador', async () => {
    perfilService.esAdministrador.mockResolvedValue(true);
    const next = vi.fn();

    await requireAdmin({}, {}, next);

    expect(perfilService.esAdministrador).toHaveBeenCalledWith(USUARIO.id);
    expect(next).toHaveBeenCalledWith();
  });

  it('responde 403 si la cuenta no es administradora', async () => {
    perfilService.esAdministrador.mockResolvedValue(false);
    const next = vi.fn();

    await expect(requireAdmin({}, {}, next)).rejects.toBeInstanceOf(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('sin sesión corta antes de consultar el rol', async () => {
    requireSession.mockRejectedValue(new UnauthenticatedError());
    const next = vi.fn();

    await expect(requireAdmin({}, {}, next)).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(perfilService.esAdministrador).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
