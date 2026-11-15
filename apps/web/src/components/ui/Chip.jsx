import { IconButton } from './IconButton.jsx';
import { XIcon } from './icons.jsx';

const SIZES = {
  sm: 'px-2.5 py-1 font-mono text-xs',
  md: 'px-3 py-1.5 text-sm',
};

const VARIANTS = {
  filled: 'bg-chip text-chip-foreground',
  outline: 'border border-border text-muted',
};

export function Chip({
  size = 'sm',
  variant = 'filled',
  onRemove,
  removeLabel,
  className = '',
  children,
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-medium ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
      {onRemove && (
        <IconButton size="sm" aria-label={removeLabel} onClick={onRemove}>
          <XIcon className="size-3.5" />
        </IconButton>
      )}
    </span>
  );
}
