import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ROL_USUARIO } from '@buscador/shared/constants';
import { createApp } from '../app.js';
import { DatabaseError } from '../errors/index.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as perfilRepository from '../repositories/perfil.repository.js';
import { USUARIO } from '../test/fixtures.js';
import { adminRoutes } from './admin.routes.js';

vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/perfil.repository.js');

adminRoutes.get('/prueba', (_req, res) => res.json({ data: 'ok' }));

const COOKIE_SESION = 'access_token=access-de-prueba';

function pedirPanel() {
  return request(createApp()).get('/api/admin/prueba');
}

beforeEach(() => {
  vi.resetAllMocks();
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
});

describe('/api/admin', () => {
  it('responde 401 sin sesión, sin consultar el rol', async () => {
    const res = await pedirPanel();

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(perfilRepository.obtenerRol).not.toHaveBeenCalled();
  });

  it('responde 403 a un usuario sin rol de administrador', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.USUARIO);

    const res = await pedirPanel().set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(perfilRepository.obtenerRol).toHaveBeenCalledWith(USUARIO.id);
  });

  it('responde 403 si el usuario no tiene perfil', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(null);

    const res = await pedirPanel().set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(403);
  });

  it('niega el acceso si falla la consulta del rol', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    perfilRepository.obtenerRol.mockRejectedValue(new DatabaseError(new Error('caída')));

    const res = await pedirPanel().set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
    expect(res.body).not.toHaveProperty('data');
    expect(res.headers['cache-control']).toBe('no-store');
    consoleError.mockRestore();
  });

  it('deja pasar al administrador y la respuesta no se guarda en caché', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.ADMINISTRADOR);

    const res = await pedirPanel().set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: 'ok' });
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
