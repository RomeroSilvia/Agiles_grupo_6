import { REGION_SOURCE } from '@buscador/shared/constants';
import { useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { useSession } from '../contexts/session/SessionContext.js';
import { useRegion } from '../contexts/region/RegionContext.js';
import { LogoInicio } from '../components/ui/LogoInicio.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Attribution } from '../components/ui/Attribution.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { MenuIcon, XIcon } from '../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../components/ui/focusRing.js';
import { MenuUsuario } from './MenuUsuario.jsx';
import { RUTAS } from './rutas.js';

const ENLACES = [
  { to: RUTAS.MIS_PLATAFORMAS, label: 'Mis plataformas' },
  { to: RUTAS.PERFIL, label: 'Perfil' },
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
  const { user, loading } = useSession();

  if (loading) {
    return null;
  }

  if (user) {
    return <MenuUsuario />;
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
  const { user } = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollRestoration />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:gap-3">
          <LogoInicio className={FOCUS_RING_CLASS_NAME} />
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
