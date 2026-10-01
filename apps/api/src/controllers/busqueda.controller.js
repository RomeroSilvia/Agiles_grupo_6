import * as busquedaService from '../services/busqueda.service.js';

export async function buscar(req, res) {
  const data = await busquedaService.buscarTitulos(req.validated.query);
  res.json({ data });
}
