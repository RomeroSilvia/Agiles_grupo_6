import {
  COBERTURA_CIUDAD_CINE,
  FUENTE_ID_BUTACA,
  REGION_CARTELERA,
  ZONA_HORARIA_AR,
} from '@buscador/shared/constants';
import { CIUDADES_CINEMARK, CINES_CINEMARK, EVIDENCIA_CINEMARK } from './cinesCinemark.config.js';

const { registroId, url, consultadoEn, actualizadoEn } = EVIDENCIA_CINEMARK;
// Conservar los IDs históricos aunque no haya cobertura. Evidencia en docs/cine.md.
export const DIRECTORIO_CIUDADES_CINE = Object.freeze({
  configurado: true,
  ciudades: [
    ...CIUDADES_CINEMARK.map((ciudad) => ({
      ...ciudad,
      pais: REGION_CARTELERA,
      cobertura: COBERTURA_CIUDAD_CINE.DISPONIBLE,
      fuente: { registroId, url, consultadoEn, actualizadoEn, fuenteId: FUENTE_ID_BUTACA },
      butacaCines: CINES_CINEMARK.filter((cine) => cine.ciudadId === ciudad.id).map(
        ({ id, slug }) => ({ id, slug }),
      ),
    })),
    ...[
      ['ar:cd888c22-4d30-4d37-a32b-155e751c8d05', 'La Plata'],
      ['ar:24880ea5-7ead-4e6d-ae1a-a91a0029286b', 'Mar del Plata'],
    ].map(([id, nombre]) => ({
      id,
      nombre,
      provincia: 'Buenos Aires',
      pais: REGION_CARTELERA,
      zonaHoraria: ZONA_HORARIA_AR,
      cobertura: COBERTURA_CIUDAD_CINE.SIN_COBERTURA,
      fuente: {
        fuenteId: 'directorio',
        registroId: null,
        url: null,
        consultadoEn,
        actualizadoEn: null,
      },
      butacaCines: [],
    })),
  ],
});
