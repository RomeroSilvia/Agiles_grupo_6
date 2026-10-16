import { useCallback, useEffect, useId, useState } from 'react';
import { ApiError } from '../../services/api.service.js';
import { buscarPersonasBusqueda } from './busqueda.api.js';
import { CAMPO_BUSQUEDA_CLASS_NAME, ETIQUETA_BUSQUEDA_CLASS_NAME } from './busqueda.styles.js';

function usePersonasBusqueda({ consulta, rol, seleccionada }) {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState({
    consulta: '',
    rol: '',
    intento: -1,
    personas: [],
    isLoading: false,
    error: '',
  });
  const q = consulta.trim();

  useEffect(() => {
    if (seleccionada || q.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setRespuesta({ consulta: q, rol, intento, personas: [], isLoading: true, error: '' });
      buscarPersonasBusqueda({ q, rol, signal: controller.signal })
        .then((data) => {
          if (!Array.isArray(data)) {
            throw new Error('Respuesta de personas inválida');
          }
          setRespuesta({ consulta: q, rol, intento, personas: data, isLoading: false, error: '' });
        })
        .catch((requestError) => {
          if (!controller.signal.aborted) {
            setRespuesta({
              consulta: q,
              rol,
              intento,
              personas: [],
              isLoading: false,
              error:
                requestError instanceof ApiError
                  ? requestError.message
                  : 'No se pudieron buscar personas. Probá de nuevo.',
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [q, rol, seleccionada, intento]);

  const respuestaActual =
    respuesta.consulta === q && respuesta.rol === rol && respuesta.intento === intento;
  const isLoading = !seleccionada && q.length >= 2 && (!respuestaActual || respuesta.isLoading);
  const reintentar = useCallback(() => setIntento((actual) => actual + 1), []);

  return {
    personas: respuestaActual && !seleccionada ? respuesta.personas : [],
    isLoading,
    error: respuestaActual && !seleccionada ? respuesta.error : '',
    reintentar,
  };
}

export function SelectorPersona({
  rol,
  etiqueta,
  persona,
  consulta,
  onConsultaChange,
  onSeleccionar,
  onLimpiar,
}) {
  const inputId = useId();
  const listId = useId();
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const texto = persona?.id ? persona.nombre : consulta;
  const { personas, isLoading, error, reintentar } = usePersonasBusqueda({
    consulta: texto,
    rol,
    seleccionada: Boolean(persona?.id),
  });

  const mostrarOpciones =
    popupAbierto && !persona?.id && texto.trim().length >= 2 && personas.length > 0;

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
          type="search"
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
          value={texto}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setPopupAbierto(true)}
          autoComplete="off"
          placeholder={`Buscá ${etiqueta.toLocaleLowerCase('es')}`}
          className={`${CAMPO_BUSQUEDA_CLASS_NAME} pr-12 placeholder:text-muted`}
        />
        {persona?.id && (
          <button
            type="button"
            aria-label={`Quitar ${etiqueta.toLocaleLowerCase('es')}`}
            onClick={() => {
              setPopupAbierto(false);
              setIndiceActivo(-1);
              onLimpiar();
            }}
            className="absolute inset-y-0 right-3 my-auto h-8 w-8 rounded-full text-muted transition hover:bg-background hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            ×
          </button>
        )}
      </div>
      {isLoading && (
        <p role="status" className="text-sm text-muted">
          Buscando personas...
        </p>
      )}
      {error && (
        <div role="alert" className="space-y-2 text-sm text-danger">
          <p>{error}</p>
          <button type="button" onClick={reintentar} className="underline">
            Reintentar
          </button>
        </div>
      )}
      {!persona?.id &&
        !isLoading &&
        !error &&
        texto.trim().length >= 2 &&
        personas.length === 0 && (
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
          {personas.slice(0, 8).map((opcion, indice) => (
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
