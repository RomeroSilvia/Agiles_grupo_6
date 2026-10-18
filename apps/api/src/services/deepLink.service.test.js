import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as streamingAvailabilityIntegration from '../integrations/streamingAvailability.integration.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as disponibilidadRepository from '../repositories/disponibilidad.repository.js';
import * as fuenteDatosRepository from '../repositories/fuenteDatos.repository.js';
import * as tituloRepository from '../repositories/titulo.repository.js';
import { agregarDeepLinks } from './deepLink.service.js';

vi.mock('../integrations/streamingAvailability.integration.js', () => ({
  obtenerDeepLinks: vi.fn(),
}));
vi.mock('../integrations/tmdb.integration.js', () => ({ obtenerDetalle: vi.fn() }));
vi.mock('../repositories/disponibilidad.repository.js', () => ({
  listarPorTituloYRegion: vi.fn(),
  guardarDeepLinks: vi.fn(),
}));
vi.mock('../repositories/fuenteDatos.repository.js', () => ({ obtenerIdPorNombre: vi.fn() }));
vi.mock('../repositories/titulo.repository.js', () => ({
  obtenerPorTmdbIdYTipo: vi.fn(),
  guardarDesdeTmdb: vi.fn(),
}));

const NETFLIX = {
  id: 1,
  tmdbProviderId: 8,
  nombre: 'Netflix',
  logoPath: null,
  urlHome: 'https://www.netflix.com',
};
const PRIME = {
  id: 2,
  tmdbProviderId: 119,
  nombre: 'Amazon Prime Video',
  logoPath: null,
  urlHome: 'https://www.primevideo.com',
};
const SIN_SERVICIO = {
  id: 9,
  tmdbProviderId: 999,
  nombre: 'Plataforma local',
  logoPath: null,
  urlHome: null,
};

const ENLACE_NETFLIX = 'https://www.netflix.com/title/80100172';
const ENLACE_PRIME = 'https://www.primevideo.com/detail/0ABC';

const OFERTAS = [{ tipoOferta: 'suscripcion', plataformas: [NETFLIX, PRIME] }];

const TITULO_GUARDADO = { id: 10, tmdbId: 1, tipo: 'pelicula', nombre: 'Dune' };

function guardados(...filas) {
  tituloRepository.obtenerPorTmdbIdYTipo.mockResolvedValue(TITULO_GUARDADO);
  disponibilidadRepository.listarPorTituloYRegion.mockResolvedValue(
    filas.map(([plataformaId, deepLink, verificadaEn = new Date()]) => ({
      plataformaId,
      tipoOferta: 'suscripcion',
      deepLink,
      verificadaEn,
    })),
  );
}

// La caché en memoria es por título y región: cada test usa un título distinto.
let siguienteTmdbId = 1000;
function consulta(ofertas = OFERTAS) {
  return { tipo: 'pelicula', tmdbId: siguienteTmdbId++, region: 'AR', ofertas };
}

function deepLinksDe(resultado) {
  return Object.fromEntries(
    resultado.flatMap(({ tipoOferta, plataformas }) =>
      plataformas.map(({ nombre, deepLink }) => [`${nombre}:${tipoOferta}`, deepLink]),
    ),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  tituloRepository.obtenerPorTmdbIdYTipo.mockResolvedValue(null);
  tituloRepository.guardarDesdeTmdb.mockResolvedValue(TITULO_GUARDADO);
  disponibilidadRepository.listarPorTituloYRegion.mockResolvedValue([]);
  disponibilidadRepository.guardarDeepLinks.mockResolvedValue();
  fuenteDatosRepository.obtenerIdPorNombre.mockResolvedValue(2);
  tmdbIntegration.obtenerDetalle.mockResolvedValue({ tmdbId: 1, tipo: 'pelicula', nombre: 'Dune' });
  streamingAvailabilityIntegration.obtenerDeepLinks.mockResolvedValue([
    { servicio: 'netflix', tipoOferta: 'suscripcion', deepLink: ENLACE_NETFLIX },
    { servicio: 'prime', tipoOferta: 'suscripcion', deepLink: ENLACE_PRIME },
  ]);
});

