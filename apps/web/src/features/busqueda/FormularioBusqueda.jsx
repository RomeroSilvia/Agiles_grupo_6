import { ANIO_MAXIMO, ANIO_MINIMO, TIPOS_TITULO } from '@buscador/shared/constants';
import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';
import { FiltroPlataformasPropias } from './FiltroPlataformasPropias.jsx';

const etiquetaClassName = 'font-mono text-xs font-medium tracking-wide text-muted uppercase';

const campoClassName =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none focus:border-primary focus:ring-4 focus:ring-primary/20';

export function FormularioBusqueda({
  filtros,
  filtroPropias,
  isLoading,
  onChange,
  onSubmit,
  onCambiarSoloPropias,
}) {
  return (
    <form
      aria-label="Buscar títulos"
      className="mb-12 space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <label htmlFor="q" className={etiquetaClassName}>
          Título
        </label>
        <input
          id="q"
          name="q"
          type="search"
          value={filtros.q}
          onChange={onChange}
          placeholder="Ej.: Dune, The Office..."
          required
          className={`${campoClassName} placeholder:text-muted`}
        />
      </div>

      <div
        className={`grid gap-5 sm:grid-cols-2 lg:items-end ${filtroPropias.visible ? 'lg:grid-cols-[1fr_1fr_auto_auto]' : 'lg:grid-cols-[1fr_1fr_auto]'}`}
      >
        <div className="space-y-2">
          <label htmlFor="tipo" className={etiquetaClassName}>
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            value={filtros.tipo}
            onChange={onChange}
            className={campoClassName}
          >
            <option value="">Todos</option>
            {TIPOS_TITULO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO_TITULO[tipo]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="anio" className={etiquetaClassName}>
            Año
          </label>
          <input
            id="anio"
            name="anio"
            type="number"
            min={ANIO_MINIMO}
            max={ANIO_MAXIMO}
            value={filtros.anio}
            onChange={onChange}
            placeholder="Cualquier año"
            className={`${campoClassName} placeholder:text-muted`}
          />
        </div>

        <FiltroPlataformasPropias
          filtro={filtroPropias}
          activo={filtros.soloPropias}
          onChange={onCambiarSoloPropias}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </form>
  );
}
