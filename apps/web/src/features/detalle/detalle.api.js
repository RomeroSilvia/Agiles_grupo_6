import { request } from '../../services/api.service.js';

function rutaTitulo(tipo, tmdbId) {
  return `/titulos/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}`;
}

export function obtenerDetalleTitulo({ tipo, tmdbId, signal }) {
  return request(rutaTitulo(tipo, tmdbId), { signal });
}

export function obtenerDisponibilidad({ tipo, tmdbId, region, signal }) {
  return request(`${rutaTitulo(tipo, tmdbId)}/disponibilidad`, { params: { region }, signal });
}

export function compararDisponibilidad({ tipo, tmdbId, regiones, signal }) {
  return request(`${rutaTitulo(tipo, tmdbId)}/disponibilidad/comparacion`, {
    params: { regiones: regiones.join(',') },
    signal,
  });
}
