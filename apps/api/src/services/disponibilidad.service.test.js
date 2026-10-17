import { beforeEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({ env: { STREAMING_AVAILABILITY_API_KEY: 'clave-prueba' } }));

vi.mock('../config/env.config.js', () => envMock);
vi.mock('../integrations/streamingAvailability.integration.js', () => ({
  obtenerOfertas: vi.fn(),
}));
vi.mock('../repositories/disponibilidad.repository.js', () => ({
  listarPorTituloYRegion: vi.fn(),
  guardarOfertas: vi.fn(),
  actualizarVerificacion: vi.fn(),
}));
vi.mock('../repositories/fuenteDatos.repository.js', () => ({
  obtenerIdPorNombre: vi.fn(),
}));
vi.mock('../repositories/plataforma.repository.js', () => ({
  listarActivas: vi.fn(),
}));
vi.mock('../repositories/sincronizacion.repository.js', () => ({
  iniciar: vi.fn(),
  contarTitulosProcesadosEntre: vi.fn(),
  finalizar: vi.fn(),
}));
vi.mock('../repositories/watchlist.repository.js', () => ({
  listarTitulosConAvisosActivos: vi.fn(),
}));

import * as streamingAvailabilityIntegration from '../integrations/streamingAvailability.integration.js';
import * as disponibilidadRepository from '../repositories/disponibilidad.repository.js';
import * as fuenteDatosRepository from '../repositories/fuenteDatos.repository.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as sincronizacionRepository from '../repositories/sincronizacion.repository.js';
import * as watchlistRepository from '../repositories/watchlist.repository.js';
import { STREAMING_AVAILABILITY_CONFIG } from '../config/streamingAvailability.config.js';
import { sincronizarDisponibilidad } from './disponibilidad.service.js';

const AHORA = new Date('2026-10-17T06:00:00.000Z');
const COMBINACION = { tituloId: 42, tmdbId: 1, tipo: 'pelicula', region: 'AR' };
const PLATAFORMAS = [
  { id: 10, tmdbProviderId: 8 },
  { id: 11, tmdbProviderId: 119 },
  { id: 12, tmdbProviderId: 337 },
];

