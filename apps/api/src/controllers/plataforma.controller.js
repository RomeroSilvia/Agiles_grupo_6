import * as plataformaService from '../services/plataforma.service.js';

export async function listar(_req, res) {
  const plataformas = await plataformaService.listarPlataformasDisponibles();
  res.json({ data: plataformas });
}

export async function listarPropias(req, res) {
  const plataformaIds = await plataformaService.listarPlataformasPropias(req.user.id);
  res.json({ data: plataformaIds });
}

export async function agregarPropia(req, res) {
  await plataformaService.agregarPlataformaPropia(req.user.id, req.validated.params.plataformaId);
  res.status(204).end();
}

export async function quitarPropia(req, res) {
  await plataformaService.quitarPlataformaPropia(req.user.id, req.validated.params.plataformaId);
  res.status(204).end();
}
