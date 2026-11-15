import * as usuarioAdminService from '../services/usuarioAdmin.service.js';

export async function listarUsuarios(req, res) {
  const data = await usuarioAdminService.listarUsuarios(req.validated.query);
  res.json({ data });
}
