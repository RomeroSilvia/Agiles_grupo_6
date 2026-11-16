import { request } from '../../services/api.service.js';

function rutaTitulo(tipo, tmdbId) {
  return `/watchlist/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}`;
}

export function listarWatchlist({ pagina, signal } = {}) {
  return request('/watchlist', { params: { pagina }, signal });
}

export function obtenerEstadoWatchlist({ tipo, tmdbId, signal }) {
  return request(rutaTitulo(tipo, tmdbId), { signal });
}

export function agregarAWatchlist({ tipo, tmdbId }) {
  return request(rutaTitulo(tipo, tmdbId), { method: 'PUT' });
}

export function quitarDeWatchlist({ tipo, tmdbId }) {
  return request(rutaTitulo(tipo, tmdbId), { method: 'DELETE' });
}
