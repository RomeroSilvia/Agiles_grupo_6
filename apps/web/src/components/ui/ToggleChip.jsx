import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

export function ToggleChip({
  pressed = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS_RING_CLASS_NAME} ${
        pressed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-surface text-foreground hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
