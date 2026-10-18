import { REGION_SOURCE } from '@buscador/shared/constants';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { TARJETA_PERFIL_CLASS_NAME } from './perfil.constants.js';

export function TarjetaIdentidad({ className = '' }) {
  const { user } = useSession();
  const { region, source, loading } = useRegion();

  return (
    <section
      aria-label="Datos de la cuenta"
      className={`${TARJETA_PERFIL_CLASS_NAME} p-5 ${className}`}
    >
      <div className="flex items-center gap-4">
        <Avatar email={user.email} className="size-14 text-xl" />
        <dl className="min-w-0">
          <dt className="font-mono text-xs text-muted uppercase">Mail</dt>
          <dd className="truncate font-semibold">{user.email}</dd>
        </dl>
      </div>
      {!loading && (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          {source === REGION_SOURCE.DEFAULT ? 'Región predeterminada' : 'Región detectada'}
          <Chip>{region}</Chip>
        </p>
      )}
    </section>
  );
}
