import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { ConflictError, DatabaseError } from '../errors/index.js';
import { FALLO, SIN_DATOS, mockearConsulta } from '../test/queryBuilderMock.js';
import * as tituloRepository from './titulo.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const DUNE = {
  tmdbId: 1,
  tipo: 'pelicula',
  nombre: 'Dune',
  sinopsis: 'En un futuro lejano...',
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  anio: 2021,
  puntuacion: 8.1,
};

const FILA_DUNE = {
  id: 10,
  tmdb_id: 1,
  tipo: 'pelicula',
  nombre: 'Dune',
  anio: 2021,
  sinopsis: 'En un futuro lejano...',
  poster_path: '/dune.jpg',
  puntuacion: 8.1,
  actualizado_en: '2026-10-01T12:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('obtenerPorTmdbIdYTipo', () => {
  it('busca por la clave natural (tmdb_id, tipo) y convierte la fila', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: FILA_DUNE, error: null });

    await expect(tituloRepository.obtenerPorTmdbIdYTipo(1, 'pelicula')).resolves.toMatchObject({
      id: 10,
      tmdbId: 1,
      tipo: 'pelicula',
      posterUrl: DUNE.posterUrl,
    });
    expect(supabaseAdmin.from).toHaveBeenCalledWith('titulo');
    expect(builder.eq).toHaveBeenCalledWith('tmdb_id', 1);
    expect(builder.eq).toHaveBeenCalledWith('tipo', 'pelicula');
  });

  it('devuelve null si el título no está en el caché', async () => {
    mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(tituloRepository.obtenerPorTmdbIdYTipo(1, 'pelicula')).resolves.toBeNull();
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(tituloRepository.obtenerPorTmdbIdYTipo(1, 'pelicula')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});

describe('guardarDesdeTmdb', () => {
  it('hace upsert por la clave natural y guarda solo el path del póster', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: FILA_DUNE, error: null });

    await expect(tituloRepository.guardarDesdeTmdb(DUNE)).resolves.toMatchObject({ id: 10 });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ tmdb_id: 1, tipo: 'pelicula', poster_path: '/dune.jpg' }),
      { onConflict: 'tmdb_id,tipo' },
    );
  });

  it('usa un nombre de respaldo si TMDB no lo trae', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: FILA_DUNE, error: null });

    await tituloRepository.guardarDesdeTmdb({ ...DUNE, nombre: null });

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Título no disponible' }),
      expect.anything(),
    );
  });

  it('lanza ConflictError ante una restricción única', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: { code: '23505' } });

    await expect(tituloRepository.guardarDesdeTmdb(DUNE)).rejects.toBeInstanceOf(ConflictError);
  });

  it('lanza DatabaseError si falla el upsert', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(tituloRepository.guardarDesdeTmdb(DUNE)).rejects.toBeInstanceOf(DatabaseError);
  });
});
