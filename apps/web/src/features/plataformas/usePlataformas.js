import { useCallback, useEffect, useState } from 'react';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { useCatalogoPlataformas } from './useCatalogoPlataformas.js';

export function usePlataformas() {
  const propias = usePlataformasPropias();
  const {
    plataformas,
    loading,
    error: errorCatalogo,
    reintentar: reintentarCatalogo,
  } = useCatalogoPlataformas();
  const [errorGuardado, setErrorGuardado] = useState('');
  const [propiasFallaronAlEntrar] = useState(() => Boolean(propias.error));

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
      reintentarCatalogo();
    }
    if (errorPropias) {
      recargarPropias();
    }
  }, [errorCatalogo, errorPropias, recargarPropias, reintentarCatalogo]);

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
