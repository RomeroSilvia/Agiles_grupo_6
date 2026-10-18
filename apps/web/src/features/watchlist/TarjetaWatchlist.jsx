import { Link } from 'react-router';
import { Button } from '../../components/ui/Button.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { rutaDetalle } from '../../app/rutas.js';
import { formatearPuntuacion } from '../../utils/formatearPuntuacion.js';
import { ETIQUETAS_TIPO_TITULO } from '../busqueda/busqueda.constants.js';

export function TarjetaWatchlist({ item, quitando, deshabilitado = false, onQuitar }) {
  const { titulo } = item;
  const nombre = titulo.nombre ?? 'Título no disponible';
  const puntuacion = formatearPuntuacion(titulo.puntuacion);

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <Link
        to={rutaDetalle(titulo.tipo, titulo.tmdbId)}
        aria-label={`Ver detalle de ${nombre}`}
        className={`group block rounded-t-2xl ${FOCUS_RING_CLASS_NAME}`}
      >
        <Poster posterUrl={titulo.posterUrl} nombre={nombre} className="aspect-2/3" />
        <div className="space-y-2 p-4">
          <Chip>{ETIQUETAS_TIPO_TITULO[titulo.tipo]}</Chip>
          <h2 className="line-clamp-2 font-semibold group-hover:underline">{nombre}</h2>
          <p className="text-sm text-muted">
            {titulo.anio ?? 'Año desconocido'}
            {puntuacion && ` · ${puntuacion}`}
          </p>
        </div>
      </Link>
      <div className="border-t border-border p-4">
        <Button
          variant="accent"
          loading={quitando}
          loadingText="Quitando…"
          disabled={deshabilitado}
          onClick={() => onQuitar({ tipo: titulo.tipo, tmdbId: titulo.tmdbId })}
          aria-label={`Quitar ${nombre} de la watchlist`}
        >
          Quitar de la watchlist
        </Button>
      </div>
    </li>
  );
}
