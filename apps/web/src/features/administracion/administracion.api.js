import { request } from '../../services/api.service.js';
import { RUTA_API_USUARIOS_ADMIN } from './administracion.constants.js';

export function listarUsuariosAdmin({ mail, region, estado, pagina, signal }) {
  return request(RUTA_API_USUARIOS_ADMIN, { params: { mail, region, estado, pagina }, signal });
}
