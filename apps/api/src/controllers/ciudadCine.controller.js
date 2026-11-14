import * as ciudadCineService from '../services/ciudadCine.service.js';

export function listarCiudadesCine(_req, res) {
  const data = ciudadCineService.listarCiudadesCine();
  res.json({ data });
}
