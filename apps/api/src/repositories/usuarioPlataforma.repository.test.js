import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { mockearConsulta } from '../test/queryBuilderMock.js';
import * as usuarioPlataformaRepository from './usuarioPlataforma.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const USUARIO_ID = 'b7d8e1c2-0000-4000-8000-000000000001';
const FALLO = { data: null, error: { message: 'caída' } };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarPlataformaIds', () => {
  it('devuelve los ids de las plataformas del usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [{ plataforma_id: 1 }, { plataforma_id: 3 }],
      error: null,
    });

    await expect(usuarioPlataformaRepository.listarPlataformaIds(USUARIO_ID)).resolves.toEqual([
      1, 3,
    ]);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('usuario_plataforma');
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(
      usuarioPlataformaRepository.listarPlataformaIds(USUARIO_ID),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});

describe('agregar', () => {
  it('inserta la plataforma del usuario sin fallar si ya la tenía', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await usuarioPlataformaRepository.agregar(USUARIO_ID, 1);

    expect(builder.upsert).toHaveBeenCalledWith(
      { usuario_id: USUARIO_ID, plataforma_id: 1 },
      { onConflict: 'usuario_id,plataforma_id', ignoreDuplicates: true },
    );
  });

  it('lanza DatabaseError si falla la escritura', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(usuarioPlataformaRepository.agregar(USUARIO_ID, 1)).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});

describe('quitar', () => {
  it('borra solo la plataforma de ese usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await usuarioPlataformaRepository.quitar(USUARIO_ID, 1);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
    expect(builder.eq).toHaveBeenCalledWith('plataforma_id', 1);
  });

  it('lanza DatabaseError si falla el borrado', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(usuarioPlataformaRepository.quitar(USUARIO_ID, 1)).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
