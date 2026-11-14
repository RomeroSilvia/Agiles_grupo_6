import { Link } from 'react-router';
import { PageHeader } from './PageHeader.jsx';
import { LINK_CLASS_NAME } from './focusRing.js';
import { RUTAS } from '../../app/rutas.js';

export function MessagePage({ titulo, descripcion }) {
  return (
    <section className="space-y-3">
      <PageHeader titulo={titulo} descripcion={descripcion} />
      <Link to={RUTAS.BUSQUEDA} className={`${LINK_CLASS_NAME} rounded-sm underline`}>
        Volver al inicio
      </Link>
    </section>
  );
}
