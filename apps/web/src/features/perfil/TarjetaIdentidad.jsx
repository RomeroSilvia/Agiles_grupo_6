import { useSession } from '../../contexts/session/SessionContext.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { getRegionLabel } from '../../contexts/region/regionLabel.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { CARD_CLASS_NAME } from '../../components/ui/surface.js';

export function TarjetaIdentidad({ className = '' }) {
  const { user } = useSession();
  const { region, source, loading } = useRegion();

  return (
    <section aria-label="Datos de la cuenta" className={`${CARD_CLASS_NAME} p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <Avatar email={user.email} className="size-14 text-xl" />
        <dl className="min-w-0">
          <dt className="font-mono text-xs text-muted uppercase">Mail</dt>
          <dd className="truncate font-semibold">{user.email}</dd>
        </dl>
      </div>
      {!loading && (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          {getRegionLabel(source)}
          <Chip>{region}</Chip>
        </p>
      )}
    </section>
  );
}
