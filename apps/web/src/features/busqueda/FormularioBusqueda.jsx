import { ANIO_MAXIMO, ANIO_MINIMO, ROL_PERSONA, TIPOS_TITULO } from '@buscador/shared/constants';
import { tieneFiltrosAvanzados } from '@buscador/shared/schemas';
import { Button } from '../../components/ui/Button.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { IconButton } from '../../components/ui/IconButton.jsx';
import { XIcon } from '../../components/ui/icons.jsx';
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
  onCambiarNombrePersona,
  onLimpiarFiltros,
  onQuitarFiltro,
  generos,
  isLoadingGeneros,
  errorGeneros,
  generosCargados,
  onCargarGeneros,
  onReintentarGeneros,
}) {
  const hayFiltrosAvanzados = tieneFiltrosAvanzados(filtros);
  const hayFiltrosParaLimpiar = Boolean(
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
    <div className="mb-12 space-y-4">
      <form
        aria-label="Buscar títulos"
        className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
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

        <div className="space-y-6">
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(7rem,0.65fr)_minmax(0,1.25fr)] lg:gap-x-6">
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

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
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
          </div>

          <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 lg:gap-x-6">
            <SelectorPersona
              rol={ROL_PERSONA.ACTOR}
              etiqueta="Actor"
              persona={filtros.actor ? { id: filtros.actor, nombre: filtros.actorNombre } : null}
              consulta={filtros.actorNombre}
              onConsultaChange={(consulta) => onCambiarPersona(ROL_PERSONA.ACTOR, null, consulta)}
              onSeleccionar={(persona) => onCambiarPersona(ROL_PERSONA.ACTOR, persona)}
              onNombreCargado={(id, nombre) =>
                onCambiarNombrePersona(ROL_PERSONA.ACTOR, id, nombre)
              }
            />

            <SelectorPersona
              rol={ROL_PERSONA.DIRECTOR}
              etiqueta="Director"
              persona={
                filtros.director ? { id: filtros.director, nombre: filtros.directorNombre } : null
              }
              consulta={filtros.directorNombre}
              onConsultaChange={(consulta) =>
                onCambiarPersona(ROL_PERSONA.DIRECTOR, null, consulta)
              }
              onSeleccionar={(persona) => onCambiarPersona(ROL_PERSONA.DIRECTOR, persona)}
              onNombreCargado={(id, nombre) =>
                onCambiarNombrePersona(ROL_PERSONA.DIRECTOR, id, nombre)
              }
            />
          </div>

          <div
            className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${
              filtroPropias.visible ? 'border-t border-border pt-5' : ''
            }`}
          >
            <FiltroPlataformasPropias
              filtro={filtroPropias}
              activo={filtros.soloPropias}
              onChange={onCambiarSoloPropias}
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" disabled={isLoading} className="sm:w-auto">
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {hayFiltrosParaLimpiar && (
        <div
          role="group"
          aria-label="Filtros activos"
          className="flex flex-wrap items-center gap-2"
        >
          {filtros.tipo && (
            <FiltroActivo
              etiqueta={ETIQUETAS_TIPO_TITULO[filtros.tipo] ?? filtros.tipo}
              onQuitar={() => onQuitarFiltro('tipo')}
            />
          )}
          {filtros.anio && (
            <FiltroActivo etiqueta={filtros.anio} onQuitar={() => onQuitarFiltro('anio')} />
          )}
          {filtros.genero && (
            <FiltroActivo
              etiqueta={`Género: ${generos.find((genero) => String(genero.id) === String(filtros.genero))?.nombre ?? filtros.genero}`}
              onQuitar={() => onQuitarFiltro('genero')}
            />
          )}
          {filtros.actor && (
            <FiltroActivo
              etiqueta={`Actor: ${filtros.actorNombre || `Persona ${filtros.actor}`}`}
              onQuitar={() => onCambiarPersona(ROL_PERSONA.ACTOR, null, '')}
            />
          )}
          {filtros.director && (
            <FiltroActivo
              etiqueta={`Director: ${filtros.directorNombre || `Persona ${filtros.director}`}`}
              onQuitar={() => onCambiarPersona(ROL_PERSONA.DIRECTOR, null, '')}
            />
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onLimpiarFiltros}
            className="sm:w-auto"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}

function FiltroActivo({ etiqueta, onQuitar }) {
  return (
    <Chip className="max-w-full items-center gap-2 !font-sans !text-sm">
      <span className="max-w-56 truncate">{etiqueta}</span>
      <IconButton
        aria-label={`Quitar ${etiqueta}`}
        className="!size-7 shrink-0 !text-chip-foreground"
        onClick={onQuitar}
      >
        <XIcon className="size-3.5" />
      </IconButton>
    </Chip>
  );
}
