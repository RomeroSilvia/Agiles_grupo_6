import { IconButton } from './IconButton.jsx';
import { XIcon } from './icons.jsx';

const SIZES = {
  sm: 'px-2.5 py-1 font-mono text-xs',
  md: 'px-3 py-1.5 text-sm',
};

export function Chip({ size = 'sm', onRemove, removeLabel, className = '', children }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-chip font-medium text-chip-foreground ${SIZES[size]} ${className}`}
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
