import { REGION_SOURCE } from '@buscador/shared/constants';
import * as registroBusquedaRepository from '../repositories/registroBusqueda.repository.js';
import * as regionService from './region.service.js';

const PRIMERA_PAGINA = 1;

function normalizarTexto(texto) {
  const normalizado = texto?.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalizado || null;
}

export async function registrarBusqueda({ filtros, usuarioId, ip }) {
  if (filtros.pagina !== PRIMERA_PAGINA) {
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
