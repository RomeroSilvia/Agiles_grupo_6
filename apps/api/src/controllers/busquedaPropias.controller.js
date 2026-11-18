import * as busquedaPropiasService from '../services/busquedaPropias.service.js';
import * as registroBusquedaService from '../services/registroBusqueda.service.js';

export async function buscar(req, res) {
  const filtros = req.validated.query;
  const data = await busquedaPropiasService.buscarTitulosEnPlataformasPropias({
    filtros,
    usuarioId: req.user.id,
    region: req.region,
  });
  res.json({ data });

  registroBusquedaService.registrarBusquedaSinEsperar({
    filtros,
    usuarioId: req.user.id,
    ip: req.ip,
  });
}
