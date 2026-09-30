import { Link } from 'react-router';
import { Logo } from '../../components/ui/Logo.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

/**
 * Pantallas de ingreso: en escritorio, panel oscuro con el mensaje a la izquierda
 * y el formulario a la derecha. En celular solo el logo y el formulario.
 *
 * @param {{ aside: import('react').ReactNode, children: import('react').ReactNode }} props
 */
export function AuthLayout({ aside, children }) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-panel p-12 text-panel-foreground lg:flex xl:p-16">
        <Link
          to="/"
          aria-label="Streamly, ir al inicio"
          className="self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-panel-accent"
        >
          <Logo />
        </Link>
        <div className="max-w-md">{aside}</div>
        <p className="font-mono text-xs tracking-wide text-panel-muted">
          Datos de TMDB y JustWatch
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            to="/"
            aria-label="Streamly, ir al inicio"
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:hidden"
          >
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}
