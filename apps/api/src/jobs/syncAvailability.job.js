import * as disponibilidadService from '../services/disponibilidad.service.js';

export function syncAvailability() {
  return disponibilidadService.sincronizarDisponibilidad();
}
