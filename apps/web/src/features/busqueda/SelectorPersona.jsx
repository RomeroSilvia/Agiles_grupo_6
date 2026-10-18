import { useCallback, useEffect, useId, useState } from 'react';
import { personaBusquedaSchema, personaIdBusquedaSchema } from '@buscador/shared/schemas';
import { useRemoteOptions } from '../../hooks/useRemoteOptions.js';
import { obtenerPersonaBusqueda } from './busqueda.api.js';
import { CAMPO_BUSQUEDA_CLASS_NAME, ETIQUETA_BUSQUEDA_CLASS_NAME } from './busqueda.styles.js';
import { usePersonasBusqueda } from './usePersonasBusqueda.js';

const MENSAJE_ERROR_PERSONA = 'No se pudieron cargar los datos de la persona. Probá de nuevo.';

export function SelectorPersona({
  rol,
  etiqueta,
  persona,
  consulta,
  onConsultaChange,
  onSeleccionar,
  onNombreCargado,
}) {
  const inputId = useId();
  const listId = useId();
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const texto = consulta.trim();
  const { personas, isLoading, error, reintentar } = usePersonasBusqueda({
    consulta: texto,
    rol,
    seleccionada: Boolean(persona?.id),
  });
  const seleccionValida = personaIdBusquedaSchema.safeParse({ id: persona?.id, rol });
  const idPersona = seleccionValida.success ? seleccionValida.data.id : null;
  const necesitaNombre = Boolean(persona?.id && !persona.nombre && seleccionValida.success);
  const solicitarPersona = useCallback(
    ({ signal }) => obtenerPersonaBusqueda({ id: idPersona, rol, signal }),
    [idPersona, rol],
  );
  const respuestaPersona = useRemoteOptions({
    clave: `${rol}:${persona?.id ?? ''}`,
    habilitado: necesitaNombre,
    solicitar: solicitarPersona,
    mensajeError: MENSAJE_ERROR_PERSONA,
  });

  useEffect(() => {
    if (persona?.id && !persona.nombre && respuestaPersona.datos?.nombre) {
      onNombreCargado?.(persona.id, respuestaPersona.datos.nombre);
    }
  }, [onNombreCargado, persona?.id, persona?.nombre, respuestaPersona.datos?.nombre]);

  const consultaValida = personaBusquedaSchema.safeParse({ q: texto, rol });
  const mostrarOpciones =
    popupAbierto && !persona?.id && consultaValida.success && personas.length > 0;

  function handleChange(event) {
    setPopupAbierto(true);
    setIndiceActivo(-1);
    onConsultaChange(event.target.value);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && personas.length > 0) {
      event.preventDefault();
      setPopupAbierto(true);
      setIndiceActivo((actual) => Math.min(actual + 1, personas.length - 1));
      return;
    }

    if (event.key === 'ArrowUp' && personas.length > 0) {
      event.preventDefault();
      setPopupAbierto(true);
      setIndiceActivo((actual) => (actual < 0 ? personas.length - 1 : Math.max(actual - 1, 0)));
      return;
    }

    if (event.key === 'Enter' && mostrarOpciones && indiceActivo >= 0) {
      event.preventDefault();
      onSeleccionar(personas[indiceActivo]);
      setPopupAbierto(false);
      setIndiceActivo(-1);
      return;
    }

    if (event.key === 'Escape' && popupAbierto) {
      event.preventDefault();
      setPopupAbierto(false);
      setIndiceActivo(-1);
    }
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPopupAbierto(false);
      setIndiceActivo(-1);
    }
  }

  return (
    <div className="relative space-y-2" onBlur={handleBlur}>
      <label htmlFor={inputId} className={ETIQUETA_BUSQUEDA_CLASS_NAME}>
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={mostrarOpciones}
          aria-controls={listId}
          aria-activedescendant={
            mostrarOpciones && indiceActivo >= 0
              ? `${listId}-option-${personas[indiceActivo].id}`
              : undefined
          }
          aria-busy={isLoading}
          value={persona?.id ? '' : consulta}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setPopupAbierto(true)}
          autoComplete="off"
          placeholder={`Buscá ${etiqueta.toLocaleLowerCase('es')}`}
          className={`${CAMPO_BUSQUEDA_CLASS_NAME} placeholder:text-muted`}
        />
      </div>
      {persona?.id && respuestaPersona.isLoading && (
        <p role="status" className="text-sm text-muted">
          Cargando persona...
        </p>
      )}
      {persona?.id && respuestaPersona.error && (
        <div role="alert" className="space-y-2 text-sm text-danger">
          <p>{respuestaPersona.error}</p>
          <button type="button" onClick={respuestaPersona.reintentar} className="underline">
            Reintentar
          </button>
        </div>
      )}
      {!persona?.id && isLoading && (
        <p role="status" className="text-sm text-muted">
          Buscando personas...
        </p>
      )}
      {!persona?.id && error && (
        <div role="alert" className="space-y-2 text-sm text-danger">
          <p>{error}</p>
          <button type="button" onClick={reintentar} className="underline">
            Reintentar
          </button>
        </div>
      )}
      {!persona?.id && !isLoading && !error && consultaValida.success && personas.length === 0 && (
        <p role="status" className="text-sm text-muted">
          No encontramos personas con ese nombre.
        </p>
      )}
      {mostrarOpciones && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`Opciones de ${etiqueta.toLocaleLowerCase('es')}`}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {personas.map((opcion, indice) => (
            <li
              key={opcion.id}
              id={`${listId}-option-${opcion.id}`}
              role="option"
              aria-selected={indiceActivo === indice}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                onSeleccionar(opcion);
                setPopupAbierto(false);
                setIndiceActivo(-1);
              }}
              className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-background ${indiceActivo === indice ? 'bg-background' : ''}`}
            >
              {opcion.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
