import { Link } from 'react-router';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LINK_CLASS_NAME } from '../components/ui/focusRing.js';
import { RUTAS } from './rutas.js';

export function NotFoundPage() {
  return (
    <section className="space-y-3">
      <PageHeader titulo="Página no encontrada" />
      <Link to={RUTAS.BUSQUEDA} className={`${LINK_CLASS_NAME} rounded-sm underline`}>
        Volver al inicio
      </Link>
    </section>
  );
}
