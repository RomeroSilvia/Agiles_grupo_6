import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import { USUARIO } from '../test/fixtures.js';
import * as perfilRepository from './perfil.repository.js';
import { ROL_USUARIO } from '@buscador/shared/constants';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const FILA_PERFIL = { region: 'BR', rol: ROL_USUARIO.USUARIO };

beforeEach(() => vi.resetAllMocks());

describe('perfil.repository', () => {
  it('lee la región del perfil del usuario autenticado', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: FILA_PERFIL, error: null });

    await expect(perfilRepository.obtenerRegion(USUARIO.id)).resolves.toBe('BR');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('perfil');
    expect(builder.select).toHaveBeenCalledWith('region, rol');
    expect(builder.eq).toHaveBeenCalledWith('id', USUARIO.id);
  });

  it('devuelve null cuando no existe un perfil para el usuario', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await expect(perfilRepository.obtenerRegion(USUARIO.id)).resolves.toBeNull();
  });

  it('lee el rol del perfil del usuario', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: { ...FILA_PERFIL, rol: ROL_USUARIO.ADMINISTRADOR },
      error: null,
    });

    await expect(perfilRepository.obtenerRol(USUARIO.id)).resolves.toBe(ROL_USUARIO.ADMINISTRADOR);
    expect(builder.eq).toHaveBeenCalledWith('id', USUARIO.id);
  });

  it('devuelve rol null cuando no existe un perfil para el usuario', async () => {
    mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await expect(perfilRepository.obtenerRol(USUARIO.id)).resolves.toBeNull();
  });

  it('actualiza la región solo si está vacía o es distinta', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: { ...FILA_PERFIL, region: 'UY' },
      error: null,
    });

    await expect(perfilRepository.actualizarRegion(USUARIO.id, 'UY')).resolves.toBe('UY');
    expect(builder.select).toHaveBeenCalledWith('region, rol');
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
