import { useId } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';

export function FiltrosFunciones({ fechas, cines, fecha, cineId, cambiarFiltros, limpiar }) {
  const id = useId();
  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">Filtrar funciones recibidas</legend>
      <div className="grid gap-3 md:grid-cols-3 md:items-end">
        <div className="min-w-0 space-y-1.5">
          <label htmlFor={`${id}-fecha`} className="block text-sm font-medium">
            Fecha de la función
          </label>
          <Select
            id={`${id}-fecha`}
            value={fecha}
            onChange={(event) => cambiarFiltros({ fecha: event.target.value, cineId })}
          >
            <option value="">Todas las fechas</option>
            {fechas.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <label htmlFor={`${id}-cine`} className="block text-sm font-medium">
            Cine
          </label>
          <Select
            id={`${id}-cine`}
            value={cineId}
            onChange={(event) => cambiarFiltros({ fecha, cineId: event.target.value })}
          >
            <option value="">Todos los cines</option>
            {cines.map((cine) => (
              <option key={cine.id} value={cine.id}>
                {cine.nombre}
                {cines.filter((otro) => otro.nombre === cine.nombre).length > 1
                  ? ` — ${cine.direccion ?? `Dirección no informada (${cine.id.slice(-8)})`}`
                  : ''}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="outline" onClick={limpiar}>
          Limpiar filtros
        </Button>
      </div>
    </fieldset>
  );
}
