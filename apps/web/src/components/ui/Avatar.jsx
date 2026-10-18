export function Avatar({ email, className = 'size-9 text-sm' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-panel font-bold text-panel-foreground uppercase ${className}`}
    >
      {email[0]}
    </span>
  );
}
