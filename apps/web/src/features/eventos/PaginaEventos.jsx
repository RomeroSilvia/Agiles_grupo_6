import { useSearchParams } from 'react-router';
import { CATEGORIAS_EVENTOS, PERIODOS_EVENTOS } from '@buscador/shared/constants';
import { consultaEventosSchema } from '@buscador/shared/schemas';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { CalendarIcon, MapPinIcon } from '../../components/ui/icons.jsx';
import { ListaEventos } from './ListaEventos.jsx';

export function PaginaEventos() {
  const [params, setParams] = useSearchParams();
  const resultado = consultaEventosSchema.safeParse({
    categoria: params.get('categoria') ?? 'all',
    fecha: params.get('fecha') ?? 'todas',
  });
  const { categoria, fecha } = resultado.success ? resultado.data : consultaEventosSchema.parse({});
  const cambiarFiltro = (campo, value) => {
    setParams(campo === 'categoria' ? { categoria: value } : { fecha: value });
  };
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-card bg-panel p-6 text-panel-foreground sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-widest text-panel-accent uppercase">
            Cooltura · La Plata
          </span>
          <Chip>
            <MapPinIcon className="size-3.5" /> La Plata, Buenos Aires
          </Chip>
        </div>
        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="max-w-2xl space-y-4">
            <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              Desconectá la pantalla y conectá <span className="text-panel-accent">Cooltura</span>.
            </h1>
            <p className="max-w-xl text-base text-panel-muted sm:text-lg">
              La próxima historia la podés vivir afuera. Descubrí música, teatro, arte y encuentros
              para salir en La Plata.
            </p>
          </div>
          <CalendarIcon className="hidden size-20 shrink-0 text-panel-accent lg:block" />
        </div>
      </header>
      <p className="text-sm text-muted">
        Explorá por categoría o por fecha. Cada selección reemplaza la anterior.
      </p>
      <form
        onSubmit={(event) => event.preventDefault()}
        aria-label="Filtrar eventos"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <label htmlFor="categoria-eventos" className="text-sm font-semibold">
            Qué te gusta
          </label>
          <Select
            id="categoria-eventos"
            value={categoria}
            onChange={(event) => cambiarFiltro('categoria', event.target.value)}
          >
            {CATEGORIAS_EVENTOS.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <label htmlFor="fecha-eventos" className="text-sm font-semibold">
            Cuándo salimos
          </label>
          <Select
            id="fecha-eventos"
            value={fecha}
            onChange={(event) => cambiarFiltro('fecha', event.target.value)}
          >
            {PERIODOS_EVENTOS.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </Select>
        </div>
        {(categoria !== 'all' || fecha !== 'todas') && (
          <Button variant="outline" fullWidth={false} onClick={() => setParams({})}>
            Ver todos
          </Button>
        )}
      </form>
      <ListaEventos key={`${categoria}:${fecha}`} categoria={categoria} fecha={fecha} />
    </div>
  );
}
