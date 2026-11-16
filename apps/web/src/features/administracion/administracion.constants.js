import { ESTADO_USUARIO, PERIODO_METRICAS } from '@buscador/shared/constants';
import { RUTAS } from '../../app/rutas.js';
import {
  BookmarkIcon,
  ChartIcon,
  GlobeIcon,
  TvIcon,
  UsersIcon,
} from '../../components/ui/icons.jsx';

export const TITULO_PANEL_ADMIN = 'Panel de administración';

// Solo datos: el componente de cada pestaña se asocia a su ruta en app/router.js
export const PESTANA_METRICAS = Object.freeze({
  to: RUTAS.ADMIN_METRICAS,
  label: 'Métricas',
  Icono: ChartIcon,
  descripcionAntesDeApp: 'Resumen de la actividad en',
});

export const PESTANA_USUARIOS = Object.freeze({
  to: RUTAS.ADMIN_USUARIOS,
  label: 'Usuarios',
  Icono: UsersIcon,
  descripcionAntesDeApp: 'Usuarios registrados en',
});

export const PESTANAS_ADMIN = Object.freeze([PESTANA_METRICAS, PESTANA_USUARIOS]);

export const RUTA_API_USUARIOS_ADMIN = '/admin/usuarios';

export const DEBOUNCE_BUSQUEDA_MAIL_MS = 300;

export const ETIQUETAS_ESTADO_USUARIO = Object.freeze({
  [ESTADO_USUARIO.ACTIVO]: 'Activo',
  [ESTADO_USUARIO.SIN_CONFIRMAR]: 'Sin confirmar',
});

export const VARIANTES_ESTADO_USUARIO = Object.freeze({
  [ESTADO_USUARIO.ACTIVO]: 'filled',
  [ESTADO_USUARIO.SIN_CONFIRMAR]: 'outline',
});

export const MENSAJE_ERROR_USUARIOS = 'No se pudo cargar el listado de usuarios. Probá de nuevo.';

export const RUTA_API_METRICAS_ADMIN = '/admin/metricas';

export const MENSAJE_ERROR_METRICAS = 'No se pudieron cargar las métricas. Probá de nuevo.';

export const MENSAJE_SIN_DATOS = 'No hay datos en este período';

export const OPCIONES_PERIODO = Object.freeze([
  { value: PERIODO_METRICAS.SIETE_DIAS, label: '7 días' },
  { value: PERIODO_METRICAS.TREINTA_DIAS, label: '30 días' },
  { value: PERIODO_METRICAS.TODO, label: 'Todo el período' },
]);

export const FUENTE_RANKING = Object.freeze({ WATCHLIST: 'watchlist', BUSQUEDAS: 'busquedas' });

export const OPCIONES_FUENTE_RANKING = Object.freeze([
  { value: FUENTE_RANKING.WATCHLIST, label: 'Watchlist' },
  { value: FUENTE_RANKING.BUSQUEDAS, label: 'Búsquedas' },
]);

export const TARJETAS_TOTALES = Object.freeze([
  {
    clave: 'usuarios',
    claveNuevos: 'usuariosNuevos',
    label: 'Usuarios registrados',
    Icono: UsersIcon,
  },
  {
    clave: 'titulosWatchlist',
    claveNuevos: 'titulosWatchlistNuevos',
    label: 'Títulos en watchlists',
    Icono: BookmarkIcon,
  },
  { clave: 'regionesActivas', label: 'Regiones activas', Icono: GlobeIcon },
  { clave: 'plataformasElegidas', label: 'Plataformas con usuarios', Icono: TvIcon },
]);

export const RANKING_GENERO = Object.freeze({
  titulo: 'Género',
  descripciones: {
    [FUENTE_RANKING.WATCHLIST]: 'Títulos guardados en watchlists',
    [FUENTE_RANKING.BUSQUEDAS]: 'Búsquedas filtradas por género',
  },
});

export const RANKING_TIPO = Object.freeze({
  titulo: 'Tipo de contenido',
  descripciones: {
    [FUENTE_RANKING.WATCHLIST]: 'Títulos guardados en watchlists',
    [FUENTE_RANKING.BUSQUEDAS]: 'Búsquedas filtradas por tipo',
  },
});

export const RANKING_REGION = Object.freeze({
  titulo: 'Región',
  descripciones: {
    [FUENTE_RANKING.WATCHLIST]: 'Usuarios que guardaron títulos, según su región',
    [FUENTE_RANKING.BUSQUEDAS]: 'Búsquedas según la región detectada',
  },
});

export const RANKING_PLATAFORMA = Object.freeze({
  titulo: 'Plataforma',
  descripcion: 'Usuarios que la tienen en «Mis plataformas»',
});

export const RANKING_TEXTOS = Object.freeze({
  titulo: 'Textos más buscados',
  descripcion: 'Búsquedas por título o nombre',
});

export const MAX_FILAS_RANKING = 7;

export const ETIQUETA_OTRAS = 'Otras';

export const NOTA_METRICAS =
  '«Búsquedas» cuenta las búsquedas hechas desde que se empezaron a registrar. Los textos buscados pocas veces no se muestran.';
