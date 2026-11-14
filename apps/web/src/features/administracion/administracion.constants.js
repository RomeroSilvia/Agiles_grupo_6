import { RUTAS } from '../../app/rutas.js';
import { ChartIcon, UsersIcon } from '../../components/ui/icons.jsx';

export const TITULO_PANEL_ADMIN = 'Panel de administración';

export const ENLACE_PANEL_ADMIN = 'Administración';

export const PESTANAS_ADMIN = Object.freeze([
  {
    to: RUTAS.ADMIN_METRICAS,
    label: 'Métricas',
    Icono: ChartIcon,
    descripcion: 'Resumen de la actividad en',
  },
  {
    to: RUTAS.ADMIN_USUARIOS,
    label: 'Usuarios',
    Icono: UsersIcon,
    descripcion: 'Usuarios registrados en',
  },
]);
