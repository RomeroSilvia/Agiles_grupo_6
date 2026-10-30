import { ETIQUETAS_OFERTA } from './detalle.constants.js';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';

export function ListaOfertas({ ofertas, nombreTitulo, etiquetaLista = 'Plataformas disponibles' }) {
  return (
    <div className="space-y-4">
      {ofertas.map(({ tipoOferta, plataformas }) => {
        const etiquetaOferta = ETIQUETAS_OFERTA[tipoOferta] ?? tipoOferta;

        return (
          <section key={tipoOferta} aria-label={etiquetaOferta} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted">{etiquetaOferta}</h3>
            <ul
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              aria-label={`${etiquetaLista}: ${etiquetaOferta}`}
            >
              {plataformas.map(({ plataforma, esPropia }) => (
                <li key={plataforma.id}>
                  <TarjetaDisponibilidad
                    plataforma={plataforma}
                    esPropia={esPropia}
                    nombreTitulo={nombreTitulo}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
