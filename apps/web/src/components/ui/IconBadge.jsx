const TONES = {
  primary: 'bg-chip text-chip-foreground',
  danger: 'bg-danger-surface text-danger',
};

export function IconBadge({ icon: Icon, tone = 'primary', className = '' }) {
  return (
    <span
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${TONES[tone]} ${className}`}
    >
      <Icon className="size-5" />
    </span>
  );
}
