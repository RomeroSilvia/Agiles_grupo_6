import { ANIO_MAXIMO, ANIO_MINIMO, TIPOS_TITULO } from '@buscador/shared/constants';
import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';
import { CAMPO_BUSQUEDA_CLASS_NAME, ETIQUETA_BUSQUEDA_CLASS_NAME } from './busqueda.styles.js';
import { FiltroPlataformasPropias } from './FiltroPlataformasPropias.jsx';
import { SelectorPersona } from './SelectorPersona.jsx';

export function FormularioBusqueda({
  filtros,
  filtroPropias,
  isLoading,
  onChange,
  onSubmit,
  onCambiarSoloPropias,
  filtroPropiasBloqueado,
  onCambiarPersona,
  onLimpiarFiltros,
  generos,
  isLoadingGeneros,
  errorGeneros,
  generosCargados,
  onCargarGeneros,
  onReintentarGeneros,
}) {
  const hayFiltrosActivos = Boolean(
    filtros.q.trim() ||
    filtros.tipo ||
    filtros.anio ||
    filtros.soloPropias ||
    filtros.genero ||
    filtros.actor ||
    filtros.actorNombre ||
    filtros.director ||
    filtros.directorNombre,
  );

  return (
    <form
      aria-label="Buscar títulos"
      className="mb-12 space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <label htmlFor="q" className={ETIQUETA_BUSQUEDA_CLASS_NAME}>
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
          className={`${CAMPO_BUSQUEDA_CLASS_NAME} placeholder:text-muted`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="tipo" className={ETIQUETA_BUSQUEDA_CLASS_NAME}>
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            value={filtros.tipo}
            onChange={onChange}
            className={CAMPO_BUSQUEDA_CLASS_NAME}
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
          <label htmlFor="anio" className={ETIQUETA_BUSQUEDA_CLASS_NAME}>
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
            className={`${CAMPO_BUSQUEDA_CLASS_NAME} placeholder:text-muted`}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="genero" className={ETIQUETA_BUSQUEDA_CLASS_NAME}>
            Género
          </label>
          <select
            id="genero"
            name="genero"
            value={filtros.genero}
            onChange={onChange}
            onFocus={onCargarGeneros}
            aria-busy={isLoadingGeneros}
            disabled={Boolean(errorGeneros)}
            className={CAMPO_BUSQUEDA_CLASS_NAME}
          >
            <option value="">
              {isLoadingGeneros
                ? 'Cargando géneros...'
                : generosCargados
                  ? 'Todos los géneros'
                  : 'Seleccioná para cargar géneros'}
            </option>
            {generos.map((genero) => (
              <option key={genero.id} value={genero.id}>
                {genero.nombre}
              </option>
            ))}
          </select>
          {errorGeneros && (
            <div role="alert" className="space-y-2 text-sm text-danger">
              <p>{errorGeneros}</p>
              <button type="button" onClick={onReintentarGeneros} className="underline">
                Reintentar
              </button>
            </div>
          )}
        </div>

        <SelectorPersona
          rol="actor"
          etiqueta="Actor"
          persona={filtros.actor ? { id: filtros.actor, nombre: filtros.actorNombre } : null}
          consulta={filtros.actorNombre}
          onConsultaChange={(consulta) => onCambiarPersona('actor', null, consulta)}
          onSeleccionar={(persona) => onCambiarPersona('actor', persona)}
          onLimpiar={() => onCambiarPersona('actor', null, '')}
        />

        <SelectorPersona
          rol="director"
          etiqueta="Director"
          persona={
            filtros.director ? { id: filtros.director, nombre: filtros.directorNombre } : null
          }
          consulta={filtros.directorNombre}
          onConsultaChange={(consulta) => onCambiarPersona('director', null, consulta)}
          onSeleccionar={(persona) => onCambiarPersona('director', persona)}
          onLimpiar={() => onCambiarPersona('director', null, '')}
        />

        <FiltroPlataformasPropias
          filtro={filtroPropias}
          activo={filtros.soloPropias}
          bloqueadoPorFiltrosAvanzados={filtroPropiasBloqueado}
          onChange={onCambiarSoloPropias}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="rounded-xl border border-border px-5 py-3 font-semibold text-foreground transition hover:bg-background focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            Limpiar filtros
          </button>
        )}
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
