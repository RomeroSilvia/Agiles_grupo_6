import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, SIN_DATOS, mockearConsulta } from '../test/queryBuilderMock.js';
import { FILA_NETFLIX, NETFLIX } from '../test/fixtures.js';
import * as plataformaRepository from './plataforma.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

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

  it('devuelve una lista vacía si no hay plataformas activas', async () => {
    mockearConsulta(supabaseAdmin.from, { data: [], error: null });

    await expect(plataformaRepository.listarActivas()).resolves.toEqual([]);
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

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
    mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await expect(plataformaRepository.obtenerActivaPorId(99)).resolves.toBeNull();
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(plataformaRepository.obtenerActivaPorId(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});
