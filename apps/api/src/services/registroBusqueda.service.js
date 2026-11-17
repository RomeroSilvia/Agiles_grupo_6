import { REGION_SOURCE } from '@buscador/shared/constants';
import { tieneCriterioBusqueda } from '@buscador/shared/schemas';
import { REGISTRO_BUSQUEDA } from '../config/busqueda.config.js';
import * as registroBusquedaRepository from '../repositories/registroBusqueda.repository.js';
import { createTtlCache } from '../utils/ttlCache.js';
import * as regionService from './region.service.js';

const PRIMERA_PAGINA = 1;

const busquedasRecientes = createTtlCache({
  ttlMs: REGISTRO_BUSQUEDA.VENTANA_REPETIDAS_MS,
  maxEntries: REGISTRO_BUSQUEDA.MAX_BUSQUEDAS_RECIENTES,
});

function normalizarTexto(texto) {
  const normalizado = texto?.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalizado || null;
}

function claveBusqueda({ ip, texto, tipo, genero }) {
  const criterio = texto ? ['texto', texto] : ['filtros', tipo, genero];
  return JSON.stringify([ip, ...criterio]);
}

async function guardarBusqueda({ busqueda, usuarioId, ip }) {
  const { region, source } = await regionService.obtenerRegion({ usuarioId, ip });

  await registroBusquedaRepository.insertar({
    ...busqueda,
    region: source === REGION_SOURCE.DEFAULT ? null : region,
  });
}

export async function registrarBusqueda({ filtros, usuarioId, ip }) {
  // Pasar de página no es una búsqueda nueva, y sin texto ni filtros solo se recorre el catálogo
  if (filtros.pagina !== PRIMERA_PAGINA || !tieneCriterioBusqueda(filtros)) {
    return;
  }

  const busqueda = {
    texto: normalizarTexto(filtros.q),
    tipo: filtros.tipo ?? null,
    genero: filtros.genero ?? null,
  };

  if (!ip) {
    return guardarBusqueda({ busqueda, usuarioId, ip });
  }

  // La misma búsqueda desde la misma IP se registra una sola vez por ventana.
  // Si el registro falla, el cache la descarta y el próximo intento vuelve a registrarla.
  return busquedasRecientes.getOrSet(claveBusqueda({ ip, ...busqueda }), () =>
    guardarBusqueda({ busqueda, usuarioId, ip }),
  );
}

// Para llamar después de responder: la búsqueda nunca se demora ni falla por el registro
export function registrarBusquedaSinEsperar(datos) {
  registrarBusqueda(datos).catch((error) =>
    console.error('No se pudo registrar la búsqueda', error),
  );
}
