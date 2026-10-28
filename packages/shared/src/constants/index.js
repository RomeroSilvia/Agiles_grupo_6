// Valores del negocio: deben coincidir con los enums de la base (supabase/migrations).
export const TIPO_TITULO = Object.freeze({
  PELICULA: 'pelicula',
  SERIE: 'serie',
});

export const TIPOS_TITULO = Object.values(TIPO_TITULO);

export const ROL_PERSONA = Object.freeze({ ACTOR: 'actor', DIRECTOR: 'director' });
export const ROLES_PERSONA = Object.values(ROL_PERSONA);

export const GENEROS_BUSQUEDA = Object.freeze([
  {
    id: 'accion-aventura',
    nombre: 'Acción y aventura',
    tmdbIds: Object.freeze({ pelicula: [28, 12], serie: [10759] }),
  },
  { id: 'animacion', nombre: 'Animación', tmdbIds: Object.freeze({ pelicula: [16], serie: [16] }) },
  { id: 'comedia', nombre: 'Comedia', tmdbIds: Object.freeze({ pelicula: [35], serie: [35] }) },
  { id: 'crimen', nombre: 'Crimen', tmdbIds: Object.freeze({ pelicula: [80], serie: [80] }) },
  {
    id: 'documental',
    nombre: 'Documental',
    tmdbIds: Object.freeze({ pelicula: [99], serie: [99] }),
  },
  { id: 'drama', nombre: 'Drama', tmdbIds: Object.freeze({ pelicula: [18], serie: [18] }) },
  {
    id: 'familia-infantil',
    nombre: 'Familiar e infantil',
    tmdbIds: Object.freeze({ pelicula: [10751], serie: [10751, 10762] }),
  },
  {
    id: 'fantasia-ciencia-ficcion',
    nombre: 'Fantasía y ciencia ficción',
    tmdbIds: Object.freeze({ pelicula: [14, 878], serie: [10765] }),
  },
  { id: 'historia', nombre: 'Historia', tmdbIds: Object.freeze({ pelicula: [36], serie: [] }) },
  { id: 'terror', nombre: 'Terror', tmdbIds: Object.freeze({ pelicula: [27], serie: [] }) },
  {
    id: 'misterio',
    nombre: 'Misterio',
    tmdbIds: Object.freeze({ pelicula: [9648], serie: [9648] }),
  },
  { id: 'musica', nombre: 'Música', tmdbIds: Object.freeze({ pelicula: [10402], serie: [] }) },
  { id: 'romance', nombre: 'Romance', tmdbIds: Object.freeze({ pelicula: [10749], serie: [] }) },
  { id: 'suspenso', nombre: 'Suspenso', tmdbIds: Object.freeze({ pelicula: [53], serie: [] }) },
  {
    id: 'belica-politica',
    nombre: 'Bélica y política',
    tmdbIds: Object.freeze({ pelicula: [10752], serie: [10768] }),
  },
  { id: 'western', nombre: 'Western', tmdbIds: Object.freeze({ pelicula: [37], serie: [37] }) },
  {
    id: 'pelicula-television',
    nombre: 'Película para televisión',
    tmdbIds: Object.freeze({ pelicula: [10770], serie: [] }),
  },
  { id: 'novela', nombre: 'Novela', tmdbIds: Object.freeze({ pelicula: [], serie: [10766] }) },
  { id: 'noticias', nombre: 'Noticias', tmdbIds: Object.freeze({ pelicula: [], serie: [10763] }) },
  { id: 'reality', nombre: 'Reality', tmdbIds: Object.freeze({ pelicula: [], serie: [10764] }) },
  { id: 'debate', nombre: 'Debate', tmdbIds: Object.freeze({ pelicula: [], serie: [10767] }) },
]);

export const GENEROS_BUSQUEDA_IDS = GENEROS_BUSQUEDA.map(({ id }) => id);

// Límites técnicos del formulario de búsqueda.
export const ANIO_MINIMO = 1888;
export const ANIO_MAXIMO = 2100;
export const PAGINA_MAXIMA = 500;
export const TMDB_ID_MAXIMO = 2147483647;

export const TIPO_OFERTA = Object.freeze({
  SUSCRIPCION: 'suscripcion',
  GRATIS: 'gratis',
  CON_ANUNCIOS: 'con_anuncios',
  ALQUILER: 'alquiler',
  COMPRA: 'compra',
});

export const TIPOS_OFERTA = Object.values(TIPO_OFERTA);

export const TIPOS_OFERTA_INCLUIDOS = Object.freeze([
  TIPO_OFERTA.SUSCRIPCION,
  TIPO_OFERTA.GRATIS,
  TIPO_OFERTA.CON_ANUNCIOS,
]);

export const ESTADOS_NOTIFICACION = ['pendiente', 'enviada', 'fallida'];

// Valores técnicos
export const DEFAULT_REGION = 'AR';

export const REGION_SOURCE = Object.freeze({ PROFILE: 'profile', IP: 'ip', DEFAULT: 'default' });
export const REGION_SOURCES = Object.values(REGION_SOURCE);

// Código de país ISO 3166-1 alfa-2, igual que el CHECK de perfil.region
export const REGION_PATTERN = /^[A-Z]{2}$/;

export const TMDB_LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w92';

export const APP_NAME = 'Streamly';

export const MINUTOS_VENCIMIENTO_ENLACE = 30;

export const CONFIRMACION_ELIMINAR = 'ELIMINAR';

export const RUTAS_ENLACE_MAIL = Object.freeze({
  RESTABLECER_PASSWORD: '/restablecer-contrasena',
  CONFIRMAR_MAIL: '/confirmar-mail',
  DETALLE_TITULO: '/titulos/:tipo/:tmdbId',
});
