import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { USUARIO_PLATAFORMA_PRIMARY_KEY } from '../models/usuarioPlataforma.model.js';
import { FALLO, SIN_DATOS, mockearConsulta } from '../test/queryBuilderMock.js';
import { USUARIO } from '../test/fixtures.js';
import * as usuarioPlataformaRepository from './usuarioPlataforma.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarActivasPorUsuario', () => {
  it('devuelve las plataformas activas del usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [
        { plataforma_id: 1, agregada_en: '2026-10-01T10:00:00Z' },
        { plataforma_id: 3, agregada_en: '2026-10-02T10:00:00Z' },
      ],
      error: null,
    });

    await expect(usuarioPlataformaRepository.listarActivasPorUsuario(USUARIO.id)).resolves.toEqual([
      { plataformaId: 1, agregadaEn: '2026-10-01T10:00:00Z' },
      { plataformaId: 3, agregadaEn: '2026-10-02T10:00:00Z' },
    ]);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('usuario_plataforma');
    expect(builder.select).toHaveBeenCalledWith(expect.stringContaining('plataforma!inner()'));
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO.id);
    expect(builder.eq).toHaveBeenCalledWith('plataforma.activa', true);
  });

  it('devuelve una lista vacía si el usuario no eligió plataformas', async () => {
    mockearConsulta(supabaseAdmin.from, { data: [], error: null });

    await expect(usuarioPlataformaRepository.listarActivasPorUsuario(USUARIO.id)).resolves.toEqual(
      [],
    );
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(
      usuarioPlataformaRepository.listarActivasPorUsuario(USUARIO.id),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});

describe('agregar', () => {
  it('inserta la plataforma del usuario sin fallar si ya la tenía', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await usuarioPlataformaRepository.agregar(USUARIO.id, 1);

    expect(builder.upsert).toHaveBeenCalledWith(
      { usuario_id: USUARIO.id, plataforma_id: 1 },
      { onConflict: USUARIO_PLATAFORMA_PRIMARY_KEY, ignoreDuplicates: true },
    );
  });

  it('lanza DatabaseError si falla la escritura', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(usuarioPlataformaRepository.agregar(USUARIO.id, 1)).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});

describe('quitar', () => {
  it('borra solo la plataforma de ese usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await usuarioPlataformaRepository.quitar(USUARIO.id, 1);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('usuario_id', USUARIO.id);
    expect(builder.eq).toHaveBeenCalledWith('plataforma_id', 1);
  });

  it('lanza DatabaseError si falla el borrado', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(usuarioPlataformaRepository.quitar(USUARIO.id, 1)).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
