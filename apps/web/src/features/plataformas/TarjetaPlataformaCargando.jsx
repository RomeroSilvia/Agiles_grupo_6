import { tarjetaClassName } from './TarjetaPlataforma.jsx';

export function TarjetaPlataformaCargando() {
  return (
    <li aria-hidden="true" className={`${tarjetaClassName} animate-pulse`}>
      <span className="size-10 shrink-0 rounded-lg bg-border" />
      <span className="h-4 w-32 flex-1 rounded bg-border" />
      <span className="h-6.5 w-11 shrink-0 rounded-full bg-border" />
    </li>
  );
}
