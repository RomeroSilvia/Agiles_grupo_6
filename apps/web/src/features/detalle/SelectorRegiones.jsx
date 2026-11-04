import { MAX_REGIONES_COMPARACION, NOMBRES_REGION } from '@buscador/shared/constants';
import { Chip } from '../../components/ui/Chip.jsx';
import { Popover } from '../../components/ui/Popover.jsx';
import { ChevronDownIcon, PlusIcon } from '../../components/ui/icons.jsx';

export function SelectorRegiones({ opciones, seleccion, abierto, onAbiertoChange, onAlternar }) {
  const limiteAlcanzado = seleccion.length >= MAX_REGIONES_COMPARACION;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Regiones a comparar{' '}
        <span className="font-normal text-muted">· hasta {MAX_REGIONES_COMPARACION}</span>
      </p>
      <div className="relative flex flex-wrap items-center gap-2">
        {seleccion.map((codigo) => (
          <Chip
            key={codigo}
            size="md"
            onRemove={() => onAlternar(codigo)}
            removeLabel={`Quitar ${NOMBRES_REGION[codigo] ?? codigo}`}
          >
            {NOMBRES_REGION[codigo] ?? codigo}
            <span className="font-mono text-xs">{codigo}</span>
          </Chip>
        ))}
        <Popover
          label="Regiones disponibles para comparar"
          open={abierto}
          onOpenChange={onAbiertoChange}
          anchor="parent"
          triggerClassName="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-primary"
          panelClassName="max-h-72 w-72 max-w-full overflow-y-auto"
          trigger={
            <>
              <PlusIcon className="size-4" />
              Agregar región {seleccion.length}/{MAX_REGIONES_COMPARACION}
              <ChevronDownIcon
                className={`size-4 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`}
              />
            </>
          }
        >
          {opciones.map(({ codigo, nombre }) => {
            const activa = seleccion.includes(codigo);

            return (
              <label
                key={codigo}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-background has-checked:bg-chip has-disabled:cursor-not-allowed has-disabled:opacity-50"
              >
                <input
                  type="checkbox"
                  aria-label={`${nombre} (${codigo})`}
                  checked={activa}
                  disabled={!activa && limiteAlcanzado}
                  onChange={() => onAlternar(codigo)}
                  className="size-4 accent-primary"
                />
                <span className="flex-1">{nombre}</span>
                <span className="font-mono text-xs text-muted">{codigo}</span>
              </label>
            );
          })}
        </Popover>
      </div>
    </div>
  );
}
