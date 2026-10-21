import { RUTAS_ENLACE_MAIL } from '@buscador/shared/constants';

export const RUTAS = Object.freeze({
  BUSQUEDA: '/',
  DETALLE_TITULO: RUTAS_ENLACE_MAIL.DETALLE_TITULO,
  WATCHLIST: '/watchlist',
  MIS_PLATAFORMAS: '/mis-plataformas',
  PERFIL: '/perfil',
  CUENTA: '/perfil/cuenta',
  INICIAR_SESION: '/iniciar-sesion',
  REGISTRO: '/registro',
  RECUPERAR_PASSWORD: '/recuperar-contrasena',
  RESTABLECER_PASSWORD: RUTAS_ENLACE_MAIL.RESTABLECER_PASSWORD,
  CONFIRMAR_MAIL: RUTAS_ENLACE_MAIL.CONFIRMAR_MAIL,
});

export const SECCIONES_CUENTA = Object.freeze({
  MAIL: 'mail',
  PASSWORD: 'contrasena',
  ELIMINAR: 'eliminar',
});

export function rutaSeccionCuenta(seccion) {
  return `${RUTAS.CUENTA}#${seccion}`;
}

export function rutaDetalle(tipo, tmdbId) {
  return `${RUTAS.DETALLE_TITULO.replace(':tipo', encodeURIComponent(tipo)).replace(':tmdbId', encodeURIComponent(tmdbId))}`;
}

export function rutaWatchlistTitulo(tipo, tmdbId) {
  return `/watchlist/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}`;
}
