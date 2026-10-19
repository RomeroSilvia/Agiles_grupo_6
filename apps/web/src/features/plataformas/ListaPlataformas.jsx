import { Button } from '../../components/ui/Button.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { TarjetaPlataforma } from './TarjetaPlataforma.jsx';
import { TarjetaPlataformaCargando } from './TarjetaPlataformaCargando.jsx';
import { usePlataformas } from './usePlataformas.js';

const TARJETAS_CARGANDO = 6;

export function ListaPlataformas() {
  const {
    plataformas,
    seleccionadas,
    guardando,
    loading,
    cargaFallida,
    error,
    alternar,
    reintentar,
  } = usePlataformas();
  const listo = !loading && !cargaFallida;
  const sinSeleccion = listo && plataformas.length > 0 && seleccionadas.size === 0;

  return (
    <div className="space-y-5">
      <FormError>{error}</FormError>

      {cargaFallida && !loading && (
        <Button onClick={reintentar} className="md:w-auto">
          Reintentar
        </Button>
      )}

      {sinSeleccion && (
        <p className="rounded-xl bg-chip px-4 py-3 text-sm font-medium text-chip-foreground">
          Todavía no elegiste ninguna plataforma. Activá las que tenés contratadas para ver primero
          dónde podés mirar cada título.
        </p>
      )}

      {loading && (
        <p role="status" className="sr-only">
          Cargando plataformas
        </p>
      )}

      {(loading || listo) && (
        <ul className="grid gap-3 md:grid-cols-2">
          {loading
            ? Array.from({ length: TARJETAS_CARGANDO }, (_, indice) => (
                <TarjetaPlataformaCargando key={indice} />
              ))
            : plataformas.map((plataforma) => (
                <TarjetaPlataforma
                  key={plataforma.id}
                  plataforma={plataforma}
                  seleccionada={seleccionadas.has(plataforma.id)}
                  guardando={guardando.has(plataforma.id)}
                  onChange={alternar}
                />
              ))}
        </ul>
      )}

      {listo && <p className="text-xs text-muted">Se guarda automáticamente.</p>}
    </div>
  );
}
