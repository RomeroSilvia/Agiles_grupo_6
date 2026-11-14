import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import evidenciaCinemark from '../../../../docs/evidencia/cinemark-2026-11-14.json';
import {
  CIUDAD_CINE_FIXTURE,
  FUENTE_CINE_FIXTURE,
  FUNCIONES_FIXTURE,
  CINES_FIXTURE,
} from '@buscador/shared/testing';
import {
  combinarFuncionesCine,
  consolidarSesionesButaca,
  corresponderCarteleraButaca,
  normalizarObservacionesCine,
  resolverFechaSerpApi,
  resolverHoraSerpApi,
} from './funcionCine.normalizer.js';

const lugares = [
  {
    clave: 'centro-1',
    ciudadId: CIUDAD_CINE_FIXTURE.id,
    nombre: 'Cine Central',
    direccion: 'Calle 1 123',
    evidencia: 'Municipio y dirección comprobados en fixture',
    fuentes: [
      { fuenteId: 'serpapi', registroId: null, nombre: 'Cine Central', direccion: 'Calle 1 123' },
    ],
  },
];
const correspondencias = [
  {
    fuenteId: 'serpapi',
    registroId: 'kg:77',
    nombre: 'Película de prueba',
    tmdbId: 77,
    evidencia: 'Identidad revisada en fixture',
  },
];
const observacion = {
  fuenteId: 'serpapi',
  registroId: null,
  peliculaRegistroId: 'kg:77',
  peliculaNombre: 'Película de prueba',
  cineRegistroId: null,
  cineNombre: 'Cine Central',
  direccion: 'Calle 1 123',
  fechaLocal: '2026-11-15',
  horaLocal: '00:30',
  sala: null,
  formato: '2D',
  idioma: null,
  subtitulos: null,
};
const normalizar = (observaciones, cambios = {}) =>
  normalizarObservacionesCine({
    observaciones,
    ciudad: CIUDAD_CINE_FIXTURE,
    tmdbId: 77,
    desde: '2026-11-14',
    hasta: '2026-11-21',
    fuente: FUENTE_CINE_FIXTURE,
    lugares,
    correspondencias,
    ...cambios,
  });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
});
afterEach(() => vi.useRealTimers());

describe('consolidación de sesiones Cinemark', () => {
  const muestra = evidenciaCinemark.muestras[1].funciones;

  it('consolida la sesión real 106515 y conserva sus formatos sin depender del orden', () => {
    const resultado = consolidarSesionesButaca(muestra);
    expect(resultado.incompleta).toBe(false);
    expect(resultado.horarios).toHaveLength(1);
    expect(resultado.horarios[0]).toMatchObject({
      sessionId: '106515',
      theaterId: '105',
      theaterRoom: '3',
      sessionDateTime: '2026-11-14T16:30:00.000Z',
      sessionFormat: '2D / DBOX 2D',
    });
    expect(consolidarSesionesButaca([...muestra].reverse())).toEqual(resultado);
    expect(consolidarSesionesButaca([...muestra, ...muestra])).toEqual(resultado);
  });

  it.each([
    { sessionId: 'otra-sesion', theaterRoom: '4' },
    { theaterId: '106' },
    { corporateId: 'otra-pelicula' },
  ])('conserva sesiones nativas distintas: %j', (cambios) => {
    const resultado = consolidarSesionesButaca([muestra[0], { ...muestra[0], ...cambios }]);
    expect(resultado.horarios).toHaveLength(2);
    expect(resultado.incompleta).toBe(false);
  });

  it.each([
    { theaterRoom: '4' },
    { sessionDateTime: '2026-11-14T17:30:00.000Z' },
    { language: { shortName: 'SUB', name: 'Subtitulada' } },
  ])('descarta una sesión contradictoria y conserva las otras: %j', (cambios) => {
    const otra = { ...muestra[0], sessionId: 'otra-sesion' };
    expect(consolidarSesionesButaca([muestra[0], { ...muestra[0], ...cambios }, otra])).toEqual({
      horarios: [otra],
      incompleta: true,
    });
  });
});

