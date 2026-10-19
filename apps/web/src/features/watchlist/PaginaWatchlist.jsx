import { Link } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { Button } from '../../components/ui/Button.jsx';
import { useSession } from '../../contexts/session/SessionContext.js';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { TarjetaWatchlist } from './TarjetaWatchlist.jsx';
import { useWatchlist } from './useWatchlist.js';

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
      <section className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Tu watchlist</h1>
        <p className="leading-7 text-muted">
          Iniciá sesión para guardar títulos y consultar tu lista desde cualquier dispositivo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={RUTAS.INICIAR_SESION}
            className={`inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover ${LINK_CLASS_NAME}`}
          >
            Iniciar sesión
          </Link>
          <Link
            to={RUTAS.REGISTRO}
            className={`inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-5 font-semibold text-foreground hover:bg-background ${LINK_CLASS_NAME}`}
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Mi watchlist</h1>
        <p className="text-muted">Los títulos que guardaste para ver más tarde.</p>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-surface p-4 text-danger sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button onClick={reintentar} className="sm:w-auto">
            Reintentar
          </Button>
        </div>
      )}

      {cargando && (
        <p role="status" aria-live="polite" className="text-muted">
          Cargando tu watchlist…
        </p>
      )}

      {!cargando && !error && titulos.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-10">
          <h2 className="text-xl font-semibold">Todavía no agregaste títulos</h2>
          <p className="mt-2 text-muted">
            Cuando encuentres algo para ver, guardalo desde su detalle.
          </p>
          <Link
            to={RUTAS.BUSQUEDA}
            className={`mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover ${LINK_CLASS_NAME}`}
          >
            Buscar títulos
          </Link>
        </div>
      )}

      {titulos.length > 0 && (
        <>
          <p role="status" aria-live="polite" className="text-sm text-muted">
            Mostrando {titulos.length} de {totalResultados}{' '}
            {totalResultados === 1 ? 'título' : 'títulos'}
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
