import { useId } from 'react';
import { MAX_REGIONES_COMPARACION, NOMBRES_REGION } from '@buscador/shared/constants';
import { Card } from '../../components/ui/Card.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { ChevronDownIcon, PlusIcon } from '../../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';

export function SelectorRegiones({ opciones, seleccion, abierto, onAlternarAbierto, onAlternar }) {
  const panelId = useId();
  const limiteAlcanzado = seleccion.length >= MAX_REGIONES_COMPARACION;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Regiones a comparar{' '}
        <span className="font-normal text-muted">· hasta {MAX_REGIONES_COMPARACION}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={panelId}
          onClick={onAlternarAbierto}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-primary ${FOCUS_RING_CLASS_NAME}`}
        >
          <PlusIcon className="size-4" />
          Agregar región {seleccion.length}/{MAX_REGIONES_COMPARACION}
          <ChevronDownIcon
            className={`size-4 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      <Card
        id={panelId}
        role="group"
        aria-label="Regiones disponibles para comparar"
        hidden={!abierto}
        padding="sm"
        className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3"
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
      </Card>
    </div>
  );
}
