import { REGION_SOURCE } from '@buscador/shared/constants';

export function getRegionLabel(source) {
  return source === REGION_SOURCE.DEFAULT ? 'Región predeterminada' : 'Región detectada';
}
