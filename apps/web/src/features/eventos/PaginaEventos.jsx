import { useSearchParams } from 'react-router';
import { CATEGORIAS_EVENTOS, PERIODOS_EVENTOS } from '@buscador/shared/constants';
import { consultaEventosSchema } from '@buscador/shared/schemas';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { InvitacionPlanB } from '../../components/ui/InvitacionPlanB.jsx';
import { cardClassName } from '../../components/ui/surface.js';
import { MapPinIcon } from '../../components/ui/icons.jsx';
import catedralLaPlata from '../../assets/catedral-la-plata.jpg';
import { ListaEventos } from './ListaEventos.jsx';
import { EspecialAniversario } from './EspecialAniversario.jsx';

export function PaginaEventos() {
  const [params, setParams] = useSearchParams();
  const resultado = consultaEventosSchema.safeParse({
    categoria: params.get('categoria') ?? 'todas',
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
        <EspecialAniversario />
        <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl space-y-4">
            <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              La próxima historia la podés <span className="text-panel-accent">vivir afuera</span>
            </h1>
            <p className="max-w-xl text-base text-panel-muted sm:text-lg">
              Descubrí música, teatro, arte y encuentros para salir en La Plata. Elegí tu próximo
              plan con Cooltura.
            </p>
          </div>
          <img
            src={catedralLaPlata}
            alt="Catedral de La Plata al atardecer"
            width="1079"
            height="1223"
            className="max-h-64 w-full rounded-card object-cover lg:max-h-none lg:w-64 lg:shrink-0 lg:object-contain"
          />
        </div>
      </header>
      <p className="text-sm text-muted">
        Explorá por categoría o por fecha. Cada selección reemplaza la anterior.
      </p>
      <form
        onSubmit={(event) => event.preventDefault()}
        aria-label="Filtrar eventos"
        className={cardClassName({
          padding: 'lg',
          className: 'flex flex-col gap-4 sm:flex-row sm:items-end',
        })}
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
        {(categoria !== 'todas' || fecha !== 'todas') && (
          <Button variant="outline" fullWidth={false} onClick={() => setParams({})}>
            Ver todos
          </Button>
        )}
      </form>
      <ListaEventos key={`${categoria}:${fecha}`} categoria={categoria} fecha={fecha} />
      <InvitacionPlanB />
    </div>
  );
}
