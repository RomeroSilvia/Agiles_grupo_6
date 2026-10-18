import { useSession } from '../contexts/session/SessionContext.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { DropdownMenu } from '../components/ui/DropdownMenu.jsx';
import { DropdownMenuItem } from '../components/ui/DropdownMenuItem.jsx';
import { RUTAS } from './rutas.js';

export function MenuUsuario() {
  const { user, signOut } = useSession();

  return (
    <DropdownMenu
      label={`Menú de la cuenta de ${user.email}`}
      trigger={<Avatar email={user.email} />}
    >
      <DropdownMenuItem to={RUTAS.PERFIL}>Perfil</DropdownMenuItem>
      <DropdownMenuItem onClick={signOut}>Cerrar sesión</DropdownMenuItem>
    </DropdownMenu>
  );
}
