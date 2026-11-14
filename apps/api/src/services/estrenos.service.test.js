import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as tmdb from '../integrations/tmdb.integration.js';
import { listarProximosEstrenos } from './cartelera.service.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  listarCandidatosEstrenos: vi.fn(),
  obtenerFechasEstrenoArgentina: vi.fn(),
  obtenerAnioEstrenoOriginal: vi.fn(),
}));
const pelicula = (tmdbId) => ({
  tmdbId,
  tipo: 'pelicula',
  nombre: `Obra ${tmdbId}`,
  posterUrl: null,
  anio: 2026,
  puntuacion: null,
});
const consultadoEn = '2026-11-14T12:00:00.000Z';
beforeEach(() => {
  vi.clearAllMocks();
  tmdb.obtenerAnioEstrenoOriginal.mockResolvedValue(1999);
  tmdb.obtenerFechasEstrenoArgentina.mockImplementation(async ({ tmdbId }) => ({
    fechas: [tmdbId % 2 ? '2027-01-03' : '2027-01-02'],
    consultadoEn,
  }));
});
describe('próximos estrenos', () => {
  it('deduplica, ordena globalmente antes de paginar y comparte la adquisición', async () => {
    tmdb.listarCandidatosEstrenos.mockImplementation(async ({ pagina }) => ({
      pagina,
      totalPaginas: 2,
      resultados: Array.from({ length: 12 }, (_, i) => pelicula((pagina - 1) * 12 + i + 1)),
    }));
    const consulta = { desde: '2027-01-01', hasta: '2027-01-30' };
    const primera = await listarProximosEstrenos({ ...consulta, pagina: 1 });
    const segunda = await listarProximosEstrenos({ ...consulta, pagina: 2 });
    expect(primera.totalResultados).toBe(24);
    expect(primera.resultados.slice(0, 3).map((p) => p.tmdbId)).toEqual([2, 4, 6]);
    expect(segunda.resultados.map((p) => p.tmdbId)).toEqual([17, 19, 21, 23]);
    expect(primera.resultados[0].anio).toBe(1999);
    expect(tmdb.listarCandidatosEstrenos).toHaveBeenCalledTimes(4);
    expect(tmdb.obtenerFechasEstrenoArgentina).toHaveBeenCalledTimes(24);
    expect((await listarProximosEstrenos({ ...consulta, pagina: 50 })).resultados).toEqual([]);
  });
  it('excluye fechas mundiales, pendientes no acreditados y fechas fuera del período', async () => {
    tmdb.listarCandidatosEstrenos.mockResolvedValue({
      pagina: 1,
      totalPaginas: 1,
      resultados: [pelicula(90)],
    });
    tmdb.obtenerFechasEstrenoArgentina.mockResolvedValue({ fechas: [], consultadoEn });
    expect(
      (await listarProximosEstrenos({ desde: '2027-02-01', hasta: '2027-02-20', pagina: 1 }))
        .totalResultados,
    ).toBe(0);
  });
  it('rechaza el presupuesto excedido y no publica un subconjunto', async () => {
    tmdb.listarCandidatosEstrenos.mockResolvedValue({
      pagina: 1,
      totalPaginas: 11,
      resultados: [pelicula(1)],
    });
    await expect(
      listarProximosEstrenos({ desde: '2027-03-01', hasta: '2027-03-20', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
    expect(tmdb.obtenerFechasEstrenoArgentina).not.toHaveBeenCalled();
  });
  it('propaga una falla intermedia y permite reintentar sin cachear el error', async () => {
    tmdb.listarCandidatosEstrenos.mockRejectedValueOnce(new Error('falló fuente'));
    const consulta = { desde: '2027-04-01', hasta: '2027-04-20', pagina: 1 };
    await expect(listarProximosEstrenos(consulta)).rejects.toThrow('falló fuente');
    tmdb.listarCandidatosEstrenos.mockResolvedValue({ pagina: 1, totalPaginas: 0, resultados: [] });
    expect((await listarProximosEstrenos(consulta)).resultados).toEqual([]);
  });
});
