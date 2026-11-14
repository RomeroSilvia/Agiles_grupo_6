import { describe, expect, it } from 'vitest';
import { DIRECTORIO_CIUDADES_CINE } from './ciudadesCine.config.js';
import { listarCiudadesCine, obtenerCiudadCine } from '../services/ciudadCine.service.js';
import { ciudadCineConfiguracionSchema } from '../models/ciudadCine.model.js';
import { CINES_CINEMARK } from './cinesCinemark.config.js';
import { LUGARES_CINE } from './funcionesCine.config.js';

const SUCURSALES_POR_CIUDAD = {
  CABA: [103, 734, 111, 733, 2016, 730],
  Córdoba: [105, 106],
  Avellaneda: [2015],
  Boulogne: [739],
  'Malvinas Argentinas': [749],
  Martínez: [104],
  Moreno: [110],
  Morón: [101],
  'San Justo': [748],
  Quilmes: [102],
  Temperley: [109],
  Tortuguitas: [756],
  Rosario: [113],
  'Santa Fe': [745],
  'Godoy Cruz': [732],
  Neuquén: [2014],
  Salta: [107, 2013],
};

describe('directorio inicial de ciudades consultables', () => {
  it('publica las 17 localidades con cobertura y sus 24 sucursales', () => {
    const { ciudades } = listarCiudadesCine();
    expect(ciudades.map((ciudad) => ciudad.nombre).sort()).toEqual(
      Object.keys(SUCURSALES_POR_CIUDAD).sort(),
    );
    expect(new Set(ciudades.map((ciudad) => ciudad.id)).size).toBe(17);
    expect(new Set(CINES_CINEMARK.map((cine) => cine.id)).size).toBe(24);
    for (const ciudad of ciudades) {
      const configuracion = obtenerCiudadCine(ciudad.id);
      const sucursales = SUCURSALES_POR_CIUDAD[ciudad.nombre] ?? [];
      const verificada = sucursales.length > 0;
      expect(ciudad.cobertura).toBe(verificada ? 'disponible' : 'sin_verificar');
      expect(ciudadCineConfiguracionSchema.safeParse(configuracion).success).toBe(true);
      expect(configuracion.butacaCines.map((cine) => cine.id).sort()).toEqual(
        [...sucursales].sort(),
      );
      for (const sucursal of configuracion.butacaCines) {
        expect(LUGARES_CINE).toContainEqual(
          expect.objectContaining({
            ciudadId: ciudad.id,
            fuentes: [{ fuenteId: 'butaca', registroId: String(sucursal.id) }],
          }),
        );
      }
      if (verificada) expect(ciudad.fuente.fuenteId).toBe('butaca');
      expect(ciudad).not.toHaveProperty('serpApiLocation');
    }
  });
  it('conserva los identificadores de las ciudades previamente configuradas', () => {
    expect(DIRECTORIO_CIUDADES_CINE.ciudades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nombre: 'CABA', id: 'ar:a2c2aae3-5cc8-4f9e-8e9d-389cf7def8ff' }),
        expect.objectContaining({
          nombre: 'Córdoba',
          id: 'ar:d036bc1a-707f-49c5-b6b3-8f0430fd25af',
        }),
        expect.objectContaining({
          nombre: 'La Plata',
          id: 'ar:cd888c22-4d30-4d37-a32b-155e751c8d05',
        }),
        expect.objectContaining({
          nombre: 'Mar del Plata',
          id: 'ar:24880ea5-7ead-4e6d-ae1a-a91a0029286b',
        }),
      ]),
    );
  });
  it('no habilita SerpApi sin evidencia geográfica propia de las nuevas localidades', () => {
    const nuevas = DIRECTORIO_CIUDADES_CINE.ciudades.filter(
      (ciudad) => !['CABA', 'Córdoba', 'La Plata', 'Mar del Plata'].includes(ciudad.nombre),
    );
    expect(nuevas).toHaveLength(15);
    for (const ciudad of nuevas) {
      expect(ciudad.serpApiLocation).toBeNull();
      expect(ciudad.evidenciaPorFuente.serpApi).toBeNull();
    }
  });
  it('rechaza una localidad nueva que pierde la evidencia de sus sucursales', () => {
    const ciudad = DIRECTORIO_CIUDADES_CINE.ciudades.find((item) => item.nombre === 'Godoy Cruz');
    expect(
      ciudadCineConfiguracionSchema.safeParse({
        ...ciudad,
        evidenciaPorFuente: { serpApi: null, butaca: null },
      }).success,
    ).toBe(false);
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
