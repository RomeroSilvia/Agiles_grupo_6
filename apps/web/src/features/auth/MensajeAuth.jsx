import { IconBadge } from '../../components/ui/IconBadge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';

export function MensajeAuth({ icono, tono, titulo, children, acciones }) {
  return (
    <div role="status">
      <IconBadge icon={icono} tone={tono} />
      <PageHeader titulo={titulo} className="mt-6" />
      <div className="mt-3 space-y-2 leading-relaxed text-muted">{children}</div>
      {acciones && <div className="mt-8 space-y-4 text-center">{acciones}</div>}
    </div>
  );
}
