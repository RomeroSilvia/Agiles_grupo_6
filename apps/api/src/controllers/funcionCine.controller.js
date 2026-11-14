import * as funcionCineService from '../services/funcionCine.service.js';

export async function obtenerFunciones(req, res) {
  const data = await funcionCineService.obtenerFuncionesPelicula({
    ...req.validated.params,
    ...req.validated.query,
  });
  res.json({ data });
}
