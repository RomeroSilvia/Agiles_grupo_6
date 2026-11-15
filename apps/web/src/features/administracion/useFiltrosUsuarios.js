import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { usuariosAdminSchema } from '@buscador/shared/schemas';

const FILTROS_POR_DEFECTO = usuariosAdminSchema.parse({});

export function useFiltrosUsuarios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const validacion = usuariosAdminSchema.safeParse(Object.fromEntries(searchParams));
  const filtros = validacion.success ? validacion.data : FILTROS_POR_DEFECTO;

  const actualizar = useCallback(
    (cambios) => {
      setSearchParams(
        (actuales) => {
          const siguientes = new URLSearchParams(actuales);
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === undefined || valor === null || valor === '') {
              siguientes.delete(clave);
            } else {
              siguientes.set(clave, String(valor));
            }
          }
          return siguientes;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const cambiarFiltro = useCallback(
    (clave, valor) => actualizar({ [clave]: valor, pagina: null }),
    [actualizar],
  );

  const cambiarPagina = useCallback(
    (pagina) => actualizar({ pagina: pagina === FILTROS_POR_DEFECTO.pagina ? null : pagina }),
    [actualizar],
  );

  return {
    filtros,
    mailIngresado: searchParams.get('mail') ?? '',
    cambiarFiltro,
    cambiarPagina,
  };
}
