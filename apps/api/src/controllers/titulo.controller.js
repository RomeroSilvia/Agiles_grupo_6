import * as tituloService from '../services/titulo.service.js';

export async function obtenerDetalle(req, res) {
  const data = await tituloService.obtenerDetalleTitulo(req.validated.params);
  res.json({ data });
}

export async function obtenerDisponibilidad(req, res) {
  const data = await tituloService.obtenerDisponibilidadTitulo({
    ...req.validated.params,
    region: req.validated.query.region,
  });
  res.json({ data });
}
