import { useState } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { ExternalLink } from '../../components/ui/ExternalLink.jsx';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
} from '../../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { formatearFechaEvento } from './fechaEvento.js';

export function EventoCard({ evento }) {
  const [imagenFallida, setImagenFallida] = useState(false);
  return (
    <Card as="article" padding="none" elevated className="flex h-full flex-col overflow-hidden">
      <div className="relative aspect-2/1 overflow-hidden bg-chip">
        {evento.imagenUrl && !imagenFallida ? (
          <img
            src={evento.imagenUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImagenFallida(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-3 text-chip-foreground">
            <CalendarIcon className="size-8" />
            <span className="font-display text-2xl font-bold">Cooltura</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="font-display text-xl leading-snug font-bold wrap-break-word">
          {evento.nombre}
        </h3>
        <div className="space-y-3 text-sm text-muted">
          <p className="flex items-start gap-2">
            <CalendarIcon className="mt-0.5 size-4 shrink-0" />
            {evento.inicio || evento.fecha ? (
              <time dateTime={evento.inicio ?? evento.fecha}>{formatearFechaEvento(evento)}</time>
            ) : (
              <span>{formatearFechaEvento(evento)}</span>
            )}
          </p>
          <p className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              {evento.lugar ?? 'Lugar a confirmar'}
              {evento.direccion && <span className="block">{evento.direccion}</span>}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <TicketIcon className="mt-0.5 size-4 shrink-0" />
            <span>{evento.precioTexto ?? 'Consultá el precio en la publicación'}</span>
          </p>
        </div>
        <ExternalLink
          href={evento.url}
          aria-label={`Ver ${evento.nombre} en AllEvents (abre en otra pestaña)`}
          className={`mt-auto inline-flex min-h-11 items-center justify-between gap-3 rounded-field border border-border-strong px-4 py-2 text-sm font-bold text-link transition-colors hover:bg-chip ${FOCUS_RING_CLASS_NAME}`}
        >
          Ver evento en AllEvents <ArrowUpRightIcon className="size-4 shrink-0" />
        </ExternalLink>
      </div>
    </Card>
  );
}
