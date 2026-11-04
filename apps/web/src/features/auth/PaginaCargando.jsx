import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

export function PaginaCargando() {
  return (
    <section className="space-y-6">
      <p role="status" aria-live="polite" className="sr-only">
        Cargando tu cuenta…
      </p>
      <Skeleton className="h-9 w-48" />
      <Card aria-hidden="true" padding="lg" className="space-y-4 lg:max-w-sm">
        <div className="flex items-center gap-4">
          <Skeleton shape="pill" className="size-14 shrink-0" />
          <Skeleton className="h-5 flex-1" />
        </div>
        <Skeleton className="h-6 w-40" />
      </Card>
    </section>
  );
}