describe('correspondencia automática de películas Cinemark', () => {
  const pelicula = {
    tmdbId: 77,
    identidadCine: {
      nombres: ['Título original', 'Película de prueba'],
      anio: 2026,
      duracion: 115,
    },
  };
  const candidata = {
    corporateId: 'corp-77',
    title: 'PELÍCULA DE PRUEBA',
    openingDate: '2026-11-12T00:00:00.000Z',
    runTime: 115,
  };
  it('vincula un título o alias único con año y duración coincidentes', () => {
    expect(corresponderCarteleraButaca([candidata], pelicula)).toEqual([
      expect.objectContaining({ fuenteId: 'butaca', registroId: 'corp-77', tmdbId: 77 }),
    ]);
  });
  it.each([
    { openingDate: '1998-11-12T00:00:00.000Z' },
    { runTime: 90 },
    { runTime: null },
    { title: 'Otra película' },
  ])('rechaza homónimos y datos insuficientes: %j', (cambio) => {
    expect(corresponderCarteleraButaca([{ ...candidata, ...cambio }], pelicula)).toEqual([]);
  });
  it('rechaza dos identidades nativas compatibles y metadata TMDB ausente', () => {
    expect(
      corresponderCarteleraButaca([candidata, { ...candidata, corporateId: 'otro' }], pelicula),
    ).toEqual([]);
    expect(corresponderCarteleraButaca([candidata], { tmdbId: 77 })).toEqual([]);
  });
});
describe('normalización de funciones', () => {
  it('descarta destinos inseguros sin perder el horario ni hacer otra consulta', () => {
    const resultado = normalizar(
      [{ ...observacion, urlCompra: 'https://www.google.com/search?q=entradas' }],
      { lugares: [{ ...lugares[0], urlSitio: 'javascript:alert(1)' }] },
    );
    expect(resultado.funciones).toHaveLength(1);
    expect(resultado.funciones[0].urlCompra).toBeNull();
    expect(resultado.cines[0].urlSitio).toBeNull();
    expect(
      resultado.diagnostico.filter((item) => item.code === 'INVALID_DESTINATION'),
    ).toHaveLength(2);
    expect(JSON.stringify(resultado.diagnostico)).not.toContain('javascript:');
  });
  it('no duplica una observación secundaria que podría corresponder a varias salas', () => {
    const fuenteButaca = { ...FUENTE_CINE_FIXTURE, fuenteId: 'butaca' };
    const primarias = ['1', '2'].map((sala) => ({
      ...FUNCIONES_FIXTURE[0],
      id: `funcion:${sala.repeat(64)}`,
      sala,
      fuentes: [fuenteButaca],
    }));
    const secundaria = { ...FUNCIONES_FIXTURE[0], id: `funcion:${'f'.repeat(64)}`, sala: null };
    const resultado = combinarFuncionesCine([
      { cines: CINES_FIXTURE, funciones: primarias, fuentes: [fuenteButaca], advertencias: [] },
      {
        cines: CINES_FIXTURE,
        funciones: [secundaria],
        fuentes: [FUENTE_CINE_FIXTURE],
        advertencias: [],
      },
    ]);
    expect(resultado.funciones).toHaveLength(2);
    expect(resultado.advertencias[0].code).toBe('INCOMPLETE_DATA');
  });
  it('mantiene fecha local de madrugada y genera IDs estables sin usar la descarga', () => {
    const primera = normalizar([observacion]);
    const segunda = normalizar([observacion], {
      fuente: { ...FUENTE_CINE_FIXTURE, consultadoEn: '2026-11-14T13:00:00Z' },
    });
    expect(primera.funciones[0]).toMatchObject({
      fechaLocal: '2026-11-15',
      horaLocal: '00:30',
      inicio: '2026-11-15T00:30:00-03:00',
      urlCompra: null,
    });
    expect(primera.funciones[0].id).toBe(segunda.funciones[0].id);
  });
  it('descarta identidad sin prueba, otro municipio y horas imposibles como incompletitud', () => {
    for (const cambios of [
      { peliculaNombre: 'Otra película' },
      { direccion: 'Otra sucursal' },
      { horaLocal: '25:30' },
      { fechaLocal: '2026-02-30' },
    ]) {
      const resultado = normalizar([{ ...observacion, ...cambios }]);
      expect(resultado.funciones).toEqual([]);
      expect(resultado.estadoFuente).toBe('incompleta');
    }
  });
  it('resuelve fechas relativas, contradicciones y cambio de año sin inventar un año', () => {
    expect(
      resolverFechaSerpApi({ day: 'Tomorrow', date: 'Jan 1' }, '2026-12-31', '2027-01-07'),
    ).toBe('2027-01-01');
    expect(
      resolverFechaSerpApi({ day: 'Today', date: 'Jan 1' }, '2026-12-31', '2027-01-07'),
    ).toBeNull();
    expect(resolverFechaSerpApi({ day: 'jueves' }, '2026-12-31', '2027-01-07')).toBeNull();
    expect(resolverHoraSerpApi('12:30am')).toBe('00:30');
    expect(resolverHoraSerpApi('7:15pm')).toBe('19:15');
    expect(resolverHoraSerpApi('13:15pm')).toBeNull();
  });
  it('deduplica observaciones y conserva fuentes sin fusionar salas distintas', () => {
    const primaria = { ...FUNCIONES_FIXTURE[0], sala: '1' };
    const otraSala = { ...primaria, id: `funcion:${'a'.repeat(64)}`, sala: '2' };
    const respuesta = {
      cines: CINES_FIXTURE,
      funciones: [primaria, otraSala],
      fuentes: [FUENTE_CINE_FIXTURE],
      advertencias: [],
    };
    const resultado = combinarFuncionesCine([respuesta, structuredClone(respuesta)]);
    expect(resultado.funciones).toHaveLength(2);
    expect(resultado.cines).toHaveLength(2);
  });
  it('prioriza Butaca sin mezclar campos conflictivos y conserva procedencia', () => {
    const primaria = {
      ...FUNCIONES_FIXTURE[0],
      sala: '1',
      idioma: 'SUB',
      fuentes: [{ ...FUENTE_CINE_FIXTURE, fuenteId: 'butaca', registroId: 's1' }],
    };
    const secundaria = {
      ...primaria,
      id: `funcion:${'b'.repeat(64)}`,
      idioma: 'CAST',
      fuentes: [FUENTE_CINE_FIXTURE],
    };
    const respuesta = (funciones) => ({
      cines: CINES_FIXTURE,
      funciones,
      fuentes: funciones[0].fuentes,
      advertencias: [],
    });
    const resultado = combinarFuncionesCine([respuesta([secundaria]), respuesta([primaria])]);
    expect(resultado.funciones).toHaveLength(1);
    expect(resultado.funciones[0].idioma).toBe('SUB');
    expect(resultado.funciones[0].fuentes).toHaveLength(2);
    expect(resultado.advertencias[0].code).toBe('CONFLICTING_DATA');
  });
});
