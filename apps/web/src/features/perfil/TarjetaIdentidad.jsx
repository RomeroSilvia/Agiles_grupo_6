import { useSession } from '../../contexts/session/SessionContext.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { getRegionLabel } from '../../contexts/region/regionLabel.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Card } from '../../components/ui/Card.jsx';

export function TarjetaIdentidad({ className = '' }) {
  const { user } = useSession();
  const { region, source, loading } = useRegion();

  return (
    <Card as="section" aria-label="Datos de la cuenta" padding="lg" className={className}>
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
    </Card>
  );
}
