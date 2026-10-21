import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import {
  TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS,
  WATCHLIST_PRIMARY_KEY,
  WATCHLIST_TITULO_COLUMNS,
} from '../models/watchlist.model.js';
import { FALLO, mockearConsulta, SIN_DATOS } from '../test/queryBuilderMock.js';
import * as watchlistRepository from './watchlist.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const USUARIO_ID = 'b7d8e1c2-0000-4000-8000-000000000001';
const TITULO_ID = 17;
const FILA_WATCHLIST = {
  id: 4,
  agregado_en: '2026-10-17T12:00:00.000Z',
  titulo: {
    id: TITULO_ID,
    tmdb_id: 42,
    tipo: 'pelicula',
    nombre: 'Dune',
    anio: 2021,
    poster_path: '/dune.jpg',
    puntuacion: 8.1,
  },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarTitulosConAvisosActivos', () => {
  it('mapea títulos junto con la región de cada perfil y aplica el fallback configurado', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [
        { titulo: { id: 17, tmdb_id: 42, tipo: 'pelicula' }, perfil: { region: 'US' } },
        { titulo: { id: 17, tmdb_id: 42, tipo: 'pelicula' }, perfil: { region: null } },
      ],
      error: null,
    });

    await expect(watchlistRepository.listarTitulosConAvisosActivos('AR')).resolves.toEqual([
      { tituloId: 17, tmdbId: 42, tipo: 'pelicula', region: 'US' },
      { tituloId: 17, tmdbId: 42, tipo: 'pelicula', region: 'AR' },
    ]);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('watchlist_item');
    expect(builder.select).toHaveBeenCalledWith(TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS);
    expect(builder.eq).toHaveBeenCalledWith('aviso_activo', true);
    expect(builder.order).toHaveBeenNthCalledWith(1, 'titulo_id');
    expect(builder.order).toHaveBeenNthCalledWith(2, 'id');
    expect(builder.range).toHaveBeenCalledWith(0, 19);
  });

  it('recorre todas las páginas cuando hay más de mil títulos con avisos activos', async () => {
    const filas = Array.from({ length: 1001 }, (_, index) => ({
      titulo: { id: index + 1, tmdb_id: index + 1, tipo: 'pelicula' },
      perfil: { region: 'AR' },
    }));
    const builders = [];

    supabaseAdmin.from.mockImplementation(() => {
      let desde = 0;
      let hasta = 0;
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(() => builder),
        range: vi.fn((inicio, fin) => {
          desde = inicio;
          hasta = fin;
          return builder;
        }),
        then: (resolve, reject) =>
          Promise.resolve({ data: filas.slice(desde, hasta + 1), error: null }).then(
            resolve,
            reject,
          ),
      };
      builders.push(builder);
      return builder;
    });

    const resultados = await watchlistRepository.listarTitulosConAvisosActivos('AR');

    expect(resultados).toHaveLength(1001);
    expect(resultados.at(-1)).toEqual({
      tituloId: 1001,
      tmdbId: 1001,
      tipo: 'pelicula',
      region: 'AR',
    });
    expect(builders).toHaveLength(51);
    expect(builders[0].range).toHaveBeenCalledWith(0, 19);
    expect(builders.at(-1).range).toHaveBeenCalledWith(1000, 1019);
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(watchlistRepository.listarTitulosConAvisosActivos('AR')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});

describe('listarPorUsuario', () => {
  it('filtra por usuario y pagina antes de mapear los títulos', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [FILA_WATCHLIST],
      count: 21,
      error: null,
    });

    await expect(watchlistRepository.listarPorUsuario(USUARIO_ID, 2)).resolves.toEqual({
      resultados: [
        {
          id: 4,
          agregadoEn: FILA_WATCHLIST.agregado_en,
          titulo: {
            id: TITULO_ID,
            tmdbId: 42,
            tipo: 'pelicula',
            nombre: 'Dune',
            anio: 2021,
            posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
            puntuacion: 8.1,
          },
        },
      ],
      pagina: 2,
      totalResultados: 21,
      totalPaginas: 2,
    });

    expect(supabaseAdmin.from).toHaveBeenCalledWith('watchlist_item');
    expect(builder.select).toHaveBeenCalledWith(WATCHLIST_TITULO_COLUMNS, { count: 'exact' });
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
    expect(builder.order).toHaveBeenNthCalledWith(1, 'agregado_en', { ascending: false });
    expect(builder.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(builder.range).toHaveBeenCalledWith(20, 39);
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(watchlistRepository.listarPorUsuario(USUARIO_ID, 1)).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });

  it('conserva el total real de páginas cuando supera el límite de búsqueda global', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [],
      count: 10_001,
      error: null,
    });

    await expect(watchlistRepository.listarPorUsuario(USUARIO_ID, 501)).resolves.toMatchObject({
      pagina: 501,
      totalResultados: 10_001,
      totalPaginas: 501,
    });
    expect(builder.range).toHaveBeenCalledWith(10_000, 10_019);
  });
});

describe('existe', () => {
  it('consulta el elemento solo dentro de la watchlist del usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: { id: 4 }, error: null });

    await expect(watchlistRepository.existe(USUARIO_ID, TITULO_ID)).resolves.toBe(true);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('watchlist_item');
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
    expect(builder.eq).toHaveBeenCalledWith('titulo_id', TITULO_ID);
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it('devuelve false si el usuario no tiene el título', async () => {
    mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(watchlistRepository.existe(USUARIO_ID, TITULO_ID)).resolves.toBe(false);
  });
});

describe('agregar', () => {
  it('guarda el usuario y título y no duplica una entrada existente', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(watchlistRepository.agregar(USUARIO_ID, TITULO_ID)).resolves.toBeUndefined();

    expect(supabaseAdmin.from).toHaveBeenCalledWith('watchlist_item');
    expect(builder.upsert).toHaveBeenCalledWith(
      { usuario_id: USUARIO_ID, titulo_id: TITULO_ID },
      { onConflict: WATCHLIST_PRIMARY_KEY, ignoreDuplicates: true },
    );
  });
});

describe('quitar', () => {
  it('elimina solo el título del usuario recibido', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: { id: 4 }, error: null });

    await expect(watchlistRepository.quitar(USUARIO_ID, TITULO_ID)).resolves.toBe(true);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('watchlist_item');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
    expect(builder.eq).toHaveBeenCalledWith('titulo_id', TITULO_ID);
    expect(builder.select).toHaveBeenCalledWith('id');
  });

  it('devuelve false si el título no pertenece a la lista del usuario', async () => {
    mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(watchlistRepository.quitar(USUARIO_ID, TITULO_ID)).resolves.toBe(false);
  });
});
