import { Card } from '../../components/ui/Card.jsx';

export function TarjetaCuenta({ id, titulo, descripcion, peligro = false, children }) {
  const tituloId = `${id}-titulo`;

  return (
    <Card
      as="section"
      id={id}
      aria-labelledby={tituloId}
      tone={peligro ? 'danger' : 'surface'}
      padding="lg"
      className="scroll-mt-6"
    >
      <h2
        id={tituloId}
        className={`font-sans text-xl font-semibold ${peligro ? 'text-danger' : ''}`}
      >
        {titulo}
      </h2>
      {descripcion && <div className="mt-1 leading-relaxed text-muted">{descripcion}</div>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
