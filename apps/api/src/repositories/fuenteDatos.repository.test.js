import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import * as fuenteDatosRepository from './fuenteDatos.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('obtenerIdPorNombre', () => {
  it('devuelve el identificador de la fuente registrada', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: { id: 3 },
      error: null,
    });

    await expect(fuenteDatosRepository.obtenerIdPorNombre('Streaming Availability')).resolves.toBe(
      3,
    );
    expect(supabaseAdmin.from).toHaveBeenCalledWith('fuente_datos');
    expect(builder.eq).toHaveBeenCalledWith('nombre', 'Streaming Availability');
  });

  it('lanza DatabaseError si falla la consulta o falta la fuente', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(
      fuenteDatosRepository.obtenerIdPorNombre('Streaming Availability'),
    ).rejects.toBeInstanceOf(DatabaseError);

    mockearConsulta(supabaseAdmin.from, { data: null, error: null });
    await expect(
      fuenteDatosRepository.obtenerIdPorNombre('Streaming Availability'),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
