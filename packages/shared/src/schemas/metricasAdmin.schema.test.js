import { describe, expect, it } from 'vitest';
import { PERIODO_METRICAS, PERIODOS_METRICAS } from '../constants/index.js';
import { metricasAdminSchema } from './metricasAdmin.schema.js';

describe('metricasAdminSchema', () => {
  it('sin período pide los últimos 30 días', () => {
    expect(metricasAdminSchema.parse({})).toEqual({ periodo: PERIODO_METRICAS.TREINTA_DIAS });
  });

  it('acepta todos los períodos', () => {
    for (const periodo of PERIODOS_METRICAS) {
      expect(metricasAdminSchema.parse({ periodo })).toEqual({ periodo });
    }
  });

  it('rechaza períodos desconocidos y claves extra', () => {
    for (const query of [{ periodo: '90d' }, { periodo: '' }, { orden: 'cantidad' }]) {
      expect(metricasAdminSchema.safeParse(query).success).toBe(false);
    }
  });
});
