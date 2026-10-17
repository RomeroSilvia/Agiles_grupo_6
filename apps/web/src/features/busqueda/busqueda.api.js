import { request } from '../../services/api.service.js';
import { RUTAS_API_BUSQUEDA } from './busqueda.constants.js';

export function buscarTitulos(filtros, { soloPropias = false, signal } = {}) {
  const ruta = soloPropias ? RUTAS_API_BUSQUEDA.PROPIAS : RUTAS_API_BUSQUEDA.TODAS;
  return request(ruta, { params: filtros, signal });
}

export function listarGenerosBusqueda({ signal } = {}) {
  return request(RUTAS_API_BUSQUEDA.GENEROS, { signal });
}

export function buscarPersonasBusqueda({ q, rol, signal }) {
  return request(RUTAS_API_BUSQUEDA.PERSONAS, {
    params: { q, rol },
    signal,
  });
}

export function obtenerPersonaBusqueda({ id, rol, signal }) {
  return request(`${RUTAS_API_BUSQUEDA.PERSONAS}/${id}`, {
    params: { rol },
    signal,
  });
}
