import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FILA_METRICAS } from '../test/fixtures.js';
import { FALLO } from '../test/queryBuilderMock.js';
import * as metricasRepository from './metricas.repository.js';

vi.mock('../config/supabase.config.js', () => ({
  supabaseAdmin: { rpc: vi.fn() },
}));

const GENEROS = { drama: [18] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('metricas.repository', () => {
  it('pasa el período y los géneros a la función y agrupa los rankings por dimensión', async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: FILA_METRICAS, error: null });

    const metricas = await metricasRepository.obtenerMetricas({
      desde: '2026-10-17T12:00:00.000Z',
      generos: GENEROS,
    });

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('obtener_metricas_admin', {
      p_desde: '2026-10-17T12:00:00.000Z',
      p_generos: GENEROS,
    });
    expect(metricas).toEqual({
      totales: FILA_METRICAS.totales,
      rankings: {
        genero: {
          watchlist: FILA_METRICAS.watchlist.generos,
          busquedas: FILA_METRICAS.busquedas.generos,
        },
        tipo: {
          watchlist: FILA_METRICAS.watchlist.tipos,
          busquedas: FILA_METRICAS.busquedas.tipos,
        },
        region: {
          watchlist: FILA_METRICAS.watchlist.regiones,
          busquedas: FILA_METRICAS.busquedas.regiones,
        },
        plataforma: FILA_METRICAS.plataformas,
        textosBuscados: FILA_METRICAS.busquedas.textos,
      },
    });
  });

  it('lanza DatabaseError si falla la función', async () => {
    supabaseAdmin.rpc.mockResolvedValue(FALLO);

    await expect(
      metricasRepository.obtenerMetricas({ desde: null, generos: GENEROS }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  it('rechaza una respuesta que no cumple el formato', async () => {
    supabaseAdmin.rpc.mockResolvedValue({
      data: { ...FILA_METRICAS, totales: { usuarios: -1 } },
      error: null,
    });

    await expect(
      metricasRepository.obtenerMetricas({ desde: null, generos: GENEROS }),
    ).rejects.toThrow();
  });
});
