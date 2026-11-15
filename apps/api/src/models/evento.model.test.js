import { describe, expect, it } from 'vitest';
import { fromAllEvents, respuestaAllEventsSchema } from './evento.model.js';
const evento = {
  id: '1',
  name: 'Teatro local',
  url: 'https://allevents.in/la-plata/teatro/1',
  start: '2026-11-15',
  date_label: 'Sun, 15 Nov',
  price: 'Free',
  venue: { name: 'Teatro', street: 'Calle 1', city: 'La Plata', country: 'AR' },
};
describe('traducción de AllEvents al dominio', () => {
  it('convierte campos, fechas, precio y ubicación en el model', () => {
    expect(fromAllEvents(evento)).toMatchObject({
      id: '1',
      nombre: 'Teatro local',
      fecha: '2026-11-15',
      inicio: null,
      lugar: 'Teatro',
      direccion: 'Calle 1',
      ciudad: 'La Plata',
      pais: 'AR',
      precioTexto: 'Gratis',
    });
  });
  it('conserva publicaciones válidas y señala datos inválidos sin inventar fechas', () => {
    const data = respuestaAllEventsSchema.parse({
      city: 'la-plata',
      page: 1,
      next_page: null,
      events: [
        { ...evento, start: 'sin fecha', attendance_mode: 'OnlineEventAttendanceMode' },
        { id: '2' },
      ],
    });
    expect(data.eventos).toHaveLength(1);
    expect(data.eventos[0]).toMatchObject({ fecha: null, inicio: null, virtual: true });
    expect(data.incompleta).toBe(true);
    expect(data).not.toHaveProperty('events');
  });
});
