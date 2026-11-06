import { useState } from 'react';
import { TMDB_LOGO_BASE_URL } from '@buscador/shared/constants';

const SIZES = {
  small: 'size-6 rounded-md text-xs',
  medium: 'size-10 rounded-lg text-sm',
};

export function LogoPlataforma({ plataforma, size = 'medium', inactiva = false }) {
  const [logoFallido, setLogoFallido] = useState(false);
  const { tmdbProviderId, nombre, logoPath } = plataforma;
  const sizeClassName = SIZES[size];

  if (logoPath && !logoFallido) {
    return (
      <img
        src={`${TMDB_LOGO_BASE_URL}${logoPath}`}
        alt={`Logo de ${nombre}`}
        onError={() => setLogoFallido(true)}
        className={`${sizeClassName} shrink-0 object-cover ${inactiva ? 'opacity-60 grayscale' : ''}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      data-plataforma={inactiva ? undefined : tmdbProviderId}
      className={`inline-flex ${sizeClassName} shrink-0 items-center justify-center font-bold uppercase ${
        inactiva
          ? 'bg-plataforma-inactiva text-plataforma-inactiva-foreground'
          : 'bg-plataforma text-plataforma-foreground'
      }`}
    >
      {nombre[0]}
    </span>
  );
}
