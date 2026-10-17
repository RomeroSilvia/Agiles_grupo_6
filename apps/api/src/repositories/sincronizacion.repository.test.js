import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import * as sincronizacionRepository from './sincronizacion.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

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

  it('suma las consultas registradas dentro de la ventana diaria', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [{ titulos_procesados: 20 }, { titulos_procesados: 30 }],
      error: null,
    });

    await expect(
      sincronizacionRepository.contarTitulosProcesadosEntre(
        '2026-10-17T00:00:00.000Z',
        '2026-10-18T00:00:00.000Z',
      ),
    ).resolves.toBe(50);
    expect(builder.gte).toHaveBeenCalledWith('iniciada_en', '2026-10-17T00:00:00.000Z');
    expect(builder.lt).toHaveBeenCalledWith('iniciada_en', '2026-10-18T00:00:00.000Z');
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
      titulos_procesados: 2,
      error: 'Falló un título',
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 5);
  });

  it('lanza DatabaseError si no puede iniciar, contar o cerrar una ejecución', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(sincronizacionRepository.iniciar()).rejects.toBeInstanceOf(DatabaseError);

    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(
      sincronizacionRepository.contarTitulosProcesadosEntre('inicio', 'fin'),
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
