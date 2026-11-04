import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

export function DetalleTituloCargando() {
  return (
    <section className="space-y-8">
      <p role="status" aria-live="polite" className="sr-only">
        Cargando detalle del título...
      </p>
      <Skeleton className="h-5 w-40" />
      <Card
        aria-hidden="true"
        padding="lg"
        elevated
        className="grid gap-8 md:grid-cols-[minmax(12rem,18rem)_1fr]"
      >
        <Skeleton shape="block" className="mx-auto aspect-2/3 w-full max-w-xs" />
        <div className="space-y-5">
          <Skeleton shape="pill" className="h-6 w-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-11 w-52" />
          <div className="grid max-w-md grid-cols-2 gap-4">
            <Skeleton shape="block" className="h-20" />
            <Skeleton shape="block" className="h-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3">
            <Skeleton shape="block" className="size-12" />
            <Skeleton shape="block" className="size-12" />
            <Skeleton shape="block" className="size-12" />
          </div>
        </div>
      </Card>
    </section>
  );
}
