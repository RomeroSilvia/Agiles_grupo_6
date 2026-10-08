import * as tituloService from '../services/titulo.service.js';

export async function obtenerDetalle(req, res) {
  const data = await tituloService.obtenerDetalleTitulo(req.validated.params);
  res.json({ data });
}

export async function obtenerDisponibilidad(req, res) {
  const { tipo, tmdbId } = req.validated.params;
  const region = req.validated.query?.region ?? req.region;
  const data = await tituloService.obtenerDisponibilidad({ tipo, tmdbId, region });
  res.json({ data });
}
