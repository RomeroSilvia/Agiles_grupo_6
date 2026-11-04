export const TOOLTIP_TRIGGER_CLASS_NAME = 'group relative';

export function Tooltip({ id, decorative = false, children }) {
  return (
    <span
      id={id}
      role={decorative ? undefined : 'tooltip'}
      aria-hidden={decorative || undefined}
      className="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-56 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-center text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
    >
      {children}
    </span>
  );
}
