import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';

export function usePlataformas() {
  const propias = usePlataformasPropias();
  const [plataformas, setPlataformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [errorGuardado, setErrorGuardado] = useState('');
  const [intentoCatalogo, setIntentoCatalogo] = useState(0);
  const [propiasFallaronAlEntrar] = useState(() => Boolean(propias.error));

  useEffect(() => {
    let cancelled = false;
    request('/plataformas')
      .then((catalogo) => {
        if (!cancelled) {
          setPlataformas(catalogo);
          setErrorCatalogo('');
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setErrorCatalogo(cause.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [intentoCatalogo]);

  const { alternar: alternarPropia, recargar: recargarPropias, error: errorPropias } = propias;

  useEffect(() => {
    if (propiasFallaronAlEntrar) {
      recargarPropias();
    }
  }, [propiasFallaronAlEntrar, recargarPropias]);

  const alternar = useCallback(
    async (plataformaId, activa) => {
      setErrorGuardado('');
      try {
        await alternarPropia(plataformaId, activa);
      } catch (cause) {
        setErrorGuardado(cause.message);
      }
    },
    [alternarPropia],
  );

  const reintentar = useCallback(() => {
    setErrorGuardado('');
    if (errorCatalogo) {
      setErrorCatalogo('');
      setLoading(true);
      setIntentoCatalogo((actual) => actual + 1);
    }
    if (errorPropias) {
      recargarPropias();
    }
  }, [errorCatalogo, errorPropias, recargarPropias]);

  const errorCarga = errorCatalogo || errorPropias;

  return {
    plataformas,
    seleccionadas: propias.seleccionadas,
    guardando: propias.guardando,
    loading: loading || propias.loading,
    cargaFallida: Boolean(errorCarga),
    error: errorCarga || errorGuardado,
    alternar,
    reintentar,
  };
}
