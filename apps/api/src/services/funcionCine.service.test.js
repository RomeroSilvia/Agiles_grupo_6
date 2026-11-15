import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CIUDAD_CINE_FIXTURE, FUENTE_CINE_FIXTURE } from '@buscador/shared/testing';
import * as ciudades from './ciudadCine.service.js';
import * as butacaService from './butaca.service.js';
import * as butaca from '../integrations/butaca.integration.js';
import * as tmdb from '../integrations/tmdb.integration.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
import { FUNCIONES_CINE_CONFIG } from '../config/funcionesCine.config.js';
import { obtenerFuncionesPelicula } from './funcionCine.service.js';
vi.mock('./ciudadCine.service.js', () => ({ obtenerCiudadCine: vi.fn() }));
vi.mock('./butaca.service.js', () => ({ obtenerObservacionesButaca: vi.fn() }));
vi.mock('../integrations/butaca.integration.js', () => ({ estaHabilitadoButaca: vi.fn() }));
vi.mock('../integrations/tmdb.integration.js', () => ({ obtenerDetalle: vi.fn() }));
vi.mock('../config/funcionesCine.config.js', async (importOriginal) => {
  const original = await importOriginal();
  const { CIUDAD_CINE_FIXTURE } = await import('@buscador/shared/testing');
  return {
    ...original,
    LUGARES_CINE: [
      {
        clave: 'centro',
        ciudadId: CIUDAD_CINE_FIXTURE.id,
        nombre: 'Cine de prueba',
        direccion: 'Calle 123',
        evidencia: 'Municipio verificado en fixture',
        fuentes: [{ fuenteId: 'butaca', registroId: '1' }],
      },
    ],
  };
});
const params = { tmdbId: 77, ciudadId: CIUDAD_CINE_FIXTURE.id };
const ciudad = { ...CIUDAD_CINE_FIXTURE, butacaCines: [{ id: 1, slug: 'centro' }] };
function crearObservaciones(cambios = {}) {
  return {
    ciudad,
    tmdbId: 77,
    desde: '2026-11-14',
    hasta: '2026-11-21',
    fuente: { ...FUENTE_CINE_FIXTURE, fuenteId: 'butaca', nombre: 'Butaca / Cinemark' },
    correspondencias: [
      {
        fuenteId: 'butaca',
        registroId: 'corp-77',
        nombre: 'Película de prueba',
        tmdbId: 77,
        evidencia: 'Identidad verificada en fixture',
      },
    ],
    estructuraPresente: true,
    observaciones: [
      {
        fuenteId: 'butaca',
        registroId: 's1',
        peliculaRegistroId: 'corp-77',
        peliculaNombre: 'Película de prueba',
        cineRegistroId: '1',
        fechaLocal: '2026-11-15',
        horaLocal: '21:00',
      },
    ],
    ...cambios,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
  ciudades.obtenerCiudadCine.mockReturnValue(ciudad);
  tmdb.obtenerDetalle.mockResolvedValue({ tmdbId: 77 });
  butaca.estaHabilitadoButaca.mockReturnValue(true);
  butacaService.obtenerObservacionesButaca.mockResolvedValue(crearObservaciones());
});
afterEach(() => vi.useRealTimers());
describe('servicio de funciones de cine', () => {
  it('normaliza observaciones y conserva procedencia, horario local y horizonte configurado', async () => {
    const resultado = await obtenerFuncionesPelicula(params);
    expect(resultado.estado).toBe('disponible');
    expect(resultado.funciones[0]).toMatchObject({
      inicio: '2026-11-15T21:00:00-03:00',
      fuentes: [expect.objectContaining({ nombre: 'Butaca / Cinemark' })],
    });
    expect(resultado.hasta).toBe('2026-11-21');
    expect(resultado.consultadoEn).toBe(FUENTE_CINE_FIXTURE.consultadoEn);
  });
  it('distingue falta de cobertura y no consulta Cinemark', async () => {
    ciudades.obtenerCiudadCine.mockReturnValue({
      ...ciudad,
      cobertura: 'sin_cobertura',
      butacaCines: [],
    });
    expect((await obtenerFuncionesPelicula(params)).estado).toBe('sin_cobertura');
    expect(butacaService.obtenerObservacionesButaca).not.toHaveBeenCalled();
  });
  it('distingue vacío confirmado de una respuesta incompleta sin horarios', async () => {
    butacaService.obtenerObservacionesButaca.mockResolvedValue(
      crearObservaciones({ observaciones: [] }),
    );
    expect((await obtenerFuncionesPelicula(params)).estado).toBe('sin_funciones');
    butacaService.obtenerObservacionesButaca.mockResolvedValue(
      crearObservaciones({ observaciones: [], estructuraPresente: false }),
    );
    const incompleta = await obtenerFuncionesPelicula(params);
    expect(incompleta.estado).toBe('incompleta');
    expect(incompleta.advertencias).toContainEqual(
      expect.objectContaining({ code: 'INCOMPLETE_DATA' }),
    );
  });
  it('no consulta una fuente deshabilitada y propaga errores externos e internos', async () => {
    butaca.estaHabilitadoButaca.mockReturnValue(false);
    await expect(obtenerFuncionesPelicula(params)).rejects.toBeInstanceOf(ExternalServiceError);
    expect(butacaService.obtenerObservacionesButaca).not.toHaveBeenCalled();
    butaca.estaHabilitadoButaca.mockReturnValue(true);
    butacaService.obtenerObservacionesButaca.mockRejectedValue(
      new ExternalServiceError('Cinemark'),
    );
    await expect(obtenerFuncionesPelicula(params)).rejects.toBeInstanceOf(ExternalServiceError);
    butacaService.obtenerObservacionesButaca.mockRejectedValue(new Error('Configuración inválida'));
    await expect(obtenerFuncionesPelicula(params)).rejects.toThrow('Configuración inválida');
  });
  it('propaga una película inexistente antes de consultar horarios', async () => {
    tmdb.obtenerDetalle.mockRejectedValue(new NotFoundError('Película inexistente'));
    await expect(obtenerFuncionesPelicula(params)).rejects.toBeInstanceOf(NotFoundError);
    expect(butacaService.obtenerObservacionesButaca).not.toHaveBeenCalled();
  });
  it('limita resultados con una advertencia que usa el máximo configurado', async () => {
    const raw = crearObservaciones();
    raw.observaciones = Array.from({ length: FUNCIONES_CINE_CONFIG.MAX_FUNCIONES + 1 }, (_, i) => ({
      ...raw.observaciones[0],
      registroId: String(i),
      sala: String(i),
    }));
    butacaService.obtenerObservacionesButaca.mockResolvedValue(raw);
    const resultado = await obtenerFuncionesPelicula(params);
    expect(resultado.funciones).toHaveLength(FUNCIONES_CINE_CONFIG.MAX_FUNCIONES);
    expect(resultado.estado).toBe('incompleta');
    expect(resultado.advertencias[0].message).toContain(
      FUNCIONES_CINE_CONFIG.MAX_FUNCIONES.toLocaleString('es-AR'),
    );
  });
});
