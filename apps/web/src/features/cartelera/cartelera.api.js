import { request } from '../../services/api.service.js';

export function listarPeliculasEnCartelera({ pagina = 1, signal } = {}) {
  return request('/cartelera', { params: { pagina }, signal });
}
