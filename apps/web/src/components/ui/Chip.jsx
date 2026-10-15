export function Chip({ children, className = '' }) {
  return (
    <span
      className={`inline-flex rounded-full bg-chip px-2.5 py-1 font-mono text-xs font-medium text-chip-foreground ${className}`}
    >
      {children}
    </span>
  );
}
