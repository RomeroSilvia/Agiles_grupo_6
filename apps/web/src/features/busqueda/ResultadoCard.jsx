import { Link } from 'react-router';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { rutaDetalle } from '../../app/rutas.js';
import { formatearPuntuacion } from '../../utils/formatearPuntuacion.js';
import { ETIQUETAS_TIPO_TITULO, MAX_LOGOS_POR_CARD } from './busqueda.constants.js';

export const resultadoCardClassName =
  'overflow-hidden rounded-2xl border border-border bg-surface shadow-sm';

function obtenerEtiquetaEnlace({ nombre, plataformas = [] }) {
  const nombreTitulo = nombre ?? 'Título no disponible';
  if (plataformas.length === 0) {
    return `Ver detalle de ${nombreTitulo}`;
  }
  const nombresPlataformas = plataformas.map((plataforma) => plataforma.nombre).join(', ');
  return `Ver detalle de ${nombreTitulo}, disponible en ${nombresPlataformas}`;
}

export function ResultadoCard({ resultado }) {
  const plataformas = resultado.plataformas ?? [];
  const visibles = plataformas.slice(0, MAX_LOGOS_POR_CARD);
  const ocultas = plataformas.length - visibles.length;
  const nombre = resultado.nombre ?? 'Título no disponible';
  const puntuacion = formatearPuntuacion(resultado.puntuacion);

  return (
    <Link
      to={rutaDetalle(resultado.tipo, resultado.tmdbId)}
      state={{ desdeBusqueda: true }}
      aria-label={obtenerEtiquetaEnlace(resultado)}
      className={`group block h-full rounded-2xl ${FOCUS_RING_CLASS_NAME}`}
    >
      <article
        className={`${resultadoCardClassName} flex h-full flex-col transition group-hover:-translate-y-0.5 group-hover:shadow-md`}
      >
        <Poster posterUrl={resultado.posterUrl} nombre={nombre} className="aspect-2/3" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <Chip>{ETIQUETAS_TIPO_TITULO[resultado.tipo]}</Chip>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">{nombre}</h3>
          <p className="text-sm text-muted">
            {resultado.anio ?? 'Año desconocido'}
            {puntuacion && ` · ${puntuacion}`}
          </p>
          {visibles.length > 0 && (
            <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
              {visibles.map((plataforma) => (
                <span key={plataforma.id} title={plataforma.nombre} className="inline-flex">
                  <LogoPlataforma plataforma={plataforma} />
                </span>
              ))}
              {ocultas > 0 && (
                <span className="font-mono text-xs font-medium text-muted">+{ocultas}</span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
