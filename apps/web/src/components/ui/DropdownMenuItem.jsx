import { Link } from 'react-router';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

const itemClassName = `flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-left text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-border/60 focus:bg-border/60 ${FOCUS_RING_CLASS_NAME}`;

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
