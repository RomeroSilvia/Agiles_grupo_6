import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { tarjetaClassName } from './TarjetaPlataforma.jsx';

export function TarjetaPlataformaCargando() {
  return (
    <li aria-hidden="true" className={tarjetaClassName}>
      <Skeleton shape="fill" className="size-10 shrink-0 rounded-lg" />
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton shape="pill" className="h-6.5 w-11 shrink-0" />
    </li>
  );
}
