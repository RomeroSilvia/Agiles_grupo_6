import { TIPO_TITULO } from '@buscador/shared/constants';

export const ETIQUETAS_TIPO_TITULO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'Películas',
  [TIPO_TITULO.SERIE]: 'Series',
});

export const RUTAS_API_BUSQUEDA = Object.freeze({
  TODAS: '/busqueda',
  PROPIAS: '/busqueda/propias',
});

export const CARDS_CARGANDO = 10;

export const MAX_LOGOS_POR_CARD = 3;

export const MENSAJES_ERROR_FILTRO = Object.freeze({
  UNAUTHENTICATED: 'Tu sesión venció. Iniciá sesión de nuevo.',
  POR_DEFECTO: 'Ocurrió un error al filtrar por tus plataformas. Probá de nuevo más tarde.',
});
