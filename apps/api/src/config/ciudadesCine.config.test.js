import { describe, expect, it } from 'vitest';
import { DIRECTORIO_CIUDADES_CINE } from './ciudadesCine.config.js';
import { listarCiudadesCine, obtenerCiudadCine } from '../services/ciudadCine.service.js';
import { ciudadCineConfiguracionSchema } from '../models/ciudadCine.model.js';

describe('directorio inicial de ciudades consultables', () => {
  it('publica cuatro ciudades y habilita las ocho sucursales verificadas de CABA y Córdoba', () => {
    const { ciudades } = listarCiudadesCine();
    expect(ciudades.map((ciudad) => ciudad.nombre).sort()).toEqual(
      ['CABA', 'Córdoba', 'La Plata', 'Mar del Plata'].sort(),
    );
    expect(new Set(ciudades.map((ciudad) => ciudad.id)).size).toBe(4);
    for (const ciudad of ciudades) {
      const configuracion = obtenerCiudadCine(ciudad.id);
      const verificada = ['CABA', 'Córdoba'].includes(ciudad.nombre);
      expect(ciudad.cobertura).toBe(verificada ? 'disponible' : 'sin_verificar');
      expect(ciudadCineConfiguracionSchema.safeParse(configuracion).success).toBe(true);
      expect(configuracion.serpApiLocation).toContain('Argentina');
      expect(configuracion.butacaCines).toHaveLength(
        ciudad.nombre === 'CABA' ? 6 : ciudad.nombre === 'Córdoba' ? 2 : 0,
      );
      if (verificada) expect(ciudad.fuente.fuenteId).toBe('butaca');
      expect(ciudad).not.toHaveProperty('serpApiLocation');
    }
  });
  it('rechaza una ciudad por verificar si pierde el mapeo consultable', () => {
    expect(
      ciudadCineConfiguracionSchema.safeParse({
        ...DIRECTORIO_CIUDADES_CINE.ciudades[0],
        serpApiLocation: null,
      }).success,
    ).toBe(false);
  });
});
