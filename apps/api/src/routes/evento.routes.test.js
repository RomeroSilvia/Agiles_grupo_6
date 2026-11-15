import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as allEventsIntegration from '../integrations/allEvents.integration.js';
import { EVENTOS_CONFIG } from '../config/eventos.config.js';
import { fromAllEvents } from '../models/evento.model.js';
import { ExternalServiceError } from '../errors/index.js';

vi.mock('../integrations/allEvents.integration.js', () => ({ listarEventosAllEvents: vi.fn() }));
let minuto = 0;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.parse('2026-11-14T12:00:00Z') + ++minuto * 60_000);
  vi.clearAllMocks();
  allEventsIntegration.listarEventosAllEvents.mockResolvedValue({
    eventos: [
      fromAllEvents({
        id: '1',
        name: 'Festival local',
        url: 'https://allevents.in/la-plata/festival/1',
        start: null,
      }),
    ],
    siguientePagina: null,
    incompleta: false,
    consultadoEn: '2026-11-14T12:00:00Z',
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('GET /api/eventos', () => {
  it('publica eventos sin sesión y devuelve el contrato de La Plata', async () => {
    const response = await request(createApp()).get('/api/eventos');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      ciudad: 'La Plata',
      resultados: [expect.objectContaining({ nombre: 'Festival local' })],
    });
    expect(allEventsIntegration.listarEventosAllEvents).toHaveBeenCalledWith({
      categoria: 'todas',
      fecha: 'todas',
      pagina: 1,
    });
  });
  it('publica la siguiente página normalizada y permite continuar la consulta', async () => {
    const primera = await allEventsIntegration.listarEventosAllEvents();
    allEventsIntegration.listarEventosAllEvents.mockClear();
    allEventsIntegration.listarEventosAllEvents
      .mockResolvedValueOnce({ ...primera, siguientePagina: 2 })
      .mockResolvedValueOnce({ ...primera, eventos: [] });
    const app = createApp();
    const response = await request(app).get('/api/eventos');
    expect(response.body.data).toMatchObject({ siguientePagina: 2, incompleta: false });
    const siguiente = await request(app)
      .get('/api/eventos')
      .query({ pagina: response.body.data.siguientePagina });
    expect(siguiente.status).toBe(200);
    expect(siguiente.body.data).toMatchObject({ pagina: 2, siguientePagina: null });
    expect(allEventsIntegration.listarEventosAllEvents).toHaveBeenLastCalledWith({
      categoria: 'todas',
      fecha: 'todas',
      pagina: 2,
    });
  });
  it.each([
    { ciudad: 'Rosario' },
    { pagina: 0 },
    { pagina: 6 },
    { categoria: 'inexistente' },
    { categoria: 'musica', fecha: 'hoy' },
  ])('rechaza consultas inválidas antes de llamar a AllEvents: %j', async (query) => {
    const response = await request(createApp()).get('/api/eventos').query(query);
    expect(response.status).toBe(400);
    expect(allEventsIntegration.listarEventosAllEvents).not.toHaveBeenCalled();
  });
  it('informa un error si el proveedor no está disponible', async () => {
    allEventsIntegration.listarEventosAllEvents.mockRejectedValue(
      new ExternalServiceError('AllEvents'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(createApp()).get('/api/eventos');
    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EXTERNAL_SERVICE');
  });
});

it('responde 429 sin llegar a AllEvents y permite consultar al vencer la ventana', async () => {
  const app = createApp();
  for (let i = 0; i < EVENTOS_CONFIG.RATE_LIMIT.maxRequests; i += 1) {
    expect((await request(app).get('/api/eventos')).status).toBe(200);
  }
  const response = await request(app).get('/api/eventos');
  expect(response.status).toBe(429);
  expect(response.body.error.code).toBe('RATE_LIMITED');
  expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  expect(allEventsIntegration.listarEventosAllEvents).toHaveBeenCalledTimes(
    EVENTOS_CONFIG.RATE_LIMIT.maxRequests,
  );
  vi.setSystemTime(Date.now() + EVENTOS_CONFIG.RATE_LIMIT.windowMs);
  expect((await request(app).get('/api/eventos')).status).toBe(200);
});
