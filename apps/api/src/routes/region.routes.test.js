import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.config.js';
import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as geoipIntegration from '../integrations/geoip.integration.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as perfilRepository from '../repositories/perfil.repository.js';
import { USUARIO } from '../test/fixtures.js';

vi.mock('../integrations/geoip.integration.js');
vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/perfil.repository.js');

const COOKIE_SESION = 'access_token=access-de-prueba';

function pedirRegionConSesion() {
  return request(createApp()).get('/api/region').set('Cookie', COOKIE_SESION);
}

beforeEach(() => {
  vi.resetAllMocks();
  geoipIntegration.getRegionByIp.mockResolvedValue('UY');
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
  perfilRepository.obtenerRegion.mockResolvedValue(null);
  perfilRepository.actualizarRegion.mockResolvedValue('UY');
});

afterEach(() => vi.restoreAllMocks());

describe('GET /api/region', () => {
  it('detecta el país por IP sin consultar Supabase para visitantes', async () => {
    const res = await request(createApp()).get('/api/region').set('X-Forwarded-For', '8.8.8.8');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { region: 'UY', source: 'ip' } });
    expect(geoipIntegration.getRegionByIp).toHaveBeenCalledTimes(1);
    expect(geoipIntegration.getRegionByIp).not.toHaveBeenCalledWith('8.8.8.8');
    expect(perfilRepository.obtenerRegion).not.toHaveBeenCalled();
    expect(perfilRepository.actualizarRegion).not.toHaveBeenCalled();
  });

  it('usa X-Forwarded-For cuando la IP del proxy está declarada como confiable', async () => {
    const app = createApp();
    app.set('trust proxy', '127.0.0.1/8, ::1/128');

    const res = await request(app).get('/api/region').set('X-Forwarded-For', '8.8.8.8');

    expect(res.status).toBe(200);
    expect(geoipIntegration.getRegionByIp).toHaveBeenCalledWith('8.8.8.8');
  });

  it('usa la región de la IP con sesión aunque el perfil tenga otra y la guarda', async () => {
    perfilRepository.obtenerRegion.mockResolvedValue('AR');
    geoipIntegration.getRegionByIp.mockResolvedValue('US');

    const res = await pedirRegionConSesion();

    expect(res.body).toEqual({ data: { region: 'US', source: 'ip' } });
    expect(perfilRepository.actualizarRegion).toHaveBeenCalledWith(USUARIO.id, 'US');
    expect(perfilRepository.obtenerRegion).not.toHaveBeenCalled();
  });

  it('usa la región del perfil con sesión si no puede detectar la IP', async () => {
    geoipIntegration.getRegionByIp.mockResolvedValue(null);
    perfilRepository.obtenerRegion.mockResolvedValue('BR');

    const res = await pedirRegionConSesion();

    expect(res.body).toEqual({ data: { region: 'BR', source: 'profile' } });
    expect(perfilRepository.obtenerRegion).toHaveBeenCalledWith(USUARIO.id);
    expect(perfilRepository.actualizarRegion).not.toHaveBeenCalled();
  });

  it('usa la región predeterminada con sesión si no puede detectar la IP y el perfil está vacío', async () => {
    geoipIntegration.getRegionByIp.mockResolvedValue(null);

    const res = await pedirRegionConSesion();

    expect(res.body).toEqual({ data: { region: env.DEFAULT_REGION, source: 'default' } });
  });

  it('identifica el fallback configurado cuando falla la detección', async () => {
    const error = new ExternalServiceError('la ubicación por IP', new Error('sin conexión'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    geoipIntegration.getRegionByIp.mockRejectedValue(error);

    const res = await request(createApp()).get('/api/region');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { region: env.DEFAULT_REGION, source: 'default' } });
    expect(perfilRepository.actualizarRegion).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('No se pudo detectar la región por IP', error);
  });

  it('usa la región predeterminada y registra un warning si no puede leer el perfil', async () => {
    const error = new DatabaseError(new Error('base no disponible'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    geoipIntegration.getRegionByIp.mockResolvedValue(null);
    perfilRepository.obtenerRegion.mockRejectedValueOnce(error);

    const res = await pedirRegionConSesion();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { region: env.DEFAULT_REGION, source: 'default' } });
    expect(warn).toHaveBeenCalledWith('No se pudo consultar la región del perfil', error);
  });

  it('conserva la región detectada y registra un warning si no puede guardarla', async () => {
    const error = new DatabaseError(new Error('base no disponible'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    perfilRepository.actualizarRegion.mockRejectedValueOnce(error);

    const res = await pedirRegionConSesion();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { region: 'UY', source: 'ip' } });
    expect(warn).toHaveBeenCalledWith('No se pudo guardar la región del perfil', error);
  });

  it('no hace detección en una ruta que no requiere región', async () => {
    await request(createApp()).get('/api/health');
    expect(geoipIntegration.getRegionByIp).not.toHaveBeenCalled();
  });
});
