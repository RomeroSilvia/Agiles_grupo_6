import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import evidencia from '../../../../docs/evidencia/cinemark-ciudades-2026-11-14.json';
import { DIRECTORIO_CIUDADES_CINE } from '../config/ciudadesCine.config.js';
import { obtenerFuncionesButaca } from './butaca.integration.js';

vi.mock('../config/env.config.js', () => ({ env: { BUTACA_ENABLED: 'true' } }));

const ciudades = DIRECTORIO_CIUDADES_CINE.ciudades.filter(
  (ciudad) => !['CABA', 'Córdoba', 'La Plata', 'Mar del Plata'].includes(ciudad.nombre),
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('consultas Cinemark de las localidades agregadas', () => {
  it.each(ciudades)(
    'consulta únicamente las sucursales correspondientes a $nombre',
    async (ciudad) => {
      const fetchMock = vi.fn(async (url) => ({
        ok: true,
        json: async () => ({
          data: url.pathname.endsWith('/theaters')
            ? evidencia.cines.map((cine) => ({ ...cine, location: { name: cine.region } }))
            : url.pathname.endsWith('/movies')
              ? [
                  {
                    id: 'pelicula-fixture',
                    corporateId: 'corp-fixture',
                    title: 'Película de prueba',
                    openingDate: '2026-11-12T00:00:00.000Z',
                    runTime: 100,
                  },
                ]
              : [
                  {
                    sessionId: `sesion-${url.searchParams.get('theater')}`,
                    corporateId: 'corp-fixture',
                    movieName: 'Película de prueba',
                    theaterId: url.searchParams.get('theater'),
                    sessionDateTime: '2026-11-15T21:00:00.000Z',
                    sessionDisplayDate: '2026-11-15',
                    sessionFormat: '2D',
                  },
                ],
        }),
      }));
      vi.stubGlobal('fetch', fetchMock);

      const resultado = await obtenerFuncionesButaca({
        pelicula: {
          tmdbId: 77,
          identidadCine: { nombres: ['Película de prueba'], anio: 2026, duracion: 100 },
        },
        ciudad,
        desde: '2026-11-14',
        hasta: '2026-11-21',
      });

      expect(resultado.estadoFuente).toBe('disponible');
      expect(resultado.funciones).toHaveLength(ciudad.butacaCines.length);
      expect(resultado.funciones).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ciudadId: ciudad.id, inicio: '2026-11-15T21:00:00-03:00' }),
        ]),
      );
      const horarios = fetchMock.mock.calls
        .map(([url]) => url)
        .filter((url) => url.pathname.endsWith('/showtimes'));
      expect(horarios.map((url) => Number(url.searchParams.get('theater'))).sort()).toEqual(
        ciudad.butacaCines.map((cine) => cine.id).sort(),
      );
    },
  );
});
