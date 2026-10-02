import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import { DatabaseError } from '../errors/index.js';

vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/plataforma.repository.js');
vi.mock('../repositories/usuarioPlataforma.repository.js');

const USUARIO = { id: 'b7d8e1c2-0000-4000-8000-000000000001', email: 'ana@mail.com' };
const COOKIE_SESION = 'access_token=access-de-prueba';
const NETFLIX = {
  id: 1,
  tmdbProviderId: 8,
  nombre: 'Netflix',
  logoPath: null,
  urlHome: 'https://www.netflix.com',
};

beforeEach(() => {
  vi.resetAllMocks();
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
});

describe('GET /api/plataformas', () => {
  it('devuelve el catálogo de plataformas activas sin pedir sesión', async () => {
    plataformaRepository.listarActivas.mockResolvedValue([NETFLIX]);

    const res = await request(createApp()).get('/api/plataformas');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [NETFLIX] });
  });

  it('responde 500 si falla la base', async () => {
    plataformaRepository.listarActivas.mockRejectedValue(new DatabaseError(new Error('caída')));

    const res = await request(createApp()).get('/api/plataformas');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
  });
});

describe('plataformas propias sin sesión', () => {
  it.each([
    ['get', '/api/plataformas/propias'],
    ['put', '/api/plataformas/propias/1'],
    ['delete', '/api/plataformas/propias/1'],
  ])('%s %s responde 401', async (metodo, ruta) => {
    const res = await request(createApp())[metodo](ruta);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
    expect(usuarioPlataformaRepository.quitar).not.toHaveBeenCalled();
  });
});

describe('GET /api/plataformas/propias', () => {
  it('devuelve los ids de las plataformas del usuario de la sesión', async () => {
    usuarioPlataformaRepository.listarPlataformaIds.mockResolvedValue([1, 3]);

    const res = await request(createApp())
      .get('/api/plataformas/propias')
      .set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [1, 3] });
    expect(usuarioPlataformaRepository.listarPlataformaIds).toHaveBeenCalledWith(USUARIO.id);
  });
});

describe('PUT /api/plataformas/propias/:plataformaId', () => {
  it('agrega la plataforma al usuario de la sesión, sin importar lo que venga en el body', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(NETFLIX);

    const res = await request(createApp())
      .put('/api/plataformas/propias/1')
      .set('Cookie', COOKIE_SESION)
      .send({ usuario_id: 'otro-usuario' });

    expect(res.status).toBe(204);
    expect(usuarioPlataformaRepository.agregar).toHaveBeenCalledWith(USUARIO.id, 1);
  });

  it('responde 404 si la plataforma no existe o no está activa', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(null);

    const res = await request(createApp())
      .put('/api/plataformas/propias/99')
      .set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/plataformas/propias/:plataformaId', () => {
  it('quita la plataforma del usuario de la sesión', async () => {
    const res = await request(createApp())
      .delete('/api/plataformas/propias/1')
      .set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(204);
    expect(usuarioPlataformaRepository.quitar).toHaveBeenCalledWith(USUARIO.id, 1);
  });
});

describe('id de plataforma inválido', () => {
  it.each([
    ['put', 'abc'],
    ['put', '-1'],
    ['delete', '1.5'],
    ['delete', '0'],
  ])('%s con %s responde 400', async (metodo, plataformaId) => {
    const res = await request(createApp())
      [metodo](`/api/plataformas/propias/${plataformaId}`)
      .set('Cookie', COOKIE_SESION);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(res.body.error.details[0].field).toBe('plataformaId');
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
    expect(usuarioPlataformaRepository.quitar).not.toHaveBeenCalled();
  });
});
