import { ANIO_MAXIMO, ANIO_MINIMO, ROL_PERSONA, TIPOS_TITULO } from '@buscador/shared/constants';
import { tieneFiltrosAvanzados } from '@buscador/shared/schemas';
import { Button } from '../../components/ui/Button.jsx';
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
  onCambiarPersona,
  onLimpiarFiltros,
  generos,
  isLoadingGeneros,
  errorGeneros,
  generosCargados,
  onCargarGeneros,
  onReintentarGeneros,
}) {
  const hayFiltrosAvanzados = tieneFiltrosAvanzados(filtros);
  const hayFiltrosActivos = Boolean(
    filtros.q.trim() ||
    filtros.tipo ||
    filtros.anio ||
    filtros.soloPropias ||
    hayFiltrosAvanzados ||
    filtros.actorNombre.trim() ||
    filtros.directorNombre.trim(),
  );
  const hayFiltrosSinTitulo = Boolean(
    filtros.tipo || filtros.anio || filtros.soloPropias || hayFiltrosAvanzados,
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
          required={!hayFiltrosSinTitulo}
          className={`${CAMPO_BUSQUEDA_CLASS_NAME} placeholder:text-muted`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] xl:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(8rem,1fr)_auto_auto]">
        <div className="space-y-2 lg:col-start-1">
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

        <div className="space-y-2 lg:col-start-2">
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

        <div className="space-y-2 lg:col-start-3">
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

        <div className="lg:col-start-4">
          <SelectorPersona
            rol={ROL_PERSONA.ACTOR}
            etiqueta="Actor"
            persona={filtros.actor ? { id: filtros.actor, nombre: filtros.actorNombre } : null}
            consulta={filtros.actorNombre}
            onConsultaChange={(consulta) => onCambiarPersona(ROL_PERSONA.ACTOR, null, consulta)}
            onSeleccionar={(persona) => onCambiarPersona(ROL_PERSONA.ACTOR, persona)}
            onLimpiar={() => onCambiarPersona(ROL_PERSONA.ACTOR, null, '')}
          />
        </div>

        <div className="lg:col-start-5">
          <SelectorPersona
            rol={ROL_PERSONA.DIRECTOR}
            etiqueta="Director"
            persona={
              filtros.director ? { id: filtros.director, nombre: filtros.directorNombre } : null
            }
            consulta={filtros.directorNombre}
            onConsultaChange={(consulta) => onCambiarPersona(ROL_PERSONA.DIRECTOR, null, consulta)}
            onSeleccionar={(persona) => onCambiarPersona(ROL_PERSONA.DIRECTOR, persona)}
            onLimpiar={() => onCambiarPersona(ROL_PERSONA.DIRECTOR, null, '')}
          />
        </div>

        <div className="lg:col-span-3 lg:col-start-1 xl:col-span-1 xl:col-start-6">
          <FiltroPlataformasPropias
            filtro={filtroPropias}
            activo={filtros.soloPropias}
            onChange={onCambiarSoloPropias}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 sm:col-span-2 lg:contents">
          {hayFiltrosActivos && (
            <Button
              type="button"
              variant="secondary"
              onClick={onLimpiarFiltros}
              className="sm:w-auto lg:col-start-4 xl:col-start-7"
            >
              Limpiar filtros
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="sm:w-auto lg:col-start-5 xl:col-start-8"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>
    </form>
  );
}
