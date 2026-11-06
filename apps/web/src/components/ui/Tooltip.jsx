export const TOOLTIP_TRIGGER_CLASS_NAME = 'group relative';

export function Tooltip({ id, decorative = false, children }) {
  return (
    <span
      id={id}
      role={decorative ? undefined : 'tooltip'}
      aria-hidden={decorative || undefined}
      className="pointer-events-none invisible fixed inset-x-4 bottom-4 z-10 rounded-lg bg-foreground px-2.5 py-1.5 text-center text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 xl:absolute xl:right-auto xl:bottom-full xl:left-1/2 xl:mb-2 xl:w-max xl:max-w-56 xl:-translate-x-1/2"
    >
      {children}
    </span>
  );
}
