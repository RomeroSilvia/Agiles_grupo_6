import * as metricasService from '../services/metricas.service.js';

export async function obtenerMetricas(req, res) {
  const data = await metricasService.obtenerMetricas(req.validated.query.periodo);
  res.json({ data });
}
