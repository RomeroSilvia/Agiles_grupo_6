import { describe, expect, it } from 'vitest';
import { ciudadCineConfiguracionSchema } from './ciudadCine.model.js';
import { DIRECTORIO_CIUDADES_CINE } from '../config/ciudadesCine.config.js';
const ciudad = DIRECTORIO_CIUDADES_CINE.ciudades.find((item) => item.butacaCines.length);
describe('configuración interna de ciudades de cine', () => {
  it('valida los mapeos sin duplicar su procedencia', () => {
    expect(ciudadCineConfiguracionSchema.parse(ciudad)).toEqual(ciudad);
  });
  it.each([
    { butacaCines: [] },
    { butacaCines: [{ id: 1, slug: '' }] },
    { fuente: { ...ciudad.fuente, fuenteId: 'otra' } },
  ])('rechaza cobertura sin mapeo o con procedencia incompatible: %j', (cambios) => {
    expect(ciudadCineConfiguracionSchema.safeParse({ ...ciudad, ...cambios }).success).toBe(false);
  });
});
