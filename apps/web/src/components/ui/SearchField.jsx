import { SearchIcon } from './icons.jsx';
import { fieldClassName } from './fieldClassName.js';

export function SearchField({ tone, type = 'search', ...props }) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
      <input {...props} type={type} className={fieldClassName({ tone, leadingIcon: true })} />
    </div>
  );
}
