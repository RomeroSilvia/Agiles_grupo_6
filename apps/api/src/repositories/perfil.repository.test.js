import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import { USUARIO } from '../test/fixtures.js';
import * as perfilRepository from './perfil.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe('perfil.repository', () => {
  it('lee la región del perfil del usuario autenticado', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: { region: 'BR' }, error: null });

    await expect(perfilRepository.obtenerRegion(USUARIO.id)).resolves.toBe('BR');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('perfil');
    expect(builder.select).toHaveBeenCalledWith('region');
    expect(builder.eq).toHaveBeenCalledWith('id', USUARIO.id);
  });

  it('devuelve null cuando no existe un perfil para el usuario', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await expect(perfilRepository.obtenerRegion(USUARIO.id)).resolves.toBeNull();
  });

  it('solo guarda la región si todavía no hay una en el perfil', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: { region: 'UY' }, error: null });

    await expect(perfilRepository.guardarRegionSiVacia(USUARIO.id, 'UY')).resolves.toBe('UY');
    expect(builder.update).toHaveBeenCalledWith({ region: 'UY' });
    expect(builder.eq).toHaveBeenCalledWith('id', USUARIO.id);
    expect(builder.is).toHaveBeenCalledWith('region', null);
  });

  it('devuelve null si otra solicitud guardó la región primero', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });
    await expect(perfilRepository.guardarRegionSiVacia(USUARIO.id, 'UY')).resolves.toBeNull();
  });

  it('propaga los errores de la base', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(perfilRepository.obtenerRegion(USUARIO.id)).rejects.toBeInstanceOf(DatabaseError);
    await expect(perfilRepository.guardarRegionSiVacia(USUARIO.id, 'UY')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
