import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as tmdb from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';

vi.mock('../integrations/tmdb.integration.js', () => ({ listarCandidatosEstrenos: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-15T01:30:00Z');
  tmdb.listarCandidatosEstrenos.mockResolvedValue({ pagina: 1, totalPaginas: 0, resultados: [] });
});
afterEach(() => vi.useRealTimers());
describe('GET /api/cartelera/estrenos', () => {
  it('es público y calcula mañana con la fecha argentina cerca de medianoche', async () => {
    const respuesta = await request(createApp()).get('/api/cartelera/estrenos');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toMatchObject({
      desde: '2026-11-15',
      hasta: '2027-02-12',
      resultados: [],
      totalPaginas: 0,
    });
  });
  it.each([
    'desde=2027-02-30',
    'desde=2026-11-14',
    'desde=2026-12-01&hasta=2026-11-30',
    'desde=2026-12-01&hasta=2027-04-01',
    'pagina[]=1',
    'cine=algo',
    'desde[]=2027-01-01',
  ])('rechaza consulta inválida %s', async (query) => {
    expect((await request(createApp()).get(`/api/cartelera/estrenos?${query}`)).status).toBe(400);
  });
  it('responde 502 ante falla del proveedor', async () => {
    tmdb.listarCandidatosEstrenos.mockRejectedValueOnce(new ExternalServiceError('TMDB'));
    const respuesta = await request(createApp()).get(
      '/api/cartelera/estrenos?desde=2026-12-02&hasta=2026-12-04',
    );
    expect(respuesta.status).toBe(502);
    expect(respuesta.body.error.code).toBe('EXTERNAL_SERVICE');
  });
});
