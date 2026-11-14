import { useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { useSession } from '../contexts/session/SessionContext.js';
import { useRegion } from '../contexts/region/RegionContext.js';
import { getRegionLabel } from '../contexts/region/regionLabel.js';
import { Chip } from '../components/ui/Chip.jsx';
import { LogoInicio } from '../components/ui/LogoInicio.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Attribution } from '../components/ui/Attribution.jsx';
import { ButtonLink } from '../components/ui/ButtonLink.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { BookmarkIcon, MenuIcon, XIcon } from '../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../components/ui/focusRing.js';
import { MenuUsuario } from './MenuUsuario.jsx';
import { ENLACE_PANEL_ADMIN } from '../features/administracion/administracion.constants.js';
import { RUTAS } from './rutas.js';

const ENLACES = [
  { to: RUTAS.WATCHLIST, label: 'Mi watchlist' },
  { to: RUTAS.MIS_PLATAFORMAS, label: 'Mis plataformas' },
  { to: RUTAS.PERFIL, label: 'Perfil' },
  { to: RUTAS.ADMIN, label: ENLACE_PANEL_ADMIN, soloAdmin: true },
];

function Enlaces({ onNavigate }) {
  const { user } = useSession();
  const enlaces = ENLACES.filter(({ soloAdmin }) => !soloAdmin || user?.esAdmin);

  return enlaces.map(({ to, label }) => (
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
  const { user, loading } = useSession();

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <MenuUsuario />
        {user.esAdmin && (
          <span className="hidden sm:inline-flex">
            <Chip className="uppercase">Admin</Chip>
          </span>
        )}
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
      <span className="hidden sm:inline-flex">
        <ButtonLink to={RUTAS.REGISTRO} variant="accent" size="sm" fullWidth={false}>
          Crear cuenta
        </ButtonLink>
      </span>
    </div>
  );
}

export function MainLayout() {
  const { region, source, loading: regionLoading } = useRegion();
  const { user } = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollRestoration />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-1 px-2 py-2 sm:gap-3 sm:px-4">
          <LogoInicio className={FOCUS_RING_CLASS_NAME} />
          <NavLink
            to={RUTAS.CARTELERA}
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center rounded-sm px-2 text-sm transition-colors duration-150 hover:text-foreground ${isActive ? 'font-bold text-foreground' : 'text-muted'} ${FOCUS_RING_CLASS_NAME}`
            }
          >
            Cartelera
          </NavLink>
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
                aria-label={`${getRegionLabel(source)}: ${region}`}
                className="hidden sm:inline-flex"
              >
                <Chip>{region}</Chip>
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
