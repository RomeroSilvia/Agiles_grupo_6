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
