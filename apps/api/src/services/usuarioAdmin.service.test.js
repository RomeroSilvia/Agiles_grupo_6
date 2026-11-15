import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USUARIOS_POR_PAGINA } from '@buscador/shared/constants';
import { env } from '../config/env.config.js';
import * as usuarioAdminRepository from '../repositories/usuarioAdmin.repository.js';
import * as usuarioAdminService from './usuarioAdmin.service.js';

vi.mock('../repositories/usuarioAdmin.repository.js');

const USUARIO = {
  id: 'b7d8e1c2-0000-4000-8000-000000000001',
  email: 'ana.lopez@mail.com',
  region: 'MX',
  plataformaIds: [],
  titulosWatchlist: 0,
  creadoEn: '2026-10-12T15:30:00+00:00',
  estado: 'activo',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('usuarioAdmin.service', () => {
  it('calcula el offset de la página y el total de páginas', async () => {
    usuarioAdminRepository.listarUsuarios.mockResolvedValue({ total: 21, usuarios: [USUARIO] });

    await expect(
      usuarioAdminService.listarUsuarios({ mail: 'ana', estado: 'activo', pagina: 3 }),
    ).resolves.toEqual({ usuarios: [USUARIO], total: 21, pagina: 3, totalPaginas: 3 });
    expect(usuarioAdminRepository.listarUsuarios).toHaveBeenCalledWith({
      mail: 'ana',
      estado: 'activo',
      limite: USUARIOS_POR_PAGINA,
      offset: 2 * USUARIOS_POR_PAGINA,
    });
  });

  it('muestra la región por defecto a los usuarios sin región detectada', async () => {
    usuarioAdminRepository.listarUsuarios.mockResolvedValue({
      total: 1,
      usuarios: [{ ...USUARIO, region: null }],
    });

    const { usuarios } = await usuarioAdminService.listarUsuarios({ pagina: 1 });

    expect(usuarios[0].region).toBe(env.DEFAULT_REGION);
  });

  it('sin usuarios devuelve cero páginas', async () => {
    usuarioAdminRepository.listarUsuarios.mockResolvedValue({ total: 0, usuarios: [] });

    await expect(usuarioAdminService.listarUsuarios({ pagina: 1 })).resolves.toEqual({
      usuarios: [],
      total: 0,
      pagina: 1,
      totalPaginas: 0,
    });
  });
});
