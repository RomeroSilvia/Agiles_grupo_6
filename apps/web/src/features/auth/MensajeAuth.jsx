import { IconBadge } from '../../components/ui/IconBadge.jsx';

export function MensajeAuth({ icono, tono, titulo, children, acciones }) {
  return (
    <div role="status">
      <IconBadge icon={icono} tone={tono} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{titulo}</h1>
      <div className="mt-3 space-y-2 leading-relaxed text-muted">{children}</div>
      {acciones && <div className="mt-8 space-y-4 text-center">{acciones}</div>}
    </div>
  );
}