describe('agregarDeepLinks', () => {
  it('asigna a cada plataforma solo su propio deep link (escenarios 1 y 2)', async () => {
    const resultado = await agregarDeepLinks(consulta());

    expect(resultado).toEqual([
      {
        tipoOferta: 'suscripcion',
        plataformas: [
          { ...NETFLIX, deepLink: ENLACE_NETFLIX },
          { ...PRIME, deepLink: ENLACE_PRIME },
        ],
      },
    ]);
  });

  it('guarda los deep links consultados en disponibilidad', async () => {
    const parametros = consulta();

    await agregarDeepLinks(parametros);

    expect(tituloRepository.guardarDesdeTmdb).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Dune' }),
    );
    expect(disponibilidadRepository.guardarDeepLinks).toHaveBeenCalledWith([
      expect.objectContaining({
        tituloId: 10,
        plataformaId: 1,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: ENLACE_NETFLIX,
        fuenteId: 2,
      }),
      expect.objectContaining({ plataformaId: 2, deepLink: ENLACE_PRIME }),
    ]);
  });

  it('usa los deep links guardados y vigentes sin consultar Streaming Availability', async () => {
    guardados([1, ENLACE_NETFLIX], [2, null]);

    const resultado = await agregarDeepLinks(consulta());

    expect(disponibilidadRepository.listarPorTituloYRegion).toHaveBeenCalledWith(10, 'AR');
    expect(streamingAvailabilityIntegration.obtenerDeepLinks).not.toHaveBeenCalled();
    expect(disponibilidadRepository.guardarDeepLinks).not.toHaveBeenCalled();
    expect(deepLinksDe(resultado)).toEqual({
      'Netflix:suscripcion': ENLACE_NETFLIX,
      'Amazon Prime Video:suscripcion': null,
    });
  });

  it('descarta un deep link guardado que no es http(s) o no es del dominio de la plataforma', async () => {
    guardados([1, 'javascript:alert(1)'], [2, 'https://primevideo.com.phishing.io/1']);

    const resultado = await agregarDeepLinks(consulta());

    expect(streamingAvailabilityIntegration.obtenerDeepLinks).not.toHaveBeenCalled();
    expect(deepLinksDe(resultado)).toEqual({
      'Netflix:suscripcion': null,
      'Amazon Prime Video:suscripcion': null,
    });
  });

  it('vuelve a consultar si un deep link guardado está vencido', async () => {
    guardados([1, null, new Date(0)], [2, null]);

    const resultado = await agregarDeepLinks(consulta());

    expect(streamingAvailabilityIntegration.obtenerDeepLinks).toHaveBeenCalledTimes(1);
    expect(deepLinksDe(resultado)['Netflix:suscripcion']).toBe(ENLACE_NETFLIX);
  });

  it('reutiliza en memoria la consulta del mismo título y región', async () => {
    const parametros = consulta();

    await agregarDeepLinks(parametros);
    await agregarDeepLinks(parametros);

    expect(streamingAvailabilityIntegration.obtenerDeepLinks).toHaveBeenCalledTimes(1);
  });

  it('prefiere el enlace del mismo tipo de oferta y si no hay usa otro del mismo servicio', async () => {
    const enlaceAlquiler = 'https://www.netflix.com/title/alquiler';
    streamingAvailabilityIntegration.obtenerDeepLinks.mockResolvedValue([
      { servicio: 'netflix', tipoOferta: 'alquiler', deepLink: enlaceAlquiler },
      { servicio: 'netflix', tipoOferta: 'suscripcion', deepLink: ENLACE_NETFLIX },
      { servicio: 'prime', tipoOferta: 'alquiler', deepLink: ENLACE_PRIME },
    ]);

    const resultado = await agregarDeepLinks(consulta());

    expect(deepLinksDe(resultado)).toEqual({
      'Netflix:suscripcion': ENLACE_NETFLIX,
      'Amazon Prime Video:suscripcion': ENLACE_PRIME,
    });
  });

  it('descarta un deep link que no pertenece al dominio de la plataforma', async () => {
    streamingAvailabilityIntegration.obtenerDeepLinks.mockResolvedValue([
      {
        servicio: 'netflix',
        tipoOferta: 'suscripcion',
        deepLink: 'https://netflix.com.phishing.io/1',
      },
    ]);

    const resultado = await agregarDeepLinks(consulta());

    expect(deepLinksDe(resultado)['Netflix:suscripcion']).toBeNull();
  });

  it('devuelve deep links en null y no guarda nada si Streaming Availability falla (escenario 4)', async () => {
    streamingAvailabilityIntegration.obtenerDeepLinks.mockRejectedValue(
      new ExternalServiceError('Streaming Availability', new Error('HTTP 429')),
    );

    const resultado = await agregarDeepLinks(consulta());

    expect(deepLinksDe(resultado)).toEqual({
      'Netflix:suscripcion': null,
      'Amazon Prime Video:suscripcion': null,
    });
    expect(disponibilidadRepository.guardarDeepLinks).not.toHaveBeenCalled();
  });

  it('devuelve igual los deep links si falla el guardado', async () => {
    disponibilidadRepository.guardarDeepLinks.mockRejectedValue(new DatabaseError());

    const resultado = await agregarDeepLinks(consulta());

    expect(deepLinksDe(resultado)['Netflix:suscripcion']).toBe(ENLACE_NETFLIX);
  });

  it('no guarda si falta la fuente de datos', async () => {
    fuenteDatosRepository.obtenerIdPorNombre.mockResolvedValue(null);

    const resultado = await agregarDeepLinks(consulta());

    expect(disponibilidadRepository.guardarDeepLinks).not.toHaveBeenCalled();
    expect(deepLinksDe(resultado)['Netflix:suscripcion']).toBe(ENLACE_NETFLIX);
  });

  it('no consulta nada si ninguna plataforma tiene servicio en Streaming Availability', async () => {
    const resultado = await agregarDeepLinks(
      consulta([{ tipoOferta: 'suscripcion', plataformas: [SIN_SERVICIO] }]),
    );

    expect(tituloRepository.obtenerPorTmdbIdYTipo).not.toHaveBeenCalled();
    expect(streamingAvailabilityIntegration.obtenerDeepLinks).not.toHaveBeenCalled();
    expect(resultado[0].plataformas[0].deepLink).toBeNull();
  });

  it('propaga el error si falla la lectura de la base', async () => {
    tituloRepository.obtenerPorTmdbIdYTipo.mockRejectedValue(new DatabaseError());

    await expect(agregarDeepLinks(consulta())).rejects.toBeInstanceOf(DatabaseError);
  });
});
