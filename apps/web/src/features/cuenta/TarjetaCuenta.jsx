import { Card } from '../../components/ui/Card.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

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
      <SectionTitle id={tituloId} className={peligro ? 'text-danger' : ''}>
        {titulo}
      </SectionTitle>
      {descripcion && <div className="mt-1 leading-relaxed text-muted">{descripcion}</div>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
