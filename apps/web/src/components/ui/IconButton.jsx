import { FOCUS_RING_CLASS_NAME } from './focusRing.js';
import { HOVER_SURFACE_CLASS_NAME } from './surface.js';

const SIZES = {
  md: 'size-11 text-muted hover:text-foreground',
  sm: 'size-6 text-current',
};

export function IconButton({ size = 'md', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full ${SIZES[size]} ${HOVER_SURFACE_CLASS_NAME} ${FOCUS_RING_CLASS_NAME} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
