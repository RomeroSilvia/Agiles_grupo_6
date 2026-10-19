import { FOCUS_RING_CLASS_NAME } from './focusRing.js';
import { HOVER_SURFACE_CLASS_NAME } from './surface.js';

export function IconButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-muted hover:text-foreground ${HOVER_SURFACE_CLASS_NAME} ${FOCUS_RING_CLASS_NAME} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
