import { request } from '../../services/api.service.js';
import { RUTAS_API_BUSQUEDA } from './busqueda.constants.js';

export function buscarTitulos(filtros, { soloPropias = false, signal } = {}) {
  const ruta = soloPropias ? RUTAS_API_BUSQUEDA.PROPIAS : RUTAS_API_BUSQUEDA.TODAS;
  return request(ruta, { params: filtros, signal });
}
