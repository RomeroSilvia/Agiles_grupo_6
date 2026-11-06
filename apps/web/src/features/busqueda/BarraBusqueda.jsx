import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SearchField } from '../../components/ui/SearchField.jsx';
import { ChevronDownIcon, FiltersIcon } from '../../components/ui/icons.jsx';

export function BarraBusqueda({
  titulo,
  tituloRequerido,
  isLoading,
  onChange,
  filtrosAbiertos,
  cantidadFiltros,
  panelFiltrosId,
  onAlternarFiltros,
}) {
  return (
    <Card padding="sm" elevated className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex-1">
        <label htmlFor="q" className="sr-only">
          Título
        </label>
        <SearchField
          id="q"
          name="q"
          tone="inset"
          value={titulo}
          onChange={onChange}
          placeholder="Buscá una película o serie"
          required={tituloRequerido}
        />
      </div>
      <div className="flex gap-3">
        <Button
          variant={filtrosAbiertos ? 'soft' : 'secondary'}
          size="compact"
          fullWidth={false}
          aria-label={cantidadFiltros > 0 ? `Filtros, ${cantidadFiltros} activos` : 'Filtros'}
          aria-expanded={filtrosAbiertos}
          aria-controls={panelFiltrosId}
          onClick={onAlternarFiltros}
          className="flex-1 md:flex-none"
        >
          <FiltersIcon className="size-4" />
          Filtros
          {cantidadFiltros > 0 && (
            <span className="rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
              {cantidadFiltros}
            </span>
          )}
          <ChevronDownIcon
            className={`size-4 transition-transform duration-150 ${filtrosAbiertos ? 'rotate-180' : ''}`}
          />
        </Button>
        <Button
          type="submit"
          size="compact"
          fullWidth={false}
          loading={isLoading}
          loadingText="Buscando…"
          className="flex-1 md:flex-none"
        >
          Buscar
        </Button>
      </div>
    </Card>
  );
}
