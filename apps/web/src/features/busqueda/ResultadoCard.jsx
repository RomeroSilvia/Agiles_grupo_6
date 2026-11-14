import { Link } from 'react-router';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { rutaDetalle } from '../../app/rutas.js';
import { ETIQUETAS_TIPO_TITULO_SINGULAR, MAX_LOGOS_POR_CARD } from './busqueda.constants.js';
import { DatosTitulo } from './DatosTitulo.jsx';

function obtenerEtiquetaEnlace(nombre, plataformas = []) {
  if (plataformas.length === 0) {
    return `Ver detalle de ${nombre}`;
  }
  const nombresPlataformas = plataformas.map((plataforma) => plataforma.nombre).join(', ');
  return `Ver detalle de ${nombre}, disponible en ${nombresPlataformas}`;
}

export function ResultadoCard({ resultado, contenidoAdicional }) {
  const plataformas = resultado.plataformas ?? [];
  const visibles = plataformas.slice(0, MAX_LOGOS_POR_CARD);
  const ocultas = plataformas.length - visibles.length;
  const nombre = resultado.nombre ?? 'Título no disponible';

  return (
    <Link
      to={rutaDetalle(resultado.tipo, resultado.tmdbId)}
      state={{ desdeBusqueda: true }}
      aria-label={obtenerEtiquetaEnlace(nombre, plataformas)}
      className={`group block h-full rounded-card ${FOCUS_RING_CLASS_NAME}`}
    >
      <Card
        as="article"
        padding="none"
        elevated
        className="flex h-full overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:flex-col"
      >
        <Poster
          posterUrl={resultado.posterUrl}
          nombre={nombre}
          className="aspect-2/3 w-28 shrink-0 sm:w-auto"
        />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <Chip className="self-start">{ETIQUETAS_TIPO_TITULO_SINGULAR[resultado.tipo]}</Chip>
          <SectionTitle as="h3" size="card" className="line-clamp-2 text-foreground">
            {nombre}
          </SectionTitle>
          <DatosTitulo anio={resultado.anio} puntuacion={resultado.puntuacion} />
          {contenidoAdicional && <p className="text-sm text-muted">{contenidoAdicional}</p>}
          {visibles.length > 0 && (
            <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
              {visibles.map((plataforma) => (
                <span key={plataforma.id} title={plataforma.nombre} className="inline-flex">
                  <LogoPlataforma plataforma={plataforma} size="small" />
                </span>
              ))}
              {ocultas > 0 && (
                <span className="font-mono text-xs font-medium text-muted">+{ocultas}</span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
