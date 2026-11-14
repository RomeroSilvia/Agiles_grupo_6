import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ key: 'clave-privada-ficticia' }));
vi.mock('../config/env.config.js', () => ({
  env: {
    get ALLEVENTS_API_KEY() {
      return config.key;
    },
  },
}));
vi.mock('../config/eventos.config.js', async (importOriginal) => ({
  EVENTOS_CONFIG: { ...(await importOriginal()).EVENTOS_CONFIG, MAX_REQUESTS_PER_DAY: 2 },
}));
const respuesta = {
  city: 'la-plata',
  page: 1,
  next_page: null,
  events: [],
  fetched_at: '2026-11-14T12:00:00Z',
};
beforeEach(() => {
  vi.resetModules();
  config.key = 'clave-privada-ficticia';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('integración AllEvents mediante API.SH', () => {
  it('fija La Plata, envía la clave solo en el header y comparte consultas de la caché', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => respuesta });
    vi.stubGlobal('fetch', fetchMock);
    const { listarEventosAllEvents } = await import('./allEvents.integration.js');
    const params = { categoria: 'all', fecha: 'todas', pagina: 1 };
    const resultados = await Promise.all([
      listarEventosAllEvents(params),
      listarEventosAllEvents(params),
    ]);
    await listarEventosAllEvents(params);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.origin + url.pathname).toBe('https://api.api.sh/allevents/v1/events');
    expect(Object.fromEntries(url.searchParams)).toEqual({ city: 'la-plata', page: '1', raw: '0' });
    expect(options.headers['x-api-key']).toBe(config.key);
    expect(JSON.stringify(resultados)).not.toContain(config.key);
  });
  it('traduce los períodos y conserva las categorías como consultas separadas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => respuesta });
    vi.stubGlobal('fetch', fetchMock);
    const { listarEventosAllEvents } = await import('./allEvents.integration.js');
    await listarEventosAllEvents({ categoria: 'all', fecha: 'fin_de_semana', pagina: 1 });
    await listarEventosAllEvents({ categoria: 'theatre', fecha: 'todas', pagina: 1 });
    expect(fetchMock.mock.calls[0][0].searchParams.get('date')).toBe('weekend');
    expect(fetchMock.mock.calls[0][0].searchParams.has('category')).toBe(false);
    expect(fetchMock.mock.calls[1][0].searchParams.get('category')).toBe('theatre');
    expect(fetchMock.mock.calls[1][0].searchParams.has('date')).toBe(false);
  });
  it('no hace solicitudes sin clave', async () => {
    config.key = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { listarEventosAllEvents } = await import('./allEvents.integration.js');
    await expect(
      listarEventosAllEvents({ categoria: 'all', fecha: 'todas', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('propaga fallos de autenticación sin publicar el contenido del proveedor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { listarEventosAllEvents } = await import('./allEvents.integration.js');
    await expect(
      listarEventosAllEvents({ categoria: 'all', fecha: 'todas', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
  it.each([
    { ...respuesta, city: 'la-plata-us' },
    { ...respuesta, next_page: 1 },
    { ...respuesta, events: undefined },
  ])('rechaza ciudad, estructura o paginación inválidas', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    const { listarEventosAllEvents } = await import('./allEvents.integration.js');
    await expect(
      listarEventosAllEvents({ categoria: 'all', fecha: 'todas', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
  it('detiene nuevas consultas al agotar el presupuesto y lo renueva al día siguiente', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => respuesta });
    vi.stubGlobal('fetch', fetchMock);
    const { listarEventosAllEvents } = await import('./allEvents.integration.js');
    const params = { fecha: 'todas', pagina: 1 };
    await listarEventosAllEvents({ ...params, categoria: 'music' });
    await listarEventosAllEvents({ ...params, categoria: 'art' });
    await expect(listarEventosAllEvents({ ...params, categoria: 'theatre' })).rejects.toMatchObject(
      { code: 'EXTERNAL_SERVICE' },
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.setSystemTime('2026-11-15T12:00:00Z');
    await listarEventosAllEvents({ ...params, categoria: 'theatre' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
