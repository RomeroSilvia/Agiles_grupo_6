import { Alert } from '../../components/ui/Alert.jsx';
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
      {error && <Alert onRetry={cargaFallida && !loading ? reintentar : undefined}>{error}</Alert>}

      {sinSeleccion && (
        <Alert tone="highlight">
          Todavía no elegiste ninguna plataforma. Activá las que tenés contratadas para ver primero
          dónde podés mirar cada título.
        </Alert>
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
