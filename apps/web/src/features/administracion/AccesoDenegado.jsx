import { MessagePage } from '../../components/ui/MessagePage.jsx';

export function AccesoDenegado() {
  return (
    <MessagePage
      titulo="No tenés acceso a esta sección"
      descripcion="Solo las cuentas de administración pueden ver esta página."
    />
  );
}
