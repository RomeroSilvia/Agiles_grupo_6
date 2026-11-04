import { ETIQUETAS_OFERTA } from './detalle.constants.js';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';

export function ListaPlataformasOferta({ plataformas, nombreTitulo, etiqueta, size }) {
  return (
    <ul className="flex flex-wrap gap-3" aria-label={etiqueta}>
      {plataformas.map(({ plataforma, esPropia }) => (
        <li key={plataforma.id}>
          <TarjetaDisponibilidad
            plataforma={plataforma}
            esPropia={esPropia}
            nombreTitulo={nombreTitulo}
            size={size}
          />
        </li>
      ))}
    </ul>
  );
}

export function ListaOfertas({ ofertas, nombreTitulo, etiquetaLista = 'Plataformas disponibles' }) {
  return (
    <div className="space-y-4">
      {ofertas.map(({ tipoOferta, plataformas }) => {
        const etiquetaOferta = ETIQUETAS_OFERTA[tipoOferta] ?? tipoOferta;

        return (
          <section key={tipoOferta} aria-label={etiquetaOferta} className="space-y-2">
            <h3 className="font-sans text-sm font-medium text-foreground">{etiquetaOferta}</h3>
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
