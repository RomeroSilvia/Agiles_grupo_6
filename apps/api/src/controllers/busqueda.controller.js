import { REGION_SOURCE } from '@buscador/shared/constants';
import * as busquedaService from '../services/busqueda.service.js';
import * as registroBusquedaService from '../services/registroBusqueda.service.js';

const PRIMERA_PAGINA = 1;

export async function buscar(req, res) {
  const filtros = req.validated.query;
  const data = await busquedaService.buscarTitulos(filtros);
  res.json({ data });

  if (filtros.pagina === PRIMERA_PAGINA) {
    registroBusquedaService
      .registrarBusqueda({
        ...filtros,
        region: req.regionSource === REGION_SOURCE.DEFAULT ? null : req.region,
      })
      .catch((error) => console.error('No se pudo registrar la búsqueda', error));
  }
}

export async function listarGeneros(_req, res) {
  const data = await busquedaService.listarGeneros();
  res.json({ data });
}

export async function buscarPersonas(req, res) {
  const data = await busquedaService.buscarPersonas(req.validated.query);
  res.json({ data });
}

export async function obtenerPersona(req, res) {
  const data = await busquedaService.obtenerPersona({
    id: req.validated.params.id,
    rol: req.validated.query.rol,
  });
  res.json({ data });
}
