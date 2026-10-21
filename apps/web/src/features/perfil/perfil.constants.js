import { KeyIcon, MailIcon, TrashIcon } from '../../components/ui/icons.jsx';
import { SECCIONES_CUENTA, rutaSeccionCuenta } from '../../app/rutas.js';

export const ACCIONES_CUENTA = Object.freeze([
  {
    id: 'cambiar-mail',
    titulo: 'Cambiar mail',
    descripcion: 'Te pedimos confirmarlo desde el nuevo mail',
    Icono: MailIcon,
    to: rutaSeccionCuenta(SECCIONES_CUENTA.MAIL),
  },
  {
    id: 'cambiar-contrasena',
    titulo: 'Cambiar contraseña',
    descripcion: 'Con tu contraseña actual o con un enlace por mail',
    Icono: KeyIcon,
    to: rutaSeccionCuenta(SECCIONES_CUENTA.PASSWORD),
  },
  {
    id: 'eliminar-cuenta',
    titulo: 'Eliminar cuenta',
    descripcion: 'Borrar tu cuenta y tus datos',
    Icono: TrashIcon,
    to: rutaSeccionCuenta(SECCIONES_CUENTA.ELIMINAR),
    peligro: true,
  },
]);
