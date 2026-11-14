import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import { USUARIO } from '../test/fixtures.js';
import * as perfilRepository from './perfil.repository.js';
import { ROL_USUARIO } from '@buscador/shared/constants';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe('perfil.repository', () => {
  it('lee solo la región del perfil del usuario autenticado', async () => {
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

  it('lee solo el rol del perfil del usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: { rol: ROL_USUARIO.ADMINISTRADOR },
      error: null,
    });

    await expect(perfilRepository.obtenerRol(USUARIO.id)).resolves.toBe(ROL_USUARIO.ADMINISTRADOR);
    expect(builder.select).toHaveBeenCalledWith('rol');
    expect(builder.eq).toHaveBeenCalledWith('id', USUARIO.id);
  });

  it('rechaza un rol que no está entre los roles conocidos', async () => {
    mockearConsulta(supabaseAdmin.from, { data: { rol: 'moderador' }, error: null });

    await expect(perfilRepository.obtenerRol(USUARIO.id)).rejects.toThrow();
  });

  it('devuelve rol null cuando no existe un perfil para el usuario', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await expect(perfilRepository.obtenerRol(USUARIO.id)).resolves.toBeNull();
  });

  it('actualiza la región solo si está vacía o es distinta', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: { region: 'UY' }, error: null });

    await expect(perfilRepository.actualizarRegion(USUARIO.id, 'UY')).resolves.toBe('UY');
    expect(builder.select).toHaveBeenCalledWith('region');
    expect(builder.update).toHaveBeenCalledWith({ region: 'UY' });
    expect(builder.eq).toHaveBeenCalledWith('id', USUARIO.id);
    expect(builder.or).toHaveBeenCalledWith('region.is.null,region.neq.UY');
  });

  it('devuelve null si el perfil ya tenía esa región', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });
    await expect(perfilRepository.actualizarRegion(USUARIO.id, 'UY')).resolves.toBeNull();
  });

  it('propaga los errores de la base', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(perfilRepository.obtenerRegion(USUARIO.id)).rejects.toBeInstanceOf(DatabaseError);
    await expect(perfilRepository.obtenerRol(USUARIO.id)).rejects.toBeInstanceOf(DatabaseError);
    await expect(perfilRepository.actualizarRegion(USUARIO.id, 'UY')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
