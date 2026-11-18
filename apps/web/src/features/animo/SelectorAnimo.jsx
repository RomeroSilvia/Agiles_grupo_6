import { ESTADOS_ANIMO } from '@buscador/shared/constants';
import { CheckIcon } from '../../components/ui/icons.jsx';
import { HOVER_SURFACE_CLASS_NAME } from '../../components/ui/surface.js';

const NOMBRE_GRUPO = 'animo';

export function SelectorAnimo({ valor, onChange }) {
  return (
    <fieldset>
      <legend className="sr-only">Estado de ánimo</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ESTADOS_ANIMO.map((estado) => {
          const elegido = valor === estado.id;
          const idNombre = `animo-${estado.id}-nombre`;
          const idDescripcion = `animo-${estado.id}-descripcion`;

          return (
            <label key={estado.id} className="relative block h-full">
              <input
                type="radio"
                name={NOMBRE_GRUPO}
                value={estado.id}
                checked={elegido}
                onChange={() => onChange(estado.id)}
                aria-labelledby={idNombre}
                aria-describedby={idDescripcion}
                className="peer sr-only"
              />
              <span
                className={`flex h-full min-h-20 cursor-pointer flex-col gap-1 rounded-card border p-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
                  elegido
                    ? 'border-primary bg-surface ring-1 ring-primary'
                    : `border-border bg-surface ${HOVER_SURFACE_CLASS_NAME}`
                }`}
              >
                <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
                  <span id={idNombre}>{estado.nombre}</span>
                  {elegido && <CheckIcon className="size-4 shrink-0 text-primary" />}
                </span>
                <span id={idDescripcion} className="text-sm text-muted">
                  {estado.descripcion}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
