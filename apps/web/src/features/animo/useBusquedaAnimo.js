import { useCallback, useEffect, useRef, useState } from 'react';
import { buscarPorAnimo } from './animo.api.js';
import { MENSAJES_ERROR_ANIMO } from './animo.constants.js';

const ESTADO_INICIAL = Object.freeze({
  consulta: null,
  resultados: [],
  pagina: 0,
  totalPaginas: 0,
  verificacionIncompleta: false,
  cargando: false,
  cargandoMas: false,
  error: '',
});

function claveTitulo({ tipo, tmdbId }) {
  return `${tipo}-${tmdbId}`;
}

// La popularidad en TMDB cambia entre una página y otra, así que un mismo título puede volver a
// aparecer al cargar más. Se agrega solo lo que todavía no está en la lista.
function agregarSinRepetidos(resultados, nuevos) {
  const claves = new Set(resultados.map(claveTitulo));
  return [...resultados, ...nuevos.filter((titulo) => !claves.has(claveTitulo(titulo)))];
}

export function useBusquedaAnimo() {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const controllerRef = useRef(null);

  const consultar = useCallback(async (consulta, pagina) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const acumular = pagina > 1;

    setEstado((previo) =>
      acumular
        ? { ...previo, cargandoMas: true, error: '' }
        : { ...ESTADO_INICIAL, consulta, cargando: true },
    );

    try {
      const data = await buscarPorAnimo({ ...consulta, pagina, signal: controller.signal });
      if (controller.signal.aborted) {
        return;
      }

      setEstado((previo) => ({
        ...previo,
        resultados: acumular
          ? agregarSinRepetidos(previo.resultados, data.resultados)
          : data.resultados,
        pagina: data.pagina,
        totalPaginas: data.totalPaginas,
        verificacionIncompleta:
          (acumular && previo.verificacionIncompleta) || Boolean(data.verificacionIncompleta),
        cargando: false,
        cargandoMas: false,
      }));
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        return;
      }

      setEstado((previo) => ({
        ...previo,
        cargando: false,
        cargandoMas: false,
        error: MENSAJES_ERROR_ANIMO[error?.code] ?? MENSAJES_ERROR_ANIMO.POR_DEFECTO,
      }));
    }
  }, []);

  const buscar = useCallback((consulta) => consultar(consulta, 1), [consultar]);

  const { consulta, pagina, totalPaginas, cargando, cargandoMas } = estado;
  const hayMasPaginas = pagina < totalPaginas;

  const cargarMas = useCallback(() => {
    if (!consulta || cargando || cargandoMas || !hayMasPaginas) {
      return;
    }
    consultar(consulta, pagina + 1);
  }, [consultar, consulta, cargando, cargandoMas, hayMasPaginas, pagina]);

  const reintentar = useCallback(() => {
    if (consulta) {
      consultar(consulta, 1);
    }
  }, [consultar, consulta]);

  const limpiar = useCallback(() => {
    controllerRef.current?.abort();
    setEstado(ESTADO_INICIAL);
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...estado, hayMasPaginas, buscar, cargarMas, reintentar, limpiar };
}
