import {
  ciudadCineSchema,
  respuestaFuncionesCineSchema,
  sumarDiasCivil,
} from '@buscador/shared/schemas';
import * as ciudadCineService from './ciudadCine.service.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as serpApiIntegration from '../integrations/serpApi.integration.js';
import * as butacaIntegration from '../integrations/butaca.integration.js';
import { FUNCIONES_CINE_CONFIG } from '../config/funcionesCine.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { combinarFuncionesCine, obtenerFechaLocalCine } from './funcionCine.normalizer.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';

const limitar = createConcurrencyLimiter(FUNCIONES_CINE_CONFIG.MAX_CONCURRENT_REQUESTS);

export async function obtenerFuncionesPelicula({ tmdbId, ciudadId }) {
  const configuracion = ciudadCineService.obtenerCiudadCine(ciudadId);
  const pelicula = await tmdbIntegration.obtenerDetalle('pelicula', tmdbId);
  const ciudad = ciudadCineSchema.parse(
    Object.fromEntries(
      Object.entries(configuracion).filter(([campo]) =>
        ['id', 'nombre', 'provincia', 'pais', 'zonaHoraria', 'cobertura', 'fuente'].includes(campo),
      ),
    ),
  );
  const desde = obtenerFechaLocalCine(new Date(), ciudad.zonaHoraria);
  const hasta = sumarDiasCivil(desde, 7);
  const base = {
    tmdbId,
    tipo: 'pelicula',
    ciudad,
    desde,
    hasta,
    consultadoEn: new Date().toISOString(),
  };
  if (ciudad.cobertura === 'sin_cobertura') {
    return respuestaFuncionesCineSchema.parse({
      ...base,
      cines: [],
      funciones: [],
      estado: 'sin_cobertura',
      advertencias: [],
      fuentes: [],
    });
  }
  const parametros = { pelicula, ciudad: configuracion, desde, hasta };
  const proveedores = [];
  if (configuracion.serpApiLocation)
    proveedores.push({
      fuenteId: 'serpapi',
      consultar: () => serpApiIntegration.obtenerFuncionesSerpApi(parametros),
    });
  if (configuracion.butacaCines.length && butacaIntegration.estaHabilitadoButaca())
    proveedores.push({
      fuenteId: 'butaca',
      consultar: () => butacaIntegration.obtenerFuncionesButaca(parametros),
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
    .map((respuesta) => respuesta.value);
  if (!exitosas.length) {
    const cuotaAgotada = respuestas.some((respuesta) => respuesta.reason?.cause?.quota);
    throw new ExternalServiceError(
      cuotaAgotada
        ? 'las funciones: cupo de SerpApi agotado; probá más adelante'
        : 'las funciones: ninguna fuente habilitada respondió',
    );
  }
  const resultado = combinarFuncionesCine(exitosas);
  respuestas.forEach((respuesta, indice) => {
    if (respuesta.status === 'rejected')
      resultado.advertencias.push({
        code: respuesta.reason?.cause?.quota ? 'QUOTA_EXHAUSTED' : 'SOURCE_UNAVAILABLE',
        message: respuesta.reason?.cause?.quota
          ? 'Se agotó el cupo de SerpApi; se conservan datos de otras fuentes.'
          : 'Una fuente no está disponible; los resultados pueden estar incompletos.',
        fuenteId: proveedores[indice].fuenteId,
      });
  });
  if (configuracion.butacaCines.length && !butacaIntegration.estaHabilitadoButaca())
    resultado.advertencias.push({
      code: 'SOURCE_UNAVAILABLE',
      message: 'El complemento Cinemark no está habilitado; la cobertura es parcial.',
      fuenteId: 'butaca',
    });
  resultado.funciones = resultado.funciones.filter(
    (funcion) => Date.parse(funcion.inicio) > Date.now(),
  );
  if (resultado.funciones.length > FUNCIONES_CINE_CONFIG.MAX_FUNCIONES) {
    resultado.funciones = resultado.funciones.slice(0, FUNCIONES_CINE_CONFIG.MAX_FUNCIONES);
    resultado.advertencias.push({
      code: 'INCOMPLETE_DATA',
      message:
        'Se alcanzó el límite de 1.000 funciones; se muestran los datos recibidos hasta ese límite.',
      fuenteId: null,
    });
  }
  // La adquisición de los horarios conserva su fecha original incluso al leer caché.
  base.consultadoEn =
    resultado.fuentes.map((fuente) => fuente.consultadoEn).sort()[0] ?? base.consultadoEn;
  const estado =
    resultado.advertencias.length ||
    exitosas.some((respuesta) => respuesta.estadoFuente === 'incompleta')
      ? 'incompleta'
      : resultado.funciones.length
        ? 'disponible'
        : 'sin_funciones';
  return respuestaFuncionesCineSchema.parse({ ...base, ...resultado, estado });
}
