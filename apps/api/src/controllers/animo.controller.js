import * as animoService from '../services/animo.service.js';

export async function buscar(req, res) {
  const data = await animoService.buscarTitulosPorAnimo(req.validated.query);
  res.json({ data });
}

export async function buscarEnPlataformasPropias(req, res) {
  const data = await animoService.buscarTitulosPorAnimoEnPlataformasPropias({
    ...req.validated.query,
    usuarioId: req.user.id,
    region: req.region,
  });
  res.json({ data });
}
