import { REGION_SOURCE } from '@buscador/shared/constants';

const REGION_LABELS = Object.freeze({
  [REGION_SOURCE.IP]: 'Región detectada',
  [REGION_SOURCE.PROFILE]: 'Última región detectada',
  [REGION_SOURCE.DEFAULT]: 'Región predeterminada',
});

export function getRegionLabel(source) {
  return REGION_LABELS[source] ?? REGION_LABELS[REGION_SOURCE.DEFAULT];
}
