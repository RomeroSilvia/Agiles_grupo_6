import { REGION_SOURCE } from '@buscador/shared/constants';
import { useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { useSession } from '../contexts/session/SessionContext.js';
import { useRegion } from '../contexts/region/RegionContext.js';
import { Logo } from '../components/ui/Logo.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Attribution } from '../components/ui/Attribution.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { MenuIcon, XIcon } from '../components/ui/icons.jsx';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const cerrarSesionClassName = `cursor-pointer items-center text-sm font-semibold text-muted transition-colors duration-150 hover:text-foreground ${focusRing}`;

const ENLACES = [{ to: '/mis-plataformas', label: 'Mis plataformas' }];

function Enlaces({ onNavigate }) {
  return ENLACES.map(({ to, label }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `inline-flex min-h-11 items-center rounded-sm text-sm transition-colors duration-150 hover:text-foreground ${isActive ? 'font-bold text-foreground' : 'text-muted'} ${focusRing}`
      }
    >
      {label}
    </NavLink>
  ));
}

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
          className={`hidden min-h-11 rounded-full px-3 md:inline-flex ${cerrarSesionClassName}`}
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
  const { region, source, loading: regionLoading } = useRegion();
  const { user, signOut } = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  function cerrarSesionDesdeMenu() {
    cerrarMenu();
    signOut();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollRestoration />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:gap-3">
          <Link to="/" aria-label="Streamly, ir al inicio" className={`rounded-sm ${focusRing}`}>
            <Logo />
          </Link>
          {user && (
            <nav aria-label="Principal" className="ml-4 hidden items-center gap-6 md:flex">
              <Enlaces />
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {!regionLoading && (
              <span
                aria-label={`${source === REGION_SOURCE.DEFAULT ? 'Región predeterminada' : 'Región'}: ${region}`}
                className="hidden rounded-full bg-chip px-3 py-1 font-mono text-xs font-medium text-chip-foreground sm:inline-flex"
              >
                {region}
              </span>
            )}
            <ThemeToggle />
            <AccionesDeSesion />
            {user && (
              <IconButton
                onClick={() => setMenuAbierto((abierto) => !abierto)}
                aria-expanded={menuAbierto}
                aria-controls="menu-mobile"
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                className="md:hidden"
              >
                {menuAbierto ? <XIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </div>
        </div>

        {user && menuAbierto && (
          <nav
            id="menu-mobile"
            aria-label="Menú"
            className="flex flex-col border-t border-border px-4 py-2 md:hidden"
          >
            <Enlaces onNavigate={cerrarMenu} />
            <button
              type="button"
              onClick={cerrarSesionDesdeMenu}
              className={`inline-flex min-h-11 rounded-sm ${cerrarSesionClassName}`}
            >
              Cerrar sesión
            </button>
          </nav>
        )}
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
