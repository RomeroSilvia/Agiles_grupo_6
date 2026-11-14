import { useEffect } from 'react';
import { Alert } from '../../components/ui/Alert.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useCiudadCine } from '../../contexts/ciudadCine/CiudadCineContext.js';

export function SelectorCiudadCine() {
  const {
    ciudades,
    idCiudadSeleccionada,
    loading,
    error,
    aviso,
    cargarDirectorio,
    seleccionarCiudad,
    reintentar,
  } = useCiudadCine();

  useEffect(() => {
    cargarDirectorio();
  }, [cargarDirectorio]);

  return (
    <section aria-labelledby="selector-ciudad-cine-titulo" className="space-y-3">
      <h2 id="selector-ciudad-cine-titulo" className="text-lg font-bold">
        Ciudad para consultar cines
      </h2>

      {loading && (
        <div role="status" aria-label="Cargando ciudades">
          <Skeleton className="h-11 w-full max-w-md" />
        </div>
      )}

      {!loading && error && <Alert onRetry={reintentar}>{error}</Alert>}

      {!loading && !error && ciudades.length === 0 && (
        <Alert tone="info">No hay información de ciudades disponible.</Alert>
      )}

      {!loading && !error && ciudades.length > 0 && (
        <div className="max-w-md space-y-3">
          <label htmlFor="ciudad-cine" className="block text-sm font-medium">
            Seleccioná una ciudad de Argentina
          </label>
          <Select
            id="ciudad-cine"
            value={idCiudadSeleccionada ?? ''}
            onChange={(event) => seleccionarCiudad(event.target.value)}
          >
            <option value="">Seleccioná una ciudad</option>
            {ciudades.map((ciudad) => (
              <option
                key={ciudad.id}
                value={ciudad.id}
                disabled={ciudad.cobertura !== 'disponible'}
              >
                {ciudad.nombre}, {ciudad.provincia}
                {ciudad.cobertura === 'sin_cobertura' ? ' — Sin cobertura' : ''}
              </option>
            ))}
          </Select>
        </div>
      )}

      {aviso && <Alert tone="info">{aviso}</Alert>}
    </section>
  );
}
