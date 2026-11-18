import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { ETIQUETAS_OFERTA } from './detalle.constants.js';
import { ListaPlataformasOferta } from './ListaPlataformasOferta.jsx';

function idiomasDisponiblesEnOfertas(ofertas) {
  const plataformas = ofertas.flatMap((oferta) =>
    oferta.plataformas.map(({ plataforma }) => plataforma),
  );
  return (
    plataformas.length === 0 ||
    plataformas.some((plataforma) => plataforma.audios !== null || plataforma.subtitulos !== null)
  );
}

export function ListaOfertas({ ofertas, nombreTitulo, etiquetaLista = 'Plataformas disponibles' }) {
  const idiomasDisponibles = idiomasDisponiblesEnOfertas(ofertas);

  return (
    <div className="space-y-4">
      {ofertas.map(({ tipoOferta, plataformas }) => {
        const etiquetaOferta = ETIQUETAS_OFERTA[tipoOferta] ?? tipoOferta;

        return (
          <section key={tipoOferta} aria-label={etiquetaOferta} className="space-y-2">
            <SectionTitle as="h3" size="sub" className="text-foreground">
              {etiquetaOferta}
            </SectionTitle>
            <ListaPlataformasOferta
              plataformas={plataformas}
              nombreTitulo={nombreTitulo}
              etiqueta={`${etiquetaLista}: ${etiquetaOferta}`}
              mostrarIdiomas={idiomasDisponibles}
            />
          </section>
        );
      })}
      {!idiomasDisponibles && (
        <p className="text-sm text-muted">Los idiomas no están disponibles por el momento.</p>
      )}
    </div>
  );
}
