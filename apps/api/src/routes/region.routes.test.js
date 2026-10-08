import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as geoipIntegration from '../integrations/geoip.integration.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as perfilRepository from '../repositories/perfil.repository.js';
import { USUARIO } from '../test/fixtures.js';

vi.mock('../integrations/geoip.integration.js');
vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/perfil.repository.js');

beforeEach(() => {
  vi.resetAllMocks();
  geoipIntegration.getRegionByIp.mockResolvedValue('UY');
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
  perfilRepository.obtenerRegion.mockResolvedValue(null);
  perfilRepository.guardarRegionSiVacia.mockResolvedValue('UY');
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
  });

  it('usa X-Forwarded-For cuando la IP del proxy está declarada como confiable', async () => {
    const app = createApp();
    app.set('trust proxy', '127.0.0.1/8, ::1/128');

    const res = await request(app).get('/api/region').set('X-Forwarded-For', '8.8.8.8');

    expect(res.status).toBe(200);
    expect(geoipIntegration.getRegionByIp).toHaveBeenCalledWith('8.8.8.8');
  });

  it('reutiliza la región guardada sin repetir la detección', async () => {
    perfilRepository.obtenerRegion.mockResolvedValue('BR');

    const res = await request(createApp())
      .get('/api/region')
      .set('Cookie', 'access_token=access-de-prueba');

    expect(res.body).toEqual({ data: { region: 'BR', source: 'profile' } });
    expect(perfilRepository.obtenerRegion).toHaveBeenCalledWith(USUARIO.id);
    expect(geoipIntegration.getRegionByIp).not.toHaveBeenCalled();
    expect(perfilRepository.guardarRegionSiVacia).not.toHaveBeenCalled();
  });

  it('guarda la región detectada en un perfil que aún no la tiene', async () => {
    const res = await request(createApp())
      .get('/api/region')
      .set('Cookie', 'access_token=access-de-prueba');

    expect(res.body).toEqual({ data: { region: 'UY', source: 'ip' } });
    expect(perfilRepository.guardarRegionSiVacia).toHaveBeenCalledWith(USUARIO.id, 'UY');
  });

  it('usa la región de la IP si el usuario todavía no tiene un perfil', async () => {
    perfilRepository.guardarRegionSiVacia.mockResolvedValue(null);

    const res = await request(createApp())
      .get('/api/region')
      .set('Cookie', 'access_token=access-de-prueba');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { region: 'UY', source: 'ip' } });
    expect(perfilRepository.obtenerRegion).toHaveBeenCalledTimes(2);
    expect(perfilRepository.guardarRegionSiVacia).toHaveBeenCalledWith(USUARIO.id, 'UY');
  });

  it('usa la región que guardó otra solicitud si hubo una carrera', async () => {
    perfilRepository.guardarRegionSiVacia.mockResolvedValue(null);
    perfilRepository.obtenerRegion.mockResolvedValueOnce(null).mockResolvedValueOnce('BR');

    const res = await request(createApp())
      .get('/api/region')
      .set('Cookie', 'access_token=access-de-prueba');

    expect(res.body).toEqual({ data: { region: 'BR', source: 'profile' } });
  });

  it('identifica el fallback configurado cuando falla la detección', async () => {
    const error = new ExternalServiceError('la ubicación por IP', new Error('sin conexión'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    geoipIntegration.getRegionByIp.mockRejectedValue(error);

    const res = await request(createApp()).get('/api/region');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { region: env.DEFAULT_REGION, source: 'default' } });
    expect(perfilRepository.guardarRegionSiVacia).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('No se pudo detectar la región por IP', error);
  });

  it('no hace detección en una ruta que no requiere región', async () => {
    await request(createApp()).get('/api/health');
    expect(geoipIntegration.getRegionByIp).not.toHaveBeenCalled();
  });
});
