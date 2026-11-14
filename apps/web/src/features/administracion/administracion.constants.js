import { RUTAS } from '../../app/rutas.js';
import { ChartIcon, UsersIcon } from '../../components/ui/icons.jsx';
import { PestanaMetricas } from './PestanaMetricas.jsx';
import { PestanaUsuarios } from './PestanaUsuarios.jsx';

export const TITULO_PANEL_ADMIN = 'Panel de administración';

export const ENLACE_PANEL_ADMIN = 'Administración';

export const ETIQUETA_ROL_ADMIN = 'Admin';

export const PESTANA_METRICAS = Object.freeze({
  to: RUTAS.ADMIN_METRICAS,
  label: 'Métricas',
  Icono: ChartIcon,
  Component: PestanaMetricas,
  descripcionAntesDeApp: 'Resumen de la actividad en',
});

export const PESTANA_USUARIOS = Object.freeze({
  to: RUTAS.ADMIN_USUARIOS,
  label: 'Usuarios',
  Icono: UsersIcon,
  Component: PestanaUsuarios,
  descripcionAntesDeApp: 'Usuarios registrados en',
});

export const PESTANAS_ADMIN = Object.freeze([PESTANA_METRICAS, PESTANA_USUARIOS]);
