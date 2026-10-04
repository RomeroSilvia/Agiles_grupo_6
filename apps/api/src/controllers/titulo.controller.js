import * as tituloService from '../services/titulo.service.js';

export async function obtenerDetalle(req, res) {
  const data = await tituloService.obtenerDetalleTitulo(req.validated.params);
  res.json({ data });
}
