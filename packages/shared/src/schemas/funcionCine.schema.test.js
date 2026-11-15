import { describe, expect, it } from 'vitest';
import {
  crearRespuestaFuncionesFixture,
  FUNCIONES_FIXTURE,
} from '../testing/funcionCine.fixture.js';
import {
  respuestaFuncionesCineSchema,
  funcionCineSchema,
  consultaFuncionesCineSchema,
} from './funcionCine.schema.js';

describe('contrato de funciones de cine', () => {
  it('acepta el contrato compartido con madrugada local y metadatos nulos', () => {
    expect(respuestaFuncionesCineSchema.safeParse(crearRespuestaFuncionesFixture()).success).toBe(
      true,
    );
  });
  it('rechaza un horario interpretado en UTC, IDs inconsistentes y duplicados', () => {
    expect(
      respuestaFuncionesCineSchema.safeParse(
        crearRespuestaFuncionesFixture({ desde: 'no-es-fecha' }),
      ).success,
    ).toBe(false);
    expect(
      funcionCineSchema.safeParse({ ...FUNCIONES_FIXTURE[0], inicio: '2026-11-15T00:30:00+00:00' })
        .success,
    ).toBe(false);
    const respuesta = crearRespuestaFuncionesFixture();
    respuesta.funciones[0].tmdbId = 99;
    expect(respuestaFuncionesCineSchema.safeParse(respuesta).success).toBe(false);
    expect(
      respuestaFuncionesCineSchema.safeParse(
        crearRespuestaFuncionesFixture({ funciones: [FUNCIONES_FIXTURE[0], FUNCIONES_FIXTURE[0]] }),
      ).success,
    ).toBe(false);
  });
  it('rechaza país, fecha, cine y arrays como parámetros públicos', () => {
    for (const consulta of [
      { ciudadId: 'AR' },
      { ciudadId: ['ar:550e8400-e29b-41d4-a716-446655440000'] },
      { ciudadId: 'ar:550e8400-e29b-41d4-a716-446655440000', fecha: '2026-11-15' },
    ])
      expect(consultaFuncionesCineSchema.safeParse(consulta).success).toBe(false);
  });
});
