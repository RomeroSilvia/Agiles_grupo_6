import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';

export function usePlataformas() {
  const propias = usePlataformasPropias();
  const [plataformas, setPlataformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [errorGuardado, setErrorGuardado] = useState('');

  useEffect(() => {
    let cancelled = false;
    request('/plataformas')
      .then((catalogo) => {
        if (!cancelled) {
          setPlataformas(catalogo);
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
  }, []);

  const { alternar: alternarPropia } = propias;

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

  const errorCarga = errorCatalogo || propias.error;

  return {
    plataformas,
    seleccionadas: propias.seleccionadas,
    guardando: propias.guardando,
    loading: loading || propias.loading,
    cargaFallida: Boolean(errorCarga),
    error: errorCarga || errorGuardado,
    alternar,
  };
}
