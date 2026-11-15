import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { usuariosAdminSchema } from '@buscador/shared/schemas';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js';
import { DEBOUNCE_BUSQUEDA_MAIL_MS } from './administracion.constants.js';

const FILTROS_POR_DEFECTO = usuariosAdminSchema.parse({});

// Valida cada parámetro por separado: uno inválido o desconocido no descarta los demás
function leerFiltros(searchParams) {
  const validos = {};
  for (const [clave, esquema] of Object.entries(usuariosAdminSchema.shape)) {
    const resultado = esquema.safeParse(searchParams.get(clave) ?? undefined);
    if (resultado.success && resultado.data !== undefined && resultado.data !== '') {
      validos[clave] = resultado.data;
    }
  }
  return usuariosAdminSchema.parse(validos);
}

export function useFiltrosUsuarios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = leerFiltros(searchParams);
  const mailEnUrl = filtros.mail ?? '';

  const [mailIngresado, setMailIngresado] = useState(mailEnUrl);
  const [ultimoMailEnUrl, setUltimoMailEnUrl] = useState(mailEnUrl);

  // Si la URL cambia desde afuera (por ejemplo, al volver a la pestaña), el buscador la sigue
  if (ultimoMailEnUrl !== mailEnUrl) {
    setUltimoMailEnUrl(mailEnUrl);
    if (mailIngresado.trim() !== mailEnUrl) {
      setMailIngresado(mailEnUrl);
    }
  }

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

  const aplicarMail = useDebouncedCallback(
    (mail) => cambiarFiltro('mail', mail.trim()),
    DEBOUNCE_BUSQUEDA_MAIL_MS,
  );

  const cambiarMail = useCallback(
    (mail) => {
      setMailIngresado(mail);
      aplicarMail(mail);
    },
    [aplicarMail],
  );

  return { filtros, mailIngresado, cambiarMail, cambiarFiltro, cambiarPagina };
}
