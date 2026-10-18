import { KeyIcon, MailIcon, TrashIcon } from '../../components/ui/icons.jsx';

export const TARJETA_PERFIL_CLASS_NAME = 'rounded-xl border border-border bg-surface';

export const ACCIONES_CUENTA = Object.freeze([
  {
    id: 'cambiar-mail',
    titulo: 'Cambiar mail',
    descripcion: 'Te pedimos confirmarlo desde el nuevo mail',
    Icono: MailIcon,
    to: null,
  },
  {
    id: 'restablecer-contrasena',
    titulo: 'Restablecer contraseña',
    descripcion: 'Te enviamos un enlace por mail',
    Icono: KeyIcon,
    to: null,
  },
  {
    id: 'eliminar-cuenta',
    titulo: 'Eliminar cuenta',
    descripcion: 'Dar de baja tu cuenta',
    Icono: TrashIcon,
    to: null,
    peligro: true,
  },
]);
