import { Link } from 'react-router';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';
import { HOVER_SURFACE_CLASS_NAME } from './surface.js';

const itemClassName = `flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-left text-sm font-semibold text-foreground focus:bg-border/60 ${HOVER_SURFACE_CLASS_NAME} ${FOCUS_RING_CLASS_NAME}`;

export function DropdownMenuItem({ to, onClick, children }) {
  if (to) {
    return (
      <Link to={to} role="menuitem" tabIndex={-1} onClick={onClick} className={itemClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onClick} className={itemClassName}>
      {children}
    </button>
  );
}
