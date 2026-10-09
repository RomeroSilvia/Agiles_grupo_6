import * as busquedaPropiasService from '../services/busquedaPropias.service.js';

export async function buscar(req, res) {
  const data = await busquedaPropiasService.buscarTitulosEnPlataformasPropias({
    filtros: req.validated.query,
    usuarioId: req.user.id,
    region: req.region,
  });
  res.json({ data });
}
