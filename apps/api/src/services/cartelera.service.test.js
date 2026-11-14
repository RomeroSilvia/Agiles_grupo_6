import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TIPO_TITULO } from '@buscador/shared/constants';
import { ExternalServiceError } from '../errors/index.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as carteleraService from './cartelera.service.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  listarPeliculasEnCartelera: vi.fn(),
  obtenerFechaEstrenoArgentina: vi.fn(),
}));

const consultadoEn = '2026-11-13T23:00:00.000Z';
const pelicula = {
  tmdbId: 77,
  tipo: TIPO_TITULO.PELICULA,
  nombre: 'Película de prueba',
  posterUrl: null,
  anio: 2026,
  puntuacion: 7.5,
};

beforeEach(() => {
  vi.clearAllMocks();
  tmdbIntegration.listarPeliculasEnCartelera.mockResolvedValue({
    resultados: [pelicula, { ...pelicula }, { ...pelicula, tmdbId: 78 }],
    pagina: 1,
    totalResultados: 3,
    totalPaginas: 1,
    consultadoEn,
  });
  tmdbIntegration.obtenerFechaEstrenoArgentina.mockResolvedValue({
    fechaEstrenoAr: '2026-06-08',
    consultadoEn,
  });
});

describe('cartelera.service', () => {
  it('deduplica películas de una página y consulta la fecha una sola vez por tmdbId', async () => {
    const respuesta = await carteleraService.listarPeliculasEnCartelera({ pagina: 1 });

    expect(respuesta.resultados.map(({ tmdbId }) => tmdbId)).toEqual([77, 78]);
    expect(respuesta.totalResultados).toBe(3);
    expect(tmdbIntegration.obtenerFechaEstrenoArgentina).toHaveBeenCalledTimes(2);
    expect(tmdbIntegration.obtenerFechaEstrenoArgentina).toHaveBeenNthCalledWith(1, { tmdbId: 77 });
    expect(tmdbIntegration.obtenerFechaEstrenoArgentina).toHaveBeenNthCalledWith(2, { tmdbId: 78 });
  });

  it('propaga el error de fechas sin devolver resultados parciales', async () => {
    const error = new ExternalServiceError('TMDB', new Error('falló la consulta de fechas'));
    tmdbIntegration.obtenerFechaEstrenoArgentina.mockRejectedValueOnce(error);

    await expect(carteleraService.listarPeliculasEnCartelera({ pagina: 1 })).rejects.toBe(error);
  });
});
