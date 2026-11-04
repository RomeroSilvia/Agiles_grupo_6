import { RUTAS } from '../../app/rutas.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ButtonLink } from '../../components/ui/ButtonLink.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { IconBadge } from '../../components/ui/IconBadge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { BookmarkIcon } from '../../components/ui/icons.jsx';
import { useSession } from '../../contexts/session/SessionContext.js';
import { TarjetaWatchlist } from './TarjetaWatchlist.jsx';
import { useWatchlist } from './useWatchlist.js';

const GRILLA_CLASS_NAME = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';
const TARJETAS_CARGANDO = Array.from({ length: 8 }, (_, indice) => indice);

export function PaginaWatchlist() {
  const { user, loading: cargandoSesion } = useSession();
  const {
    titulos,
    pagina,
    totalResultados,
    totalPaginas,
    cargando,
    cargandoMas,
    error,
    pendientes,
    reintentar,
    cargarMas,
    quitar,
  } = useWatchlist();

  if (cargandoSesion) {
    return (
      <p role="status" className="text-muted">
        Cargando tu sesión…
      </p>
    );
  }

  if (!user) {
    return (
      <Card as="section" padding="lg" elevated className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          titulo="Tu watchlist"
          descripcion="Iniciá sesión para guardar títulos y consultar tu lista desde cualquier dispositivo."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to={RUTAS.INICIAR_SESION} fullWidth={false}>
            Iniciar sesión
          </ButtonLink>
          <ButtonLink to={RUTAS.REGISTRO} variant="secondary" fullWidth={false}>
            Crear cuenta
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        titulo="Mi watchlist"
        descripcion="Los títulos que guardaste para ver más tarde."
      />

      {error && <Alert onRetry={reintentar}>{error}</Alert>}

      {cargando && (
        <>
          <p role="status" aria-live="polite" className="sr-only">
            Cargando tu watchlist…
          </p>
          <ul aria-hidden="true" className={GRILLA_CLASS_NAME}>
            {TARJETAS_CARGANDO.map((indice) => (
              <Card as="li" key={indice} padding="none" className="overflow-hidden">
                <Skeleton shape="fill" className="aspect-2/3" />
                <div className="space-y-3 p-4">
                  <Skeleton shape="pill" className="h-6 w-16" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </ul>
        </>
      )}

      {!cargando && !error && titulos.length === 0 && (
        <Card padding="none" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <IconBadge icon={BookmarkIcon} />
          <h2 className="font-sans text-xl font-semibold">Todavía no agregaste títulos</h2>
          <p className="text-muted">Cuando encuentres algo para ver, guardalo desde su detalle.</p>
          <ButtonLink to={RUTAS.BUSQUEDA} size="compact" fullWidth={false} className="mt-2">
            Buscar títulos
          </ButtonLink>
        </Card>
      )}

      {titulos.length > 0 && (
        <>
          <p role="status" aria-live="polite" className="text-sm text-muted">
            Mostrando {titulos.length} de {totalResultados}{' '}
            {totalResultados === 1 ? 'título' : 'títulos'}
          </p>
          <ul className={GRILLA_CLASS_NAME}>
            {titulos.map((item) => {
              const key = `${item.titulo.tipo}:${item.titulo.tmdbId}`;
              return (
                <TarjetaWatchlist
                  key={item.id}
                  item={item}
                  quitando={pendientes.has(key)}
                  deshabilitado={cargando || cargandoMas || pendientes.size > 0}
                  onQuitar={quitar}
                />
              );
            })}
          </ul>
          {pagina < totalPaginas && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="compact"
                fullWidth={false}
                onClick={cargarMas}
                disabled={cargando || Boolean(error) || pendientes.size > 0}
                loading={cargandoMas}
                loadingText="Cargando…"
              >
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
