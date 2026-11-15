import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as allEventsIntegration from '../integrations/allEvents.integration.js';
import { listarEventos } from './evento.service.js';
import { respuestaAllEventsSchema, fromAllEvents } from '../models/evento.model.js';

vi.mock('../integrations/allEvents.integration.js', () => ({ listarEventosAllEvents: vi.fn() }));
const evento = {
  id: '1',
  name: 'Teatro en La Plata',
  url: 'https://allevents.in/la-plata/teatro/1',
  start: null,
  date_label: 'Wed, 25 Nov • 08:00 PM',
  venue: { name: 'Teatro de prueba' },
  price: 'Free',
};
const params = { categoria: 'todas', fecha: 'todas', pagina: 1 };
function simularEventos(events, siguientePagina = null) {
  allEventsIntegration.listarEventosAllEvents.mockResolvedValue({
    eventos: events.map(fromAllEvents),
    siguientePagina,
    incompleta: false,
    consultadoEn: '2026-11-14T12:00:00Z',
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
});
afterEach(() => vi.useRealTimers());

describe('eventos presenciales de La Plata', () => {
  it('conserva la siguiente página normalizada por la integración', async () => {
    simularEventos([evento], 2);
    expect(await listarEventos(params)).toMatchObject({ siguientePagina: 2, incompleta: false });
  });
  it('conserva fechas textuales sin inventar año u horario y elimina duplicados', async () => {
    simularEventos([evento, evento]);
    const data = await listarEventos(params);
    expect(data.resultados).toHaveLength(1);
    expect(data.resultados[0]).toMatchObject({
      nombre: evento.name,
      fecha: null,
      inicio: null,
      fechaTexto: evento.date_label,
      precioTexto: 'Gratis',
      imagenUrl: null,
    });
    expect(data).toMatchObject({ ciudad: 'La Plata', siguientePagina: null, incompleta: false });
  });
  it('excluye publicaciones virtuales, canceladas, pasadas o de otra localidad', async () => {
    simularEventos([
      { ...evento, online: true },
      { ...evento, status: 'EventCancelled' },
      { ...evento, start: '2026-11-13' },
      { ...evento, venue: { city: 'Buenos Aires' } },
      { ...evento, venue: { city: 'La Plata', country: 'US' } },
    ]);
    expect((await listarEventos(params)).resultados).toEqual([]);
  });
  it('compara fechas en La Plata y conserva eventos de varios días aún vigentes', async () => {
    vi.setSystemTime('2026-11-15T01:00:00Z');
    simularEventos([
      { ...evento, start: '2026-11-14' },
      { ...evento, id: '2', start: '2026-11-10', end: '2026-11-16' },
    ]);
    expect((await listarEventos(params)).resultados).toHaveLength(2);
  });
  it('descarta enlaces inválidos y avisa cuando se alcanza el límite de páginas', async () => {
    simularEventos([{ ...evento, url: 'https://sitio.example/fiesta' }], 21);
    expect(await listarEventos(params)).toMatchObject({
      resultados: [],
      incompleta: true,
      siguientePagina: null,
    });
  });
  it('preserva los eventos válidos si otra publicación tiene una estructura inválida', () => {
    expect(
      respuestaAllEventsSchema.parse({
        city: 'la-plata',
        page: 1,
        next_page: null,
        events: [evento, { id: '2' }],
      }),
    ).toMatchObject({ eventos: [fromAllEvents(evento)], incompleta: true });
  });
});
