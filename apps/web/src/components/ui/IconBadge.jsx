const TONES = {
  primary: 'bg-chip text-chip-foreground',
  danger: 'bg-danger-surface text-danger',
};

const SIZES = {
  md: 'size-11',
  sm: 'size-9',
};

export function IconBadge({ icon: Icon, tone = 'primary', size = 'md', className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      <Icon className="size-5" />
    </span>
  );
}
