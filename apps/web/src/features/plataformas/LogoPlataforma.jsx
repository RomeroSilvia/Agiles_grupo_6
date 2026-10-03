import { useState } from 'react';
import { TMDB_LOGO_BASE_URL } from '@buscador/shared/constants';

export function LogoPlataforma({ plataforma }) {
  const [logoFallido, setLogoFallido] = useState(false);
  const { tmdbProviderId, nombre, logoPath } = plataforma;

  if (logoPath && !logoFallido) {
    return (
      <img
        src={`${TMDB_LOGO_BASE_URL}${logoPath}`}
        alt={`Logo de ${nombre}`}
        onError={() => setLogoFallido(true)}
        className="size-10 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      data-plataforma={tmdbProviderId}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-plataforma text-sm font-bold text-plataforma-foreground uppercase"
    >
      {nombre[0]}
    </span>
  );
}
