import { Card } from '../../components/ui/Card.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

export function TarjetaRanking({ titulo, descripcion, control, className = '', children }) {
  return (
    <Card as="section" aria-label={titulo} className={`space-y-5 ${className}`}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <SectionTitle as="h3" size="card">
            {titulo}
          </SectionTitle>
          <p className="text-sm text-muted">{descripcion}</p>
        </div>
        {control}
      </header>
      {children}
    </Card>
  );
}
