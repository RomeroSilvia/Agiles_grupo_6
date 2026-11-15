import * as eventoService from '../services/evento.service.js';

export async function listar(req, res) {
  const data = await eventoService.listarEventos(req.validated.query);
  res.json({ data });
}
