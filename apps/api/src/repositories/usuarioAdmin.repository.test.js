import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO } from '../test/queryBuilderMock.js';
import * as usuarioAdminRepository from './usuarioAdmin.repository.js';

vi.mock('../config/supabase.config.js', () => ({
  supabaseAdmin: { rpc: vi.fn() },
}));

const FILA_USUARIO = {
  id: 'b7d8e1c2-0000-4000-8000-000000000001',
  email: 'ana.lopez@mail.com',
  region: 'AR',
  plataforma_ids: [1, 3],
  titulos_watchlist: 14,
  creado_en: '2026-10-12T15:30:00+00:00',
  estado: 'activo',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('usuarioAdmin.repository', () => {
  it('pasa los filtros a la función y convierte las filas', async () => {
    supabaseAdmin.rpc.mockResolvedValue({
      data: { total: 21, usuarios: [FILA_USUARIO] },
      error: null,
    });

    await expect(
      usuarioAdminRepository.listarUsuarios({
        mail: 'ana',
        region: 'AR',
        estado: 'activo',
        limite: 10,
        offset: 20,
      }),
    ).resolves.toEqual({
      total: 21,
      usuarios: [
        {
          id: FILA_USUARIO.id,
          email: 'ana.lopez@mail.com',
          region: 'AR',
          plataformaIds: [1, 3],
          titulosWatchlist: 14,
          creadoEn: '2026-10-12T15:30:00+00:00',
          estado: 'activo',
        },
      ],
    });
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('listar_usuarios_admin', {
      p_email: 'ana',
      p_region: 'AR',
      p_estado: 'activo',
      p_limite: 10,
      p_offset: 20,
    });
  });

  it('sin filtros los manda como null', async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: { total: 0, usuarios: [] }, error: null });

    await expect(usuarioAdminRepository.listarUsuarios({ limite: 10, offset: 0 })).resolves.toEqual(
      { total: 0, usuarios: [] },
    );
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('listar_usuarios_admin', {
      p_email: null,
      p_region: null,
      p_estado: null,
      p_limite: 10,
      p_offset: 0,
    });
  });

  it('lanza DatabaseError si falla la función', async () => {
    supabaseAdmin.rpc.mockResolvedValue(FALLO);

    await expect(
      usuarioAdminRepository.listarUsuarios({ limite: 10, offset: 0 }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
