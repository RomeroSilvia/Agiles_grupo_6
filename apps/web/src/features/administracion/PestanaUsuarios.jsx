import { useEffect, useMemo } from 'react';
import { USUARIOS_POR_PAGINA } from '@buscador/shared/constants';
import { Alert } from '../../components/ui/Alert.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatearNumero } from '../../utils/formatearNumero.js';
import { useCatalogoPlataformas } from '../plataformas/useCatalogoPlataformas.js';
import { FiltrosUsuarios } from './FiltrosUsuarios.jsx';
import { TablaUsuarios } from './TablaUsuarios.jsx';
import { useFiltrosUsuarios } from './useFiltrosUsuarios.js';
import { useRecargarSesionSinAcceso } from './useRecargarSesionSinAcceso.js';
import { useUsuariosAdmin } from './useUsuariosAdmin.js';

function textoResumen({ total, pagina, usuarios }) {
  const desde = (pagina - 1) * USUARIOS_POR_PAGINA + 1;
  const hasta = desde + usuarios.length - 1;
  const textoTotal = `${formatearNumero(total)} ${total === 1 ? 'usuario' : 'usuarios'}`;
  return usuarios.length > 0 ? `${textoTotal} · mostrando ${desde}–${hasta}` : textoTotal;
}

function UsuariosCargando() {
  return (
    <div className="grid gap-3">
      <p role="status" aria-live="polite" className="sr-only">
        Cargando usuarios…
      </p>
      {Array.from({ length: USUARIOS_POR_PAGINA }, (_, indice) => (
        <Skeleton key={indice} shape="block" className="h-16" />
      ))}
    </div>
  );
}

export function PestanaUsuarios() {
  const { filtros, mailIngresado, cambiarMail, cambiarFiltro, cambiarPagina } =
    useFiltrosUsuarios();
  const { datos, isLoading, error, codigoError, reintentar } = useUsuariosAdmin(filtros);
  const catalogo = useCatalogoPlataformas();

  const plataformasPorId = useMemo(
    () => new Map(catalogo.plataformas.map((plataforma) => [plataforma.id, plataforma])),
    [catalogo.plataformas],
  );

  const sinAcceso = useRecargarSesionSinAcceso(codigoError);

  const paginaFueraDeRango = datos && datos.totalPaginas > 0 && filtros.pagina > datos.totalPaginas;

  useEffect(() => {
    if (paginaFueraDeRango) {
      cambiarPagina(datos.totalPaginas);
    }
  }, [paginaFueraDeRango, datos, cambiarPagina]);

  return (
    <div className="space-y-5">
      <FiltrosUsuarios
        mail={mailIngresado}
        region={filtros.region}
        estado={filtros.estado}
        onCambiarMail={cambiarMail}
        onCambiarFiltro={cambiarFiltro}
      />

      {catalogo.error && <Alert onRetry={catalogo.reintentar}>{catalogo.error}</Alert>}

      {error && <Alert onRetry={sinAcceso ? undefined : reintentar}>{error}</Alert>}

      {isLoading && <UsuariosCargando />}

      {datos && !isLoading && (
        <>
          <p className="text-sm text-muted">{textoResumen(datos)}</p>
          {datos.usuarios.length > 0 ? (
            <TablaUsuarios
              usuarios={datos.usuarios}
              plataformasPorId={plataformasPorId}
              catalogoCargando={catalogo.loading}
            />
          ) : (
            !paginaFueraDeRango && (
              <Card padding="lg" className="text-muted">
                <p role="status" aria-live="polite">
                  Ningún usuario coincide con los filtros
                </p>
              </Card>
            )
          )}
          <Pagination
            page={datos.pagina}
            totalPages={datos.totalPaginas}
            onPageChange={cambiarPagina}
          />
        </>
      )}
    </div>
  );
}
