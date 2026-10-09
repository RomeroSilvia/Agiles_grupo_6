import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

export function IconButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-border/60 hover:text-foreground ${FOCUS_RING_CLASS_NAME} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
