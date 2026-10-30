import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as deepLinkService from './deepLink.service.js';
import * as tituloService from './titulo.service.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  obtenerDetalle: vi.fn(),
  obtenerOfertas: vi.fn(),
}));

vi.mock('../repositories/plataforma.repository.js', () => ({
  listarActivas: vi.fn(),
}));

vi.mock('./deepLink.service.js', () => ({
  agregarDeepLinks: vi.fn(),
}));

const plataformasActivas = [
  {
    id: 1,
    tmdbProviderId: 8,
    nombre: 'Netflix',
    logoPath: '/netflix.jpg',
    urlHome: 'https://www.netflix.com',
  },
  {
    id: 3,
    tmdbProviderId: 337,
    nombre: 'Disney Plus',
    logoPath: '/disney.jpg',
    urlHome: 'https://www.disneyplus.com',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  plataformaRepository.listarActivas.mockResolvedValue(plataformasActivas);
  deepLinkService.agregarDeepLinks.mockImplementation(async ({ ofertas }) =>
    ofertas.map(({ tipoOferta, plataformas }) => ({
      tipoOferta,
      plataformas: plataformas.map((plataforma) => ({ ...plataforma, deepLink: null })),
    })),
  );
});

describe('tituloService.compararDisponibilidad', () => {
  it('devuelve las ofertas confirmadas para varias regiones en una sola consulta a TMDB', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      US: {
        enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
        ofertas: [{ tmdbProviderId: 337, tipoOferta: 'suscripcion', logoPath: '/disney.jpg' }],
      },
      ES: {
        enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
        ofertas: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: '/netflix.jpg' }],
      },
    });

    const resultado = await tituloService.compararDisponibilidad({
      tipo: 'pelicula',
      tmdbId: 1,
      regiones: ['US', 'ES'],
    });

    expect(tmdbIntegration.obtenerOfertas).toHaveBeenCalledTimes(1);
    expect(deepLinkService.agregarDeepLinks).toHaveBeenCalledTimes(2);
    expect(resultado).toEqual({
      regiones: [
        {
          region: 'US',
          enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
          ofertas: [
            {
              tipoOferta: 'suscripcion',
              plataformas: [
                expect.objectContaining({ id: 3, nombre: 'Disney Plus', deepLink: null }),
              ],
            },
          ],
        },
        {
          region: 'ES',
          enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
          ofertas: [
            {
              tipoOferta: 'suscripcion',
              plataformas: [expect.objectContaining({ id: 1, nombre: 'Netflix', deepLink: null })],
            },
          ],
        },
      ],
      regionesFallidas: [],
    });
  });

  it('devuelve cero ofertas cuando el título no está disponible en las regiones consultadas', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({});

    const resultado = await tituloService.compararDisponibilidad({
      tipo: 'pelicula',
      tmdbId: 1,
      regiones: ['BR', 'CL'],
    });

    expect(resultado).toEqual({
      regiones: [
        { region: 'BR', ofertas: [], enlaceTmdb: null },
        { region: 'CL', ofertas: [], enlaceTmdb: null },
      ],
      regionesFallidas: [],
    });
  });

  it('conserva los resultados confirmados e identifica la región cuando falla agregarDeepLinks para una región', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      US: {
        enlaceTmdb: null,
        ofertas: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: '/netflix.jpg' }],
      },
      BR: {
        enlaceTmdb: null,
        ofertas: [{ tmdbProviderId: 337, tipoOferta: 'suscripcion', logoPath: '/disney.jpg' }],
      },
    });
    deepLinkService.agregarDeepLinks.mockImplementation(async ({ region, ofertas }) => {
      if (region === 'BR') {
        throw new DatabaseError(new Error('Fallo al consultar deep links en BR'));
      }
      return ofertas.map(({ tipoOferta, plataformas }) => ({
        tipoOferta,
        plataformas: plataformas.map((plataforma) => ({ ...plataforma, deepLink: null })),
      }));
    });

    const resultado = await tituloService.compararDisponibilidad({
      tipo: 'pelicula',
      tmdbId: 1,
      regiones: ['US', 'BR'],
    });

    expect(resultado.regiones).toEqual([
      {
        region: 'US',
        enlaceTmdb: null,
        ofertas: [
          {
            tipoOferta: 'suscripcion',
            plataformas: [expect.objectContaining({ id: 1, nombre: 'Netflix', deepLink: null })],
          },
        ],
      },
    ]);
    expect(resultado.regionesFallidas).toEqual(['BR']);
  });

  it('lanza ExternalServiceError si fallan todas las regiones solicitadas', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({});
    deepLinkService.agregarDeepLinks.mockRejectedValue(
      new DatabaseError(new Error('Fallo al resolver deep links')),
    );

    await expect(
      tituloService.compararDisponibilidad({
        tipo: 'pelicula',
        tmdbId: 1,
        regiones: ['US', 'BR'],
      }),
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
