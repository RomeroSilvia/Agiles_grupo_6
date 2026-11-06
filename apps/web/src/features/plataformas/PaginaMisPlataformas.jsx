import { RUTAS } from '../../app/rutas.js';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { ListaPlataformas } from './ListaPlataformas.jsx';
import { DESCRIPCION_MIS_PLATAFORMAS } from './plataformas.constants.js';

export function PaginaMisPlataformas() {
  return (
    <section className="max-w-4xl space-y-5">
      <BackLink to={RUTAS.PERFIL}>Volver</BackLink>
      <PageHeader titulo="Mis plataformas" descripcion={DESCRIPCION_MIS_PLATAFORMAS} />
      <ListaPlataformas />
    </section>
  );
}
