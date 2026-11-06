const CARD_TONES = {
  surface: 'border-border bg-surface',
  inset: 'border-border bg-background',
  danger: 'border-danger/30 bg-danger-surface',
};

const CARD_PADDINGS = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export function cardClassName({
  tone = 'surface',
  padding = 'md',
  elevated = false,
  className = '',
} = {}) {
  return `rounded-card border ${CARD_TONES[tone]} ${CARD_PADDINGS[padding]} ${elevated ? 'shadow-sm' : ''} ${className}`;
}

export const CARD_CLASS_NAME = cardClassName({ padding: 'none' });

export const HOVER_SURFACE_CLASS_NAME = 'transition-colors duration-150 hover:bg-border/60';
