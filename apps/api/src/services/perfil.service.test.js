import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROL_USUARIO } from '@buscador/shared/constants';
import { DatabaseError } from '../errors/index.js';
import * as perfilRepository from '../repositories/perfil.repository.js';
import { USUARIO } from '../test/fixtures.js';
import * as perfilService from './perfil.service.js';

vi.mock('../repositories/perfil.repository.js');

beforeEach(() => vi.resetAllMocks());

describe('perfil.service', () => {
  it('reconoce al administrador', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.ADMINISTRADOR);

    await expect(perfilService.esAdministrador(USUARIO.id)).resolves.toBe(true);
    expect(perfilRepository.obtenerRol).toHaveBeenCalledWith(USUARIO.id);
  });

  it('no considera administrador a un usuario común', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.USUARIO);

    await expect(perfilService.esAdministrador(USUARIO.id)).resolves.toBe(false);
  });

  it('no considera administrador a quien no tiene perfil', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(null);

    await expect(perfilService.esAdministrador(USUARIO.id)).resolves.toBe(false);
  });

  // requireAdmin depende de esto para negar el acceso si la base falla
  it('propaga los errores de la base', async () => {
    perfilRepository.obtenerRol.mockRejectedValue(new DatabaseError(new Error('caída')));

    await expect(perfilService.esAdministrador(USUARIO.id)).rejects.toBeInstanceOf(DatabaseError);
  });
});
