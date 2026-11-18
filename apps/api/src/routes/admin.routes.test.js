import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  PAGINA_MAXIMA_USUARIOS,
  PERIODO_METRICAS,
  ROL_USUARIO,
  USUARIOS_POR_PAGINA,
} from '@buscador/shared/constants';
import { createApp } from '../app.js';
import { DatabaseError } from '../errors/index.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as metricasRepository from '../repositories/metricas.repository.js';
import * as perfilRepository from '../repositories/perfil.repository.js';
import * as usuarioAdminRepository from '../repositories/usuarioAdmin.repository.js';
import { USUARIO } from '../test/fixtures.js';
import { adminRoutes } from './admin.routes.js';

vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/metricas.repository.js');
vi.mock('../repositories/perfil.repository.js');
vi.mock('../repositories/usuarioAdmin.repository.js');

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

function crearUsuario(numero) {
  return {
    id: `b7d8e1c2-0000-4000-8000-${String(numero).padStart(12, '0')}`,
    email: `usuario${numero}@mail.com`,
    region: 'AR',
    plataformaIds: [1],
    titulosWatchlist: numero,
    creadoEn: '2026-10-12T15:30:00+00:00',
    estado: 'activo',
  };
}

const PRIMERA_PAGINA = Array.from({ length: USUARIOS_POR_PAGINA }, (_, i) => crearUsuario(i + 1));

function listarUsuarios(query = {}) {
  return request(createApp()).get('/api/admin/usuarios').query(query).set('Cookie', COOKIE_SESION);
}

describe('GET /api/admin/usuarios', () => {
  beforeEach(() => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.ADMINISTRADOR);
  });

  it('sin filtros devuelve la primera página con el total', async () => {
    usuarioAdminRepository.listarUsuarios.mockResolvedValue({
      total: 1284,
      usuarios: PRIMERA_PAGINA,
    });

    const res = await listarUsuarios();

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.data).toEqual({
      usuarios: PRIMERA_PAGINA,
      total: 1284,
      pagina: 1,
      totalPaginas: 129,
    });
    expect(usuarioAdminRepository.listarUsuarios).toHaveBeenCalledWith({
      limite: USUARIOS_POR_PAGINA,
      offset: 0,
    });
  });

  it('pasa mail, región, estado y página combinados', async () => {
    usuarioAdminRepository.listarUsuarios.mockResolvedValue({ total: 0, usuarios: [] });

    const res = await listarUsuarios({
      mail: 'ana',
      region: 'MX',
      estado: 'sin_confirmar',
      pagina: 2,
    });

    expect(res.status).toBe(200);
    expect(usuarioAdminRepository.listarUsuarios).toHaveBeenCalledWith({
      mail: 'ana',
      region: 'MX',
      estado: 'sin_confirmar',
      limite: USUARIOS_POR_PAGINA,
      offset: USUARIOS_POR_PAGINA,
    });
  });

  it('una página fuera de rango responde 200 con la lista vacía y el total', async () => {
    usuarioAdminRepository.listarUsuarios.mockResolvedValue({ total: 12, usuarios: [] });

    const res = await listarUsuarios({ pagina: 50 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ usuarios: [], total: 12, pagina: 50, totalPaginas: 2 });
  });

  it.each([
    ['un estado inválido', { estado: 'bloqueado' }],
    ['una región con formato inválido', { region: 'arg' }],
    ['una región no soportada', { region: 'ZZ' }],
    ['una página mayor al máximo', { pagina: PAGINA_MAXIMA_USUARIOS + 1 }],
    ['un parámetro desconocido', { orden: 'mail' }],
  ])('responde 400 con %s', async (_caso, query) => {
    const res = await listarUsuarios(query);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(usuarioAdminRepository.listarUsuarios).not.toHaveBeenCalled();
  });

  it('responde 403 a un usuario sin rol de administrador', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.USUARIO);

    const res = await listarUsuarios();

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(usuarioAdminRepository.listarUsuarios).not.toHaveBeenCalled();
  });
});

const METRICAS = {
  totales: {
    usuarios: 1284,
    usuariosNuevos: 38,
    titulosWatchlist: 6912,
    titulosWatchlistNuevos: 412,
    regionesActivas: 9,
    plataformasElegidas: 8,
  },
  rankings: {
    genero: { watchlist: [{ genero: 'comedia', cantidad: 1215 }], busquedas: [] },
    tipo: { watchlist: [{ tipo: 'pelicula', cantidad: 4030 }], busquedas: [] },
    region: { watchlist: [{ region: 'AR', cantidad: 612 }], busquedas: [] },
    plataforma: [{ plataformaId: 1, cantidad: 903 }],
    textosBuscados: [{ texto: 'friends', cantidad: 87 }],
  },
};

function obtenerMetricas(query = {}) {
  return request(createApp()).get('/api/admin/metricas').query(query).set('Cookie', COOKIE_SESION);
}

describe('GET /api/admin/metricas', () => {
  beforeEach(() => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.ADMINISTRADOR);
    metricasRepository.obtenerMetricas.mockResolvedValue(METRICAS);
  });

  it('devuelve los totales y los rankings del período pedido', async () => {
    const res = await obtenerMetricas({ periodo: PERIODO_METRICAS.SIETE_DIAS });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.data).toEqual({
      periodo: PERIODO_METRICAS.SIETE_DIAS,
      totales: METRICAS.totales,
      rankings: {
        ...METRICAS.rankings,
        genero: {
          watchlist: [{ id: 'comedia', nombre: 'Comedia', cantidad: 1215 }],
          busquedas: [],
        },
      },
    });
    expect(metricasRepository.obtenerMetricas).toHaveBeenCalledWith({
      desde: expect.any(String),
      generos: expect.any(Object),
    });
  });

  it('sin período usa los últimos 30 días', async () => {
    const res = await obtenerMetricas();

    expect(res.status).toBe(200);
    expect(res.body.data.periodo).toBe(PERIODO_METRICAS.TREINTA_DIAS);
  });

  it('con todo el período no limita la fecha', async () => {
    await obtenerMetricas({ periodo: PERIODO_METRICAS.TODO });

    expect(metricasRepository.obtenerMetricas).toHaveBeenCalledWith(
      expect.objectContaining({ desde: null }),
    );
  });

  it.each([
    ['un período inválido', { periodo: '90d' }],
    ['un parámetro desconocido', { orden: 'cantidad' }],
  ])('responde 400 con %s', async (_caso, query) => {
    const res = await obtenerMetricas(query);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(metricasRepository.obtenerMetricas).not.toHaveBeenCalled();
  });

  it('responde 403 a un usuario sin rol de administrador', async () => {
    perfilRepository.obtenerRol.mockResolvedValue(ROL_USUARIO.USUARIO);

    const res = await obtenerMetricas();

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(metricasRepository.obtenerMetricas).not.toHaveBeenCalled();
  });

  it('responde 500 si falla la consulta de las métricas', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    metricasRepository.obtenerMetricas.mockRejectedValue(new DatabaseError(new Error('caída')));

    const res = await obtenerMetricas();

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DATABASE');
    consoleError.mockRestore();
  });
});
