import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, SIN_DATOS, mockearConsulta } from '../test/queryBuilderMock.js';
import * as fuenteDatosRepository from './fuenteDatos.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('obtenerIdPorNombre', () => {
  it.each(['Streaming Availability', 'JustWatch'])(
    'devuelve el identificador de la fuente %s',
    async (nombre) => {
      const builder = mockearConsulta(supabaseAdmin.from, { data: { id: 3 }, error: null });

      await expect(fuenteDatosRepository.obtenerIdPorNombre(nombre)).resolves.toBe(3);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('fuente_datos');
      expect(builder.eq).toHaveBeenCalledWith('nombre', nombre);
    },
  );

  it('devuelve null si la fuente todavía no está registrada', async () => {
    mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(fuenteDatosRepository.obtenerIdPorNombre('Otra')).resolves.toBeNull();
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(fuenteDatosRepository.obtenerIdPorNombre('JustWatch')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
