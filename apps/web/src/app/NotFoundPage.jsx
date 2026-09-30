import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-extrabold tracking-tight">Página no encontrada</h1>
      <Link to="/" className="font-semibold text-link underline underline-offset-4">
        Volver al inicio
      </Link>
    </section>
  );
}
