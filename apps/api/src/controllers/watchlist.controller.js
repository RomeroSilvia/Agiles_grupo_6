import * as watchlistService from '../services/watchlist.service.js';

export async function listar(req, res) {
  const data = await watchlistService.listarWatchlist(req.user.id);
  res.json({ data });
}

export async function obtenerEstado(req, res) {
  const data = await watchlistService.obtenerEstadoWatchlist(req.user.id, req.validated.params);
  res.json({ data });
}

export async function agregar(req, res) {
  await watchlistService.agregarAWatchlist(req.user.id, req.validated.params);
  res.status(204).end();
}

export async function quitar(req, res) {
  await watchlistService.quitarDeWatchlist(req.user.id, req.validated.params);
  res.status(204).end();
}
