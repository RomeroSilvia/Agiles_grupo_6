import { useRegion } from '../../contexts/region/RegionContext.js';

/** TODO (E1F1 / E1HU1 / E1HU2): buscador, filtros y resultados. */
export function PaginaBusqueda() {
  const { region } = useRegion();

  return (
    <section className="space-y-2">
      <h1 className="text-3xl font-extrabold tracking-tight">¿Qué querés ver?</h1>
      <p className="text-muted">Mostrando disponibilidad para: {region}</p>
    </section>
  );
}
