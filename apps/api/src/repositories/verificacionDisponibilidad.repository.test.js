import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { VERIFICACION_DISPONIBILIDAD_COLUMNS } from '../models/verificacionDisponibilidad.model.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import * as verificacionDisponibilidadRepository from './verificacionDisponibilidad.repository.js';

vi.mock('../config/supabase.config.js', () => ({
  supabaseAdmin: { from: vi.fn(), rpc: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('verificacionDisponibilidad.repository', () => {
  it('lista las verificaciones previas para los títulos únicos', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [
        { titulo_id: 42, region: 'AR', verificada_en: '2026-10-16T00:00:00.000Z' },
        { titulo_id: 42, region: 'US', verificada_en: '2026-10-15T00:00:00.000Z' },
      ],
      error: null,
    });

    await expect(verificacionDisponibilidadRepository.listarPorTitulos([42, 42])).resolves.toEqual([
      { tituloId: 42, region: 'AR', verificadaEn: '2026-10-16T00:00:00.000Z' },
      { tituloId: 42, region: 'US', verificadaEn: '2026-10-15T00:00:00.000Z' },
    ]);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('verificacion_disponibilidad');
    expect(builder.select).toHaveBeenCalledWith(VERIFICACION_DISPONIBILIDAD_COLUMNS);
    expect(builder.in).toHaveBeenCalledWith('titulo_id', [42]);
    expect(builder.order).toHaveBeenNthCalledWith(1, 'titulo_id');
    expect(builder.order).toHaveBeenNthCalledWith(2, 'region');
    expect(builder.range).toHaveBeenCalledWith(0, 999);
  });

  it('registra la verificación de un título y región para generar avisos', async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: 2, error: null });

    await expect(
      verificacionDisponibilidadRepository.registrar({
        tituloId: 42,
        region: 'AR',
        regionPredeterminada: 'AR',
      }),
    ).resolves.toBe(2);

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('registrar_verificacion_disponibilidad', {
      p_titulo_id: 42,
      p_region: 'AR',
      p_region_predeterminada: 'AR',
    });
  });

  it('lanza DatabaseError si falla una consulta o el registro de la verificación', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(
      verificacionDisponibilidadRepository.listarPorTitulos([42]),
    ).rejects.toBeInstanceOf(DatabaseError);

    supabaseAdmin.rpc.mockResolvedValue(FALLO);
    await expect(
      verificacionDisponibilidadRepository.registrar({
        tituloId: 42,
        region: 'AR',
        regionPredeterminada: 'AR',
      }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
