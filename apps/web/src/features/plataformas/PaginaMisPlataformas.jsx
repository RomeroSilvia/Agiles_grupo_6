import { FormError } from '../auth/FormError.jsx';
import { TarjetaPlataforma, TarjetaPlataformaCargando } from './TarjetaPlataforma.jsx';
import { usePlataformas } from './usePlataformas.js';

const TARJETAS_CARGANDO = 6;

export function PaginaMisPlataformas() {
  const { plataformas, seleccionadas, loading, error, alternar } = usePlataformas();
  const sinSeleccion = !loading && plataformas.length > 0 && seleccionadas.size === 0;

  return (
    <section className="max-w-4xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Mis plataformas</h1>
        <p className="text-muted">
          Elegí qué plataformas tenés contratadas para filtrar tus resultados.
        </p>
      </header>

      <FormError>{error}</FormError>

      {sinSeleccion && (
        <p className="rounded-xl bg-chip px-4 py-3 text-sm font-medium text-chip-foreground">
          Todavía no elegiste ninguna plataforma. Activá las que tenés contratadas para ver primero
          dónde podés mirar cada título.
        </p>
      )}

      {loading ? (
        <>
          <p role="status" className="sr-only">
            Cargando plataformas
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: TARJETAS_CARGANDO }, (_, indice) => (
              <TarjetaPlataformaCargando key={indice} />
            ))}
          </ul>
        </>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {plataformas.map((plataforma) => (
              <TarjetaPlataforma
                key={plataforma.id}
                plataforma={plataforma}
                seleccionada={seleccionadas.has(plataforma.id)}
                onChange={alternar}
              />
            ))}
          </ul>
          <p className="text-xs text-muted">Se guarda automáticamente.</p>
        </>
      )}
    </section>
  );
}
