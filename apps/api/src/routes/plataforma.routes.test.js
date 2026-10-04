import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import { DatabaseError } from '../errors/index.js';
import { NETFLIX, USUARIO } from '../test/fixtures.js';

vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/plataforma.repository.js');
vi.mock('../repositories/usuarioPlataforma.repository.js');

const COOKIE_SESION = 'access_token=access-de-prueba';

function errorDeBase() {
  return new DatabaseError(new Error('caída'));
}

function pedirConSesion(metodo, ruta) {
  return request(createApp())[metodo](ruta).set('Cookie', COOKIE_SESION);
}

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

  it('devuelve una lista vacía si no hay plataformas activas', async () => {
    plataformaRepository.listarActivas.mockResolvedValue([]);

    const res = await request(createApp()).get('/api/plataformas');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('responde 500 si falla la base', async () => {
    plataformaRepository.listarActivas.mockRejectedValue(errorDeBase());

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
    expect(usuarioPlataformaRepository.listarPlataformasActivasPorUsuario).not.toHaveBeenCalled();
    expect(plataformaRepository.obtenerActivaPorId).not.toHaveBeenCalled();
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
    expect(usuarioPlataformaRepository.quitar).not.toHaveBeenCalled();
  });
});

describe('GET /api/plataformas/propias', () => {
  it('devuelve los ids de las plataformas del usuario de la sesión', async () => {
    usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockResolvedValue([
      NETFLIX,
      { ...NETFLIX, id: 3, tmdbProviderId: 337, nombre: 'Disney Plus' },
    ]);

    const res = await pedirConSesion('get', '/api/plataformas/propias');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [1, 3] });
    expect(usuarioPlataformaRepository.listarPlataformasActivasPorUsuario).toHaveBeenCalledWith(
      USUARIO.id,
    );
  });

  it('devuelve una lista vacía si el usuario todavía no eligió plataformas', async () => {
    usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockResolvedValue([]);

    const res = await pedirConSesion('get', '/api/plataformas/propias');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('responde 500 si falla la base', async () => {
    usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockRejectedValue(errorDeBase());

    const res = await pedirConSesion('get', '/api/plataformas/propias');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
  });
});

describe('PUT /api/plataformas/propias/:plataformaId', () => {
  it('agrega la plataforma al usuario de la sesión, sin importar lo que venga en el body', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(NETFLIX);

    const res = await pedirConSesion('put', '/api/plataformas/propias/1').send({
      usuario_id: 'otro-usuario',
    });

    expect(res.status).toBe(204);
    expect(usuarioPlataformaRepository.agregar).toHaveBeenCalledWith(USUARIO.id, 1);
  });

  it('responde 204 si el usuario ya tenía la plataforma', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(NETFLIX);

    const primera = await pedirConSesion('put', '/api/plataformas/propias/1');
    const segunda = await pedirConSesion('put', '/api/plataformas/propias/1');

    expect(primera.status).toBe(204);
    expect(segunda.status).toBe(204);
  });

  it('acepta el id más grande que admite la base', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(NETFLIX);

    const res = await pedirConSesion('put', '/api/plataformas/propias/2147483647');

    expect(res.status).toBe(204);
    expect(plataformaRepository.obtenerActivaPorId).toHaveBeenCalledWith(2147483647);
  });

  it('responde 404 si la plataforma no existe o no está activa', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(null);

    const res = await pedirConSesion('put', '/api/plataformas/propias/99');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
  });

  it('responde 500 si falla la búsqueda de la plataforma', async () => {
    plataformaRepository.obtenerActivaPorId.mockRejectedValue(errorDeBase());

    const res = await pedirConSesion('put', '/api/plataformas/propias/1');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
  });

  it('responde 500 si falla el guardado', async () => {
    plataformaRepository.obtenerActivaPorId.mockResolvedValue(NETFLIX);
    usuarioPlataformaRepository.agregar.mockRejectedValue(errorDeBase());

    const res = await pedirConSesion('put', '/api/plataformas/propias/1');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
  });
});

describe('DELETE /api/plataformas/propias/:plataformaId', () => {
  it('quita la plataforma del usuario de la sesión', async () => {
    const res = await pedirConSesion('delete', '/api/plataformas/propias/1');

    expect(res.status).toBe(204);
    expect(usuarioPlataformaRepository.quitar).toHaveBeenCalledWith(USUARIO.id, 1);
  });

  it('responde 204 aunque el usuario no tuviera la plataforma', async () => {
    usuarioPlataformaRepository.quitar.mockResolvedValue(undefined);

    const res = await pedirConSesion('delete', '/api/plataformas/propias/42');

    expect(res.status).toBe(204);
  });

  it('responde 500 si falla la base', async () => {
    usuarioPlataformaRepository.quitar.mockRejectedValue(errorDeBase());

    const res = await pedirConSesion('delete', '/api/plataformas/propias/1');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
  });
});

describe('id de plataforma inválido', () => {
  it.each([
    ['put', 'abc'],
    ['put', '-1'],
    ['put', '2147483648'],
    ['put', '99999999999'],
    ['put', '1e3'],
    ['delete', '0x10'],
    ['delete', '1.5'],
    ['delete', '1.0'],
    ['delete', '0'],
    ['delete', '01'],
    ['delete', '%207%20'],
  ])('%s con %s responde 400', async (metodo, plataformaId) => {
    const res = await pedirConSesion(metodo, `/api/plataformas/propias/${plataformaId}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(res.body.error.details[0].field).toBe('plataformaId');
    expect(plataformaRepository.obtenerActivaPorId).not.toHaveBeenCalled();
    expect(usuarioPlataformaRepository.agregar).not.toHaveBeenCalled();
    expect(usuarioPlataformaRepository.quitar).not.toHaveBeenCalled();
  });
});
