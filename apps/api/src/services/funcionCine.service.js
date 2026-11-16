import {
  COBERTURA_CIUDAD_CINE,
  ESTADO_FUNCIONES_CINE,
  FUENTE_ID_BUTACA,
  TIPO_TITULO,
} from '@buscador/shared/constants';
import { ciudadCineSchema, respuestaFuncionesCineSchema } from '@buscador/shared/schemas';
import { obtenerFechaCivil, sumarDiasCivil } from '@buscador/shared/utils';
import * as ciudadCineService from './ciudadCine.service.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as butacaService from './butaca.service.js';
import * as butacaIntegration from '../integrations/butaca.integration.js';
import { FUNCIONES_CINE_CONFIG, LUGARES_CINE } from '../config/funcionesCine.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { combinarFuncionesCine, normalizarObservacionesCine } from './funcionCine.normalizer.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';

const CAMPOS_CIUDAD_CINE = Object.keys(ciudadCineSchema.shape);
const limitar = createConcurrencyLimiter(FUNCIONES_CINE_CONFIG.MAX_CONCURRENT_REQUESTS);

export async function obtenerFuncionesPelicula({ tmdbId, ciudadId }) {
  const configuracion = ciudadCineService.obtenerCiudadCine(ciudadId);
  const pelicula = await tmdbIntegration.obtenerDetalle(TIPO_TITULO.PELICULA, tmdbId, {
    incluirIdentidadCine: true,
  });
  const ciudad = ciudadCineSchema.parse(
    Object.fromEntries(
      Object.entries(configuracion).filter(([campo]) => CAMPOS_CIUDAD_CINE.includes(campo)),
    ),
  );
  const desde = obtenerFechaCivil(new Date(), ciudad.zonaHoraria);
  const hasta = sumarDiasCivil(desde, FUNCIONES_CINE_CONFIG.HORIZONTE_DIAS);
  const base = {
    tmdbId,
    tipo: TIPO_TITULO.PELICULA,
    ciudad,
    desde,
    hasta,
    consultadoEn: new Date().toISOString(),
  };
  if (ciudad.cobertura === COBERTURA_CIUDAD_CINE.SIN_COBERTURA) {
    return respuestaFuncionesCineSchema.parse({
      ...base,
      cines: [],
      funciones: [],
      estado: ESTADO_FUNCIONES_CINE.SIN_COBERTURA,
      advertencias: [],
      fuentes: [],
    });
  }
  const parametros = { pelicula, ciudad: configuracion, desde, hasta };
  const proveedores = [];
  if (configuracion.butacaCines.length && butacaIntegration.estaHabilitadoButaca())
    proveedores.push({
      fuenteId: FUENTE_ID_BUTACA,
      consultar: () => butacaService.obtenerObservacionesButaca(parametros),
    });
  if (!proveedores.length)
    throw new ExternalServiceError(
      'las funciones: no hay fuentes habilitadas con cobertura verificada',
    );
  const respuestas = await Promise.allSettled(
    proveedores.map((proveedor) => limitar(proveedor.consultar)),
  );
  const exitosas = respuestas
    .filter((respuesta) => respuesta.status === 'fulfilled')
    .map((respuesta) => normalizarObservacionesCine({ ...respuesta.value, lugares: LUGARES_CINE }));
  if (!exitosas.length) {
    const error = respuestas.find((respuesta) => respuesta.status === 'rejected')?.reason;
    if (error && !(error instanceof ExternalServiceError)) throw error;
    throw new ExternalServiceError('las funciones: ninguna fuente habilitada respondió');
  }
  const resultado = combinarFuncionesCine(exitosas);
  if (ciudad.cobertura === COBERTURA_CIUDAD_CINE.SIN_VERIFICAR) {
    resultado.advertencias.push({
      code: 'INCOMPLETE_DATA',
      message:
        'La ubicación está habilitada para consultas, pero su cobertura de cines y horarios todavía no está verificada.',
      fuenteId: null,
    });
  }
  resultado.funciones = resultado.funciones.filter(
    (funcion) => Date.parse(funcion.inicio) > Date.now(),
  );
  if (resultado.funciones.length > FUNCIONES_CINE_CONFIG.MAX_FUNCIONES) {
    resultado.funciones = resultado.funciones.slice(0, FUNCIONES_CINE_CONFIG.MAX_FUNCIONES);
    resultado.advertencias.push({
      code: 'INCOMPLETE_DATA',
      message: `Se alcanzó el límite de ${FUNCIONES_CINE_CONFIG.MAX_FUNCIONES.toLocaleString('es-AR')} funciones; se muestran los datos recibidos hasta ese límite.`,
      fuenteId: null,
    });
  }
  // La adquisición de los horarios conserva su fecha original incluso al leer caché.
  base.consultadoEn =
    resultado.fuentes.map((fuente) => fuente.consultadoEn).sort()[0] ?? base.consultadoEn;
  const estado =
    resultado.advertencias.length ||
    exitosas.some((respuesta) => respuesta.estadoFuente === ESTADO_FUNCIONES_CINE.INCOMPLETA)
      ? ESTADO_FUNCIONES_CINE.INCOMPLETA
      : resultado.funciones.length
        ? ESTADO_FUNCIONES_CINE.DISPONIBLE
        : ESTADO_FUNCIONES_CINE.SIN_FUNCIONES;
  return respuestaFuncionesCineSchema.parse({ ...base, ...resultado, estado });
}
