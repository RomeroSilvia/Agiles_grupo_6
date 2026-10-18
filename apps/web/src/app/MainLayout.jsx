import { REGION_SOURCE } from '@buscador/shared/constants';
import { useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { useSession } from '../contexts/session/SessionContext.js';
import { useRegion } from '../contexts/region/RegionContext.js';
import { LogoInicio } from '../components/ui/LogoInicio.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Attribution } from '../components/ui/Attribution.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { BookmarkIcon, MenuIcon, XIcon } from '../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../components/ui/focusRing.js';
import { RUTAS } from './rutas.js';

const cerrarSesionClassName = `cursor-pointer items-center text-sm font-semibold text-muted transition-colors duration-150 hover:text-foreground ${FOCUS_RING_CLASS_NAME}`;

const ENLACES = [
  { to: RUTAS.WATCHLIST, label: 'Mi watchlist' },
  { to: RUTAS.MIS_PLATAFORMAS, label: 'Mis plataformas' },
];

function Enlaces({ onNavigate }) {
  return ENLACES.map(({ to, label }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `inline-flex min-h-11 items-center rounded-sm text-sm transition-colors duration-150 hover:text-foreground ${isActive ? 'font-bold text-foreground' : 'text-muted'} ${FOCUS_RING_CLASS_NAME}`
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
        to={RUTAS.INICIAR_SESION}
        className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold whitespace-nowrap text-foreground transition-colors duration-150 hover:text-link ${FOCUS_RING_CLASS_NAME}`}
      >
        {/* En celular no entran los dos botones junto al logo: queda solo "Ingresar" */}
        <span className="sm:hidden">Ingresar</span>
        <span className="hidden sm:inline">Iniciar sesión</span>
      </Link>
      <Link
        to={RUTAS.REGISTRO}
        className={`hidden min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold whitespace-nowrap text-accent-foreground transition-colors duration-150 hover:bg-accent-hover sm:inline-flex ${FOCUS_RING_CLASS_NAME}`}
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-1 px-2 py-2 sm:gap-3 sm:px-4">
          <LogoInicio className={FOCUS_RING_CLASS_NAME} />
          {user && (
            <nav aria-label="Principal" className="ml-4 hidden items-center gap-6 md:flex">
              <Enlaces />
            </nav>
          )}
          {!user && (
            <Link
              to={RUTAS.WATCHLIST}
              aria-label="Mi watchlist"
              title="Mi watchlist"
              className={`ml-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-border/60 hover:text-foreground sm:ml-2 sm:w-auto sm:px-3 ${FOCUS_RING_CLASS_NAME}`}
            >
              <BookmarkIcon className="size-5 sm:hidden" />
              <span className="hidden text-sm font-semibold whitespace-nowrap sm:inline">
                Mi watchlist
              </span>
            </Link>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
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