beforeEach(() => {
  vi.resetAllMocks();
  envMock.env.STREAMING_AVAILABILITY_API_KEY = 'clave-prueba';
  sincronizacionRepository.iniciar.mockResolvedValue({ id: 1 });
  sincronizacionRepository.contarTitulosProcesadosEntre.mockResolvedValue(0);
  watchlistRepository.listarTitulosConAvisosActivos.mockResolvedValue([COMBINACION]);
  plataformaRepository.listarActivas.mockResolvedValue(PLATAFORMAS);
  fuenteDatosRepository.obtenerIdPorNombre.mockResolvedValue(3);
  streamingAvailabilityIntegration.obtenerOfertas.mockResolvedValue([]);
  disponibilidadRepository.listarPorTituloYRegion.mockResolvedValue([]);
  disponibilidadRepository.guardarOfertas.mockResolvedValue(undefined);
  disponibilidadRepository.actualizarVerificacion.mockResolvedValue(undefined);
  sincronizacionRepository.finalizar.mockResolvedValue(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sincronizarDisponibilidad', () => {
  it('registra una ejecución vacía sin consultar servicios externos', async () => {
    watchlistRepository.listarTitulosConAvisosActivos.mockResolvedValue([]);

    await expect(sincronizarDisponibilidad({ ahora: AHORA })).resolves.toEqual({
      sincronizacionId: 1,
      combinacionesProcesadas: 0,
      combinacionesPendientes: 0,
      errores: [],
    });

    expect(streamingAvailabilityIntegration.obtenerOfertas).not.toHaveBeenCalled();
    expect(plataformaRepository.listarActivas).not.toHaveBeenCalled();
    expect(sincronizacionRepository.finalizar).toHaveBeenCalledWith(1, {
      finalizadaEn: AHORA.toISOString(),
      titulosProcesados: 0,
      error: null,
    });
  });

  it('consulta una sola vez cada título y región y conserva las altas vigentes', async () => {
    watchlistRepository.listarTitulosConAvisosActivos.mockResolvedValue([
      COMBINACION,
      { ...COMBINACION },
    ]);
    streamingAvailabilityIntegration.obtenerOfertas.mockResolvedValue([
      {
        service: { id: 'netflix' },
        type: 'subscription',
        link: 'https://www.netflix.com/title/1',
      },
      {
        service: { id: 'disney' },
        type: 'subscription',
        link: 'https://www.disneyplus.com/movies/1',
      },
    ]);
    disponibilidadRepository.listarPorTituloYRegion.mockResolvedValue([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        detectadaEn: '2026-10-01T00:00:00.000Z',
        vigente: true,
      },
      {
        tituloId: 42,
        plataformaId: 11,
        region: 'AR',
        tipoOferta: 'suscripcion',
        vigente: true,
      },
    ]);

    const resultado = await sincronizarDisponibilidad({ ahora: AHORA });

    expect(streamingAvailabilityIntegration.obtenerOfertas).toHaveBeenCalledTimes(1);
    expect(resultado.combinacionesProcesadas).toBe(1);
    expect(disponibilidadRepository.guardarOfertas).toHaveBeenCalledWith([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
        fuenteId: 3,
        detectadaEn: '2026-10-01T00:00:00.000Z',
        verificadaEn: AHORA.toISOString(),
        vigente: true,
      },
      {
        tituloId: 42,
        plataformaId: 12,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.disneyplus.com/movies/1',
        fuenteId: 3,
        detectadaEn: AHORA.toISOString(),
        verificadaEn: AHORA.toISOString(),
        vigente: true,
      },
    ]);
    expect(disponibilidadRepository.actualizarVerificacion).toHaveBeenCalledWith(
      expect.objectContaining({ plataformaId: 11, vigente: true }),
      { verificadaEn: AHORA.toISOString(), vigente: false },
    );
  });

  it('mantiene sin disponibilidad las ofertas históricas que siguen ausentes', async () => {
    disponibilidadRepository.listarPorTituloYRegion.mockResolvedValue([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        vigente: false,
      },
    ]);

    const resultado = await sincronizarDisponibilidad({ ahora: AHORA });

    expect(resultado.errores).toEqual([]);
    expect(disponibilidadRepository.guardarOfertas).not.toHaveBeenCalled();
    expect(disponibilidadRepository.actualizarVerificacion).toHaveBeenCalledWith(
      expect.objectContaining({ vigente: false }),
      { verificadaEn: AHORA.toISOString(), vigente: false },
    );
  });

  it('no modifica el snapshot si falla el proveedor y registra el error', async () => {
    streamingAvailabilityIntegration.obtenerOfertas.mockRejectedValue(
      new Error('No se pudo consultar Streaming Availability'),
    );

    const resultado = await sincronizarDisponibilidad({ ahora: AHORA });

    expect(resultado.errores).toHaveLength(1);
    expect(disponibilidadRepository.listarPorTituloYRegion).not.toHaveBeenCalled();
    expect(disponibilidadRepository.guardarOfertas).not.toHaveBeenCalled();
    expect(disponibilidadRepository.actualizarVerificacion).not.toHaveBeenCalled();
    expect(sincronizacionRepository.finalizar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        titulosProcesados: 1,
        error: expect.stringContaining('No se pudo consultar Streaming Availability'),
      }),
    );
  });

  it('respeta el tope diario y deja pendiente el resto para ejecuciones siguientes', async () => {
    let activas = 0;
    let maximoConcurrente = 0;
    streamingAvailabilityIntegration.obtenerOfertas.mockImplementation(async () => {
      activas += 1;
      maximoConcurrente = Math.max(maximoConcurrente, activas);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activas -= 1;
      return [];
    });
    watchlistRepository.listarTitulosConAvisosActivos.mockResolvedValue(
      Array.from({ length: 101 }, (_, index) => ({
        tituloId: index + 1,
        tmdbId: index + 1,
        tipo: 'pelicula',
        region: 'AR',
      })),
    );

    const resultado = await sincronizarDisponibilidad({ ahora: AHORA });

    expect(streamingAvailabilityIntegration.obtenerOfertas).toHaveBeenCalledTimes(100);
    expect(maximoConcurrente).toBe(STREAMING_AVAILABILITY_CONFIG.MAX_CONCURRENT_REQUESTS);
    expect(resultado).toMatchObject({
      combinacionesProcesadas: 100,
      combinacionesPendientes: 1,
    });
    expect(sincronizacionRepository.finalizar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ titulosProcesados: 100 }),
    );
  });

  it('descuenta las consultas ya hechas durante el día UTC', async () => {
    sincronizacionRepository.contarTitulosProcesadosEntre.mockResolvedValue(95);
    watchlistRepository.listarTitulosConAvisosActivos.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        tituloId: index + 1,
        tmdbId: index + 1,
        tipo: 'pelicula',
        region: 'AR',
      })),
    );

    const resultado = await sincronizarDisponibilidad({ ahora: AHORA });

    expect(streamingAvailabilityIntegration.obtenerOfertas).toHaveBeenCalledTimes(5);
    expect(resultado).toMatchObject({
      combinacionesProcesadas: 5,
      combinacionesPendientes: 5,
    });
  });
});
