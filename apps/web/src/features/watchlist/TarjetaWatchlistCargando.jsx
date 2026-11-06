import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

export function TarjetaWatchlistCargando() {
  return (
    <Card as="li" padding="none" className="overflow-hidden">
      <Skeleton shape="fill" className="aspect-2/3" />
      <div className="space-y-3 p-4">
        <Skeleton shape="pill" className="h-6 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}
