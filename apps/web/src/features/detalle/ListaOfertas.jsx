import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { ETIQUETAS_OFERTA } from './detalle.constants.js';
import { ListaPlataformasOferta } from './ListaPlataformasOferta.jsx';

export function ListaOfertas({ ofertas, nombreTitulo, etiquetaLista = 'Plataformas disponibles' }) {
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
            />
          </section>
        );
      })}
    </div>
  );
}
