import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { mockearConsulta } from '../test/queryBuilderMock.js';
import * as plataformaRepository from './plataforma.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const FILA_NETFLIX = {
  id: 1,
  tmdb_provider_id: 8,
  nombre: 'Netflix',
  logo_path: null,
  url_home: 'https://www.netflix.com',
};
const NETFLIX = {
  id: 1,
  tmdbProviderId: 8,
  nombre: 'Netflix',
  logoPath: null,
  urlHome: 'https://www.netflix.com',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarActivas', () => {
  it('devuelve solo las plataformas activas, ordenadas por nombre', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: [FILA_NETFLIX], error: null });

    await expect(plataformaRepository.listarActivas()).resolves.toEqual([NETFLIX]);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('plataforma');
    expect(builder.eq).toHaveBeenCalledWith('activa', true);
    expect(builder.order).toHaveBeenCalledWith('nombre');
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: { message: 'caída' } });

    await expect(plataformaRepository.listarActivas()).rejects.toBeInstanceOf(DatabaseError);
  });
});

describe('obtenerActivaPorId', () => {
  it('devuelve la plataforma si existe y está activa', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: FILA_NETFLIX, error: null });

    await expect(plataformaRepository.obtenerActivaPorId(1)).resolves.toEqual(NETFLIX);
    expect(builder.eq).toHaveBeenCalledWith('id', 1);
    expect(builder.eq).toHaveBeenCalledWith('activa', true);
  });

  it('devuelve null si no existe o no está activa', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await expect(plataformaRepository.obtenerActivaPorId(99)).resolves.toBeNull();
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: { message: 'caída' } });

    await expect(plataformaRepository.obtenerActivaPorId(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});
