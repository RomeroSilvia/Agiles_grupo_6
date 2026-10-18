export const RUTAS = Object.freeze({
  BUSQUEDA: '/',
  DETALLE_TITULO: 'titulos/:tipo/:tmdbId',
  MIS_PLATAFORMAS: '/mis-plataformas',
  PERFIL: '/perfil',
  INICIAR_SESION: '/iniciar-sesion',
  REGISTRO: '/registro',
});

export function rutaDetalle(tipo, tmdbId) {
  return `/${RUTAS.DETALLE_TITULO.replace(':tipo', encodeURIComponent(tipo)).replace(':tmdbId', encodeURIComponent(tmdbId))}`;
}
