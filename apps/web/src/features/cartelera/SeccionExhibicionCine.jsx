import { TIPO_TITULO } from '@buscador/shared/constants';
import { Alert } from '../../components/ui/Alert.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { SeccionFunciones } from './SeccionFunciones.jsx';
import { useExhibicionCine } from './useExhibicionCine.js';

export function SeccionExhibicionCine({ tipo, tmdbId }) {
  const { consultable, loading, error, reintentar } = useExhibicionCine({ tipo, tmdbId });
  if (tipo !== TIPO_TITULO.PELICULA || consultable === false) return null;
  if (consultable) return <SeccionFunciones key={tmdbId} tmdbId={tmdbId} />;

  return (
    <section aria-labelledby="exhibicion-cine-titulo" className="space-y-4">
      <SectionTitle id="exhibicion-cine-titulo">Cines y funciones</SectionTitle>
      {loading && <p role="status">Verificando exhibición en cines…</p>}
      {error && (
        <Alert onRetry={reintentar} retryLabel="Reintentar exhibición">
          {error}
        </Alert>
      )}
    </section>
  );
}
