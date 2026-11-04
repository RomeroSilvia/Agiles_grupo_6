export const FIELD_LABEL_CLASS_NAME = 'block text-sm font-medium text-foreground';

const FIELD_TONES = {
  surface: 'bg-surface',
  inset: 'bg-background',
};

export function fieldClassName({
  invalid = false,
  tone = 'surface',
  leadingIcon = false,
  trailing = false,
} = {}) {
  return `block min-h-12 w-full rounded-field border px-3.5 text-base text-foreground transition-colors duration-150 placeholder:text-muted focus:border-primary focus:outline-2 focus:-outline-offset-1 focus:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${FIELD_TONES[tone]} ${
    invalid ? 'border-danger' : 'border-border-strong hover:border-muted'
  } ${leadingIcon ? 'pl-11' : ''} ${trailing ? 'pr-11' : ''}`;
}
