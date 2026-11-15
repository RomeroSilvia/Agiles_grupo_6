import { ESTADO_USUARIO } from '@buscador/shared/constants';
import { RUTAS } from '../../app/rutas.js';
import { ChartIcon, UsersIcon } from '../../components/ui/icons.jsx';

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
