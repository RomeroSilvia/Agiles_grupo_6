import * as busquedaService from '../services/busqueda.service.js';

export async function buscar(req, res) {
  const data = await busquedaService.buscarTitulos(req.validated.query);
  res.json({ data });
}

export async function listarGeneros(_req, res) {
  const data = await busquedaService.listarGeneros();
  res.json({ data });
}

export async function buscarPersonas(req, res) {
  const data = await busquedaService.buscarPersonas(req.validated.query);
  res.json({ data });
}
