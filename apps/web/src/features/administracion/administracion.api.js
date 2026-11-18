import { request } from '../../services/api.service.js';
import { RUTA_API_METRICAS_ADMIN, RUTA_API_USUARIOS_ADMIN } from './administracion.constants.js';

export function listarUsuariosAdmin({ mail, region, estado, pagina, signal }) {
  return request(RUTA_API_USUARIOS_ADMIN, { params: { mail, region, estado, pagina }, signal });
}

export function obtenerMetricasAdmin({ periodo, signal }) {
  return request(RUTA_API_METRICAS_ADMIN, { params: { periodo }, signal });
}
