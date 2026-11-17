import { REGION_SOURCE } from '@buscador/shared/constants';
import { tieneCriterioBusqueda } from '@buscador/shared/schemas';
import * as registroBusquedaRepository from '../repositories/registroBusqueda.repository.js';
import * as regionService from './region.service.js';

const PRIMERA_PAGINA = 1;

function normalizarTexto(texto) {
  const normalizado = texto?.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalizado || null;
}

export async function registrarBusqueda({ filtros, usuarioId, ip }) {
  // Pasar de página no es una búsqueda nueva, y sin texto ni filtros solo se recorre el catálogo
  if (filtros.pagina !== PRIMERA_PAGINA || !tieneCriterioBusqueda(filtros)) {
    return;
  }

  const { region, source } = await regionService.obtenerRegion({ usuarioId, ip });

  await registroBusquedaRepository.insertar({
    texto: normalizarTexto(filtros.q),
    tipo: filtros.tipo ?? null,
    genero: filtros.genero ?? null,
    region: source === REGION_SOURCE.DEFAULT ? null : region,
  });
}

// Para llamar después de responder: la búsqueda nunca se demora ni falla por el registro
export function registrarBusquedaSinEsperar(datos) {
  registrarBusqueda(datos).catch((error) =>
    console.error('No se pudo registrar la búsqueda', error),
  );
}
