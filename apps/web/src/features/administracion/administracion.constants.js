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
