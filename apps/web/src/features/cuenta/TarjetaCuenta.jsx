import { CARD_CLASS_NAME } from '../../components/ui/surface.js';

export function TarjetaCuenta({ id, titulo, descripcion, peligro = false, children }) {
  const tituloId = `${id}-titulo`;

  return (
    <section
      id={id}
      aria-labelledby={tituloId}
      className={`scroll-mt-6 p-5 sm:p-6 ${
        peligro ? 'rounded-xl border border-danger/30 bg-danger-surface' : CARD_CLASS_NAME
      }`}
    >
      <h2 id={tituloId} className={`text-xl font-bold ${peligro ? 'text-danger' : ''}`}>
        {titulo}
      </h2>
      {descripcion && <div className="mt-1 leading-relaxed text-muted">{descripcion}</div>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
