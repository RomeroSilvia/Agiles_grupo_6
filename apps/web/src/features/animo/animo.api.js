import { request } from '../../services/api.service.js';
import { RUTAS_API_ANIMO } from './animo.constants.js';

export function buscarPorAnimo({ animo, pagina, soloPropias = false, signal }) {
  const ruta = soloPropias ? RUTAS_API_ANIMO.PROPIAS : RUTAS_API_ANIMO.TODAS;
  return request(ruta, { params: { animo, pagina }, signal });
}
