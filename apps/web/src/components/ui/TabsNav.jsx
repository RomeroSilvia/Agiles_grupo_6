import { NavLink } from 'react-router';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

export function TabsNav({ label, tabs }) {
  return (
    <nav aria-label={label} className="overflow-x-auto">
      <ul className="flex min-w-max gap-6 border-b border-border">
        {tabs.map(({ to, label: texto, Icono }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `-mb-px inline-flex min-h-11 items-center gap-2 rounded-t-sm border-b-2 px-1 text-sm transition-colors duration-150 ${isActive ? 'border-primary font-bold text-foreground' : 'border-transparent text-muted hover:text-foreground'} ${FOCUS_RING_CLASS_NAME}`
              }
            >
              {Icono && <Icono className="size-4" />}
              {texto}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
