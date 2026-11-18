import { Card } from '../../components/ui/Card.jsx';
import { formatearNumero } from '../../utils/formatearNumero.js';
import { textoNuevosPeriodo } from './administracion.constants.js';

export function TarjetaTotal({ label, Icono, valor, nuevos, diasPeriodo }) {
  const mostrarNuevos = nuevos !== undefined && diasPeriodo !== null;

  return (
    <Card as="dl" className="flex flex-col gap-2">
      <dt className="flex items-start gap-2 text-sm text-muted">
        <Icono className="mt-0.5 size-4 shrink-0" />
        {label}
      </dt>
      <dd className="font-display text-3xl font-bold sm:text-4xl">{formatearNumero(valor)}</dd>
      {mostrarNuevos && (
        <dd className="text-sm font-medium text-success">
          {textoNuevosPeriodo(nuevos, diasPeriodo)}
        </dd>
      )}
    </Card>
  );
}
