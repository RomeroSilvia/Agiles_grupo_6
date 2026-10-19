import { ListaPlataformas } from './ListaPlataformas.jsx';
import { DESCRIPCION_MIS_PLATAFORMAS } from './plataformas.constants.js';

export function PaginaMisPlataformas() {
  return (
    <section className="max-w-4xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Mis plataformas</h1>
        <p className="text-muted">{DESCRIPCION_MIS_PLATAFORMAS}</p>
      </header>

      <ListaPlataformas />
    </section>
  );
}
