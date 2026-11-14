import { describe, expect, it } from 'vitest';
import { ciudadCineConfiguracionSchema } from './ciudadCine.model.js';

const ciudadConfigurada = {
  id: 'ar:550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Córdoba',
  provincia: 'Córdoba',
  pais: 'AR',
  zonaHoraria: 'America/Argentina/Cordoba',
  cobertura: 'disponible',
  fuente: {
    fuenteId: 'serpapi',
    registroId: 'cordoba',
    url: null,
    consultadoEn: '2026-11-13T10:00:00.000Z',
    actualizadoEn: null,
  },
  serpApiLocation: 'Córdoba,Argentina',
  butacaCines: [],
  evidenciaPorFuente: {
    serpApi: {
      evidencia: 'Coincidencia validada para el municipio y la provincia',
      registroId: 'cordoba',
      url: null,
      consultadoEn: '2026-11-13T10:00:00.000Z',
      actualizadoEn: null,
    },
    butaca: null,
  },
};

describe('configuración interna de ciudades de cine', () => {
  it('rechaza un complemento sin evidencia aunque la fuente primaria sea válida', () => {
    expect(
      ciudadCineConfiguracionSchema.safeParse({
        ...ciudadConfigurada,
        butacaCines: [{ id: 1, slug: 'centro' }],
      }).success,
    ).toBe(false);
  });
  it('valida los mapeos internos y la evidencia de una ciudad', () => {
    expect(ciudadCineConfiguracionSchema.parse(ciudadConfigurada)).toEqual(ciudadConfigurada);
  });

  it('rechaza cobertura declarada sin evidencia o sin mapeo de proveedor', () => {
    expect(
      ciudadCineConfiguracionSchema.safeParse({
        ...ciudadConfigurada,
        evidenciaPorFuente: { serpApi: null, butaca: null },
      }).success,
    ).toBe(false);
    expect(
      ciudadCineConfiguracionSchema.safeParse({
        ...ciudadConfigurada,
        serpApiLocation: null,
      }).success,
    ).toBe(false);
  });

  it('valida identificadores de complejos de Butaca por separado de sus slugs', () => {
    expect(
      ciudadCineConfiguracionSchema.safeParse({
        ...ciudadConfigurada,
        fuente: {
          ...ciudadConfigurada.fuente,
          fuenteId: 'butaca',
          registroId: 'cinemark-1',
          url: 'https://butaca.com.ar/cines/cinemark-centro',
        },
        serpApiLocation: null,
        butacaCines: [{ id: 1, slug: 'cinemark-centro' }],
        evidenciaPorFuente: {
          serpApi: null,
          butaca: {
            evidencia: 'Complejo verificado en la ciudad',
            registroId: 'cinemark-1',
            url: 'https://butaca.com.ar/cines/cinemark-centro',
            consultadoEn: '2026-11-13T10:00:00.000Z',
            actualizadoEn: null,
          },
        },
      }).success,
    ).toBe(true);
  });
});
