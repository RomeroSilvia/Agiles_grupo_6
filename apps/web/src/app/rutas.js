export const RUTAS = Object.freeze({
  BUSQUEDA: '/',
  DETALLE_TITULO: 'titulos/:tipo/:tmdbId',
  WATCHLIST: '/watchlist',
  MIS_PLATAFORMAS: '/mis-plataformas',
  INICIAR_SESION: '/iniciar-sesion',
  REGISTRO: '/registro',
});

export function rutaDetalle(tipo, tmdbId) {
  return `/${RUTAS.DETALLE_TITULO.replace(':tipo', encodeURIComponent(tipo)).replace(':tmdbId', encodeURIComponent(tmdbId))}`;
}

export function rutaWatchlistTitulo(tipo, tmdbId) {
  return `/watchlist/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}`;
}
