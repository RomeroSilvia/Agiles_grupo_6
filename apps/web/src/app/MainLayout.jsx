import { Link, Outlet } from 'react-router';
import { useSession } from '../contexts/session/SessionContext.js';
import { useRegion } from '../contexts/region/RegionContext.js';
import { Logo } from '../components/ui/Logo.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Attribution } from '../components/ui/Attribution.jsx';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function AccionesDeSesion() {
  const { user, loading, signOut } = useSession();

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span
          title={user.email}
          aria-label={`Sesión iniciada como ${user.email}`}
          className="inline-flex size-9 items-center justify-center rounded-full bg-panel text-sm font-bold text-panel-foreground uppercase"
        >
          {user.email[0]}
        </span>
        <button
          type="button"
          onClick={signOut}
          className={`inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 text-sm font-semibold text-muted transition-colors duration-150 hover:text-foreground ${focusRing}`}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        to="/iniciar-sesion"
        className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-foreground transition-colors duration-150 hover:text-link ${focusRing}`}
      >
        Iniciar sesión
      </Link>
      <Link
        to="/registro"
        className={`inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors duration-150 hover:bg-accent-hover ${focusRing}`}
      >
        Crear cuenta
      </Link>
    </div>
  );
}

export function MainLayout() {
  const { region } = useRegion();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:gap-3">
          <Link
            to="/"
            aria-label="Streamly, ir al inicio"
            className={`mr-auto rounded-sm ${focusRing}`}
          >
            <Logo />
          </Link>
          <span
            aria-label={`Región: ${region}`}
            className="hidden rounded-full bg-chip px-3 py-1 font-mono text-xs font-medium text-chip-foreground sm:inline-flex"
          >
            {region}
          </span>
          <ThemeToggle />
          <AccionesDeSesion />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <Attribution />
        </div>
      </footer>
    </div>
  );
}
