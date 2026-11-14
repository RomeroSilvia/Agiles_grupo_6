import * as carteleraService from '../services/cartelera.service.js';

export async function listar(req, res) {
  const data = await carteleraService.listarPeliculasEnCartelera(req.validated.query);
  res.json({ data });
}

export async function listarEstrenos(req, res) {
  const data = await carteleraService.listarProximosEstrenos(req.validated.query);
  res.json({ data });
}
