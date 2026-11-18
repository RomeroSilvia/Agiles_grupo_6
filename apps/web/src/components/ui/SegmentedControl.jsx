import { FIELD_LABEL_CLASS_NAME } from './fieldClassName.js';

const SIZES = {
  md: { group: 'grid', option: 'min-h-10 px-3 text-sm' },
  sm: { group: 'inline-grid', option: 'min-h-8 px-2.5 text-xs' },
};

export function SegmentedControl({
  legend,
  legendHidden = false,
  name,
  value,
  options,
  onChange,
  size = 'md',
}) {
  const sizeClassNames = SIZES[size];

  return (
    <fieldset className="space-y-1.5">
      <legend className={legendHidden ? 'sr-only' : FIELD_LABEL_CLASS_NAME}>{legend}</legend>
      <div
        className={`${sizeClassNames.group} auto-cols-fr grid-flow-col gap-1 rounded-field border border-border bg-background p-1`}
      >
        {options.map((opcion) => (
          <label key={opcion.value} className="relative">
            <input
              type="radio"
              name={name}
              value={opcion.value}
              checked={value === opcion.value}
              onChange={onChange}
              className="peer sr-only"
            />
            <span
              className={`flex ${sizeClassNames.option} cursor-pointer items-center justify-center rounded-lg font-semibold text-muted transition-colors duration-150 peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:text-foreground peer-checked:hover:text-primary-foreground`}
            >
              {opcion.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
