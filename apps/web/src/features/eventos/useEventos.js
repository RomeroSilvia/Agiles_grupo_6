import { useCallback, useEffect, useRef, useState } from 'react';
import { listarEventos } from './eventos.api.js';

export function useEventos({ categoria, fecha }) {
  const [estado, setEstado] = useState({
    resultados: [],
    siguientePagina: null,
    fuente: null,
    incompleta: false,
    loading: true,
    loadingMore: false,
    error: '',
  });
  const controllerRef = useRef(null);
  const ultimaConsultaRef = useRef({ pagina: 1, acumular: false });

  const solicitar = useCallback(
    (pagina, acumular = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      ultimaConsultaRef.current = { pagina, acumular };
      return listarEventos({ categoria, fecha, pagina, signal: controller.signal })
        .then((data) => {
          if (controller.signal.aborted || controllerRef.current !== controller) {
            return;
          }
          setEstado((actual) => ({
            resultados: [
              ...new Map(
                [...(acumular ? actual.resultados : []), ...data.resultados].map((evento) => [
                  evento.id,
                  evento,
                ]),
              ).values(),
            ],
            siguientePagina: data.siguientePagina,
            fuente: data.fuente,
            incompleta: data.incompleta || (acumular && actual.incompleta),
            loading: false,
            loadingMore: false,
            error: '',
          }));
        })
        .catch((error) => {
          if (controller.signal.aborted || controllerRef.current !== controller) {
            return;
          }
          setEstado((actual) => ({
            ...actual,
            loading: false,
            loadingMore: false,
            error:
              error instanceof Error
                ? error.message
                : 'No pudimos cargar los eventos. Probá de nuevo.',
          }));
        });
    },
    [categoria, fecha],
  );

  useEffect(() => {
    solicitar(1);
    return () => controllerRef.current?.abort();
  }, [solicitar]);

  const cargarMas = () => {
    if (!estado.loading && !estado.loadingMore && estado.siguientePagina) {
      setEstado((actual) => ({ ...actual, loadingMore: true, error: '' }));
      solicitar(estado.siguientePagina, true);
    }
  };
  const reintentar = () => {
    const { pagina, acumular } = ultimaConsultaRef.current;
    setEstado((actual) => ({ ...actual, loading: !acumular, loadingMore: acumular, error: '' }));
    solicitar(pagina, acumular);
  };
  return { ...estado, cargarMas, reintentar };
}
