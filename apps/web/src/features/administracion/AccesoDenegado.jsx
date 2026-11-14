import { Link } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';

export function AccesoDenegado() {
  return (
    <section className="space-y-3">
      <PageHeader
        titulo="No tenés acceso a esta sección"
        descripcion="Solo las cuentas de administración pueden ver esta página."
      />
      <Link to={RUTAS.BUSQUEDA} className={`${LINK_CLASS_NAME} rounded-sm underline`}>
        Volver al inicio
      </Link>
    </section>
  );
}
