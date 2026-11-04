import { Link } from 'react-router';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { TrashIcon } from '../../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { rutaDetalle } from '../../app/rutas.js';
import { ETIQUETAS_TIPO_TITULO_SINGULAR } from '../busqueda/busqueda.constants.js';
import { DatosTitulo } from '../busqueda/DatosTitulo.jsx';

export function TarjetaWatchlist({ item, quitando, deshabilitado = false, onQuitar }) {
  const { titulo } = item;
  const nombre = titulo.nombre ?? 'Título no disponible';

  return (
    <Card as="li" padding="none" elevated className="flex flex-col overflow-hidden">
      <Link
        to={rutaDetalle(titulo.tipo, titulo.tmdbId)}
        aria-label={`Ver detalle de ${nombre}`}
        className={`group flex flex-1 flex-col rounded-t-card ${FOCUS_RING_CLASS_NAME}`}
      >
        <Poster posterUrl={titulo.posterUrl} nombre={nombre} className="aspect-2/3" />
        <div className="space-y-2 p-4">
          <Chip>{ETIQUETAS_TIPO_TITULO_SINGULAR[titulo.tipo]}</Chip>
          <h2 className="line-clamp-2 font-sans text-base font-semibold group-hover:underline">
            {nombre}
          </h2>
          <DatosTitulo anio={titulo.anio} puntuacion={titulo.puntuacion} />
        </div>
      </Link>
      <div className="border-t border-border p-3">
        <Button
          variant="secondary"
          size="sm"
          loading={quitando}
          loadingText="Quitando…"
          disabled={deshabilitado}
          onClick={() => onQuitar({ tipo: titulo.tipo, tmdbId: titulo.tmdbId })}
          aria-label={`Quitar ${nombre} de la watchlist`}
        >
          <TrashIcon className="size-4" />
          Quitar
        </Button>
      </div>
    </Card>
  );
}
