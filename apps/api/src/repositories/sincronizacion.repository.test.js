import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import * as sincronizacionRepository from './sincronizacion.repository.js';

vi.mock('../config/supabase.config.js', () => ({
  supabaseAdmin: { from: vi.fn(), rpc: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('sincronizacion.repository', () => {
  it('inicia una ejecución y mapea su registro', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: {
        id: 5,
        iniciada_en: '2026-10-17T06:00:00.000Z',
        finalizada_en: null,
        titulos_procesados: 0,
        error: null,
      },
      error: null,
    });

    await expect(sincronizacionRepository.iniciar()).resolves.toEqual({
      id: 5,
      iniciadaEn: '2026-10-17T06:00:00.000Z',
      finalizadaEn: null,
      titulosProcesados: 0,
      error: null,
    });
    expect(builder.insert).toHaveBeenCalledWith({});
  });

  it('reserva atómicamente una consulta dentro del cupo diario', async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: true, error: null });

    await expect(
      sincronizacionRepository.reservarConsultaDisponibilidad(5, {
        inicio: '2026-10-17T00:00:00.000Z',
        fin: '2026-10-18T00:00:00.000Z',
        limite: 100,
      }),
    ).resolves.toBe(true);

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('reservar_cupo_disponibilidad', {
      p_sincronizacion_id: 5,
      p_inicio: '2026-10-17T00:00:00.000Z',
      p_fin: '2026-10-18T00:00:00.000Z',
      p_limite: 100,
    });
  });

  it('finaliza una ejecución con los totales y el error acumulado', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await sincronizacionRepository.finalizar(5, {
      finalizadaEn: '2026-10-17T06:05:00.000Z',
      titulosProcesados: 2,
      error: 'Falló un título',
    });

    expect(builder.update).toHaveBeenCalledWith({
      finalizada_en: '2026-10-17T06:05:00.000Z',
      error: 'Falló un título',
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 5);
  });

  it('lanza DatabaseError si no puede iniciar, reservar o cerrar una ejecución', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(sincronizacionRepository.iniciar()).rejects.toBeInstanceOf(DatabaseError);

    supabaseAdmin.rpc.mockResolvedValue(FALLO);
    await expect(
      sincronizacionRepository.reservarConsultaDisponibilidad(5, {
        inicio: 'inicio',
        fin: 'fin',
        limite: 100,
      }),
    ).rejects.toBeInstanceOf(DatabaseError);

    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(
      sincronizacionRepository.finalizar(5, {
        finalizadaEn: '2026-10-17T06:05:00.000Z',
        titulosProcesados: 0,
        error: null,
      }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
