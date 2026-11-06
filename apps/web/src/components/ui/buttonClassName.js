import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-foreground hover:bg-background',
  outline: 'border border-primary text-primary hover:bg-primary/10',
  outlineDanger: 'border border-danger text-danger hover:bg-danger/10',
  danger: 'bg-danger text-danger-foreground hover:bg-danger/90',
  soft: 'border border-primary bg-chip text-chip-foreground hover:bg-chip/70',
};

const SIZES = {
  md: 'min-h-12 rounded-field px-5',
  compact: 'min-h-11 rounded-field px-5 py-2',
  sm: 'min-h-10 rounded-field px-4 py-1.5 text-sm',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  className = '',
} = {}) {
  return `inline-flex ${fullWidth ? 'w-full' : 'w-auto'} cursor-pointer items-center justify-center gap-2 font-semibold transition-colors duration-150 ${FOCUS_RING_CLASS_NAME} active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}
