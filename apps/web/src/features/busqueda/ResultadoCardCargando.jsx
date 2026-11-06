import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

export function ResultadoCardCargando() {
  return (
    <Card aria-hidden="true" padding="none" className="flex overflow-hidden sm:flex-col">
      <Skeleton shape="fill" className="aspect-2/3 w-28 shrink-0 sm:w-auto" />
      <div className="flex-1 space-y-3 p-4">
        <Skeleton shape="pill" className="h-6 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  );
}
