import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { NOTIFICACION_POR_ENVIAR_COLUMNS } from '../models/notificacion.model.js';
import { FALLO, mockearConsulta, SIN_DATOS } from '../test/queryBuilderMock.js';
import * as notificacionRepository from './notificacion.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const USUARIO_ID = 'b7d8e1c2-0000-4000-8000-000000000001';
const FILA = {
  id: 7,
  usuario_id: USUARIO_ID,
  region: 'AR',
  intentos: 1,
  creada_en: '2026-10-27T06:00:00.123456+00:00',
  titulo: { id: 17, tmdb_id: 42, tipo: 'pelicula', nombre: 'Dune', anio: 2021 },
  plataforma: { id: 10, nombre: 'Netflix' },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarPorEnviar', () => {
  it('trae los avisos pendientes y fallidos que se pueden reintentar, del más viejo al más nuevo', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: [FILA], error: null });

    await expect(notificacionRepository.listarPorEnviar(3)).resolves.toEqual([
      {
        id: 7,
        usuarioId: USUARIO_ID,
        region: 'AR',
        intentos: 1,
        creadaEn: '2026-10-27T06:00:00.123456+00:00',
        titulo: { id: 17, tmdbId: 42, tipo: 'pelicula', nombre: 'Dune', anio: 2021 },
        plataforma: { id: 10, nombre: 'Netflix' },
      },
    ]);

    expect(builder.select).toHaveBeenCalledWith(NOTIFICACION_POR_ENVIAR_COLUMNS);
    expect(builder.in).toHaveBeenCalledWith('estado', ['pendiente', 'fallida']);
    expect(builder.lt).toHaveBeenCalledWith('intentos', 3);
    expect(builder.order).toHaveBeenNthCalledWith(1, 'creada_en');
  });

  it('devuelve una lista vacía si no hay avisos', async () => {
    mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(notificacionRepository.listarPorEnviar(3)).resolves.toEqual([]);
  });
});

describe('marcar y eliminar', () => {
  it('marca los avisos como enviados y limpia el último error', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await notificacionRepository.marcarEnviadas([7, 8], '2026-10-21T06:30:00.000Z');

    expect(builder.update).toHaveBeenCalledWith({
      estado: 'enviada',
      enviada_en: '2026-10-21T06:30:00.000Z',
      ultimo_error: null,
    });
    expect(builder.in).toHaveBeenCalledWith('id', [7, 8]);
  });

  it('marca los avisos como fallidos con el intento y el error', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await notificacionRepository.marcarFallidas([7], { intentos: 2, error: 'HTTP 500' });

    expect(builder.update).toHaveBeenCalledWith({
      estado: 'fallida',
      intentos: 2,
      ultimo_error: 'HTTP 500',
    });
  });

  it('elimina los avisos indicados', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await notificacionRepository.eliminar([7]);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.in).toHaveBeenCalledWith('id', [7]);
  });

  it('lanza DatabaseError si falla la base', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(notificacionRepository.listarPorEnviar(3)).rejects.toBeInstanceOf(DatabaseError);
    await expect(notificacionRepository.marcarEnviadas([7], 'x')).rejects.toBeInstanceOf(
      DatabaseError,
    );
    await expect(notificacionRepository.eliminar([7])).rejects.toBeInstanceOf(DatabaseError);
  });
});
