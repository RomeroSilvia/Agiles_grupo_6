import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as allEventsIntegration from '../integrations/allEvents.integration.js';
import { ExternalServiceError } from '../errors/index.js';

vi.mock('../integrations/allEvents.integration.js', () => ({ listarEventosAllEvents: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  allEventsIntegration.listarEventosAllEvents.mockResolvedValue({
    events: [
      {
        id: '1',
        name: 'Festival local',
        url: 'https://allevents.in/la-plata/festival/1',
        start: null,
      },
    ],
    next_page: null,
    incompleta: false,
    consultadoEn: '2026-11-14T12:00:00Z',
  });
});
afterEach(() => vi.restoreAllMocks());

describe('GET /api/eventos', () => {
  it('publica eventos sin sesión y devuelve el contrato de La Plata', async () => {
    const response = await request(createApp()).get('/api/eventos');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      ciudad: 'La Plata',
      resultados: [expect.objectContaining({ nombre: 'Festival local' })],
    });
    expect(allEventsIntegration.listarEventosAllEvents).toHaveBeenCalledWith({
      categoria: 'all',
      fecha: 'todas',
      pagina: 1,
    });
  });
  it.each([
    { ciudad: 'Rosario' },
    { pagina: 0 },
    { categoria: 'inexistente' },
    { categoria: 'music', fecha: 'hoy' },
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
