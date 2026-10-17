import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import * as watchlistRepository from './watchlist.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarTitulosConAvisosActivos', () => {
  it('devuelve los títulos, aplica la región predeterminada y filtra avisos activos', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [
        {
          titulo: { id: 12, tmdb_id: 100, tipo: 'pelicula' },
          perfil: { region: 'AR' },
        },
        {
          titulo: { id: 13, tmdb_id: 200, tipo: 'serie' },
          perfil: { region: null },
        },
      ],
      error: null,
    });

    await expect(watchlistRepository.listarTitulosConAvisosActivos('AR')).resolves.toEqual([
      { tituloId: 12, tmdbId: 100, tipo: 'pelicula', region: 'AR' },
      { tituloId: 13, tmdbId: 200, tipo: 'serie', region: 'AR' },
    ]);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('watchlist_item');
    expect(builder.eq).toHaveBeenCalledWith('aviso_activo', true);
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(watchlistRepository.listarTitulosConAvisosActivos('AR')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
