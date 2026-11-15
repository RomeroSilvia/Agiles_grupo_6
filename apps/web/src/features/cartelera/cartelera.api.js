import { request } from '../../services/api.service.js';

export function listarPeliculasEnCartelera({ pagina = 1, signal } = {}) {
  return request('/cartelera', { params: { pagina }, signal });
}

export function listarProximosEstrenos({ desde, hasta, pagina = 1, signal } = {}) {
  return request('/cartelera/estrenos', { params: { desde, hasta, pagina }, signal });
}

export function obtenerFuncionesPelicula({ tmdbId, ciudadId, signal }) {
  return request(`/cartelera/peliculas/${tmdbId}/funciones`, { params: { ciudadId }, signal });
}

export function obtenerExhibicionPelicula({ tmdbId, signal }) {
  return request(`/cartelera/peliculas/${tmdbId}/exhibicion`, { signal });
}
