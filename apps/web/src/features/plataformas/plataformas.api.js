import { request } from '../../services/api.service.js';
import { RUTA_API_PLATAFORMAS } from './plataformas.constants.js';

export function listarPlataformas({ signal } = {}) {
  return request(RUTA_API_PLATAFORMAS, { signal });
}
