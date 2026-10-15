import { resultadoCardClassName } from './ResultadoCard.jsx';

export function ResultadoCardCargando() {
  return (
    <div
      aria-hidden="true"
      className={`${resultadoCardClassName} animate-pulse motion-reduce:animate-none`}
    >
      <div className="aspect-2/3 bg-border" />
      <div className="space-y-3 p-4">
        <span className="block h-6 w-16 rounded-full bg-border" />
        <span className="block h-4 w-3/4 rounded bg-border" />
        <span className="block h-4 w-1/2 rounded bg-border" />
      </div>
    </div>
  );
}
